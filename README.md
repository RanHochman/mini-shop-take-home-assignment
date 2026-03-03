# Mini-Shop: DevOps Take-Home Assessment

## Overview

Welcome to the **Mini-Shop** take-home assessment! This is a multi-container e-commerce application that demonstrates a typical microservices architecture. Your task is to **diagnose and fix the operational issues** preventing this application from running correctly.

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │────▶│   nginx     │────▶│  Frontend   │
│             │     │  (proxy)    │     │  (React)    │
└─────────────┘     └──────┬──────┘     └─────────────┘
                          │
                          │ /api/*
                          ▼
                   ┌─────────────┐     ┌─────────────┐
                   │    API      │────▶│  Postgres   │
                   │  (Express)  │     │    (db)     │
                   └──────┬──────┘     └─────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │   Redis     │
                   │  (cache)    │
                   └─────────────┘
```

## Services

| Service   | Technology        | Port (internal) | Description                    |
|-----------|-------------------|-----------------|--------------------------------|
| frontend  | Vite + React      | 80              | SPA served by nginx            |
| api       | Node.js + Express | 3000            | REST API for items & orders    |
| db        | PostgreSQL 15     | 5432            | Persistent data store          |
| cache     | Redis 7           | 6379            | Caching layer (2nd Goal)       |
| proxy     | nginx             | 80→8080         | Reverse proxy & routing        |

## Your Task

This repository contains **several intentional bugs** that prevent the application from working correctly. Your goals are:

1. **Identify** what's broken
2. **Fix** the issues
3. **Document** your debugging process and solutions
4. **Verify** the application works end-to-end

### Success Criteria

When everything is working:
- Navigate to `http://localhost:8080` and see the Mini-Shop frontend
- The product list loads from the API
- You can add items to cart and place orders
- Orders are persisted in the database (Order appears as Pending or Completed after placing an order)
- Implement Redis Cache and verify the steps above

### 2nd Goal: Redis Caching

A Redis container (`cache`) is already running in the stack but is **not yet wired into the API**. As a 2nd goal, implement API response caching using Redis:

1. **Connect** the API to the Redis instance (`redis://cache:6379`)
2. **Cache** the `GET /api/items` response with a reasonable TTL (e.g., 60 seconds)
3. **Invalidate** the cache when an order is placed (since stock counts change)
4. **Fail gracefully** — the API should still work if Redis is unavailable

**Hints:**
- The `REDIS_URL` environment variable is already passed to the API container
- The `redis` npm package is already included in `api/package.json`
- Consider a middleware approach for clean separation of concerns

## Getting Started

### Prerequisites

- Docker Desktop (v4.0+)
- Docker Compose (v2.0+)
- Make (optional, but helpful)

### Quick Start

```bash
# Clone the repository (you've already done this)
cd mini-shop

# Copy the environment file
cp .env.example .env

# Build and start all services
make up

# Or without Make:
docker-compose up --build
```

### Useful Commands

```bash
make up        # Start all services
make down      # Stop all services
make logs      # View all logs
make logs-api  # View API logs only
make shell-api # Shell into API container
make shell-db  # Shell into DB container
make clean     # Remove all containers, volumes, images
make rebuild   # Clean rebuild everything
```

## Deliverables

Please provide:

1. **Fixed code** - Push your fixes to a branch or fork
2. **SOLUTIONS.md** - Document:
   - Each bug you found
   - How you identified it
   - How you fixed it
   - Verification steps
3. **Bonus points** for:
   - Adding health check improvements
   - Identifying security concerns
   - Suggesting architectural improvements

## Questions?

If you have questions about the assessment itself (not the bugs!), please reach out to your recruiter or hiring manager.

---

Good luck!
