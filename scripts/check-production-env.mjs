// Validate only configuration shape; never log the values of secrets or connection URLs.
const invalid = [];
const isUnsafeSecret = value => value.trim().length < 32 || /^(change|replace|your[_ -]|example)/i.test(value.trim());
const secret = process.env.NEXTAUTH_SECRET ?? "";
if (isUnsafeSecret(secret)) {
  invalid.push("NEXTAUTH_SECRET must be a unique random value of at least 32 characters");
}

try {
  const url = new URL(process.env.NEXTAUTH_URL ?? "");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/" ||
      (url.protocol !== "https:" && !(local && url.protocol === "http:"))) {
    throw new Error("invalid URL");
  }
} catch {
  invalid.push("NEXTAUTH_URL must be the public HTTPS URL (HTTP is allowed only on localhost)");
}

for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  try {
    const url = new URL(process.env[key] ?? "");
    if (!["postgres:", "postgresql:"].includes(url.protocol) || !url.hostname || !url.username ||
        isUnsafeSecret(decodeURIComponent(url.password))) {
      throw new Error("invalid connection URL");
    }
  } catch {
    invalid.push(`${key} must be a PostgreSQL connection URL with credentials and a unique password of at least 32 characters`);
  }
}

if (invalid.length) {
  console.error("Production configuration is incomplete:\n- " + invalid.join("\n- "));
  process.exit(1);
}
