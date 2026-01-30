import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Upload, Image, Film, Link, X, Check, Trash2, Loader2 } from 'lucide-react';
import { useFunnel } from '@/context/FunnelContext';

interface MediaPickerProps {
  value: string;
  onChange: (url: string) => void;
  type: 'image' | 'video';
  label?: string;
  placeholder?: string;
}

type TabType = 'upload' | 'gallery' | 'url';

export const MediaPicker = React.forwardRef<HTMLDivElement, MediaPickerProps>(
  function MediaPicker({ 
    value, 
    onChange, 
    type, 
    label = type === 'image' ? 'Image' : 'Video',
    placeholder = type === 'image' ? 'https://example.com/image.jpg' : 'https://youtube.com/watch?v=...'
  }, ref) {
    const { mediaGallery, addToGallery, removeFromGallery } = useFunnel();
    const [activeTab, setActiveTab] = useState<TabType>('upload');
    const [urlInput, setUrlInput] = useState(value || '');
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const acceptTypes = type === 'image' 
      ? 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml' 
      : 'video/mp4,video/webm,video/ogg';

    const handleFileSelect = useCallback((file: File) => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        setError('File size must be less than 10MB');
        return;
      }

      setIsLoading(true);
      setError(null);

      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        onChange(dataUrl);
        // Don't add base64 data URLs to gallery - they're too large for localStorage
        if (!dataUrl.startsWith('data:')) {
          addToGallery(dataUrl);
        }
        setIsLoading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }, [onChange, addToGallery]);

    const handleDrop = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith(type === 'image' ? 'image/' : 'video/')) {
        handleFileSelect(file);
      } else {
        setError(`Please drop a valid ${type} file`);
      }
    }, [type, handleFileSelect]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    };

    const handleUrlSubmit = () => {
      if (urlInput.trim()) {
        setError(null);
        onChange(urlInput.trim());
        addToGallery(urlInput.trim());
      }
    };

    const handleGallerySelect = (url: string) => {
      onChange(url);
    };

    const handleRemoveFromGallery = (url: string, e: React.MouseEvent) => {
      e.stopPropagation();
      removeFromGallery(url);
      if (value === url) {
        onChange('');
      }
    };

    const filteredGallery = mediaGallery.filter(url => {
      // Skip base64 data URLs in gallery
      if (url.startsWith('data:')) return false;
      
      if (type === 'image') {
        return !url.includes('youtube') && !url.includes('vimeo') && !url.includes('.mp4');
      }
      return url.includes('youtube') || url.includes('vimeo') || url.includes('.mp4');
    });

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
      { id: 'upload', label: 'Upload', icon: <Upload className="h-3.5 w-3.5" /> },
      { id: 'gallery', label: 'Gallery', icon: <Image className="h-3.5 w-3.5" /> },
      { id: 'url', label: 'URL', icon: <Link className="h-3.5 w-3.5" /> },
    ];

    return (
      <div ref={ref} className="space-y-3">
        {/* Label */}
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {label}
        </label>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setError(null); }}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200',
                activeTab === tab.id
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
            {error}
          </div>
        )}

        {/* Tab Content */}
        <div className="min-h-[140px]">
          {/* Upload Tab */}
          {activeTab === 'upload' && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                'relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50',
                isLoading && 'pointer-events-none opacity-70'
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes}
                onChange={handleInputChange}
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-2">
                {isLoading ? (
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                ) : type === 'image' ? (
                  <Image className="h-8 w-8 text-muted-foreground" />
                ) : (
                  <Film className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium">
                    {isLoading ? 'Processing...' : `Drop ${type} here or click to browse`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Max 10MB • {type === 'image' ? 'JPG, PNG, GIF, WEBP, SVG' : 'MP4, WEBM, OGG'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Gallery Tab */}
          {activeTab === 'gallery' && (
            <div className="border rounded-xl overflow-hidden">
              {filteredGallery.length === 0 ? (
                <div className="p-6 text-center">
                  <Image className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No {type}s in gallery yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload or add URLs to build your gallery
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[140px]">
                  <div className="grid grid-cols-4 gap-1 p-1">
                    {filteredGallery.map((url, index) => (
                      <div
                        key={index}
                        onClick={() => handleGallerySelect(url)}
                        className={cn(
                          'relative aspect-square rounded-lg overflow-hidden cursor-pointer group transition-all duration-200',
                          value === url 
                            ? 'ring-2 ring-primary ring-offset-1' 
                            : 'hover:ring-2 hover:ring-primary/50'
                        )}
                      >
                        {type === 'image' ? (
                          <img
                            src={url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <Film className="h-4 w-4 text-muted-foreground" />
                          </div>
                        )}
                        
                        {/* Selection indicator */}
                        {value === url && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                            <Check className="h-4 w-4 text-primary" />
                          </div>
                        )}
                        
                        {/* Delete button */}
                        <button
                          onClick={(e) => handleRemoveFromGallery(url, e)}
                          className="absolute top-0.5 right-0.5 p-1 rounded-md bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          )}

          {/* URL Tab */}
          {activeTab === 'url' && (
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={placeholder}
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUrlSubmit();
                  }}
                />
                <Button
                  size="sm"
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                >
                  Apply
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {type === 'image' 
                  ? 'Paste a direct image URL' 
                  : 'Paste a YouTube, Vimeo, or direct video URL'}
              </p>
            </div>
          )}
        </div>

        {/* Current Preview */}
        {value && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Current</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange('')}
                className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remove
              </Button>
            </div>
            <div className="relative rounded-lg overflow-hidden border bg-muted/50">
              {type === 'image' ? (
                <img
                  src={value}
                  alt="Preview"
                  className="w-full h-20 object-cover"
                />
              ) : (
                <div className="w-full h-20 flex items-center justify-center bg-muted">
                  <Film className="h-6 w-6 text-muted-foreground" />
                  <span className="ml-2 text-xs text-muted-foreground truncate max-w-[150px]">
                    {value.length > 30 ? value.substring(0, 30) + '...' : value}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

MediaPicker.displayName = 'MediaPicker';
