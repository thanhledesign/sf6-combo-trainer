# SF6 Combo Trainer - Environment & Deployment
## Infrastructure Documentation

**Last Updated:** December 1, 2025

---

## 🚀 Deployment

### Production (Vercel)

| Setting | Value |
|---------|-------|
| **Platform** | Vercel |
| **Project URL** | https://vercel.com/thanh-les-projects-f5b2fa8b/sf6-combo-trainer |
| **Live Site** | https://sf6-combo-trainer.vercel.app |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Framework** | Vite |
| **Node Version** | 18.x (recommended) |

### Example Routes

| Route | URL |
|-------|-----|
| Home | https://sf6-combo-trainer.vercel.app/ |
| Browse Ken | https://sf6-combo-trainer.vercel.app/browse/ken |
| Browse Chun-Li | https://sf6-combo-trainer.vercel.app/browse/chunli |
| Punish Calculator | https://sf6-combo-trainer.vercel.app/punish/ken |
| Search | https://sf6-combo-trainer.vercel.app/search |

---

## 🔗 Repository

| Setting | Value |
|---------|-------|
| **GitHub** | https://github.com/thanhledesign/sf6-combo-trainer |
| **Branch** | `main` |
| **Auto Deploy** | Yes (on push to main) |

---

## 💻 Local Development

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Setup Commands

```bash
# Clone repository
git clone https://github.com/thanhledesign/sf6-combo-trainer.git
cd sf6-combo-trainer

# Install dependencies
npm install

# Start development server
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build

# Preview production build
npm run preview
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server (hot reload) |
| `npm run build` | Create production build |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

---

## 📦 Dependencies

### Production Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "lucide-react": "latest"
}
```

### Development Dependencies

```json
{
  "vite": "^5.x",
  "tailwindcss": "^3.x",
  "autoprefixer": "latest",
  "postcss": "latest",
  "@vitejs/plugin-react": "latest",
  "eslint": "latest"
}
```

---

## ⚙️ Environment Variables

Currently, **no environment variables are required**.

If needed in the future, create `.env` file:

```bash
# .env (example - not currently used)
VITE_API_URL=https://api.example.com
VITE_ANALYTICS_ID=UA-XXXXX
```

Access in code:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

**Important:** Vite requires `VITE_` prefix for client-side env vars.

---

## 📁 Build Output

After `npm run build`:

```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js      (~615 KB)
│   ├── index-[hash].css     (~27 KB)
│   └── [thumbnails]-[hash].png
└── videos/
    ├── ken/
    └── terry/
```

### Build Stats (as of Dec 1, 2025)

| Metric | Value |
|--------|-------|
| JS Bundle | ~615 KB (121 KB gzipped) |
| CSS Bundle | ~27 KB (5.5 KB gzipped) |
| Total Assets | ~4 MB (including thumbnails) |
| Build Time | ~5 seconds |

---

## 🔄 Deployment Workflow

### Automatic (Recommended)

1. Push to `main` branch
2. Vercel automatically detects changes
3. Builds and deploys (~1-2 minutes)
4. Live at production URL

```bash
git add .
git commit -m "feat: add new feature"
git push origin main
# Vercel auto-deploys
```

### Manual Deploy

If needed, trigger from Vercel dashboard:
1. Go to https://vercel.com/thanh-les-projects-f5b2fa8b/sf6-combo-trainer
2. Click "Deployments" tab
3. Click "Redeploy" on any deployment

---

## 🐛 Troubleshooting

### Build Fails on Vercel

1. Check build logs in Vercel dashboard
2. Common issues:
   - Missing dependencies: Run `npm install` locally first
   - Import errors: Check all file paths are correct
   - Node version: Ensure Vercel uses Node 18+

### Local Dev Server Won't Start

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### Assets Not Loading in Production

- Check paths start with `/` for public folder assets
- Verify files exist in `public/` directory
- Check Vercel deployment logs for 404s

---

## 📊 Monitoring

### Vercel Analytics (if enabled)

- Page views
- Load times
- Geographic distribution

### Future Considerations

- Error tracking: Sentry
- Analytics: Plausible or Vercel Analytics
- Performance: Lighthouse CI

---

## 🔐 Security Notes

- No sensitive data in client code
- No API keys required (static site)
- All frame data is public (from official sources)
- No user authentication (yet)

---

*This document should be updated when infrastructure changes.*
