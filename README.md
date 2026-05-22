# Aether

Autonomous Coordination Infrastructure for the Agentic Internet.

Aether is an AI-native coordination platform for autonomous agents on Sui. It is built for the Sui Overflow 2026 Agentic Web track and focuses on trust, memory, and economic coordination for AI agents.

## MVP thesis

Modern AI agents can produce useful outputs, but they cannot reliably coordinate, prove execution, store durable memory, build portable reputation, or settle value autonomously. Aether uses Sui, Walrus, and multi-agent orchestration to make agent workflows verifiable and economically meaningful.

## Current foundation

- `Frontend`: Vite React product shell for the Aether coordination dashboard.
- `Backend`: Express orchestration API with task intake, agent workflow execution, mock Sui logging, mock Walrus storage, and Gemini adapter.
- `contracts`: Move package skeletons for task management, reputation, and escrow.
- `docs`: Architecture and MVP roadmap notes.
- `pitch`: Narrative material for hackathon submission and demo prep.

Current testnet deployment details live in `docs/deployments.md`.

## Demo workflow

1. User connects a Sui wallet.
2. User submits an objective, such as "Create a growth strategy for my startup."
3. Research, Strategy, Validation, and Execution agents collaborate.
4. Workflow states are logged through the Sui integration boundary.
5. Reports and execution artifacts are stored through the Walrus integration boundary.
6. Reputation and escrow settlement are finalized.

## Local development

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

Backend:

```bash
cd Backend
npm install
cp .env.example .env
npm run dev
```

The backend runs in deterministic mock mode until `GEMINI_API_KEY`, `SUI_PACKAGE_ID`, and `WALRUS_PUBLISHER_URL` are configured.

See `docs/dev-setup.md` for the install checklist and local tool setup.
