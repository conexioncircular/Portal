import Link from "next/link";
import { MapPinned, PenSquare, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listAdminCommunities } from "@/lib/admin-communities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminCommunitiesPage() {
  const items = await listAdminCommunities();

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <MapPinned className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">Listado de comunidades</h2>
            <p className="mt-2 text-sm text-slate-600">
              Revisa el estado de cada comunidad y edita su informacion base y logo.
            </p>
          </div>
        </div>

        <Button asChild className="rounded-full bg-slate-950 hover:bg-slate-800">
          <Link href="/admin/comunidades/nueva">
            <Plus className="h-4 w-4" />
            Crear comunidad
          </Link>
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[1.5rem] border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
          Todavia no hay comunidades registradas.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[1.5rem] border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Comunidad</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Region</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Tramo</th>
                <th className="px-4 py-3 font-medium text-right">Accion</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {items.map((item) => (
                <tr key={item.communityId} className="align-top">
                  <td className="px-4 py-4">
                    <div className="font-medium text-slate-900">{item.name}</div>
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                        item.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {item.isActive ? "Activa" : "Inactiva"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{item.region ?? "-"}</td>
                  <td className="px-4 py-4 text-slate-600">{item.tipo ?? "-"}</td>
                  <td className="px-4 py-4 text-slate-600">{item.tramo ?? "-"}</td>
                  <td className="px-4 py-4 text-right">
                    <Button asChild type="button" variant="outline" size="sm" className="rounded-full border-slate-200">
                      <Link href={`/admin/comunidades/${item.communityId}`}>
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
