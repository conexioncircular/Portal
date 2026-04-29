import AdminNewsCreateForm from "@/components/admin/AdminNewsCreateForm";
import { listAdminNewsCommunities } from "@/lib/admin-news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function NewAdminNewsPage() {
  const communities = await listAdminNewsCommunities();

  return <AdminNewsCreateForm communities={communities} />;
}