import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const image = process.argv[2] ?? "fable-armageddon:publish-check";
if (!/^[a-zA-Z0-9][a-zA-Z0-9._/:@-]*$/.test(image)) throw new Error("Invalid Docker image name");
const project = "fable-smoke-" + randomBytes(6).toString("hex");
const password = randomBytes(24).toString("hex");
const secrets = [password, randomBytes(32).toString("hex"), randomBytes(32).toString("hex")];
const sanitize = text => secrets.filter(Boolean).reduce((value, secret) => value.split(secret).join("[redacted]"), String(text));
const cookies = new Map();
let cancelActiveCommand, interrupted = false, cleaning = false;
const interrupt = () => { if (!cleaning) { interrupted = true; cancelActiveCommand?.("interrupted"); } };
process.once("SIGINT", interrupt);
process.once("SIGTERM", interrupt);

// Docker Compose is a child plugin on Windows; killing only docker.exe can leave its pipes open.
async function stopProcessTree(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  if (process.platform !== "win32" || !child.pid) { child.kill("SIGKILL"); return; }
  await new Promise(resolveStop => {
    const killer = spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { shell: false, windowsHide: true, stdio: "ignore" });
    const done = () => { clearTimeout(timer); resolveStop(); };
    const timer = setTimeout(() => { killer.kill(); killer.unref(); resolveStop(); }, 5_000);
    killer.once("error", () => { child.kill(); done(); });
    killer.once("close", done);
  });
}

function docker(args, env, timeout = 60_000) {
  if (interrupted && !cleaning) return Promise.reject(new Error("Smoke test interrupted"));
  return new Promise((resolveCommand, reject) => {
    const child = spawn(process.platform === "win32" ? "docker.exe" : "docker", args, { cwd: root, env, shell: false, windowsHide: true });
    const label = ["config", "up", "exec", "down"].find(value => args.includes(value)) ?? "command";
    let output = "", finished = false, stopping = false;
    const finish = error => {
      if (finished) return;
      finished = true; clearTimeout(timer); cancelActiveCommand = undefined;
      if (error) { child.stdin.destroy(); child.stdout.destroy(); child.stderr.destroy(); child.unref(); reject(error); }
      else resolveCommand(output);
    };
    const stop = async reason => {
      if (finished || stopping) return;
      stopping = true;
      console.error(`Docker ${label} ${reason}; terminating its process tree...`);
      try { await stopProcessTree(child); }
      catch { /* Closing the pipes below still releases the runner if process termination fails. */ }
      finally { finish(new Error(`Docker ${label} failed (${reason}):\n` + sanitize(output).slice(-8_000))); }
    };
    cancelActiveCommand = reason => { void stop(reason); };
    const timer = setTimeout(() => { void stop("timeout"); }, timeout);
    const capture = chunk => { output = (output + chunk.toString()).slice(-32_000); };
    child.stdout.on("data", capture);
    child.stderr.on("data", capture);
    child.on("error", error => { if (!stopping) finish(new Error("Docker could not start: " + error.message)); });
    child.on("close", code => {
      if (!stopping) finish(code === 0 ? undefined : new Error(`Docker ${label} failed (exit ${code}):\n` + sanitize(output).slice(-8_000)));
    });
  });
}

function freePort() {
  return new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close(error => error ? reject(error) : resolvePort(port));
    });
  });
}

async function request(base, path, status, options = {}) {
  if (interrupted) throw new Error("Smoke test interrupted");
  const response = await fetch(base + path, { ...options, redirect: "manual", signal: AbortSignal.timeout(15_000),
    headers: { Cookie: [...cookies].map(([key, value]) => key + "=" + value).join("; "), ...options.headers } });
  for (const header of response.headers.getSetCookie()) {
    const pair = header.split(";", 1)[0], equals = pair.indexOf("=");
    if (equals > 0) { cookies.set(pair.slice(0, equals), pair.slice(equals + 1)); secrets.push(pair.slice(equals + 1)); }
  }
  if (response.status !== status) throw new Error(`${path} expected HTTP ${status}, received ${response.status}`);
  return response;
}

async function main() {
  const port = await freePort(), base = `http://localhost:${port}`;
  const fixture = { POSTGRES_DB: "fable_smoke", POSTGRES_USER: "fable_smoke", POSTGRES_PASSWORD: secrets[1],
    NEXTAUTH_SECRET: secrets[2], NEXTAUTH_URL: base, APP_PORT: String(port) };
  const env = { ...process.env, ...fixture };
  const directory = await mkdtemp(join(tmpdir(), "fable-smoke-"));
  const envFile = join(directory, ".env.smoke"), overrideFile = join(directory, "compose.override.json");
  const args = ["compose", "--project-directory", root, "--env-file", envFile, "--project-name", project,
    "-f", join(root, "docker-compose.yml"), "-f", overrideFile];
  const compose = (extra, timeout) => docker([...args, ...extra], env, timeout);
  let started = false, failure;
  try {
    await writeFile(envFile, Object.entries(fixture).map(([key, value]) => key + "=" + value).join("\n") + "\n", { mode: 0o600 });
    await writeFile(overrideFile, JSON.stringify({ services: {
      postgres: { container_name: project + "-postgres" },
      app: { container_name: project + "-app", image, pull_policy: "never" },
    }, volumes: { postgres_data: { name: project + "_postgres_data" } } }), { mode: 0o600 });
    console.log("Validating isolated Docker Compose configuration...");
    await compose(["config", "--quiet"]);
    started = true;
    console.log("Starting isolated Docker smoke environment...");
    await compose(["up", "-d", "--no-build", "--wait", "--wait-timeout", "120"], 180_000);
    console.log("Loading initial catalog (first run)...");
    await compose(["exec", "-T", "app", "node", "prisma/seed.cjs"], 90_000);
    console.log("Loading initial catalog (repeat run)...");
    await compose(["exec", "-T", "app", "node", "prisma/seed.cjs"], 90_000);
    console.log("PASS migrations, application health and repeatable seed");
    const runtimeCheck = `
      const fs = require('node:fs'), path = require('node:path');
      if (!process.getuid || process.getuid() === 0) throw new Error('Application must run without root');
      function scan(dir) {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
          if (/^\\.env(?:\\.|$)/.test(entry.name) || /\\.(db|sqlite|sqlite3|dump)$/i.test(entry.name)) throw new Error('Private file found in application image');
          if (entry.isDirectory() && entry.name !== 'node_modules') scan(path.join(dir, entry.name));
        }
      }
      scan('/app');
    `;
    console.log("Checking runtime user and application image contents...");
    await compose(["exec", "-T", "app", "node", "-e", runtimeCheck]);
    console.log("PASS non-root runtime and private-file exclusions");
    console.log("Checking HTTP routes and registration...");
    await request(base, "/login", 200);
    await request(base, "/api/player", 401);
    for (const path of ["/menu", "/battle", "/decks", "/packs", "/starter-decks"]) {
      const redirect = await request(base, path, 307);
      if (!new URL(redirect.headers.get("location"), base).pathname.startsWith("/login"))
        throw new Error("Protected page did not redirect to login: " + path);
    }
    const post = body => ({ method: "POST", headers: { "Content-Type": "application/json" }, body });
    await request(base, "/api/register", 400, post("{invalid-json"));
    const email = "smoke-" + randomBytes(5).toString("hex") + "@example.invalid";
    const account = { username: "Smoke_" + randomBytes(5).toString("hex"), email, password };
    await request(base, "/api/register", 400, post(JSON.stringify({ ...account, password: "short" })));
    await request(base, "/api/register", 201, post(JSON.stringify(account)));
    await request(base, "/api/register", 400, post(JSON.stringify({ ...account, username: account.username + "2", email: email.toUpperCase() })));
    console.log("PASS registration validation, creation and duplicate-email protection");
    console.log("Checking credentials login and session...");
    const csrf = await (await request(base, "/api/auth/csrf", 200)).json();
    if (typeof csrf.csrfToken !== "string" || !csrf.csrfToken) throw new Error("CSRF token unavailable");
    secrets.push(csrf.csrfToken);
    await request(base, "/api/auth/callback/credentials", 200, { method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({
        csrfToken: csrf.csrfToken, email: email.toUpperCase(), password, callbackUrl: base + "/menu", json: "true",
      }) });
    const session = await (await request(base, "/api/auth/session", 200)).json();
    if (session.user?.email !== email) throw new Error("Credentials login did not create the expected session");
    await request(base, "/api/player", 200);
    console.log("PASS credentials login, session and authenticated player access");
  } catch (error) { failure = error; }
  finally {
    cleaning = true;
    if (started && /^fable-smoke-[a-f0-9]{12}$/.test(project)) {
      console.log("Stopping and removing isolated Docker smoke resources...");
      try { await compose(["down", "--volumes", "--timeout", "10"], 30_000); }
      catch (error) { failure ??= error; console.error("Isolated smoke resources could not be fully removed: " + project); }
    }
    const safeDirectory = resolve(directory);
    if (safeDirectory.startsWith(resolve(tmpdir()) + sep) && basename(safeDirectory).startsWith("fable-smoke-")) {
      for (const file of [envFile, overrideFile]) {
        if (dirname(resolve(file)) === safeDirectory) await unlink(file).catch(error => { if (error.code !== "ENOENT") failure ??= error; });
      }
      await rmdir(safeDirectory).catch(error => { failure ??= error; });
    } else failure ??= new Error("Refused cleanup outside the smoke temporary directory");
  }
  if (failure) throw failure;
  console.log("Docker smoke checks passed; isolated containers, volume and temporary files removed.");
}

main().catch(error => { console.error(sanitize(error.message)); process.exitCode = 1; });
