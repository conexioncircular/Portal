import Image from "next/image";

export default function MediaBlock({
  title,
  bullets,
  image,
  imageRight = false,
}: {
  title: string;
  bullets: string[];
  image: { src: string; alt?: string };
  imageRight?: boolean;
}) {
  return (
    <section className="bg-white">
      <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-12 md:grid-cols-2">
        <div className={imageRight ? "order-2" : ""}>
          <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
          <ul className="mt-4 space-y-2 text-slate-700">
            {bullets.map((b, i) => (
              <li key={i}>• {b}</li>
            ))}
          </ul>
        </div>
        <div className={imageRight ? "order-1" : ""}>
          <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl">
            <Image src={image.src} alt={image.alt ?? ""} fill className="object-cover" />
          </div>
        </div>
      </div>
    </section>
  );
}

