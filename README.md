# Skybridge

Skybridge is a peer-to-peer AI sponsorship matchmaking platform connecting fundraisers with sponsors.

## Features

- Authenticated fundraiser and sponsor accounts
- Opportunity creation, filtering, scoring, and atomic match approval
- Browser-wallet sponsorship escrow with two-party acceptance and deadline refund
- Solidity contract, Truffle migration, API routes, and Next.js UI

## Getting started

```bash
npm ci --legacy-peer-deps
npm run dev
```

Set `MONGODB_URI`, `NEXTAUTH_SECRET`, and `OPENAI_API_KEY` in `.env.local` before using authenticated or AI flows.

## API failure logs

Custom API route failures print structured diagnostics to the Next.js server terminal:

```text
[api_failure] {"event":"api_failure","requestId":"...","route":"/api/signup","status":400,"phase":"validation","publicError":"Invalid accountAddress","details":{"field":"accountAddress"}}
```

Use returned `x-request-id` header to correlate a browser error with its server log. Passwords, request bodies, and API keys are never logged.

## Verification

```bash
npm run test:all
npm run lint
npx tsc --noEmit --incremental false
npm run build
```

App entry points live under `src/app/`. Contracts live under `contracts/`; deployment scripts live under `migrations/`.
