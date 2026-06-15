export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export default function UnauthorizedPage() {
  const fallback = process.env.DEFAULT_PAGE_PATH || "/";
  return (
    <html>
      <body style={{ fontFamily: "system-ui, sans-serif", padding: 24 }}>
        <h1>Acceso no autorizado</h1>
        <p>No tienes permisos para acceder a esta ruta.</p>
        <p>
          <a href={fallback} style={{ color: "#2563eb" }}>
            Volver al inicio
          </a>
        </p>
      </body>
    </html>
  );
}

