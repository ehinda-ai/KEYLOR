import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ImageUploaderProps {
  onUploadComplete: (imagePath: string) => void;
  currentImage?: string | null;
  maxFileSizeMB?: number;
}

export function ImageUploader({
  onUploadComplete,
  currentImage,
  maxFileSizeMB = 10,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage || null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setError("Veuillez sélectionner une image");
      return;
    }

    // Vérifier la taille
    const maxSize = maxFileSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`L'image ne doit pas dépasser ${maxFileSizeMB}MB`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      // Créer une preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Obtenir l'extension du fichier
      const fileExtension = file.name.split('.').pop() || 'jpg';

      // Obtenir l'URL d'upload signée
      const response = await apiRequest("POST", "/api/upload/get-url", { fileExtension });
      const { uploadURL, objectPath } = await response.json();

      // Upload le fichier directement sur Google Cloud Storage
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: {
          "Content-Type": file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Erreur lors de l'upload du fichier");
      }

      // Notifier le parent avec le chemin de l'objet
      onUploadComplete(objectPath);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError("Erreur lors de l'upload de l'image");
      setPreview(currentImage || null);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="image-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          data-testid="button-select-image"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Choisir une image
            </>
          )}
        </Button>

        {preview && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleRemove}
            disabled={uploading}
            data-testid="button-remove-image"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-destructive" data-testid="text-upload-error">
          {error}
        </p>
      )}

      {preview && (
        <div className="relative w-full max-w-sm rounded-lg overflow-hidden border" data-testid="image-preview">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-48 object-cover"
          />
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Formats acceptés : JPG, PNG, GIF. Taille max : {maxFileSizeMB}MB
      </p>
    </div>
  );
}
