import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { getDataloom } from '@lark-apaas/client-toolkit/dataloom';
import { getDefaultBucketId } from '@lark-apaas/client-toolkit/tools/storage';
import { uploadFile as uploadToStorage } from '@client/src/components/business-ui/api/files/service';
import { Button } from '@client/src/components/ui/button';
import { Progress } from '@client/src/components/ui/progress';
import Image from '@client/src/components/ui/image';

export interface AttachmentItem {
  url: string;
  fileName: string;
}

interface ImageUploaderProps {
  value: AttachmentItem[];
  onChange: (items: AttachmentItem[]) => void;
  maxCount?: number;
}

export function ImageUploader({
  value,
  onChange,
  maxCount = 9,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSelect = () => {
    inputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const remaining = maxCount - value.length;
    const filesToUpload = Array.from(files).slice(0, remaining);

    setUploading(true);
    setProgress(0);

    try {
      const newItems: AttachmentItem[] = [];

      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        const result = await uploadToStorage(file);
        const perFile = 100 / filesToUpload.length;
        setProgress(Math.floor((i + 1) * perFile));
        newItems.push({
          url: result.url,
          fileName: file.name,
        });
      }

      onChange([...value, ...newItems]);
      setProgress(100);
    } catch (err) {
      logger.error('图片上传失败', String(err));
    } finally {
      setUploading(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const next = [...value];
    next.splice(index, 1);
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-2">
        {value.map((item, index) => (
          <div
            key={index}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted group"
          >
            <Image
              src={item.url}
              alt={item.fileName}
              className="w-full h-full object-cover"
              width={200}
              height={200}
            />
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
        {value.length < maxCount && (
          <button
            type="button"
            onClick={handleSelect}
            disabled={uploading}
            className="aspect-square rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            <Upload className="w-5 h-5" />
            <span className="text-xs">上传图片</span>
          </button>
        )}
      </div>
      {uploading && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>上传中...</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1" />
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
}

export default ImageUploader;
