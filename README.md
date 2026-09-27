# Smart Factory Maintenance Agent

An AI-assisted maintenance investigation workflow for factory technicians. The agent recalls relevant maintenance experience from Hindsight, gives Groq the current incident and recalled context, and retains the new incident after a successful investigation.

## Problem

Maintenance technicians often investigate recurring machine faults without a practical way to bring previous symptoms, repairs, and outcomes into the current investigation. Repeated work can lose the context that would help a technician recognize a recurrence.

## Solution

The technician submits a machine ID, fault, and symptoms. The backend recalls relevant Hindsight memories before requesting investigation guidance from Groq. When Groq succeeds, the current incident is retained in Hindsight for future investigations. The system supports investigation only; technicians remain responsible for diagnosis and machine operation.

## Hindsight Memory

Hindsight is the persistent maintenance memory layer. The backend recalls relevant history by machine and fault, passes the returned facts to the reasoning model, and retains the current incident only after successful reasoning. Retention uses a deterministic idempotency operation ID, so equivalent retries do not enqueue duplicate work while meaningful incident changes can be retained separately.

Hindsight configuration is server-side and uses `HINDSIGHT_API_KEY`, `HINDSIGHT_BANK_ID`, and `HINDSIGHT_BASE_URL`.

## Groq AI

Groq generates a structured investigation containing a summary, historical connection, reasoning, and recommended checks. The configured model is `openai/gpt-oss-20b`. The Groq API key is read by the backend from `GROQ_API_KEY`; it is never needed in browser code.

## Architecture

- `frontend/`: React interface served and built with Vite.
- `backend/src/routes/`: Express health, maintenance, and memory endpoints.
- `backend/src/services/maintenance-agent.service.js`: recalls Hindsight context, invokes Groq, then retains the incident after successful reasoning.
- `backend/src/services/hindsight.service.js`: Hindsight client, recall, incident formatting, and idempotent retention.
- `backend/src/services/groq.service.js`: Groq chat-completions request and response validation.
- `backend/src/config/hindsight.config.js`: reads Hindsight settings from the backend environment.

## Tech Stack

- React and Vite
- Node.js and Express
- Groq chat completions API
- Hindsight client for persistent memory

## Local Setup

Prerequisites: Node.js and npm.

1. Install backend dependencies and create a local environment file if one does not already exist:

   ```powershell
   cd backend
   npm install
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

   Fill in the local `.env` values. Do not overwrite an existing environment file.

2. Start the backend:

   ```powershell
   npm start
   ```

   The API listens on port `5000` by default; set `PORT` to use a different port.

3. In another terminal, install and start the frontend:

   ```powershell
   cd frontend
   npm install
   npm run dev
   ```

   Vite prints the local frontend URL. The API base defaults to `http://localhost:5000/api`; `VITE_API_BASE_URL` can override it for the frontend configuration.

## Environment Variables

Create `backend/.env` from `backend/.env.example` and provide values locally:

| Variable | Purpose |
| --- | --- |
| `GROQ_API_KEY` | Authenticates backend requests to Groq. |
| `HINDSIGHT_API_KEY` | Authenticates backend requests to Hindsight. |
| `HINDSIGHT_BANK_ID` | Selects the Hindsight memory bank. |
| `HINDSIGHT_BASE_URL` | Hindsight service URL. |
| `PORT` | Optional backend port; defaults to `5000`. |

## API Endpoints

- `GET /api/health`: backend health check.
- `POST /api/maintenance/investigate`: recalls Hindsight context, requests Groq guidance, and retains the incident after successful reasoning. Required JSON fields: `machineId`, `fault`, and `symptoms`.
- `POST /api/memory/recall`: recalls maintenance memories. Requires `query`; accepts optional `machineId`.
- `POST /api/memory/retain`: explicitly retains a maintenance incident. Requires `machineId` and `fault`; accepts incident details such as `incidentDate`, `symptoms`, `repairPerformed`, `partReplaced`, `technicianAction`, `repairOutcome`, `recurrenceDays`, and `technicianObservation`.

## Demo Workflow

1. Start the backend and frontend.
2. Submit a machine ID, fault, and symptoms in the investigation form.
3. The backend recalls matching Hindsight experience before asking Groq to reason over the current incident and returned context.
4. After successful Groq reasoning, the backend retains the current incident with deterministic idempotency protection.
5. Investigate a later recurrence to see relevant Hindsight history included in the new context.

## Important Security Note

Keep API keys and service credentials in `backend/.env` or another secure server-side secret store. Never put them in frontend environment variables, source code, logs, screenshots, or commits. The root `.gitignore` excludes environment files, dependencies, build output, and common key/certificate files. Use placeholders only in `.env.example`.