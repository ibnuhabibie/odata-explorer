# OData Explorer

A visual explorer for OData v4 services. Build queries visually, inspect responses, and generate code snippets.

## Features

- **Connection management** — service URL, custom headers, auth (Bearer, Basic, API Key)
- **$metadata parsing** — automatic entity set discovery and property browsing with type information
- **Visual query builder** — `$select`, `$filter`, `$orderby`, `$expand`, `$top`, `$skip`, `$count`, `$search`
- **Data grid** — paginated results, expandable rows with nested object/array tables
- **JSON viewer** — syntax-highlighted, formatted, copyable
- **Live URL** — every UI change reflected in the generated request URL in real time
- **Copy as** — URL, cURL, Fetch, Axios
- **History & saved queries** — persisted in localStorage
- **Response metrics** — HTTP status, timing, payload size

## Tech Stack

- Vue 3 (Composition API, `<script setup>`)
- Tailwind CSS v4 (CSS-first config via `@tailwindcss/vite`)
- Vite 6

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

Click **Try Sample** to connect to the OData v4 reference service.

## Usage

1. Click **+** in the top bar to create a connection (or **Try Sample** on the welcome screen)
2. Enter your OData service URL, enable **Bypass CORS** if needed
3. Click **Save & Connect** to parse `$metadata`
4. Browse entity sets in the left sidebar (**Entities** tab)
5. Click an entity set to load its properties and start building a query
6. Configure `$select`, `$filter`, `$orderby`, `$expand`, and paging options
7. Click **Run** to execute and view results in the grid or JSON viewer
8. Copy the URL or generate cURL/Fetch/Axios snippets

## Deploy to GitHub Pages

The project includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys automatically.

1. Push the repo to GitHub
2. Go to **Settings → Pages → Build and deployment → Source** and select **GitHub Actions**
3. Push to `main` — the workflow builds and deploys to:

   ```
   https://<username>.github.io/<repo-name>/
   ```

The Vite `base` is set to `./` so assets use relative paths — works with any repo name.

## CORS & Cloudflare Worker Proxy

Browser-based requests are blocked by CORS when the OData service doesn't send `Access-Control-Allow-Origin` headers. The app handles this in two ways:

- **Dev** (`npm run dev` / `npm run preview`): built-in Vite proxy middleware — just enable **Bypass CORS** in connection settings.
- **Production** (GitHub Pages): a **Cloudflare Worker** proxy (100k req/day free tier).

### Deploy the Worker

1. Install Wrangler:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash   wrangler login
   ````

3. Deploy:
   ```bash
   npx wrangler deploy
   ````

   You'll get a URL like `https://odata-proxy.<your-subdomain>.workers.dev`

4. Set the Worker URL as a GitHub secret:
   - Go to **Settings → Secrets and variables → Actions → New repository secret**
   - Name: `VITE_PROXY_URL`
   - Value: `https://odata-proxy.<your-subdomain>.workers.dev`

5. Push to `main` — the workflow uses the secret to bake the URL into the build.

### Local development with the Worker

Create `.env.production` (or set the env var):

```bash
VITE_PROXY_URL=https://odata-proxy.<your-subdomain>.workers.dev
```

Or test the Worker locally:

```bash
npm run dev:worker
```
