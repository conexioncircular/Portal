import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  overlay?: React.ReactNode;
  className?: string;
  aspect?: string; // ej: "aspect-[16/9]"
};
export default function FeatureImage({ src, alt = "", overlay, className = "", aspect = "aspect-[16/9]" }: Props) {
  return (
    <div className={`relative overflow-hidden rounded-xl ${aspect} ${className}`}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1200px) 100vw, 1200px" />
      {overlay && <div className="absolute inset-0">{overlay}</div>}
    </div>
  );
}
