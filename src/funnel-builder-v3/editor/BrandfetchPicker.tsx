import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2, Image as ImageIcon, Upload, Folder, Plus, X, FolderPlus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';

interface BrandfetchPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (logo: { src: string; alt: string }) => void;
}

interface BrandResult {
  name: string;
  domain: string;
  icon?: string;
}

type TabType = 'all-media' | 'my-files' | 'brandfetch' | 'folder';

// Popular brands for initial display
const popularBrands: BrandResult[] = [
  { name: 'Google', domain: 'google.com' },
  { name: 'Nike', domain: 'nike.com' },
  { name: 'Apple', domain: 'apple.com' },
  { name: 'Coca-Cola', domain: 'coca-cola.com' },
  { name: 'Amazon', domain: 'amazon.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Netflix', domain: 'netflix.com' },
  { name: 'Spotify', domain: 'spotify.com' },
  { name: 'Uber', domain: 'uber.com' },
  { name: 'Airbnb', domain: 'airbnb.com' },
  { name: 'Slack', domain: 'slack.com' },
  { name: 'Stripe', domain: 'stripe.com' },
  { name: 'Shopify', domain: 'shopify.com' },
  { name: 'Notion', domain: 'notion.so' },
  { name: 'Figma', domain: 'figma.com' },
  { name: 'Discord', domain: 'discord.com' },
  { name: 'Twitter', domain: 'twitter.com' },
  { name: 'LinkedIn', domain: 'linkedin.com' },
  { name: 'Adobe', domain: 'adobe.com' },
  { name: 'Salesforce', domain: 'salesforce.com' },
  { name: 'Zoom', domain: 'zoom.us' },
  { name: 'PayPal', domain: 'paypal.com' },
  { name: 'DHL', domain: 'dhl.com' },
  { name: 'FedEx', domain: 'fedex.com' },
];

// Preset logos for quick selection in gallery view
const presetLogos: BrandResult[] = [
  { name: 'Apple', domain: 'apple.com' },
  { name: 'Microsoft', domain: 'microsoft.com' },
  { name: 'Slack', domain: 'slack.com' },
  { name: 'Stripe', domain: 'stripe.com' },
];

export function BrandfetchPicker({ isOpen, onClose, onSelect }: BrandfetchPickerProps) {
  const { mediaItems, mediaFolders, addMediaItem, removeMediaItem, createMediaFolder, deleteMediaFolder } = useFunnel();
  
  const [activeTab, setActiveTab] = useState<TabType>('all-media');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<BrandResult[]>(popularBrands);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isAddingFolder, setIsAddingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [stagedMedia, setStagedMedia] = useState<{ src: string; alt: string } | null>(null);
  const [selectedSaveFolder, setSelectedSaveFolder] = useState<string>('__root__');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  useEffect(() => {
    if (activeTab !== 'brandfetch') return;
    
    if (!searchQuery.trim()) {
      setResults(popularBrands);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Use Brandfetch autocomplete API
        const response = await fetch(
          `https://autocomplete.brandfetch.io/?query=${encodeURIComponent(searchQuery)}`
        );
        
        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data) && data.length > 0) {
            setResults(data.map((item: any) => ({
              name: item.name || item.domain,
              domain: item.domain || item.id,
              icon: item.icon,
            })));
          } else {
            // Fallback: filter popular brands
            setResults(
              popularBrands.filter(b => 
                b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                b.domain.toLowerCase().includes(searchQuery.toLowerCase())
              )
            );
          }
        } else {
          // Fallback: filter popular brands
          setResults(
            popularBrands.filter(b => 
              b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              b.domain.toLowerCase().includes(searchQuery.toLowerCase())
            )
          );
        }
      } catch (error) {
        // Fallback: filter popular brands
        setResults(
          popularBrands.filter(b => 
            b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            b.domain.toLowerCase().includes(searchQuery.toLowerCase())
          )
        );
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, activeTab]);

  const handleSelectBrand = useCallback((brand: BrandResult) => {
    // Use Google high-res favicon (most reliable, no CORS issues)
    const logoUrl = `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`;
    
    // Stage the media for confirmation
    setStagedMedia({
      src: logoUrl,
      alt: brand.name,
    });
    setSearchQuery('');
    setSelectedBrand(null);
  }, []);

  const handleSelectMediaItem = useCallback((item: { src: string; alt: string }) => {
    // Items from gallery are already saved, just use them directly
    onSelect({
      src: item.src,
      alt: item.alt,
    });
    onClose();
  }, [onSelect, onClose]);

  const handleConfirmMedia = useCallback(() => {
    if (!stagedMedia) return;
    
    // Save to media library (use undefined for root folder)
    addMediaItem({
      src: stagedMedia.src,
      alt: stagedMedia.alt,
      folderId: selectedSaveFolder === '__root__' ? undefined : selectedSaveFolder,
    });
    
    // Add to funnel
    onSelect(stagedMedia);
    
    // Reset state and close
    setStagedMedia(null);
    setSelectedSaveFolder('__root__');
    onClose();
  }, [stagedMedia, selectedSaveFolder, addMediaItem, onSelect, onClose]);

  const handleClose = () => {
    setSearchQuery('');
    setSelectedBrand(null);
    setActiveTab('all-media');
    setSelectedFolderId(null);
    setIsAddingFolder(false);
    setNewFolderName('');
    setStagedMedia(null);
    setSelectedSaveFolder('__root__');
    onClose();
  };

  // File upload handlers
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      // Extract filename without extension for alt text
      let altText = file.name.replace(/\.[^/.]+$/, '');
      // If it looks like a UUID, random string, or is too long, use "Custom Logo"
      if (/^[A-F0-9-]{20,}$/i.test(altText) || altText.length > 30) {
        altText = 'Custom Logo';
      }
      
      // Stage the media for confirmation
      setStagedMedia({
        src: dataUrl,
        alt: altText,
      });
      // Pre-select the current folder if viewing a folder
      if (selectedFolderId) {
        setSelectedSaveFolder(selectedFolderId);
      }
    };
    reader.readAsDataURL(file);
  }, [selectedFolderId]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

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
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      createMediaFolder(newFolderName.trim());
      setNewFolderName('');
      setIsAddingFolder(false);
    }
  };

  const handleFolderClick = (folderId: string) => {
    setActiveTab('folder');
    setSelectedFolderId(folderId);
  };

  // Get filtered media items based on current view
  const getDisplayedMediaItems = () => {
    if (activeTab === 'all-media') {
      return mediaItems;
    } else if (activeTab === 'folder' && selectedFolderId) {
      return mediaItems.filter(item => item.folderId === selectedFolderId);
    }
    return [];
  };

  const displayedMediaItems = getDisplayedMediaItems();
  const currentFolder = mediaFolders.find(f => f.id === selectedFolderId);

  const getContentTitle = () => {
    switch (activeTab) {
      case 'all-media':
        return 'All Media';
      case 'my-files':
        return 'Upload Your Logo';
      case 'brandfetch':
        return 'Search for Brands and Logos';
      case 'folder':
        return currentFolder?.name || 'Folder';
      default:
        return 'Media';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <div className="flex h-[480px]">
          {/* Sidebar */}
          <div className="w-48 border-r bg-muted/30 flex flex-col">
            <div className="p-4 border-b">
              <h3 className="font-semibold text-sm">Add Media</h3>
            </div>
            
            {/* Folders section */}
            <div className="p-2">
              <p className="text-xs text-muted-foreground px-2 py-1">Folders</p>
              
              {/* All Media */}
              <button 
                onClick={() => { setActiveTab('all-media'); setSelectedFolderId(null); }}
                className={cn(
                  "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                  activeTab === 'all-media'
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Folder className="h-4 w-4" />
                All media
                {mediaItems.length > 0 && (
                  <span className="ml-auto text-xs opacity-60">{mediaItems.length}</span>
                )}
              </button>

              {/* Custom folders */}
              {mediaFolders.map((folder) => {
                const itemCount = mediaItems.filter(item => item.folderId === folder.id).length;
                return (
                  <div key={folder.id} className="group relative">
                    <button
                      onClick={() => handleFolderClick(folder.id)}
                      className={cn(
                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                        activeTab === 'folder' && selectedFolderId === folder.id
                          ? "bg-primary/10 text-primary font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      )}
                    >
                      <Folder className="h-4 w-4" />
                      <span className="truncate flex-1 text-left">{folder.name}</span>
                      {itemCount > 0 && (
                        <span className="text-xs opacity-60">{itemCount}</span>
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMediaFolder(folder.id);
                        if (selectedFolderId === folder.id) {
                          setActiveTab('all-media');
                          setSelectedFolderId(null);
                        }
                      }}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/20 rounded transition-all"
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </button>
                  </div>
                );
              })}

              {/* Add folder */}
              {isAddingFolder ? (
                <div className="flex items-center gap-1 px-2 py-1">
                  <Input
                    ref={folderInputRef}
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Folder name"
                    className="h-7 text-xs"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateFolder();
                      if (e.key === 'Escape') { setIsAddingFolder(false); setNewFolderName(''); }
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={handleCreateFolder}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingFolder(true)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:bg-muted rounded-md transition-colors"
                >
                  <FolderPlus className="h-4 w-4" />
                  Add folder
                </button>
              )}
            </div>

            {/* Integrations section */}
            <div className="p-2 flex-1">
              <p className="text-xs text-muted-foreground px-2 py-1">Integrations</p>
              <div className="space-y-0.5">
                <button
                  onClick={() => { setActiveTab('my-files'); setSelectedFolderId(null); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                    activeTab === 'my-files'
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Upload className="h-4 w-4" />
                  My Files
                </button>
                <button
                  onClick={() => { setActiveTab('brandfetch'); setSelectedFolderId(null); }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-md transition-colors",
                    activeTab === 'brandfetch'
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-muted-foreground hover:bg-muted"
                  )}
                >
                  <Search className="h-4 w-4" />
                  Brandfetch
                </button>
              </div>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 flex flex-col">
            <DialogHeader className="p-4 border-b">
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                {getContentTitle()}
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 p-4 overflow-hidden">
              {/* Hidden file input - always available */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={handleInputChange}
                className="hidden"
              />

              {/* All Media / Folder Gallery View */}
              {(activeTab === 'all-media' || activeTab === 'folder') && (
                <div className="h-full flex flex-col">
                  <ScrollArea className="flex-1">
                    <div className="grid grid-cols-3 gap-2">
                      {/* Upload card - always first in grid */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed cursor-pointer transition-all min-h-[88px] bg-muted/30",
                          isDragging 
                            ? "border-primary bg-primary/10" 
                            : "border-primary/40 hover:border-primary hover:bg-primary/5"
                        )}
                      >
                        <Upload className="h-8 w-8 text-primary/70 mb-1" />
                        <span className="text-xs text-primary/70 font-medium">Upload</span>
                      </div>

                      {/* Preset logos - show only if not already in media library */}
                      {presetLogos
                        .filter(preset => !mediaItems.some(item => item.alt === preset.name))
                        .map(preset => (
                          <button
                            key={preset.domain}
                            onClick={() => handleSelectBrand(preset)}
                            className="flex flex-col items-center justify-center p-3 rounded-lg border-2 border-transparent transition-all hover:border-primary hover:bg-muted/50 min-h-[88px]"
                          >
                            <div className="w-12 h-12 flex items-center justify-center mb-2">
                              <img
                                src={`https://www.google.com/s2/favicons?domain=${preset.domain}&sz=128`}
                                alt={preset.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <span className="text-xs text-center font-medium truncate w-full">
                              {preset.name}
                            </span>
                          </button>
                        ))}
                      
                      {/* Media items */}
                      {displayedMediaItems.map((item) => (
                        <div key={item.id} className="group relative">
                          <button
                            onClick={() => handleSelectMediaItem(item)}
                            className="w-full flex flex-col items-center justify-center p-3 rounded-lg border-2 border-transparent transition-all hover:border-primary hover:bg-muted/50"
                          >
                            <div className="w-12 h-12 flex items-center justify-center mb-2">
                              <img
                                src={item.src}
                                alt={item.alt}
                                className="max-w-full max-h-full object-contain"
                              />
                            </div>
                            <span className="text-xs text-center font-medium truncate w-full">
                              {item.alt}
                            </span>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeMediaItem(item.id);
                            }}
                            className="absolute top-1 right-1 p-1 opacity-0 group-hover:opacity-100 bg-background/80 hover:bg-destructive hover:text-destructive-foreground rounded transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              )}

              {/* My Files Tab Content */}
              {activeTab === 'my-files' && (
                <div className="h-full flex flex-col">
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={cn(
                      "flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-200",
                      isDragging
                        ? "border-primary bg-primary/5 scale-[1.02]"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    )}
                  >
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-base font-medium mb-1">
                      Drop your logo here or click to browse
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports JPG, PNG, GIF, WebP, SVG
                    </p>
                  </div>
                </div>
              )}

              {/* Brandfetch Tab Content */}
              {activeTab === 'brandfetch' && (
                <div className="h-full flex flex-col gap-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Brandfetch..."
                      className="pl-10"
                      autoFocus
                    />
                    {isLoading && (
                      <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {/* Results Grid */}
                  <ScrollArea className="flex-1 border rounded-lg">
                    <div className="grid grid-cols-3 gap-2 p-2">
                      {results.map((brand, index) => (
                        <button
                          key={`${brand.domain}-${index}`}
                          onClick={() => handleSelectBrand(brand)}
                          className={cn(
                            "flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-all hover:border-primary hover:bg-muted/50",
                            selectedBrand?.domain === brand.domain
                              ? "border-primary bg-primary/5"
                              : "border-transparent"
                          )}
                        >
                          <div className="w-12 h-12 flex items-center justify-center mb-2">
                            <img
                              src={brand.icon || `https://www.google.com/s2/favicons?domain=${brand.domain}&sz=128`}
                              alt={brand.name}
                              className="max-w-full max-h-full object-contain"
                            />
                          </div>
                          <span className="text-xs text-center font-medium truncate w-full">
                            {brand.name}
                          </span>
                        </button>
                      ))}
                    </div>
                    
                    {results.length === 0 && !isLoading && (
                      <div className="flex flex-col items-center justify-center h-full py-8 text-muted-foreground">
                        <ImageIcon className="h-8 w-8 mb-2" />
                        <p className="text-sm">No brands found</p>
                        <p className="text-xs">Try a different search term</p>
                      </div>
                    )}
                  </ScrollArea>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>powered by Brandfetch</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Bar - consistent height to prevent layout shift */}
            <div className="p-4 border-t flex items-center gap-3 min-h-[72px] bg-muted/20">
              {stagedMedia ? (
                <>
                  <div className="w-12 h-12 rounded-lg border-2 border-primary/20 bg-background flex items-center justify-center overflow-hidden shrink-0">
                    <img 
                      src={stagedMedia.src} 
                      alt={stagedMedia.alt}
                      className="max-w-full max-h-full object-contain" 
                    />
                  </div>
                  <div className="flex-1 min-w-0 max-w-[120px]">
                    <p className="text-sm font-medium truncate">{stagedMedia.alt}</p>
                    <p className="text-xs text-muted-foreground">Save to:</p>
                  </div>
                  <Select value={selectedSaveFolder} onValueChange={setSelectedSaveFolder}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="All Media" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">All Media</SelectItem>
                      {mediaFolders.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" onClick={handleConfirmMedia} className="shrink-0">
                    Use media
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setStagedMedia(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <div className="flex-1 flex justify-end">
                  <Button variant="outline" size="sm" onClick={handleClose}>
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
