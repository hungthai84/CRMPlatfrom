export async function fetchWithToken(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('google_access_token') || sessionStorage.getItem('google_access_token');
  if (!token) {
    throw new Error('No Google Access Token found. Please authenticate with Google Services.');
  }

  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    console.error('Google API Error:', errorData);
    if (response.status === 401) {
      throw new Error('Google authentication expired or invalid. Please re-authenticate.');
    }
    throw new Error(errorData?.error?.message || `Google API request failed with status ${response.status}`);
  }
  
  return response.json();
}
