"use client";

import dynamic from "next/dynamic";
import { Camera, ChevronRight, RotateCcw, Smile, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import "./account-icon-picker.css";
import {
  cropAccountIconToPng,
  getIconCropRect,
  ICON_CROP_SIZE,
  type CropOffset,
} from "./crop-account-icon";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), {
  ssr: false,
  loading: () => <div className="account-emoji-loading">Loading emojis…</div>,
});

type PickerTab = "emoji" | "image";

function clampOffset(
  image: HTMLImageElement,
  zoom: number,
  offset: CropOffset,
): CropOffset {
  const rect = getIconCropRect(
    image.naturalWidth,
    image.naturalHeight,
    zoom,
    offset,
  );
  return {
    x: rect.x - (ICON_CROP_SIZE - rect.width) / 2,
    y: rect.y - (ICON_CROP_SIZE - rect.height) / 2,
  };
}

export function AccountIconPicker({
  initialEmoji,
  initialImageUrl,
  onImageFileChange,
}: {
  initialEmoji?: string | null;
  initialImageUrl?: string | null;
  onImageFileChange: (file: File | null) => void;
}) {
  const [emoji, setEmoji] = useState(initialEmoji ?? "");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [removed, setRemoved] = useState(false);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<PickerTab>("emoji");
  const [sourceUrl, setSourceUrl] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState<CropOffset>({ x: 0, y: 0 });
  const [error, setError] = useState("");
  const [savingCrop, setSavingCrop] = useState(false);
  const [pickerTheme, setPickerTheme] = useState<"light" | "dark">("light");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previewUrlRef = useRef<string | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    offset: CropOffset;
  } | null>(null);

  useEffect(
    () => () => {
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!sourceUrl) return;
    const image = new window.Image();
    image.onload = () => {
      setSourceImage(image);
      setError("");
    };
    image.onerror = () => setError("This image could not be opened.");
    image.src = sourceUrl;
    return () => {
      image.onload = null;
      image.onerror = null;
      URL.revokeObjectURL(sourceUrl);
    };
  }, [sourceUrl]);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const updateTheme = () =>
      setPickerTheme(
        document.documentElement.dataset.theme === "dark" ? "dark" : "light",
      );
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => {
      observer.disconnect();
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  const currentImage = removed
    ? null
    : imagePreview || (emoji ? null : initialImageUrl);
  const hasCustomIcon = Boolean(emoji || currentImage);
  const rect = sourceImage
    ? getIconCropRect(
        sourceImage.naturalWidth,
        sourceImage.naturalHeight,
        zoom,
        offset,
      )
    : null;

  function closePicker() {
    setOpen(false);
    setSourceImage(null);
    setSourceUrl(null);
    setError("");
  }

  function clearSelectedImage() {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    previewUrlRef.current = null;
    setImagePreview(null);
    onImageFileChange(null);
  }

  function selectEmoji(value: string) {
    setEmoji(value);
    clearSelectedImage();
    setRemoved(false);
    closePicker();
  }

  function useDefaultIcon() {
    setEmoji("");
    clearSelectedImage();
    setRemoved(true);
    closePicker();
  }

  function chooseImage(file: File | undefined) {
    if (!file) return;
    const webpWithoutMime =
      /\.webp$/i.test(file.name) &&
      (file.type === "" || file.type === "application/octet-stream");
    if (
      (!file.type.startsWith("image/") && !webpWithoutMime) ||
      file.type === "image/svg+xml"
    ) {
      setError("Choose a PNG, JPEG, WebP, or supported photo.");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setError("Choose an image under 15 MB.");
      return;
    }
    setError("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setSourceImage(null);
    setSourceUrl(
      URL.createObjectURL(
        webpWithoutMime ? file.slice(0, file.size, "image/webp") : file,
      ),
    );
    setTab("image");
  }

  async function saveImage() {
    if (!sourceImage) return;
    setSavingCrop(true);
    setError("");
    try {
      const file = await cropAccountIconToPng(sourceImage, zoom, offset);
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      const previewUrl = URL.createObjectURL(file);
      previewUrlRef.current = previewUrl;
      setImagePreview(previewUrl);
      onImageFileChange(file);
      setEmoji("");
      setRemoved(false);
      closePicker();
    } catch {
      setError("The image could not be cropped. Try another photo.");
    } finally {
      setSavingCrop(false);
    }
  }

  return (
    <div className="account-icon-field">
      <input name="iconEmoji" type="hidden" value={emoji} />
      {removed && <input name="removeIcon" type="hidden" value="true" />}
      <span className="account-icon-label">Icon</span>
      <button
        className="account-icon-choice"
        onClick={() => {
          setTab(emoji || !currentImage ? "emoji" : "image");
          setOpen(true);
        }}
        type="button"
      >
        <span
          aria-hidden="true"
          className={`account-icon-preview ${currentImage ? "account-icon-preview-image" : ""}`}
        >
          {currentImage ? (
            <span
              className="account-icon-preview-photo"
              style={{ backgroundImage: `url("${currentImage}")` }}
            />
          ) : emoji ? (
            emoji
          ) : (
            <Smile size={24} strokeWidth={1.7} />
          )}
        </span>
        <span className="account-icon-choice-copy">
          <strong>{hasCustomIcon ? "Change icon" : "Choose an icon"}</strong>
          <small>Emoji or image</small>
        </span>
        <ChevronRight aria-hidden="true" size={18} />
      </button>

      {open && (
        <div
          className="account-icon-overlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closePicker();
          }}
        >
          <div
            aria-label="Choose account icon"
            aria-modal="true"
            className="account-icon-dialog"
            onKeyDown={(event) => {
              if (event.key === "Escape") closePicker();
            }}
            role="dialog"
          >
            <div className="account-icon-dialog-header">
              <div>
                <h2>Account icon</h2>
                <p>Make this account easy to spot.</p>
              </div>
              <button
                aria-label="Close icon picker"
                className="account-icon-close"
                onClick={closePicker}
                ref={closeButtonRef}
                type="button"
              >
                <X size={18} />
              </button>
            </div>

            <div
              aria-label="Icon source"
              className="account-icon-tabs"
              role="tablist"
            >
              <button
                aria-selected={tab === "emoji"}
                className="account-icon-tab"
                onClick={() => setTab("emoji")}
                role="tab"
                type="button"
              >
                <Smile size={17} /> Emoji
              </button>
              <button
                aria-selected={tab === "image"}
                className="account-icon-tab"
                onClick={() => setTab("image")}
                role="tab"
                type="button"
              >
                <Camera size={17} /> Image
              </button>
            </div>

            {tab === "emoji" ? (
              <div className="account-emoji-panel" role="tabpanel">
                <EmojiPicker
                  colorScheme={pickerTheme}
                  emojiStyle="native"
                  height={360}
                  lazyLoadEmojis
                  onEmojiClick={(value) => selectEmoji(value.emoji)}
                  previewConfig={{ showPreview: false }}
                  width="100%"
                />
              </div>
            ) : (
              <div className="account-image-panel" role="tabpanel">
                <input
                  accept="image/*,.webp"
                  aria-label="Choose an image"
                  className="sr-only"
                  onChange={(event) => {
                    chooseImage(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                  ref={fileInputRef}
                  type="file"
                />
                {sourceUrl && rect ? (
                  <>
                    <div
                      aria-label="Drag to position the square image crop"
                      className="account-crop-viewport"
                      onPointerDown={(event) => {
                        if (!sourceImage) return;
                        event.currentTarget.setPointerCapture(event.pointerId);
                        dragRef.current = {
                          pointerId: event.pointerId,
                          x: event.clientX,
                          y: event.clientY,
                          offset,
                        };
                      }}
                      onPointerMove={(event) => {
                        const drag = dragRef.current;
                        if (
                          !drag ||
                          drag.pointerId !== event.pointerId ||
                          !sourceImage
                        )
                          return;
                        setOffset(
                          clampOffset(sourceImage, zoom, {
                            x: drag.offset.x + event.clientX - drag.x,
                            y: drag.offset.y + event.clientY - drag.y,
                          }),
                        );
                      }}
                      onPointerUp={() => {
                        dragRef.current = null;
                      }}
                      onPointerCancel={() => {
                        dragRef.current = null;
                      }}
                    >
                      <span
                        aria-hidden="true"
                        className="account-crop-image"
                        style={{
                          backgroundImage: `url("${sourceUrl}")`,
                          height: rect.height,
                          left: rect.x,
                          top: rect.y,
                          width: rect.width,
                        }}
                      />
                    </div>
                    <div className="account-crop-controls">
                      <label htmlFor="account-icon-zoom">Zoom</label>
                      <input
                        id="account-icon-zoom"
                        max="4"
                        min="1"
                        onChange={(event) => {
                          const value = Number(event.target.value);
                          setZoom(value);
                          if (sourceImage)
                            setOffset((current) =>
                              clampOffset(sourceImage, value, current),
                            );
                        }}
                        step="0.01"
                        type="range"
                        value={zoom}
                      />
                      <button
                        aria-label="Reset crop"
                        className="account-crop-reset"
                        onClick={() => {
                          setZoom(1);
                          setOffset({ x: 0, y: 0 });
                        }}
                        type="button"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                    <div className="account-crop-actions">
                      <button
                        className="account-icon-secondary"
                        onClick={() => fileInputRef.current?.click()}
                        type="button"
                      >
                        Change image
                      </button>
                      <button
                        className="account-icon-primary"
                        disabled={savingCrop}
                        onClick={saveImage}
                        type="button"
                      >
                        {savingCrop ? "Applying…" : "Use image"}
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    className="account-image-upload"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <Camera aria-hidden="true" size={24} strokeWidth={1.6} />
                    <strong>Choose an image</strong>
                    <span>Crop and zoom it to a square</span>
                  </button>
                )}
              </div>
            )}

            {error && (
              <p className="account-icon-error" role="alert">
                {error}
              </p>
            )}
            {hasCustomIcon && (
              <button
                className="account-icon-remove"
                onClick={useDefaultIcon}
                type="button"
              >
                Use default icon
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
