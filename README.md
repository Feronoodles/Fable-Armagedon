# Fable Armageddon

## Development

Requirements: Node.js 22 or 24, npm and Docker Compose. Install dependencies with `npm ci`.

Run the local server:

```bash
npm run dev
```

Open `http://localhost:3000`.

### Local PostgreSQL with Docker

If you want Docker only for the database:

1. Copy the database env file:

```bash
cp .env.db.example .env.db
```

2. Copy the app env file:

```bash
cp .env.local.example .env
```

Replace all placeholder passwords and secrets before starting. Use a separate random value for `NEXTAUTH_SECRET`. Generate each value with `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`. Set the same database password in `.env.db`, `DATABASE_URL` and `DIRECT_URL`. Prisma CLI and Next.js both read `.env`; an existing `.env.local` can override Next.js settings and should refer to the same local database.

3. Start PostgreSQL only:

```bash
docker compose --env-file .env.db -f docker-compose.db.yml up -d
```

4. Run Prisma migrations:

```bash
npx prisma migrate deploy
```

5. Seed the database once:

```bash
npm run seed
```

6. Start the app locally:

```bash
npm run dev
```

Stop the local database with:

```bash
docker compose --env-file .env.db -f docker-compose.db.yml down
```

### Starter decks

New players are sent to `/starter-decks` after signing in for the first time. They can claim one of four introductory decks. The claim creates the deck, grants its cards and basic mana, and can only be used once per player.

The starter-deck migration is included in `prisma/migrations`; apply it with `npx prisma migrate deploy` when setting up another environment.

## Database

The project uses:

- Prisma
- PostgreSQL

Local development currently reads connection settings from `.env`.

## Production deployment

The production application runs as a non-root user. PostgreSQL has no published port; the application binds to the server's loopback interface for an HTTPS reverse proxy. Real environment files, local databases and backups must stay private.

This repository now includes:

- `Dockerfile`
- `docker-compose.yml`
- `.env.production.example`
- `DEPLOYMENT.md`

For a clean VPS deployment with Docker Compose and PostgreSQL, follow:

```text
DEPLOYMENT.md
```

## Verification

```bash
npm test
npm run build
npm audit --omit=dev
```

`npm test` runs the game rules, pack rules, combat geometry and registration validation tests. Database integration tests require a prepared database and run separately with `npm run test:integration`.

To verify a fresh Docker installation with disposable, isolated containers and synthetic credentials:

```bash
docker build -t fable-armageddon:publish-check .
npm run test:docker
```

This checks migrations, repeatable seed, a non-root runtime, private-file exclusions, registration and login. It removes only its own temporary containers and volume when finished.

Only sanitized `.env*.example` templates belong in Git. Real credentials and database files are excluded from Git and Docker build contexts.
