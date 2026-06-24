// Side-effect module: load env vars for standalone scripts (seed, etc.).
// Next.js loads .env files itself, so this is only needed when running
// tsx/node directly. Imported FIRST so process.env is populated before the
// db client reads DATABASE_URL.
for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file missing — fine, try the next one / rely on existing env
  }
}
