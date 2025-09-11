// src/components/chat/SuggestedReply.tsx
import React from "react";
import { MessageCircle, RefreshCcw, Edit2 } from "lucide-react";

export default function SuggestedReply() {
  return (
    <div className="fixed bottom-24 left-0 right-0 bg-black px-4 lg:px-0 z-40">
      <div className="mx-auto max-w-3xl">
        <div className="bg-gray-800 rounded-lg p-4 space-y-4 shadow-md">
          {/* Header: title + reset icon */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-white">
              Here’s a Suggested Reply for You
            </h2>
            <button className="text-gray-400 hover:text-white cursor-pointer">
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
  
          {/* Suggested reply input */}
          <div className="relative">
            {/* Left icon */}
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <MessageCircle className="w-5 h-5" />
            </div>
  
            {/* Text input */}
            <input
              type="text"
              value="I wasn’t staring, I just happened to glance in their direction..."
              readOnly
              className="w-full pl-10 pr-10 py-3 bg-gray-700 text-gray-100 rounded-md placeholder-gray-500 cursor-default focus:outline-none"
            />
  
            {/* Right pencil icon */}
            <button className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white cursor-pointer">
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
