# Boma: Aplikasi SaaS Pencatat Keuangan Pribadi & Pasangan

Boma adalah aplikasi web untuk mencatat pemasukan dan pengeluaran, membuat anggaran bulanan, menabung untuk target, dan mengingatkan tagihan rutin. Pengguna masuk dengan akun Google, bisa mengajak pasangan mengelola satu buku keuangan bersama, dan berlangganan paket Premium bulanan lewat DOKU. Super admin mengatur harga dan batas fitur paket dari panel admin.

Dibangun dengan **Next.js 16 (App Router)**, **PostgreSQL + Drizzle ORM**, **Better Auth (Google OAuth)**, **Tailwind CSS v4**, dan **DOKU Checkout**.

## Fitur

- Landing page lengkap dengan maskot kucing Boma dan ilustrasi
- Login Google (tanpa kata sandi), super admin otomatis lewat `SUPER_ADMIN_EMAILS`
- Dasbor: total saldo, pemasukan/pengeluaran bulan ini, grafik 14 hari, komposisi kategori, anggaran, target, tagihan, pesan otomatis dari Boma
- Transaksi pemasukan, pengeluaran, dan transfer antar dompet; filter, pencarian, unduh CSV (aman dari CSV injection)
- Input nominal yang manusiawi: bisa ketik `25rb`, `1,5jt`, `Rp 25.000`
- Banyak dompet (tunai, bank, e-wallet) dengan saldo awal, arsip dompet
- Kategori kustom dengan ikon & warna
- Anggaran bulanan per kategori, sisa harian aman, salin dari bulan lalu
- Target tabungan dengan setor/tarik, tenggat, dan saran nominal per bulan
- Tagihan rutin (mingguan/bulanan/tahunan): bayar sekali klik otomatis tercatat
- Laporan bulanan & tren 6 bulan, porsi ditabung, hari paling boros
- Pasangan: undang 1 orang lewat email Google, tautan berlaku 7 hari, bisa dicabut, setiap transaksi tercatat siapa yang input
- Langganan Premium via DOKU Checkout (QRIS, VA, e-wallet, kartu), webhook bertanda tangan, idempoten
- Panel super admin: ringkasan pendapatan & pengguna, blokir pengguna, beri Premium manual, atur harga & batas fitur paket, daftar pembayaran, log aktivitas
- Keamanan: query terparameter (anti SQL injection), cek kepemilikan data di setiap aksi, rate limit, CSP & security headers, perlindungan open redirect
- Tampilan responsif dengan menu bawah untuk HP

## Kebutuhan

- Node.js 20 atau lebih baru
- PostgreSQL 14+ (atau Docker untuk menjalankan `docker-compose.yml`)

## Cara Install (lokal)

1. Ekstrak ZIP, buka terminal di folder `boma`, lalu install paket:
   ```
   npm install
   ```
2. Siapkan database PostgreSQL. Paling mudah dengan Docker:
   ```
   docker compose up -d
   ```
   Atau buat database `boma` di PostgreSQL yang sudah ada.
3. Salin `.env.example` menjadi `.env.local`, lalu isi:
   ```
   APP_URL=http://localhost:3000
   DATABASE_URL=postgres://boma:boma_lokal_ganti_ini@127.0.0.1:5432/boma
   BETTER_AUTH_SECRET=   (hasil: openssl rand -base64 48)
   DEV_PASSWORD_LOGIN=1  (untuk mencoba tanpa Google)
   ```
4. Buat tabel database dan paket bawaan (Gratis & Premium):
   ```
   npm run db:migrate
   ```
5. Jalankan:
   ```
   npm run dev
   ```
   Buka `http://localhost:3000/masuk`. Dengan `DEV_PASSWORD_LOGIN=1` muncul form **Mode uji lokal**: isi email & sandi apa saja (min. 8 karakter) untuk membuat akun uji.
6. Jadikan akunmu super admin:
   ```
   npm run make-admin -- emailkamu@gmail.com
   ```
   Panel admin ada di menu **Panel admin** / `http://localhost:3000/admin`.

Tanpa kredensial DOKU, tombol bayar di komputer lokal memakai **mode simulasi** (ada tombol "Simulasikan lunas") supaya alur Premium bisa dicoba.

## Login Google

1. Buka [Google Cloud Console](https://console.cloud.google.com) > APIs & Services > **OAuth consent screen**, isi nama aplikasi, lalu **Publish app**.
2. **Credentials** > Create credentials > **OAuth client ID** > *Web application*.
3. Authorized JavaScript origins: `https://domainmu.com` (lokal: `http://localhost:3000`).
4. Authorized redirect URIs: `https://domainmu.com/api/auth/callback/google` (lokal: `http://localhost:3000/api/auth/callback/google`).
5. Isi `GOOGLE_CLIENT_ID` dan `GOOGLE_CLIENT_SECRET` di `.env.local`, lalu jalankan ulang aplikasi.

## Pembayaran DOKU

1. Daftar di [DOKU](https://dashboard.doku.com), ambil **Client ID** dan **Secret Key** (sandbox dulu).
2. Isi `DOKU_ENV=sandbox`, `DOKU_CLIENT_ID`, `DOKU_SECRET_KEY`.
3. Di dashboard DOKU atur **Notification URL** ke `https://domainmu.com/api/webhooks/doku`.
4. Harga & durasi Premium diatur dari **Panel admin > Paket & harga** (harga baru berlaku untuk pembayaran berikutnya).

## Deploy ke server

Proyek sudah menyertakan `Dockerfile` (output standalone, migrasi otomatis saat container start):

```
docker build -t boma .
docker run -d --name boma -p 3000:3000 --env-file .env.production boma
```

Pasang di belakang HTTPS (Nginx, Traefik, Caddy, atau Cloudflare Tunnel). Untuk perlindungan DDoS disarankan memakai Cloudflare. Di server, **kosongkan** `DEV_PASSWORD_LOGIN`.

Alternatif tanpa Docker: `npm run build` lalu `npm run start` (jalankan `npm run db:migrate` lebih dulu).

## Struktur singkat

- `src/app/` halaman (landing, `(app)` area pengguna, `admin`, API auth/ekspor/webhook)
- `src/lib/actions/` server action (transaksi, akun & pasangan, langganan, admin)
- `src/lib/server/` query database, paket & hak fitur, billing
- `src/lib/db/schema.ts` skema database (Drizzle), migrasi di `db/drizzle/`
- `src/components/illustrations/` maskot Boma & ilustrasi SVG

Semua nominal disimpan sebagai bilangan bulat rupiah dan semua tanggal memakai zona waktu WIB.
