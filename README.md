# hackershield2.0
Cybersecurity-focused project for hacker defense and monitoring.

# Secure Quiz Backend

This project includes a small secure Express backend for a quiz leaderboard.

## Setup

1. Install dependencies:
   npm install
2. Copy `.env.example` to `.env` and update the values.
3. Start the server:
   npm start

## Security notes

- Keep secrets in `.env` only.
- Never commit `.env` files.
- The server validates data before writing to storage.
- CORS is limited to trusted origins.
- Rate limiting is enabled to reduce abuse.

## Endpoints

- GET `/api/health`
- GET `/api/leaderboard`
- POST `/api/score`

## Frontend integration

The frontend can call the API using `window.QUIZ_API_BASE_URL` or by updating the constant in the HTML file.

## GitHub deployment flow

The frontend is deployed to GitHub Pages. The Express API must be deployed separately.

### Deploy the backend to Render

1. In Render, create a **New Web Service** and connect `scinisekoart/hackershield2.0`.
2. Use the repository root, build command `npm ci`, and start command `npm start`.
3. Add these environment variables to the Render service:
   - `ALLOWED_ORIGINS=https://scinisekoart.github.io`
   - `DATA_FILE=/var/data/leaderboard.json`
4. For leaderboard data to survive service restarts and deploys, attach persistent storage mounted at `/var/data`. Check Render pricing before creating a disk; without persistent storage, the JSON leaderboard can be lost when the service restarts or redeploys.
5. Deploy the service and copy its public URL, for example `https://your-service.onrender.com`.
6. In Render service settings, create a deploy hook. If using the GitHub hook workflow below, turn off Render's automatic deploy on push to avoid duplicate deployments.

### Connect GitHub to Render and Pages

In GitHub repository settings, open **Secrets and variables → Actions** and add:

- Repository variable `QUIZ_API_BASE_URL` with the complete API base URL, such as `https://your-service.onrender.com/api`.
- Repository secret `RENDER_DEPLOY_HOOK_URL` with the Render deploy hook URL. Keep this secret private; do not put it in the frontend or share it publicly.

The Pages workflow builds `api-config.js` from `QUIZ_API_BASE_URL` each time it deploys. Push a commit to `main` (or rerun the Pages workflow) after adding/changing that variable. The Render workflow uses the deploy-hook secret to trigger backend deploys; if it is unset, the workflow skips that step rather than failing.

### Local development

Copy `.env.example` to `.env` for local backend settings, then run `npm ci` and `npm start`. `.env` is ignored by Git and should never be committed.

### Public leaderboard limitation

The API validates score payloads but does not prove that a score was earned honestly; a public client can submit fabricated scores. Do not use this leaderboard for prizes, private information, or other high-trust decisions without server-side answer validation and abuse controls.
