import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comunidades | Conexión Circular",
  description: "Portal de comunidades del proyecto Conexión Circular",
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col bg-white text-gray-800">
      <main className="flex-1 w-full">{children}</main>
    </div>
  );
}
