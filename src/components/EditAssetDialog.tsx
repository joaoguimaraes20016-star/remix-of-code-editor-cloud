import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TeamAsset {
  id: string;
  title: string;
  description: string | null;
  category: string;
  file_path: string | null;
  file_type: string | null;
  loom_url: string | null;
  external_url: string | null;
}

interface EditAssetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  asset: TeamAsset | null;
  onSuccess: () => void;
}

export default function EditAssetDialog({ open, onOpenChange, asset, onSuccess }: EditAssetDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('offer');
  const [loomUrl, setLoomUrl] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (asset) {
      setTitle(asset.title || '');
      setDescription(asset.description || '');
      setCategory(asset.category || 'offer');
      setLoomUrl(asset.loom_url || '');
      setExternalUrl(asset.external_url || '');
    }
  }, [asset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return;

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('team_assets')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          category,
          loom_url: loomUrl.trim() || null,
          external_url: externalUrl.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', asset.id);

      if (error) throw error;

      toast.success('Asset updated');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating asset:', error);
      toast.error('Failed to update asset');
    } finally {
      setSaving(false);
    }
  };

  const assetType = asset?.file_path ? 'file' : asset?.loom_url ? 'loom' : 'link';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Asset title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="offer">Complete Offer</SelectItem>
                <SelectItem value="scripts">Scripts</SelectItem>
                <SelectItem value="onboarding">Onboarding</SelectItem>
                <SelectItem value="tracking">Tracking Sheets</SelectItem>
                <SelectItem value="training">Training</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {assetType === 'file' && (
            <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
              This is a file asset. To change the file, delete this asset and upload a new one.
            </div>
          )}

          {assetType === 'loom' && (
            <div className="space-y-2">
              <Label htmlFor="loomUrl">Loom URL</Label>
              <Input
                id="loomUrl"
                value={loomUrl}
                onChange={(e) => setLoomUrl(e.target.value)}
                placeholder="https://www.loom.com/share/..."
              />
            </div>
          )}

          {assetType === 'link' && (
            <div className="space-y-2">
              <Label htmlFor="externalUrl">External URL</Label>
              <Input
                id="externalUrl"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
