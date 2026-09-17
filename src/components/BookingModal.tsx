import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBooking, addToCart, getOrCreateCartToken, fetchSettings, refreshCartCheckout, isValidCheckoutUrl } from '../api';
import type { Property, UserSession, Booking } from '../api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  initialRoomName?: string;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, property, initialRoomName }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(initialRoomName || '');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [bookingType, setBookingType] = useState<'monthly' | 'transit'>('monthly');
  const [date, setDate] = useState(''); // Move-in Date for monthly, or Transit Date
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [notes, setNotes] = useState('');
  const [transitStartTime, setTransitStartTime] = useState('');
  const [transitDuration, setTransitDuration] = useState<number>(3);
  const [session, setSession] = useState<UserSession | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  const hasTransitSupport = !!(property?.transit3h || property?.transit6h || property?.transit12h || property?.transit24h);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPayingCheckout, setIsPayingCheckout] = useState(false);
  const [error, setError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('628123456789');

  useEffect(() => {
    // Load Midtrans Snap JS dynamically for transit fallback
    const scriptUrl = 'https://app.sandbox.midtrans.com/snap/snap.js';
    const isLoaded = document.querySelector(`script[src="${scriptUrl}"]`);
    if (!isLoaded) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.setAttribute('data-client-key', 'SB-Mid-client-placeholder');
      document.body.appendChild(script);
    }
  }, []);

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
        setDurationMonths(1);
        setNotes('');
        setTransitStartTime('');
        setTransitDuration(property?.minTransitHours || 3);
        setCreatedOrder(null);
        setIsSuccess(false);
        setError('');

        // Room and Unit ID initialization
        if (initialRoomName && property?.availableRoomDetails && property.availableRoomDetails.length > 0) {
          const cleanName = initialRoomName.replace(/^Kamar\s+/i, '').trim().toLowerCase();
          const match = property.availableRoomDetails.find(r => r.name.toLowerCase() === cleanName);
          if (match) {
            setSelectedRoom(`Kamar ${match.name}`);
            setSelectedUnitId(match.id);
          } else {
            setSelectedRoom(initialRoomName);
            setSelectedUnitId(property.availableRoomDetails[0].id);
          }
        } else if (property?.availableRoomDetails && property.availableRoomDetails.length > 0) {
          const first = property.availableRoomDetails[0];
          setSelectedRoom(`Kamar ${first.name}`);
          setSelectedUnitId(first.id);
        } else {
          setSelectedRoom(initialRoomName || '');
          setSelectedUnitId(null);
        }

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
  }, [isOpen, property, initialRoomName]);

  // Selected room details & pricing calculations
  const selectedRoomDetail = property?.availableRoomDetails?.find(r => 
    (selectedUnitId && r.id === selectedUnitId) || 
    (selectedRoom && r.name.toLowerCase() === selectedRoom.replace(/^Kamar\s+/i, '').trim().toLowerCase())
  );

  const effectiveMonthlyRate = selectedRoomDetail?.monthly_rate || 
    (property?.promoPrice ? property.promoPrice : (property?.rawPrice || 1500000));

  const totalRent = effectiveMonthlyRate * durationMonths;
  const deposit = Number(property?.deposit || 0);
  const totalInitialPayment = totalRent + deposit;

  const handleRoomSelect = (roomVal: string) => {
    setSelectedRoom(roomVal);
    if (property?.availableRoomDetails) {
      const clean = roomVal.replace(/^Kamar\s+/i, '').trim().toLowerCase();
      const match = property.availableRoomDetails.find(r => r.name.toLowerCase() === clean);
      if (match) {
        setSelectedUnitId(match.id);
        return;
      }
    }
    setSelectedUnitId(null);
  };

  const getTransitSummary = () => {
    if (!transitStartTime || !transitDuration || !property) return null;
    
    let estimatedCost = 0;
    if (transitDuration === 3 && property.transit3h) {
      estimatedCost = property.transit3h;
    } else if (transitDuration === 6 && property.transit6h) {
      estimatedCost = property.transit6h;
    } else if (transitDuration === 12 && property.transit12h) {
      estimatedCost = property.transit12h;
    } else if (transitDuration === 24 && property.transit24h) {
      estimatedCost = property.transit24h;
    } else {
      return { error: 'Silakan pilih paket transit yang valid (3, 6, 12, atau 24 jam).' };
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
    if (!name.trim() || !phone.trim() || !date) {
      setError('Mohon lengkapi nama, nomor WhatsApp, dan tanggal mulai sewa.');
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
    }
    
    setError('');
    setIsSubmitting(true);

    // --- ALUR SEWA BULANAN (CART-FIRST BOOKING & DOKU CHECKOUT) ---
    if (bookingType === 'monthly') {
      try {
        // Resolve unit_id from selected room or available rooms list
        let resolvedUnitId = selectedUnitId;
        if (!resolvedUnitId && property?.availableRoomDetails && property.availableRoomDetails.length > 0) {
          if (selectedRoom) {
            const clean = selectedRoom.replace(/^Kamar\s+/i, '').trim().toLowerCase();
            const match = property.availableRoomDetails.find(r => r.name.toLowerCase() === clean);
            if (match) resolvedUnitId = match.id;
          }
          if (!resolvedUnitId) {
            resolvedUnitId = property.availableRoomDetails[0].id;
          }
        }

        if (!resolvedUnitId) {
          throw new Error('Mohon pilih salah satu kamar yang tersedia untuk melanjutkan penyewaan.');
        }

        // 1. Simpan kamar ke Keranjang Pemesanan OpenKos (Cart-First: kamar belum dikunci, lease_created: false)
        const cartToken = getOrCreateCartToken();
        const cartRes = await addToCart({
          unit_id: resolvedUnitId,
          name: name.trim(),
          phone: phone.trim(),
          email: email.trim() || undefined,
          start_date: date,
          duration_months: durationMonths,
          notes: notes.trim() || undefined
        }, cartToken);

        const orderData = cartRes.order;
        setCreatedOrder(orderData);

        // 2. Simpan data transaksi ke sessionStorage untuk verifikasi saat kembali dari DOKU
        sessionStorage.setItem('pending_doku_checkout', JSON.stringify({
          order_id: orderData.id,
          booking_reference: orderData.reference,
          amount: orderData.amount,
          property_name: orderData.property?.name,
          unit_name: orderData.unit?.name,
          cart_token: orderData.cart_token,
          created_at: Date.now()
        }));

        // Periksa apakah kamar bentrok atau sudah dibayar orang lain
        if (orderData.is_available === false || orderData.conflict_message) {
          setError(orderData.conflict_message || 'Kamar ini baru saja dipesan atau dibayar oleh orang lain. Silakan pilih unit kamar lain yang masih tersedia.');
          setIsSubmitting(false);
          return;
        }

        // 3. Sinkronisasi pencatatan internal database lokal (non-blocking)
        try {
          await createBooking({
            propertyName: property?.title || '',
            userName: name,
            userEmail: email || '',
            phone,
            bookingType: 'monthly',
            moveInDate: date,
            notes: `Cart Order: ${orderData.reference} | Kamar: ${orderData.unit?.name || selectedRoom} | Durasi: ${durationMonths} Bulan`,
            tenantId: session?.id
          });
        } catch (syncErr) {
          console.warn('Local booking sync note:', syncErr);
        }

        // 4. Dapatkan URL pembayaran DOKU Checkout (Jokul)
        let checkoutUrl = orderData.checkout_url;
        if (!checkoutUrl && orderData.id) {
          try {
            const freshCheckout = await refreshCartCheckout(orderData.id);
            if (freshCheckout?.checkout_url) {
              checkoutUrl = freshCheckout.checkout_url;
              orderData.checkout_url = freshCheckout.checkout_url;
              setCreatedOrder({ ...orderData });
            }
          } catch (freshErr) {
            console.warn('Fresh checkout URL lookup note:', freshErr);
          }
        }

        // 5. Buka langsung halaman pembayaran DOKU Checkout jika link pembayaran valid
        if (isValidCheckoutUrl(checkoutUrl)) {
          setIsSuccess(true);
          window.location.href = checkoutUrl!;
          return;
        }

        // Jika checkout_url belum siap, tampilkan modal sukses pemesanan
        setIsSuccess(true);
      } catch (err: any) {
        console.error('Cart booking error:', err);
        const isConflict = err?.code === 'ROOM_ALREADY_PAID' || 
                           err?.message?.toLowerCase().includes('sudah dibayar') ||
                           err?.message?.toLowerCase().includes('sudah diisi') ||
                           err?.message?.toLowerCase().includes('already paid') ||
                           err?.message?.toLowerCase().includes('tidak tersedia') ||
                           err?.message?.toLowerCase().includes('conflict');
        if (isConflict) {
          setError(err?.message || 'Kamar ini sudah dibayar atau dipesan oleh calon penghuni lain. Silakan pilih unit kamar lain yang masih tersedia.');
        } else {
          setError(err?.message || 'Gagal menambahkan kamar ke keranjang pemesanan. Silakan coba lagi.');
        }
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // --- ALUR SEWA TRANSIT ---
    try {
      const payload: Omit<Booking, 'id' | 'status'> & { phone: string } = {
        propertyName: property?.title || '',
        userName: name,
        userEmail: email,
        phone,
        bookingType,
        moveInDate: date,
        transitDate: date,
        transitStartTime: transitStartTime,
        duration: transitDuration
      };

      if (session) {
        payload.tenantId = session.id;
      }

      if (selectedRoom) {
        payload.notes = `Kamar Transit: ${selectedRoom}`;
      }

      const res = await createBooking(payload as any);
      setIsSuccess(true);

      // Trigger Midtrans Snap Popup if token is returned
      if (res && res.snapToken) {
        if ((window as any).snap) {
          (window as any).snap.pay(res.snapToken, {
            onSuccess: function (result: any) {
              console.log('Payment Success:', result);
            },
            onPending: function (result: any) {
              console.log('Payment Pending:', result);
            },
            onError: function (result: any) {
              console.error('Payment Error:', result);
            },
            onClose: function () {
              console.log('Payment modal closed');
            }
          });
        } else if (res.snapRedirectUrl) {
          window.open(res.snapRedirectUrl, '_blank');
        }
      }

      const waMessage = encodeURIComponent(
        `Halo Admin Highlanderstay, saya baru saja memesan Transit.\n\n` +
        `Detail Pemesanan:\n` +
        `- Properti: ${propertyName}\n` +
        (selectedRoom ? `- Pilihan Kamar: ${selectedRoom}\n` : '') +
        `- Nama: ${name}\n` +
        `- Telepon: ${phone}\n` +
        `- Tanggal Transit: ${date}\n` +
        `- Waktu Mulai: ${transitStartTime} (${transitDuration} Jam)`
      );
      const targetWa = (property?.phone || whatsappNumber).replace(/[^\d]/g, '');
      const waUrl = `https://wa.me/${targetWa}?text=${waMessage}`;
      window.open(waUrl, '_blank');

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
        onClose();
      }, 2500);
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4">
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
            className="relative w-full max-w-md bg-surface border border-stroke rounded-2xl sm:rounded-3xl p-4 sm:p-8 overflow-y-auto max-h-[92vh] shadow-2xl text-left"
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
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl text-emerald-400">✓</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-text-primary mb-1">
                  {createdOrder ? 'Pesanan Kamar Siap Dibayar!' : 'Pemesanan Terkirim!'}
                </h3>
                <p className="text-xs text-muted max-w-sm leading-relaxed mb-4">
                  {createdOrder 
                    ? `Pesanan kamar ${createdOrder.unit?.name || selectedRoom} untuk ${createdOrder.property?.name || propertyName} telah disimpan ke keranjang. Mengarahkan Anda ke halaman pembayaran DOKU Checkout...`
                    : `Kami telah menerima permintaan pemesanan Anda untuk ${propertyName}.`}
                </p>

                {createdOrder && (
                  <div className="w-full bg-bg/80 border border-stroke rounded-xl p-4 text-left flex flex-col gap-2.5 text-xs mb-5">
                    <div className="flex justify-between items-center pb-2 border-b border-stroke/40">
                      <span className="text-muted">Kode Pesanan (Ref)</span>
                      <span className="font-mono font-bold text-text-primary bg-text-primary/10 px-2 py-0.5 rounded">
                        {createdOrder.reference}
                      </span>
                    </div>
                    {createdOrder.unit?.name && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Kamar Pilihan</span>
                        <span className="font-semibold text-amber-400">
                          Kamar {createdOrder.unit.name}
                        </span>
                      </div>
                    )}
                    {createdOrder.period?.start_date && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted">Rencana Masuk</span>
                        <span className="font-semibold text-text-primary">
                          {createdOrder.period.start_date} ({createdOrder.period.duration_months} Bulan)
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-stroke/40">
                      <span className="text-muted">Total Tagihan</span>
                      <span className="font-extrabold text-amber-400 text-sm">
                        Rp {Number(createdOrder.amount || totalInitialPayment).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                )}

                {createdOrder ? (
                  <div className="w-full flex flex-col gap-2.5">
                    <button
                      type="button"
                      disabled={isPayingCheckout}
                      onClick={async () => {
                        if (isValidCheckoutUrl(createdOrder.checkout_url)) {
                          window.location.href = createdOrder.checkout_url!;
                          return;
                        }
                        if (createdOrder.id) {
                          try {
                            setIsPayingCheckout(true);
                            const res = await refreshCartCheckout(createdOrder.id);
                            if (isValidCheckoutUrl(res?.checkout_url)) {
                              window.location.href = res.checkout_url!;
                              return;
                            }
                            throw new Error('Tautan pembayaran DOKU belum tersedia dari server.');
                          } catch (err: any) {
                            alert(err?.message || 'Gagal membuka halaman DOKU Checkout. Silakan coba kembali.');
                          } finally {
                            setIsPayingCheckout(false);
                          }
                        }
                      }}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-bg font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {isPayingCheckout ? (
                        <>
                          <div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin" />
                          <span>Membuka Pembayaran DOKU...</span>
                        </>
                      ) : (
                        <>
                          <span>Bayar Sekarang dengan DOKU (QRIS/VA)</span>
                          <span>→</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 px-4 rounded-xl bg-surface border border-stroke hover:border-text-primary/30 text-text-primary text-xs font-medium text-center transition-colors cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                ) : (
                  <div className="w-full flex flex-col gap-2.5">
                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-3 px-4 rounded-xl bg-text-primary hover:bg-white text-bg font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-md cursor-pointer"
                    >
                      Selesai
                    </button>
                  </div>
                )}
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
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Input Email */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Alamat Email (Opsional)</label>
                      <input 
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="anda@contoh.com"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Input Phone */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Nomor WhatsApp *</label>
                      <input 
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="cth. 081287681714"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>
                  </>
                )}

                {/* Conditional Fields based on bookingType */}
                {bookingType === 'monthly' ? (
                  <>
                    {/* Available Room Picker (if property has room details) */}
                    {((property?.availableRoomsList && property.availableRoomsList.length > 0) || (property?.availableRoomDetails && property.availableRoomDetails.length > 0)) && (
                      <div className="flex flex-col gap-2">
                        <div className="flex justify-between items-center">
                          <label className="text-xs text-muted uppercase tracking-wider font-medium">Pilihan Kamar Siap Huni *</label>
                          {selectedRoom && (
                            <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md">
                              Terpilih: {selectedRoom}
                            </span>
                          )}
                        </div>
                        <select
                          value={selectedRoom}
                          onChange={(e) => handleRoomSelect(e.target.value)}
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
                        >
                          <option value="">-- Pilih Kamar --</option>
                          {(property.availableRoomDetails && property.availableRoomDetails.length > 0
                            ? property.availableRoomDetails.map((r: any) => ({
                                value: `Kamar ${r.name}`,
                                label: `Kamar ${r.name}${r.floor ? ` (Lantai ${r.floor})` : ''}${r.monthly_rate ? ` - Rp ${Number(r.monthly_rate).toLocaleString('id-ID')}/bln` : ''}`
                              }))
                            : (property.availableRoomsList || []).map((r: string) => ({
                                value: `Kamar ${r}`,
                                label: `Kamar ${r}`
                              }))
                          ).map((opt, i) => (
                            <option key={i} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Target Move-in Date (Replaces Survey Date/Time) */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs text-muted uppercase tracking-wider font-medium">Tanggal Mulai Sewa (Move-in) *</label>
                        <span className="text-[10px] text-emerald-400 font-medium">Kamar otomatis terkunci</span>
                      </div>
                      <input 
                        type="date"
                        required
                        value={date}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Rental Duration Picker */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Durasi Sewa *</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 3, 6, 12].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setDurationMonths(m)}
                            className={`py-2 px-1 text-xs rounded-xl border font-semibold transition-all duration-200 ${
                              durationMonths === m
                                ? 'bg-text-primary text-bg border-text-primary shadow-sm'
                                : 'bg-bg/60 text-muted border-stroke hover:text-text-primary hover:border-text-primary/40'
                            }`}
                          >
                            {m} Bulan
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Notes / Special Request */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Catatan Tambahan (Opsional)</label>
                      <input 
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="cth. Perkiraan sampai jam 2 siang, butuh parkir motor"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Monthly pricing summary */}
                    <div className="bg-bg border border-stroke/70 rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                      <div className="flex justify-between text-muted">
                        <span>Tarif Sewa Kamar:</span>
                        <span className="text-text-primary font-semibold">
                          Rp {effectiveMonthlyRate.toLocaleString('id-ID')} / bulan
                        </span>
                      </div>
                      <div className="flex justify-between text-muted">
                        <span>Durasi Sewa:</span>
                        <span className="text-text-primary font-semibold">{durationMonths} Bulan</span>
                      </div>
                      <div className="flex justify-between text-muted">
                        <span>Subtotal Sewa:</span>
                        <span className="text-text-primary font-semibold">
                          Rp {(effectiveMonthlyRate * durationMonths).toLocaleString('id-ID')}
                        </span>
                      </div>
                      {deposit > 0 && (
                        <div className="flex justify-between text-muted">
                          <span>Deposit Keamanan:</span>
                          <span className="text-text-primary font-semibold">
                            Rp {deposit.toLocaleString('id-ID')}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-stroke/40 pt-2.5 mt-1 text-sm font-bold text-text-primary">
                        <span>Total Tagihan Pertama:</span>
                        <span className="text-emerald-400">
                          Rp {totalInitialPayment.toLocaleString('id-ID')}
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
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
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
                          className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-base sm:text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors duration-200"
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
                            {property?.transit24h ? (
                              <tr 
                                onClick={() => setTransitDuration(24)}
                                className={`border-b border-stroke last:border-0 cursor-pointer transition-colors ${
                                  transitDuration === 24 
                                    ? 'bg-text-primary/10 border-l-2 border-l-emerald-400 font-semibold' 
                                    : 'hover:bg-white/5'
                                }`}
                              >
                                <td className="py-3 px-3 text-text-primary flex items-center gap-2 select-none">
                                  <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${transitDuration === 24 ? 'border-emerald-400' : 'border-stroke'}`}>
                                    {transitDuration === 24 && <div className="w-2 h-2 rounded-full bg-emerald-400" />}
                                  </div>
                                  24 Jam
                                </td>
                                <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                                  Rp {property.transit24h.toLocaleString('id-ID')}
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
                  className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-current" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Memproses Sewa & Tagihan...
                    </span>
                  ) : bookingType === 'monthly' ? (
                    'Pesan Kamar & Bayar (DOKU Checkout)'
                  ) : (
                    'Kirim Pertanyaan Pemesanan'
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
