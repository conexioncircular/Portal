"use client";

import Image from "next/image";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type MessageState =
  | { tone: "error" | "success"; text: string }
  | null;

function ChileMapGraphic() {
  return (
    <div className="relative h-[520px] w-[170px] opacity-90">
      <div className="absolute left-1/2 top-1/2 h-[360px] w-[90px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#18D6B6] opacity-[0.14] blur-3xl" />

      <svg
        viewBox="0 0 100 400"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="absolute h-full w-full drop-shadow-[0_0_8px_rgba(24,214,182,0.45)]"
      >
        <path
          d="M60 20 Q55 40 50 80 T45 150 T40 220 T45 280 T55 350 L50 380 L40 375 L45 340 Q35 280 30 200 T40 80 Q45 40 50 10 Z"
          stroke="#18D6B6"
          strokeWidth="1.5"
          fill="rgba(24, 214, 182, 0.05)"
          strokeLinejoin="round"
        />

        <path
          d="M52 60 L70 80 L70 120 L48 150 M45 220 L25 240 L25 280 L48 310"
          stroke="#18D6B6"
          strokeWidth="1"
          strokeDasharray="4 4"
          className="opacity-70"
        />
        <path
          d="M48 150 L20 150 L20 200 L42 220"
          stroke="#18D6B6"
          strokeWidth="1"
          className="opacity-50"
        />

        <circle cx="52" cy="60" r="3" fill="white" stroke="#18D6B6" strokeWidth="1.5" />
        <circle cx="70" cy="120" r="2.5" fill="white" stroke="#18D6B6" strokeWidth="1.5" />

        <circle cx="48" cy="150" r="4" fill="#18D6B6" className="animate-pulse" />
        <circle cx="48" cy="150" r="4" fill="none" stroke="white" strokeWidth="1" />

        <circle cx="42" cy="220" r="4" fill="#18D6B6" className="animate-pulse" />
        <circle cx="42" cy="220" r="4" fill="none" stroke="white" strokeWidth="1" />

        <circle cx="25" cy="280" r="2.5" fill="white" stroke="#18D6B6" strokeWidth="1.5" />
        <circle cx="48" cy="310" r="3" fill="white" stroke="#18D6B6" strokeWidth="1.5" />

        <path
          d="M75 180 L85 180 M80 170 L80 190 M77 175 L83 185 M77 185 L83 175"
          stroke="#18D6B6"
          strokeWidth="1"
          className="opacity-60"
        />
        <path
          d="M15 100 L25 100 M20 90 L20 110 M17 95 L23 105 M17 105 L23 95"
          stroke="#18D6B6"
          strokeWidth="1"
          className="opacity-60"
        />
      </svg>
    </div>
  );
}

function MessageBox({ message }: { message: MessageState }) {
  if (!message) {
    return null;
  }

  const toneClasses =
    message.tone === "success"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-rose-200 bg-rose-50 text-rose-700";

  return (
    <div className={`rounded-[10px] border px-4 py-3 text-sm ${toneClasses}`}>
      {message.text}
    </div>
  );
}

function PasswordField({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  visible,
  onToggle,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>

      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#70757f]">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
        >
          <rect
            x="4"
            y="10"
            width="16"
            height="10"
            rx="2"
            stroke="currentColor"
            strokeWidth="1.8"
          />
          <path
            d="M8 10V7a4 4 0 1 1 8 0v3"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </span>

      <input
        id={id}
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-[10px] border border-[#cfd4db] bg-[#f5f6f7] py-3 pl-10 pr-14 text-[15px] text-[#111111] outline-none transition placeholder:text-[#7b818a] focus:border-[#18D6B6] focus:bg-white focus:ring-4 focus:ring-[#18D6B6]/15"
      />

      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#70757f] transition hover:text-[#111111]"
        aria-label={visible ? "Ocultar contrasena" : "Mostrar contrasena"}
      >
        {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl")?.trim() || "/post-login";

  const [view, setView] = useState<"login" | "reset">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [resetIdentifier, setResetIdentifier] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const [message, setMessage] = useState<MessageState>(null);

  useEffect(() => {
    const error = searchParams.get("error");
    if (!error) {
      return;
    }

    setMessage({
      tone: "error",
      text: "No se pudo iniciar sesion. Revisa tu usuario y contrasena.",
    });
  }, [searchParams]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoginLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    setLoginLoading(false);

    if (!result || result.error) {
      setMessage({
        tone: "error",
        text: "Credenciales invalidas. Intenta nuevamente.",
      });
      return;
    }

    router.push(result.url || callbackUrl);
    router.refresh();
  }

  async function onResetSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);

    const identifier = resetIdentifier.trim();
    if (!identifier) {
      setMessage({
        tone: "error",
        text: "Debes ingresar tu usuario antes de recuperar la contrasena.",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({
        tone: "error",
        text: "Las contrasenas no coinciden.",
      });
      return;
    }

    setResetLoading(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier,
          password: newPassword,
          confirmPassword,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "No se pudo actualizar la contrasena."
        );
      }

      setEmail(identifier);
      setPassword("");
      setResetIdentifier(identifier);
      setNewPassword("");
      setConfirmPassword("");
      setShowLoginPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setView("login");
      setMessage({
        tone: "success",
        text: "Contrasena actualizada. Ya puedes iniciar sesion.",
      });
    } catch (error) {
      setMessage({
        tone: "error",
        text:
          error instanceof Error && error.message
            ? error.message
            : "No se pudo actualizar la contrasena.",
      });
    } finally {
      setResetLoading(false);
    }
  }

  function openResetView() {
    const fixedIdentifier = email.trim();
    if (!fixedIdentifier) {
      setMessage({
        tone: "error",
        text: "Primero ingresa tu usuario y luego usa la recuperacion.",
      });
      return;
    }

    setMessage(null);
    setResetIdentifier(fixedIdentifier);
    setNewPassword("");
    setConfirmPassword("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setView("reset");
  }

  function openLoginView() {
    setMessage(null);
    setPassword("");
    setShowLoginPassword(false);
    setView("login");
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f3]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f6f6_45%,#efefef_100%)]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-4xl items-center justify-center gap-6 lg:gap-10">
          <div className="pointer-events-none hidden lg:block">
            <ChileMapGraphic />
          </div>

          <div className="flex w-full max-w-[420px] flex-col items-center">
            <div className="mb-6 flex justify-center">
              <Image
                src="/conexion-energia.png"
                alt="Conexion"
                width={255}
                height={62}
                priority
                className="h-auto w-[220px] object-contain sm:w-[255px]"
              />
            </div>

            <div className="w-full rounded-[22px] border border-white/70 bg-white/92 px-7 py-8 shadow-[0_14px_36px_rgba(0,0,0,0.14)] backdrop-blur-sm sm:px-8">
              <div className="mb-6 text-center">
                <h1 className="text-[2rem] font-medium leading-none text-[#111111]">
                  {view === "login" ? "Bienvenido" : "Recuperar acceso"}
                </h1>
                <p className="mt-3 text-sm text-[#5f6670]">
                  {view === "login"
                    ? "Ingresa con tu usuario y contrasena."
                    : "Define una nueva contrasena para tu usuario."}
                </p>
              </div>

              <div className="space-y-4">
                <MessageBox message={message} />

                {view === "login" ? (
                  <form className="space-y-3" onSubmit={onSubmit}>
                    <div className="relative">
                      <label htmlFor="email" className="sr-only">
                        Usuario o correo
                      </label>

                      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#70757f]">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden="true"
                        >
                          <path
                            d="M20 21a8 8 0 1 0-16 0"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                          />
                          <circle
                            cx="12"
                            cy="8"
                            r="4"
                            stroke="currentColor"
                            strokeWidth="1.8"
                          />
                        </svg>
                      </span>

                      <input
                        id="email"
                        type="text"
                        name="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="Usuario o correo"
                        autoComplete="username"
                        className="w-full rounded-[10px] border border-[#cfd4db] bg-[#f5f6f7] py-3 pl-10 pr-4 text-[15px] text-[#111111] outline-none transition placeholder:text-[#7b818a] focus:border-[#18D6B6] focus:bg-white focus:ring-4 focus:ring-[#18D6B6]/15"
                      />
                    </div>

                    <PasswordField
                      id="password"
                      value={password}
                      onChange={setPassword}
                      placeholder="Contrasena"
                      autoComplete="current-password"
                      visible={showLoginPassword}
                      onToggle={() => setShowLoginPassword((current) => !current)}
                    />

                    <button
                      type="submit"
                      disabled={loginLoading}
                      className="mt-2 w-full rounded-[10px] bg-[#32d4c5] px-4 py-3 text-[17px] font-medium text-white shadow-[0_8px_18px_rgba(50,212,197,0.28)] transition hover:bg-[#28c7b9] focus:outline-none focus:ring-4 focus:ring-[#18D6B6]/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {loginLoading ? "Iniciando..." : "Iniciar sesion"}
                    </button>
                  </form>
                ) : (
                  <form className="space-y-3" onSubmit={onResetSubmit}>
                    <div className="rounded-[14px] border border-slate-200 bg-slate-50 px-4 py-3 text-left">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Usuario
                      </p>
                      <p className="mt-1 text-sm font-medium text-slate-800">
                        {resetIdentifier}
                      </p>
                    </div>

                    <PasswordField
                      id="reset-password"
                      value={newPassword}
                      onChange={setNewPassword}
                      placeholder="Nueva contrasena"
                      autoComplete="new-password"
                      visible={showNewPassword}
                      onToggle={() => setShowNewPassword((current) => !current)}
                    />

                    <PasswordField
                      id="reset-password-confirm"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Confirmar nueva contrasena"
                      autoComplete="new-password"
                      visible={showConfirmPassword}
                      onToggle={() => setShowConfirmPassword((current) => !current)}
                    />

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="mt-2 w-full rounded-[10px] bg-[#32d4c5] px-4 py-3 text-[17px] font-medium text-white shadow-[0_8px_18px_rgba(50,212,197,0.28)] transition hover:bg-[#28c7b9] focus:outline-none focus:ring-4 focus:ring-[#18D6B6]/25 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resetLoading ? "Actualizando..." : "Actualizar contrasena"}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-5 space-y-2 text-center text-[14px] text-[#222222]">
                {view === "login" ? (
                  <button
                    type="button"
                    onClick={openResetView}
                    className="block w-full transition hover:text-[#0f8f85]"
                  >
                    Olvide mi contrasena
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openLoginView}
                    className="block w-full transition hover:text-[#0f8f85]"
                  >
                    Volver al inicio de sesion
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginPageContent />
    </Suspense>
  );
}
