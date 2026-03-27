import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conexión Energía",
  description: "Acceso al portal Conexión Energía",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}