import LoginPageClient from "@/components/LoginPageClient";

type SearchParamsShape = Record<string, string | string[] | undefined>;

type PageProps = {
  searchParams?: Promise<SearchParamsShape> | SearchParamsShape;
};

function getSingleValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const callbackUrl = getSingleValue(resolvedSearchParams?.callbackUrl)?.trim() || "/post-login";
  const initialError = getSingleValue(resolvedSearchParams?.error)?.trim() || null;

  return <LoginPageClient callbackUrl={callbackUrl} initialError={initialError} />;
}
