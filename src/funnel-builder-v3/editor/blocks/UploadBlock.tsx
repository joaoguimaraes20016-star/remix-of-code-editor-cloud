import React, { useState } from 'react';
import { UploadContent, ConsentSettings } from '@/funnel-builder-v3/types/funnel';
import { cn } from '@/lib/utils';
import { Upload, File, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useFunnelRuntimeOptional } from '@/funnel-builder-v3/context/FunnelRuntimeContext';
import { useFunnelOptional } from '@/funnel-builder-v3/context/FunnelContext';
import { EditableText } from '@/funnel-builder-v3/editor/EditableText';
import { toast } from 'sonner';
import { useBlockOverlay } from '@/funnel-builder-v3/hooks/useBlockOverlay';

// Default consent settings
const defaultConsent: ConsentSettings = {
  enabled: false,
  text: 'I have read and accept the',
  linkText: 'privacy policy',
  linkUrl: '#',
  required: true,
};

interface UploadBlockProps {
  content: UploadContent;
  blockId?: string;
  stepId?: string;
  isPreview?: boolean;
}

export function UploadBlock({ content, blockId, stepId, isPreview }: UploadBlockProps) {
  const { label, acceptedTypes, maxSize, buttonText, consent = defaultConsent, labelColor, helperTextColor } = content;
  const runtime = useFunnelRuntimeOptional();
  const funnelContext = useFunnelOptional();
  const updateBlockContent = funnelContext?.updateBlockContent ?? (() => {});
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);

  const canEdit = blockId && stepId && !isPreview;
  const { wrapWithOverlay } = useBlockOverlay({
    blockId,
    stepId,
    isPreview,
    blockType: 'upload',
    hintText: 'Click to edit upload'
  });

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

  return wrapWithOverlay(
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
              styles={labelColor ? { color: labelColor } : {}}
              onStyleChange={() => {}}
              placeholder="Add label..."
            />
          ) : (
            <span style={labelColor ? { color: labelColor } : undefined}>{label}</span>
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
              <p className="text-sm font-medium truncate max-w-48" style={labelColor ? { color: labelColor } : undefined}>
                {file.name}
              </p>
              <p className={cn("text-xs", !helperTextColor && "text-muted-foreground")} style={helperTextColor ? { color: helperTextColor } : undefined}>
                {formatFileSize(file.size)}
              </p>
            </div>
            <button
              onClick={() => handleFile(null)}
              className="p-1 rounded-full hover:bg-accent"
            >
              <X className={cn("w-4 h-4", !helperTextColor && "text-muted-foreground")} style={helperTextColor ? { color: helperTextColor } : undefined} />
            </button>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Upload className={cn("w-6 h-6", !helperTextColor && "text-muted-foreground")} style={helperTextColor ? { color: helperTextColor } : undefined} />
            </div>
            <div>
              <p className={cn("text-sm font-medium", !labelColor && "text-foreground")} style={labelColor ? { color: labelColor } : undefined}>
                Drag and drop your file here
              </p>
              <p className={cn("text-xs mt-1", !helperTextColor && "text-muted-foreground")} style={helperTextColor ? { color: helperTextColor } : undefined}>
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

      {/* Privacy Consent Checkbox */}
      {consent.enabled && (
        <div className="flex items-start gap-3 py-2">
          <Checkbox
            id="privacy-consent-upload"
            checked={hasConsented}
            onCheckedChange={(checked) => setHasConsented(checked === true)}
            className="mt-0.5"
          />
          <label 
            htmlFor="privacy-consent-upload" 
            className={cn("text-sm leading-relaxed cursor-pointer select-none", !consent.textColor && "text-muted-foreground")}
            style={consent.textColor ? { color: consent.textColor } : undefined}
          >
            {consent.text}{' '}
            <a 
              href={consent.linkUrl || '#'} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80"
              onClick={(e) => e.stopPropagation()}
            >
              {consent.linkText}
            </a>
            {consent.required && <span className="text-destructive ml-0.5">*</span>}
          </label>
        </div>
      )}

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
