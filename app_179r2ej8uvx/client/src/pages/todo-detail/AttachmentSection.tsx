import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import { logger } from '@lark-apaas/client-toolkit/logger';
import { todo } from '@client/src/api';
import Image from '@client/src/components/ui/image';
import ImageUploader, {
  type AttachmentItem,
} from '@client/src/components/business-ui/image-uploader';
import type { TodoAttachment } from '@shared/api.interface';

interface AttachmentSectionProps {
  todoId: string;
  isEditing: boolean;
  attachments: TodoAttachment[];
  editAttachments: AttachmentItem[];
  onEditChange: (items: AttachmentItem[]) => void;
  onDelete: (id: string) => void;
}

export function AttachmentSection({
  todoId,
  isEditing,
  attachments,
  editAttachments,
  onEditChange,
  onDelete,
}: AttachmentSectionProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      await todo.deleteTodoAttachment(todoId, attachmentId);
      onDelete(attachmentId);
    } catch (err) {
      logger.error('删除附件失败', String(err));
    }
  };

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm p-5">
      <h2 className="text-sm font-medium text-foreground mb-3">附件</h2>
      {isEditing ? (
        <ImageUploader value={editAttachments} onChange={onEditChange} />
      ) : attachments.length === 0 ? (
        <p className="text-sm text-muted-foreground">暂无附件</p>
      ) : (
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
          {attachments.map((att: TodoAttachment) => (
            <div
              key={att.id}
              className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
              onClick={() => setPreviewImage(att.url)}
            >
              <Image
                src={att.url}
                alt={att.fileName}
                className="w-full h-full object-cover"
                width={200}
                height={200}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteAttachment(att.id);
                }}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="删除附件"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20 transition-colors"
            onClick={() => setPreviewImage(null)}
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={previewImage}
            alt="预览"
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </div>
  );
}

export default AttachmentSection;
