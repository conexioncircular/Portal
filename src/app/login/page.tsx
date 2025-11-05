"use client";

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
    const res = await signIn("credentials", {
      email,
      password,
      redirect: true,
      callbackUrl: "/post-login", // o usa searchParam callbackUrl si lo manejas
    });
    // NextAuth se encarga de redirigir. Si hay error, llegará como ?error=...
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <div className="bg-white shadow-lg rounded-xl p-8 w-full max-w-sm">
        <h1 className="text-xl font-bold text-center mb-4">Iniciar Sesión</h1>

        {/* 👉 ya NO usamos action ni POST directo */}
        <form className="space-y-3" onSubmit={onSubmit}>
          <input
            type="text"
            name="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={handleEmailBlur}
            placeholder="Correo electrónico"
            className="w-full border px-3 py-2 rounded"
            autoComplete="email"
          />
          <input
            type="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full border px-3 py-2 rounded"
            autoComplete="current-password"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Ingresando…" : "Entrar"}
          </button>
        </form>

        
      </div>
    </main>
  );
}
