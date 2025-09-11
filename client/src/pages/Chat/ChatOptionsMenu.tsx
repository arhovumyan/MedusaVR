// src/pages/Chat/ChatOptionsMenu.tsx
import { useState, useEffect, useRef } from "react";
import { ChevronUp, MoreHorizontal, Zap, ZapOff } from "lucide-react";
import { CHAT_LORA_OPTIONS } from "../../config/loraConfig";
import { ChatLoRAOption } from "../../types/lora";

interface ChatOptionsMenuProps {
  disabled?: boolean;
  onLoRASelect?: (loraOption: ChatLoRAOption) => void;
  selectedLoRAId?: number;
}

export default function ChatOptionsMenu({ 
  disabled = false, 
  onLoRASelect,
  selectedLoRAId 
}: ChatOptionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleOptionClick = (loraOption: ChatLoRAOption) => {
    if (onLoRASelect) {
      onLoRASelect(loraOption);
    } else {
      console.log(`LoRA Selected: ${loraOption.label}`, loraOption);
    }
    setIsOpen(false);
  };

  const toggleMenu = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Options Dropdown */}
      {isOpen && (
        <div className="absolute top-full mt-2 left-0 w-56 bg-gradient-to-br from-zinc-800/95 to-zinc-900/95 backdrop-blur-xl border border-orange-500/30 rounded-lg shadow-xl shadow-orange-500/20 z-50 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-orange-500/30 scrollbar-track-zinc-800/50 hover:scrollbar-thumb-orange-500/50">
          <div className="p-2">
            <div className="text-xs text-zinc-400 mb-2 px-2 flex items-center space-x-1 sticky top-0 bg-zinc-800/95 backdrop-blur-sm py-1 z-10">
              <Zap size={12} />
              <span>LoRA Chat Modes</span>
            </div>
            <div className="space-y-1">
              {CHAT_LORA_OPTIONS.map((loraOption) => (
                <button
                  key={loraOption.optionId}
                  onClick={() => handleOptionClick(loraOption)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                    selectedLoRAId === loraOption.optionId
                      ? 'bg-orange-500/30 text-orange-200 border border-orange-500/50'
                      : 'text-zinc-200 hover:bg-orange-500/20 hover:text-orange-300'
                  }`}
                  title={loraOption.description}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{loraOption.label}</span>
                    {selectedLoRAId === loraOption.optionId && (
                      <ZapOff size={12} className="text-orange-400" />
                    )}
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 group-hover:text-zinc-300">
                    {loraOption.loraModel.category} • {loraOption.loraModel.tags.slice(0, 2).join(', ')}
                  </div>
                </button>
              ))}
            </div>
            
            {/* Clear Selection Option */}
            {selectedLoRAId && (
              <div className="border-t border-zinc-700/50 mt-2 pt-2">
                <button
                  onClick={() => {
                    if (onLoRASelect) {
                      onLoRASelect({} as ChatLoRAOption); // Clear signal
                    }
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-400 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200"
                >
                  <div className="flex items-center space-x-1">
                    <ZapOff size={12} />
                    <span>Clear LoRA Mode</span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Options Button */}
      <button
        type="button"
        onClick={toggleMenu}
        disabled={disabled}
        className={`p-2 rounded-md transition-all duration-200 disabled:opacity-50 ${
          isOpen
            ? 'bg-orange-500/30 text-orange-300'
            : selectedLoRAId 
              ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 shadow-sm shadow-orange-500/20' 
              : 'bg-zinc-700/50 hover:bg-orange-500/20 text-zinc-400 hover:text-orange-400'
        }`}
        title={selectedLoRAId ? `Active: ${CHAT_LORA_OPTIONS.find(opt => opt.optionId === selectedLoRAId)?.label || 'LoRA Mode'}` : "LoRA Chat Options"}
      >
        <div className="relative">
          {isOpen ? <ChevronUp size={16} /> : <MoreHorizontal size={16} />}
          {selectedLoRAId && !isOpen && (
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
          )}
        </div>
      </button>
    </div>
  );
}
