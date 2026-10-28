import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Calendar, 
  User, 
  Phone, 
  Edit2, 
  ChevronRight, 
  X 
} from 'lucide-react';
import { 
  createBooking, 
  addToCart, 
  getOrCreateCartToken, 
  fetchSettings, 
  refreshCartCheckout, 
  isValidCheckoutUrl,
  simulatePaymentSuccess,
  isOnlinePaymentEnabled,
  updateTenantProfile,
  type SimulatePaymentResponse
} from '../api';
import type { Property, UserSession, Booking } from '../api';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  property: Property | null;
  initialRoomName?: string;
  onOpenCart?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, property, initialRoomName, onOpenCart }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(initialRoomName || '');
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [bookingType, setBookingType] = useState<'monthly' | 'transit'>('monthly');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]); // Default to today's date
  const [durationMonths, setDurationMonths] = useState<number>(1);
  const [isEditingDate, setIsEditingDate] = useState(false);
  const [notes, setNotes] = useState('');
  const [transitStartTime, setTransitStartTime] = useState('');
  const [transitDuration, setTransitDuration] = useState<number>(3);
  const [session, setSession] = useState<UserSession | null>(null);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);

  const hasTransitSupport = !!(property?.transit3h || property?.transit6h || property?.transit12h || property?.transit24h);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPayingCheckout, setIsPayingCheckout] = useState(false);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);
  const [simulationData, setSimulationData] = useState<SimulatePaymentResponse | null>(null);
  const [error, setError] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('628123456789');

  // Helper to format rental date range: e.g. "28 Okt - 28 Nov 2026"
  const formatRentalPeriod = (startDateStr: string, months: number): string => {
    if (!startDateStr) return '';
    try {
      const parts = startDateStr.split('-').map(Number);
      if (parts.length < 3) return startDateStr;
      const start = new Date(parts[0], parts[1] - 1, parts[2]);
      if (isNaN(start.getTime())) return startDateStr;

      const end = new Date(parts[0], parts[1] - 1 + months, parts[2]);
      const monthsNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      
      const startFormatted = `${start.getDate()} ${monthsNames[start.getMonth()]}`;
      const endFormatted = `${end.getDate()} ${monthsNames[end.getMonth()]} ${end.getFullYear()}`;
      return `${startFormatted} - ${endFormatted}`;
    } catch {
      return startDateStr;
    }
  };

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
        // Default reset to today's date
        const todayIso = new Date().toISOString().split('T')[0];
        setBookingType('monthly');
        setDate(todayIso);
        setDurationMonths(1);
        setIsEditingDate(false);
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
            if (parsed && (parsed.role === 'tenant' || parsed.email)) {
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
  const deposit = Number(property?.deposit_amount !== undefined && property?.deposit_amount !== null 
    ? property.deposit_amount 
    : (property?.deposit !== undefined && property?.deposit !== null ? property.deposit : 500000));
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
    if (!name.trim()) {
      setError('Mohon lengkapi nama penyewa.');
      return;
    }
    if (!phone.trim()) {
      setError('Mohon masukkan nomor WhatsApp aktif Anda untuk konfirmasi & akses kamar.');
      return;
    }
    if (!date) {
      setError('Mohon tentukan tanggal mulai sewa.');
      return;
    }

    // Auto-sync phone number to user session and backend profile
    if (session && phone.trim()) {
      const updatedSession = { ...session, phone: phone.trim(), name: name.trim() };
      setSession(updatedSession);
      try {
        localStorage.setItem('userSession', JSON.stringify(updatedSession));
        const token = session.token || localStorage.getItem('authToken');
        if (token) {
          updateTenantProfile({ phone: phone.trim(), name: name.trim() }, token).catch(() => {});
        }
      } catch (e) {
        console.warn('Session phone sync note:', e);
      }
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

        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('cart-updated', { detail: { order: orderData } }));
        }

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

        // 5. Buka langsung halaman pembayaran DOKU Checkout jika link pembayaran valid dan payment gateway diaktifkan
        if (isOnlinePaymentEnabled() && isValidCheckoutUrl(checkoutUrl)) {
          setIsSuccess(true);
          window.location.href = checkoutUrl!;
          return;
        }

        // Mode lokal / pembayaran online dinonaktifkan: tampilkan modal konfirmasi langsung
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
            className="relative w-full max-w-lg bg-surface border border-stroke rounded-2xl sm:rounded-3xl p-4 sm:p-6 overflow-y-auto max-h-[92vh] shadow-2xl text-left"
          >
            {/* Top Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-bg/80 border border-stroke/80 text-muted hover:text-text-primary flex items-center justify-center transition-colors duration-200 cursor-pointer shadow-sm"
              aria-label="Tutup"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Halftone Overlay */}
            <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />

            {isSuccess ? (
              <div className="flex flex-col items-center justify-center py-6 text-center">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                  <span className="text-2xl text-emerald-400">✓</span>
                </div>
                <h3 className="text-xl font-display font-semibold text-text-primary mb-1">
                  {simulationData 
                    ? 'Pemesanan Berhasil & Terverifikasi!' 
                    : createdOrder 
                      ? (isOnlinePaymentEnabled() ? 'Pesanan Kamar Siap Dibayar!' : 'Pesanan Kamar Tercatat (Mode Lokal)!') 
                      : 'Pemesanan Terkirim!'}
                </h3>
                <p className="text-xs text-muted max-w-sm leading-relaxed mb-4">
                  {createdOrder 
                    ? (isOnlinePaymentEnabled()
                        ? `Pesanan kamar ${createdOrder.unit?.name || selectedRoom} untuk ${createdOrder.property?.name || propertyName} telah disimpan ke keranjang. Mengarahkan Anda ke halaman pembayaran DOKU Checkout...`
                        : `Pesanan kamar ${createdOrder.unit?.name || selectedRoom} untuk ${createdOrder.property?.name || propertyName} telah berhasil disimpan ke database OpenKos lokal. Klik tombol di bawah untuk konfirmasi sewa langsung tanpa gateway DOKU.`)
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

                {simulationData ? (
                  <div className="w-full flex flex-col gap-3">
                    <div className="w-full bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 text-left flex flex-col gap-2 text-xs">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold pb-2 border-b border-emerald-500/20">
                        <span>✓</span>
                        <span>Pembayaran Sukses Terverifikasi (Sandbox)</span>
                      </div>
                      <div className="flex justify-between items-center text-text-primary">
                        <span className="text-muted">Kontrak Sewa (Lease):</span>
                        <span className="font-mono font-bold text-emerald-400">ID #{simulationData.order.lease_id} (Active)</span>
                      </div>
                      <div className="flex justify-between items-center text-text-primary">
                        <span className="text-muted">No. Tagihan (Invoice):</span>
                        <span className="font-mono font-bold text-emerald-400">ID #{simulationData.order.invoice_id} (Paid)</span>
                      </div>
                      <div className="flex justify-between items-center text-text-primary">
                        <span className="text-muted">Status Kamar:</span>
                        <span className="font-semibold text-amber-400">Occupied (Terkunci)</span>
                      </div>
                      <p className="text-[11px] text-muted mt-1 leading-relaxed">
                        Akun penghuni Anda telah otomatis dibuat untuk nomor HP <span className="font-mono text-text-primary">{phone}</span>. Anda kini dapat mengakses kontrak sewa dan tagihan lunas di portal penghuni.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        window.location.reload();
                      }}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-bg font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-lg cursor-pointer"
                    >
                      Selesai & Segarkan Halaman
                    </button>
                  </div>
                ) : createdOrder ? (
                  <div className="w-full flex flex-col gap-2.5">
                    {isOnlinePaymentEnabled() ? (
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
                    ) : (
                      <button
                        type="button"
                        disabled={isSimulatingPayment}
                        onClick={async () => {
                          try {
                            setIsSimulatingPayment(true);
                            const res = await simulatePaymentSuccess(createdOrder.id || createdOrder.reference);
                            setSimulationData(res);
                          } catch (err: any) {
                            alert(err?.message || 'Gagal konfirmasi pembayaran lokal.');
                          } finally {
                            setIsSimulatingPayment(false);
                          }
                        }}
                        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-bg font-bold text-xs uppercase tracking-wider text-center transition-colors shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        title="Klik untuk menyelesaikan pesanan & terbitkan kontrak sewa di OpenKos lokal"
                      >
                        {isSimulatingPayment ? (
                          <>
                            <div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin" />
                            <span>Memproses Konfirmasi Sewa...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡ Konfirmasi Sewa Langsung (Mode Uji Lokal)</span>
                            <span>✓</span>
                          </>
                        )}
                      </button>
                    )}

                    {isOnlinePaymentEnabled() && (
                      <button
                        type="button"
                        disabled={isSimulatingPayment}
                        onClick={async () => {
                          try {
                            setIsSimulatingPayment(true);
                            const res = await simulatePaymentSuccess(createdOrder.id || createdOrder.reference);
                            setSimulationData(res);
                          } catch (err: any) {
                            alert(err?.message || 'Gagal simulasi pembayaran sandbox.');
                          } finally {
                            setIsSimulatingPayment(false);
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-semibold text-xs tracking-wider text-center transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        title="Klik untuk mensimulasikan pembayaran lunas di OpenKos tanpa gateway eksternal"
                      >
                        {isSimulatingPayment ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                            <span>Memproses Simulasi Pembayaran...</span>
                          </>
                        ) : (
                          <>
                            <span>⚡ Simulasikan Sukses Bayar (Sandbox Test)</span>
                          </>
                        )}
                      </button>
                    )}

                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-left text-[11px] text-muted leading-relaxed">
                      <div className="flex items-center gap-1.5 font-bold text-amber-400 mb-1">
                        <span>ℹ️</span>
                        <span>Informasi Status Keranjang:</span>
                      </div>
                      <p>
                        Pesanan ini tersimpan di <strong>Keranjang Pemesanan</strong> selama 48 jam dengan status <em>Menunggu Pembayaran</em>. Kamar baru akan terkunci permanen setelah Anda menyelesaikan pembayaran.
                      </p>
                      <p className="mt-1">
                        Anda dapat melanjutkan pembayaran atau membatalkan pesanan kapan saja melalui menu <strong>Keranjang 🛒</strong> di bagian atas.
                      </p>
                    </div>

                    {onOpenCart && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenCart();
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs text-center transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <span>🛒 Lihat di Keranjang Pemesanan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={onClose}
                      className="w-full py-2.5 px-4 rounded-xl bg-surface border border-stroke hover:border-text-primary/30 text-text-primary text-xs font-medium text-center transition-colors cursor-pointer"
                    >
                      Tutup & Bayar Nanti
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
              <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
                {/* Mamikos-Style Stepper Bar */}
                <div className="w-full pb-3 border-b border-stroke/40">
                  <div className="flex items-center justify-between text-[11px] font-medium text-muted relative px-1 sm:px-2">
                    {/* Stepper Connecting Line */}
                    <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-stroke -z-0">
                      <div className="h-full bg-emerald-500 w-[12%]" />
                    </div>

                    {/* Step 1: Ajukan Sewa (Active) */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-7 h-7 rounded-full bg-emerald-500 text-bg flex items-center justify-center font-bold text-xs shadow-md ring-4 ring-emerald-500/20">
                        1
                      </div>
                      <span className="text-emerald-400 font-bold text-[10px]">Ajukan Sewa</span>
                    </div>

                    {/* Step 2: Konfirmasi Pemilik */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-7 h-7 rounded-full bg-bg border border-stroke text-muted flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <span className="text-[10px]">Konfirmasi</span>
                    </div>

                    {/* Step 3: Bayar Sewa Pertama */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-7 h-7 rounded-full bg-bg border border-stroke text-muted flex items-center justify-center font-bold text-xs">
                        3
                      </div>
                      <span className="text-[10px]">Bayar Sewa</span>
                    </div>

                    {/* Step 4: Check-in */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <div className="w-7 h-7 rounded-full bg-bg border border-stroke text-muted flex items-center justify-center font-bold text-xs">
                        4
                      </div>
                      <span className="text-[10px]">Check-in</span>
                    </div>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2">
                    <span className="font-bold">⚠️</span>
                    <span>{error}</span>
                  </div>
                )}

                {/* Booking Type Selector Tabs (Only show if transit is supported) */}
                {hasTransitSupport && (
                  <div className="grid grid-cols-2 bg-bg border border-stroke p-1 rounded-full">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingType('monthly');
                        setError('');
                      }}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2 transition-all duration-300 cursor-pointer ${
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
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2 transition-all duration-300 cursor-pointer ${
                        bookingType === 'transit' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Transit
                    </button>
                  </div>
                )}

                {bookingType === 'monthly' ? (
                  <>
                    {/* Urgency Badge (Mamikos Style) */}
                    <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-amber-300">
                      <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="font-medium">
                        {property?.availableRoomDetails && property.availableRoomDetails.length > 0
                          ? `Sisa ${property.availableRoomDetails.length} kamar, jangan sampai kehabisan!`
                          : (property?.availableRoomsList && property.availableRoomsList.length > 0
                              ? `Sisa ${property.availableRoomsList.length} kamar, jangan sampai kehabisan!`
                              : 'Unit siap huni dengan verifikasi instan!')}
                      </span>
                    </div>

                    {/* Room & Property Card (Mamikos Style) */}
                    <div className="bg-bg/60 border border-stroke rounded-2xl p-3 sm:p-4 flex gap-3.5 items-center">
                      <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden bg-surface shrink-0 relative border border-stroke/40">
                        <img 
                          src={selectedRoomDetail?.image_url || property?.image || '/placeholder.jpg'} 
                          alt={propertyName}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-1 left-1 bg-black/75 backdrop-blur-md text-[9px] font-bold text-emerald-300 px-1.5 py-0.5 rounded">
                          {property?.category || 'Campur'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                              {selectedRoom ? selectedRoom : 'Unit Kamar Kos'}
                            </span>
                            {selectedRoomDetail?.floor && (
                              <span className="text-[10px] text-muted">Lantai {selectedRoomDetail.floor}</span>
                            )}
                          </div>
                          <h4 className="text-sm font-bold text-text-primary truncate">{propertyName}</h4>
                          <p className="text-[11px] text-muted truncate mt-0.5">{property?.location || 'Lokasi Kos'}</p>
                        </div>
                        {/* Facilities chips snippet */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {(property?.facilities || ['K. Mandi Dalam', 'Kasur', 'AC', 'WiFi']).slice(0, 3).map((f, i) => (
                            <span key={i} className="text-[9px] bg-white/5 border border-white/10 text-muted px-1.5 py-0.5 rounded">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Room Unit Selector (if multiple rooms available) */}
                    {property?.availableRoomDetails && property.availableRoomDetails.length > 1 && (
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] text-muted font-medium flex items-center justify-between">
                          <span>Pilihan Kamar Siap Huni:</span>
                          <span className="text-[10px] text-emerald-400 font-semibold">{property.availableRoomDetails.length} unit tersedia</span>
                        </label>
                        <select
                          value={selectedRoom}
                          onChange={(e) => handleRoomSelect(e.target.value)}
                          className="w-full bg-bg border border-stroke rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          {property.availableRoomDetails.map((r: any) => (
                            <option key={r.id} value={`Kamar ${r.name}`}>
                              Kamar {r.name}{r.floor ? ` (Lt. ${r.floor})` : ''} - Rp {Number(r.monthly_rate || effectiveMonthlyRate).toLocaleString('id-ID')}/bln
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Card 1: Waktu dan Durasi Ngekos (Mamikos Style) */}
                    <div className="bg-bg/60 border border-stroke rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stroke/40">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-text-primary">Waktu dan durasi ngekos</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsEditingDate(!isEditingDate)}
                          className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>{isEditingDate ? 'Simpan' : 'Ubah'}</span>
                        </button>
                      </div>

                      <div className="flex flex-col gap-2.5 text-xs">
                        <div className="flex justify-between items-center text-muted">
                          <span>Hitungan sewa</span>
                          <span className="font-semibold text-text-primary">Per Bulan</span>
                        </div>

                        <div className="flex justify-between items-center text-muted">
                          <span>Durasi</span>
                          <div className="flex gap-1.5">
                            {[1, 3, 6, 12].map((m) => (
                              <button
                                key={m}
                                type="button"
                                onClick={() => setDurationMonths(m)}
                                className={`px-2.5 py-1 text-[11px] rounded-lg font-semibold transition-all cursor-pointer ${
                                  durationMonths === m
                                    ? 'bg-emerald-500 text-bg shadow-sm'
                                    : 'bg-surface border border-stroke text-muted hover:text-text-primary'
                                }`}
                              >
                                {m} Bulan
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-muted pt-1">
                          <span>Tanggal</span>
                          <span className="font-semibold text-emerald-400 text-xs">
                            {formatRentalPeriod(date, durationMonths) || date}
                          </span>
                        </div>

                        {/* Collapsible Custom Date Picker */}
                        {isEditingDate && (
                          <div className="pt-2 mt-1 border-t border-stroke/30 flex flex-col gap-1.5">
                            <label className="text-[10px] text-muted uppercase font-medium">Tanggal Mulai Masuk (Move-in)</label>
                            <input
                              type="date"
                              value={date}
                              min={new Date().toISOString().split('T')[0]}
                              onChange={(e) => setDate(e.target.value)}
                              className="w-full bg-surface border border-stroke rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Card 2: Biaya Sewa Kos (Mamikos Style) */}
                    <div className="bg-bg/60 border border-stroke rounded-2xl p-4 flex flex-col gap-2.5 text-xs">
                      <span className="text-xs font-bold text-text-primary pb-2 border-b border-stroke/40">Biaya sewa kos</span>
                      <div className="flex justify-between text-muted">
                        <span>Harga sewa per bulan:</span>
                        <span className="text-text-primary font-semibold">Rp {effectiveMonthlyRate.toLocaleString('id-ID')}</span>
                      </div>
                      {durationMonths > 1 && (
                        <div className="flex justify-between text-muted">
                          <span>Total sewa ({durationMonths} Bulan):</span>
                          <span className="text-text-primary font-semibold">Rp {(effectiveMonthlyRate * durationMonths).toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {deposit > 0 && (
                        <div className="flex justify-between text-muted">
                          <span>Deposit jaminan (dikembalikan):</span>
                          <span className="text-text-primary font-semibold">Rp {deposit.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      <div className="flex justify-between border-t border-stroke/40 pt-2 mt-1 text-sm font-bold">
                        <span className="text-text-primary">Total Bayar Pertama:</span>
                        <span className="text-emerald-400 font-extrabold">Rp {totalInitialPayment.toLocaleString('id-ID')}</span>
                      </div>
                    </div>

                    {/* Card 3: Informasi Penyewa (Mamikos Style) */}
                    <div className="bg-bg/60 border border-stroke rounded-2xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between pb-2 border-b border-stroke/40">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-emerald-400" />
                          <span className="text-xs font-bold text-text-primary">Informasi penyewa</span>
                        </div>
                        {session && (
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-semibold">
                            Google Terhubung
                          </span>
                        )}
                      </div>

                      <div className="flex flex-col gap-2.5 text-xs">
                        <div className="flex justify-between items-center text-muted">
                          <span>Jumlah Penyewa</span>
                          <span className="font-semibold text-text-primary">1 Orang</span>
                        </div>

                        <div className="flex justify-between items-center text-muted">
                          <span>Nama Penyewa</span>
                          {session?.name ? (
                            <span className="font-semibold text-text-primary">{name || session.name}</span>
                          ) : (
                            <input
                              type="text"
                              required
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="Nama lengkap Anda"
                              className="bg-surface border border-stroke rounded-lg px-2.5 py-1 text-xs text-text-primary text-right focus:outline-none focus:border-emerald-500"
                            />
                          )}
                        </div>

                        <div className="flex justify-between items-center text-muted">
                          <span>Alamat Email</span>
                          <span className="font-medium text-text-primary truncate max-w-[200px]">{email || session?.email || '-'}</span>
                        </div>

                        {/* Nomor WhatsApp (Selalu bisa diisi & diedit langsung) */}
                        <div className="pt-2 border-t border-stroke/30 flex flex-col gap-1.5">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] font-semibold text-text-primary flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Nomor WhatsApp Aktif *</span>
                            </label>
                            {!phone.trim() && (
                              <span className="text-[10px] text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded font-medium">
                                Masukkan No. HP
                              </span>
                            )}
                          </div>
                          <input
                            type="tel"
                            required
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              if (error) setError('');
                            }}
                            placeholder="cth. 081234567890"
                            className={`w-full bg-surface border rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-muted/40 focus:outline-none transition-all ${
                              !phone.trim() ? 'border-amber-500/60 bg-amber-500/5 focus:border-amber-400' : 'border-stroke focus:border-emerald-500'
                            }`}
                          />
                          <p className="text-[10px] text-muted leading-tight">
                            Nomor ini digunakan untuk penerimaan bukti bayar DOKU & petunjuk akses kunci kamar.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Catatan Tambahan (Opsional) */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] text-muted font-medium">Catatan Tambahan (Opsional):</label>
                      <input 
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="cth. Rencana check-in sore jam 16:00, bawa motor"
                        className="w-full bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-xs text-text-primary placeholder:text-muted/40 focus:outline-none focus:border-white/20 transition-colors"
                      />
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
                  className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-bg font-bold text-xs uppercase tracking-wider text-center transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-1"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin" />
                      <span>Menyiapkan Pembayaran Sewa...</span>
                    </span>
                  ) : bookingType === 'monthly' ? (
                    <span className="flex items-center justify-center gap-1.5">
                      <span>Ajukan Sewa & Bayar Sekarang (Rp {totalInitialPayment.toLocaleString('id-ID')})</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  ) : (
                    <span>Kirim Pertanyaan Pemesanan</span>
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
