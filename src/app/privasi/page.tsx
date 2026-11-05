import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Kebijakan privasi" };

export default function PrivasiPage() {
  return (
    <LegalPage title="Kebijakan privasi" updated="27 Oktober 2026">
      <p>Boma adalah aplikasi pencatat keuangan pribadi. Kami hanya mengumpulkan data yang diperlukan agar aplikasi bekerja, dan tidak pernah menjualnya.</p>
      <h2>Data yang kami simpan</h2>
      <ul>
        <li>Dari akun Google: nama, alamat email, dan foto profil. Kami tidak meminta akses ke Gmail, Drive, atau kontakmu.</li>
        <li>Data keuangan yang kamu ketik sendiri: dompet, transaksi, anggaran, target tabungan, dan tagihan.</li>
        <li>Data pembayaran langganan: nomor invoice, nominal, dan status dari DOKU. Nomor kartu dan rekening tidak pernah sampai ke server Boma.</li>
        <li>Data teknis untuk keamanan: alamat IP dan jenis peramban pada sesi masuk.</li>
      </ul>
      <h2>Bagaimana data dipakai</h2>
      <p>Data dipakai hanya untuk menampilkan catatan keuanganmu, menghitung laporan, memproses langganan, dan menjaga keamanan akun. Boma tidak terhubung ke rekening bank mana pun.</p>
      <h2>Berbagi dengan pasangan</h2>
      <p>Jika kamu mengundang pasangan, ia dapat melihat dan mengubah isi buku keuangan yang kamu bagikan. Buku pribadi masing-masing tetap terpisah. Akses bisa dicabut kapan saja dari menu Pasangan.</p>
      <h2>Penyimpanan & keamanan</h2>
      <p>Data disimpan di server yang kami kelola, dikirim lewat HTTPS, dan dilindungi kontrol akses ketat. Kami mencadangkan data secara berkala.</p>
      <h2>Hak kamu</h2>
      <p>Kamu dapat mengunduh transaksi (CSV) dan menghapus akun beserta seluruh datanya kapan saja dari halaman Pengaturan.</p>
      <h2>Kontak</h2>
      <p>Pertanyaan soal privasi dapat dikirim melalui kanal bantuan yang tercantum di situs.</p>
    </LegalPage>
  );
}
