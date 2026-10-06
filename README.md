# Alz Point - Modern POS & Koperasi Management System

![Alz Point Thumbnail](https://i.ibb.co.com/gM1ZvhXF/thumbnail.png)

Alz Point adalah aplikasi Point of Sale (POS) berbasis web modern yang dirancang khusus untuk mengoptimalkan manajemen transaksi kasir, inventaris produk, dan pelaporan keuangan. Dibangun dengan arsitektur *headless* yang memisahkan frontend reaktif dan backend API yang solid, aplikasi ini menawarkan pengalaman pengguna yang cepat, mulus, dan sangat dapat dikustomisasi.

## ✨ Fitur Utama

* **Sistem Transaksi Kasir (POS) Interaktif:** Antarmuka kasir yang intuitif dengan fitur pencarian, filter kategori, keranjang belanja *real-time*, perhitungan kembalian, dan modal overlay pembayaran kasir yang efisien[cite: 11, 12].
* **Smart AI Assistant:** Asisten cerdas terintegrasi untuk membantu kasir menjawab pertanyaan operasional, memberikan tips manajemen stok, dan panduan penggunaan sistem[cite: 13].
* **Dashboard Analitik Komprehensif:** Pemantauan data secara langsung melalui grafik interaktif yang menampilkan total pendapatan, jumlah transaksi, item terjual, dan rata-rata nilai transaksi dengan filter waktu[cite: 14].
* **Manajemen Produk & Katalog:** Sistem manajemen inventaris (CRUD) yang efisien untuk mengelola data barang, harga, dan memantau ketersediaan stok[cite: 15].
* **Kustomisasi Tema Dinamis:** Personalisasi tampilan aplikasi secara penuh. Pengguna dapat memilih mode warna (Terang/Gelap/Default), warna aksen utama, hingga radius sudut antarmuka kartu (Kotak, Tipis, Sedang, Lembut)[cite: 16].

## 🚀 Teknologi yang Digunakan

### Frontend
* **Framework:** React.js dengan Vite
* **Styling:** Tailwind CSS (Modern Neo-brutalism & Clean UI)
* **Animasi:** GSAP (GreenSock Animation Platform) untuk interaksi UI yang mulus
* **HTTP Client:** Axios dengan Interceptors

### Backend
* **Framework:** Laravel 11/13 (PHP 8.3)
* **Database:** MySQL (Aiven Cloud)
* **Autentikasi:** Laravel Sanctum (Token-based Auth)

### Infrastruktur & Deployment
* **Hosting:** Vercel (Frontend & Serverless Backend)
* **Version Control:** Git & GitHub

## 📦 Instalasi & Setup Lokal

Ikuti panduan di bawah ini untuk menjalankan Alz Point di komputer lokal.

### Prasyarat
* Node.js (v18+)
* PHP (v8.3+)
* Composer
* MySQL Database

### 1. Setup Backend (Laravel)
bash
# Clone repositori
git clone [https://github.com/username/alzpoint.git](https://github.com/username/alzpoint.git)
cd alzpoint/be

# Install dependensi PHP
composer install

# Salin file environment dan generate key
cp .env.example .env
php artisan key:generate

# Konfigurasi database di file .env
# DB_CONNECTION=mysql
# DB_HOST=127.0.0.1
# DB_PORT=3306
# DB_DATABASE=nama_database
# DB_USERNAME=root
# DB_PASSWORD=

# Jalankan migrasi dan seeder
php artisan migrate:fresh --seed


# Buka tab terminal baru, masuk ke folder frontend
cd alzpoint/fe

# Install dependensi Node.js
npm install

# Buat file environment
cp .env.example .env
# Tambahkan konfigurasi URL backend di dalam file .env
# VITE_API_BASE_URL=http://localhost:8000/api

# Jalankan development server
npm run dev

💡 Developer
Dikembangkan oleh Aldo Rendy Julian Alfiansyah (Allzxxo).
Full-stack Web Developer yang berfokus pada pengembangan antarmuka modern (React.js, Tailwind CSS) dan sistem backend yang handal (Laravel, Node.js).


# Jalankan server lokal
php artisan serve
