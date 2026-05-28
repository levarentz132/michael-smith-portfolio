import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBooking, fetchSettings } from '../api';
import type { Property, UserSession, Booking } from '../api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, property }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [bookingType, setBookingType] = useState<'monthly' | 'transit'>('monthly');
  const [date, setDate] = useState(''); // Target Move-in Date or Transit Date
  const [transitStartTime, setTransitStartTime] = useState('');
  const [transitDuration, setTransitDuration] = useState<number>(3);
  const [session, setSession] = useState<UserSession | null>(null);

  const hasTransitSupport = !!(property?.transit3h || property?.transit6h || property?.transit12h);

  // New fields for monthly bookings
  const [surveyDate, setSurveyDate] = useState('');
  const [surveyTime, setSurveyTime] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('628123456789');

  useEffect(() => {
    const loadWa = async () => {
      try {
        const s = await fetchSettings();
        if (s && s.whatsapp_number) {
          setWhatsappNumber(s.whatsapp_number);
        }
      } catch (err) {
        console.error('Failed to load whatsapp number in BookingModal', err);
      }
    };
    loadWa();
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        // Default reset
        setBookingType('monthly');
        setDate('');
        setTransitStartTime('');
        setTransitDuration(property?.minTransitHours || 3);
        setSurveyDate('');
        setSurveyTime('');

        // Load session
        const savedSession = localStorage.getItem('userSession');
        if (savedSession) {
          try {
            const parsed = JSON.parse(savedSession);
            if (parsed && parsed.role === 'tenant') {
              setSession(parsed);
              setName(parsed.name || '');
              setEmail(parsed.email || '');
              setPhone(parsed.phone || '');
            } else {
              setSession(null);
              setName('');
              setEmail('');
              setPhone('');
            }
          } catch {
            setSession(null);
          }
        } else {
          setSession(null);
          setName('');
          setEmail('');
          setPhone('');
        }
      }, 0);
    }
  }, [isOpen, property]);



  const getTransitSummary = () => {
    if (!transitStartTime || !transitDuration || !property) return null;
    
    let estimatedCost = 0;
    if (transitDuration === 3 && property.transit3h) {
      estimatedCost = property.transit3h;
    } else if (transitDuration === 6 && property.transit6h) {
      estimatedCost = property.transit6h;
    } else if (transitDuration === 12 && property.transit12h) {
      estimatedCost = property.transit12h;
    } else {
      return { error: 'Silakan pilih paket transit yang valid (3, 6, atau 12 jam).' };
    }
    
    return {
      hours: transitDuration,
      estimatedCost,
      formattedCost: `Rp ${estimatedCost.toLocaleString('id-ID')}`
    };
  };

  const getTransitEndTimeString = () => {
    if (!date || !transitStartTime || !transitDuration) return '';
    try {
      const [yr, mo, dy] = date.split('-').map(Number);
      const [hr, mn] = transitStartTime.split(':').map(Number);
      const startDateObj = new Date(yr, mo - 1, dy, hr, mn, 0);
      if (isNaN(startDateObj.getTime())) return '';
      
      const endDateObj = new Date(startDateObj.getTime() + transitDuration * 60 * 60 * 1000);
      
      const options: Intl.DateTimeFormatOptions = { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false
      };
      return endDateObj.toLocaleDateString('id-ID', options);
    } catch {
      return '';
    }
  };

  const summary = bookingType === 'transit' ? getTransitSummary() : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !date) {
      setError('Mohon isi semua kolom.');
      return;
    }
    
    if (bookingType === 'transit') {
      if (!transitStartTime || !transitDuration) {
        setError('Mohon tentukan waktu mulai dan durasi transit.');
        return;
      }
      const sum = getTransitSummary();
      if (sum && 'error' in sum) {
        setError(sum.error || 'Detail transit tidak valid.');
        return;
      }
    } else {
      if (!surveyDate || !surveyTime) {
        setError('Mohon tentukan tanggal dan waktu rencana survei.');
        return;
      }
    }
    
    setError('');
    setIsSubmitting(true);

    try {
      const payload: Omit<Booking, 'id' | 'status'> & { phone: string } & { surveyDate?: string; surveyTime?: string } = {
        propertyName: property?.title || '',
        userName: name,
        userEmail: email,
        phone,
        bookingType,
        moveInDate: date,
      };

      if (session) {
        payload.tenantId = session.id;
      }

      if (bookingType === 'transit') {
        payload.transitDate = date;
        payload.transitStartTime = transitStartTime;
        payload.duration = transitDuration;
      } else {
        payload.surveyDate = surveyDate;
        payload.surveyTime = surveyTime;
      }

      await createBooking(payload as any);
      setIsSuccess(true);

      if (bookingType === 'monthly') {
        const waMessage = encodeURIComponent(
          `Halo Admin Highlanderstay, saya baru saja mengajukan sewa Bulanan.\n\n` +
          `Detail Pemesanan:\n` +
          `- Properti: ${propertyName}\n` +
          `- Nama: ${name}\n` +
          `- Email: ${email}\n` +
          `- Telepon: ${phone}\n` +
          `- Rencana Masuk: ${date}\n` +
          `- Rencana Survei: ${surveyDate} pukul ${surveyTime}`
        );
        const waUrl = `https://wa.me/${whatsappNumber}?text=${waMessage}`;
        window.open(waUrl, '_blank');
      }
      setTimeout(() => {
        setIsSuccess(false);
        if (!session) {
          setName('');
          setEmail('');
          setPhone('');
        }
        setDate('');
        setTransitStartTime('');
        setTransitDuration(property?.minTransitHours || 3);
        setSurveyDate('');
        setSurveyTime('');
        onClose();
      }, 2000);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal mengirim pemesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const propertyName = property?.title || 'Space';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
          />

          {/* Modal Container (Scrollable) */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl text-left"
          >
            {/* Top Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl transition-colors duration-200"
            >
              ✕
            </button>

            {/* Halftone Overlay */}
            <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
                  <span className="text-2xl text-emerald-400">✓</span>
                </div>
                <h3 className="text-xl font-display font-medium text-text-primary mb-2">Pemesanan Terkirim!</h3>
                <p className="text-xs text-muted max-w-xs leading-relaxed">
                  Kami telah menerima permintaan reservasi/survei Anda untuk <strong>{propertyName}</strong>. Tim kami akan menghubungi Anda secepatnya.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5 relative z-10">
                <div className="text-left border-b border-stroke/40 pb-4">
                  <span className="text-[10px] text-muted uppercase tracking-[0.25em] font-semibold">Reservasi Ruang</span>
                  <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-1">
                    Pesan {propertyName}
                  </h3>
                </div>

                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-xl">
                    {error}
                  </div>
                )}

                {/* Booking Type Selector Tabs (Only show if transit is supported) */}
                {hasTransitSupport ? (
                  <div className="grid grid-cols-2 bg-bg border border-stroke p-1 rounded-full">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingType('monthly');
                        setError('');
                      }}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2.5 transition-all duration-300 ${
                        bookingType === 'monthly' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Sewa Bulanan
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setBookingType('transit');
                        setError('');
                      }}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2.5 transition-all duration-300 ${
                        bookingType === 'transit' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Transit
                    </button>
                  </div>
                ) : null}

                {/* Shared User Identity Section */}
                {session ? (
                  <div className="bg-bg/40 border border-stroke rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden backdrop-blur-md">
                    <div className="absolute top-0 right-0 bg-text-primary/10 px-2 py-0.5 rounded-bl-xl border-l border-b border-stroke/50">
                      <span className="text-[8px] text-text-primary font-bold uppercase tracking-wider">Masuk</span>
                    </div>
                    <span className="text-[9px] text-muted uppercase tracking-wider font-semibold">Akun Penyewa</span>
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Nama</span>
                        <span className="text-text-primary font-medium">{session.name}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Email</span>
                        <span className="text-text-primary font-medium">{session.email}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted">Telepon</span>
                        <span className="text-text-primary font-medium">{session.phone}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Input Name */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Nama Anda *</label>
                      <input 
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Masukkan nama Anda"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Input Email */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Alamat Email *</label>
                      <input 
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="anda@contoh.com"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Input Phone */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Nomor Telepon *</label>
                      <input 
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="cth. 081287681714"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>
                  </>
                )}

                {/* Conditional Fields based on bookingType */}
                {bookingType === 'monthly' ? (
                  <>
                    {/* Target Move-in Date */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Tanggal Masuk Rencana *</label>
                      <input 
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Survey Date & Time */}
                    <div className="border-t border-stroke/40 pt-4 mt-2 flex flex-col gap-4">
                      <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-semibold">Jadwal Survei Lokasi</span>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium">Tanggal Survei *</label>
                          <input 
                            type="date"
                            required
                            value={surveyDate}
                            onChange={(e) => setSurveyDate(e.target.value)}
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
                          />
                        </div>
                        <div className="flex flex-col gap-2">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium">Waktu Survei *</label>
                          <input 
                            type="time"
                            required
                            value={surveyTime}
                            onChange={(e) => setSurveyTime(e.target.value)}
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Monthly pricing summary */}
                    <div className="bg-bg border border-stroke/70 rounded-2xl p-4 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between text-muted">
                        <span>Sewa Bulanan:</span>
                        {property?.promoPrice ? (
                          <div className="flex items-center gap-1.5 font-semibold text-text-primary">
                            <span className="animate-strike text-muted/50 text-[10px]">
                              Rp {Number(property.rawPrice).toLocaleString('id-ID')}
                            </span>
                            <span className="text-emerald-400 font-extrabold">
                              Rp {Number(property.promoPrice).toLocaleString('id-ID')}
                            </span>
                          </div>
                        ) : (
                          <span className="text-text-primary font-semibold">
                            Rp {(property?.rawPrice || 1500000).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                      <div className="flex justify-between text-muted">
                        <span>Deposit Keamanan:</span>
                        <span className="text-text-primary font-semibold">
                          Rp {Number(property?.deposit || 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-stroke/40 pt-2 mt-1 text-sm font-bold text-text-primary">
                        <span>Est. Pembayaran Bulan Pertama:</span>
                        <span className="text-emerald-400">
                          Rp {((property?.promoPrice ? property.promoPrice : (property?.rawPrice || 1500000)) + Number(property?.deposit || 0)).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Transit target date & schedule */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Tanggal Transit *</label>
                      <input 
                        type="date"
                        required
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium">Waktu Mulai *</label>
                        <input 
                          type="time"
                          required
                          value={transitStartTime}
                          onChange={(e) => setTransitStartTime(e.target.value)}
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
                        />
                      </div>
                      <div className="flex flex-col gap-2 justify-end">
                        {/* Empty spacing helper */}
                      </div>
                    </div>

                    {/* Interactive Transit Package Selection Table */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium font-semibold">Pilih Paket Transit *</label>
                      <div className="overflow-hidden rounded-xl border border-stroke bg-bg/50">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="border-b border-stroke bg-white/5 text-muted font-medium">
                              <th className="py-2.5 px-3">Durasi</th>
                              <th className="py-2.5 px-3 text-right">Tarif</th>
                            </tr>
                          </thead>
                          <tbody>
                            {property?.transit3h ? (
                              <tr 
                                onClick={() => setTransitDuration(3)}
                                className={`border-b border-stroke last:border-0 cursor-pointer transition-colors ${
                                  transitDuration === 3 
                                    ? 'bg-text-primary/10 border-l-2 border-l-emerald-400 font-semibold' 
                                    : 'hover:bg-white/5'
                                }`}
                              >
                                <td className="py-3 px-3 text-text-primary flex items-center gap-2 select-none">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${transitDuration === 3 ? 'border-emerald-400' : 'border-stroke'}`}>
                                    {transitDuration === 3 && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                                  </div>
                                  3 Jam
                                </td>
                                <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                                  Rp {property.transit3h.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ) : null}
                            {property?.transit6h ? (
                              <tr 
                                onClick={() => setTransitDuration(6)}
                                className={`border-b border-stroke last:border-0 cursor-pointer transition-colors ${
                                  transitDuration === 6 
                                    ? 'bg-text-primary/10 border-l-2 border-l-emerald-400 font-semibold' 
                                    : 'hover:bg-white/5'
                                }`}
                              >
                                <td className="py-3 px-3 text-text-primary flex items-center gap-2 select-none">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${transitDuration === 6 ? 'border-emerald-400' : 'border-stroke'}`}>
                                    {transitDuration === 6 && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                                  </div>
                                  6 Jam
                                </td>
                                <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                                  Rp {property.transit6h.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ) : null}
                            {property?.transit12h ? (
                              <tr 
                                onClick={() => setTransitDuration(12)}
                                className={`border-b border-stroke last:border-0 cursor-pointer transition-colors ${
                                  transitDuration === 12 
                                    ? 'bg-text-primary/10 border-l-2 border-l-emerald-400 font-semibold' 
                                    : 'hover:bg-white/5'
                                }`}
                              >
                                <td className="py-3 px-3 text-text-primary flex items-center gap-2 select-none">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${transitDuration === 12 ? 'border-emerald-400' : 'border-stroke'}`}>
                                    {transitDuration === 12 && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                                  </div>
                                  12 Jam
                                </td>
                                <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                                  Rp {property.transit12h.toLocaleString('id-ID')}
                                </td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Transit cost summary */}
                    {summary && (
                      <div className="bg-bg border border-stroke/70 rounded-2xl p-4 flex flex-col gap-2 text-xs">
                        {summary.error ? (
                          <span className="text-rose-400 font-medium">{summary.error}</span>
                        ) : (
                          <>
                            <div className="flex justify-between text-muted">
                              <span>Paket Transit Terpilih:</span>
                              <span className="text-text-primary font-semibold">{summary.hours} Jam</span>
                            </div>
                            {getTransitEndTimeString() && (
                              <div className="flex justify-between text-muted">
                                <span>Berakhir Pada:</span>
                                <span className="text-text-primary font-semibold">{getTransitEndTimeString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between border-t border-stroke/40 pt-2 mt-1 text-sm font-bold text-text-primary">
                              <span>Total Tarif:</span>
                              <span className="text-emerald-400">{summary.formattedCost}</span>
                            </div>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting || !!(summary && 'error' in summary)}
                  className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                  {isSubmitting ? 'Mengirim...' : 'Kirim Pertanyaan Pemesanan'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
