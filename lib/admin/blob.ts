import "server-only";
import { del, put } from "@vercel/blob";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp" };

export const hasBlobStorage = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID);
const isBlobUrl = (url: string | null | undefined): url is string => !!url && /^https:\/\/[^/]+\.blob\.vercel-storage\.com\//.test(url);

/**
 * Validasi lalu simpan foto dari form (isian "image") ke Vercel Blob di `folder/id.ext`.
 * Mengembalikan URL publik, atau pesan error untuk ditampilkan ke admin.
 */
export async function storeImage(folder: string, id: string, formData: FormData): Promise<{ url: string } | { error: string }> {
  if (!hasBlobStorage()) return { error: "Penyimpanan foto belum disiapkan. Hubungkan Vercel Blob ke project ini dulu." };
  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { error: "Pilih foto dulu." };
  const ext = IMAGE_TYPES[file.type];
  if (!ext) return { error: "Foto harus JPG, PNG, atau WebP." };
  if (file.size > MAX_IMAGE_BYTES) return { error: "Ukuran foto maksimal 4 MB." };
  const blob = await put(`${folder}/${id}.${ext}`, file, { access: "public", addRandomSuffix: true, contentType: file.type });
  return { url: blob.url };
}

/** Hapus foto lama bila tersimpan di Blob (foto bawaan di /public dibiarkan). Gagal hapus tidak menggagalkan aksi. */
export async function removeImage(url: string | null | undefined) {
  if (isBlobUrl(url)) await del(url).catch(() => {});
}
