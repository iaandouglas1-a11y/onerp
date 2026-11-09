import { createServerSupabaseClient } from "@/lib/supabaseClient";

export const LOGOS_BUCKET = "logos";

/**
 * Faz upload de uma imagem de logo (banco/cartão) para o Supabase Storage
 * e retorna a URL pública. Retorna null se nenhum arquivo válido for enviado.
 */
export async function uploadLogo(
  file: File | null,
  folder: "contas" | "cartoes"
): Promise<string | null> {
  if (!file || file.size === 0) return null;

  const allowed = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
  if (file.type && !allowed.includes(file.type)) {
    throw new Error("Formato de imagem inválido. Use PNG, JPG, WEBP ou SVG.");
  }
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("A imagem da logo deve ter no máximo 2MB.");
  }

  const s = await createServerSupabaseClient();
  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;

  const { error } = await s.storage.from(LOGOS_BUCKET).upload(path, file, {
    cacheControl: "3600",
    upsert: false,
    contentType: file.type || "image/png",
  });
  if (error) throw new Error(`Erro ao enviar logo: ${error.message}`);

  const { data } = s.storage.from(LOGOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
