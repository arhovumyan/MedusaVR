// Quick test script to verify the signup flow fixes
// Run this in the browser console after the fixes are deployed

async function testSignupFlow() {
  console.log(' Testing signup flow fixes...');
  
  try {
    // Test 1: Check if CSP allows Google Tag Manager
    console.log('1️⃣ Testing CSP for Google Tag Manager...');
    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?l=dataLayer&id=test';
    document.head.appendChild(script);
    script.onload = () => console.log(' Google Tag Manager script loaded successfully');
    script.onerror = () => console.error(' Google Tag Manager blocked by CSP');
    
    // Test 2: Check if CSRF token endpoint works
    console.log('2️⃣ Testing CSRF token endpoint...');
    const csrfResponse = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (csrfResponse.ok) {
      const csrfData = await csrfResponse.json();
      console.log(' CSRF token retrieved:', csrfData.csrfToken ? 'Yes' : 'No');
    } else {
      console.error(' Failed to get CSRF token:', csrfResponse.status);
    }
    
    // Test 3: Check registration endpoint (without actually registering)
    console.log('3️⃣ Testing registration endpoint structure...');
    const testRegResponse = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}) // Empty body to trigger validation error
    });
    
    if (testRegResponse.status === 400) {
      const errorData = await testRegResponse.json();
      console.log(' Registration endpoint responding correctly with validation:', errorData.message);
    } else {
      console.error(' Unexpected registration response:', testRegResponse.status);
    }
    
    console.log(' Basic functionality tests completed!');
    
  } catch (error) {
    console.error(' Test failed:', error);
  }
}

// Run the test
testSignupFlow();
