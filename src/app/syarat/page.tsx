import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Syarat layanan" };

export default function SyaratPage() {
  return (
    <LegalPage title="Syarat layanan" updated="27 Oktober 2026">
      <p>Dengan memakai Boma, kamu menyetujui syarat berikut.</p>
      <h2>Layanan</h2>
      <p>Boma adalah alat bantu pencatatan dan perencanaan keuangan. Boma bukan bank, bukan penasihat keuangan, dan tidak menyimpan atau memindahkan uangmu.</p>
      <h2>Akun</h2>
      <ul>
        <li>Kamu masuk menggunakan akun Google dan bertanggung jawab menjaga keamanannya.</li>
        <li>Satu akun untuk satu orang. Untuk mengelola bersama, gunakan fitur Pasangan.</li>
        <li>Kami dapat menonaktifkan akun yang dipakai untuk penyalahgunaan atau mengganggu layanan.</li>
      </ul>
      <h2>Langganan Premium</h2>
      <ul>
        <li>Premium dibayar di muka untuk satu periode (misalnya 30 hari) melalui DOKU dan tidak diperpanjang otomatis.</li>
        <li>Harga dapat berubah sewaktu-waktu; perubahan hanya berlaku untuk pembayaran berikutnya.</li>
        <li>Setelah masa Premium berakhir, akun kembali ke paket Gratis tanpa kehilangan data.</li>
        <li>Pembayaran yang sudah berhasil tidak dapat dikembalikan, kecuali terjadi kesalahan dari pihak kami.</li>
      </ul>
      <h2>Batasan tanggung jawab</h2>
      <p>Angka di Boma sepenuhnya berasal dari catatanmu. Kami berupaya menjaga layanan tetap berjalan dan data tetap aman, namun tidak bertanggung jawab atas keputusan keuangan yang diambil berdasarkan catatan tersebut.</p>
      <h2>Perubahan syarat</h2>
      <p>Syarat ini dapat diperbarui. Perubahan penting akan diumumkan di aplikasi.</p>
    </LegalPage>
  );
}
