import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const script = resolve("scripts/check-production-env.mjs");
const authSecret = "test-only-auth-7f0290c914ad749509da";
const dbPassword = "test-only-db-f3c491be096adb749509da";
const connection = (password: string) => `postgresql://fable:${encodeURIComponent(password)}@postgres:5432/fable`;
const validEnv: NodeJS.ProcessEnv = {
  NODE_ENV: "production",
  NEXTAUTH_SECRET: authSecret,
  NEXTAUTH_URL: "https://cards.example.test",
  DATABASE_URL: connection(dbPassword),
  DIRECT_URL: connection(dbPassword),
};

// Pass only synthetic configuration; the validator must never load the developer's .env files.
function check(overrides: Record<string, string | undefined> = {}) {
  const result = spawnSync(process.execPath, [script], { env: { ...validEnv, ...overrides }, encoding: "utf8" });
  assert.ifError(result.error);
  return result;
}

test("production accepts complete HTTPS configuration without logging any values", () => {
  const result = check();
  assert.equal(result.status, 0);
  assert.equal(result.stdout, "");
  assert.equal(result.stderr, "");
});

for (const url of ["http://localhost:3000", "http://127.0.0.1:3000/", "http://[::1]:3000"]) {
  test(`HTTP remains available for the local origin ${url}`, () => {
    assert.equal(check({ NEXTAUTH_URL: url }).status, 0);
  });
}

test("exactly 32 characters is the minimum accepted length for both secrets", () => {
  assert.equal(check({ NEXTAUTH_SECRET: "a".repeat(32), DATABASE_URL: connection("b".repeat(32)), DIRECT_URL: connection("c".repeat(32)) }).status, 0);
});

test("missing variables are all reported even when local .env files exist", () => {
  const result = check({ NEXTAUTH_SECRET: undefined, NEXTAUTH_URL: undefined, DATABASE_URL: undefined, DIRECT_URL: undefined });
  assert.equal(result.status, 1);
  for (const key of ["NEXTAUTH_SECRET", "NEXTAUTH_URL", "DATABASE_URL", "DIRECT_URL"]) assert.ok(result.stderr.includes(key));
});

for (const secret of ["", "a".repeat(31), " ".repeat(40), "change_me_" + "a".repeat(32), "REPLACE_WITH_" + "a".repeat(32), "example_" + "a".repeat(32), "your_secret_" + "a".repeat(32)]) {
  test(`authentication rejects unsafe secret case ${JSON.stringify(secret.slice(0, 12))}`, () => {
    const result = check({ NEXTAUTH_SECRET: secret });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("NEXTAUTH_SECRET"));
  });
}

for (const key of ["DATABASE_URL", "DIRECT_URL"]) {
  for (const [label, password] of [
    ["empty", ""], ["short", "a".repeat(31)], ["whitespace", " ".repeat(40)],
    ["change placeholder", "change_me_" + "a".repeat(32)],
    ["replace placeholder", "REPLACE_WITH_" + "a".repeat(32)],
    ["example placeholder", "example_" + "a".repeat(32)],
    ["percent-encoded short password", "@".repeat(16)],
  ]) {
    test(`${key} rejects ${label} passwords`, () => {
      const result = check({ [key]: connection(password) });
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes(key));
    });
  }
  for (const url of ["not-a-url", "mysql://user:password@postgres/fable", "postgresql://postgres/fable", "postgresql://:password@postgres/fable", "postgresql://user:%invalid@postgres/fable"]) {
    test(`${key} rejects malformed or incomplete connection ${url.split(":")[0]}`, () => {
      const result = check({ [key]: url });
      assert.equal(result.status, 1);
      assert.ok(result.stderr.includes(key));
    });
  }
}

for (const [label, url] of [
  ["malformed", "not-a-url"], ["public HTTP", "http://cards.example.test"],
  ["another protocol", "ftp://cards.example.test"],
  ["credentials", "https://private-user:private-pass@cards.example.test"],
  ["query", "https://cards.example.test/?token=private-token"],
  ["fragment", "https://cards.example.test/#private-token"],
  ["path", "https://cards.example.test/battle"],
  ["auth route path", "https://cards.example.test/api/auth/"],
]) {
  test(`NEXTAUTH_URL rejects ${label}`, () => {
    const result = check({ NEXTAUTH_URL: url });
    assert.equal(result.status, 1);
    assert.ok(result.stderr.includes("NEXTAUTH_URL"));
  });
}

test("failure reports variable names without printing secrets or connection URLs", () => {
  const values = {
    NEXTAUTH_SECRET: "do-not-print-this-auth-value",
    NEXTAUTH_URL: "https://private-user:do-not-print-auth-password@cards.example.test/private-path?token=private-token",
    DATABASE_URL: connection("do-not-print-db-password"),
    DIRECT_URL: connection("do-not-print-direct-password"),
  };
  const result = check(values);
  assert.equal(result.status, 1);
  for (const key of Object.keys(values)) assert.ok(result.stderr.includes(key));
  for (const value of [...Object.values(values), "private-user", "do-not-print-auth-password", "private-token", "do-not-print-db-password", "do-not-print-direct-password", authSecret, dbPassword]) {
    assert.ok(!result.stderr.includes(value));
    assert.ok(!result.stdout.includes(value));
  }
});
