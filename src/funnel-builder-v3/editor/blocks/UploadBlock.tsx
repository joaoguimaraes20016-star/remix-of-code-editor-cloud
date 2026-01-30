import React, { useState } from 'react';
import { UploadContent } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';

interface UploadBlockProps {
  content: UploadContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function UploadBlock({ content, blockId, stepId, isPreview }: UploadBlockProps) {
  const { label, acceptedTypes, maxSize, buttonText } = content;
  const runtime = useFunnelRuntimeOptional();
  const { updateBlockContent } = useFunnel();
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const canEdit = blockId && stepId && !isPreview;

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFile(selectedFile);
    }
  };

  const handleFile = (newFile: File | null) => {
    setFile(newFile);
    if (blockId) {
      runtime?.setFormField(blockId, newFile);
    }
  };

  const handleSubmit = () => {
    if (file && runtime) {
      runtime.goToNextStep();
    }
  };

  const handleLabelChange = (newLabel: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { label: newLabel });
    }
  };

  const handleButtonTextChange = (newText: string) => {
    if (blockId && stepId) {
      updateBlockContent(stepId, blockId, { buttonText: newText });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-3">
      {(label || canEdit) && (
        <div className="text-sm font-medium">
          {canEdit ? (
            <EditableText
              value={label || ''}
              onChange={handleLabelChange}
              as="label"
              isPreview={isPreview}
              showToolbar={true}
              richText={true}
              styles={{}}
              onStyleChange={() => {}}
              placeholder="Add label..."
            />
          ) : (
            label
          )}
        </div>
      )}
      
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all',
          'flex flex-col items-center justify-center gap-3 text-center',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/30'
        )}
      >
        {file ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <File className="w-5 h-5 text-primary" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-foreground truncate max-w-48">
                {file.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={() => handleFile(null)}
              className="p-1 rounded-full hover:bg-accent"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag and drop your file here
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                or click to browse • Max {maxSize}MB
              </p>
            </div>
            <input
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileSelect}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </>
        )}
      </div>

      <Button className="w-full" disabled={!file} onClick={handleSubmit}>
        {canEdit ? (
          <EditableText
            value={buttonText}
            onChange={handleButtonTextChange}
            as="span"
            isPreview={isPreview}
            showToolbar={true}
            richText={true}
            styles={{}}
            onStyleChange={() => {}}
          />
        ) : (
          buttonText
        )}
      </Button>
    </div>
  );
}
