import { useState, useCallback, useEffect } from 'react';
import { LoRAModel, LoRAContext } from '../types/lora';

interface UseLoRAReturn {
  loraContext: LoRAContext;
  selectedLora?: LoRAModel;
  setSelectedLora: (lora?: LoRAModel) => void;
  toggleLoRA: () => void;
  setStrength: (strength: number) => void;
  clearSelection: () => void;
  isLoRAActive: boolean;
}

export function useLora(): UseLoRAReturn {
  const [loraContext, setLoraContext] = useState<LoRAContext>({
    selectedLora: undefined,
    isActive: false,
    strength: 0.8 // Default strength
  });

  // Set selected LoRA model
  const setSelectedLora = useCallback((lora?: LoRAModel) => {
    setLoraContext(prev => ({
      ...prev,
      selectedLora: lora,
      isActive: !!lora // Automatically activate if a LoRA is selected
    }));
  }, []);

  // Toggle LoRA active state
  const toggleLoRA = useCallback(() => {
    setLoraContext(prev => ({
      ...prev,
      isActive: !prev.isActive
    }));
  }, []);

  // Set LoRA strength
  const setStrength = useCallback((strength: number) => {
    const clampedStrength = Math.max(0, Math.min(1, strength));
    setLoraContext(prev => ({
      ...prev,
      strength: clampedStrength
    }));
  }, []);

  // Clear LoRA selection
  const clearSelection = useCallback(() => {
    setLoraContext({
      selectedLora: undefined,
      isActive: false,
      strength: 0.8
    });
  }, []);

  // Log LoRA changes for debugging
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🎯 LoRA Context Updated:', loraContext);
    }
  }, [loraContext]);

  return {
    loraContext,
    selectedLora: loraContext.selectedLora,
    setSelectedLora,
    toggleLoRA,
    setStrength,
    clearSelection,
    isLoRAActive: loraContext.isActive && !!loraContext.selectedLora
  };
}
