"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

type MessageState =
  | { tone: "error" | "success"; text: string }
  | null;

type LoginPageClientProps = {
  callbackUrl?: string;
  initialError?: string | null;
};

const LOGIN_REQUEST_TIMEOUT_MS = 20000;

function getLoginErrorMessage(error?: string | null) {
  const code = String(error ?? "").trim();

  switch (code) {
    case "CredentialsSignin":
      return "Usuario, RUT, correo o contrasena incorrectos.";
    case "MissingCredentials":
      return "Debes ingresar tu usuario, RUT o correo, y tu contrasena.";
    case "AuthDbTimeout":
      return "No se pudo validar el acceso porque el servidor demoro demasiado en responder.";
    case "AuthDbUnavailable":
    case "AuthPasswordVerificationFailed":
    case "Configuration":
      return "No se pudo validar el acceso por un problema del servidor. Intenta nuevamente en unos minutos.";
    default:
      return "No se pudo iniciar sesion. Revisa tu usuario, RUT o correo, y tu contrasena.";
  }
}

async function signInWithTimeout(identifier: string, password: string, callbackUrl: string) {
  return Promise.race([
    signIn("credentials", {
      identifier,
      password,
      redirect: false,
      callbackUrl,
    }),
    new Promise<Awaited<ReturnType<typeof signIn>>>((resolve) => {
      setTimeout(
        () => resolve({ error: "AuthDbTimeout", ok: false, status: 504, url: null }),
        LOGIN_REQUEST_TIMEOUT_MS
      );
    }),
  ]);
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

export default function LoginPageClient({
  callbackUrl = "/post-login",
  initialError,
}: LoginPageClientProps) {
  const router = useRouter();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const [message, setMessage] = useState<MessageState>(
    initialError
      ? {
          tone: "error",
          text: getLoginErrorMessage(initialError),
        }
      : null
  );

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setLoginLoading(true);

    const result = await signInWithTimeout(identifier, password, callbackUrl);

    setLoginLoading(false);

    if (!result || result.error) {
      setMessage({
        tone: "error",
        text: getLoginErrorMessage(result?.error),
      });
      return;
    }

    router.push(result.url || callbackUrl);
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f3f3f3]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#ffffff_0%,#f6f6f6_45%,#efefef_100%)]" />

      <div className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <div className="flex w-full max-w-5xl items-center justify-center gap-6 lg:gap-12 xl:max-w-6xl">
          <div className="pointer-events-none hidden lg:flex lg:shrink-0 lg:items-center">
            <Image
              src="/mapa.png"
              alt="Mapa del login"
              width={817}
              height={1280}
              priority
              className="h-[620px] w-auto max-w-none opacity-95 xl:h-[700px]"
            />
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
                  Bienvenido
                </h1>
                <p className="mt-3 text-sm text-[#5f6670]">
                  Ingresa con tu usuario, RUT o correo, y tu contrasena.
                </p>
              </div>

              <div className="space-y-4">
                <MessageBox message={message} />

                  <form className="space-y-3" onSubmit={onSubmit}>
                    <div className="relative">
                      <label htmlFor="identifier" className="sr-only">
                        Usuario, RUT o correo
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
                        id="identifier"
                        type="text"
                        name="identifier"
                        value={identifier}
                        onChange={(event) => setIdentifier(event.target.value)}
                        placeholder="Usuario, RUT o correo"
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
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
