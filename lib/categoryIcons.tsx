import {
  ShoppingCart, Utensils, Coffee, Beer, Wine, Pizza,
  Car, Fuel, Bus, Bike, Plane, ParkingCircle,
  Home, Building2, Wrench, Lightbulb, Droplet, Wifi, Smartphone, Tv, Laptop,
  HeartPulse, Pill, Dumbbell, Stethoscope, SprayCan, Syringe,
  GraduationCap, BookOpen,
  Gamepad2, Film, Music, Ticket, Dices,
  Shirt, ShoppingBag, Footprints, Gem,
  PawPrint, Gift, Baby,
  Landmark, Banknote, TrendingUp, PiggyBank, CreditCard, Receipt,
  Briefcase, Scissors, Users, HandCoins, HeartHandshake,
  Award, Shield, Milestone,
  Tag,
  ArrowLeftRight, Plus, X, Wallet,
  type LucideIcon,
} from "lucide-react";

interface IconRule {
  keywords: string[];
  icon: LucideIcon;
}

// Regras avaliadas em ordem — a primeira palavra-chave encontrada no nome vence.
// Mais específicas primeiro, para não perder para regras mais genéricas.
const rules: IconRule[] = [
  // Apostas / jogos de azar
  { keywords: ["aposta", "loteria", "cassino", "jogo do bicho", "bet", "raspadinha"], icon: Dices },

  // Empréstimos e financiamentos (relacionado a instituição bancária)
  { keywords: ["emprestimo", "financiamento", "parcela do emprestimo", "consignado"], icon: Landmark },

  // Acessórios (joias, bijuterias)
  { keywords: ["acessorio", "joia", "bijuteria", "cordao", "colar", "anel", "pulseira", "brinco", "relogio"], icon: Gem },

  // Benefícios / premiações
  { keywords: ["beneficio", "premio", "premiacao", "bonus", "gratificacao", "cashback"], icon: Award },

  // Calçados
  { keywords: ["calcado", "sapato", "tenis", "sandalia", "chinelo", "bota", "chuteira"], icon: Footprints },

  // Doações / caridade
  { keywords: ["doacao", "caridade", "dizimo", "ong", "vaquinha"], icon: HeartHandshake },

  // Eletrônicos
  { keywords: ["eletronico", "computador", "notebook", "informatica", "eletrodomestico", "celular novo", "tablet"], icon: Laptop },

  // Higiene pessoal
  { keywords: ["higiene", "shampoo", "condicionador", "sabonete", "creme dental", "pasta de dente", "desodorante", "perfumaria"], icon: SprayCan },

  // Odontologia
  { keywords: ["odontologia", "dentista", "ortodontia", "aparelho dental", "dente"], icon: Syringe },

  // Pedágios
  { keywords: ["pedagio", "praca de pedagio"], icon: Milestone },

  // Seguros
  { keywords: ["seguro de vida", "seguro auto", "seguro residencial", "seguro"], icon: Shield },

  // ── Alimentação ──────────────────────────────────────────
  { keywords: ["mercado", "supermercado", "hortifruti", "feira", "acougue", "hortifruiti"], icon: ShoppingCart },
  { keywords: ["restaurante", "alimentacao", "comida", "lanche", "ifood", "delivery", "almoco", "jantar"], icon: Utensils },
  { keywords: ["cafe", "cafeteria", "padaria"], icon: Coffee },
  { keywords: ["bebida", "chopp", "cerveja", "bar", "balada", "drink"], icon: Beer },
  { keywords: ["vinho", "adega"], icon: Wine },
  { keywords: ["pizza", "pizzaria"], icon: Pizza },

  // ── Transporte ───────────────────────────────────────────
  { keywords: ["combustivel", "gasolina", "posto", "etanol", "alcool"], icon: Fuel },
  { keywords: ["estacionamento", "zona azul"], icon: ParkingCircle },
  { keywords: ["uber", "onibus", "metro", "transporte publico", "taxi", "99"], icon: Bus },
  { keywords: ["bicicleta", "bike"], icon: Bike },
  { keywords: ["carro", "veiculo", "manutencao veicular", "oficina", "revisao", "pneu"], icon: Car },
  { keywords: ["viagem", "passagem", "aereo", "hospedagem", "hotel", "pousada"], icon: Plane },

  // ── Moradia ──────────────────────────────────────────────
  { keywords: ["aluguel", "condominio", "moradia"], icon: Home },
  { keywords: ["imovel", "predio", "obra", "reforma", "construcao"], icon: Building2 },
  { keywords: ["manutencao", "reparo", "conserto", "encanador", "eletricista"], icon: Wrench },
  { keywords: ["energia", "luz", "eletricidade"], icon: Lightbulb },
  { keywords: ["agua", "saneamento", "esgoto"], icon: Droplet },
  { keywords: ["internet", "wifi", "banda larga"], icon: Wifi },
  { keywords: ["telefone", "celular", "fone", "linha movel"], icon: Smartphone },
  { keywords: ["tv", "streaming", "netflix", "assinatura", "prime video", "disney"], icon: Tv },

  // ── Saúde ────────────────────────────────────────────────
  { keywords: ["saude", "medico", "hospital", "consulta", "plano de saude", "convenio"], icon: HeartPulse },
  { keywords: ["farmacia", "remedio", "medicamento"], icon: Pill },
  { keywords: ["academia", "esporte", "ginastica", "musculacao", "personal"], icon: Dumbbell },
  { keywords: ["exame", "clinica", "laboratorio"], icon: Stethoscope },

  // ── Educação / lazer ─────────────────────────────────────
  { keywords: ["educacao", "faculdade", "curso", "escola", "universidade", "mensalidade"], icon: GraduationCap },
  { keywords: ["livro", "livraria", "material escolar"], icon: BookOpen },
  { keywords: ["jogo", "game", "videogame"], icon: Gamepad2 },
  { keywords: ["cinema", "filme"], icon: Film },
  { keywords: ["musica", "show", "instrumento"], icon: Music },
  { keywords: ["lazer", "ingresso", "evento", "passeio", "parque"], icon: Ticket },

  // ── Vestuário / compras ──────────────────────────────────
  { keywords: ["roupa", "vestuario", "moda"], icon: Shirt },
  { keywords: ["loja", "shopping", "compras"], icon: ShoppingBag },

  // ── Pessoas / família ────────────────────────────────────
  { keywords: ["pet", "cachorro", "gato", "veterinario", "racao"], icon: PawPrint },
  { keywords: ["presente", "aniversario"], icon: Gift },
  { keywords: ["filho", "crianca", "bebe", "infantil"], icon: Baby },
  { keywords: ["familia", "social", "amigos"], icon: Users },
  { keywords: ["cabelo", "salao de beleza", "estetica", "barbeiro", "manicure"], icon: Scissors },

  // ── Financeiro ───────────────────────────────────────────
  { keywords: ["investimento", "aplicacao", "renda fixa", "acoes", "bolsa", "tesouro"], icon: Landmark },
  { keywords: ["poupanca", "reserva de emergencia"], icon: PiggyBank },
  { keywords: ["salario", "pagamento", "pro-labore", "prolabore", "holerite"], icon: Banknote },
  { keywords: ["receita", "venda", "faturamento", "honorario"], icon: TrendingUp },
  { keywords: ["cartao", "fatura", "anuidade"], icon: CreditCard },
  { keywords: ["imposto", "taxa", "tributo", "irpj", "iss", "das", "inss", "csll"], icon: Receipt },
  { keywords: ["trabalho", "servico", "freelance", "consultoria", "projeto"], icon: Briefcase },

  // ── Genérico ─────────────────────────────────────────────
  { keywords: ["outros", "diversos", "dinheiro"], icon: HandCoins },
];

function normalizeWord(word: string): string {
  return word.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// Stemmer bem simples para lidar com plurais em português
// (ex: "viagens" -> "viagem", "cartões" -> "cartao", "impostos" -> "imposto")
// de forma que a regra (singular) case também com o plural digitado pelo usuário.
function stemWord(word: string): string {
  if (word.length <= 3) return word;
  if (word.endsWith("oes") || word.endsWith("aes")) return word.slice(0, -3) + "ao";
  if (word.endsWith("ns")) return word.slice(0, -2) + "m";
  if (word.endsWith("res")) return word.slice(0, -3) + "r";
  if (word.endsWith("s") && !word.endsWith("ss")) return word.slice(0, -1);
  return word;
}

function normalize(str: string): string {
  return normalizeWord(str || "")
    .split(/\s+/)
    .map(stemWord)
    .join(" ")
    .trim();
}

/**
 * Retorna o ícone (lucide-react) mais relacionado ao nome da categoria,
 * com base em correspondência de palavras-chave (com suporte a plural).
 * Cai para um ícone genérico (Tag) quando nenhuma regra corresponde.
 */
const customIcons: Record<string, LucideIcon> = {
  Tag, ShoppingCart, Utensils, Home, Car, HeartPulse, Briefcase, Banknote,
  CreditCard, Receipt, Gift, Plane, Dumbbell, Wallet, Smartphone, Film,
  GraduationCap, PawPrint, PiggyBank, Landmark, Music, Coffee, Beer, Wine,
  Pizza, Fuel, Bus, Bike, ParkingCircle, Building2, Wrench, Lightbulb,
  Droplet, Wifi, Tv, Laptop, Pill, Stethoscope, SprayCan, Syringe,
  BookOpen, Gamepad2, Ticket, Dices, Shirt, ShoppingBag, Footprints, Gem,
  Baby, Scissors, Users, HandCoins, HeartHandshake, Award, Shield, Milestone,
};

export function getCategoryIcon(nome: string, icone?: string | null): LucideIcon {
  if (icone && customIcons[icone]) return customIcons[icone];
  const n = normalize(nome || "");
  for (const rule of rules) {
    if (rule.keywords.some((k) => n.includes(normalize(k)))) {
      return rule.icon;
    }
  }
  return Tag;
}
