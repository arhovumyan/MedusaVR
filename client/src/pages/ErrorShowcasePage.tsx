import React, { useState } from 'react';
import { ErrorBanner, InlineError } from '@/components/ui/ErrorBanner';
import { getErrorMessages } from '@/lib/mock-data';

const ErrorShowcasePage: React.FC = () => {
  const [retryCount, setRetryCount] = useState(0);
  const errorMessages = getErrorMessages();

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    console.log(`Retry attempted ${retryCount + 1} times`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent mb-4">
            Error Message Showcase
          </h1>
          <p className="text-zinc-400">
            New styled error messages that match the website theme
          </p>
        </div>

        {/* Full Error Banners */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-orange-400 mb-4">Full Error Banners</h2>
          
          <div className="grid gap-6">
            <ErrorBanner type="characterNotFound" />
            <ErrorBanner type="networkError" onRetry={handleRetry} />
            <ErrorBanner type="noChats" />
            <ErrorBanner type="unknownError" />
          </div>
        </section>

        {/* Inline Errors */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-orange-400 mb-4">Inline Error Messages</h2>
          
          <div className="grid gap-4">
            <InlineError 
              message="This is an error message" 
              variant="error" 
            />
            <InlineError 
              message="This is a warning message" 
              variant="warning" 
            />
            <InlineError 
              message="This is an info message" 
              variant="info" 
            />
          </div>
        </section>

        {/* All Error Types */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-orange-400 mb-4">All Error Types</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            {Object.keys(errorMessages).map((key) => (
              <ErrorBanner 
                key={key}
                type={key as any}
                onRetry={key === 'networkError' ? handleRetry : undefined}
              />
            ))}
          </div>
        </section>

        {/* Usage Examples */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-orange-400 mb-4">Usage Examples</h2>
          
          <div className="bg-zinc-800/50 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-medium text-orange-300">How to Use</h3>
            
            <div className="space-y-3 text-sm text-zinc-300">
              <div className="bg-zinc-900/50 rounded p-3">
                <p className="text-orange-200 mb-2">Full Error Banner:</p>
                <code className="text-green-400">
                  {`<ErrorBanner type="characterNotFound" />`}
                </code>
              </div>
              
              <div className="bg-zinc-900/50 rounded p-3">
                <p className="text-orange-200 mb-2">With Retry Function:</p>
                <code className="text-green-400">
                  {`<ErrorBanner type="networkError" onRetry={handleRetry} />`}
                </code>
              </div>
              
              <div className="bg-zinc-900/50 rounded p-3">
                <p className="text-orange-200 mb-2">Inline Error:</p>
                <code className="text-green-400">
                  {`<InlineError message="Something went wrong" variant="error" />`}
                </code>
              </div>
            </div>
          </div>
        </section>

        <div className="text-center pt-8">
          <p className="text-zinc-400 text-sm">
            Retry count: {retryCount}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorShowcasePage;
