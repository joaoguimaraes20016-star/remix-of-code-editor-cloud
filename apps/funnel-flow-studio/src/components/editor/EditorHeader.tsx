import React from 'react';
import { useFunnel } from '@/context/FunnelContext';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { ViewportType } from '@/types/funnel';
import { ZoomControl } from './ZoomControl';
import { ThemeToggle } from './ThemeToggle';

export function EditorHeader() {
  const { funnel, setFunnel, exportFunnel, importFunnel, undo, redo, canUndo, canRedo, setPreviewMode, currentViewport, setCurrentViewport } = useFunnel();
  const [name, setName] = React.useState(funnel.name);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleNameBlur = () => {
    if (name !== funnel.name) {
      setFunnel({ ...funnel, name });
    }
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

        <Button 
          variant="outline" 
          size="sm" 
          className="h-8"
          onClick={() => setPreviewMode(true)}
        >
          <Eye className="h-4 w-4 mr-1" />
          Preview
        </Button>

        <Button size="sm" className="h-8">
          Publish
        </Button>
      </div>
    </header>
  );
}
