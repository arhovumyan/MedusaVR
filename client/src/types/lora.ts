// LoRA type definitions for chat integration
export interface LoRAModel {
  id: string;
  name: string;
  filename: string;
  description: string;
  category: 'scenario' | 'position' | 'style' | 'detail';
  tags: string[];
}

export interface ChatLoRAOption {
  optionId: number;
  label: string;
  loraModel: LoRAModel;
  description: string;
}

export interface LoRAContext {
  selectedLora?: LoRAModel;
  isActive: boolean;
  strength: number; // 0.0 to 1.0
}

export interface ChatWithLoRA {
  loraContext?: LoRAContext;
  messageHistory: Array<{
    content: string;
    loraUsed?: LoRAModel;
  }>;
}
