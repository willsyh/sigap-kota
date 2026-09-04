"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Camera, MapPin } from "lucide-react";

interface CitySlide {
  src: string;
  alt: string;
  caption: string;
  location: string;
  credit: string;
}

const SLIDES: CitySlide[] = [
  {
    src: "/landing/skyline.jpg",
    alt: "Pemandangan Monumen Nasional (Monas) Jakarta di tengah kawasan hijau dan cakrawala kota",
    caption: "Monumen Nasional & Ruang Terbuka",
    location: "Jakarta Pusat",
    credit: "Rafi Alif Fathoni / Unsplash",
  },
  {
    src: "/landing/street.jpg",
    alt: "Kondisi arus mobilitas dan kepadatan lalu lintas jalanan di Jakarta",
    caption: "Mobilitas & Ruang Jalan Publik",
    location: "Jakarta Timur",
    credit: "Iqro Rinaldi / Unsplash",
  },
  {
    src: "/landing/infrastructure.jpg",
    alt: "Permukiman perkotaan padat dan deretan gedung pencakar langit Jakarta",
    caption: "Tata Ruang & Kawasan Perkotaan",
    location: "Jakarta, Indonesia",
    credit: "Iqro Rinaldi / Unsplash",
  },
];

const ROTATION_INTERVAL_MS = 6000;

export default function CityPhotoBand() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    // Check user preference for reduced motion
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      return;
    }

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SLIDES.length);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(timer);
  }, []);

  const currentSlide = SLIDES[currentIndex];

  return (
    <section
      aria-label="Dokumentasi Visual Kota"
      className="relative overflow-hidden border-y border-outline-variant/30 bg-surface-dim"
    >
      <div className="relative h-64 w-full sm:h-80 md:h-96 lg:h-[26rem]">
        {/* Slide layers with crossfade */}
        {SLIDES.map((slide, index) => {
          const isActive = index === currentIndex;
          return (
            <div
              key={slide.src}
              aria-hidden={!isActive}
              className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                isActive ? "opacity-100" : "pointer-events-none opacity-0"
              }`}
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                priority={index === 0}
                sizes="100vw"
                className="object-cover object-center"
              />
            </div>
          );
        })}

        {/* Ambient darkening + dual-directional gradient scrims for contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/30" />

        {/* Content overlay */}
        <div className="relative z-10 mx-auto flex h-full max-w-6xl flex-col justify-between p-5 sm:p-8 md:p-10">
          {/* Top badge */}
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-secondary animate-pulse" />
              Ruang Kota Nyata
            </span>

            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-white/70 backdrop-blur-sm">
              <Camera className="h-3 w-3" />
              Foto: {currentSlide.credit}
            </span>
          </div>

          {/* Bottom info + pagination dots */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-secondary-container">
                <MapPin className="h-3.5 w-3.5" />
                <span>{currentSlide.location}</span>
              </div>
              <p className="font-heading text-xl font-bold tracking-tight text-white sm:text-2xl md:text-3xl">
                {currentSlide.caption}
              </p>
              <p className="max-w-lg text-xs text-white/80 sm:text-sm">
                Setiap sudut kota menyimpan cerita dan kebutuhan perbaikan yang
                dapat dipantau bersama lewat SigapKota.
              </p>
            </div>

            {/* Slide indicators / dots */}
            <div
              role="tablist"
              aria-label="Pilih foto slide kota"
              className="flex items-center gap-2 pt-2 sm:pt-0"
            >
              {SLIDES.map((slide, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <button
                    key={slide.src}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Slide ${idx + 1}: ${slide.caption}`}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      isActive
                        ? "w-8 bg-secondary"
                        : "w-2 bg-white/40 hover:bg-white/70"
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
