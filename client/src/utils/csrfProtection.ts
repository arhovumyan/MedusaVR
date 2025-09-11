// CSRF Token Management for MedusaVR
// This utility handles CSRF token retrieval and injection into API requests

// CSRF token cache
let csrfToken: string | null = null;
let tokenExpiry: number = 0;

/**
 * Retrieves a fresh CSRF token from the server
 */
export async function fetchCsrfToken(): Promise<string> {
  try {
    const response = await fetch('/api/csrf-token', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch CSRF token: ${response.status}`);
    }

    const data = await response.json();
    if (!data.csrfToken) {
      throw new Error('No CSRF token in response');
    }

    // Cache the token for 50 minutes (tokens expire in 1 hour)
    csrfToken = data.csrfToken;
    tokenExpiry = Date.now() + (50 * 60 * 1000);

    console.log('🛡️ CSRF token obtained successfully');
    return data.csrfToken;
  } catch (error) {
    console.error('❌ Failed to fetch CSRF token:', error);
    throw error;
  }
}

/**
 * Gets a valid CSRF token, fetching a new one if necessary
 */
export async function getCsrfToken(): Promise<string> {
  // Return cached token if still valid
  if (csrfToken && Date.now() < tokenExpiry) {
    return csrfToken;
  }

  // Fetch new token
  return await fetchCsrfToken();
}

/**
 * Adds CSRF token to request headers
 */
export async function addCsrfToHeaders(headers: Record<string, string> = {}): Promise<Record<string, string>> {
  try {
    const token = await getCsrfToken();
    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  } catch (error) {
    console.warn('⚠️ Could not add CSRF token to headers:', error);
    // Return original headers if CSRF token fails
    return headers;
  }
}

/**
 * Enhanced form data with CSRF token
 */
export async function addCsrfToFormData(formData: FormData): Promise<FormData> {
  try {
    const token = await getCsrfToken();
    formData.append('_csrf', token);
    return formData;
  } catch (error) {
    console.warn('⚠️ Could not add CSRF token to form data:', error);
    // Return original form data if CSRF token fails
    return formData;
  }
}

/**
 * Enhanced JSON body with CSRF token
 */
export async function addCsrfToBody(body: any): Promise<any> {
  try {
    const token = await getCsrfToken();
    return {
      ...body,
      _csrf: token,
    };
  } catch (error) {
    console.warn('⚠️ Could not add CSRF token to body:', error);
    // Return original body if CSRF token fails
    return body;
  }
}

/**
 * Clears cached CSRF token (useful on logout or token errors)
 */
export function clearCsrfToken(): void {
  csrfToken = null;
  tokenExpiry = 0;
  console.log('🗑️ CSRF token cache cleared');
}

/**
 * Enhanced API request function with CSRF protection
 */
export async function secureApiRequest(
  method: string,
  url: string,
  body?: any,
  headers: Record<string, string> = {},
  options: {
    requireCsrf?: boolean;
    priority?: 'high' | 'medium' | 'low';
  } = {}
): Promise<Response> {
  const { requireCsrf = true, priority = 'medium' } = options;

  // Add CSRF token for state-changing operations
  const needsCsrf = requireCsrf && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method.toUpperCase());
  
  let finalHeaders = headers;
  let finalBody = body;

  if (needsCsrf) {
    try {
      finalHeaders = await addCsrfToHeaders(headers);
      
      // If body is FormData, add CSRF token to form data
      if (body instanceof FormData) {
        finalBody = await addCsrfToFormData(body);
      } else if (body && typeof body === 'object') {
        // If body is JSON, add CSRF token to body
        finalBody = await addCsrfToBody(body);
      }
    } catch (error) {
      console.warn('⚠️ CSRF token handling failed, proceeding without token:', error);
      // Continue with request even if CSRF fails (graceful degradation)
    }
  }

  // Use the existing apiRequest function from queryClient
  const { apiRequest } = await import('../lib/queryClient');
  
  try {
    return await apiRequest(method, url, finalBody, finalHeaders, priority);
  } catch (error: any) {
    // Handle CSRF-related errors
    if (error.status === 403 && error.message?.includes('CSRF')) {
      console.warn('🛡️ CSRF token invalid, clearing cache and retrying...');
      clearCsrfToken();
      
      // Retry once with fresh token
      if (needsCsrf) {
        try {
          finalHeaders = await addCsrfToHeaders(headers);
          if (body instanceof FormData) {
            finalBody = await addCsrfToFormData(body);
          } else if (body && typeof body === 'object') {
            finalBody = await addCsrfToBody(body);
          }
          
          return await apiRequest(method, url, finalBody, finalHeaders, priority);
        } catch (retryError) {
          console.error('❌ CSRF retry failed:', retryError);
          throw retryError;
        }
      }
    }
    
    throw error;
  }
}

/**
 * Utility for forms that need CSRF protection
 */
export class SecureFormHandler {
  private form: HTMLFormElement;
  private csrfInput: HTMLInputElement | null = null;

  constructor(form: HTMLFormElement) {
    this.form = form;
    this.setupCsrfInput();
  }

  private setupCsrfInput(): void {
    // Check if CSRF input already exists
    this.csrfInput = this.form.querySelector('input[name="_csrf"]');
    
    if (!this.csrfInput) {
      // Create CSRF input if it doesn't exist
      this.csrfInput = document.createElement('input');
      this.csrfInput.type = 'hidden';
      this.csrfInput.name = '_csrf';
      this.form.appendChild(this.csrfInput);
    }
  }

  async updateCsrfToken(): Promise<void> {
    try {
      const token = await getCsrfToken();
      if (this.csrfInput) {
        this.csrfInput.value = token;
      }
    } catch (error) {
      console.error('❌ Failed to update CSRF token in form:', error);
    }
  }

  async submit(): Promise<void> {
    await this.updateCsrfToken();
    this.form.submit();
  }
}

// Initialize CSRF token on page load
if (typeof window !== 'undefined') {
  // Pre-fetch CSRF token on page load for better UX
  getCsrfToken().catch(error => {
    console.warn('⚠️ Could not pre-fetch CSRF token:', error);
  });
  
  // Clear CSRF token on page unload
  window.addEventListener('beforeunload', clearCsrfToken);
}
