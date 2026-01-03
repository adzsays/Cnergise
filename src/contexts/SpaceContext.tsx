import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSpaces, Space } from '@/hooks/useSpaces';
import { supabase } from '@/integrations/supabase/client';

interface SpaceContextType {
  currentSpaceId: string | null; // null means "All Spaces"
  currentSpace: Space | null;
  setCurrentSpaceId: (id: string | null) => void;
  spaces: Space[];
  isLoading: boolean;
}

const SpaceContext = createContext<SpaceContextType | undefined>(undefined);

export function SpaceProvider({ children }: { children: ReactNode }) {
  const { spaces, isLoading, createSpace } = useSpaces();
  const [currentSpaceId, setCurrentSpaceId] = useState<string | null>(null);
  const [hasCheckedDefault, setHasCheckedDefault] = useState(false);

  // Auto-create Personal space for users who don't have any spaces
  useEffect(() => {
    const ensureDefaultSpace = async () => {
      if (isLoading || hasCheckedDefault) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setHasCheckedDefault(true);
        return;
      }

      if (spaces.length === 0) {
        try {
          await createSpace.mutateAsync({
            name: 'Personal',
            description: 'Your personal workspace',
            color: '#6366f1',
          });
        } catch (error) {
          console.error('Failed to create default space:', error);
        }
      }
      setHasCheckedDefault(true);
    };

    ensureDefaultSpace();
  }, [spaces, isLoading, hasCheckedDefault, createSpace]);

  // Persist space selection in localStorage
  useEffect(() => {
    const savedSpaceId = localStorage.getItem('currentSpaceId');
    if (savedSpaceId && savedSpaceId !== 'null') {
      setCurrentSpaceId(savedSpaceId);
    }
  }, []);

  useEffect(() => {
    if (currentSpaceId) {
      localStorage.setItem('currentSpaceId', currentSpaceId);
    } else {
      localStorage.removeItem('currentSpaceId');
    }
  }, [currentSpaceId]);

  const currentSpace = currentSpaceId 
    ? spaces.find(s => s.id === currentSpaceId) || null 
    : null;

  return (
    <SpaceContext.Provider value={{
      currentSpaceId,
      currentSpace,
      setCurrentSpaceId,
      spaces,
      isLoading,
    }}>
      {children}
    </SpaceContext.Provider>
  );
}

export function useCurrentSpace() {
  const context = useContext(SpaceContext);
  if (context === undefined) {
    throw new Error('useCurrentSpace must be used within a SpaceProvider');
  }
  return context;
}
