import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, MoveUp, MoveDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";

interface MultipleImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  maxFileSizeMB?: number;
}

export function MultipleImageUploader({
  images,
  onChange,
  maxImages = 10,
  maxFileSizeMB = 10,
}: MultipleImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    // Vérifier qu'on ne dépasse pas le nombre max d'images
    if (images.length + files.length > maxImages) {
      setError(`Vous ne pouvez ajouter que ${maxImages} images maximum`);
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const uploadedPaths: string[] = [];

      for (const file of files) {
        // Vérifier le type de fichier
        if (!file.type.startsWith('image/')) {
          continue;
        }

        // Vérifier la taille
        const maxSize = maxFileSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
          setError(`L'image ${file.name} ne doit pas dépasser ${maxFileSizeMB}MB`);
          continue;
        }

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
          throw new Error(`Erreur lors de l'upload du fichier ${file.name}`);
        }

        uploadedPaths.push(objectPath);
      }

      // Ajouter les nouvelles images à la liste
      onChange([...images, ...uploadedPaths]);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError("Erreur lors de l'upload des images");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    const newImages = [...images];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newImages.length) return;
    
    [newImages[index], newImages[targetIndex]] = [newImages[targetIndex], newImages[index]];
    onChange(newImages);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          id="multiple-image-upload"
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || images.length >= maxImages}
          data-testid="button-select-images"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Upload en cours...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Ajouter des images ({images.length}/{maxImages})
            </>
          )}
        </Button>
      </div>

      {error && (
        <p className="text-sm text-destructive" data-testid="text-upload-error">
          {error}
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={index} className="relative group overflow-hidden" data-testid={`image-preview-${index}`}>
              <div className="aspect-video relative">
                <img
                  src={image}
                  alt={`Image ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveImage(index, 'up')}
                    disabled={index === 0}
                    className="text-white hover:bg-white/20"
                    data-testid={`button-move-up-${index}`}
                  >
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(index)}
                    className="text-white hover:bg-white/20"
                    data-testid={`button-remove-${index}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => moveImage(index, 'down')}
                    disabled={index === images.length - 1}
                    className="text-white hover:bg-white/20"
                    data-testid={`button-move-down-${index}`}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {index === 0 && (
                <div className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded">
                  Photo principale
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Formats acceptés : JPG, PNG, GIF. Taille max : {maxFileSizeMB}MB par image. Max {maxImages} images.
        {images.length > 0 && " La première image sera la photo principale de l'annonce."}
      </p>
    </div>
  );
}
