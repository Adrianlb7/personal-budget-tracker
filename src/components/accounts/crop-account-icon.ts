export const ICON_CROP_SIZE = 256;
export const ICON_OUTPUT_SIZE = 512;

export type CropOffset = { x: number; y: number };

export type CropRect = CropOffset & { width: number; height: number };

/** Cover a square viewport without adding a background behind transparent pixels. */
export function getIconCropRect(
  imageWidth: number,
  imageHeight: number,
  zoom: number,
  offset: CropOffset,
  viewportSize = ICON_CROP_SIZE,
): CropRect {
  const scale = (viewportSize / Math.min(imageWidth, imageHeight)) * zoom;
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  const maxX = Math.max(0, (width - viewportSize) / 2);
  const maxY = Math.max(0, (height - viewportSize) / 2);
  const x = Math.min(maxX, Math.max(-maxX, offset.x));
  const y = Math.min(maxY, Math.max(-maxY, offset.y));

  return {
    x: (viewportSize - width) / 2 + x,
    y: (viewportSize - height) / 2 + y,
    width,
    height,
  };
}

export async function cropAccountIconToPng(
  image: HTMLImageElement,
  zoom: number,
  offset: CropOffset,
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = ICON_OUTPUT_SIZE;
  canvas.height = ICON_OUTPUT_SIZE;

  const context = canvas.getContext("2d");
  if (!context)
    throw new Error("Image cropping is unavailable in this browser.");

  const rect = getIconCropRect(
    image.naturalWidth,
    image.naturalHeight,
    zoom,
    offset,
  );
  context.clearRect(0, 0, ICON_OUTPUT_SIZE, ICON_OUTPUT_SIZE);
  context.scale(
    ICON_OUTPUT_SIZE / ICON_CROP_SIZE,
    ICON_OUTPUT_SIZE / ICON_CROP_SIZE,
  );
  context.drawImage(image, rect.x, rect.y, rect.width, rect.height);

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) =>
        result
          ? resolve(result)
          : reject(new Error("The image could not be cropped.")),
      "image/png",
    );
  });

  return new File([blob], "account-icon.png", { type: "image/png" });
}
