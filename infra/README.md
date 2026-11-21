# Deployment

The demo host is open. The Python FastAPI service serves the API and bundled React app together. Build the frontend with `npm --prefix frontend ci` and `npm --prefix frontend run build`. Ship `frontend/dist/`, `backend/src/`, `backend/db/`, `pyproject.toml`, and `uv.lock`. Install production Python dependencies with `uv sync --locked --no-dev`.

Set `DATABASE_URL` to the demo database and `API_HOST=0.0.0.0` for a container or a managed host. The server uses `API_PORT` or the host-provided `PORT`. Route traffic through the host’s HTTPS endpoint. Use `GET /api/health` as a process health check.

When a host is chosen, add a manually triggered `.github/workflows/deploy.yml`. Verify the selected commit belongs to `main` and has a successful `ci` result for that SHA. Apply migrations with `uv run --locked --no-dev python -m backend.db.manage migrate`. Run `uv run --locked --no-dev python -m backend.db.manage seed --all` as an explicit demo-data step. Start the service with `uv run --locked --no-dev python -m backend.src.app.server` and verify the health endpoint and default demo page.
