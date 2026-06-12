import Link from "next/link";
import { ArrowLeft, MapPinned, Plus } from "lucide-react";
import AdminCommunityList from "@/components/admin/AdminCommunityList";
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
              Revisa el estado de cada comunidad y edita su información base y logo.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline" className="rounded-full border-slate-200 bg-white">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4" />
              Volver al admin
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

      <AdminCommunityList items={items} />
    </section>
  );
}
