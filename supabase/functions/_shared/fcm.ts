// Firebase Cloud Messaging HTTP v1 helper for Deno edge functions.
// Uses the FCM_SERVICE_ACCOUNT_JSON service-account secret to mint OAuth2 tokens.

interface ServiceAccount {
  client_email: string;
  private_key: string;
  project_id: string;
  token_uri?: string;
}

let cachedToken: { token: string; expiresAt: number } | null = null;
let cachedSA: ServiceAccount | null = null;

function loadServiceAccount(): ServiceAccount {
  if (cachedSA) return cachedSA;
  const raw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON");
  if (!raw) throw new Error("FCM_SERVICE_ACCOUNT_JSON not configured");
  cachedSA = JSON.parse(raw) as ServiceAccount;
  return cachedSA;
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  return buf.buffer;
}

function base64url(input: ArrayBuffer | string): string {
  let bytes: Uint8Array;
  if (typeof input === "string") bytes = new TextEncoder().encode(input);
  else bytes = new Uint8Array(input);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const sa = loadServiceAccount();

  const header = { alg: "RS256", typ: "JWT" };
  const iat = Math.floor(Date.now() / 1000);
  const claim = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: sa.token_uri || "https://oauth2.googleapis.com/token",
    iat,
    exp: iat + 3600,
  };
  const unsigned = `${base64url(JSON.stringify(header))}.${base64url(JSON.stringify(claim))}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(sa.private_key),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, new TextEncoder().encode(unsigned));
  const jwt = `${unsigned}.${base64url(sig)}`;

  const res = await fetch(claim.aud, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) throw new Error(`FCM token exchange failed: ${res.status} ${await res.text()}`);
  const data = await res.json();
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.token;
}

export interface FcmSendResult {
  ok: boolean;
  status: number;
  body: string;
  shouldRemoveToken?: boolean;
}

export async function sendFcm(
  token: string,
  payload: { title: string; body: string; data?: Record<string, string> },
): Promise<FcmSendResult> {
  const sa = loadServiceAccount();
  const accessToken = await getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`;
  const message = {
    message: {
      token,
      notification: { title: payload.title, body: payload.body },
      data: payload.data,
      android: { priority: "HIGH" as const },
      apns: { headers: { "apns-priority": "10" } },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });
  const body = await res.text();
  // 404/UNREGISTERED or 400/INVALID_ARGUMENT for malformed token => prune
  const shouldRemoveToken =
    res.status === 404 ||
    (res.status === 400 && /INVALID_ARGUMENT|invalid registration/i.test(body)) ||
    /UNREGISTERED|NOT_FOUND/.test(body);
  return { ok: res.ok, status: res.status, body, shouldRemoveToken };
}
