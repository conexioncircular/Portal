// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina condicionalmente clases de Tailwind sin duplicar reglas.
 * Ejemplo: cn("p-2", isActive && "bg-green-500")
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
