const METADATA_HOSTS = new Set([
  "metadata.google.internal",
  "metadata",
]);

export function assertSafeExternalUrl(rawUrl: string): string {
  const parsed = new URL(rawUrl);
  if (!["https:", "http:"].includes(parsed.protocol)) {
    throw new Error("Unsupported URL protocol");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (METADATA_HOSTS.has(hostname) || hostname.endsWith(".internal")) {
    throw new Error("Private network targets are not allowed");
  }

  if (
    hostname === "localhost" ||
    hostname === "0.0.0.0" ||
    hostname === "::1" ||
    hostname.startsWith("127.") ||
    hostname.startsWith("10.") ||
    hostname.startsWith("192.168.") ||
    hostname.startsWith("169.254.") ||
    /^172\.(1[6-9]|2\d|3[0-1])\./.test(hostname) ||
    /^fc[0-9a-f]{2}:/i.test(hostname) ||
    /^fd[0-9a-f]{2}:/i.test(hostname) ||
    /^fe80:/i.test(hostname)
  ) {
    throw new Error("Private network targets are not allowed");
  }

  return parsed.toString().replace(/\/$/, "");
}