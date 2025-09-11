// src/components/chat/MessageInputFooter.tsx
import React from "react";
import { Plus, Paperclip, Smile, } from "lucide-react";

export default function MessageInputFooter() {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 px-4 py-3 flex items-center space-x-3 z-50">
      {/* Plus icon */}
      <button className="p-2 text-gray-400 hover:text-white cursor-pointer hover:scale-110 transition-transform duration-150">
        <Plus className="w-6 h-6" />
      </button>

      {/* Attachment icon */}
      <button className="p-2 text-gray-400 hover:text-white cursor-pointer hover:scale-110 transition-transform duration-150">
        <Paperclip className="w-6 h-6" />
      </button>

      {/* Emoticon icon */}
      <button className="p-2 text-gray-400 hover:text-white cursor-pointer hover:scale-110 transition-transform duration-150">
        <Smile className="w-6 h-6" />
      </button>

      {/* Text input */}
      <input
        type="text"
        placeholder="Type a message..."
        className="flex-1 px-3 py-2 bg-gray-800 text-gray-100 rounded-full outline-none placeholder-gray-500"
      />

      {/* Send icon */}
      <button className="p-2 text-gray-400 hover:text-white cursor-pointer hover:scale-110 transition-transform duration-150">
        <Paperclip className="w-6 h-6" />
      </button>
    </div>
  );
}
