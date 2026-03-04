# SOLUTIONS.md — Mini‑Shop Take‑Home

This document lists the real issues found from a clean clone + fresh `docker compose up --build`, how they were diagnosed, and the exact fixes applied.

---

## Part 1 — Fresh deploy bugs (fixed)

### 1) Frontend image build fails (Vite entry file)
**What I saw**
- `docker compose up --build` failed while building the `frontend` image.
- Error: Rollup/Vite could not resolve `/src/main.js` referenced from `index.html`.

**Root cause**
- `frontend/index.html` referenced `src/main.js` but the repository uses `src/main.jsx`.

**Fix**
- Update the script tag to:
  - `<script type="module" src="/src/main.jsx"></script>`

**How I verified**
- Rebuilt and frontend image built successfully (`npm run build` succeeded inside the container build).

---

### 2) Proxy container crashes on startup (bad upstream + wrong network attachment)
**What I saw**
- `proxy` crashed immediately with:
  - `host not found in upstream "backend:8080" ...`

**Root causes**
1. Nginx upstream was configured to `backend:8080` (wrong service name/port).
2. `proxy` was not connected to the backend network, so even correct service DNS would not resolve/reach the API.

**Fix**
- In `proxy/nginx.conf`:
  - Change upstream to `server api:3000;`
- In `docker-compose.yml`:
  - Attach `proxy` to **both** networks: `frontend-network` and `backend-network`.

**How I verified**
- `proxy` stayed running and successfully routed `/api/*` requests to the API service.

---

### 3) API cannot connect to Postgres (wrong hostname in DATABASE_URL)
**What I saw**
- API logs repeated retries:
  - `Database connection attempt X/5 failed: Connection terminated due to connection timeout`

**Root cause**
- `DATABASE_URL` pointed to host `postgres`, but the Compose service name is `db`, so the hostname was wrong inside the Docker network.

**Fix**
- Update `DATABASE_URL` to use:
  - `...@db:5432/...`

**How I verified**
- API started successfully and served `/api/items` and `/api/orders` through the proxy.

---

### 4) Compose warnings on every command (dollar sign + obsolete version)
**What I saw**
- Warning: `"hop_s3cret" variable is not set. Defaulting to a blank string.`
- Warning: `attribute 'version' is obsolete`

**Root causes**
- `$` inside YAML strings triggers Compose interpolation (it tried to expand `$hop_s3cret`).
- Compose v2 ignores the `version:` key and warns.

**Fix**
- Escape literal `$` as `$$` in passwords/URLs (example: `mini$hop_s3cret` → `mini$$hop_s3cret`).
- Remove `version: '3.8'` from `docker-compose.yml`.

**How I verified**
- Warnings disappeared from `docker compose ps`, `docker compose up`, etc.

---

### 5) Health endpoint path mismatch behind proxy
**What I saw**
- `curl http://localhost:8080/api/health` returned: `{"error":"Not found"}`

**Root cause**
- Express exposed health at `/health`, but requests coming through the proxy were under `/api/*`.

**Fix**
- Move/duplicate health route to `/api/health` in `api/src/index.js`.

**How I verified**
- `curl http://localhost:8080/api/health` returned a healthy JSON payload.

---

### 6) Frontend/proxy shown as “unhealthy” (healthcheck tooling missing)
**What I saw**
- `docker compose ps` showed `frontend` and `proxy` as unhealthy.

**Root cause**
- Healthchecks used `curl`, but `nginx:alpine` does not include curl by default, so the healthcheck command failed.

**Fix**
- Install curl in both nginx-based images:
  - `frontend/Dockerfile`: `RUN apk add --no-cache curl`
  - `proxy/Dockerfile`: `RUN apk add --no-cache curl`
- Use the working healthchecks:
  - Frontend: `curl -f http://localhost/health`
  - Proxy: `curl -f http://localhost/`

**How I verified**
- After rebuild (`docker compose up --build -d`), both containers reported `healthy`.

---

### 7) Orders created but stock didn’t change
**What I saw**
- Creating an order succeeded and appeared under `/api/orders` with status `pending`.
- Item stock counts did not decrease after ordering.

**Root cause**
- The order transaction inserted into `orders` + `order_items` but never updated `items.stock`.

**Fix**
- Inside the `POST /api/orders` transaction, decrement stock per item:
  - `UPDATE items SET stock = stock - $1 WHERE id = $2`

**How I verified**
- After rebuild, placing an order decreased stock correctly in subsequent `/api/items` responses.

---

## Part 2 — Goal 2: Redis caching (implemented)

### Requirements
- Connect API to Redis at `redis://cache:6379`
- Cache `GET /api/items` with TTL (60 seconds)
- Invalidate cache when an order is placed (stock changes)
- Fail gracefully if Redis is unavailable

### Implementation summary
1. **Single Redis client**
- Created a shared Redis client module (`api/src/redis.js`) and used `redisClient.isReady` to guard cache operations.
- Attached an error handler so Redis disconnects don’t crash the API.

2. **Cache GET /api/items**
- Key: `items:all`
- TTL: 60 seconds
- On cache hit: return cached JSON.
- On miss / Redis down: query Postgres and (if Redis ready) `SETEX` the response.

3. **Invalidate on writes**
- After successful order **COMMIT**:
  - `DEL items:all`
- Also invalidate on item mutations (`POST /api/items`, `PUT /api/items/:id`) if applicable.

4. **Graceful fallback**
- If Redis is stopped, API continues serving from Postgres (no 502/500 due to cache).

### How I tested caching (proof, not guessing)
- Ran Redis monitor:
  - `docker compose exec cache redis-cli monitor`
- Refreshed the UI / hit `/api/items` and observed:
  - First request: `GET items:all` then `SETEX items:all 60 ...`
  - Subsequent requests within TTL: `GET items:all` only
  - After placing an order: `DEL items:all`

---

## Bonus

### A) Security improvements (realistic for this stack)
- **Secrets handling:** credentials are currently inside `docker-compose.yml` (risk of accidental commits/leaks). Recommend moving to a local `.env` (gitignored) or Docker secrets for anything beyond take-home.
- **Avoid logging secrets:** don’t print full `DATABASE_URL` / connection strings in logs.
- **AuthZ/AuthN:** admin endpoints (`POST/PUT /api/items`) should be protected (even basic API key / JWT) if this were real.

### B) Correctness & resilience
- **Prevent overselling:** update stock with a guard to prevent negative stock.
- **Healthchecks:** keep them lightweight and deterministic; proxy health should check `/` routing (already done), API health should check DB connectivity (already done).

