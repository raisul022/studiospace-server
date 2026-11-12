# StudioSpace Server API 🎬
Backend REST API for **StudioSpace — Peer-to-Peer Creative Workspace & Production Studio Sharing Platform**.

## 🛠 Tech Stack
- **Runtime:** Node.js v20+ / TypeScript
- **Framework:** Express.js
- **Database:** MongoDB Native Driver
- **Authentication:** JWT HTTPOnly Cookies & BetterAuth pattern
- **Security:** CORS credentials, bcryptjs password hashing, HTTPOnly cookie security

## 🚀 Environment Variables (.env)
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
DB_NAME=studiospace_db
JWT_SECRET=your_jwt_secret_key
CLIENT_URL=https://your-client-deployment.vercel.app
NODE_ENV=production
```

## 📦 API Endpoints
- `POST /api/auth/register` - Create account with uppercase, lowercase, min 6 char validation
- `POST /api/auth/login` - Authenticate & issue HTTPOnly JWT cookie
- `POST /api/auth/google` - Social authentication
- `GET /api/auth/me` - Read current user session from HTTPOnly cookie
- `POST /api/auth/logout` - Clear cookie
- `GET /api/studios` - List workspaces (search & category filters)
- `GET /api/studios/featured` - 6 top-rated workspaces (.limit(6))
- `GET /api/studios/:id` - Single workspace details
- `POST /api/studios` - Protected: Add new workspace
- `PUT /api/studios/:id` - Protected: Edit workspace
- `DELETE /api/studios/:id` - Protected: Delete workspace
- `POST /api/bookings` - Protected: Reserve workspace (with Double-Booking Collision Prevention)
- `GET /api/bookings/user/:email` - Protected: List user reservations
- `PATCH /api/bookings/:id/cancel` - Protected: Cancel pending reservation

## 💻 Local Setup
1. `npm install`
2. `npm run dev`
3. Optional DB Seeding: `npx ts-node src/scripts/seed.ts`
