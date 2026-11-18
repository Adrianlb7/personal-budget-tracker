import { isValidAccountEmoji, isValidAccountIconPng } from "./icon-validation";

const onePixelPng = Uint8Array.from(
  atob(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGNgAAIAAAUAAXpeqz8AAAAASUVORK5CYII=",
  ),
  (character) => character.charCodeAt(0),
);

describe("account icon input validation", () => {
  it("accepts a valid square PNG and rejects malformed or truncated uploads", () => {
    expect(isValidAccountIconPng(onePixelPng, "image/png")).toBe(true);
    expect(isValidAccountIconPng(onePixelPng, "image/jpeg")).toBe(false);
    expect(isValidAccountIconPng(onePixelPng.slice(0, -2), "image/png")).toBe(
      false,
    );

    const tampered = onePixelPng.slice();
    tampered[19] = 2;
    expect(isValidAccountIconPng(tampered, "image/png")).toBe(false);
  });

  it("accepts one emoji grapheme, including variants, but rejects arbitrary text", () => {
    expect(isValidAccountEmoji("🎧")).toBe(true);
    expect(isValidAccountEmoji("👍🏽")).toBe(true);
    expect(isValidAccountEmoji("hello")).toBe(false);
    expect(isValidAccountEmoji("🎧🎵")).toBe(false);
  });
});
