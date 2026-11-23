import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Receipt,
  ArrowLeft,
  Settings,
  LogOut,
  Calendar,
  CreditCard,
  Upload,
  RefreshCw,
  AlertCircle,
  X,
  CheckCircle2,
  Send
} from 'lucide-react';
import type { UserSession, TenantInvoice, WebsiteSettings } from '../api';
import {
  fetchTenantInvoices,
  fetchTenantDashboard,
  createTenantInvoiceCheckout,
  submitInvoicePaymentProof,
  isValidCheckoutUrl,
  loginTenant
} from '../api';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { LoginModal } from './LoginModal';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useSEO } from '../hooks/useSEO';
import { useI18n } from '../utils/i18n';

export interface InvoicesPageProps {
  session: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  settings?: WebsiteSettings | null;
}

export const InvoicesPage: React.FC<InvoicesPageProps> = ({
  session,
  onLoginSuccess,
  onLogout,
  settings
}) => {
  const navigate = useNavigate();
  const { t } = useI18n();

  useSEO({
    title: session ? `Tagihan Sewa - ${session.name} | Highlanderstay` : 'Tagihan Sewa & Pembayaran | Highlanderstay',
    description: 'Bayar sewa kamar kos secara online instan dengan QRIS, Virtual Account bank, atau upload bukti transfer resmi di Highlanderstay.',
    keywords: 'tagihan sewa kos, bayar kos online, doku jokul kos, bukti transfer sewa, invoice kos jakarta',
    canonicalUrl: 'https://highlanderstay.com/tagihan',
    enabled: true
  });

  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [totalOutstanding, setTotalOutstanding] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // DOKU Jokul Checkout State
  const [dokuLoadingInvoiceId, setDokuLoadingInvoiceId] = useState<number | null>(null);
  const [dokuErrorMessage, setDokuErrorMessage] = useState<string | null>(null);

  // Payment Proof Modal State
  const [payingInvoice, setPayingInvoice] = useState<TenantInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Unauthenticated login state
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [quickLoginPhone, setQuickLoginPhone] = useState('');
  const [quickLoginPassword, setQuickLoginPassword] = useState('');
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const [quickLoginError, setQuickLoginError] = useState('');

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
        const monthIndex = parseInt(m, 10) - 1;
        const dayNum = parseInt(d, 10);
        if (monthIndex >= 0 && monthIndex < 12) {
          return `${dayNum} ${monthNames[monthIndex]} ${y}`;
        }
      }
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

  const loadInvoicesData = useCallback(async (filter = invoiceFilter) => {
    if (!session?.token) return;
    setIsLoading(true);
    setErrorMessage('');
    try {
      const [invRes, dashRes] = await Promise.all([
        fetchTenantInvoices(session.token, { status: filter }),
        fetchTenantDashboard(session.token).catch(() => null)
      ]);

      if (invRes?.invoices?.data) {
        setInvoices(invRes.invoices.data);
      }

      if (dashRes?.account_summary?.total_outstanding_amount !== undefined) {
        setTotalOutstanding(dashRes.account_summary.total_outstanding_amount);
      } else {
        const total = (invRes?.invoices?.data || [])
          .filter((i: TenantInvoice) => i.status === 'unpaid' || i.status === 'overdue')
          .reduce((acc: number, curr: TenantInvoice) => acc + (curr.outstanding || curr.total || 0), 0);
        setTotalOutstanding(total);
      }
    } catch (err: any) {
      console.error('Error loading invoices:', err);
      setErrorMessage(err?.message || 'Gagal memuat daftar tagihan.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.token, invoiceFilter]);

  useEffect(() => {
    if (session?.token) {
      loadInvoicesData(invoiceFilter);
    }
  }, [session?.token, invoiceFilter, loadInvoicesData]);

  const handleFilterChange = (f: 'all' | 'unpaid' | 'paid' | 'overdue') => {
    setInvoiceFilter(f);
  };

  const handleDokuCheckout = async (inv: TenantInvoice) => {
    if (!session?.token) return;
    setDokuLoadingInvoiceId(inv.id);
    setDokuErrorMessage(null);
    try {
      sessionStorage.setItem(
        'pending_doku_checkout',
        JSON.stringify({
          invoiceId: inv.id,
          reference: inv.reference,
          amount: inv.outstanding || inv.total,
          timestamp: Date.now()
        })
      );

      const res = await createTenantInvoiceCheckout(inv.id, session.token);
      if (isValidCheckoutUrl(res?.checkout_url)) {
        window.location.href = res.checkout_url!;
      } else {
        throw new Error(res?.message || 'Tautan pembayaran resmi DOKU belum tersedia dari server.');
      }
    } catch (err: any) {
      console.error('DOKU Checkout error:', err);
      setDokuErrorMessage(err?.message || 'Gagal memulai pembayaran DOKU. Silakan coba lagi.');
      setDokuLoadingInvoiceId(null);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token || !payingInvoice) return;
    if (paymentAmount <= 0) {
      setPaymentMessage({ type: 'error', text: 'Nominal pembayaran harus lebih dari 0.' });
      return;
    }

    setIsSubmittingPayment(true);
    setPaymentMessage(null);
    try {
      const res = await submitInvoicePaymentProof(
        {
          invoiceId: payingInvoice.id,
          amount: paymentAmount,
          payment_method: paymentMethod,
          payment_date: paymentDate,
          notes: paymentNotes || undefined,
          proof_image: proofImage || undefined
        },
        session.token
      );

      setPaymentMessage({
        type: 'success',
        text: res.message || 'Bukti pembayaran berhasil dikirim! Menunggu verifikasi admin.'
      });

      setTimeout(() => {
        setPayingInvoice(null);
        setProofImage(null);
        setPaymentNotes('');
        setPaymentMessage(null);
        loadInvoicesData(invoiceFilter);
      }, 1800);
    } catch (err: any) {
      setPaymentMessage({ type: 'error', text: err.message || 'Gagal mengirim bukti pembayaran.' });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLoginPhone.trim() || !quickLoginPassword) {
      setQuickLoginError('Email dan kata sandi wajib diisi.');
      return;
    }
    setIsQuickLoggingIn(true);
    setQuickLoginError('');
    try {
      const response = await loginTenant({
        login: quickLoginPhone.trim(),
        password: quickLoginPassword
      });
      if (response?.session) {
        onLoginSuccess(response.session);
      }
    } catch (err: any) {
      setQuickLoginError(err?.message || 'Login gagal. Silakan periksa kembali email dan kata sandi.');
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  const unpaidCount = invoices.filter((i) => i.status === 'unpaid' || i.status === 'overdue').length;

  return (
    <div className="min-h-screen bg-[#070a12] text-text-primary flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      <Navbar
        activeSection="tagihan"
        onNavClick={(sec) => {
          if (sec === 'home') navigate('/');
          else if (sec === 'work' || sec === 'katalog') navigate('/katalog');
          else if (sec === 'map') navigate('/map');
          else if (sec === 'resort') navigate('/resort');
          else if (sec === 'cart') navigate('/cart');
          else if (sec === 'akun') navigate('/akun');
          else navigate('/');
        }}
        session={session}
        onLogout={onLogout}
        onLoginClick={() => setLoginModalOpen(true)}
        onProfileClick={() => navigate('/akun')}
        onCartClick={() => navigate('/cart')}
        settings={settings}
      />

      <main className="flex-1 w-full max-w-5xl mx-auto pt-20 sm:pt-24 md:pt-28 pb-28 px-3.5 sm:px-6">
        {/* Header Breadcrumb */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Link
              to="/akun"
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              title="Kembali ke Menu Akun"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
                <span>Tagihan Sewa & Pembayaran</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Billing
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Kelola pembayaran sewa kamar melalui pembayaran instan DOKU atau transfer manual
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent('hs-open-settings'))}
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              title="Pengaturan"
            >
              <Settings size={16} />
            </button>
            {session && (
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                <LogOut size={14} />
                <span className="hidden xs:inline">{t('portal_logout_btn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Unauthenticated View */}
        {!session ? (
          <div className="max-w-xl mx-auto my-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
                <Receipt size={32} />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Lihat Tagihan Sewa Anda</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Masuk ke akun Anda untuk mengecek riwayat invoice, jatuh tempo sewa, dan melakukan pembayaran online resmi.
              </p>

              <div className="mb-5">
                <GoogleSignInButton
                  text="continue"
                  onSuccess={(sess) => onLoginSuccess(sess)}
                  clientId={settings?.google_client_id}
                />
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">atau dengan Email & Password</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
              </div>

              <form onSubmit={handleQuickLogin} className="space-y-3.5 text-left mb-6">
                {quickLoginError && (
                  <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle size={15} className="shrink-0" />
                    <span>{quickLoginError}</span>
                  </div>
                )}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Alamat Email</label>
                  <input
                    type="email"
                    value={quickLoginPhone}
                    onChange={(e) => setQuickLoginPhone(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kata Sandi</label>
                  <input
                    type="password"
                    value={quickLoginPassword}
                    onChange={(e) => setQuickLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isQuickLoggingIn}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isQuickLoggingIn ? 'Memproses Masuk...' : 'Masuk Sekarang'}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Outstanding Summary Hero Card */}
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-[#0e1320] border border-slate-800 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard size={14} className="text-amber-400" />
                  <span>Total Tagihan Belum Dibayar</span>
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                  {formatRupiah(totalOutstanding)}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  {unpaidCount > 0
                    ? `${unpaidCount} invoice aktif membutuhkan penyelesaian`
                    : 'Semua tagihan sewa Anda telah lunas'}
                </p>
              </div>

              {unpaidCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleFilterChange('unpaid')}
                  className="px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer self-start sm:self-center"
                >
                  Lihat Invoice Menunggu
                </button>
              )}
            </div>

            {/* DOKU Error Banner if any */}
            {dokuErrorMessage && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{dokuErrorMessage}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDokuErrorMessage(null)}
                  className="p-1 hover:bg-rose-500/20 rounded cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {(['all', 'unpaid', 'paid', 'overdue'] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => handleFilterChange(f)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                    invoiceFilter === f
                      ? 'bg-amber-400 text-slate-950 shadow-sm'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {f === 'all'
                    ? 'Semua Tagihan'
                    : f === 'unpaid'
                    ? 'Belum Bayar'
                    : f === 'paid'
                    ? 'Lunas'
                    : 'Jatuh Tempo'}
                </button>
              ))}
            </div>

            {/* Invoices List */}
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span>Memuat data tagihan...</span>
              </div>
            ) : errorMessage ? (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  type="button"
                  onClick={() => loadInvoicesData(invoiceFilter)}
                  className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-bold"
                >
                  Coba Lagi
                </button>
              </div>
            ) : invoices.length === 0 ? (
              <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2.5 shadow-xl">
                <Receipt size={36} className="text-slate-600 mx-auto" />
                <div className="text-sm sm:text-base font-bold text-white">Tidak Ada Tagihan</div>
                <p className="text-xs text-slate-400">
                  Tidak ada catatan invoice pada kategori filter ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-lg space-y-3 hover:border-slate-700 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div>
                        <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                          #{inv.reference || inv.id}
                        </span>
                        <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                          Tagihan Sewa Kamar
                        </h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <Calendar size={12} className="text-slate-500" />
                          <span>Jatuh Tempo: {formatDate(inv.due_date)}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3">
                        <div className="text-left sm:text-right">
                          <div className="text-sm sm:text-base font-black text-white">
                            {formatRupiah(inv.outstanding || inv.total)}
                          </div>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${
                              inv.status === 'paid'
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : inv.status === 'overdue'
                                ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {inv.status === 'paid'
                              ? 'Lunas'
                              : inv.status === 'overdue'
                              ? 'Jatuh Tempo'
                              : 'Belum Bayar'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Pay Actions for unpaid or overdue invoices */}
                    {(inv.status === 'unpaid' || inv.status === 'overdue') && (
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80 flex-wrap">
                        <button
                          type="button"
                          onClick={() => {
                            setPayingInvoice(inv);
                            setPaymentAmount(inv.outstanding || inv.total || 0);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Upload size={13} />
                          <span>Upload Bukti Transfer</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDokuCheckout(inv)}
                          disabled={dokuLoadingInvoiceId === inv.id}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                        >
                          {dokuLoadingInvoiceId === inv.id ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Menghubungkan...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={13} />
                              <span>Bayar Instan (DOKU Jokul)</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Manual Payment Proof Modal */}
      <AnimatePresence>
        {payingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white">Upload Bukti Transfer</h3>
                  <p className="text-xs text-slate-400">Invoice #{payingInvoice.reference || payingInvoice.id}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPayingInvoice(null);
                    setPaymentMessage(null);
                  }}
                  className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              {paymentMessage && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    paymentMessage.type === 'success'
                      ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                      : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                  }`}
                >
                  {paymentMessage.type === 'success' ? (
                    <CheckCircle2 size={15} className="shrink-0" />
                  ) : (
                    <AlertCircle size={15} className="shrink-0" />
                  )}
                  <span>{paymentMessage.text}</span>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Nominal yang Ditransfer (Rp)</label>
                  <input
                    type="number"
                    value={paymentAmount || ''}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                  >
                    <option value="bank_transfer">Transfer Bank (BCA / Mandiri / BNI / BRI)</option>
                    <option value="e_wallet">E-Wallet (GoPay / OVO / Dana / ShopeePay)</option>
                    <option value="cash">Tunai / Cash ke Pengelola</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Tanggal Bayar</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm focus:border-amber-400 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Foto / Screenshot Bukti Struk</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProofImage(e.target.files[0]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-slate-300 file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-slate-950 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Catatan Tambahan (Opsional)</label>
                  <textarea
                    rows={2}
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Contoh: Transfer atas nama Budi via BCA"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs focus:border-amber-400 focus:outline-none resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayingInvoice(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/20 transition-all flex items-center gap-1.5 disabled:opacity-60"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send size={13} />
                        <span>Kirim Bukti</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer settings={settings} />

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onLoginSuccess={(sess: UserSession) => {
          onLoginSuccess(sess);
          setLoginModalOpen(false);
        }}
      />
    </div>
  );
};
