import { redirect } from "next/navigation";
import AdminConsole from "@/components/admin/AdminConsole";
import { auth } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login?callbackUrl=/admin/usuarios");
  }

  if (!session.isAdmin) {
    redirect("/unauthorized");
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7fbfd_0%,#eef4f7_100%)] px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <AdminConsole />
      </div>
    </main>
  );
}
