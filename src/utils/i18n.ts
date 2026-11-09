import { useState, useEffect } from 'react';

export type AppLanguage = 'id' | 'en';

const LANG_KEY = 'hs_language_preference';

export const translations = {
  id: {
    // Nav
    nav_home: 'Beranda',
    nav_rooms: 'Ruangan',
    nav_map: 'Peta Lokasi',
    nav_facilities: 'Fasilitas',
    nav_resort: 'Resort',
    nav_cart: 'Keranjang',
    nav_profile: 'Akun Saya',
    nav_login: 'Masuk / Daftar',
    nav_logout: 'Keluar',
    nav_settings: 'Pengaturan',

    // Walkthrough
    wt_title_1: 'Cari Kos & Apartemen Idaman',
    wt_desc_1: 'Temukan pilihan kamar kos eksklusif dan apartemen modern dengan filter lokasi, harga, dan fitur tur virtual 360° yang imersif.',
    wt_title_2: 'Booking Instan & Aman',
    wt_desc_2: 'Pesan kamar kapan saja dengan checkout pembayaran resmi online via DOKU Jokul. Konfirmasi sewa aktif secara instan.',
    wt_title_3: 'Portal Penghuni Lengkap',
    wt_desc_3: 'Kelola tagihan bulanan, unggah bukti bayar, pantau komplain perbaikan fasilitas, dan kontak darurat dalam satu aplikasi.',
    wt_skip: 'Lewati',
    wt_next: 'Lanjut',
    wt_start: 'Mulai Sekarang',

    // Settings
    settings_title: 'Pengaturan Aplikasi',
    settings_desc: 'Personalisasi preferensi tampilan, bahasa, dan notifikasi Anda.',
    settings_theme: 'Tema Tampilan',
    settings_theme_dark: 'Mode Gelap',
    settings_theme_light: 'Mode Terang',
    settings_theme_system: 'Mengikuti Sistem',
    settings_language: 'Bahasa Aplikasi',
    settings_lang_id: 'Bahasa Indonesia',
    settings_lang_en: 'English (US)',
    settings_notifications: 'Notifikasi & Pengingat',
    settings_notif_desc: 'Terima info tagihan jatuh tempo dan status komplain.',
    settings_walkthrough: 'Panduan Fitur Aplikasi',
    settings_walkthrough_btn: 'Putar Ulang Panduan',
    settings_feedback: 'Kritik & Saran',
    settings_feedback_btn: 'Kirim Masukan',
    settings_about: 'Tentang HighlanderStay',
    settings_version: 'Versi Aplikasi',
    settings_privacy: 'Kebijakan Privasi',
    settings_close: 'Tutup',

    // Feedback
    fb_title: 'Kirim Masukan & Saran',
    fb_desc: 'Bantu kami meningkatkan kualitas layanan aplikasi Highlanderstay.',
    fb_category: 'Kategori Masukan',
    fb_cat_general: 'Saran Umum',
    fb_cat_bug: 'Laporkan Kendala / Bug',
    fb_cat_feature: 'Permintaan Fitur Baru',
    fb_rating: 'Bagaimana pengalaman Anda?',
    fb_placeholder: 'Tuliskan saran, kritik, atau kendala yang Anda temukan di sini...',
    fb_submit: 'Kirimkan Masukan',
    fb_submitting: 'Mengirim...',
    fb_success: 'Terima kasih atas masukan Anda! Kami akan terus meningkatkan kualitas aplikasi.',
    fb_empty_warn: 'Silakan isi pesan masukan Anda terlebih dahulu.',
  },
  en: {
    // Nav
    nav_home: 'Home',
    nav_rooms: 'Rooms',
    nav_map: 'Location Map',
    nav_facilities: 'Facilities',
    nav_resort: 'Resort',
    nav_cart: 'Cart',
    nav_profile: 'My Account',
    nav_login: 'Sign In / Register',
    nav_logout: 'Sign Out',
    nav_settings: 'Settings',

    // Walkthrough
    wt_title_1: 'Discover Ideal Co-Living & Kos',
    wt_desc_1: 'Find curated premium boarding rooms and modern apartments with interactive maps, pricing filters, and 360° virtual tours.',
    wt_title_2: 'Instant & Secure Booking',
    wt_desc_2: 'Book rooms effortlessly with seamless payment gateway checkout. Your active lease is confirmed instantly.',
    wt_title_3: 'All-in-One Tenant Portal',
    wt_desc_3: 'Manage monthly rent invoices, download receipts, report facility maintenance issues, and manage emergency contacts.',
    wt_skip: 'Skip',
    wt_next: 'Next',
    wt_start: 'Get Started',

    // Settings
    settings_title: 'App Settings',
    settings_desc: 'Personalize your display, language, and notification preferences.',
    settings_theme: 'Display Theme',
    settings_theme_dark: 'Dark Mode',
    settings_theme_light: 'Light Mode',
    settings_theme_system: 'System Default',
    settings_language: 'App Language',
    settings_lang_id: 'Bahasa Indonesia',
    settings_lang_en: 'English (US)',
    settings_notifications: 'Notifications & Reminders',
    settings_notif_desc: 'Receive due-date reminders and maintenance updates.',
    settings_walkthrough: 'App Feature Guide',
    settings_walkthrough_btn: 'Replay Walkthrough',
    settings_feedback: 'Feedback & Suggestions',
    settings_feedback_btn: 'Send Feedback',
    settings_about: 'About HighlanderStay',
    settings_version: 'App Version',
    settings_privacy: 'Privacy Policy',
    settings_close: 'Close',

    // Feedback
    fb_title: 'Send Feedback & Suggestions',
    fb_desc: 'Help us improve the quality and experience of Highlanderstay.',
    fb_category: 'Feedback Category',
    fb_cat_general: 'General Suggestion',
    fb_cat_bug: 'Report a Bug / Issue',
    fb_cat_feature: 'Feature Request',
    fb_rating: 'How would you rate your experience?',
    fb_placeholder: 'Write your thoughts, suggestions, or issues here...',
    fb_submit: 'Submit Feedback',
    fb_submitting: 'Submitting...',
    fb_success: 'Thank you for your feedback! We will continue improving our app.',
    fb_empty_warn: 'Please enter your feedback message first.',
  }
};

export function getStoredLanguage(): AppLanguage {
  try {
    const saved = localStorage.getItem(LANG_KEY) as AppLanguage | null;
    if (saved === 'id' || saved === 'en') {
      return saved;
    }
  } catch {}
  return 'id'; // Default Indonesian, can toggle to English
}

export function setLanguage(lang: AppLanguage): void {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {}
  window.dispatchEvent(new CustomEvent('hs-language-changed', { detail: { lang } }));
}

export function useI18n() {
  const [lang, setLangState] = useState<AppLanguage>(getStoredLanguage);

  useEffect(() => {
    const handleLangChange = (e: any) => {
      if (e?.detail?.lang) {
        setLangState(e.detail.lang);
      } else {
        setLangState(getStoredLanguage());
      }
    };
    window.addEventListener('hs-language-changed', handleLangChange);
    return () => window.removeEventListener('hs-language-changed', handleLangChange);
  }, []);

  const changeLanguage = (newLang: AppLanguage) => {
    setLanguage(newLang);
    setLangState(newLang);
  };

  const t = (key: keyof typeof translations.id): string => {
    return translations[lang]?.[key] || translations.id[key] || String(key);
  };

  return {
    lang,
    changeLanguage,
    t
  };
}

