import { login, signup } from "@/app/(auth)/actions";
import { Button, Input } from "@/components/ui";
import { ArrowRight } from "lucide-react";
import { OnfinLogo } from "@/components/OnfinLogo";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;

  return (
    <main className="min-h-screen bg-bg flex flex-col justify-center px-7 py-10">
      <div className="w-full max-w-sm mx-auto">
        {/* Marca — logo centralizado, sem cards decorativos competindo com o formulário */}
        <div className="flex flex-col items-center mb-10">
          <OnfinLogo variant="stacked" className="h-28 w-auto mb-4" title="Onfin" />
          <h1 className="sr-only">Onfin</h1>
          <p className="text-sm text-ink-secondary">Gestão financeira &amp; contábil</p>
        </div>

        {params.error && (
          <div className="mb-5 p-3.5 rounded-xl bg-danger/[0.12] border border-danger/25 flex items-start gap-2.5">
            <div className="h-4 w-4 rounded-full bg-danger/25 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-[#f87171] text-[11px] font-semibold">!</span>
            </div>
            <p className="text-[13px] text-[#f87171]">{params.error}</p>
          </div>
        )}

        <form className="space-y-5">
          <div>
            <label className="text-[11px] font-semibold text-ink-tertiary mb-1.5 block">
              E-mail
            </label>
            <Input name="email" type="email" placeholder="seu@email.com" required className="h-12 text-[15px]" />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-ink-tertiary mb-1.5 block">
              Senha
            </label>
            <Input name="password" type="password" placeholder="••••••••" minLength={6} required className="h-12 text-[15px]" />
          </div>

          <Button
            formAction={login}
            className="w-full h-[52px] text-[15px] font-semibold mt-2 flex items-center justify-center gap-2 rounded-2xl"
          >
            Entrar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-surface-border/60" />
          <span className="text-[11px] text-ink-tertiary font-medium">ou</span>
          <div className="flex-1 h-px bg-surface-border/60" />
        </div>

        <form>
          <button
            formAction={signup}
            className="w-full h-[52px] rounded-2xl border border-surface-border text-ink-secondary font-semibold hover:bg-surface-2/50 hover:text-ink-primary transition-all duration-200 text-[15px]"
          >
            Criar nova conta
          </button>
        </form>

        <p className="text-center text-[11px] text-ink-tertiary mt-7">
          Ao entrar, você concorda com nossos termos de serviço
        </p>
      </div>
    </main>
  );
}
