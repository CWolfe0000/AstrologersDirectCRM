"use client";

export /** Crop the middle square of a photo and shrink it to 400px (a small JPEG the public page can carry). */
async function squarePhoto(file: File): Promise<string> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use a JPEG, PNG or WebP photo.");
  if (file.size > 15 * 1024 * 1024) throw new Error("That photo is over 15 MB. Try a smaller one.");
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = () => rej(new Error("We couldn’t read that photo.")); i.src = url; });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 400;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("We couldn’t read that photo.");
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 400, 400);
    for (const q of [0.85, 0.7, 0.55]) {
      const out = canvas.toDataURL("image/jpeg", q);
      if (out.length < 240_000) return out;
    }
    throw new Error("That photo is too detailed to shrink. Try another.");
  } finally {
    URL.revokeObjectURL(url);
  }
}
