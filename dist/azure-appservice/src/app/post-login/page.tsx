import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getPool } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PostLogin() {
  // 1) Obtener sesión
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login?error=AuthRequired");
  }

  const userId = String(session.user.id); // aseguramos string (GUID)

  // 2) Buscar la página primaria del usuario y su Path
  const pool = await getPool();
  const result = await pool
    .request()
    .input("userId", userId) // inferencia => evita EPARAM validate()
    .query(/* sql */ `
      SELECT TOP 1 p.[Path]
      FROM [cms].[UserPageAccess] a
      JOIN [cms].[Pages] p ON p.[PageId] = a.[PageId]
      WHERE a.[UserId] = @userId
        AND a.[IsPrimary] = 1
    `);

  const rawPath: unknown = result.recordset[0]?.Path;

  // 3) Normalizar y redirigir
  let path = typeof rawPath === "string" ? rawPath.trim() : "";
  if (!path) {
    // Fallback si no tiene primaria
    redirect("/");
  }

  // Asegurar que comience con "/"
  if (!path.startsWith("/")) path = `/${path}`;

  // Listado mínimo de rutas permitidas (defensa básica)
  // Si quieres ser más estricto, valida contra una lista blanca desde tu DB.
  // if (!/^\/[A-Za-z0-9\-\/]*$/.test(path)) redirect("/");

  redirect(path);
}
