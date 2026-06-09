"use client";

type WhatsAppFloatingProps = {
  phone: string;
  communityName?: string;
  communitySlug?: string;
  slug?: string;
  preset?: string;
};

function buildSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .trim();
}

export default function WhatsAppFloating({
  phone,
  communityName,
  communitySlug,
  slug: slugProp,
  preset,
}: WhatsAppFloatingProps) {
  const cleanPhone = String(phone ?? "").replace(/[^\d]/g, "");

  const slug = communitySlug?.trim() || slugProp?.trim() || (communityName ? buildSlug(communityName) : "");

  const message =
    preset?.trim() ||
    (communityName && slug
      ? `Hola, quiero crear un caso para esta comunidad: ${communityName} #${slug}`
      : communityName
        ? `Hola, quiero crear un caso para esta comunidad: ${communityName}`
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
