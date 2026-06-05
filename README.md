# Skybridge

Skybridge is a sponsorship marketplace for matching fundraisers with sponsors and managing the workflow around those matches. The root repo contains the Next.js app, Solidity contract, and deployment scripts that back the product.

## Repo Layout

- `main/` for the application UI, API routes, and supporting assets
- `contracts/` for the `SponsorshipEscrow.sol` smart contract
- `migrations/` for the Truffle deployment script

## Where to Start

- See `main/README.md` for the app-specific setup and layout.
- The frontend entry points live under `main/src/app/`.
- Contract deployment and sponsor/fundraiser flow code live in `contracts/` and `migrations/`.
