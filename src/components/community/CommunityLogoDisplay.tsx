type CommunityLogoDisplayProps = {
  src: string;
  alt: string;
  className?: string;
};

export default function CommunityLogoDisplay({
  src,
  alt,
  className = "",
}: CommunityLogoDisplayProps) {
  return (
    <div className={`relative w-full max-w-[220px] ${className}`.trim()}>
      <div className="absolute inset-x-8 inset-y-10 rounded-full bg-[radial-gradient(circle,#fde68a_0%,#e0f2fe_42%,transparent_76%)] opacity-65 blur-3xl" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={220}
        height={160}
        className="relative ml-auto h-auto max-h-32 w-auto max-w-full object-contain drop-shadow-[0_14px_30px_rgba(15,23,42,0.16)]"
        loading="eager"
        fetchPriority="high"
        decoding="async"
        draggable={false}
      />
    </div>
  );
}
