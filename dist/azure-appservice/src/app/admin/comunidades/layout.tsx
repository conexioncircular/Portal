import Link from "next/link";
import { redirect } from "next/navigation";
import { MapPinned, Newspaper, Plus, Shield, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCommunitiesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/comunidades");
  }

  if (!session.isAdmin) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfd_0%,#eef4f7_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f3fbff_36%,#eef3f7_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr] lg:p-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                <Shield className="h-4 w-4" />
                Admin comunidades
              </div>
              <h1 className="mt-5 text-3xl font-semibold leading-tight text-slate-950 lg:text-4xl">
                Comunidades
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-slate-600">
                Crea comunidades, actualiza sus datos base y administra el logo usado en sus páginas.
              </p>
            </div>

            <div className="flex flex-wrap items-start justify-start gap-3 lg:justify-end">
              <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white">
                <Link href="/admin">Volver al admin</Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white">
                <Link href="/admin/usuarios">
                  <Users className="h-4 w-4" />
                  Usuarios
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white">
                <Link href="/admin/noticias">
                  <Newspaper className="h-4 w-4" />
                  Noticias
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white">
                <Link href="/admin/comunidades">
                  <MapPinned className="h-4 w-4" />
                  Listado
                </Link>
              </Button>
              <Button asChild className="rounded-full bg-slate-950 hover:bg-slate-800">
                <Link href="/admin/comunidades/nueva">
                  <Plus className="h-4 w-4" />
                  Crear comunidad
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {children}
      </div>
    </main>
  );
}
