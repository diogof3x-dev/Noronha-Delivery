import { redirect } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server-client";
import { signOut } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";

export default async function AppHome() {
  const supabase = await getServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/entrar");

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold">Olá, {user.email}</h1>
      <p className="mt-2 text-muted-foreground">
        Você está autenticado. Em breve montamos o shell completo aqui (bottom tabs, home com
        categorias, etc.).
      </p>
      <form action={signOut} className="mt-6">
        <Button variant="outline" type="submit">
          Sair
        </Button>
      </form>
    </main>
  );
}
