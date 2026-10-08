import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingCart,
  Trash2,
  CreditCard,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Building2,
  Calendar,
  Zap
} from 'lucide-react';
import {
  fetchCart,
  removeFromCart,
  refreshCartCheckout,
  isValidCheckoutUrl
} from '../api';
import type { CartData, WebsiteSettings } from '../api';
import { useSEO } from '../hooks/useSEO';

interface CartPageProps {
  settings?: WebsiteSettings | null;
  onCartChange?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({ onCartChange }) => {
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useSEO({
    title: 'Keranjang Booking Kamar | Highlanderstay',
    description: 'Selesaikan pemesanan kamar kos dan apartemen Anda di Highlanderstay dengan pembayaran online aman dan instan.',
    keywords: 'keranjang booking, checkout kos jakarta, bayar sewa kos, highlanderstay',
    canonicalUrl: 'https://highlanderstay.com/cart',
    enabled: true
  });

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
      const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, y, m, d] = match;
        const monthNames = [
          'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
          'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
        ];
        return `${parseInt(d, 10)} ${monthNames[parseInt(m, 10) - 1]} ${y}`;
      }
      return new Date(dateStr).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const loadCart = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetchCart();
      if (res.cart) {
        setCartData(res.cart);
        if (onCartChange) onCartChange();
      } else {
        setCartData({ cart_token: '', count: 0, total: 0, items: [] });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memuat keranjang.');
    } finally {
      setLoading(false);
    }
  }, [onCartChange]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const handleRemove = async (orderId: number) => {
    if (!confirm('Hapus item pemesanan ini dari keranjang?')) return;
    setActionLoadingId(orderId);
    setErrorMessage(null);
    try {
      await removeFromCart(orderId);
      await loadCart();
      setSuccessMessage('Item berhasil dihapus dari keranjang.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghapus item.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handlePay = async (orderId: number) => {
    setActionLoadingId(orderId);
    setErrorMessage(null);
    try {
      const res = await refreshCartCheckout(orderId);
      if (res.checkout_url && isValidCheckoutUrl(res.checkout_url)) {
        window.location.href = res.checkout_url;
      } else {
        setErrorMessage('Sistem pembayaran belum dapat diakses saat ini.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pembayaran.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const items = cartData?.items || [];
  const unpaidItems = items.filter((i) => !i.is_paid);

  return (
    <div className="min-h-screen bg-bg text-text-primary pb-28 pt-4 sm:pt-6 px-3 sm:px-6 max-w-4xl mx-auto">
      {/* Top Header */}
      <header className="flex items-center justify-between gap-3 mb-6 bg-surface/90 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link
            to="/"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary hover:text-amber-400 transition-all shrink-0 active:scale-95"
            title="Kembali ke Beranda"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-bold font-display text-text-primary flex items-center gap-2 truncate">
              <ShoppingCart size={19} className="text-amber-400 shrink-0" />
              <span>Keranjang Booking</span>
            </h1>
            <p className="text-[11px] text-muted truncate">
              {unpaidItems.length} Kamar Menunggu Pembayaran
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadCart}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary hover:text-amber-400 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="hidden xs:inline">Refresh</span>
        </button>
      </header>

      {/* Messages */}
      {errorMessage && (
        <div className="mb-4 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
      {successMessage && (
        <div className="mb-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center gap-3 text-muted">
          <RefreshCw size={28} className="text-amber-400 animate-spin" />
          <p className="text-sm font-medium">Memuat data keranjang...</p>
        </div>
      ) : unpaidItems.length === 0 ? (
        <div className="py-16 text-center bg-surface/50 border border-white/10 rounded-3xl p-6">
          <div className="w-16 h-16 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
            <ShoppingCart size={32} />
          </div>
          <h3 className="text-base font-bold text-text-primary mb-1">Keranjang Masih Kosong</h3>
          <p className="text-xs text-muted mb-5 max-w-sm mx-auto">
            Anda belum memilih kamar untuk dibooking. Temukan kamar idaman Anda sekarang!
          </p>
          <Link
            to="/katalog"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <Building2 size={15} />
            <span>Pilih Kamar di Katalog</span>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {unpaidItems.map((item) => {
            const isItemLoading = actionLoadingId === item.id;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface/90 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-2 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-amber-300 font-bold">
                      {item.reference}
                    </span>
                    <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                      <Zap size={12} />
                      <span>Ready Checkout</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-text-primary truncate">
                      {item.property_name || item.property?.name || 'Kamar Highlanderstay'}
                    </h3>
                    <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                      <Building2 size={13} className="text-amber-400" />
                      <span>{item.unit_name || item.unit?.name || 'Unit Standar'}</span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar size={13} className="text-muted" />
                      <span>Masuk: <strong className="text-slate-200">{formatDate(item.start_date || item.period?.start_date)}</strong></span>
                    </div>
                    <div>
                      <span>Durasi: <strong className="text-slate-200">{item.duration_months || item.period?.duration_months || 1} Bulan</strong></span>
                    </div>
                  </div>
                </div>

                {/* Price & Actions */}
                <div className="border-t sm:border-t-0 sm:border-l border-white/10 pt-3 sm:pt-0 sm:pl-4 flex flex-row sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-muted uppercase font-bold block">Total Tagihan</span>
                    <span className="text-base sm:text-lg font-black text-amber-400 block">
                      {formatRupiah(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      disabled={isItemLoading}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-muted hover:text-rose-400 border border-white/10 transition-all cursor-pointer active:scale-95"
                      title="Hapus dari Keranjang"
                    >
                      <Trash2 size={16} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePay(item.id)}
                      disabled={isItemLoading}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
                    >
                      {isItemLoading ? (
                        <RefreshCw size={14} className="animate-spin" />
                      ) : (
                        <CreditCard size={14} />
                      )}
                      <span>Bayar Online</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Cart Summary Card */}
          <div className="p-4 sm:p-5 rounded-3xl bg-surface/95 border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
            <div>
              <span className="text-xs text-muted block">Total Semua Kamar ({unpaidItems.length} Item)</span>
              <span className="text-xl sm:text-2xl font-black text-amber-400">
                {formatRupiah(unpaidItems.reduce((acc, curr) => acc + (curr.amount || 0), 0))}
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to="/katalog"
                className="flex-1 sm:flex-none text-center px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-text-primary text-xs font-bold border border-white/10 transition-all active:scale-95"
              >
                + Tambah Kamar Lain
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
