import { vi } from "vitest";
import {
  cropAccountIconToPng,
  getIconCropRect,
  ICON_OUTPUT_SIZE,
} from "./crop-account-icon";

describe("account icon cropping", () => {
  it("keeps a landscape photo square while allowing horizontal repositioning", () => {
    expect(getIconCropRect(400, 200, 1, { x: 500, y: 0 })).toEqual({
      x: 0,
      y: 0,
      width: 512,
      height: 256,
    });
    expect(getIconCropRect(400, 200, 1, { x: -500, y: 0 }).x).toBe(-256);
  });

  it("exports PNG without painting over transparent pixels", async () => {
    const clearRect = vi.fn();
    const drawImage = vi.fn();
    const fillRect = vi.fn();
    const scale = vi.fn();
    const context = { clearRect, drawImage, fillRect, scale };
    const getContext = vi
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(context as unknown as CanvasRenderingContext2D);
    const toBlob = vi
      .spyOn(HTMLCanvasElement.prototype, "toBlob")
      .mockImplementation((callback) => {
        callback(
          new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
        );
      });

    try {
      const image = {
        naturalWidth: 256,
        naturalHeight: 256,
      } as HTMLImageElement;
      const file = await cropAccountIconToPng(image, 1, { x: 0, y: 0 });

      expect(file.type).toBe("image/png");
      expect(clearRect).toHaveBeenCalledWith(
        0,
        0,
        ICON_OUTPUT_SIZE,
        ICON_OUTPUT_SIZE,
      );
      expect(drawImage).toHaveBeenCalledOnce();
      expect(fillRect).not.toHaveBeenCalled();
    } finally {
      getContext.mockRestore();
      toBlob.mockRestore();
    }
  });
});
