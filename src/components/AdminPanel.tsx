import React, { useState, useEffect } from 'react';
import { 
  fetchTenantBookings,
  fetchTenantInfo,
  updateBookingStatus,
  fetchSettings,
  fetchComplaints,
  createComplaint
} from '../api';
import type { Booking, UserSession, TenantInfo, Complaint } from '../api';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Printer, 
  User, 
  Calendar, 
  HelpCircle, 
  MessageSquare, 
  LogOut, 
  ShieldCheck, 
  Smartphone,
  AlertTriangle,
  Send,
  Plus,
  ClipboardList
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  // SEO optimization (Private dashboard)
  useSEO({
    title: 'Tenant Portal | Highlanderstay',
    description: 'Manage your co-living tenancy, transit bookings, billing history, and file maintenance complaints.',
    noindex: true
  });

  // Session
  const [session, setSession] = useState<UserSession | null>(() => {
    const raw = localStorage.getItem('userSession');
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });

  // State
  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeMobileTab, setActiveMobileTab] = useState<'reservations' | 'complaints' | 'profile' | 'support'>('reservations');
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);

  // New Complaint Form State
  const [complaintTitle, setComplaintTitle] = useState('');
  const [complaintDescription, setComplaintDescription] = useState('');
  const [showComplaintForm, setShowComplaintForm] = useState(false);
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Settings for branding
  const [logoText, setLogoText] = useState('HS');
  const [logoImage, setLogoImage] = useState('');
  const [logoStartColor, setLogoStartColor] = useState('#89AACC');
  const [logoEndColor, setLogoEndColor] = useState('#4E85BF');
  const [whatsappNumber, setWhatsappNumber] = useState('628123456789');

  // Redirect if not logged in
  useEffect(() => {
    if (!session) {
      navigate('/');
      return;
    }
    if (session.role !== 'tenant') {
      alert('Akses ditolak. Halaman ini hanya untuk penyewa.');
      localStorage.removeItem('user_session');
      navigate('/');
    }
  }, [session, navigate]);

  // Fetch tenant data
  useEffect(() => {
    if (!session || session.role !== 'tenant') return;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch details
        const info = await fetchTenantInfo(session.id);
        setTenantInfo(info);

        // Fetch bookings
        const bList = await fetchTenantBookings(session.id);
        setBookings(bList);

        // Fetch complaints
        const cList = await fetchComplaints(session.id);
        setComplaints(cList);

        // Fetch settings
        const settings = await fetchSettings();
        if (settings.logo_text) setLogoText(settings.logo_text);
        if (settings.logo_image) setLogoImage(settings.logo_image);
        if (settings.logo_gradient_start) setLogoStartColor(settings.logo_gradient_start);
        if (settings.logo_gradient_end) setLogoEndColor(settings.logo_gradient_end);
        if (settings.whatsapp_number) setWhatsappNumber(settings.whatsapp_number);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Gagal memuat data penyewa.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [session]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setSession(null);
    navigate('/');
  };

  const handleCheckoutTransit = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin melakukan checkout untuk pemesanan ini?')) return;
    try {
      await updateBookingStatus(id, 'checked_out', session?.id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'checked_out' } : b));
      alert('Checkout berhasil! Terima kasih.');
    } catch (err) {
      console.error(err);
      alert('Gagal melakukan checkout.');
    }
  };

  const handleSubmitComplaint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    if (!complaintTitle || !complaintDescription) {
      alert('Subjek dan deskripsi komplain wajib diisi.');
      return;
    }

    try {
      setSubmittingComplaint(true);
      const newComplaint = await createComplaint(session.id, complaintTitle, complaintDescription);
      setComplaints(prev => [newComplaint, ...prev]);
      setComplaintTitle('');
      setComplaintDescription('');
      setShowComplaintForm(false);
      alert('Laporan komplain berhasil dikirim. Staf kami akan segera menanganinya.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Gagal mengirim laporan komplain.');
    } finally {
      setSubmittingComplaint(false);
    }
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'Rp. 0';
    return `Rp. ${val.toLocaleString('id-ID')}`;
  };

  const formatTransitDateTime = (startStr?: string, endStr?: string) => {
    if (!startStr || !endStr) return '-';
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const dateOption: Intl.DateTimeFormatOptions = { dateStyle: 'medium' };
      const timeOption: Intl.DateTimeFormatOptions = { timeStyle: 'short' };
      return `${start.toLocaleDateString(undefined, dateOption)} (${start.toLocaleTimeString(undefined, timeOption)} - ${end.toLocaleTimeString(undefined, timeOption)})`;
    } catch {
      return `${startStr} - ${endStr}`;
    }
  };

  const getBookingAmount = (booking: Booking) => {
    if (booking.bookingType === 'transit') {
      if (booking.transitStartTime && booking.transitEndTime && booking.hourlyRate) {
        const start = new Date(booking.transitStartTime);
        const end = new Date(booking.transitEndTime);
        const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
        return Math.max(1, hours) * booking.hourlyRate;
      }
      return 0;
    } else {
      return booking.monthlyRent || 0;
    }
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col font-sans select-none antialiased">
      {/* Mobile Frame Container */}
      <div className="w-full max-w-md mx-auto min-h-screen bg-bg border-x border-stroke/20 shadow-2xl flex flex-col relative pb-[72px]">
        
        {/* Top Header */}
        <header className="border-b border-stroke/30 bg-surface/50 backdrop-blur-md px-5 py-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center border border-white/10 bg-surface shadow-inner">
              {logoImage ? (
                <img 
                  src={logoImage.startsWith('/') ? logoImage : `/${logoImage}`} 
                  alt="Logo" 
                  className="w-full h-full object-contain p-1"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/favicon.svg';
                  }}
                />
              ) : (
                <div 
                  className="w-full h-full flex items-center justify-center font-bold text-xs"
                  style={{
                    background: `linear-gradient(135deg, ${logoStartColor}, ${logoEndColor})`,
                    color: '#fff'
                  }}
                >
                  {logoText}
                </div>
              )}
            </div>
            <div className="text-left">
              <h1 className="text-sm font-bold tracking-wide leading-none text-text-primary">Highlanderstay</h1>
              <span className="text-[10px] text-muted">Tenant Mobile Hub</span>
            </div>
          </div>
          
          <button 
            onClick={handleLogout}
            className="p-2 rounded-full border border-stroke/50 bg-surface hover:bg-stroke/10 transition-colors"
            title="Keluar"
          >
            <LogOut className="w-4 h-4 text-rose-400" />
          </button>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 p-5 overflow-y-auto">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs p-4.5 rounded-2xl mb-5 text-left">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-muted">
              <Loader2 className="w-8 h-8 animate-spin text-text-primary mb-3" />
              <span className="text-xs uppercase tracking-widest font-semibold">Memuat Dasbor...</span>
            </div>
          ) : (
            <div className="animate-fade-in">
              {/* TAB 1: RESERVATIONS & BILLS */}
              {activeMobileTab === 'reservations' && (
                <div className="flex flex-col gap-5">
                  <div className="text-left">
                    <h2 className="text-xl font-bold font-display italic text-text-primary">Pemesanan & Tagihan</h2>
                    <p className="text-[11px] text-muted mt-1 leading-normal">
                      Detail jadwal sewa kamar aktif dan riwayat pembayaran Anda.
                    </p>
                  </div>

                  {bookings.length === 0 ? (
                    <div className="bg-surface/30 border border-stroke/50 rounded-2xl py-12 px-6 text-center text-muted text-xs uppercase tracking-widest font-semibold flex flex-col items-center gap-3">
                      <Smartphone className="w-8 h-8 opacity-40 text-muted" />
                      <span>Belum ada pemesanan</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {bookings.map((booking) => (
                        <div 
                          key={booking.id}
                          className="bg-surface/30 border border-stroke/50 rounded-2xl p-5 text-left flex flex-col gap-3.5 shadow-md hover:border-white/10 transition-all"
                        >
                          <div>
                            <span className="text-[9px] uppercase font-bold tracking-widest bg-white/5 border border-stroke/40 px-2 py-0.5 rounded text-muted">
                              {booking.bookingType === 'transit' ? 'Hourly Transit' : 'Sewa Bulanan'}
                            </span>
                            <h4 className="text-base font-bold text-text-primary mt-2">{booking.propertyName}</h4>
                          </div>

                          <div className="border-t border-stroke/30 pt-3 flex flex-col gap-1.5 text-xs text-muted">
                            {booking.bookingType === 'transit' ? (
                              <div>
                                <span className="font-medium text-text-secondary">Jadwal Transit:</span>
                                <p className="text-text-primary font-semibold mt-0.5">
                                  {formatTransitDateTime(booking.transitStartTime, booking.transitEndTime)}
                                </p>
                              </div>
                            ) : (
                              <div>
                                <span className="font-medium text-text-secondary">Tanggal Masuk:</span>
                                <p className="text-text-primary font-semibold mt-0.5">{booking.moveInDate}</p>
                              </div>
                            )}

                            <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-stroke/10">
                              <div>
                                <span className="text-[10px] text-muted uppercase">Total Biaya</span>
                                <p className="text-emerald-400 font-bold text-sm">
                                  {formatCurrency(getBookingAmount(booking))}
                                </p>
                              </div>

                              <span className={`text-[9px] uppercase font-black tracking-wider px-2.5 py-1 rounded-full ${
                                booking.status === 'approved' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : booking.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : booking.status === 'checked_out' || booking.status === 'checked out' || booking.status === 'completed'
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {booking.status === 'checked_out' ? 'checked out' : booking.status}
                              </span>
                            </div>
                          </div>

                          {/* Mobile Actions block */}
                          <div className="flex justify-end gap-2 mt-1">
                            {booking.bookingType === 'transit' && booking.status === 'approved' && (
                              <button
                                onClick={() => handleCheckoutTransit(booking.id!)}
                                className="text-[11px] uppercase tracking-wider font-bold bg-blue-500 text-bg hover:bg-blue-400 px-4 py-2 rounded-xl transition-colors"
                              >
                                Checkout Kamar
                              </button>
                            )}
                            {booking.bookingType === 'transit' && (booking.status === 'checked_out' || booking.status === 'checked out') && (
                              <button
                                onClick={() => setSelectedInvoiceBooking(booking)}
                                className="text-[11px] uppercase tracking-wider font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5"
                              >
                                <Printer className="w-3.5 h-3.5" />
                                Invoice
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COMPLAINTS */}
              {activeMobileTab === 'complaints' && (
                <div className="flex flex-col gap-5 text-left">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-bold font-display italic text-text-primary">Laporan Komplain</h2>
                      <p className="text-[11px] text-muted mt-1 leading-normal">
                        Kirim dan pantau laporan kerusakan atau keluhan fasilitas kamar Anda.
                      </p>
                    </div>
                    {!showComplaintForm && (
                      <button
                        onClick={() => setShowComplaintForm(true)}
                        className="bg-text-primary text-bg hover:bg-text-primary/90 p-2.5 rounded-full transition-colors"
                        title="Buat Laporan"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {showComplaintForm && (
                    <form onSubmit={handleSubmitComplaint} className="bg-surface/40 border border-stroke rounded-2xl p-5 flex flex-col gap-4 animate-fade-in shadow-lg">
                      <h3 className="font-bold text-sm text-text-primary">Buat Laporan Baru</h3>
                      
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-muted uppercase tracking-wider font-medium">Subjek / Masalah</label>
                        <input
                          type="text"
                          required
                          value={complaintTitle}
                          onChange={(e) => setComplaintTitle(e.target.value)}
                          placeholder="Contoh: AC Bocor, Lampu kamar mandi mati"
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary placeholder:text-muted/50 focus:outline-none"
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] text-muted uppercase tracking-wider font-medium">Deskripsi Keluhan</label>
                        <textarea
                          required
                          rows={4}
                          value={complaintDescription}
                          onChange={(e) => setComplaintDescription(e.target.value)}
                          placeholder="Jelaskan detail masalah dan nomor kamar Anda..."
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary placeholder:text-muted/50 focus:outline-none resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 mt-1">
                        <button
                          type="button"
                          onClick={() => setShowComplaintForm(false)}
                          className="bg-transparent border border-stroke text-text-primary text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-stroke/10"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={submittingComplaint}
                          className="bg-emerald-500 text-bg text-xs font-semibold px-5 py-2.5 rounded-xl hover:bg-emerald-400 transition-colors flex items-center gap-1.5"
                        >
                          {submittingComplaint ? 'Mengirim...' : (
                            <>
                              <Send className="w-3.5 h-3.5" /> Kirim
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {complaints.length === 0 ? (
                    <div className="bg-surface/30 border border-stroke/50 rounded-2xl py-12 px-6 text-center text-muted text-xs uppercase tracking-widest font-semibold flex flex-col items-center gap-3">
                      <ClipboardList className="w-8 h-8 opacity-40 text-muted" />
                      <span>Belum ada riwayat komplain</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {complaints.map((c) => (
                        <div 
                          key={c.id}
                          className="bg-surface/30 border border-stroke/50 rounded-2xl p-5 text-left flex flex-col gap-3 shadow-md"
                        >
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm text-text-primary leading-snug">{c.title}</h4>
                            <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                              c.status === 'resolved' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : c.status === 'in_progress'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {c.status === 'resolved' ? 'selesai' : c.status === 'in_progress' ? 'diproses' : 'menunggu'}
                            </span>
                          </div>

                          <p className="text-xs text-muted leading-relaxed whitespace-pre-wrap mt-1">{c.description}</p>
                          
                          <span className="text-[9px] text-muted/60 mt-2 block">
                            Dilaporkan pada: {c.created_at ? new Date(c.created_at).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: PROFILE */}
              {activeMobileTab === 'profile' && (
                <div className="flex flex-col gap-5 text-left">
                  <div>
                    <h2 className="text-xl font-bold font-display italic text-text-primary">Profil Penyewa</h2>
                    <p className="text-[11px] text-muted mt-1 leading-normal">
                      Detail kartu identitas dan informasi akun keanggotaan aktif Anda.
                    </p>
                  </div>

                  <div className="bg-surface/30 border border-stroke/50 rounded-2xl p-5 flex flex-col gap-4 shadow-md">
                    <div className="flex items-center gap-3.5 pb-4 border-b border-stroke/30">
                      <div className="w-12 h-12 rounded-full bg-stroke/20 flex items-center justify-center border border-white/5">
                        <User className="w-6 h-6 text-text-primary" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base text-text-primary">{tenantInfo?.name || session?.name}</h4>
                        <span className="text-[10px] text-emerald-400 uppercase tracking-widest font-black flex items-center gap-1 mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5" /> Member Aktif
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 text-xs">
                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-muted block mb-0.5">Alamat Email</span>
                        <span className="font-semibold text-text-primary">{tenantInfo?.email || '-'}</span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-muted block mb-0.5">Nomor WhatsApp</span>
                        <span className="font-semibold text-text-primary">{tenantInfo?.phone || '-'}</span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-muted block mb-0.5">No. KTP / Passport</span>
                        <span className="font-semibold text-text-primary">{tenantInfo?.id_card_number || 'Belum Diverifikasi'}</span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-muted block mb-0.5">Alamat Lengkap</span>
                        <span className="font-semibold text-text-primary leading-normal whitespace-pre-wrap">{tenantInfo?.address || 'Belum Diverifikasi'}</span>
                      </div>

                      <div>
                        <span className="text-[9px] uppercase tracking-widest text-muted block mb-0.5">Kontak Darurat</span>
                        <span className="font-semibold text-text-primary">
                          {tenantInfo?.emergency_contact ? `${tenantInfo.emergency_contact} (${tenantInfo.emergency_phone || '-'})` : 'Belum Diverifikasi'}
                        </span>
                      </div>
                      
                      <div className="pt-2 border-t border-stroke/20">
                        <span className="text-[9px] uppercase tracking-widest text-muted block mb-0.5">Terdaftar Sejak</span>
                        <span className="text-muted">
                          {tenantInfo?.created_at ? new Date(tenantInfo.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: SUPPORT */}
              {activeMobileTab === 'support' && (
                <div className="flex flex-col gap-5 text-left">
                  <div>
                    <h2 className="text-xl font-bold font-display italic text-text-primary">Pusat Bantuan</h2>
                    <p className="text-[11px] text-muted mt-1 leading-normal">
                      Butuh bantuan operasional? Hubungi admin properti secara instan.
                    </p>
                  </div>

                  {/* Quick Action buttons */}
                  <div className="flex flex-col gap-3">
                    <a
                      href={`https://wa.me/${whatsappNumber}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-500 text-bg font-bold text-xs uppercase tracking-wider py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-400 transition-colors shadow-md text-center"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Hubungi CS via WhatsApp
                    </a>
                  </div>

                  {/* FAQ Card */}
                  <div className="bg-surface/30 border border-stroke/50 rounded-2xl p-5 shadow-md flex flex-col gap-3.5">
                    <h3 className="font-bold text-xs uppercase tracking-wider text-text-primary flex items-center gap-1.5 pb-2 border-b border-stroke/30">
                      <HelpCircle className="w-4 h-4 text-muted" /> Pertanyaan Umum
                    </h3>

                    <div className="flex flex-col gap-3 text-xs leading-normal">
                      <div>
                        <h4 className="font-bold text-text-primary">Bagaimana cara checkout kamar transit?</h4>
                        <p className="text-muted mt-1">
                          Masuk ke menu **Pemesanan**, temukan kartu pemesanan transit Anda yang aktif, lalu tekan tombol **Checkout Kamar**.
                        </p>
                      </div>

                      <div className="border-t border-stroke/10 pt-3">
                        <h4 className="font-bold text-text-primary">Dimana saya bisa melihat struk sewa?</h4>
                        <p className="text-muted mt-1">
                          Setelah Anda melakukan checkout, tombol **Invoice** akan muncul di kartu pemesanan Anda. Anda dapat menekan tombol tersebut untuk melihat dan mencetak invoice.
                        </p>
                      </div>

                      <div className="border-t border-stroke/10 pt-3">
                        <h4 className="font-bold text-text-primary">Bagaimana jika ada kerusakan fasilitas?</h4>
                        <p className="text-muted mt-1">
                          Buka menu **Komplain**, tekan tombol tambah (+), lalu tuliskan subjek kerusakan beserta detailnya untuk langsung ditindaklanjuti oleh teknisi kami.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>

        {/* Fixed Bottom Mobile Navigation Bar */}
        <footer className="absolute bottom-0 left-0 right-0 z-50 bg-surface/85 backdrop-blur-lg border-t border-stroke/30 py-3 px-3 flex justify-around items-center shadow-lg">
          <button 
            onClick={() => setActiveMobileTab('reservations')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeMobileTab === 'reservations' ? 'text-text-primary scale-105 font-bold' : 'text-muted'
            }`}
          >
            <Calendar className={`w-5 h-5 ${activeMobileTab === 'reservations' ? 'text-text-primary' : 'text-muted'}`} />
            <span className="text-[9px] uppercase tracking-wider">Tagihan</span>
          </button>

          <button 
            onClick={() => setActiveMobileTab('complaints')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeMobileTab === 'complaints' ? 'text-text-primary scale-105 font-bold' : 'text-muted'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 ${activeMobileTab === 'complaints' ? 'text-text-primary' : 'text-muted'}`} />
            <span className="text-[9px] uppercase tracking-wider">Komplain</span>
          </button>
          
          <button 
            onClick={() => setActiveMobileTab('profile')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeMobileTab === 'profile' ? 'text-text-primary scale-105 font-bold' : 'text-muted'
            }`}
          >
            <User className={`w-5 h-5 ${activeMobileTab === 'profile' ? 'text-text-primary' : 'text-muted'}`} />
            <span className="text-[9px] uppercase tracking-wider">Profil</span>
          </button>

          <button 
            onClick={() => setActiveMobileTab('support')}
            className={`flex flex-col items-center gap-1 transition-all duration-300 ${
              activeMobileTab === 'support' ? 'text-text-primary scale-105 font-bold' : 'text-muted'
            }`}
          >
            <HelpCircle className={`w-5 h-5 ${activeMobileTab === 'support' ? 'text-text-primary' : 'text-muted'}`} />
            <span className="text-[9px] uppercase tracking-wider">Bantuan</span>
          </button>
        </footer>

        {/* INVOICE PRINT MODAL */}
        {selectedInvoiceBooking && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
            <style>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #invoice-print-area, #invoice-print-area * {
                  visibility: visible !important;
                }
                #invoice-print-area {
                  position: absolute !important;
                  left: 0 !important;
                  top: 0 !important;
                  width: 100% !important;
                  background: white !important;
                  color: black !important;
                  padding: 24px !important;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>
            <div id="invoice-print-area" className="bg-surface border border-stroke/50 rounded-3xl p-6 w-full max-w-sm shadow-2xl relative overflow-y-auto max-h-[85vh] text-left text-xs">
              
              {/* Invoice Logo & Branding */}
              <div className="flex justify-between items-start border-b border-stroke/30 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs"
                    style={{
                      background: `linear-gradient(135deg, ${logoStartColor}, ${logoEndColor})`,
                      color: '#fff'
                    }}
                  >
                    {logoText}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold uppercase tracking-wider text-text-primary">Highlander Stay</h2>
                    <p className="text-[9px] text-muted">Premium Accommodations</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="border border-emerald-500 text-emerald-500 uppercase font-black text-[8px] px-1.5 py-0.5 rounded rotate-[-6deg] inline-block shadow-sm">
                    PAID
                  </div>
                  <p className="text-[8px] text-muted mt-1">#INV-{selectedInvoiceBooking.id}</p>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="flex flex-col gap-3 border-b border-stroke/30 pb-4 mb-4">
                <div>
                  <span className="text-[8px] text-muted uppercase tracking-widest block font-bold">Penyewa</span>
                  <p className="font-semibold text-text-primary mt-0.5">{selectedInvoiceBooking.userName}</p>
                  <p className="text-muted mt-0.5 text-[10px]">{selectedInvoiceBooking.userEmail}</p>
                </div>

                <div>
                  <span className="text-[8px] text-muted uppercase tracking-widest block font-bold">Kamar & Jadwal</span>
                  <p className="font-semibold text-text-primary mt-0.5">{selectedInvoiceBooking.propertyName}</p>
                  <p className="text-muted mt-0.5 text-[10px]">
                    Masuk: {selectedInvoiceBooking.transitStartTime ? new Date(selectedInvoiceBooking.transitStartTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                  </p>
                  <p className="text-muted mt-0.5 text-[10px]">
                    Keluar: {selectedInvoiceBooking.transitEndTime ? new Date(selectedInvoiceBooking.transitEndTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                  </p>
                </div>
              </div>

              {/* Calculation Summary */}
              <div className="flex flex-col gap-2.5 mb-5 border-b border-stroke/20 pb-4">
                <div className="flex justify-between text-muted text-[10px]">
                  <span>Biaya Sewa Kamar:</span>
                  <span className="text-text-primary font-medium">{formatCurrency(getBookingAmount(selectedInvoiceBooking))}</span>
                </div>
                <div className="flex justify-between text-text-primary font-bold text-sm">
                  <span>Total Terbayar:</span>
                  <span className="text-emerald-400">{formatCurrency(getBookingAmount(selectedInvoiceBooking))}</span>
                </div>
              </div>

              {/* Footer Notes */}
              <div className="text-[9px] text-muted leading-relaxed mb-6">
                <p>Terima kasih telah menyewa di Highlander Stay! Ini adalah struk bukti pembayaran resmi dari sistem.</p>
              </div>

              {/* Controls */}
              <div className="flex justify-end gap-2 no-print">
                <button
                  onClick={() => window.print()}
                  className="bg-emerald-500 text-bg hover:bg-emerald-400 font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <Printer className="w-3 h-3" />
                  Cetak
                </button>
                <button
                  onClick={() => setSelectedInvoiceBooking(null)}
                  className="bg-surface hover:bg-stroke/20 text-text-primary font-bold text-[10px] uppercase tracking-wider py-2 px-4 rounded-xl border border-stroke transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
