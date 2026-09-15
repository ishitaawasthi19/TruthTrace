# TruthTrace frontend/backend connection

The frontend reads the API base URL from `VITE_API_URL`. If it is not set, it falls back to the deployed TruthTrace API URL.

For local development, set:

```
VITE_API_URL=http://127.0.0.1:8000
```

For Vercel, set `VITE_API_URL` to the public Render backend URL and redeploy the frontend.

API calls intentionally omit trailing slashes to avoid unnecessary FastAPI redirects.
