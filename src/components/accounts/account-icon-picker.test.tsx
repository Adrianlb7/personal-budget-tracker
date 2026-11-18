import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, vi } from "vitest";
import { AccountIconPicker } from "./account-icon-picker";

vi.mock("next/dynamic", () => ({
  default: () => () => <div>Emoji catalog</div>,
}));

// A real, lossless 1 × 1 WebP. Safari can report an empty MIME type for this file.
const webpBytes = Uint8Array.from(
  atob("UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=="),
  (character) => character.charCodeAt(0),
);

class DecodedImage {
  naturalWidth = 1;
  naturalHeight = 1;
  onload: ((event: Event) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  set src(_value: string) {
    queueMicrotask(() => this.onload?.(new Event("load")));
  }
}

class TestURL extends URL {
  static createObjectURL = vi.fn((blob: Blob) => {
    void blob;
    return "blob:account-icon-test";
  });
  static revokeObjectURL = vi.fn();
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  TestURL.createObjectURL.mockClear();
  TestURL.revokeObjectURL.mockClear();
});

it.each(["", "application/octet-stream", "image/webp"])(
  "accepts a WebP reported as %j and saves its square crop as PNG",
  async (mimeType) => {
    vi.stubGlobal("Image", DecodedImage);
    vi.stubGlobal("URL", TestURL);
    const context = {
      clearRect: vi.fn(),
      drawImage: vi.fn(),
      scale: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
      context as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      (callback) =>
        callback(
          new Blob([new Uint8Array([137, 80, 78, 71])], { type: "image/png" }),
        ),
    );

    const onImageFileChange = vi.fn();
    const user = userEvent.setup();
    render(<AccountIconPicker onImageFileChange={onImageFileChange} />);

    await user.click(screen.getByRole("button", { name: /choose an icon/i }));
    await user.click(screen.getByRole("tab", { name: "Image" }));
    const input = screen.getByLabelText("Choose an image") as HTMLInputElement;
    expect(input.accept).toContain(".webp");

    await user.upload(
      input,
      new File([webpBytes], "headphones.webp", { type: mimeType }),
    );
    await waitFor(() =>
      expect(
        screen.getByLabelText("Drag to position the square image crop"),
      ).toBeInTheDocument(),
    );
    expect((TestURL.createObjectURL.mock.calls[0][0] as Blob).type).toBe(
      "image/webp",
    );

    await user.click(screen.getByRole("button", { name: "Use image" }));
    await waitFor(() => expect(onImageFileChange).toHaveBeenCalledOnce());
    expect(onImageFileChange.mock.calls[0][0]).toMatchObject({
      name: "account-icon.png",
      type: "image/png",
    });
    expect(context.drawImage).toHaveBeenCalledOnce();
  },
);
