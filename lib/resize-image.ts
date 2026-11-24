// Dipakai di browser sebelum mengunggah foto produk: foto HP bisa 5-10 MB,
// diperkecil dulu supaya cepat diunggah dan muat di batas ukuran Server Action.

const MAX_SIDE = 1600;

/** Perkecil foto ke sisi terpanjang 1600 px dalam format WebP. Kalau browser tidak bisa membacanya, file asli dikembalikan. */
export async function resizeImage(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.85));
    if (!blob || blob.type !== "image/webp") return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".webp", { type: "image/webp" });
  } catch {
    return file;
  }
}
