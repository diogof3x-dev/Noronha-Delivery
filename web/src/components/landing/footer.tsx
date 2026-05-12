import Link from "next/link";
import { Mail, MessageCircle, Sparkles } from "lucide-react";

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      width="1em"
      height="1em"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

export function LandingFooter() {
  return (
    <footer id="contato" className="border-t border-border bg-card py-12">
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                <Sparkles className="h-5 w-5" />
              </span>
              <span className="text-base font-semibold tracking-tight">
                Noronha Delivery
              </span>
            </div>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              O super app de Fernando de Noronha. Em construção com apoio da comunidade
              local e da Administração distrital.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Aqui você tem Tudo.</span>
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Para você</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#categorias" className="hover:text-foreground">
                  O que tem no app
                </Link>
              </li>
              <li>
                <Link href="#verde" className="hover:text-foreground">
                  Compromisso verde
                </Link>
              </li>
              <li>
                <Link href="#fila" className="hover:text-foreground">
                  Entrar na fila
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-semibold">Para parceiros</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sou-comercio" className="hover:text-foreground">
                  Sou comércio
                </Link>
              </li>
              <li>
                <Link href="/sou-operador" className="hover:text-foreground">
                  Sou operador
                </Link>
              </li>
              <li>
                <Link href="/sou-motorista" className="hover:text-foreground">
                  Sou motorista
                </Link>
              </li>
              <li>
                <Link href="/sou-pousada" className="hover:text-foreground">
                  Sou pousada
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 md:flex-row md:items-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Noronha Delivery. Em desenvolvimento.
          </p>
          <div className="flex items-center gap-3 text-muted-foreground">
            <a
              href="https://wa.me/5581999999999"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="hover:text-foreground"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href="mailto:contato@noronhadelivery.com.br"
              aria-label="E-mail"
              className="hover:text-foreground"
            >
              <Mail className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com/noronhadelivery.app"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="hover:text-foreground"
            >
              <InstagramIcon className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
