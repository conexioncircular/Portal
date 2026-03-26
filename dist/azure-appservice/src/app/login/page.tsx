"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailBlur = async () => {
    if (!email) return;
    try {
      const res = await fetch("/api/public/communities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      setCommunities(data);
    } catch {
      setCommunities([]);
    }
  };

  const handleCommunitySelect = (path: string) => {
    if (path) router.push(path);
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/post-login",
    });

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-6 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl overflow-hidden rounded-[32px] border border-black/5 bg-white shadow-[0_20px_60px_rgba(0,0,0,0.08)] lg:grid-cols-2">
          <section className="flex flex-col justify-between bg-gradient-to-br from-[#f7fffd] via-white to-[#faf6ff] p-8 sm:p-10 lg:p-12">
            <div>
              <div className="mb-6 inline-flex rounded-full border border-[#18D6B6]/30 bg-white px-4 py-1 text-sm font-medium text-[#111111] shadow-sm">
                Portal comunitario
              </div>

              {/* Logo visible sobre fondo oscuro */}
              <div className="mb-8 inline-flex rounded-[24px] bg-black px-6 py-5 shadow-md">
                <Image
                  src="/conexion-energia.png"
                  alt="Conexión"
                  width={255}
                  height={62}
                  priority
                  className="h-auto w-[180px] sm:w-[220px] object-contain"
                />
              </div>

              <h1 className="text-4xl font-bold tracking-tight text-[#111111] sm:text-5xl">
                Bienvenido
              </h1>

              <p className="mt-4 max-w-md text-lg leading-8 text-[#5b6472]">
                Ingresa a tu espacio para revisar noticias, novedades y
                contenidos de tu comunidad.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="h-4 w-24 rounded-full bg-[#18D6B6]" />
                  <div className="h-4 w-12 rounded-full bg-[#18D6B6]" />
                  <div className="h-4 w-12 rounded-full bg-[#18D6B6]" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-24 rounded-full bg-[#5D00E2]" />
                  <div className="h-4 w-12 rounded-full bg-[#5D00E2]" />
                  <div className="h-4 w-12 rounded-full bg-[#5D00E2]" />
                </div>
                <div className="flex items-center gap-4">
                  <div className="h-4 w-24 rounded-full bg-[#FF2887]" />
                  <div className="h-4 w-12 rounded-full bg-[#FF2887]" />
                  <div className="h-4 w-12 rounded-full bg-[#FF2887]" />
                </div>
              </div>
            </div>

            <p className="mt-10 max-w-md text-base leading-7 text-[#6b7280]">
              Accede con tu correo y contraseña para entrar a la información
              correspondiente a tu comunidad.
            </p>
          </section>

          <section className="flex items-center justify-center p-8 sm:p-10 lg:p-12">
            <div className="w-full max-w-md">
              <h2 className="text-3xl font-bold text-[#111111]">
                Iniciar sesión
              </h2>
              <p className="mt-2 text-lg text-[#6b7280]">
                Usa tus credenciales para continuar.
              </p>

              <form className="mt-10 space-y-6" onSubmit={onSubmit}>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-[#111111]"
                  >
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="text"
                    name="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={handleEmailBlur}
                    placeholder="tucorreo@ejemplo.com"
                    className="w-full rounded-[20px] border border-[#d8dde7] bg-white px-5 py-4 text-lg text-[#111111] outline-none transition focus:border-[#18D6B6] focus:ring-4 focus:ring-[#18D6B6]/20"
                    autoComplete="email"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-medium text-[#111111]"
                  >
                    Contraseña
                  </label>
                  <input
                    id="password"
                    type="password"
                    name="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña"
                    className="w-full rounded-[20px] border border-[#d8dde7] bg-white px-5 py-4 text-lg text-[#111111] outline-none transition focus:border-[#5D00E2] focus:ring-4 focus:ring-[#5D00E2]/15"
                    autoComplete="current-password"
                  />
                </div>

                {communities.length > 0 && (
                  <div className="rounded-[20px] border border-[#18D6B6]/20 bg-[#18D6B6]/5 px-4 py-3 text-sm text-[#24504a]">
                    Encontramos {communities.length} comunidad
                    {communities.length > 1 ? "es" : ""} asociada
                    {communities.length > 1 ? "s" : ""} a este correo.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-[20px] bg-[#18D6B6] px-4 py-4 text-lg font-semibold text-black transition hover:bg-[#14c3a7] focus:outline-none focus:ring-4 focus:ring-[#18D6B6]/25 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Ingresando…" : "Entrar"}
                </button>
              </form>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}