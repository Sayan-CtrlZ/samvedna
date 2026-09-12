/**
 * SAMVEDNA AI - Frontend API Client Helper & Default Case Dockets
 * Supports local development, custom VITE_API_BASE_URL, and fallback persistence.
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export const DEFAULT_CASES = [
  {
    victim_id: 'VIC-MP-881',
    victim_code: 'SURVIVOR-MP-881',
    code_name: 'SURVIVOR-MP-881',
    state: 'Madhya Pradesh',
    district: 'Morena',
    location: 'GPS: 26.4980° N, 77.9940° E (Morena, Madhya Pradesh)',
    current_risk_level: 'CRITICAL',
    current_dds: 88.5,
    trend_status: 'Acute Crisis Spike (+24 pts)',
    summary: 'Threats and intimidation experienced outside home. Accused associates approaching family.',
    sections_invoked: 'Section 3(1)(r), 3(1)(s), 3(2)(va) SC/ST PoA Act',
    accused_on_bail: true,
    compensation_delayed: false,
    needs_relocation: true,
    legal_stage: 'Bail Challenge in High Court'
  },
  {
    victim_id: 'VIC-MH-114',
    victim_code: 'SURVIVOR-MH-114',
    code_name: 'SURVIVOR-MH-114',
    state: 'Maharashtra',
    district: 'Ahmednagar',
    location: 'GPS: 19.0948° N, 74.7480° E (Ahmednagar, Maharashtra)',
    current_risk_level: 'CRITICAL',
    current_dds: 84.0,
    trend_status: 'Witness Intimidation Spike (+26 pts)',
    summary: 'Approached by unknown individuals attempting to force signing retraction documents.',
    sections_invoked: 'Section 3(1)(r), 3(2)(va) SC/ST PoA Act',
    accused_on_bail: true,
    compensation_delayed: false,
    needs_relocation: true,
    legal_stage: 'Eyewitness Examination'
  },
  {
    victim_id: 'VIC-UP-409',
    victim_code: 'COMPLAINANT-UP-409',
    code_name: 'COMPLAINANT-UP-409',
    state: 'Uttar Pradesh',
    district: 'Hathras',
    location: 'GPS: 27.5950° N, 78.0500° E (Hathras, Uttar Pradesh)',
    current_risk_level: 'HIGH',
    current_dds: 74.0,
    trend_status: 'Escalating Distress (+14 pts)',
    summary: 'High anxiety regarding threats received in village area.',
    sections_invoked: 'Section 3(1)(w), 3(2)(v) SC/ST PoA Act',
    accused_on_bail: false,
    compensation_delayed: true,
    needs_relocation: false,
    legal_stage: 'Investigation & Charge Sheet'
  },
  {
    victim_id: 'VIC-BR-712',
    victim_code: 'SURVIVOR-BR-712',
    code_name: 'SURVIVOR-BR-712',
    state: 'Bihar',
    district: 'Gaya',
    location: 'GPS: 24.7914° N, 85.0002° E (Gaya, Bihar)',
    current_risk_level: 'HIGH',
    current_dds: 76.5,
    trend_status: 'Severe Depressive Hopelessness',
    summary: 'Land encroachment dispute. Severe economic destitution and intimidation.',
    sections_invoked: 'Section 3(1)(f), 3(2)(v) SC/ST PoA Act',
    accused_on_bail: true,
    compensation_delayed: true,
    needs_relocation: true,
    legal_stage: 'Charge Sheet & Framing Issues'
  },
  {
    victim_id: 'VIC-TN-531',
    victim_code: 'SURVIVOR-TN-531',
    code_name: 'SURVIVOR-TN-531',
    state: 'Tamil Nadu',
    district: 'Tirunelveli',
    location: 'GPS: 8.7139° N, 77.7567° E (Tirunelveli, Tamil Nadu)',
    current_risk_level: 'MODERATE',
    current_dds: 54.0,
    trend_status: 'Monitoring (-8 pts)',
    summary: 'Physical recovery progressing. Apprehensive regarding safety in dominant community neighborhood.',
    sections_invoked: 'Section 3(1)(r) SC/ST PoA Act',
    accused_on_bail: false,
    compensation_delayed: false,
    needs_relocation: false,
    legal_stage: 'Trial Examination'
  },
  {
    victim_id: 'VIC-RJ-215',
    victim_code: 'SURVIVOR-RJ-215',
    code_name: 'SURVIVOR-RJ-215',
    state: 'Rajasthan',
    district: 'Udaipur',
    location: 'GPS: 24.5854° N, 73.7125° E (Udaipur, Rajasthan)',
    current_risk_level: 'RESOLVED',
    current_dds: 32.0,
    trend_status: 'Protection Enforced & Resolved ✓',
    summary: 'Dwelling damaged after dispute over village common well. Protection enforced by district police.',
    sections_invoked: 'Section 3(1)(z), 3(1)(f) SC/ST PoA Act',
    accused_on_bail: true,
    compensation_delayed: true,
    needs_relocation: false,
    legal_stage: 'Special Court Trial'
  }
];

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
