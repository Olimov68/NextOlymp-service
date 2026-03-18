"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import { Upload, X, Loader2, ImageIcon, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value?: string;
  onChange?: (url: string) => void;
  onFileSelect?: (file: File) => void;
  uploadFn?: (file: File) => Promise<string>;
  accept?: string;
  maxSizeMB?: number;
  className?: string;
  label?: string;
  placeholder?: string;
  aspectRatio?: string;
  rounded?: boolean;
  disabled?: boolean;
}

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "https://nextolymp.uz/api/v1").replace(/\/api\/v1$/, "");

function getImageUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http") || url.startsWith("data:") || url.startsWith("blob:")) return url;
  return `${BACKEND_URL}${url}`;
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function ImageUpload({
  value,
  onChange,
  onFileSelect,
  uploadFn,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSizeMB = 5,
  className = "",
  label,
  placeholder = "Rasm yuklash",
  aspectRatio = "aspect-video",
  rounded = false,
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string>("");
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    if (value) {
      setPreview(getImageUrl(value));
    }
  }, [value]);

  const handleFile = useCallback(async (file: File) => {
    setError("");

    // Validate type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Faqat JPG, PNG, WebP va GIF rasm formatlari qabul qilinadi");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Rasm hajmi ${maxSizeMB}MB dan oshmasligi kerak`);
      return;
    }

    // Show local preview immediately
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);

    // Notify parent
    onFileSelect?.(file);

    // Upload if uploadFn provided
    if (uploadFn) {
      setUploading(true);
      try {
        const url = await uploadFn(file);
        setPreview(getImageUrl(url));
        onChange?.(url);
      } catch {
        setError("Rasm yuklashda xatolik yuz berdi");
        setPreview(value ? getImageUrl(value) : "");
      } finally {
        setUploading(false);
      }
    }
  }, [uploadFn, onChange, onFileSelect, maxSizeMB, value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleRemove = () => {
    setPreview("");
    setError("");
    onChange?.("");
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <label className="text-sm font-medium text-foreground">{label}</label>}

      <div
        className={`relative border-2 border-dashed transition-colors overflow-hidden cursor-pointer
          ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}
          ${rounded ? "rounded-full" : "rounded-xl"}
          ${aspectRatio}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); if (!disabled) setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={!disabled ? handleDrop : undefined}
      >
        {/* Preview */}
        {preview ? (
          <div className="absolute inset-0">
            <img
              src={preview}
              alt="Preview"
              className={`w-full h-full object-cover ${rounded ? "rounded-full" : ""}`}
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              {!disabled && (
                <>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-8 text-xs"
                    onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" /> Almashtirish
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="h-8 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleRemove(); }}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </>
              )}
            </div>
            {/* Upload spinner overlay */}
            {uploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-white animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4">
            <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground text-center">{placeholder}</span>
            <span className="text-[10px] text-muted-foreground/60">JPG, PNG, WebP, GIF (max {maxSizeMB}MB)</span>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-destructive text-xs">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </div>
      )}

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
}
