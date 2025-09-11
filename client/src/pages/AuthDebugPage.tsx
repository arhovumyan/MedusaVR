import React from 'react';
import { AuthDebug } from '@/debug/auth-debug';

export default function AuthDebugPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-zinc-800 to-orange-900/20">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">Authentication Debug</h1>
        <AuthDebug />
      </div>
    </div>
  );
} 