# Egg Counting System

Sistem monitoring stok telur berbasis IoT. ESP32 dengan sensor ultrasonik menghitung telur yang lewat, mengirim data ke backend Next.js, lalu web menampilkan jumlah telur dan rak secara real-time.

## Tech Stack

- **Frontend/Backend**: Next.js 16 App Router
- **Database**: MongoDB
- **ORM**: Prisma 5
- **Auth**: NextAuth.js Credentials Provider
- **Data Fetching**: TanStack Query
- **Real-time**: WebSocket dengan library `ws`
- **Email**: Nodemailer untuk OTP registrasi
- **Styling**: Tailwind CSS 4
- **IoT**: ESP32 + sensor ultrasonik HC-SR04

## Fitur

- **Public monitoring**: halaman utama menampilkan stok telur dan jumlah rak tanpa login.
- **Real-time updates**: perubahan stok dibroadcast lewat WebSocket.
- **Integrasi ESP32**: endpoint khusus untuk menerima hitungan telur dari perangkat IoT.
- **Login**: autentikasi menggunakan email atau username.
- **Register dengan OTP email**: user baru membuat akun melalui verifikasi OTP.
- **Dashboard SUPERADMIN**: melihat stok dan mengurangi telur atau rak secara manual.
- **Manajemen user**: SUPERADMIN dapat membuat user.
- **Pemesanan telur**: user login dapat memesan telur per butir atau per rak.
- **Approval pesanan**: SUPERADMIN dapat approve atau reject pesanan. Jika approve, stok telur otomatis berkurang.
- **Audit log stok**: perubahan stok dicatat di `EggLog`.

## Alur Sistem

1. ESP32 mendeteksi telur menggunakan sensor ultrasonik.
2. ESP32 mengirim `totalCount` ke `POST /api/eggs/increment` dengan header `X-API-Key`.
3. Backend memvalidasi API key, memperbarui `EggCount`, dan membuat `EggLog`.
4. Backend memicu WebSocket server untuk broadcast event `egg:updated`.
5. UI yang memakai `useEggCount()` menerima update dan memperbarui cache TanStack Query.

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Buat file `.env` di root project:

```env
# Database - MongoDB
DATABASE_URL="mongodb+srv://USER:PASSWORD@HOST/DATABASE?retryWrites=true&w=majority"

# NextAuth
NEXTAUTH_SECRET="your-secret-key-min-32-chars"
NEXTAUTH_URL="http://localhost:3000"

# IoT API Key
IOT_API_KEY="esp32-egg-counter-key"

# WebSocket
WS_PORT=3001
NEXT_PUBLIC_WS_URL="ws://localhost:3001"
WS_INTERNAL_URL="ws://localhost:3001"

# Email OTP
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="your-email@example.com"
SMTP_PASSWORD="your-email-password"
```

Nama variabel email mengikuti implementasi di `src/lib/mailer.ts`. Email pengirim diambil dari `SMTP_USER`.

### 3. Setup Database

```bash
npm run db:generate
npm run db:push
npm run db:seed
```

### 4. Run Development

Jalankan Next.js:

```bash
npm run dev
```

Jalankan WebSocket server di terminal lain:

```bash
npm run ws:dev
```

Buka `http://localhost:3000`.

## Default Admin

Data admin dibuat dari seed Prisma.

- **Email**: `admin@eggcounter.com`
- **Username**: `admin`
- **Password**: `admin123`

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Menjalankan Next.js development server |
| `npm run build` | Build aplikasi Next.js |
| `npm run start` | Menjalankan hasil build |
| `npm run lint` | Menjalankan ESLint |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:push` | Push schema Prisma ke database |
| `npm run db:seed` | Membuat data awal, termasuk admin |
| `npm run ws:dev` | Menjalankan WebSocket server |

## API Endpoints

| Method | Endpoint | Auth | Description |
| --- | --- | --- | --- |
| `GET` | `/api/eggs` | Public | Ambil stok telur saat ini |
| `POST` | `/api/eggs/increment` | IoT API Key | Update stok dari ESP32 |
| `POST` | `/api/eggs/reduce` | SUPERADMIN | Kurangi telur per butir |
| `POST` | `/api/racks/reduce` | SUPERADMIN | Kurangi telur per rak |
| `GET` | `/api/orders` | Login | User melihat order sendiri, SUPERADMIN melihat semua |
| `POST` | `/api/orders` | Login | Membuat pesanan telur |
| `PATCH` | `/api/orders/[id]` | SUPERADMIN | Approve atau reject pesanan |
| `POST` | `/api/users` | SUPERADMIN | Membuat user |
| `POST` | `/api/auth/register/send-otp` | Public | Kirim OTP registrasi |
| `POST` | `/api/auth/register/verify-otp` | Public | Verifikasi OTP dan buat akun |

## WebSocket

Client web terhubung ke:

```text
ws://localhost:3001
```

Event dari server ke client:

```json
{
  "event": "egg:updated",
  "data": {
    "count": 65,
    "racks": 2,
    "remainingEggs": 5,
    "lastUpdated": "2026-05-27T00:00:00.000Z"
  }
}
```

Event internal untuk meminta server WebSocket broadcast ulang data terbaru:

```json
{
  "event": "egg:broadcast",
  "data": {
    "apiKey": "esp32-egg-counter-key"
  }
}
```

Mode lama untuk increment langsung lewat WebSocket masih tersedia:

```json
{
  "event": "egg:increment",
  "data": {
    "apiKey": "esp32-egg-counter-key",
    "increment": 1
  }
}
```

## ESP32

Kode utama perangkat ada di `egg_counter.ino`.

Konfigurasi yang perlu disesuaikan:

```cpp
const char* ssid = "YOUR_WIFI";
const char* password = "YOUR_PASSWORD";
const char* server_url = "http://YOUR_SERVER:3000/api/eggs/increment";
const char* apiKey = "esp32-egg-counter-key";
```

Implementasi saat ini mengirim `totalCount` absolut agar lebih aman saat retry:

```json
{ "totalCount": 123 }
```

Backend juga masih menerima format lama:

```json
{ "increment": 1 }
```

## Project Structure

```text
src/
  app/
    page.tsx                    Public monitoring
    login/                      Login page
    register/                   Register + OTP page
    order/                      User order page
    dashboard/                  SUPERADMIN dashboard
    api/                        API routes
  components/                   Shared React components
  features/                     Feature-level API clients and hooks
  hooks/                        Shared custom hooks
  lib/                          Prisma, auth, mailer, websocket, utilities
  types/                        Shared TypeScript types
server/
  websocket.ts                  WebSocket server
prisma/
  schema.prisma                 MongoDB schema
  seed.ts                       Initial seed data
scripts/
  check-db.ts                   Database helper script
egg_counter.ino                 ESP32 firmware
espcode.md                      Older ESP32 reference code
```

## Database Models

- `User`: akun aplikasi dengan role `USER` atau `SUPERADMIN`.
- `EggCount`: stok telur saat ini.
- `EggLog`: riwayat perubahan stok.
- `EggShopOrder`: pesanan telur user dan status approval.
- `OtpVerification`: data sementara untuk verifikasi registrasi.

## Catatan

- Satu rak dihitung sebagai 30 butir telur. Konstanta ini ada di `src/lib/utils.ts` sebagai `EGGS_PER_RACK`.
- Untuk development lokal, Next.js dan WebSocket server dijalankan sebagai proses terpisah.
- Pastikan `IOT_API_KEY` di `.env` sama dengan `apiKey` di kode ESP32.
