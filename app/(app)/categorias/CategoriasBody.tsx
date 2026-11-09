"use client";

import { SplitLayout } from "@/components/SplitLayout";
import { useState } from "react";
import {
  Plus, X, ChevronDown, ChevronUp, Trash2, FolderOpen, Pencil, Check,
  Tag, ShoppingCart, Utensils, Home, Car, HeartPulse, Briefcase, Banknote,
  CreditCard, Receipt, Gift, Plane, Dumbbell, Wallet, Smartphone, Film,
  GraduationCap, PawPrint, PiggyBank, Landmark, Music, Coffee, Beer, Wine,
  Pizza, Fuel, Bus, Bike, ParkingCircle, Building2, Wrench, Lightbulb,
  Droplet, Wifi, Tv, Laptop, Pill, Stethoscope, SprayCan, Syringe,
  BookOpen, Gamepad2, Ticket, Dices, Shirt, ShoppingBag, Footprints, Gem,
  Baby, Scissors, Users, HandCoins, HeartHandshake, Award, Shield, Milestone,
  LucideIcon,
} from "lucide-react";
import { Card, FormGroup, Input, Select, IconChip, EmptyState } from "@/components/ui";
import { saveCategoria, editCategoria, deleteCategoria } from "@/app/(app)/actions";
import { getCategoryIcon } from "@/lib/categoryIcons";
import type { Categoria } from "@/types/database";

interface CategoriaComIcone extends Categoria { icone?: string | null }
interface Props { despesas: CategoriaComIcone[]; receitas: CategoriaComIcone[] }

type IconOption = { name: string; icon: LucideIcon };
const ICON_OPTIONS: IconOption[] = [
  { name: "Tag", icon: Tag }, { name: "ShoppingCart", icon: ShoppingCart },
  { name: "Utensils", icon: Utensils }, { name: "Home", icon: Home },
  { name: "Car", icon: Car }, { name: "HeartPulse", icon: HeartPulse },
  { name: "Briefcase", icon: Briefcase }, { name: "Banknote", icon: Banknote },
  { name: "CreditCard", icon: CreditCard }, { name: "Receipt", icon: Receipt },
  { name: "Gift", icon: Gift }, { name: "Plane", icon: Plane },
  { name: "Dumbbell", icon: Dumbbell }, { name: "Wallet", icon: Wallet },
  { name: "Smartphone", icon: Smartphone }, { name: "Film", icon: Film },
  { name: "GraduationCap", icon: GraduationCap }, { name: "PawPrint", icon: PawPrint },
  { name: "PiggyBank", icon: PiggyBank }, { name: "Landmark", icon: Landmark },
  { name: "Music", icon: Music }, { name: "Coffee", icon: Coffee },
  { name: "Beer", icon: Beer }, { name: "Wine", icon: Wine },
  { name: "Pizza", icon: Pizza }, { name: "Fuel", icon: Fuel },
  { name: "Bus", icon: Bus }, { name: "Bike", icon: Bike },
  { name: "ParkingCircle", icon: ParkingCircle }, { name: "Building2", icon: Building2 },
  { name: "Wrench", icon: Wrench }, { name: "Lightbulb", icon: Lightbulb },
  { name: "Droplet", icon: Droplet }, { name: "Wifi", icon: Wifi },
  { name: "Tv", icon: Tv }, { name: "Laptop", icon: Laptop },
  { name: "Pill", icon: Pill }, { name: "Stethoscope", icon: Stethoscope },
  { name: "SprayCan", icon: SprayCan }, { name: "Syringe", icon: Syringe },
  { name: "BookOpen", icon: BookOpen }, { name: "Gamepad2", icon: Gamepad2 },
  { name: "Ticket", icon: Ticket }, { name: "Dices", icon: Dices },
  { name: "Shirt", icon: Shirt }, { name: "ShoppingBag", icon: ShoppingBag },
  { name: "Footprints", icon: Footprints }, { name: "Gem", icon: Gem },
  { name: "Baby", icon: Baby }, { name: "Scissors", icon: Scissors },
  { name: "Users", icon: Users }, { name: "HandCoins", icon: HandCoins },
  { name: "HeartHandshake", icon: HeartHandshake }, { name: "Award", icon: Award },
  { name: "Shield", icon: Shield }, { name: "Milestone", icon: Milestone },
];
const ICON_BY_NAME = Object.fromEntries(ICON_OPTIONS.map((option) => [option.name, option.icon])) as Record<string, LucideIcon>;

function CategoryIcon({ categoria }: { categoria: CategoriaComIcone }) {
  return categoria.icone && ICON_BY_NAME[categoria.icone]
    ? ICON_BY_NAME[categoria.icone]
    : getCategoryIcon(categoria.nome);
}

function IconPicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div className="grid grid-cols-7 gap-1.5 rounded-xl bg-[#0A0A0A]/40 p-2">
      {ICON_OPTIONS.map(({ name, icon: Icon }) => (
        <button
          key={name}
          type="button"
          title={name}
          aria-label={`Ícone ${name}`}
          onClick={() => onChange(name)}
          className={`h-9 rounded-lg flex items-center justify-center transition-colors ${value === name ? "bg-[#5DA832] text-[#0A0A0A]" : "text-[#94A3B8] hover:bg-surface-2 hover:text-white"}`}
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}

function CategoriaRow({ categoria, tone }: { categoria: CategoriaComIcone; tone: "green" | "red" }) {
  const [editando, setEditando] = useState(false);
  const [icone, setIcone] = useState(categoria.icone || "Tag");
  const Icon = CategoryIcon({ categoria });

  if (editando) {
    return (
      <div className="px-3.5 py-3 border-t border-surface-border/40 bg-surface-2/20">
        <form action={async (formData) => { await editCategoria(formData); setEditando(false); }} className="space-y-2.5">
          <input type="hidden" name="id" value={categoria.id} />
          <FormGroup label="Nome">
            <Input name="nome" defaultValue={categoria.nome} required className="text-sm" />
          </FormGroup>
          <input type="hidden" name="icone" value={icone} />
          <FormGroup label="Ícone">
            <IconPicker value={icone} onChange={setIcone} />
          </FormGroup>
          <div className="flex gap-2">
            <button type="submit" className="flex-1 h-9 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] text-[#0A0A0A] text-xs font-semibold"><Check className="h-3.5 w-3.5" />Salvar</button>
            <button type="button" onClick={() => setEditando(false)} className="h-9 px-3 inline-flex items-center justify-center rounded-xl border border-surface-border/60 text-slate-400 text-xs"><X className="h-3.5 w-3.5" /></button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-3.5 py-3 border-t border-surface-border/40 first:border-t-0 hover:bg-surface-2/20 transition group">
      <div className="flex items-center gap-3 min-w-0">
        <IconChip icon={Icon} tone={tone} size={34} iconSize={15} />
        <span className="text-[13.5px] font-medium text-ink-primary truncate">{categoria.nome}</span>
      </div>
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => setEditando(true)} className="p-1.5 text-slate-600 hover:text-[#5DA832] rounded transition-colors" title="Editar categoria"><Pencil className="h-3.5 w-3.5" /></button>
        <form action={deleteCategoria}>
          <input type="hidden" name="id" value={categoria.id} />
          <button type="submit" className="p-1.5 text-slate-600 hover:text-rose-400 opacity-80 hover:opacity-100 transition-opacity" title="Excluir"><Trash2 className="h-3.5 w-3.5" /></button>
        </form>
      </div>
    </div>
  );
}

function CategoriaGroup({ label, tone, categorias, defaultOpen }: { label: string; tone: "green" | "red"; categorias: CategoriaComIcone[]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const count = categorias.length;
  return (
    <Card className="p-0 overflow-hidden">
      <button type="button" onClick={() => setOpen((v) => !v)} className={`w-full flex items-center justify-between px-4 py-3.5 text-left ${open ? "border-b border-surface-border/50" : ""}`}>
        <div><h2 className="text-[15px] font-semibold text-white">{label}</h2><p className="text-xs text-ink-tertiary mt-1">{count} {count === 1 ? "categoria" : "categorias"}</p></div>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-500 shrink-0" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500 shrink-0" />}
      </button>
      {open && (categorias.length === 0 ? <div className="px-4 pb-4 pt-3"><p className="text-xs text-slate-500">Nenhuma categoria de {label.toLowerCase()} ainda.</p></div> : <div>{categorias.map((cat) => <CategoriaRow key={cat.id} categoria={cat} tone={tone} />)}</div>)}
    </Card>
  );
}

export default function CategoriasBody({ despesas, receitas }: Props) {
  const [painelAberto, setPainelAberto] = useState(false);
  const [novoIcone, setNovoIcone] = useState("Tag");
  const total = despesas.length + receitas.length;
  return (
<SplitLayout className="onfin-module-categorias" aside={<>
      <button type="button" onClick={() => setPainelAberto((v) => !v)} className={`w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold border transition-all duration-200 ${painelAberto ? "bg-[#5DA832]/15 border-[#5DA832]/40 text-[#8FCB5E]" : "bg-surface border-surface-border/60 text-ink-secondary hover:text-ink-primary"}`}><Plus className="h-3.5 w-3.5" />Nova categoria</button>
      {painelAberto && <div className="border border-[#5DA832]/30 rounded-xl p-4 bg-[#5DA832]/5 space-y-2">
        <div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[#5DA832] font-semibold text-xs"><Plus className="h-4 w-4" /><span>Nova categoria</span></div><button type="button" onClick={() => setPainelAberto(false)} className="md:hidden p-1 text-slate-500 hover:text-slate-300 rounded"><X className="h-4 w-4" /></button></div>
        <form action={async (formData) => { await saveCategoria(formData); setPainelAberto(false); }} className="space-y-2">
          <FormGroup label="Nome"><Input name="nome" required placeholder="Ex: Assinaturas" className="text-sm" /></FormGroup>
          <FormGroup label="Tipo"><Select name="tipo" required defaultValue="" className="text-sm"><option value="" disabled>Selecione...</option><option value="despesa">Despesa</option><option value="receita">Receita</option></Select></FormGroup>
          <input type="hidden" name="icone" value={novoIcone} /><FormGroup label="Ícone"><IconPicker value={novoIcone} onChange={setNovoIcone} /></FormGroup>
          <button type="submit" className="w-full h-11 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#5DA832] hover:bg-[#6fc23b] text-[#0A0A0A] text-sm font-semibold"><Plus className="h-4 w-4" />Adicionar</button>
        </form>
      </div>}
</>}>
      {total === 0 ? <Card className="p-0 overflow-hidden"><EmptyState icon={<FolderOpen className="h-10 w-10" />} title="Nenhuma categoria cadastrada" description="Crie sua primeira categoria para organizar suas movimentações" /></Card> : <div className="onfin-module-two-col"><CategoriaGroup label="Despesas" tone="red" categorias={despesas} defaultOpen /><CategoriaGroup label="Receitas" tone="green" categorias={receitas} defaultOpen /></div>}
    </SplitLayout>
  );
}
