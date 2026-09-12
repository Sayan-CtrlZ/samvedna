/**
 * SAMVEDNA AI - Frontend API Client Helper
 * Pure database-driven client connected to backend APIs.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const DEFAULT_CASES = [];
export const DEFAULT_CASE_FILES = {};

export const getApiUrl = (path) => {
  if (!path) return API_BASE_URL;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Safe fetch wrapper that prevents JSON parse errors when receiving HTML 404/405 error pages.
 */
export const safeFetchJson = async (path, options = {}) => {
  const url = getApiUrl(path);
  try {
    const res = await fetch(url, options);
    if (!res.ok) {
      console.warn(`[API] Response not OK (${res.status}) for ${url}`);
      return { ok: false, status: res.status, data: null };
    }
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      console.warn(`[API] Non-JSON response received from ${url} (received: ${contentType})`);
      return { ok: false, status: res.status, data: null, isHtmlFallback: true };
    }
    const data = await res.json();
    return { ok: true, status: res.status, data };
  } catch (err) {
    console.warn(`[API] Fetch exception for ${url}:`, err);
    return { ok: false, status: 0, data: null, error: err };
  }
};
