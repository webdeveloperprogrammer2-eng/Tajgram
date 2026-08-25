// ============================================================
//  app/profile/toJpeg.ts
//
//  MUAMMO: backend faqat ba'ze namudi suratro qabul mekunad.
//  Agar korbar .webp / .avif / .jfif / .heic intikhob kunad,
//  server javob medihad: "Unexpected field (Image: unsupported file type)".
//
//  HALL: pesh az firistodan suratro DAR BROWSER ba JPEG
//  meguzaronem (canvas). Ba'di in server hamesha onro meshinosad.
//  Hamzamon suratho khurdtar meshavand - tezar bor meshavand.
//
//  Hech so-rov ba server in jo nest.
// ============================================================

const MAX_SIDE = 1600; // tarafi kalontarin (piksel)
const QUALITY = 0.9;

export async function toJpegFile(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file);

    // Andozai nav - nisbati tarafho nigoh doshta meshavad
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (context === null) return file;

    // JPEG shaffofi (transparent) nadorad -> foni safed meguzorem
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY)
    );

    if (blob === null) return file;

    // Nomi nav - hatman bo ".jpg" (ba'ze serverho ba nomi fayl nigoh mekunand)
    // Faqat harfhoi lotini va raqam - ba'ze serverho nomi rusi/tojikiro
    // qabul namekunand.
    const name =
      file.name.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "") ||
      "image";

    return new File([blob], `${name}-${Date.now()}.jpg`, {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } catch {
    // Agar browser in namudro khonda natavonad - fayli asliro mefiristem
    return file;
  }
}
