import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useFunnel } from '@/funnel-builder-v3/context/FunnelContext';
import { useFunnelPersistence } from '@/funnel-builder-v3/hooks/useFunnelPersistence';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Download,
  Upload,
  Undo2,
  Redo2,
  Eye,
  Smartphone,
  Tablet,
  Monitor,
  Save,
  MoreHorizontal,
  ArrowLeft,
  Loader2,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { ViewportType } from '@/funnel-builder-v3/types/funnel';
import { ZoomControl } from './ZoomControl';
import { ThemeToggle } from './ThemeToggle';
import { PublishModal } from './PublishModal';
import { FunnelSettingsModal } from './FunnelSettingsModal';

export function EditorHeader() {
  const { funnel, setFunnel, exportFunnel, importFunnel, undo, redo, canUndo, canRedo, setPreviewMode, currentViewport, setCurrentViewport } = useFunnel();
  const { 
    teamId, 
    funnelId,
    saveDraft, 
    publish, 
    linkDomain,
    isAuthenticated,
    funnelStatus,
    currentDomainId,
    lastPublishedAt,
    slug,
  } = useFunnelPersistence({ funnel, setFunnel });
  const [searchParams] = useSearchParams();
  
  const [name, setName] = React.useState(funnel.name);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [settingsSection, setSettingsSection] = useState<'general' | 'domain' | 'appearance' | 'advanced'>('general');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Main app URL for dashboard link
  const mainAppUrl = window.location.origin.replace(/:\d+$/, ':8080');
  const dashboardUrl = teamId ? `${mainAppUrl}/team/${teamId}/funnels` : mainAppUrl;

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    if (name !== funnel.name) {
      setFunnel({ ...funnel, name });
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to save');
      return;
    }
    setIsSaving(true);
    const success = await saveDraft();
    setIsSaving(false);
    if (success) {
      toast.success('Draft saved');
    }
  };

  const handlePublish = async (): Promise<boolean> => {
    if (!isAuthenticated) {
      toast.error('Please log in to publish');
      return false;
    }
    setIsPublishing(true);
    const success = await publish();
    setIsPublishing(false);
    return success;
  };

  const handleExport = () => {
    const json = exportFunnel();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${funnel.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Funnel exported successfully');
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importFunnel(content);
      if (success) {
        toast.success('Funnel imported successfully');
      } else {
        toast.error('Invalid funnel file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 gap-4 shrink-0">
      {/* Left Section */}
      <div className="flex items-center gap-3">
        {/* Back to Dashboard */}
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="h-8 px-2"
        >
          <a href={dashboardUrl}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Dashboard
          </a>
        </Button>
        
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <Input
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            className="h-8 w-48 text-sm font-medium border-transparent hover:border-input focus:border-input bg-transparent"
          />
        </div>

        <div className="flex items-center gap-1 ml-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={undo}
            disabled={!canUndo}
            className="h-8 w-8"
          >
            <Undo2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={redo}
            disabled={!canRedo}
            className="h-8 w-8"
          >
            <Redo2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Center Section - Device Toggle & Zoom */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
          <Button
            variant={currentViewport === 'mobile' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentViewport('mobile')}
            className="h-7 px-3"
          >
            <Smartphone className="h-4 w-4 mr-1" />
            Mobile
          </Button>
          <Button
            variant={currentViewport === 'tablet' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentViewport('tablet')}
            className="h-7 px-3"
          >
            <Tablet className="h-4 w-4 mr-1" />
            Tablet
          </Button>
          <Button
            variant={currentViewport === 'desktop' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => setCurrentViewport('desktop')}
            className="h-7 px-3"
          >
            <Monitor className="h-4 w-4 mr-1" />
            Desktop
          </Button>
        </div>
        
        <ZoomControl />
      </div>

      {/* Right Section */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />

        <ThemeToggle />

        {/* Settings Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => setSettingsModalOpen(true)}
        >
          <Settings className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-popover">
            <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4 mr-2" />
              Import Funnel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export Funnel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Save className="h-4 w-4 mr-2" />
              Save as Template
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Save Draft Button */}
        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={handleSave}
          disabled={isSaving || !isAuthenticated}
        >
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-1" />
          )}
          Save
        </Button>

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={() => setPreviewMode(true)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>

        <Button 
          size="sm" 
          className="h-8"
          onClick={() => setPublishModalOpen(true)}
          disabled={!isAuthenticated}
        >
          Publish
        </Button>
      </div>

      {/* Publish Modal */}
      <PublishModal
        isOpen={publishModalOpen}
        onClose={() => setPublishModalOpen(false)}
        onPublish={handlePublish}
        onOpenSettings={() => {
          setPublishModalOpen(false);
          setSettingsSection('domain');
          setSettingsModalOpen(true);
        }}
        pageSlug={slug}
        pageTitle={funnel.name}
        funnelId={funnelId}
        teamId={teamId}
        currentDomainId={currentDomainId}
        isPublishing={isPublishing}
        funnelStatus={funnelStatus}
      />

      {/* Settings Modal */}
      <FunnelSettingsModal
        isOpen={settingsModalOpen}
        onClose={() => {
          setSettingsModalOpen(false);
          setSettingsSection('general');
        }}
        funnelId={funnelId}
        teamId={teamId}
        currentDomainId={currentDomainId}
        onDomainChange={linkDomain}
        defaultSection={settingsSection}
      />
    </header>
  );
}
