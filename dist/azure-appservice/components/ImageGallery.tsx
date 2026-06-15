import Image from "next/image";

type Img = { src: string; alt?: string };
export default function ImageGallery({ images }: { images: Img[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {images.map((im) => (
        <div key={im.src} className="relative h-40 overflow-hidden rounded-lg">
          <Image src={im.src} alt={im.alt ?? ""} fill className="object-cover transition hover:scale-[1.02]" sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw" />
        </div>
      ))}
    </div>
  );
}
