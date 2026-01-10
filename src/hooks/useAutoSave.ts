import { useRef, useCallback, useState, useEffect } from 'react';

export type SaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface UseAutoSaveOptions<T> {
  /** Data to auto-save */
  data: T;
  /** Save function that returns a promise */
  onSave: (data: T) => Promise<void>;
  /** Debounce delay in milliseconds (default: 2000) */
  delay?: number;
  /** Whether auto-save is enabled (default: true) */
  enabled?: boolean;
}

interface UseAutoSaveReturn {
  /** Current save status */
  status: SaveStatus;
  /** Manually trigger a save */
  saveNow: () => void;
  /** Last saved timestamp */
  lastSavedAt: Date | null;
  /** Whether there are unsaved changes */
  hasUnsavedChanges: boolean;
}

export function useAutoSave<T>({
  data,
  onSave,
  delay = 2000,
  enabled = true,
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataRef = useRef<string>('');
  const isMountedRef = useRef(true);

  // Serialize data for comparison
  const serializedData = JSON.stringify(data);

  // Save function
  const performSave = useCallback(async () => {
    if (!isMountedRef.current) return;
    
    setStatus('saving');
    
    try {
      await onSave(data);
      if (isMountedRef.current) {
        setStatus('saved');
        setLastSavedAt(new Date());
        setHasUnsavedChanges(false);
        lastDataRef.current = serializedData;
        
        // Reset to idle after 2 seconds
        setTimeout(() => {
          if (isMountedRef.current) {
            setStatus('idle');
          }
        }, 2000);
      }
    } catch (error) {
      if (isMountedRef.current) {
        setStatus('error');
        console.error('Auto-save failed:', error);
      }
    }
  }, [data, onSave, serializedData]);

  // Manual save
  const saveNow = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    performSave();
  }, [performSave]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    // Check if data has changed
    if (serializedData === lastDataRef.current) {
      return;
    }

    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
    setStatus('pending');

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for debounced save
    timeoutRef.current = setTimeout(() => {
      performSave();
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [serializedData, delay, enabled, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Initialize lastDataRef on mount
  useEffect(() => {
    if (!lastDataRef.current) {
      lastDataRef.current = serializedData;
    }
  }, [serializedData]);

  return {
    status,
    saveNow,
    lastSavedAt,
    hasUnsavedChanges,
  };
}
