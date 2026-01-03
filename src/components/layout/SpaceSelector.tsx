import React, { useState } from 'react';
import { Check, ChevronsUpDown, Globe, Plus, Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCurrentSpace } from '@/contexts/SpaceContext';
import { useSpaces } from '@/hooks/useSpaces';

const SPACE_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', 
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#06b6d4', '#3b82f6'
];

export function SpaceSelector() {
  const { currentSpaceId, currentSpace, setCurrentSpaceId, spaces } = useCurrentSpace();
  const { createSpace } = useSpaces();
  const [open, setOpen] = useState(false);
  const [showNewSpaceDialog, setShowNewSpaceDialog] = useState(false);
  const [newSpace, setNewSpace] = useState({ name: '', description: '', color: SPACE_COLORS[0] });

  const handleCreateSpace = async () => {
    if (!newSpace.name.trim()) return;
    
    await createSpace.mutateAsync({
      name: newSpace.name,
      description: newSpace.description || null,
      color: newSpace.color,
    });
    
    setNewSpace({ name: '', description: '', color: SPACE_COLORS[0] });
    setShowNewSpaceDialog(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              {currentSpace ? (
                <>
                  <div 
                    className="h-3 w-3 rounded-full shrink-0" 
                    style={{ backgroundColor: currentSpace.color || '#6366f1' }}
                  />
                  <span className="truncate">{currentSpace.name}</span>
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>All Spaces</span>
                </>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0">
          <Command>
            <CommandInput placeholder="Search spaces..." />
            <CommandList>
              <CommandEmpty>No space found.</CommandEmpty>
              <CommandGroup heading="View">
                <CommandItem
                  onSelect={() => {
                    setCurrentSpaceId(null);
                    setOpen(false);
                  }}
                >
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                  All Spaces
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      !currentSpaceId ? "opacity-100" : "opacity-0"
                    )}
                  />
                </CommandItem>
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup heading="Spaces">
                {spaces.map((space) => (
                  <CommandItem
                    key={space.id}
                    onSelect={() => {
                      setCurrentSpaceId(space.id);
                      setOpen(false);
                    }}
                  >
                    <div 
                      className="mr-2 h-3 w-3 rounded-full shrink-0" 
                      style={{ backgroundColor: space.color || '#6366f1' }}
                    />
                    <span className="truncate">{space.name}</span>
                    {space.is_default && (
                      <span className="ml-1 text-xs text-muted-foreground">(default)</span>
                    )}
                    <Check
                      className={cn(
                        "ml-auto h-4 w-4",
                        currentSpaceId === space.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setShowNewSpaceDialog(true);
                  }}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create new space
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <Dialog open={showNewSpaceDialog} onOpenChange={setShowNewSpaceDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Create New Space
            </DialogTitle>
            <DialogDescription>
              Spaces help you organize your data by context (e.g., Personal, Business).
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g., Corential, Personal, Investments"
                value={newSpace.name}
                onChange={(e) => setNewSpace({ ...newSpace, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (optional)</Label>
              <Textarea
                id="description"
                placeholder="What is this space for?"
                value={newSpace.description}
                onChange={(e) => setNewSpace({ ...newSpace, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {SPACE_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={cn(
                      "h-8 w-8 rounded-full border-2 transition-all",
                      newSpace.color === color ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewSpace({ ...newSpace, color })}
                  />
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewSpaceDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSpace} 
              disabled={!newSpace.name.trim() || createSpace.isPending}
            >
              {createSpace.isPending ? 'Creating...' : 'Create Space'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
