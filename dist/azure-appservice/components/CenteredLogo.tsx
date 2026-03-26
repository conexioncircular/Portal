import Image from "next/image";

type Props = {
  src: string;
  alt?: string;
  maxWidth?: string; // ej. "35%" o "240px"
  className?: string;
  priority?: boolean;
};
export default function CenteredLogo({ src, alt = "", maxWidth = "280px", className = "", priority = true }: Props) {
  return (
    <div className={`mx-auto flex items-center justify-center ${className}`} style={{ maxWidth }}>
      <Image
        src={src}
        alt={alt}
        width={800}
        height={300}
        priority={priority}
        style={{ width: "100%", height: "auto" }}
        sizes="(max-width: 640px) 80vw, 320px"
      />
    </div>
  );
}
