"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
} from "react";

export type PublicNewsImage = {
  newsImageId: string;
  imageUrl: string;
  caption: string | null;
  sortOrder: number;
  isCover: boolean;
};

type NewsImageCarouselProps = {
  images: PublicNewsImage[];
  newsTitle: string;
};

type PointerStart = {
  pointerId: number;
  x: number;
  y: number;
};

const AUTOPLAY_DELAY_MS = 5000;
const SWIPE_THRESHOLD_PX = 50;

function getImageAlt(
  image: PublicNewsImage,
  index: number,
  total: number,
  newsTitle: string
): string {
  const caption = image.caption?.trim();
  if (caption) {
    return caption;
  }

  return total > 1
    ? `${newsTitle} — imagen ${index + 1} de ${total}`
    : newsTitle;
}

export default function NewsImageCarousel({
  images,
  newsTitle,
}: NewsImageCarouselProps) {
  const orderedImages = [...images].sort(
    (left, right) =>
      left.sortOrder - right.sortOrder ||
      left.newsImageId.localeCompare(right.newsImageId)
  );
  const initialIndex = Math.max(
    0,
    orderedImages.findIndex((image) => image.isCover)
  );
  const imageCount = orderedImages.length;
  const hasMultipleImages = imageCount > 1;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [manualNavigationVersion, setManualNavigationVersion] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [hasFocusWithin, setHasFocusWithin] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [isDocumentVisible, setIsDocumentVisible] = useState(true);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<PointerStart | null>(null);

  const autoplayPaused =
    isHovered ||
    hasFocusWithin ||
    isTouching ||
    !isDocumentVisible ||
    prefersReducedMotion;

  useEffect(() => {
    if (!hasMultipleImages) {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => {
      setPrefersReducedMotion(mediaQuery.matches);
    };

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => {
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, [hasMultipleImages]);

  useEffect(() => {
    if (!hasMultipleImages) {
      return;
    }

    const updateVisibility = () => {
      setIsDocumentVisible(document.visibilityState === "visible");
    };

    updateVisibility();
    document.addEventListener("visibilitychange", updateVisibility);

    return () => {
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [hasMultipleImages]);

  useEffect(() => {
    if (!hasMultipleImages || autoplayPaused) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % imageCount);
    }, AUTOPLAY_DELAY_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [
    autoplayPaused,
    hasMultipleImages,
    imageCount,
    manualNavigationVersion,
  ]);

  if (imageCount === 0) {
    return null;
  }

  function goToImage(index: number) {
    setActiveIndex((index + imageCount) % imageCount);
    setManualNavigationVersion((current) => current + 1);
  }

  function goToPreviousImage() {
    goToImage(activeIndex - 1);
  }

  function goToNextImage() {
    goToImage(activeIndex + 1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    switch (event.key) {
      case "ArrowLeft":
        event.preventDefault();
        goToPreviousImage();
        break;
      case "ArrowRight":
        event.preventDefault();
        goToNextImage();
        break;
      case "Home":
        event.preventDefault();
        goToImage(0);
        break;
      case "End":
        event.preventDefault();
        goToImage(imageCount - 1);
        break;
    }
  }

  function handleFocus(event: FocusEvent<HTMLDivElement>) {
    if (event.currentTarget.contains(event.target)) {
      setHasFocusWithin(true);
    }
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    const nextFocusedElement = event.relatedTarget;
    if (
      !(nextFocusedElement instanceof Node) ||
      !event.currentTarget.contains(nextFocusedElement)
    ) {
      setHasFocusWithin(false);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerType !== "touch") {
      return;
    }

    setIsTouching(true);
    if (
      event.target instanceof Element &&
      event.target.closest("button")
    ) {
      pointerStartRef.current = null;
      return;
    }

    pointerStartRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function finishPointerInteraction(event: PointerEvent<HTMLDivElement>) {
    const pointerStart = pointerStartRef.current;
    pointerStartRef.current = null;
    setIsTouching(false);

    if (!pointerStart || pointerStart.pointerId !== event.pointerId) {
      return;
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const horizontalDistance = event.clientX - pointerStart.x;
    const verticalDistance = event.clientY - pointerStart.y;
    if (
      Math.abs(horizontalDistance) < SWIPE_THRESHOLD_PX ||
      Math.abs(horizontalDistance) <= Math.abs(verticalDistance)
    ) {
      return;
    }

    if (horizontalDistance < 0) {
      goToNextImage();
    } else {
      goToPreviousImage();
    }
  }

  function cancelPointerInteraction(event: PointerEvent<HTMLDivElement>) {
    pointerStartRef.current = null;
    setIsTouching(false);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  return (
    <div
      ref={carouselRef}
      role="region"
      aria-label="Galería de imágenes de la noticia"
      aria-roledescription={hasMultipleImages ? "carrusel" : undefined}
      className="group relative h-[240px] max-h-[75vh] w-full touch-pan-y overflow-hidden bg-slate-100 md:h-[320px] lg:h-[560px] xl:h-[620px]"
      onMouseEnter={hasMultipleImages ? () => setIsHovered(true) : undefined}
      onMouseLeave={hasMultipleImages ? () => setIsHovered(false) : undefined}
      onFocusCapture={hasMultipleImages ? handleFocus : undefined}
      onBlurCapture={hasMultipleImages ? handleBlur : undefined}
      onKeyDown={hasMultipleImages ? handleKeyDown : undefined}
      onPointerDown={hasMultipleImages ? handlePointerDown : undefined}
      onPointerUp={hasMultipleImages ? finishPointerInteraction : undefined}
      onPointerCancel={hasMultipleImages ? cancelPointerInteraction : undefined}
    >
      {orderedImages.map((image, index) => {
        const isActive = index === activeIndex;

        return (
          <div
            key={image.newsImageId}
            aria-hidden={!isActive}
            className={`absolute inset-0 overflow-hidden transition-opacity duration-500 motion-reduce:transition-none ${
              isActive ? "z-10 opacity-100" : "pointer-events-none opacity-0"
            }`}
          >
            <Image
              src={image.imageUrl}
              alt=""
              aria-hidden="true"
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 96vw, 1152px"
              className="scale-110 object-cover object-center opacity-60 blur-2xl"
            />
            <div
              className="absolute inset-0 bg-slate-950/15"
              aria-hidden="true"
            />
            <Image
              src={image.imageUrl}
              alt={getImageAlt(image, index, imageCount, newsTitle)}
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 96vw, 1152px"
              priority={index === initialIndex}
              className="relative z-10 object-contain object-center p-2 md:p-4"
            />
          </div>
        );
      })}

      {hasMultipleImages ? (
        <>
          <button
            type="button"
            aria-label="Imagen anterior"
            onClick={goToPreviousImage}
            className="absolute left-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-slate-950/65 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 md:left-5"
          >
            <ChevronLeft className="size-5" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-label="Imagen siguiente"
            onClick={goToNextImage}
            className="absolute right-3 top-1/2 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/70 bg-slate-950/65 text-white shadow-lg backdrop-blur-sm transition hover:bg-slate-950/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 md:right-5"
          >
            <ChevronRight className="size-5" aria-hidden="true" />
          </button>

          <div
            role="group"
            className="absolute inset-x-0 bottom-2 z-20 flex items-center justify-center gap-0.5"
            aria-label="Seleccionar imagen"
          >
            {orderedImages.map((image, index) => (
              <button
                key={image.newsImageId}
                type="button"
                aria-label={`Ir a la imagen ${index + 1} de ${imageCount}`}
                aria-current={index === activeIndex ? "true" : undefined}
                onClick={() => goToImage(index)}
                className="group/indicator flex size-10 items-center justify-center rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
              >
                <span
                  className={`block h-2.5 rounded-full border border-white/90 shadow-sm transition-all motion-reduce:transition-none ${
                    index === activeIndex
                      ? "w-6 bg-white"
                      : "w-2.5 bg-slate-950/55 group-hover/indicator:bg-white/80"
                  }`}
                  aria-hidden="true"
                />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
