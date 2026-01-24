# 🥚 Egg Counting System

Sistem penghitungan telur real-time menggunakan IoT (ESP32 + HC-SR04) dengan web monitoring.

## Tech Stack

- **Frontend/Backend**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **ORM**: Prisma 7
- **Auth**: NextAuth.js  
- **Real-time**: WebSocket (ws library)
- **Styling**: Tailwind CSS

## Fitur

- ✅ **Public Monitoring** - Pantau jumlah telur real-time (tanpa login)
- ✅ **Login Admin** - Autentikasi dengan email/username
- ✅ **Dashboard Admin** - Kurangi telur/rak (SUPERADMIN)
- ✅ **Real-time Updates** - WebSocket untuk update langsung
- ✅ **IoT Integration** - Endpoint untuk ESP32

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Buat file `.env` di root folder:

```env
# Database - Supabase PostgreSQL
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# IoT API Key
IOT_API_KEY="your-iot-secret-key"

# WebSocket  
WS_PORT=3001
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
```

### 3. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema ke database
npm run db:push

# Seed initial admin
npm run db:seed
```

### 4. Run Development

```bash
# Terminal 1: Next.js
npm run dev

# Terminal 2: WebSocket Server
npm run ws:dev
```

Buka http://localhost:3000

## Default Admin

- **Email**: admin@eggcounter.com
- **Username**: admin
- **Password**: admin123

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/eggs` | Public | Get egg count |
| POST | `/api/eggs/increment` | API Key | Increment (IoT) |
| POST | `/api/eggs/reduce` | SUPERADMIN | Reduce eggs |
| POST | `/api/racks/reduce` | SUPERADMIN | Reduce racks |
| POST | `/api/users` | SUPERADMIN | Create user |

## WebSocket

Connect to `ws://localhost:3001` for real-time updates.

### Events

**Server → Client**
```json
{ "event": "egg:updated", "data": { "count": 65, "racks": 2, "remainingEggs": 5 } }
```

**Client → Server (IoT)**
```json
{ "event": "egg:increment", "data": { "apiKey": "your-key", "increment": 1 } }
```

## Project Structure

```
src/
├── app/                  
│   ├── page.tsx          # Public monitoring
│   ├── login/            # Login page
│   ├── dashboard/        # Admin dashboard
│   └── api/              # API routes
├── components/           # React components
├── hooks/                # Custom hooks
├── lib/                  # Utilities
└── types/                # TypeScript types
server/
└── websocket.ts          # WebSocket server
prisma/
├── schema.prisma         # Database schema
└── seed.ts               # Seed data
```
