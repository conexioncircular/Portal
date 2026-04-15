"use client";

type WhatsAppFloatingProps = {
  phone: string;
  communityName?: string;
  preset?: string;
};

export default function WhatsAppFloating({
  phone,
  communityName,
  preset,
}: WhatsAppFloatingProps) {
  const cleanPhone = String(phone ?? "").replace(/[^\d]/g, "");

  const message =
    preset?.trim() ||
    (communityName
      ? `Hola, quiero comunicarme sobre ${communityName}.`
      : "Hola, quiero comunicarme con Conexión.");

  const href = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label="Contactar por WhatsApp"
      className="fixed bottom-6 right-6 z-40 inline-flex items-center rounded-full bg-[#25D366] px-5 py-3 text-base font-semibold text-white shadow-[0_12px_24px_rgba(37,211,102,0.22)] transition hover:scale-[1.01] hover:bg-[#20c35b]"
    >
      WhatsApp
    </a>
  );
}