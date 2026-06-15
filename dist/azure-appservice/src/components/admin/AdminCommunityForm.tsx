"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  COMMUNITY_LOGO_ACCEPT,
  COMMUNITY_LOGO_ALLOWED_LABEL,
  COMMUNITY_LOGO_DEFAULT_MAX_UPLOAD_MB,
  getAllowedCommunityLogoType,
} from "@/lib/community-logo-upload";
import { buildCommunityPath, normalizeCommunitySlug } from "@/lib/community-slug";

type AdminCommunityInitialValues = {
  communityId: string;
  name: string;
  slug: string;
  isActive: boolean;
  region: string | null;
  localidad: string | null;
  tipo: string | null;
  tramo: string | null;
  path: string | null;
  logoUrl: string | null;
};

type AdminCommunityFormProps = {
  initialValues?: AdminCommunityInitialValues;
  mode?: "create" | "edit";
};

type FormState = {
  name: string;
  slug: string;
  isActive: boolean;
  region: string;
  localidad: string;
  tipo: string;
  tramo: string;
  logoUrl: string;
};

type UploadResponse = {
  url?: string;
  error?: string;
};

const INITIAL_FORM: FormState = {
  name: "",
  slug: "",
  isActive: true,
  region: "",
  localidad: "",
  tipo: "",
  tramo: "",
  logoUrl: "",
};

function getTramoInputValue(value?: string | null): string {
  const digits = String(value ?? "").match(/\d+/g)?.join("") ?? "";
  return digits.replace(/^0+(?=\d)/, "");
}

export default function AdminCommunityForm({
  initialValues,
  mode = "create",
}: AdminCommunityFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(
    initialValues
      ? {
          name: initialValues.name,
          slug: initialValues.slug,
          isActive: initialValues.isActive,
          region: initialValues.region ?? "",
          localidad: initialValues.localidad ?? "",
          tipo: initialValues.tipo ?? "",
          tramo: getTramoInputValue(initialValues.tramo),
          logoUrl: initialValues.logoUrl ?? "",
        }
      : INITIAL_FORM
  );
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [pendingLogoFile, setPendingLogoFile] = useState<File | null>(null);
  const [pendingLogoPreviewUrl, setPendingLogoPreviewUrl] = useState("");
  const [logoInputKey, setLogoInputKey] = useState(0);

  useEffect(() => {
    if (!pendingLogoFile) {
      setPendingLogoPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(pendingLogoFile);
    setPendingLogoPreviewUrl(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [pendingLogoFile]);

  const isBusy = saving || uploadingLogo;
  const previewUrl = pendingLogoPreviewUrl || form.logoUrl;
  const generatedPath = buildCommunityPath(form.slug);

  function resetPendingLogo() {
    setPendingLogoFile(null);
    setLogoInputKey((current) => current + 1);
  }

  function clearLogo() {
    resetPendingLogo();
    setForm((current) => ({ ...current, logoUrl: "" }));
  }

  function handleNameChange(event: ChangeEvent<HTMLInputElement>) {
    const name = event.target.value;
    setForm((current) => ({
      ...current,
      name,
      slug: normalizeCommunitySlug(name),
    }));
  }

  function handleLogoChange(event: ChangeEvent<HTMLInputElement>) {
    const nextFile = event.target.files?.[0] ?? null;
    setErrorMessage("");

    if (!nextFile) {
      setPendingLogoFile(null);
      return;
    }

    if (
      !getAllowedCommunityLogoType({
        mimeType: nextFile.type,
        fileName: nextFile.name,
      })
    ) {
      setErrorMessage(
        `Formato de logo no soportado. Usa ${COMMUNITY_LOGO_ALLOWED_LABEL}.`
      );
      resetPendingLogo();
      return;
    }

    setPendingLogoFile(nextFile);
  }

  async function uploadPendingLogo(file: File): Promise<string> {
    const slug = form.slug.trim();
    if (!slug) {
      throw new Error("Ingresa el nombre de la comunidad antes de subir el logo.");
    }

    const uploadData = new FormData();
    uploadData.set("file", file);
    uploadData.set("slug", slug);

    const response = await fetch("/api/admin/uploads/community-logo", {
      method: "POST",
      body: uploadData,
    });

    const payload = (await response.json()) as UploadResponse;
    if (!response.ok || !payload?.url) {
      throw new Error(payload?.error || "No se pudo subir el logo");
    }

    return payload.url;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    try {
      if (form.tramo && Number(form.tramo) <= 0) {
        throw new Error("Tramo debe ser mayor que 0.");
      }

      let logoUrl = form.logoUrl.trim();

      if (pendingLogoFile) {
        setUploadingLogo(true);
        const uploadedLogoUrl = await uploadPendingLogo(pendingLogoFile);
        logoUrl = uploadedLogoUrl;
        setForm((current) => ({ ...current, logoUrl: uploadedLogoUrl }));
        resetPendingLogo();
        setUploadingLogo(false);
      }

      const endpoint =
        mode === "edit" && initialValues
          ? `/api/admin/communities/${initialValues.communityId}`
          : "/api/admin/communities";
      const response = await fetch(endpoint, {
        method: mode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          isActive: form.isActive,
          region: form.region,
          localidad: form.localidad,
          tipo: form.tipo,
          tramo: form.tramo,
          logoUrl: logoUrl || null,
        }),
      });

      const payload: unknown = await response.json();
      if (!response.ok) {
        throw new Error(
          typeof payload === "object" && payload !== null && "error" in payload
            ? String((payload as { error: string }).error)
            : "No se pudo guardar la comunidad"
        );
      }

      router.push("/admin/comunidades");
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "No se pudo guardar la comunidad"
      );
    } finally {
      setUploadingLogo(false);
      setSaving(false);
    }
  }

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-950">
            {mode === "edit" ? "Editar comunidad" : "Nueva comunidad"}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {mode === "edit"
              ? "Actualiza los datos de la comunidad y su logo asociado."
              : "Crea una comunidad nueva y genera su página interna en el portal."}
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          className="rounded-full border-slate-200"
          onClick={() => router.push("/admin/comunidades")}
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al listado
        </Button>
      </div>

      {errorMessage && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      )}

      <form className="space-y-6" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Nombre de la comunidad
            </label>
            <Input
              id="name"
              value={form.name}
              onChange={handleNameChange}
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
              required
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="slug">
              Slug
            </label>
            <Input
              id="slug"
              value={form.slug}
              readOnly
              className="h-12 rounded-2xl border-slate-200 bg-slate-100 text-slate-500"
            />
            <p className="text-xs text-slate-500">
              Se genera automáticamente en minúscula, sin espacios ni caracteres especiales.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="path">
              Ruta
            </label>
            <Input
              id="path"
              value={generatedPath}
              readOnly
              className="h-12 rounded-2xl border-slate-200 bg-slate-100 text-slate-500"
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="region">
              Región
            </label>
            <Input
              id="region"
              value={form.region}
              onChange={(event) =>
                setForm((current) => ({ ...current, region: event.target.value }))
              }
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="localidad">
              Localidad
            </label>
            <Input
              id="localidad"
              value={form.localidad}
              onChange={(event) =>
                setForm((current) => ({ ...current, localidad: event.target.value }))
              }
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="tipo">
              Tipo
            </label>
            <Input
              id="tipo"
              value={form.tipo}
              onChange={(event) =>
                setForm((current) => ({ ...current, tipo: event.target.value }))
              }
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="tramo">
              Tramo
            </label>
            <Input
              id="tramo"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Ejemplo: 1"
              value={form.tramo}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  tramo: event.target.value
                    .replace(/\D+/g, "")
                    .replace(/^0+(?=\d)/, ""),
                }))
              }
              className="h-12 rounded-2xl border-slate-200 bg-slate-50"
            />
            <p className="text-xs text-slate-500">
              Ingresa solo el número. Se guardará como `Tramo N`.
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700" htmlFor="communityLogo">
              Logo de la comunidad
            </label>
            <Input
              key={logoInputKey}
              id="communityLogo"
              type="file"
              accept={COMMUNITY_LOGO_ACCEPT}
              onChange={handleLogoChange}
              className="h-auto rounded-2xl border-slate-200 bg-slate-50 px-4 py-3 file:mr-3 file:rounded-full file:border-0 file:bg-slate-950 file:px-4 file:py-2 file:text-white hover:file:bg-slate-800"
              disabled={isBusy}
            />
            <p className="text-xs text-slate-500">
              Puedes subir el logo desde tu PC o celular. Formatos permitidos: {COMMUNITY_LOGO_ALLOWED_LABEL}. Maximo recomendado: {COMMUNITY_LOGO_DEFAULT_MAX_UPLOAD_MB} MB.
            </p>
            {pendingLogoFile ? (
              <p className="text-sm text-sky-700">
                Archivo listo para subir: {pendingLogoFile.name}
              </p>
            ) : null}
          </div>

          {previewUrl ? (
            <div className="overflow-hidden rounded-[1.5rem] border border-slate-200 bg-slate-50">
              <div className="flex min-h-56 items-center justify-center bg-white p-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Vista previa del logo de la comunidad"
                  className="max-h-40 w-full object-contain"
                />
              </div>
              <div className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
                Mostrando logo configurado para la comunidad.
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700" htmlFor="logoUrl">
                URL almacenada
              </label>
              <Input
                id="logoUrl"
                value={form.logoUrl}
                readOnly
                className="h-12 rounded-2xl border-slate-200 bg-slate-100 text-slate-500"
              />
            </div>

            <div className="flex items-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200"
                onClick={resetPendingLogo}
                disabled={!pendingLogoFile || isBusy}
              >
                Descartar archivo
              </Button>
              <Button
                type="button"
                variant="outline"
                className="rounded-full border-slate-200"
                onClick={clearLogo}
                disabled={isBusy || (!pendingLogoFile && !form.logoUrl)}
              >
                Quitar logo
              </Button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            className="rounded-full border-slate-200"
            onClick={() => router.push("/admin/comunidades")}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="rounded-full bg-slate-950 px-6 hover:bg-slate-800"
            disabled={isBusy}
          >
            {uploadingLogo
              ? "Subiendo logo..."
              : saving
                ? "Guardando..."
                : "Guardar comunidad"}
          </Button>
        </div>
      </form>
    </section>
  );
}
