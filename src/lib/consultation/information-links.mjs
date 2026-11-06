/** Only backend-provided HTTPS URLs are offered; reserved synthetic domains never become links. */
export function safeOfficialLink(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password && !url.hostname.endsWith(".invalid") ? url.href : null;
  } catch { return null; }
}

export function isSyntheticTestDomain(value) {
  try { return new URL(value).hostname.endsWith(".invalid"); } catch { return false; }
}
