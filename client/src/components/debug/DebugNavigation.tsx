import { Link, useLocation } from "wouter";

export function DebugNavigation() {
  const [location] = useLocation();
  
  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-4 rounded z-50 max-w-xs">
      <h3 className="font-bold mb-2">Debug Navigation</h3>
      <p className="text-xs mb-2">Current: {location}</p>
      
      <div className="flex flex-col gap-2">
        <Link 
          href="/favorites" 
          className="underline hover:text-yellow-300 cursor-pointer"
          onClick={() => console.log('Debug: Clicking favorites link')}
        >
          Go to Favorites
        </Link>
        <Link 
          href="/coins" 
          className="underline hover:text-yellow-300 cursor-pointer"
          onClick={() => console.log('Debug: Clicking coins link')}
        >
          Go to Coins
        </Link>
        <Link 
          href="/test" 
          className="underline hover:text-yellow-300 cursor-pointer"
          onClick={() => console.log('Debug: Clicking test link')}
        >
          Go to Test Page
        </Link>
        
        <button 
          className="bg-orange-500 p-1 rounded text-xs mt-2"
          onClick={() => {
            console.log('Debug: Testing sidebar items');
            console.log('Sidebar open elements:', document.querySelectorAll('[data-sidebar-item]'));
          }}
        >
          Debug Sidebar
        </button>
      </div>
    </div>
  );
}
