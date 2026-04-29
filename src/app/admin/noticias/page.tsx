import Link from "next/link";
import { Newspaper, PenSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAdminNews } from "@/lib/admin-news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function formatDateTime(value: Date | null): string {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-CL", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

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

      {items.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Todavia no hay noticias creadas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Comunidad</th>
                <th className="px-4 py-3 font-medium">Titulo</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Publica</th>
                <th className="px-4 py-3 font-medium">Destacada</th>
                <th className="px-4 py-3 font-medium">Fecha de publicacion</th>
                <th className="px-4 py-3 font-medium text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((item) => (
                <tr key={item.newsId} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{item.communityName}</div>
                    <div className="text-xs text-slate-500">{item.communitySlug}</div>
                  </td>
                  <td className="px-4 py-4 font-medium text-slate-900">{item.title}</td>
                  <td className="px-4 py-4 text-slate-600">{item.slug}</td>
                  <td className="px-4 py-4">{item.isPublic ? "Si" : "No"}</td>
                  <td className="px-4 py-4">{item.isFeatured ? "Si" : "No"}</td>
                  <td className="px-4 py-4 text-slate-600">{formatDateTime(item.publishedAt ?? item.createdAt)}</td>
                  <td className="px-4 py-4 text-right">
                    <Button asChild type="button" variant="outline" size="sm" className="rounded-full border-slate-200">
                      <Link href={`/admin/noticias/${item.newsId}`}>
                        <PenSquare className="h-4 w-4" />
                        Editar
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}