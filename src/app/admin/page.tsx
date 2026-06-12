import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, MapPinned, Newspaper, Shield, Users } from "lucide-react";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin");
  }

  if (!session.isAdmin) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfd_0%,#eef4f7_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,#ffffff_0%,#f3fbff_36%,#eef3f7_100%)] shadow-[0_28px_80px_rgba(15,23,42,0.08)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr] lg:p-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">
                <Shield className="h-4 w-4" />
                Panel admin
              </div>

              <h1 className="mt-5 max-w-3xl text-3xl font-semibold leading-tight text-slate-950 lg:text-4xl">
                Administracion
              </h1>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-slate-500">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Usuarios</span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-slate-500">
                  <Newspaper className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Noticias</span>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-white/70 bg-white/80 p-5 backdrop-blur">
                <div className="flex items-center gap-2 text-slate-500">
                  <MapPinned className="h-4 w-4" />
                  <span className="text-xs font-semibold uppercase tracking-[0.18em]">Comunidades</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Link
            href="/admin/usuarios"
            className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_30px_80px_rgba(15,23,42,0.1)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-sky-100 text-sky-700">
              <Users className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">
              Gestión de usuarios
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Consola dedicada para crear usuarios, editar perfiles, actualizar contraseñas y asignar accesos al portal.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-slate-800">
                Ir a usuarios
                <ArrowRight className="h-4 w-4" />
              </span>
              <span className="text-sm text-slate-500">
                Gestión interna de cuentas.
              </span>
            </div>
          </Link>

          <Link
            href="/admin/noticias"
            className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_30px_80px_rgba(15,23,42,0.1)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-emerald-100 text-emerald-700">
              <Newspaper className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">
              Gestión de noticias
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Espacio editorial para revisar el listado, crear noticias nuevas y editar imágenes almacenadas en Azure Blob Storage.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-slate-800">
                Ir a noticias
                <ArrowRight className="h-4 w-4" />
              </span>
              <span className="text-sm text-slate-500">
                Gestión de contenido público.
              </span>
            </div>
          </Link>

          <Link
            href="/admin/comunidades"
            className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_30px_80px_rgba(15,23,42,0.1)]"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-amber-100 text-amber-700">
              <MapPinned className="h-6 w-6" />
            </div>
            <h2 className="mt-5 text-2xl font-semibold text-slate-950">
              Gestión de comunidades
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-600">
              Alta y edición de comunidades, estado activo y logo asociado a cada página.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-medium text-white transition group-hover:bg-slate-800">
                Ir a comunidades
                <ArrowRight className="h-4 w-4" />
              </span>
              <span className="text-sm text-slate-500">
                Gestión territorial.
              </span>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}
