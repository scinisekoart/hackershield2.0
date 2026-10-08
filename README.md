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

This project is set up for a common GitHub deployment pattern:

1. Push the repository to GitHub.
2. Enable GitHub Pages for the frontend.
3. Deploy the backend to a Node host such as Render.
4. Add the required secrets in GitHub repository settings.

### Required GitHub secrets

For the Render deploy workflow, add:

- `RENDER_DEPLOY_HOOK_URL`

### Example workflow behavior

- `.github/workflows/frontend-pages.yml` deploys the static frontend to GitHub Pages.
- `.github/workflows/backend-render.yml` triggers a Render deploy when code is pushed to `main`.

### Important

- Keep `.env` local and do not commit it.
- Do not store production secrets in the repository.
- Set the production backend URL in the frontend before public deployment.
