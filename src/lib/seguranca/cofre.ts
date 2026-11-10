import 'server-only';
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';
function obterChave() {
  const segredo = process.env.COFRE_CHAVE_CRIPTOGRAFIA;
  const chave = Buffer.from(segredo ?? '', 'base64');
  if (chave.length !== 32) throw new Error('COFRE_CHAVE_CRIPTOGRAFIA deve conter 32 bytes em Base64.');
  return chave;
}
export function criptografarCredencial(conteudo: string) {
  const vetor = randomBytes(12);
  const cifra = createCipheriv('aes-256-gcm',obterChave(),vetor);
  const cifrado = Buffer.concat([cifra.update(conteudo,'utf8'),cifra.final()]);
  return JSON.stringify({ versao: 1, vetor: vetor.toString('base64'), autenticacao: cifra.getAuthTag().toString('base64'), conteudo: cifrado.toString('base64') });
}
export function descriptografarCredencial(texto: string) {
  const registro = JSON.parse(texto) as {versao:number;vetor:string;autenticacao:string;conteudo:string};
  if (registro.versao !== 1) throw new Error('Versão de criptografia incompatível.');
  const decifra = createDecipheriv('aes-256-gcm', obterChave(), Buffer.from(registro.vetor,'base64'));
  decifra.setAuthTag(Buffer.from(registro.autenticacao,'base64'));
  return Buffer.concat([decifra.update(Buffer.from(registro.conteudo,'base64')),decifra.final()]).toString('utf8');
}
