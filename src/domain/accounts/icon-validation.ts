export const MAX_ACCOUNT_ICON_BYTES = 2 * 1024 * 1024;
export const MAX_ACCOUNT_ICON_DIMENSION = 1024;

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];
const EMOJI_CHARACTER =
  /[\p{Extended_Pictographic}\p{Regional_Indicator}\p{Emoji_Modifier}\u20e3]/u;

const CRC_TABLE = new Uint32Array(256);
for (let entry = 0; entry < CRC_TABLE.length; entry++) {
  let value = entry;
  for (let bit = 0; bit < 8; bit++) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  CRC_TABLE[entry] = value >>> 0;
}

function pngCrc(bytes: Uint8Array, start: number, end: number): number {
  let crc = 0xffffffff;
  for (let index = start; index < end; index++) {
    crc = CRC_TABLE[(crc ^ bytes[index]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function hasChunkName(bytes: Uint8Array, offset: number, name: string) {
  return [...name].every(
    (character, index) => bytes[offset + index] === character.charCodeAt(0),
  );
}

export function isValidAccountEmoji(value: string): boolean {
  const emoji = value.trim();
  return (
    emoji.length > 0 &&
    Array.from(emoji).length <= 32 &&
    Array.from(
      new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(emoji),
    ).length === 1 &&
    EMOJI_CHARACTER.test(emoji)
  );
}

export function isValidAccountIconPng(
  bytes: Uint8Array,
  mimeType: string,
): boolean {
  if (
    mimeType !== "image/png" ||
    bytes.length < 45 ||
    bytes.length > MAX_ACCOUNT_ICON_BYTES ||
    !PNG_SIGNATURE.every((byte, index) => bytes[index] === byte)
  )
    return false;

  const png = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = PNG_SIGNATURE.length;
  let sawHeader = false;
  let sawData = false;

  while (offset + 12 <= bytes.length) {
    const length = png.getUint32(offset);
    const end = offset + 12 + length;
    if (end > bytes.length) return false;

    const isHeader = hasChunkName(bytes, offset + 4, "IHDR");
    const isData = hasChunkName(bytes, offset + 4, "IDAT");
    const isEnd = hasChunkName(bytes, offset + 4, "IEND");
    if (!sawHeader) {
      if (!isHeader || length !== 13) return false;
      const width = png.getUint32(offset + 8);
      const height = png.getUint32(offset + 12);
      if (
        width === 0 ||
        width !== height ||
        width > MAX_ACCOUNT_ICON_DIMENSION ||
        bytes[offset + 18] !== 0 ||
        bytes[offset + 19] !== 0 ||
        bytes[offset + 20] > 1
      )
        return false;
      sawHeader = true;
    } else if (isHeader) {
      return false;
    }

    if (
      pngCrc(bytes, offset + 4, offset + 8 + length) !== png.getUint32(end - 4)
    ) {
      return false;
    }
    if (isData && length > 0) sawData = true;
    if (isEnd) return sawData && length === 0 && end === bytes.length;
    offset = end;
  }

  return false;
}
