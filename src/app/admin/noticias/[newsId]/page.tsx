import { notFound } from "next/navigation";
import AdminNewsCreateForm from "@/components/admin/AdminNewsCreateForm";
import { getAdminNewsById, listAdminNewsCommunities } from "@/lib/admin-news";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ newsId: string }>;
};

export default async function EditAdminNewsPage({ params }: PageProps) {
  const { newsId } = await params;
  const [communities, item] = await Promise.all([
    listAdminNewsCommunities(),
    getAdminNewsById(newsId),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <AdminNewsCreateForm
      communities={communities}
      mode="edit"
      initialValues={{
        newsId: item.newsId,
        communityId: item.communityId,
        title: item.title,
        slug: item.slug,
        summary: item.summary,
        bodyHtml: item.bodyHtml,
        imageUrl: item.imageUrl ?? "",
        isFeatured: item.isFeatured,
        isPublic: item.isPublic,
        sortOrder: item.sortOrder == null ? "" : String(item.sortOrder),
        publishedAt: item.publishedAt ? (() => {
          const offset = item.publishedAt!.getTimezoneOffset();
          const localDate = new Date(item.publishedAt!.getTime() - offset * 60_000);
          return localDate.toISOString().slice(0, 16);
        })() : "",
      }}
    />
  );
}