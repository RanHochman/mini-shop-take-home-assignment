# SOLUTIONS.md — Mini‑Shop

This document lists the issues found from a clean clone + `docker compose up --build`, how they were diagnosed, and the exact fixes applied.

---

## Part 1 — Deploy Bugs (fixed)

### 1) Frontend image build fails (Vite entry file)
**What I Saw**
- `docker compose up --build` failed while building the `frontend` image.
- Error: Rollup/Vite could not resolve `/src/main.js` referenced from `index.html`.

**Root Cause**
- `frontend/index.html` referenced `src/main.js` but the repository uses `src/main.jsx`.

**Fixed**
- Updated the script tag to:
  - `<script type="module" src="/src/main.jsx"></script>`

**How I Verified**
- Rebuilt and frontend image built successfully (`npm run build` succeeded inside the container build).

---

### 2) Proxy container crashes on startup (bad upstream + wrong network attachment)
**What I Saw**
- `proxy` crashed immediately with:
  - `host not found in upstream "backend:8080" ...`

**Root Causes**
1. Nginx upstream was configured to `backend:8080` (wrong service name/port).
2. `proxy` was not connected to the backend network.

**Fixed**
- In `proxy/nginx.conf`:
  - Changed upstream to `server api:3000;`
- In `docker-compose.yml`:
  - Attached `proxy` to **both** networks: `frontend-network` and `backend-network`.

**How I Verified**
- `proxy` stayed running and successfully routed `/api/*` requests to the API service.

---

### 3) API cannot connect to Postgres (wrong hostname in DATABASE_URL)
**What I Saw**
- API logs repeated retries:
  - `Database connection attempt X/5 failed: Connection terminated due to connection timeout`

**Root Cause**
- `DATABASE_URL` pointed to host `postgres`, but the Compose service name is `db`, so the hostname was wrong inside the Docker network.

**Fixed**
- Updated `DATABASE_URL` to use:
  - `...@db:5432/...`

**How I Verified**
- API started successfully and served `/api/items` and `/api/orders` through the proxy.

---

### 4) Compose warnings on every command (dollar sign + obsolete version)
**What I Saw**
- Warning: `"hop_s3cret" variable is not set. Defaulting to a blank string.`
- Warning: `attribute 'version' is obsolete`

**Root Causes**
- `$` inside YAML strings triggers Compose interpolation (it tried to expand `$hop_s3cret`).
- Compose v2 ignores the `version:` key and warns.

**Fixed**
- Escape literal `$` as `$$` in passwords/URLs (example: `mini$hop_s3cret` → `mini$$hop_s3cret`).
- Removed `version: '3.8'` from `docker-compose.yml`.

**How I Verified**
- Warnings disappeared from `docker compose ps`, `docker compose up`, etc.

---

### 5) Health endpoint path mismatch behind proxy
**What I Saw**
- `curl http://localhost:8080/api/health` returned: `{"error":"Not found"}`

**Root Cause**
- Express exposed health at `/health`, but requests coming through the proxy were under `/api/*`.

**Fixed**
- Moved/duplicated health route to `/api/health` in `api/src/index.js`.

**How I Verified**
- `curl http://localhost:8080/api/health` returned a healthy JSON payload.

---

### 6) Frontend and Proxy Missing Healthchecks
**What I Saw**
- The `api` and `db` services had defined healthchecks, but the `frontend` and `proxy` services had no healthchecks defined in the `docker-compose.yml` file.

**Root Cause**
- The architecture lacked a way for Docker to verify if the Nginx containers were actually ready to serve traffic before routing requests to them.

**Fixed**
- Added healthcheck blocks to both services in `docker-compose.yml`.

**How I Verified**
- Ran `docker compose up --build -d`.
- Waited 15 seconds, ran `docker compose ps`, and confirmed all five services (`api`, `db`, `frontend`, `proxy`, `cache`) successfully reported a `(healthy)` status.
  
---

### 7) Orders created but stock didn’t change
**What I Saw**
- Creating an order succeeded and appeared under `/api/orders` with status `pending`.
- Item stock counts did not decrease after ordering.

**Root Cause**
- The order transaction inserted into `orders` + `order_items` but never updated `items.stock`.

**Fixed**
- Inside the `POST /api/orders` transaction, decreased stock count per item:
  - `UPDATE items SET stock = stock - $1 WHERE id = $2`

**How I Verified**
- After rebuild, placing an order using the UI decreased the stock correctly in subsequent `/api/items` responses.

---

## Part 2 — Goal 2: Redis caching (implemented)
### Implementation summary
1. **Single Redis Client**
- Created a shared Redis client module (`api/src/redis.js`) and used `redisClient.isReady` to guard cache operations.
- Attached an error handler so if Redis disconnects, it won’t crash the API.

2. **Cache GET /api/items**
- Key: `items:all`
- TTL: 60 seconds
- On cache hit: return cached JSON.
- On miss / Redis down: query Postgres and (if Redis ready) `SETEX` the response.

3. **Invalidate on Writes**
- After a successful order **COMMIT**:
  - `DEL items:all`
- Also invalidate on item mutations (`POST /api/items`, `PUT /api/items/:id`) if applicable.

4. **Graceful fallback**
- If Redis is stopped, API continues serving from Postgres (no 502/500 due to cache).

### How I Tested Caching
- Ran Redis monitor:
  - `docker compose exec cache redis-cli monitor`
- Refreshed the UI / hit `/api/items` and observed:
  - First request: `GET items:all` then `SETEX items:all 60 ...`
  - Subsequent requests within TTL: `GET items:all` only
  - After placing an order: `DEL items:all`

---

## Bonus

### A) Healthcheck Improvements
- **1. Healthchecks:** kept them lightweight and deterministic; proxy health should check `/` routing , API health should check DB connectivity.

### B) Security Improvements
- **1. Secrets handling:** credentials are currently inside `docker-compose.yml` (risk of accidental commits/leaks). Recommend moving to a local `.env` (gitignored) or Docker secrets for anything beyond this project.
- **2. Avoid logging secrets:** don’t print full `DATABASE_URL` / connection strings in logs.

### C) Architecture Recommendations
- **1. API Horizontal Scaling:** Because we successfully implemented Redis, the Express API is now completely stateless. We can easily scale the API by running multiple replicas in Docker Compose (`deploy: replicas: 3`). The Nginx upstream block will automatically act as a Round-Robin load balancer, distributing `/api/*` traffic across all available nodes to handle higher throughput.
- **2. CDN Offloading:** For a real-world e-commerce site, serving the React Single Page Application from a Docker container is inefficient. The built frontend assets should be pushed to a global CDN (like AWS CloudFront or Vercel). The Nginx proxy would then be simplified to act solely as an API Gateway (handling rate-limiting and routing for the Express backend), drastically reducing server load.


**Prevent overselling:** update stock with a guard to prevent negative stock.
