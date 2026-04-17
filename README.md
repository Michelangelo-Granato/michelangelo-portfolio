# Michelangelo Granato - Portfolio

A modern, responsive portfolio website built with Next.js and Tailwind CSS.

## Features

- 🎨 Clean and modern design
- 🌓 Dark mode support
- 📱 Fully responsive layout
- ⚡ Built with Next.js 14
- 🎯 SEO optimized
- 📊 Analytics integration
- 🚀 Performance monitoring

## Tech Stack

- **Framework:** Next.js 14
- **Styling:** Tailwind CSS
- **Fonts:** Geist Sans & Geist Mono
- **Analytics:** Vercel Analytics
- **Performance:** Vercel Speed Insights
- **Deployment:** Vercel

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/michelangelo-portfolio.git
cd michelangelo-portfolio
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
michelangelo-portfolio/
├── app/
│   ├── components/
│   │   ├── contact.tsx
│   │   ├── footer.tsx
│   │   ├── nav.tsx
│   │   └── skills.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── global.css
├── public/
└── package.json
```

## Deployment

This project is configured for deployment on Vercel. Simply push to your GitHub repository and connect it to Vercel for automatic deployments.

## Server Dashboard Publishing

The home server page can consume a sanitized snapshot that gets published from the homelab into Vercel.

### Vercel Secrets

- `BLOB_READ_WRITE_TOKEN` for Vercel Blob storage
- `HOMELAB_DASHBOARD_PUBLISH_SECRET` as the shared HMAC secret used by the publisher job on the server

### Optional Legacy Fallback

If you still want the portfolio app to pull directly from a remote dashboard endpoint, these env vars are still supported:

- `HOMELAB_DASHBOARD_URL`
- `HOMELAB_DASHBOARD_TOKEN`

### Publish Flow

1. The server builds a small metrics snapshot.
2. It signs the JSON body with `HOMELAB_DASHBOARD_PUBLISH_SECRET`.
3. It POSTs that snapshot to `/api/server-dashboard/publish` on the Vercel deployment.
4. The portfolio app reads the latest stored blob and maps it into the server page UI.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
