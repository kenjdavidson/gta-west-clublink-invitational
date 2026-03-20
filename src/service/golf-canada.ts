/** Golf Canada API client — authenticates and fetches member scoring data at build time. */

const TOKEN_URL = 'https://scg.golfcanada.ca/connect/token';
const API_BASE = 'https://scg.golfcanada.ca/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GolfCanadaUser {
  id: number;
  fullName: string;
  firstName: string;
  lastName: string;
  handicap: string;
  membershipLevel: string;
  expirationDate: string;
}

export interface GolfCanadaLoginResponse {
  access_token: string;
  user: GolfCanadaUser;
}

export interface GolfCanadaScoreHistory {
  id: number;
  date: string;
  course: string;
  adjustedDifferential: number;
  adjustment: number;
  adjustments: unknown[];
  canDelete: boolean;
  canEdit: boolean;
  differential: number;
  estimatedRating: number | null;
  estimatedSlope: number | null;
  expectedDifferential: number;
  holes: string;
  isEdited: boolean;
  isHandicapScore: boolean;
  isPCC: boolean;
  isUsedInCalc: boolean;
  pccAdjustment: number | null;
  playedDifferential: number;
  rating: number;
  scaleTypeId: string;
  scaledHolesPlayed: number;
  score: number;
  slope: number;
  tee: string;
  type: string;
}

// ---------------------------------------------------------------------------
// Cache
// ---------------------------------------------------------------------------

let _cachedLogin: GolfCanadaLoginResponse | null = null;

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

/**
 * Authenticates with Golf Canada using credentials from the
 * `GOLFCANADA_USERNAME` and `GOLFCANADA_PASSWORD` environment variables.
 *
 * The result is cached after the first successful call so that subsequent
 * calls return the same token without making additional network requests.
 */
export async function login(): Promise<GolfCanadaLoginResponse> {
  if (_cachedLogin) {
    return _cachedLogin;
  }

  const username = process.env.GOLFCANADA_USERNAME;
  const password = process.env.GOLFCANADA_PASSWORD;

  if (!username || !password) {
    throw new Error('GOLFCANADA_USERNAME and GOLFCANADA_PASSWORD environment variables must be set');
  }

  const body = new URLSearchParams({
    grant_type: 'password',
    username,
    password,
    scope: 'address email offline_access openid phone profile roles',
  });

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!response.ok) {
    throw new Error(`Golf Canada login failed: ${response.status} ${response.statusText}`);
  }

  const data = (await response.json()) as Record<string, unknown>;
  if (!data.access_token || !data.user) {
    throw new Error('Golf Canada login response is missing required fields (access_token, user)');
  }

  _cachedLogin = data as unknown as GolfCanadaLoginResponse;
  return _cachedLogin;
}

/**
 * Fetches the score history for a member from Golf Canada.
 *
 * Credentials are read from the `GOLFCANADA_USERNAME` and
 * `GOLFCANADA_PASSWORD` environment variables.
 *
 * @param individualId  The member's Golf Canada individual ID
 */
export async function getHistory(individualId: number): Promise<GolfCanadaScoreHistory[]> {
  const loginData = await login();
  const url = `${API_BASE}/scores/getHistory?$skip=0&$top=100&individualId=${individualId}`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${loginData.access_token}` },
  });

  if (!response.ok) {
    throw new Error(`Golf Canada getHistory failed: ${response.status} ${response.statusText}`);
  }

  const json = (await response.json()) as { data: GolfCanadaScoreHistory[] };
  return json.data;
}
