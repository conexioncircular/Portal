"use client";

type Props = { phone: string; preset?: string; communityName?: string };

// Fallback genérico (sin comunidad específica)
const DEFAULT_WA_TEXT_ENCODED = encodeURIComponent(
  "Hola! Quiero reportar un problema."
);

export default function WhatsAppFloating({ phone, preset, communityName }: Props) {
  const text = preset
    ? encodeURIComponent(preset)
    : communityName && communityName.trim().length > 0
    ? encodeURIComponent(`Hola! Quiero reportar un problema en ${communityName}.`)
    : DEFAULT_WA_TEXT_ENCODED;
  const wa = `https://wa.me/${phone.replace(/\D/g, "")}?text=${text}`;

  const s: React.CSSProperties = {
    position: "fixed",
    right: 20,
    bottom: 20,
    background: "#25D366",
    color: "#fff",
    borderRadius: 9999,
    padding: "14px 16px",
    textDecoration: "none",
    boxShadow: "0 6px 16px rgba(0,0,0,.15)",
    fontWeight: 600,
    zIndex: 50,
  };

  return (
    <a
      href={wa}
      target="_blank"
      rel="noopener noreferrer"
      style={s}
      aria-label="Habla con el bot por WhatsApp"
    >
      WhatsApp
    </a>
  );
}
