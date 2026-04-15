# MemeAgent Studio — Developer Guide

## Daftar Isi

1. [Arsitektur & Alur Data](#1-arsitektur--alur-data)
2. [Bug yang Sudah Diperbaiki](#2-bug-yang-sudah-diperbaiki)
3. [Setup Lokal](#3-setup-lokal)
4. [Variabel Environment](#4-variabel-environment)
5. [Penjelasan Setiap File](#5-penjelasan-setiap-file)
6. [Alur Deploy Token (Step by Step)](#6-alur-deploy-token-step-by-step)
7. [Four.meme API Reference](#7-fourmeme-api-reference)
8. [Troubleshooting](#8-troubleshooting)
9. [Deploy ke Production](#9-deploy-ke-production)

---

## 1. Arsitektur & Alur Data

```
Browser (React + Vite dev server :5173)
│
├── /api/*        → proxy → Express backend :3001
│                          ├── POST /api/generate-token   (Fireworks LLM)
│                          ├── POST /api/generate-image   (Fireworks FLUX.1)
│                          └── POST /api/generate-lore    (Fireworks LLM)
│
└── /meme-api/*   → proxy → https://four.meme  (CORS bypass)
                             rewrite: /meme-api/v1/... → /v1/...
```

**Mengapa dua proxy?**

- `/api` → Express backend menyimpan `FIREWORKS_API_KEY` di server side, tidak bocor ke browser
- `/meme-api` → Four.meme tidak mengizinkan cross-origin request dari browser langsung (CORS). Vite proxy bertindak sebagai relay.

---

## 2. Bug yang Sudah Diperbaiki

### Bug #1 — `signMessageAsync` dengan field `account` (KRITIS)
**File:** `src/hooks/useTokenCreator.js`

**Masalah:** wagmi v2 / RainbowKit tidak menerima field `account` di `signMessageAsync`. Ini menyebabkan error langsung setelah popup konfirmasi wallet muncul — MetaMask throw "invalid argument".

```js
// ❌ SALAH — wagmi v2 tidak support field `account`
const signature = await signMessageAsync({
  message: `You are sign in Meme ${nonce}`,
  account: address,   // ← INI PENYEBAB ERROR
})

// ✅ BENAR
const signature = await signMessageAsync({
  message: `You are sign in Meme ${nonce}`,
})
```

wagmi v2 secara otomatis menggunakan account yang sedang terhubung. Field `account` hanya valid di wagmi v1.

---

### Bug #2 — `createArg` dan `signature` dalam format Base64 (KRITIS)
**File:** `src/hooks/useTokenCreator.js`

**Masalah:** Four.meme API `/private/token/create` mengembalikan `createArg` dan `signature` sebagai **Base64**, bukan hex. Kode lama hanya mengecek `startsWith('0x')` dan menambahkan `0x` di depan jika tidak ada, yang mengakibatkan bytes yang salah dikirim ke smart contract → transaksi revert.

```js
// ❌ SALAH — Base64 string bukan hex, jadi ini menghasilkan bytes salah
const createArgHex = createArg.startsWith('0x') ? createArg : `0x${createArg}`

// ✅ BENAR — deteksi format dan konversi Base64 → hex
const toHexBytes = (val) => {
  if (!val) return '0x'
  if (val.startsWith('0x')) return val  // sudah hex
  try {
    const binary = atob(val)            // decode Base64
    const hex = Array.from(binary, (c) =>
      c.charCodeAt(0).toString(16).padStart(2, '0')
    ).join('')
    return `0x${hex}`
  } catch (_) {
    return `0x${val}`                   // fallback
  }
}
```

---

### Bug #3 — `transports: undefined` di wagmi config (SEDANG)
**File:** `src/wagmi.config.js`

**Masalah:** `transports: { [bsc.id]: undefined }` menyebabkan `publicClient.readContract` tidak tahu cara terhubung ke BSC RPC saat membaca `_launchFee` dari contract.

```js
// ❌ SALAH
import { getDefaultConfig } from '@rainbow-me/rainbowkit'
import { bsc } from 'wagmi/chains'

export const config = getDefaultConfig({
  chains: [bsc],
  transports: { [bsc.id]: undefined }, // ← tidak ada RPC!
})

// ✅ BENAR
import { http } from 'wagmi'

export const config = getDefaultConfig({
  chains: [bsc],
  transports: {
    [bsc.id]: http('https://bsc-dataseed1.binance.org'),
  },
})
```

---

### Bug #4 — Vite proxy path tidak di-rewrite (SEDANG)
**File:** `vite.config.js`

**Masalah:** Tanpa `rewrite`, request ke `/meme-api/v1/public/config` diteruskan ke `https://four.meme/meme-api/v1/public/config` — path `/meme-api` ikut terbawa, padahal Four.meme tidak punya path tersebut. Semua request ke Four.meme API akan 404.

```js
// ❌ SALAH — path dobel: four.meme/meme-api/v1/...
'/meme-api': {
  target: 'https://four.meme',
  changeOrigin: true,
}

// ✅ BENAR — rewrite memotong prefix /meme-api
'/meme-api': {
  target: 'https://four.meme',
  changeOrigin: true,
  rewrite: (path) => path.replace(/^\/meme-api/, ''),
}
```

Sehingga `/meme-api/v1/public/config` → `https://four.meme/v1/public/config` ✓

---

## 3. Setup Lokal

### Prasyarat
- Node.js 18+ (disarankan 20 LTS)
- npm 9+
- MetaMask (atau wallet EVM lain) di browser
- API key Fireworks AI

### Langkah-langkah

```bash
# 1. Clone / extract project
cd memeagent-studio

# 2. Install frontend dependencies
npm install

# 3. Install backend dependencies
cd server && npm install && cd ..

# 4. Buat file environment
cp .env.example .env
```

Edit `.env` dan isi `FIREWORKS_API_KEY`.

```bash
# 5. Jalankan backend (terminal 1)
node server/index.js
# Output: ✓ MemeAgent backend running on :3001

# 6. Jalankan frontend (terminal 2)
npm run dev
# Buka: http://localhost:5173
```

Atau jalankan keduanya sekaligus:
```bash
npm run start
```

---

## 4. Variabel Environment

### `.env` (root project — untuk frontend Vite)

| Variabel | Wajib | Keterangan |
|---|---|---|
| `FIREWORKS_API_KEY` | ✅ | API key dari [app.fireworks.ai](https://app.fireworks.ai/account/api-keys) |
| `PORT` | ❌ | Port Express backend, default `3001` |
| `VITE_WALLETCONNECT_PROJECT_ID` | ❌ | Dari [cloud.walletconnect.com](https://cloud.walletconnect.com). Tanpa ini hanya MetaMask (injected wallet) yang bekerja |

### `server/.env` (untuk backend Express)

| Variabel | Wajib | Keterangan |
|---|---|---|
| `FIREWORKS_API_KEY` | ✅ | Sama dengan di atas |

> **Catatan:** `.env` di root dibaca oleh Vite (`VITE_` prefix) DAN oleh `server/index.js` (melalui `process.env`). Pastikan `FIREWORKS_API_KEY` ada di keduanya, atau copy dari root ke `server/.env`.

---

## 5. Penjelasan Setiap File

### `src/wagmi.config.js`
Konfigurasi wagmi + RainbowKit. Mendefinisikan chain (BSC), transport RPC, dan app metadata untuk WalletConnect.

### `src/main.jsx`
Entry point React. Membungkus app dengan `WagmiProvider` dan `RainbowKitProvider`.

### `src/hooks/useTokenCreator.js`
**Hook utama** — berisi seluruh logika generate dan deploy:
- `generate(idea)` → memanggil backend AI, mengembalikan token data
- `deploy(tokenData)` → login Four.meme → upload image → create token API → baca launchFee → kirim tx onchain
- State machine berbasis `STEPS` enum

### `src/lib/fourmeme.js`
Semua panggilan ke Four.meme API via axios. Base URL: `/meme-api/v1` (di-proxy oleh Vite).

### `src/lib/contracts.js`
ABI dan address contract di BSC mainnet:
- `TOKEN_MANAGER2_ADDRESS` — contract utama Four.meme untuk deploy token
- `HELPER3_ADDRESS` — untuk query info token
- `NFT_8004_ADDRESS` — EIP-8004 agent identity (fitur opsional)

### `src/lib/apiClient.js`
Panggilan ke Express backend (`/api/*`) untuk generate via AI.

### `server/index.js`
Backend Express. Menyimpan `FIREWORKS_API_KEY` secara aman. Endpoint:
- `POST /api/generate-token` — LLM generate nama/simbol/desc/dll
- `POST /api/generate-image` — FLUX.1 generate logo
- `POST /api/generate-lore` — LLM generate tweet dan lore

### `vite.config.js`
Dua proxy penting:
- `/meme-api` → `https://four.meme` (dengan path rewrite)
- `/api` → `http://localhost:3001`

---

## 6. Alur Deploy Token (Step by Step)

```
[SIGNING_LOGIN]
  1. getNonce(address)        → POST /meme-api/v1/private/user/nonce/generate
  2. signMessageAsync(nonce)  → MetaMask popup → user sign
  3. login(address, sig)      → POST /meme-api/v1/private/user/login/dex
                               → dapat access_token

[UPLOADING]
  4. Convert imageBase64 → Blob
  5. uploadImage(token, blob)  → POST /meme-api/v1/private/token/upload
                                → dapat imgUrl (CDN URL Four.meme)

[CREATING_API]
  6. getPublicConfig()         → GET /meme-api/v1/public/config
                                → dapat raisedToken (BNB config)
  7. createTokenAPI(token, {   → POST /meme-api/v1/private/token/create
       name, shortName, desc,
       imgUrl, label, raisedToken
     })
     → dapat { createArg, signature } dalam format Base64
     → konversi Base64 → hex dengan toHexBytes()

[SIGNING_TX]
  8. readContract(_launchFee)  → BSC RPC via wagmi publicClient
  9. writeContractAsync(       → MetaMask popup → user sign tx
       createToken(createArgHex, createSigHex),
       value: launchFee
     )

[CONFIRMING]
  10. waitForTransactionReceipt(txHash)
      → extract token address dari receipt.logs[0].address
      → selesai!
```

---

## 7. Four.meme API Reference

Base URL (via proxy): `/meme-api/v1`

| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/private/user/nonce/generate` | ❌ | Minta nonce untuk signing |
| POST | `/private/user/login/dex` | ❌ | Login dengan signed message |
| POST | `/private/token/upload` | ✅ Token | Upload gambar token |
| GET | `/public/config` | ❌ | Config publik (raisedToken) |
| POST | `/private/token/create` | ✅ Token | Register token → dapat createArg |
| POST | `/public/token/search` | ❌ | Cari token (hot, latest, dll) |

Header auth: `meme-web-access: <access_token>`

**Format response:**
```json
{ "code": "0", "data": { ... }, "msg": "" }
```
`code === "0"` berarti sukses.

---

## 8. Troubleshooting

### Error setelah popup MetaMask muncul
→ Pastikan field `account` sudah dihapus dari `signMessageAsync` (Bug #1)

### Four.meme API 404
→ Pastikan `rewrite` sudah ada di `vite.config.js` (Bug #4)

### `readContract` gagal / error "no transport"
→ Pastikan `transports` di `wagmi.config.js` menggunakan `http(...)` bukan `undefined` (Bug #3)

### Transaksi revert di BSC
→ Periksa konversi Base64 → hex untuk `createArg` dan `signature` (Bug #2)

### Image generation timeout
→ FLUX.1 bisa lambat. Timeout sudah di-set 120 detik. Jika masih gagal, cek API key Fireworks.

### WalletConnect tidak muncul
→ Isi `VITE_WALLETCONNECT_PROJECT_ID` di `.env` dengan project ID yang valid dari cloud.walletconnect.com

### CORS error di `/meme-api`
→ Proxy Vite hanya berjalan di dev server (`npm run dev`). Di production, gunakan nginx/express sebagai reverse proxy — lihat bagian Deploy ke Production.

---

## 9. Deploy ke Production

### Build frontend

```bash
npm run build
# Output ke dist/
```

### Serve dengan nginx (contoh)

```nginx
server {
  listen 80;
  server_name yourdomain.com;

  root /var/www/memeagent/dist;
  index index.html;

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy ke Express backend
  location /api/ {
    proxy_pass http://localhost:3001;
    proxy_set_header Host $host;
  }

  # Proxy ke Four.meme (pengganti Vite proxy)
  location /meme-api/ {
    rewrite ^/meme-api/(.*) /$1 break;
    proxy_pass https://four.meme;
    proxy_set_header Host four.meme;
    proxy_set_header Origin https://four.meme;
  }
}
```

### Jalankan backend dengan PM2

```bash
npm install -g pm2
cd server
pm2 start index.js --name memeagent-backend
pm2 save
pm2 startup
```

### Environment variable di production

Jangan gunakan file `.env` di production. Gunakan:
- **Systemd**: `Environment=FIREWORKS_API_KEY=xxx` di unit file
- **PM2**: `pm2 start index.js --env production` dengan `ecosystem.config.js`
- **Docker**: `-e FIREWORKS_API_KEY=xxx`
- **Platform** (Render, Railway, Vercel): isi di dashboard environment variables

---

*Guide ini dibuat untuk MemeAgent Studio v1.0 — Four.meme AI Sprint 2026*
