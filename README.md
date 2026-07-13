# OData Explorer

A visual explorer for OData v4 services. Build queries visually, inspect responses, and generate code snippets.

## Features

- **Connection management** — service URL, custom headers, proxy URL (for CORS), and auth (Bearer, Basic, API Key)
- **$metadata parsing** — automatic entity set discovery and property browsing with type information
- **Visual query builder** — `$select`, `$filter`, `$orderby`, `$expand`, `$top`, `$skip`, `$count`, `$search`
- **Data grid** — paginated results with server-side querying
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

Click **Try Sample** to connect to the TripPin OData v4 reference service.

## Usage

1. Enter your OData service URL in the top bar and click **Connect**
2. Browse entity sets in the left sidebar (**Entities** tab)
3. Click an entity set to load its properties and start building a query
4. Configure `$select`, `$filter`, `$orderby`, `$expand`, and paging options
5. Watch the live URL update as you build
6. Click **Run** to execute and view results in the grid or JSON viewer
7. Copy the URL or generate cURL/Fetch/Axios snippets

## CORS

Browser-based requests are blocked by CORS when the OData service doesn't send `Access-Control-Allow-Origin` headers. OData Explorer includes a **built-in dev proxy** that bypasses this entirely — just enable **Bypass CORS** in the Connection tab (on by default for new connections).

The proxy runs as a Vite middleware (`/proxy?url=<target>`) and works in both `npm run dev` and `npm run preview`. For production deployments, you'll need your own proxy server.
