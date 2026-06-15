// src/components/Header.tsx
import Image from "next/image";
import Link from "next/link";
import { getUserCommunities } from "@/lib/queries";
import { auth } from "@/lib/auth"; // tu helper de NextAuth (getServerSession)

export default async function Header() {
  const session = await auth();
  const userId = session?.user?.id as string | undefined;

  const communities = userId ? await getUserCommunities(userId) : [];

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image src="/LOGO.png" alt="Conexión Circular" width={40} height={40} />
          <span className="font-semibold tracking-wide">Conexión Circular</span>
        </Link>

        {/* Dropdown accesible sin librerías */}
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50">
            Mis comunidades
          </summary>
          <div className="absolute right-0 mt-2 w-64 rounded-xl border bg-white p-2 shadow-xl">
            {communities.length === 0 ? (
              <div className="px-3 py-2 text-sm text-gray-500">No tienes comunidades asignadas.</div>
            ) : (
              <ul className="max-h-80 overflow-auto">
                {communities.map(c => (
                  <li key={c.pageId}>
                    <Link
                      href={`/${c.slug}`}
                      className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-50"
                    >
                      {c.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      </div>
    </header>
  );
}
