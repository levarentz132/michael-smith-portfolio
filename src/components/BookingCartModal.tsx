import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Trash2, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  ArrowRight,
  ExternalLink,
  Building2,
  Calendar,
  AlertCircle,
  Zap
} from 'lucide-react';
import { 
  fetchCart, 
  removeFromCart, 
  refreshCartCheckout, 
  getOrCreateCartToken,
  isValidCheckoutUrl,
  simulatePaymentSuccess
} from '../api';
import type { CartItem, CartData } from '../api';

interface BookingCartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRooms?: () => void;
}

export const BookingCartModal: React.FC<BookingCartModalProps> = ({
  isOpen,
  onClose,
  onSelectRooms
}) => {
  const [cartToken, setCartToken] = useState<string>('');
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const formatRupiah = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateStr: string | undefined | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const loadCart = useCallback(async (tokenToUse?: string) => {
    const token = tokenToUse || cartToken || getOrCreateCartToken();
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetchCart(token);
      setCartData(res.cart);
    } catch (err: any) {
      console.warn('Gagal memuat data keranjang:', err);
    } finally {
      setLoading(false);
    }
  }, [cartToken]);

  useEffect(() => {
    if (isOpen) {
      const token = getOrCreateCartToken();
      setCartToken(token);
      loadCart(token);
    }
  }, [isOpen, loadCart]);

  // Handle pay single item or active available item
  const handlePay = async (item: CartItem) => {
    if (item.is_available === false) {
      setErrorMessage(
        item.conflict_message || 
        'Kamar ini sudah diisi atau dibayar oleh orang lain. Silakan hapus pesanan ini dan pilih kamar yang masih tersedia.'
      );
      return;
    }

    setActionLoadingId(item.id);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Selalu verifikasi ketersediaan kamar ke backend sebelum redirect
      const res = await refreshCartCheckout(item.id);

      if (isValidCheckoutUrl(res?.checkout_url)) {
        // Simpan pending context di sessionStorage untuk validasi return callback
        sessionStorage.setItem('pending_doku_checkout', JSON.stringify({
          orderId: item.id,
          reference: item.reference,
          amount: item.amount,
          isCart: true,
          timestamp: Date.now()
        }));

        setSuccessMessage('Membuka halaman pembayaran DOKU...');
        setTimeout(() => {
          window.location.href = res.checkout_url;
        }, 500);
      } else {
        throw new Error('Link pembayaran resmi DOKU belum tersedia dari server.');
      }
    } catch (err: any) {
      console.error('Pay cart error:', err);
      const isConflict = 
        err?.code === 'ROOM_ALREADY_PAID' || 
        err?.response?.data?.code === 'ROOM_ALREADY_PAID' ||
        err?.message?.toLowerCase().includes('sudah dibayar') || 
        err?.message?.toLowerCase().includes('sudah diisi') ||
        err?.message?.toLowerCase().includes('already paid') ||
        err?.message?.toLowerCase().includes('tidak tersedia') ||
        err?.message?.toLowerCase().includes('conflict');

      if (isConflict) {
        setErrorMessage(
          err?.response?.data?.message || 
          err?.message || 
          'Kamar pada pesanan ini telah dibayar oleh orang lain. Status keranjang telah diperbarui.'
        );
        // Segarkan keranjang otomatis agar status item terupdate
        await loadCart();
      } else {
        setErrorMessage(err?.message || 'Gagal membuka halaman pembayaran DOKU. Silakan coba kembali.');
      }
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRemove = async (orderId: number) => {
    if (!window.confirm('Hapus pesanan kamar ini dari keranjang Anda?')) return;
    setActionLoadingId(orderId);
    setErrorMessage(null);
    try {
      await removeFromCart(orderId);
      await loadCart();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal menghapus item dari keranjang.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleSimulatePay = async (item: CartItem) => {
    setActionLoadingId(item.id);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await simulatePaymentSuccess(item.id);
      setSuccessMessage(`Simulasi Sukses! Kontrak Sewa #${res.order.lease_id} aktif, unit terkunci occupied, & Invoice #${res.order.invoice_id} lunas.`);
      await loadCart();
    } catch (err: any) {
      console.error('Simulate payment error:', err);
      setErrorMessage(err?.message || 'Gagal melakukan simulasi pembayaran sandbox.');
    } finally {
      setActionLoadingId(null);
    }
  };


  if (!isOpen) return null;

  const items = cartData?.items || [];
  const activeItem = items.find((i) => i.is_available !== false);
  const total = cartData?.total || 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="relative w-full max-w-2xl bg-surface border border-stroke rounded-2xl sm:rounded-[28px] overflow-hidden shadow-2xl text-left flex flex-col max-h-[92vh]"
        >
          {/* Ambient decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="relative z-10 px-5 sm:px-6 py-4 border-b border-stroke/40 bg-bg/40 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold">
                <ShoppingCart size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-display font-semibold text-text-primary">
                    Keranjang Booking Kos
                  </h3>
                  {items.length > 0 && (
                    <span className="text-[11px] font-mono px-2 py-0.5 bg-amber-500/15 text-amber-400 border border-amber-500/30 rounded-full font-bold">
                      {items.length} Kamar
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted mt-0.5">
                  Selesaikan pembayaran online untuk mengamankan kamar Anda.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => loadCart()}
                disabled={loading}
                className="p-2 text-muted hover:text-text-primary border border-stroke rounded-full transition-colors hover:bg-stroke/30 cursor-pointer"
                title="Segarkan Keranjang"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="p-2 text-muted hover:text-text-primary text-base transition-colors cursor-pointer"
                aria-label="Tutup"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <span>{errorMessage}</span>
                </div>
                <button 
                  onClick={() => setErrorMessage(null)} 
                  className="hover:text-white font-bold cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 size={16} className="shrink-0" />
                <span>{successMessage}</span>
              </div>
            )}

            {/* Loading State */}
            {loading && items.length === 0 ? (
              <div className="p-12 text-center text-muted space-y-3">
                <RefreshCw size={32} className="mx-auto animate-spin text-amber-400" />
                <p className="text-xs font-medium">Memuat keranjang pesanan...</p>
              </div>
            ) : items.length === 0 ? (
              /* Empty State */
              <div className="p-8 sm:p-12 text-center text-muted border border-stroke/50 rounded-2xl bg-bg/30 space-y-3">
                <ShoppingCart size={42} className="mx-auto text-stroke opacity-40" />
                <div>
                  <h4 className="text-sm sm:text-base font-semibold text-text-primary">
                    Keranjang pesanan kamar Anda masih kosong
                  </h4>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
                    Pilih unit kamar impian Anda di katalog beranda dan klik "Pesan Kamar Sekarang".
                  </p>
                </div>
                {onSelectRooms && (
                  <button
                    onClick={() => {
                      onClose();
                      onSelectRooms();
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-text-primary text-bg rounded-full text-xs font-bold transition hover:bg-white/90 cursor-pointer shadow-md"
                  >
                    <span>Jelajahi Pilihan Kamar</span>
                    <ArrowRight size={13} />
                  </button>
                )}
              </div>
            ) : (
              /* Items List */
              <div className="space-y-3.5">
                {items.map((item) => {
                  const isAvailable = item.is_available !== false;
                  const unitName = item.unit_name || item.unit?.name || 'Unit Kamar';
                  const propName = item.property_name || item.property?.name || 'Highlander Stay';
                  const startDate = item.start_date || item.period?.start_date;
                  const duration = item.duration_months || item.period?.duration_months || 1;

                  return (
                    <div
                      key={item.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-all space-y-3.5 ${
                        isAvailable
                          ? 'bg-bg/50 border-stroke hover:border-stroke/80'
                          : 'bg-rose-500/5 border-rose-500/30'
                      }`}
                    >
                      {/* Item Top Bar */}
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke/40 pb-3">
                        <div className="flex items-center gap-2.5">
                          <h4 className="font-semibold text-sm sm:text-base text-text-primary">
                            {unitName}
                          </h4>
                          {isAvailable ? (
                          {item.status === "paid" || item.is_paid ? (
                            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                              <CheckCircle2 size={11} /> Lunas (Paid)
                            </span>
                          ) : isAvailable ? (
                            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30">
                              Menunggu Pembayaran
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                              <AlertTriangle size={11} /> Sudah Diisi Orang Lain
                            </span>
                          )}
                          )}
                        </div>

                        <button
                          onClick={() => handleRemove(item.id)}
                          disabled={actionLoadingId === item.id}
                          className="text-xs text-rose-400 hover:text-rose-300 underline cursor-pointer disabled:opacity-50 flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          <span>Hapus</span>
                        </button>
                      </div>

                      {/* Property & Dates */}
                      <div className="text-xs space-y-1">
                        <p className="text-muted flex items-center gap-1.5">
                          <Building2 size={13} className="text-text-primary/70 shrink-0" />
                          <span>{propName}</span>
                        </p>
                        <p className="text-muted flex items-center gap-1.5">
                          <Calendar size={13} className="text-text-primary/70 shrink-0" />
                          <span>Rencana Check-in: <strong className="text-text-primary">{formatDate(startDate)}</strong> ({duration} Bulan)</span>
                        </p>
                      </div>

                      {/* Conflict Message Warning */}
                      {(!isAvailable || item.conflict_message) && (
                        <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center gap-2">
                          <AlertTriangle size={14} className="shrink-0" />
                          <span>
                            {item.conflict_message || 
                              'Kamar ini sudah dibayar atau dipesan oleh calon penghuni lain. Mohon hapus pesanan ini dan pilih kamar yang masih tersedia.'}
                          </span>
                        </div>
                      )}

                      {/* Item Bottom Bar */}
                      <div className="flex items-center justify-between pt-2 border-t border-stroke/30">
                        <div>
                          <span className="text-[10px] text-muted uppercase tracking-wider block">Biaya Sewa</span>
                          <span className={`text-sm sm:text-base font-bold font-mono ${
                            isAvailable ? 'text-amber-400' : 'text-muted line-through'
                          }`}>
                            {formatRupiah(item.amount)}
                          </span>
                        </div>

                        {item.status === "paid" || item.is_paid ? (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-semibold px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/25">
                              <CheckCircle2 size={13} />
                              <span>Sewa #{item.lease_id || "Aktif"} Terbit & Lunas</span>
                            </span>
                          </div>
                        ) : isAvailable ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleSimulatePay(item)}
                              disabled={actionLoadingId === item.id}
                              className="px-2.5 py-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 rounded-full text-[11px] font-semibold transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                              title="Simulasikan pembayaran lunas di OpenKos Sandbox"
                            >
                              <Zap size={11} />
                              <span>Simulasi</span>
                            </button>
                            <button
                              onClick={() => handlePay(item)}
                              disabled={actionLoadingId === item.id}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-bg rounded-full text-xs font-bold transition shadow flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              {actionLoadingId === item.id ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-bg/40 border-t-bg rounded-full animate-spin" />
                                  <span>Memverifikasi...</span>
                                </>
                              ) : (
                                <>
                                  <CreditCard size={13} />
                                  <span>Bayar</span>
                                  <ExternalLink size={12} />
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-400/80 font-medium px-2.5 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                            Tidak Tersedia
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer Summary & Checkout */}
          {items.length > 0 && (
            <div className="relative z-10 px-5 sm:px-6 py-4 border-t border-stroke/40 bg-bg/60 space-y-3">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted font-medium">Total Tagihan ({items.length} Kamar):</span>
                <span className="text-lg sm:text-xl font-black font-mono text-amber-400">
                  {formatRupiah(total)}
                </span>
              </div>

              {activeItem ? (
                <div className="space-y-2">
                  <button
                    onClick={() => handlePay(activeItem)}
                    disabled={actionLoadingId !== null}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-bg font-bold text-xs sm:text-sm rounded-xl transition shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {actionLoadingId === activeItem.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-bg/40 border-t-bg rounded-full animate-spin" />
                        <span>Mempersiapkan Pembayaran DOKU...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard size={16} />
                        <span>Bayar Sekarang dengan DOKU (QRIS/VA)</span>
                        <ArrowRight size={15} />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSimulatePay(activeItem)}
                    disabled={actionLoadingId !== null}
                    className="w-full py-2.5 px-4 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 font-semibold text-xs tracking-wider text-center transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    title="Simulasikan pembayaran sukses (sandbox OpenKos) tanpa gateway DOKU"
                  >
                    {actionLoadingId === activeItem.id ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                        <span>Memproses Simulasi...</span>
                      </>
                    ) : (
                      <>
                        <Zap size={14} />
                        <span>⚡ Simulasikan Sukses Bayar (Sandbox Test)</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs rounded-xl text-center flex items-center justify-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>Kamar pada keranjang ini telah diisi oleh orang lain. Silakan hapus item dan pilih kamar lain yang masih tersedia.</span>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
