# TTT Stats

A statistics website and loading screen for Trouble in Terrorist Town 2. Rounds are collected by the companion [TTT2 Stats addon](https://github.com/WieseChristoph/ttt2-stats-addon), stored in PostgreSQL, and enriched with Steam names and avatars cached in Redis.

![TTT Stats loading screen](.github/screenshots/loading.png)

The website provides an overall dashboard, searchable map and player histories, detailed round event feeds, and a fixed-size `/loading` view for Garry's Mod loading screens.

## Development

Requirements: Node.js 24, pnpm 11, and Docker with Compose.

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
pnpm install
pnpm db:migrate
pnpm dev
```

Before starting, set `STEAM_API_KEY` and replace `STATS_INGEST_TOKEN` in `.env`. The ingest token must match the addon's `token`. The app is available at <http://localhost:3000>.

Useful checks:

```bash
pnpm tscheck
pnpm fix:all
pnpm build
```

## Docker deployment

Each GitHub release publishes two images:

- `ghcr.io/wiesechristoph/ttt-stats:<version>` contains the Next.js application.
- `ghcr.io/wiesechristoph/ttt-stats:<version>-migrator` contains Drizzle and the matching migrations.

The production Compose stack runs the migrator before starting the application. To deploy the published images:

```bash
cp .env.example .env
# Set secure credentials, a Steam Web API key, and TTT_STATS_VERSION in .env.
docker compose pull
docker compose up -d --no-build
```

Use a concrete version such as `TTT_STATS_VERSION=0.0.2` for reproducible deployments, or `latest` to follow stable releases. To build both images from the checked-out source instead, run `docker compose up -d --build`.

The migration image can also be run independently through Compose:

```bash
docker compose run --rm migrate
```

Compose attaches it to the database network and supplies the `db` service hostname. `APP_PORT` controls the exposed website port and defaults to `3000`. Put the app behind an HTTPS reverse proxy for a public deployment.

Configure the [TTT2 Stats addon](https://github.com/WieseChristoph/ttt2-stats-addon) with this deployment URL and the same `STATS_INGEST_TOKEN`. For the loading screen, use:

```text
https://stats.example.com/loading?mapname=%m&steamid=%s
```
