import Link from "next/link";
import { Newspaper, Plus } from "lucide-react";
import AdminNewsList from "@/components/admin/AdminNewsList";
import { Button } from "@/components/ui/button";
import { listAdminNews } from "@/lib/admin-news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminNewsPage() {
  const items = await listAdminNews();

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-700">
            <Newspaper className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Listado de noticias</h2>
            <p className="mt-2 text-sm text-slate-600">Administra noticias por comunidad y revisa su estado de publicación.</p>
          </div>
        </div>

        <Button asChild className="rounded-full bg-slate-950 hover:bg-slate-800">
          <Link href="/admin/noticias/nueva">
            <Plus className="h-4 w-4" />
            Crear noticia
          </Link>
        </Button>
      </div>

      <AdminNewsList items={items} />
    </section>
  );
}
