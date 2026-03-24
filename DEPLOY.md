# Deploy to Railway + Vercel

## Backend (Railway)
1. Go to railway.app → New Project → Deploy from GitHub repo
2. Select this repo, choose the `marketing-demo` branch
3. Railway auto-detects `railway.toml` and creates the API service
4. In the Railway project: Add → Database → PostgreSQL
5. In the Railway project: Add → Database → Redis
6. In the API service Settings → Variables, add all vars from `railway.env.example`
7. Railway links DATABASE_URL and REDIS_* automatically from the plugins
8. Wait for deploy → copy the generated API URL (e.g. https://xxx.up.railway.app)

## Seed Demo Data
In Railway → API service → Shell tab:
```bash
npm run seed:marketing
```

## Frontend (Vercel)
```bash
cd frontend
vercel --prod
```
When prompted, set environment variable:
- `NEXT_PUBLIC_API_BASE_URL` = your Railway API URL + `/api` (e.g. `https://xxx.up.railway.app/api`)

## Demo Login
- URL: your Vercel deployment URL
- Email: demo@convertivio.io
- Password: Demo1234!
