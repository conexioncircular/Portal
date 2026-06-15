// src/components/CommunitySwitcher.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Row = { Title: string; Path: string };

export default function CommunitySwitcher({
  className = "",
  inline = false,           // si true: aparece como fila normal; si false: flotante abajo-derecha
}: { className?: string; inline?: boolean }) {
  const [items, setItems] = useState<Row[]>([]);
  const [value, setValue] = useState("");
  const router = useRouter();

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/user/communities", { cache: "no-store" });
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } catch {
        setItems([]);
      }
    })();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const path = e.target.value;
    setValue(path);
    if (path) router.push(path);
  };

  if (!items.length) return null;

  if (inline) {
    return (
      <div className={className}>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Cambiar comunidad
        </label>
        <select
          value={value}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-sm w-full"
        >
          <option value="">Selecciona una comunidad</option>
          {items.map((c) => (
            <option key={c.Path} value={c.Path}>
              {c.Title}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // flotante por defecto (esquina inferior derecha)
  return (
    <div className={`fixed bottom-4 right-4 z-40 bg-white/95 backdrop-blur border shadow-lg rounded-xl p-3 ${className}`}>
      <label className="block text-xs font-semibold text-gray-700 mb-1">
        Cambiar comunidad
      </label>
      <select
        value={value}
        onChange={handleChange}
        className="border rounded px-2 py-1 text-sm w-56"
      >
        <option value="">Selecciona una comunidad</option>
        {items.map((c) => (
          <option key={c.Path} value={c.Path}>
            {c.Title}
          </option>
        ))}
      </select>
    </div>
  );
}
