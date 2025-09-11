import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { auth } from '@/components/firebase/firebase.config';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function AuthDebug() {
  const { isAuthenticated, user, isLoading } = useAuth();

  const debugInfo = {
    // Auth hook data
    hookAuthenticated: isAuthenticated,
    hookUser: user,
    hookLoading: isLoading,
    
    // Local storage data
    accessToken: localStorage.getItem('medusavr_access_token'),
    refreshToken: localStorage.getItem('medusavr_refresh_token'),
    storedUser: localStorage.getItem('medusavr_user'),
    
    // Firebase auth data
    firebaseUser: auth.currentUser,
    firebaseEmail: auth.currentUser?.email,
    firebaseUid: auth.currentUser?.uid,
  };

  const handleGetIdToken = async () => {
    try {
      if (auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        console.log('Firebase ID Token:', token);
        alert(`Firebase ID Token (first 50 chars): ${token.substring(0, 50)}...`);
      } else {
        alert('No Firebase user found');
      }
    } catch (error) {
      console.error('Error getting ID token:', error);
      alert(`Error: ${error}`);
    }
  };

  const handleTestAPI = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('medusavr_access_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('API Response:', data);
        alert('API call successful! Check console for details.');
      } else {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        alert(`API Error: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error('API Request failed:', error);
      alert(`Request failed: ${error}`);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Auth Hook Status</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium">Authenticated:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.hookAuthenticated ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.hookAuthenticated ? 'Yes' : 'No'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Loading:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.hookLoading ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                    {debugInfo.hookLoading ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              <div className="mt-2">
                <span className="font-medium">User:</span>
                <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto">
                  {JSON.stringify(debugInfo.hookUser, null, 2)}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Local Storage</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Access Token:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.accessToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.accessToken ? `Present (${debugInfo.accessToken.substring(0, 20)}...)` : 'Missing'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Refresh Token:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.refreshToken ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.refreshToken ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Stored User:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.storedUser ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.storedUser ? 'Present' : 'Missing'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Firebase Auth</h3>
              <div className="space-y-2">
                <div>
                  <span className="font-medium">Firebase User:</span>
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${debugInfo.firebaseUser ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {debugInfo.firebaseUser ? 'Present' : 'Missing'}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{debugInfo.firebaseEmail || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium">UID:</span>
                  <span className="ml-2">{debugInfo.firebaseUid || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex space-x-4">
              <Button onClick={handleGetIdToken} variant="outline">
                Get Firebase ID Token
              </Button>
              <Button onClick={handleTestAPI} variant="outline">
                Test API Call
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {!debugInfo.hookAuthenticated && debugInfo.firebaseUser && (
        <Alert>
          <AlertDescription>
            <strong>Issue Detected:</strong> Firebase user exists but auth hook shows not authenticated. 
            This usually means the backend authentication flow hasn't completed successfully.
          </AlertDescription>
        </Alert>
      )}

      {debugInfo.hookAuthenticated && !debugInfo.accessToken && (
        <Alert>
          <AlertDescription>
            <strong>Issue Detected:</strong> Auth hook shows authenticated but no access token found. 
            API calls will fail until this is resolved.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
} 