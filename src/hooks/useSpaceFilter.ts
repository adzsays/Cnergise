import { useCurrentSpace } from '@/contexts/SpaceContext';

/**
 * Returns the current space filter for use in Supabase queries.
 * Returns null when "All Spaces" is selected (no filtering).
 */
export function useSpaceFilter() {
  const { currentSpaceId, currentSpace, spaces, isLoading } = useCurrentSpace();
  
  /**
   * Applies space filtering to a Supabase query builder.
   * When currentSpaceId is null (All Spaces), returns the query unchanged.
   * When a space is selected, adds .eq('space_id', spaceId) filter.
   */
  const applySpaceFilter = <T extends { eq: (column: string, value: string) => T }>(
    query: T,
    column: string = 'space_id'
  ): T => {
    if (currentSpaceId) {
      return query.eq(column, currentSpaceId);
    }
    return query;
  };

  /**
   * Returns filter params for use in query keys to ensure proper cache invalidation.
   */
  const getQueryKeyParams = () => ({
    spaceId: currentSpaceId,
  });

  /**
   * Gets the default space ID for creating new records.
   * Falls back to the first space if no space is selected.
   */
  const getDefaultSpaceId = (): string | null => {
    if (currentSpaceId) return currentSpaceId;
    const defaultSpace = spaces.find(s => s.is_default);
    return defaultSpace?.id || spaces[0]?.id || null;
  };

  return {
    currentSpaceId,
    currentSpace,
    spaces,
    isLoading,
    applySpaceFilter,
    getQueryKeyParams,
    getDefaultSpaceId,
  };
}
