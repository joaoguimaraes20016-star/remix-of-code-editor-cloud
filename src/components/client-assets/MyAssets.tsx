import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Loader2, Save, User, FileText, Upload } from 'lucide-react';
import { toast } from 'sonner';

interface AssetField {
  id: string;
  field_name: string;
  field_type: string;
  field_category: string;
  field_value: string | null;
  is_required: boolean;
  order_index: number;
  placeholder_text?: string;
  help_text?: string;
}

interface ClientAsset {
  id: string;
  client_name: string;
  client_email: string;
  status: string;
  completion_percentage: number;
  created_at: string;
  updated_at: string;
}

export function MyAssets() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [asset, setAsset] = useState<ClientAsset | null>(null);
  const [fields, setFields] = useState<AssetField[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadMyAsset();
  }, [user]);

  const loadMyAsset = async () => {
    try {
      if (!user?.email) {
        console.log('No user email found');
        setLoading(false);
        return;
      }

      console.log('Loading asset for email:', user.email);

      // Get the client asset by email
      const { data: assetData, error: assetError } = await supabase
        .from('client_assets')
        .select('*')
        .eq('client_email', user.email)
        .maybeSingle();

      console.log('Asset query result:', { assetData, assetError });

      if (assetError) throw assetError;
      if (!assetData) {
        console.log('No asset found for this email');
        setLoading(false);
        return;
      }

      setAsset(assetData);

      // Load fields
      const { data: fieldsData, error: fieldsError } = await supabase
        .from('client_asset_fields')
        .select('*')
        .eq('client_asset_id', assetData.id)
        .order('order_index');

      console.log('Fields query result:', { fieldsData, fieldsError });

      if (fieldsError) throw fieldsError;

      setFields(fieldsData || []);
    } catch (error) {
      console.error('Error loading asset:', error);
      toast.error('Failed to load your information');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setFields(fields.map(f => f.id === fieldId ? { ...f, field_value: value } : f));
  };

  const handleFileUpload = async (fieldId: string, file: File, fieldCategory: string) => {
    try {
      setUploadingFiles({ ...uploadingFiles, [fieldId]: true });

      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `${asset?.id}/${fieldCategory}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('client-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Save file reference
      await supabase.from('client_asset_files').insert({
        client_asset_id: asset?.id,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        file_category: fieldCategory,
        uploaded_by: user?.id,
      });

      // Update field value with file path
      handleFieldChange(fieldId, filePath);
      toast.success('File uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload file');
    } finally {
      setUploadingFiles({ ...uploadingFiles, [fieldId]: false });
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Update all fields
      for (const field of fields) {
        const { error } = await supabase
          .from('client_asset_fields')
          .update({ field_value: field.field_value })
          .eq('id', field.id);

        if (error) throw error;
      }

      toast.success('Your information has been saved');
      await loadMyAsset(); // Reload to get updated completion percentage
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save your information');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!asset) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Information Found</h2>
          <p className="text-muted-foreground">
            You don't have any onboarding information to manage yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group fields by category
  const groupedFields = fields.reduce((acc, field) => {
    if (!acc[field.field_category]) {
      acc[field.field_category] = [];
    }
    acc[field.field_category].push(field);
    return acc;
  }, {} as Record<string, AssetField[]>);

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="bg-card/50 backdrop-blur-sm border-2 border-primary/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary/10 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle>My Information</CardTitle>
              <CardDescription>
                Update your onboarding information and track your progress
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Profile Completion</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(asset.completion_percentage || 0)}%
                </span>
              </div>
              <Progress value={asset.completion_percentage || 0} className="h-2" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="font-medium">{asset.client_name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="font-medium">{asset.client_email}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Fields by Category */}
      {Object.entries(groupedFields).map(([category, categoryFields]) => (
        <Card key={category} className="bg-card/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="capitalize">{category.replace(/_/g, ' ')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.field_name}
                  {field.is_required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.help_text && (
                  <p className="text-xs text-muted-foreground">{field.help_text}</p>
                )}

                {field.field_type === 'text' && (
                  <Input
                    id={field.id}
                    value={field.field_value || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder_text || ''}
                  />
                )}

                {field.field_type === 'password' && (
                  <Input
                    id={field.id}
                    type="password"
                    value={field.field_value || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder_text || ''}
                  />
                )}

                {field.field_type === 'url' && (
                  <Input
                    id={field.id}
                    type="url"
                    value={field.field_value || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder_text || 'https://'}
                  />
                )}

                {field.field_type === 'textarea' && (
                  <Textarea
                    id={field.id}
                    value={field.field_value || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder_text || ''}
                    rows={4}
                  />
                )}

                {field.field_type === 'file' && (
                  <div className="space-y-2">
                    <Input
                      id={field.id}
                      type="file"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleFileUpload(field.id, file, field.field_category);
                        }
                      }}
                      disabled={uploadingFiles[field.id]}
                    />
                    {uploadingFiles[field.id] && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Uploading...
                      </div>
                    )}
                    {field.field_value && !uploadingFiles[field.id] && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <Upload className="h-4 w-4" />
                        File uploaded
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
