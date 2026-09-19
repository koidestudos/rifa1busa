const MAX_EDGE = 1600;
const TARGET_BYTES = 900_000;
const SKIP_UNDER_BYTES = 900_000;

export function uploadActionErrorMessage(error: unknown) {
  const text = error instanceof Error ? error.message : String(error ?? "");
  if (/body exceeded|BodyExceeded|too large|PayloadTooLarge|413/i.test(text)) {
    return "A foto ficou grande demais. Tente tirar de novo ou envie um arquivo menor.";
  }
  return "Não foi possível enviar agora. Tente novamente.";
}

export async function prepareReceiptFile(file: File): Promise<File> {
  if (!file.size) {
    throw new Error("empty-receipt");
  }

  const type = file.type.toLowerCase();
  const alreadyOk =
    file.size <= SKIP_UNDER_BYTES &&
    (type === "image/jpeg" || type === "image/jpg" || type === "image/png" || type === "image/webp");
  if (alreadyOk) return file;

  const image = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("no-canvas");
    context.drawImage(image.source, 0, 0, width, height);

    let quality = 0.84;
    let blob = await canvasToJpeg(canvas, quality);
    while (blob.size > TARGET_BYTES && quality > 0.5) {
      quality -= 0.08;
      blob = await canvasToJpeg(canvas, quality);
    }

    return new File([blob], "comprovante.jpg", {
      type: "image/jpeg",
      lastModified: Date.now(),
    });
  } finally {
    image.close();
  }
}

function canvasToJpeg(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error("jpeg-failed"));
        else resolve(blob);
      },
      "image/jpeg",
      quality,
    );
  });
}

async function loadImage(file: File) {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
      return {
        width: bitmap.width,
        height: bitmap.height,
        source: bitmap,
        close: () => bitmap.close(),
      };
    } catch {
      // Safari/Android sometimes fail on HEIC or odd camera types; try HTMLImageElement.
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image();
      element.onload = () => resolve(element);
      element.onerror = () => reject(new Error("read-failed"));
      element.src = url;
    });
    return {
      width: image.naturalWidth || image.width,
      height: image.naturalHeight || image.height,
      source: image,
      close: () => undefined,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function assignFileToInput(input: HTMLInputElement | null, file: File) {
  if (!input) return;
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}
