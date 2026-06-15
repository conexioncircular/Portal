import { auth } from "../../auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function DebugSession() {
  const s = await auth();
  return <pre className="p-4 text-xs">{JSON.stringify(s, null, 2)}</pre>;
}
