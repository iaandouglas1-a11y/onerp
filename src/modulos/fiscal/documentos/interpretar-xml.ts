/** Interpretação conservadora de XML fiscais. O parser não substitui validação por XSD
 * ou consulta de autenticidade no órgão emissor. Nunca executa entidades externas. */
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export type DocumentoInterpretado = {
  tipo_documento:'NFE'|'NFCE'|'NFSE'|'CTE'|'OUTRO';
  chave_acesso:string|null;
  numero_documento:string|null;
  data_emissao:string|null;
  cpf_cnpj_emitente:string|null;
  cpf_cnpj_destinatario:string|null;
  valor_total:number|null;
  validacao:'ESTRUTURA_RECONHECIDA'|'SEM_PROTOCOLO'|'XML_GENERICO';
  metadados_originais:Record<string,string|number|null>;
};
type No=Record<string,unknown>;
const objeto=(valor:unknown):No=>valor&&typeof valor==='object'&&!Array.isArray(valor)?valor as No:{};
const pegar=(origem:unknown,...chaves:string[]):unknown=>chaves.reduce((valor,chave)=>objeto(valor)[chave],origem);
const texto=(valor:unknown)=>typeof valor==='string'||typeof valor==='number'?String(valor).trim():'';
const doc=(origem:unknown)=>texto(pegar(origem,'CNPJ'))||texto(pegar(origem,'CPF'))||null;
const normalizarData=(valor:unknown)=>{const dado=texto(valor);return /^\d{4}-\d{2}-\d{2}/.test(dado)?dado.slice(0,10):null;};
const numerico=(valor:unknown)=>{const dado=Number(texto(valor));return Number.isFinite(dado)&&dado>=0?Math.round(dado*100)/100:null;};
const chave=(valor:unknown)=>{const dado=texto(valor).replace(/^NFe|^CTe/,'');return /^\d{44}$/.test(dado)?dado:null;};

export function interpretarDocumentoFiscal(xml:string,tipoGenerico?:string):DocumentoInterpretado {
  if(xml.length>6_000_000)throw new Error('Arquivo XML acima do limite de 5 MB.');
  if(/<!\s*(DOCTYPE|ENTITY)\b/i.test(xml))throw new Error('XML com entidades ou DTD não é aceito.');
  const resultado=XMLValidator.validate(xml);
  if(resultado!==true)throw new Error('XML malformado. Confira o arquivo de origem.');
  const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',removeNSPrefix:true,parseTagValue:false,parseAttributeValue:false,processEntities:false,allowBooleanAttributes:false});
  const raiz=objeto(parser.parse(xml));
  const nfe=pegar(raiz,'nfeProc','NFe')??pegar(raiz,'NFe');
  if(nfe){
    const inf=pegar(nfe,'infNFe');const ide=pegar(inf,'ide');
    const modelo=texto(pegar(ide,'mod'));
    if(!['55','65'].includes(modelo))throw new Error('Modelo de NF-e/NFC-e não reconhecido.');
    const protocolo=pegar(raiz,'nfeProc','protNFe','infProt','cStat');
    const identidade=chave(pegar(inf,'@_Id'))??chave(pegar(raiz,'nfeProc','protNFe','infProt','chNFe'));
    return {tipo_documento:modelo==='65'?'NFCE':'NFE',chave_acesso:identidade,
      numero_documento:texto(pegar(ide,'nNF'))||null,data_emissao:normalizarData(pegar(ide,'dhEmi')??pegar(ide,'dEmi')),
      cpf_cnpj_emitente:doc(pegar(inf,'emit')),cpf_cnpj_destinatario:doc(pegar(inf,'dest')),
      valor_total:numerico(pegar(inf,'total','ICMSTot','vNF')),
      validacao:protocolo===undefined?'SEM_PROTOCOLO':'ESTRUTURA_RECONHECIDA',
      metadados_originais:{modelo,serie:texto(pegar(ide,'serie')),status_protocolo:texto(protocolo)||null}};
  }
  const cte=pegar(raiz,'cteProc','CTe')??pegar(raiz,'CTe');
  if(cte){
    const inf=pegar(cte,'infCte');const ide=pegar(inf,'ide');const protocolo=pegar(raiz,'cteProc','protCTe','infProt','cStat');
    const tomador=pegar(inf,'dest')??pegar(inf,'toma4')??pegar(inf,'rem');
    return {tipo_documento:'CTE',chave_acesso:chave(pegar(inf,'@_Id'))??chave(pegar(raiz,'cteProc','protCTe','infProt','chCTe')),
      numero_documento:texto(pegar(ide,'nCT'))||null,data_emissao:normalizarData(pegar(ide,'dhEmi')),
      cpf_cnpj_emitente:doc(pegar(inf,'emit')),cpf_cnpj_destinatario:doc(tomador),valor_total:numerico(pegar(inf,'vPrest','vTPrest')),
      validacao:protocolo===undefined?'SEM_PROTOCOLO':'ESTRUTURA_RECONHECIDA',
      metadados_originais:{modelo:texto(pegar(ide,'mod')),status_protocolo:texto(protocolo)||null}};
  }
  // NFS-e padrão nacional: NFSe > infNFSe; provedores municipais legados: CompNfse > Nfse > InfNfse.
  const nfse=pegar(raiz,'NFSe','infNFSe')??pegar(raiz,'nfseProc','NFSe','infNFSe')??
    pegar(raiz,'CompNfse','Nfse','InfNfse')??pegar(raiz,'Nfse','InfNfse');
  if(nfse){
    const nacional=pegar(nfse,'DPS','infDPS');
    const prestador=pegar(nacional,'prest')??pegar(nfse,'PrestadorServico','IdentificacaoPrestador')??pegar(nfse,'emit');
    const tomador=pegar(nacional,'toma')??pegar(nfse,'TomadorServico','IdentificacaoTomador')??pegar(nfse,'toma');
    const valores=pegar(nfse,'Servico','Valores');
    return {tipo_documento:'NFSE',chave_acesso:null,numero_documento:texto(pegar(nfse,'nNFSe')??pegar(nfse,'Numero'))||null,
      data_emissao:normalizarData(pegar(nfse,'dhProc')??pegar(nfse,'dhEmi')??pegar(nfse,'DataEmissao')),
      cpf_cnpj_emitente:doc(prestador)??doc(pegar(nfse,'emit')),cpf_cnpj_destinatario:doc(tomador),
      valor_total:numerico(pegar(nfse,'valores','vLiq')??pegar(nfse,'valores','vServPrest')??pegar(valores,'ValorServicos')),
      validacao:'ESTRUTURA_RECONHECIDA',metadados_originais:{padrao:'NFS-e nacional ou municipal',identificador:texto(pegar(nfse,'@_Id'))||null}};
  }
  if(tipoGenerico==='TC')return {tipo_documento:'OUTRO',chave_acesso:null,numero_documento:null,data_emissao:null,cpf_cnpj_emitente:null,
    cpf_cnpj_destinatario:null,valor_total:null,validacao:'XML_GENERICO',metadados_originais:{tipo_declarado:'TC',aviso:'Leiaute não identificado; conferência manual obrigatória'}};
  throw new Error('XML não reconhecido como NF-e, NFC-e, NFS-e ou CT-e. Para documento TC, escolha o tipo genérico com conferência manual.');
}
