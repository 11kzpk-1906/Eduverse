# EduVerse

An education-focused web application prototype for bringing learning resources and student workflows into one workspace.

## Current stack

- React and TypeScript
- Vite and TanStack tooling
- Tailwind CSS and component libraries
- Supabase integration
- npm or Bun for dependency management

The repository is currently a web application. Features described in the interface or roadmap may still be in development; check the source code and roadmap before treating them as production-ready.

## Getting started

### Requirements

- Node.js (use a current LTS release)
- npm or Bun

### Install dependencies

```bash
npm install
```

### Configure environment variables

Create a local `.env` file from your own project settings. Use the variable names referenced by the application, such as the Supabase project URL and publishable key. Never put service-role keys, private API keys, or other server secrets in variables prefixed with `VITE_`; Vite exposes those values to browser code.

Do not commit local environment files. The repository's `.gitignore` excludes them.

### Run locally

```bash
npm run dev
```

### Build and lint

```bash
npm run build
npm run lint
```

## Project layout

- `src/` — application source
- `public/` — static assets
- `supabase/` — Supabase-related project files
- `vite.config.ts` — Vite configuration

## Contributing

Keep changes focused, run the build and lint checks, and document any required environment variables without publishing their values.
