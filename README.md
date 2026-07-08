# PHANTOM

A private trading shield for Avalanche. Deposit USDC, wrap it into eERC
encrypted tokens, transfer privately, and unwrap back to USDC — nobody
on-chain can see the amounts. Your trades become invisible on-chain.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS + shadcn/ui
- ethers.js v6
- `@avalabs/ac-eerc-sdk` for eERC operations
- Avalanche Fuji C-Chain

## Structure

```
phantom/
├── frontend/          Next.js app
├── scripts/           deployment and interaction scripts
├── .env.example
└── README.md
```

## Setup

```bash
cp .env.example .env
# fill in PRIVATE_KEY, PRIVATE_KEY_2, and the deployed contract addresses

cd frontend
npm install
npm run dev
```

## Environment variables

| Variable | Description |
| --- | --- |
| `PRIVATE_KEY` | Deployer/signer private key for scripts |
| `PRIVATE_KEY_2` | Secondary signer private key for scripts |
| `FUJI_RPC_URL` | Avalanche Fuji C-Chain RPC endpoint (server-side) |
| `NEXT_PUBLIC_FUJI_RPC_URL` | Avalanche Fuji C-Chain RPC endpoint (client-side) |
| `NEXT_PUBLIC_EERC_ADDRESS` | Deployed eERC contract address |
| `NEXT_PUBLIC_REGISTRAR_ADDRESS` | Deployed eERC registrar contract address |
| `NEXT_PUBLIC_USDC_ADDRESS` | USDC token address on Fuji |
