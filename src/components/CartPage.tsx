import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
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
  Clock,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';
import {
  fetchCart,
  fetchProperties,
  removeFromCart,
  refreshCartCheckout,
  isValidCheckoutUrl,
  isOnlinePaymentEnabled
} from '../api';
import type { CartData, CartItem, Property, WebsiteSettings, UserSession } from '../api';
import { Navbar } from './Navbar';
import { useSEO } from '../hooks/useSEO';

interface CartPageProps {
  settings?: WebsiteSettings | null;
  session?: UserSession | null;
  properties?: Property[];
  onLogout?: () => void;
  onLoginClick?: () => void;
  onCartChange?: () => void;
}

export const CartPage: React.FC<CartPageProps> = ({
  settings,
  session = null,
  properties: propProperties,
  onLogout,
  onLoginClick,
  onCartChange,
}) => {
  const navigate = useNavigate();
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [localProperties, setLocalProperties] = useState<Property[]>(propProperties || []);
  const [loading, setLoading] = useState<boolean>(true);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useSEO({
    title: 'Keranjang & Menunggu Pembayaran | Highlanderstay',
    description: 'Selesaikan pemesanan kamar kos dan apartemen Anda di Highlanderstay dengan pembayaran online aman dan instan.',
    keywords: 'keranjang booking, menunggu pembayaran, checkout kos jakarta, bayar sewa kos, highlanderstay',
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
        setErrorMessage('Tautan pembayaran online belum tersedia dari server saat ini.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal memproses pembayaran.');
    } finally {
      setActionLoadingId(null);
    }
  };

  useEffect(() => {
    if (propProperties && propProperties.length > 0) {
      setLocalProperties(propProperties);
      return;
    }
    fetchProperties()
      .then((list) => {
        if (Array.isArray(list) && list.length > 0) setLocalProperties(list);
      })
      .catch(() => {});
  }, [propProperties]);

  const normalizeWaNumber = (raw: string | undefined | null): string => {
    const digits = (raw || '').replace(/[^0-9]/g, '');
    if (!digits) return '';
    if (digits.startsWith('0')) return `62${digits.slice(1)}`;
    return digits;
  };

  const getPenjagaWaNumber = (item: CartItem): string => {
    const directPhone =
      (item.property as { phone?: string } | undefined)?.phone ||
      (item as { property_phone?: string }).property_phone;
    if (directPhone) {
      const normalized = normalizeWaNumber(directPhone);
      if (normalized) return normalized;
    }

    const propId = item.property?.id;
    const propName = (item.property_name || item.property?.name || '').trim().toLowerCase();
    const matched = localProperties.find((p) => {
      if (propId && p.id && String(p.id) === String(propId)) return true;
      if (propName && p.title) {
        const title = p.title.trim().toLowerCase();
        return title === propName || propName.includes(title) || title.includes(propName);
      }
      return false;
    });

    if (matched?.phone) {
      const normalized = normalizeWaNumber(matched.phone);
      if (normalized) return normalized;
    }

    return normalizeWaNumber(settings?.whatsapp_number) || '6281234567890';
  };

  const items = cartData?.items || [];
  const unpaidItems = items.filter((i) => !i.is_paid);
  const paidItems = items.filter((i) => i.is_paid);
  const onlinePayEnabled = isOnlinePaymentEnabled();

  const handleNavClick = (sec: string) => {
    if (sec === 'work' || sec === 'katalog') navigate('/katalog');
    else if (sec === 'map') navigate('/map');
    else if (sec === 'resort') navigate('/resort');
    else if (sec === 'cart') navigate('/cart');
    else if (sec === 'portal' || sec === 'akun') navigate('/akun');
    else navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary pb-28">
      {/* Desktop Global Navbar */}
      <div className="hidden md:block">
        <Navbar
          activeSection="cart"
          onNavClick={handleNavClick}
          session={session}
          onLogout={onLogout || (() => navigate('/'))}
          onLoginClick={onLoginClick || (() => navigate('/akun'))}
          onProfileClick={() => navigate('/akun')}
          onCartClick={() => navigate('/cart')}
          cartCount={unpaidItems.length}
          settings={settings}
        />
      </div>

      <div className="pt-4 sm:pt-6 md:pt-28 px-3 sm:px-6 max-w-4xl mx-auto">
        {/* Top Header */}
        <header className="flex items-center justify-between gap-3 mb-6 bg-surface/90 backdrop-blur-xl border border-white/10 p-3 sm:p-4 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary hover:text-amber-400 transition-all shrink-0 active:scale-95 cursor-pointer"
              title="Kembali"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-bold font-display text-text-primary flex items-center gap-2 truncate">
                <ShoppingCart size={19} className="text-amber-400 shrink-0" />
                <span>Keranjang &amp; Menunggu Pembayaran</span>
              </h1>
              <p className="text-[11px] text-muted truncate">
                {unpaidItems.length} Kamar Menunggu Pembayaran
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={loadCart}
            className="p-2 sm:px-3 rounded-xl bg-white/10 hover:bg-white/20 text-text-primary hover:text-amber-400 transition-all flex items-center gap-1.5 text-xs font-bold active:scale-95 cursor-pointer shrink-0"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </header>

        {/* Info Banner */}
        {unpaidItems.length > 0 && (
          <div className="mb-5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2.5">
            <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Pesanan kamar di bawah ini berstatus <strong className="text-amber-300">Menunggu Pembayaran</strong> (berlaku 48 jam). Selesaikan pembayaran untuk mengunci kamar pilihan Anda secara permanen.
            </p>
          </div>
        )}

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
            <p className="text-sm font-medium">Memuat daftar menunggu pembayaran...</p>
          </div>
        ) : unpaidItems.length === 0 ? (
          <div className="py-16 text-center bg-surface/50 border border-white/10 rounded-3xl p-6">
            <div className="w-16 h-16 rounded-full bg-amber-400/10 text-amber-400 flex items-center justify-center mx-auto mb-3">
              <ShoppingCart size={32} />
            </div>
            <h3 className="text-base font-bold text-text-primary mb-1">Belum Ada Tagihan Menunggu Pembayaran</h3>
            <p className="text-xs text-muted mb-5 max-w-sm mx-auto">
              Anda belum memilih kamar untuk dibooking. Temukan kamar idaman Anda dan ajukan sewa sekarang!
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5">
              <Link
                to="/katalog"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
              >
                <Building2 size={15} />
                <span>Pilih Kamar di Katalog</span>
              </Link>
              <Link
                to="/sewa"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-text-primary text-xs font-bold active:scale-95 transition-all"
              >
                <ShieldCheck size={15} className="text-emerald-400" />
                <span>Lihat Kos Saya</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {unpaidItems.map((item) => {
              const isItemLoading = actionLoadingId === item.id;
              const depositAmt = Number(item.deposit_amount || 0);
              const rentAmt = Number(item.rent_amount || Math.max(0, (item.amount || 0) - depositAmt));
              const propName = item.property_name || item.property?.name || 'Kamar Highlanderstay';
              const unitName = item.unit_name || item.unit?.name || 'Unit Standar';
              const itemWaNumber = getPenjagaWaNumber(item);
              const waText = encodeURIComponent(
                `Halo Penjaga ${propName}, saya ingin konfirmasi booking untuk pesanan #${item.reference || item.id} (Kamar ${unitName}) sebesar ${formatRupiah(item.amount)}.`
              );

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-surface/90 border border-white/10 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/10 text-amber-300 font-bold">
                        {item.reference || `#${item.id}`}
                      </span>
                      <span className="text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Clock size={11} />
                        <span>Menunggu Pembayaran</span>
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-text-primary truncate">
                        {propName}
                      </h3>
                      <p className="text-xs text-muted flex items-center gap-1.5 mt-0.5">
                        <Building2 size={13} className="text-amber-400" />
                        <span>Kamar {unitName}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted pt-1">
                      <div className="flex items-center gap-1">
                        <Calendar size={13} className="text-muted shrink-0" />
                        <span>Masuk: <strong className="text-slate-200">{formatDate(item.start_date || item.period?.start_date)}</strong></span>
                      </div>
                      <div>
                        <span>Durasi: <strong className="text-slate-200">{item.duration_months || item.period?.duration_months || 1} Bulan</strong></span>
                      </div>
                    </div>

                    {depositAmt > 0 && (
                      <div className="text-[11px] text-muted bg-white/[0.03] border border-white/5 rounded-xl px-3 py-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>Sewa: <strong className="text-slate-200">{formatRupiah(rentAmt)}</strong></span>
                        <span>+</span>
                        <span>Deposit (Refundable): <strong className="text-slate-200">{formatRupiah(depositAmt)}</strong></span>
                      </div>
                    )}
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
                        className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/20 text-muted hover:text-rose-400 border border-white/10 transition-all cursor-pointer active:scale-95"
                        title="Batalkan / Hapus dari Keranjang"
                      >
                        <Trash2 size={16} />
                      </button>

                      {onlinePayEnabled ? (
                        <button
                          type="button"
                          onClick={() => handlePay(item.id)}
                          disabled={isItemLoading}
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                        >
                          {isItemLoading ? (
                            <RefreshCw size={14} className="animate-spin" />
                          ) : (
                            <CreditCard size={14} />
                          )}
                          <span>Bayar Sekarang</span>
                          <ArrowRight size={13} />
                        </button>
                      ) : (
                        <a
                          href={`https://wa.me/${itemWaNumber}?text=${waText}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                        >
                          <MessageCircle size={14} />
                          <span>Konfirmasi WA</span>
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}

            {/* Cart Summary Card */}
            <div className="p-4 sm:p-5 rounded-3xl bg-surface/95 border border-amber-500/30 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
              <div>
                <span className="text-xs text-muted block">Total Menunggu Pembayaran ({unpaidItems.length} Kamar)</span>
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

        {/* Paid / Confirmed Orders Section (if any) */}
        {!loading && paidItems.length > 0 && (
          <div className="mt-8 space-y-3">
            <h2 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>Sudah Dibayar ({paidItems.length})</span>
            </h2>
            {paidItems.map((item) => (
              <div
                key={item.id}
                className="bg-surface/60 border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-text-primary truncate">
                    {item.property_name || item.property?.name || 'Kamar Highlanderstay'} — Kamar {item.unit_name || item.unit?.name}
                  </p>
                  <p className="text-[11px] text-muted">
                    Ref: {item.reference} • {formatRupiah(item.amount)}
                  </p>
                </div>
                <Link
                  to="/sewa"
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-bold shrink-0"
                >
                  Lihat Sewa →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
