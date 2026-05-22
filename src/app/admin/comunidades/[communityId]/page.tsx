import { notFound } from "next/navigation";
import AdminCommunityForm from "@/components/admin/AdminCommunityForm";
import { getAdminCommunityById } from "@/lib/admin-communities";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ communityId: string }>;
};

export default async function EditAdminCommunityPage({ params }: PageProps) {
  const { communityId } = await params;
  const item = await getAdminCommunityById(communityId);

  if (!item) {
    notFound();
  }

  return (
    <AdminCommunityForm
      mode="edit"
      initialValues={{
        communityId: item.communityId,
        name: item.name,
        slug: item.slug,
        isActive: item.isActive,
        region: item.region,
        localidad: item.localidad,
        tipo: item.tipo,
        tramo: item.tramo,
        path: item.path,
        logoUrl: item.logoUrl,
      }}
    />
  );
}
