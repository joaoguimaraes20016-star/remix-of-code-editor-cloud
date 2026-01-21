import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, Edit2, GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface TemplateField {
  id: string;
  field_category: string;
  field_name: string;
  field_type: string;
  is_required: boolean;
  placeholder_text: string | null;
  help_text: string | null;
  order_index: number;
  is_active: boolean;
}

interface OnboardingTemplateManagerProps {
  teamId: string;
}

export function OnboardingTemplateManager({ teamId }: OnboardingTemplateManagerProps) {
  const [templates, setTemplates] = useState<TemplateField[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    field_category: '',
    field_name: '',
    field_type: 'text',
    is_required: false,
    placeholder_text: '',
    help_text: '',
    order_index: 0,
  });

  useEffect(() => {
    loadTemplates();
  }, [teamId]);

  const loadTemplates = async () => {
    try {
      // Load team-specific templates first
      const { data: teamData, error: teamError } = await supabase
        .from('asset_field_templates')
        .select('*')
        .eq('team_id', teamId)
        .order('order_index');

      if (teamError) throw teamError;

      // If no team templates, load default templates
      if (!teamData || teamData.length === 0) {
        const { data: defaultData, error: defaultError } = await supabase
          .from('asset_field_templates')
          .select('*')
          .is('team_id', null)
          .order('order_index');

        if (defaultError) throw defaultError;
        setTemplates(defaultData || []);
      } else {
        setTemplates(teamData);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!formData.field_category || !formData.field_name) {
        toast.error('Category and field name are required');
        return;
      }

      if (editingId) {
        const { error } = await supabase
          .from('asset_field_templates')
          .update({
            field_category: formData.field_category,
            field_name: formData.field_name,
            field_type: formData.field_type,
            is_required: formData.is_required,
            placeholder_text: formData.placeholder_text || null,
            help_text: formData.help_text || null,
            order_index: formData.order_index,
          })
          .eq('id', editingId);

        if (error) throw error;
        toast.success('Template updated');
      } else {
        const { error } = await supabase
          .from('asset_field_templates')
          .insert({
            team_id: teamId,
            field_category: formData.field_category,
            field_name: formData.field_name,
            field_type: formData.field_type,
            is_required: formData.is_required,
            placeholder_text: formData.placeholder_text || null,
            help_text: formData.help_text || null,
            order_index: formData.order_index,
            is_active: true,
          });

        if (error) throw error;
        toast.success('Template created');
      }

      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    }
  };

  const handleEdit = (template: TemplateField) => {
    setEditingId(template.id);
    setFormData({
      field_category: template.field_category,
      field_name: template.field_name,
      field_type: template.field_type,
      is_required: template.is_required,
      placeholder_text: template.placeholder_text || '',
      help_text: template.help_text || '',
      order_index: template.order_index,
    });
    setShowDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this field?')) return;

    try {
      const { error } = await supabase
        .from('asset_field_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Template deleted');
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const resetForm = () => {
    setFormData({
      field_category: '',
      field_name: '',
      field_type: 'text',
      is_required: false,
      placeholder_text: '',
      help_text: '',
      order_index: templates.length + 1,
    });
    setEditingId(null);
    setShowDialog(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading templates...</div>;
  }

  // Group templates by category
  const groupedTemplates = templates.reduce((acc, template) => {
    const category = template.field_category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, TemplateField[]>);

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      instagram: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      domain: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
      manychat: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20',
      media: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
    };
    return colors[category] || 'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Onboarding Form Templates</CardTitle>
            <CardDescription>
              Customize the fields that clients fill out during onboarding
            </CardDescription>
          </div>
          <Button onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {templates.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="mb-4">No custom fields yet.</p>
            <Button onClick={() => setShowDialog(true)} variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add your first field
            </Button>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={Object.keys(groupedTemplates)} className="space-y-2">
            {Object.entries(groupedTemplates).map(([category, fields]) => (
              <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={getCategoryColor(category)}>
                      {category}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {fields.length} field{fields.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {fields
                      .sort((a, b) => a.order_index - b.order_index)
                      .map((template) => (
                        <div
                          key={template.id}
                          className="flex items-center gap-3 p-3 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                        >
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <GripVertical className="h-4 w-4" />
                            <span className="text-xs font-mono w-6">{template.order_index}</span>
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium">{template.field_name}</p>
                              {template.is_required && (
                                <Badge variant="secondary" className="text-xs">Required</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {template.field_type}
                              </Badge>
                              {template.placeholder_text && (
                                <span className="text-xs text-muted-foreground truncate">
                                  placeholder: "{template.placeholder_text}"
                                </span>
                              )}
                            </div>
                            {template.help_text && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {template.help_text}
                              </p>
                            )}
                          </div>

                          <div className="flex gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleEdit(template)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleDelete(template.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit' : 'Add'} Form Field</DialogTitle>
            <DialogDescription>
              Create custom fields with detailed descriptions for your onboarding form
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Input
                  value={formData.field_category}
                  onChange={(e) => setFormData({ ...formData, field_category: e.target.value })}
                  placeholder="e.g., instagram, domain"
                />
              </div>

              <div className="space-y-2">
                <Label>Field Type</Label>
                <Select
                  value={formData.field_type}
                  onValueChange={(value) => setFormData({ ...formData, field_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="password">Password</SelectItem>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="file">File Upload</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Field Name</Label>
              <Input
                value={formData.field_name}
                onChange={(e) => setFormData({ ...formData, field_name: e.target.value })}
                placeholder="e.g., Instagram Username"
              />
            </div>

            <div className="space-y-2">
              <Label>Placeholder Text</Label>
              <Input
                value={formData.placeholder_text}
                onChange={(e) => setFormData({ ...formData, placeholder_text: e.target.value })}
                placeholder="e.g., @username"
              />
            </div>

            <div className="space-y-2">
              <Label>Help Text / Description</Label>
              <Textarea
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="Explain why you need this information and what it will be used for..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                This description will help clients understand why you need this information
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_required: checked })}
                />
                <Label>Required Field</Label>
              </div>

              <div className="space-y-2">
                <Label>Order</Label>
                <Input
                  type="number"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  className="w-20"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetForm}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingId ? 'Update' : 'Create'} Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}