# Aether Development Setup

## Already installed in this repo

Frontend packages:

- React
- Vite
- Sui dApp Kit React
- Sui TypeScript SDK

Backend packages:

- Express
- CORS
- dotenv
- Gemini SDK
- Sui TypeScript SDK

## Required local tools

Install these on the machine before deeper blockchain work:

1. Node.js 22 or newer
2. A Sui-compatible browser wallet, preferably Slush for the demo browser
3. Sui CLI
4. Walrus CLI
5. Git

## Recommended Sui and Walrus install path

Mysten and Walrus docs currently recommend `suiup` for managing Sui ecosystem tools.

Install `suiup`, then install Sui and Walrus:

```bash
suiup install sui
suiup install walrus
```

On Windows, Walrus also provides a direct `walrus.exe` binary path if `suiup` is inconvenient.

## Environment files

Backend:

```bash
cd Backend
copy .env.example .env
```

AI provider selection:

- Set `AI_PROVIDER` to `gemini`, `openai`, or `groq`.
- Provide the matching API key (`GEMINI_API_KEY`, `OPENAI_API_KEY`, or `GROQ_API_KEY`).
- Adjust `AI_TEMPERATURE` and `AI_MAX_TOKENS` if needed.

Walrus CLI integration (optional):

- Set `WALRUS_UPLOAD_METHOD=cli`
- If Walrus is not on PATH, set `WALRUS_CLI_PATH` to the full executable path.
- Optional: set `WALRUS_CLI_ARGS` as a JSON array. Example:

```text
["store","--epochs","max","--json","{file}"]
```

- Set `WALRUS_STRICT=true` to fail workflows when uploads fail.

Frontend:

```bash
cd Frontend
copy .env.example .env
```

After publishing the task manager package, set:

```bash
VITE_AETHER_TASK_MANAGER_PACKAGE_ID=0x...
```

## Local run

Backend:

```bash
cd Backend
npm.cmd run dev
```

Frontend:

```bash
cd Frontend
npm.cmd run dev
```

Use `npm.cmd` in PowerShell on Windows if `npm` is blocked by execution policy.

## Demo mode

The app can run without Gemini, Sui package IDs, or Walrus publisher URLs. In that mode:

- agents return deterministic mock outputs
- Sui calls return mock transaction references
- Walrus calls return mock blob IDs
- workflows still complete end to end

## Production integration checklist

- Add `GEMINI_API_KEY`
- Publish Move contracts
- Add `SUI_PACKAGE_ID`
- Configure wallet-signed task creation transactions
- Add `WALRUS_PUBLISHER_URL`
- Store final report blob IDs onchain
- Replace mock escrow release with Move escrow calls
