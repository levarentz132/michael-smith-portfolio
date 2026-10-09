import React from 'react';
import { ArrowLeft, Mail, ShieldCheck, Phone, MapPin, Bell, MessageSquare, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  useSEO({
    title: 'Kebijakan Privasi (Privacy Policy) | Highlanderstay App',
    description: 'Privacy Policy for Highlanderstay mobile app and web platform, outlining how user data, location, push notifications, and room booking records are handled and protected.',
    keywords: 'Highlanderstay privacy policy, Google Play privacy policy, data safety, push notification privacy',
    canonicalUrl: 'https://highlanderstay.com/privacy-policy'
  });

  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <section className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </button>

        <div className="border border-stroke bg-surface rounded-3xl p-6 md:p-10 shadow-xl text-left">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">Highlanderstay Android App & Web</p>
              <h1 className="text-2xl md:text-4xl font-display font-bold">Kebijakan Privasi (Privacy Policy)</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs text-muted mb-8 pb-4 border-b border-white/10">
            <span>Terakhir diperbarui: <strong>9 Oktober 2026</strong></span>
            <span>•</span>
            <span>Berlaku untuk: <strong>com.highlanderstay.app</strong></span>
          </div>

          <div className="space-y-8 text-sm leading-relaxed text-muted">
            <p>
              Selamat datang di <strong>Highlanderstay</strong> (aplikasi seluler Android <code>com.highlanderstay.app</code> dan situs web <code>https://highlanderstay.com</code>). Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi pengguna saat menjelajah kamar kos, apartemen, maupun melakukan reservasi.
            </p>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Database className="w-4 h-4 text-amber-400" />
                <span>1. Data yang Kami Kumpulkan</span>
              </h2>
              <p>Kami mengumpulkan data berikut yang Anda berikan secara sukarela untuk kelancaran operasional layanan:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Informasi Kontak & Akun:</strong> Nama lengkap, nomor telepon (WhatsApp), alamat email, dan identitas verifikasi penyewa saat melakukan login atau booking.</li>
                <li><strong>Data Transaksi & Booking:</strong> Informasi kamar/unit yang dipilih, durasi sewa, tanggal check-in, dan status pembayaran.</li>
                <li><strong>Pesan & Live Chat:</strong> Percakapan, pertanyaan, atau keluhan yang dikirimkan melalui fitur Live Chat dalam aplikasi.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                <span>2. Izin Akses Lokasi (GPS)</span>
              </h2>
              <p>
                Aplikasi dapat meminta izin akses lokasi perangkat (GPS) <strong>hanya jika Anda mengizinkannya secara eksplisit</strong> saat menggunakan fitur peta interaktif. Data lokasi hanya digunakan secara real-time pada perangkat untuk menghitung jarak dan menampilkan unit kos terdekat dari posisi Anda, dan tidak disimpan atau dilacak di latar belakang secara permanen.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <Bell className="w-4 h-4 text-emerald-400" />
                <span>3. Notifikasi Push & Perangkat (FCM)</span>
              </h2>
              <p>
                Untuk menyampaikan informasi penting seperti balasan Live Chat dari admin atau konfirmasi booking secara real-time saat aplikasi sedang ditutup, aplikasi menggunakan layanan <strong>Google Firebase Cloud Messaging (FCM)</strong>. Token perangkat acak (FCM Device Token) disimpan dengan aman di server kami untuk mengirimkan notifikasi tersebut.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-400" />
                <span>4. Penggunaan Layanan Pihak Ketiga</span>
              </h2>
              <p>Untuk menunjang fungsionalitas aplikasi, kami bekerja sama dengan penyedia layanan pihak ketiga tepercaya:</p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li><strong>Google Firebase (FCM):</strong> Untuk infrastruktur pengiriman Push Notification.</li>
                <li><strong>Chatwoot:</strong> Untuk modul layanan pelanggan Live Chat.</li>
                <li><strong>Payment Gateway (DOKU / Midtrans):</strong> Untuk memproses transaksi pembayaran secara aman. Kami tidak pernah menyimpan nomor kartu kredit atau PIN perbankan Anda.</li>
                <li><strong>OpenStreetMap:</strong> Untuk menampilkan peta lokasi properti.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">5. Pembagian Data (Data Sharing)</h2>
              <p>
                Kami <strong>tidak pernah menjual, menyewakan, atau memperjualbelikan</strong> data pribadi Anda kepada pihak ketiga manapun untuk tujuan periklanan atau pemasaran pihak lain.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">6. Syarat & Ketentuan Penggunaan Akun</h2>
              <p>
                Dengan mendaftar akun atau menggunakan platform Highlanderstay, pengguna menyetujui ketentuan berikut:
              </p>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>Pengguna wajib memberikan data nomor telepon WhatsApp dan informasi identitas yang valid dan benar.</li>
                <li>Pengguna bertanggung jawab penuh atas keamanan kredensial akun dan kerahasiaan kata sandi/kode OTP masing-masing.</li>
                <li>Pemesanan dan pembayaran sewa kamar wajib mengikuti ketentuan reservasi yang berlaku di masing-masing unit properti Highlanderstay.</li>
                <li>Dilarang menyalahgunakan sistem, melakukan spam, atau melakukan tindakan melawan hukum dalam properti maupun sistem digital Highlanderstay.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-base font-bold text-text-primary">7. Hak Pengguna & Penghapusan Data (Data Deletion)</h2>
              <p>
                Anda berhak untuk meminta salinan, pembaruan, atau <strong>penghapusan akun dan seluruh data pribadi Anda</strong> kapan saja. Anda dapat mengajukan permohonan penghapusan data dengan menghubungi kami melalui email resmi di bawah ini dengan subjek <em>"Permohonan Hapus Data Pengguna"</em>.
              </p>
            </section>

            <section className="space-y-3 pt-4 border-t border-white/10">
              <h2 className="text-base font-bold text-text-primary">8. Kontak Kami</h2>
              <p>
                Jika Anda memiliki pertanyaan mengenai kebijakan privasi atau syarat & ketentuan ini di aplikasi Highlanderstay, silakan hubungi tim kami:
              </p>
              <div className="flex flex-wrap gap-3 mt-3">
                <div className="inline-flex items-center gap-2 rounded-2xl border border-stroke bg-bg px-4 py-3 text-text-primary">
                  <Mail className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold">support@highlanderstay.com</span>
                </div>
                <div className="inline-flex items-center gap-2 rounded-2xl border border-stroke bg-bg px-4 py-3 text-text-primary">
                  <Phone className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-semibold">+62 818-0623-6581</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};

