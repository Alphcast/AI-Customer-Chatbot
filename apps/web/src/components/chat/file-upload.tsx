'use client';

import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react';
import { Paperclip, X, File, Image, Upload, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const ACCEPTED_TYPES = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'],
  document: ['.pdf', '.doc', '.docx', '.txt', '.csv', '.xlsx', '.pptx'],
  audio: ['.mp3', '.wav', '.ogg', '.m4a'],
};

export const SUPPORTED_FORMATS = [...ACCEPTED_TYPES.image, ...ACCEPTED_TYPES.document, ...ACCEPTED_TYPES.audio].join(', ');

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

type FilePreview = {
  file: File;
  preview: string | null;
  progress: number;
  error: string | null;
};

interface FileUploadProps {
  onSend: (files: File[]) => void;
  disabled?: boolean;
  uploading?: boolean;
}

export function FileUpload({ onSend, disabled, uploading }: FileUploadProps) {
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback((files: FileList | File[]) => {
    const newPreviews: FilePreview[] = Array.from(files)
      .filter((file) => {
        if (file.size > MAX_FILE_SIZE) {
          return false;
        }
        return true;
      })
      .map((file) => ({
        file,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        progress: 0,
        error: file.size > MAX_FILE_SIZE ? 'File exceeds 25MB limit' : null,
      }));

    setPreviews((prev) => [...prev, ...newPreviews]);
  }, []);

  const handleFileSelect = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        processFiles(e.target.files);
        e.target.value = '';
      }
    },
    [processFiles],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      if (e.dataTransfer.files) {
        processFiles(e.dataTransfer.files);
      }
    },
    [processFiles],
  );

  const removePreview = useCallback((index: number) => {
    setPreviews((prev) => {
      const file = prev[index];
      if (file?.preview) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const sendFiles = useCallback(() => {
    const validFiles = previews.filter((p) => !p.error).map((p) => p.file);
    if (validFiles.length > 0) {
      onSend(validFiles);
      setPreviews([]);
    }
  }, [previews, onSend]);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return Image;
    return File;
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={SUPPORTED_FORMATS}
        onChange={handleFileSelect}
        className="hidden"
        aria-hidden="true"
      />

      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => inputRef.current?.click()}
        disabled={disabled || uploading}
        aria-label="Attach file"
      >
        <Paperclip className="h-5 w-5" />
      </Button>

      {(previews.length > 0 || isDragOver) && (
        <div
          className={cn(
            'absolute bottom-16 left-0 right-0 p-3 border-t bg-background rounded-lg shadow-lg',
            isDragOver && 'ring-2 ring-primary',
          )}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          role="region"
          aria-label="File previews"
        >
          {isDragOver ? (
            <div className="flex flex-col items-center justify-center py-8 border-2 border-dashed rounded-lg text-muted-foreground">
              <Upload className="h-8 w-8 mb-2" />
              <p className="text-sm font-medium">Drop files here</p>
              <p className="text-xs">Supported: images, documents, audio</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-2 max-h-32 overflow-y-auto scrollbar-thin">
                {previews.map((preview, index) => {
                  const FileIcon = getFileIcon(preview.file);
                  return (
                    <div
                      key={`${preview.file.name}-${index}`}
                      className={cn(
                        'relative flex items-center gap-2 p-2 rounded-lg border bg-muted/50 text-sm',
                        preview.error && 'border-destructive',
                      )}
                    >
                      {preview.preview ? (
                        <img
                          src={preview.preview}
                          alt={preview.file.name}
                          className="h-10 w-10 object-cover rounded"
                        />
                      ) : (
                        <FileIcon className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-xs font-medium">{preview.file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(preview.file.size / 1024).toFixed(1)} KB
                        </p>
                        {preview.error && (
                          <p className="text-xs text-destructive flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {preview.error}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => removePreview(index)}
                        className="p-0.5 hover:bg-accent rounded transition-colors"
                        aria-label={`Remove ${preview.file.name}`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {uploading && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${preview.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Supported: {SUPPORTED_FORMATS.split(', ').slice(0, 5).join(', ')}
                  {SUPPORTED_FORMATS.split(', ').length > 5 && '...'}
                </p>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      previews.forEach((p) => p.preview && URL.revokeObjectURL(p.preview));
                      setPreviews([]);
                    }}
                  >
                    Clear
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={sendFiles}
                    disabled={uploading || !previews.some((p) => !p.error)}
                    isLoading={uploading}
                  >
                    Send {previews.length > 1 ? `(${previews.length})` : ''}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
