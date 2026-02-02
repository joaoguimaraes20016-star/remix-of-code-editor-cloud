import React, { useState } from 'react';
import { CountryCode } from '@/funnel-builder-v3/types/funnel';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { allCountryCodes, popularCountryCodes } from '@/funnel-builder-v3/lib/country-codes';
import { cn } from '@/lib/utils';

interface CountryCodeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (country: CountryCode) => void;
  existingCodes?: string[]; // Array of existing country codes to prevent duplicates
}

export function CountryCodeModal({ open, onOpenChange, onAdd, existingCodes = [] }: CountryCodeModalProps) {
  const [flag, setFlag] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddPreset = (country: CountryCode) => {
    // Check for duplicates
    if (existingCodes.includes(country.code)) {
      return;
    }
    onAdd(country);
    onOpenChange(false);
  };

  const handleAddCustom = () => {
    if (!code.trim() || !name.trim()) return;
    
    // Check for duplicates
    if (existingCodes.includes(code.trim())) {
      return;
    }

    const newCountry: CountryCode = {
      id: `custom-${Date.now()}`,
      code: code.trim(),
      name: name.trim(),
      flag: flag.trim() || '🌍',
    };

    onAdd(newCountry);
    // Reset form
    setFlag('');
    setCode('');
    setName('');
    onOpenChange(false);
  };

  const handleCancel = () => {
    setFlag('');
    setCode('');
    setName('');
    setSearchQuery('');
    onOpenChange(false);
  };

  const isDuplicate = code.trim() && existingCodes.includes(code.trim());
  const isValid = code.trim() && name.trim() && !isDuplicate;

  // Filter countries by search query
  const filteredCountries = allCountryCodes.filter(country => {
    const query = searchQuery.toLowerCase();
    return (
      country.name.toLowerCase().includes(query) ||
      country.code.includes(query) ||
      country.flag.includes(query)
    );
  });

  const availablePresets = allCountryCodes.filter(c => !existingCodes.includes(c.code));
  const availablePopular = popularCountryCodes.filter(c => !existingCodes.includes(c.code));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Country Code</DialogTitle>
          <DialogDescription>
            Select from popular countries or add a custom country code.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="presets" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="presets">Presets</TabsTrigger>
            <TabsTrigger value="custom">Custom</TabsTrigger>
          </TabsList>

          <TabsContent value="presets" className="flex-1 overflow-hidden flex flex-col mt-4">
            {/* Search */}
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search countries..."
              className="h-9 mb-3"
            />

            {/* Popular Countries */}
            {availablePopular.length > 0 && !searchQuery && (
              <div className="mb-4">
                <p className="text-xs font-medium text-muted-foreground mb-2">Popular</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {availablePopular.map((country) => (
                    <Button
                      key={country.id}
                      variant="outline"
                      onClick={() => handleAddPreset(country)}
                      className="h-auto py-2 px-3 justify-start"
                    >
                      <span className="text-base mr-2">{country.flag}</span>
                      <div className="text-left">
                        <div className="text-xs font-medium">{country.code}</div>
                        <div className="text-[10px] text-muted-foreground">{country.name}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* All Countries List */}
            <div className="flex-1 overflow-y-auto space-y-1 pr-2">
              {filteredCountries.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No countries found
                </p>
              ) : (
                filteredCountries.map((country) => {
                  const isExisting = existingCodes.includes(country.code);
                  return (
                    <button
                      key={country.id}
                      onClick={() => !isExisting && handleAddPreset(country)}
                      disabled={isExisting}
                      className={cn(
                        "w-full flex items-center gap-2 py-2 px-2 rounded text-left transition-colors",
                        isExisting 
                          ? "opacity-50 cursor-not-allowed" 
                          : "hover:bg-muted cursor-pointer"
                      )}
                    >
                      <span className="text-base shrink-0">{country.flag}</span>
                      <span className="text-sm font-medium shrink-0 w-12">{country.code}</span>
                      <span className="text-xs text-muted-foreground flex-1 truncate">{country.name}</span>
                      {isExisting && (
                        <span className="text-[10px] text-muted-foreground shrink-0">Added</span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="custom" className="mt-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="flag">Flag Emoji</Label>
                <Input
                  id="flag"
                  value={flag}
                  onChange={(e) => setFlag(e.target.value)}
                  placeholder="🇺🇸"
                  maxLength={2}
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground">
                  Enter a flag emoji (optional, e.g., 🇺🇸, 🇬🇧)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code">Country Code</Label>
                <Input
                  id="code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="+1"
                  className="h-10"
                />
                <p className="text-[10px] text-muted-foreground">
                  Include the + sign (e.g., +1, +44, +91)
                </p>
                {isDuplicate && (
                  <p className="text-[10px] text-destructive">
                    This country code already exists
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Country Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="United States"
                  className="h-10"
                />
              </div>

              {/* Preview */}
              {(flag || code || name) && (
                <div className="p-3 bg-muted rounded-lg border border-dashed">
                  <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{flag || '🌍'}</span>
                    <span className="text-sm font-medium">{code || '+XX'}</span>
                    <span className="text-xs text-muted-foreground">{name || 'Country Name'}</span>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleAddCustom} disabled={!isValid}>
            Add Country
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
