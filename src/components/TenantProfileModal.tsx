import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Phone, 
  Mail, 
  ShieldCheck, 
  AlertCircle, 
  LogOut, 
  CheckCircle2, 
  Building2, 
  Calendar, 
  CreditCard, 
  Wrench, 
  Clock, 
  Plus, 
  Upload, 
  RefreshCw, 
  AlertTriangle, 
  Receipt, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import type { 
  UserSession, 
  TenantDashboardData, 
  TenantLease, 
  TenantInvoice, 
  MaintenanceTicket 
} from '../api';
import { 
  sendPhoneOtp, 
  verifyPhoneOtp, 
  fetchTenantDashboard, 
  fetchTenantLeases, 
  fetchTenantInvoices, 
  createTenantInvoiceCheckout,
  submitInvoicePaymentProof, 
  fetchMaintenanceTickets, 
  createMaintenanceTicket 
} from '../api';

interface TenantProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: UserSession | null;
  onLogout: () => void;
  onSessionUpdate?: (updatedSession: UserSession) => void;
}

type DashboardTab = 'overview' | 'leases' | 'invoices' | 'maintenance' | 'profile';

export const TenantProfileModal: React.FC<TenantProfileModalProps> = ({
  isOpen,
  onClose,
  session,
  onLogout,
  onSessionUpdate
}) => {
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<TenantDashboardData | null>(null);
  const [leases, setLeases] = useState<TenantLease[]>([]);
  const [leaseHistory, setLeaseHistory] = useState<TenantLease[]>([]);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Payment Proof Modal State
  const [payingInvoice, setPayingInvoice] = useState<TenantInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<string>('bank_transfer');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [proofImage, setProofImage] = useState<File | null>(null);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paymentMessage, setPaymentMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // DOKU Jokul Checkout State
  const [dokuLoadingInvoiceId, setDokuLoadingInvoiceId] = useState<number | null>(null);
  const [dokuErrorMessage, setDokuErrorMessage] = useState<string | null>(null);

  // Maintenance Ticket Modal State
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketLocation, setTicketLocation] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketMessage, setTicketMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone Verification in Profile Tab
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

  // Format currency helper
  const formatRupiah = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date helper
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

  // Load tenant portal data
  const loadPortalData = useCallback(async () => {
    if (!session?.token) return;
    setIsLoading(true);
    setLoadError('');

    try {
      // 1. Fetch Dashboard Overview
      const dashRes = await fetchTenantDashboard(session.token).catch((err) => {
        console.warn('Dashboard fetch notice:', err.message);
        return null;
      });
      if (dashRes) {
        setDashboardData(dashRes);
        if (dashRes.recent_invoices) setInvoices(dashRes.recent_invoices);
        if (dashRes.recent_tickets) setTickets(dashRes.recent_tickets);
      }

      // 2. Fetch Leases
      const leasesRes = await fetchTenantLeases(session.token).catch(() => null);
      if (leasesRes) {
        setLeases(leasesRes.current_leases || []);
        setLeaseHistory(leasesRes.lease_history || []);
      }

      // 3. Fetch Invoices
      const invoicesRes = await fetchTenantInvoices(session.token, { status: invoiceFilter }).catch(() => null);
      if (invoicesRes?.invoices?.data) {
        setInvoices(invoicesRes.invoices.data);
      }

      // 4. Fetch Maintenance Tickets
      const ticketsRes = await fetchMaintenanceTickets(session.token).catch(() => null);
      if (ticketsRes?.tickets?.data) {
        setTickets(ticketsRes.tickets.data);
      }
    } catch (err: any) {
      console.error('Portal load error:', err);
      setLoadError('Gagal memuat beberapa data dashboard. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  }, [session?.token, invoiceFilter]);

  useEffect(() => {
    if (isOpen && session?.token) {
      loadPortalData();
    }
  }, [isOpen, session?.token, loadPortalData]);

  // Handle invoice filter change
  const handleFilterChange = async (filter: 'all' | 'unpaid' | 'paid' | 'overdue') => {
    setInvoiceFilter(filter);
    if (!session?.token) return;
    try {
      const res = await fetchTenantInvoices(session.token, { status: filter });
      if (res?.invoices?.data) {
        setInvoices(res.invoices.data);
      }
    } catch (err: any) {
      console.error('Filter invoice error:', err);
    }
  };

  // Submit Payment Proof
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
          proof_image: proofImage,
          payment_date: paymentDate,
          notes: paymentNotes
        },
        session.token
      );

      setPaymentMessage({ 
        type: 'success', 
        text: res.message || 'Bukti pembayaran berhasil dikirimkan! Menunggu verifikasi manajemen.' 
      });

      // Reload invoices
      setTimeout(() => {
        setPayingInvoice(null);
        setProofImage(null);
        setPaymentNotes('');
        setPaymentMessage(null);
        loadPortalData();
      }, 1800);
    } catch (err: any) {
      setPaymentMessage({ type: 'error', text: err.message || 'Gagal mengirimkan bukti pembayaran.' });
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Initiate DOKU Jokul Checkout
  const handleDokuOnlinePayment = async (inv: TenantInvoice) => {
    if (!session?.token) return;
    setDokuLoadingInvoiceId(inv.id);
    setDokuErrorMessage(null);

    try {
      // Save pending context in sessionStorage so we can verify status upon callback return
      sessionStorage.setItem('pending_doku_checkout', JSON.stringify({
        invoiceId: inv.id,
        reference: inv.reference,
        amount: inv.outstanding || inv.total,
        timestamp: Date.now()
      }));

      const res = await createTenantInvoiceCheckout(inv.id, session.token);
      if (res?.checkout_url) {
        window.location.href = res.checkout_url;
      } else {
        throw new Error(res?.message || 'URL checkout DOKU tidak ditemukan dalam respon server.');
      }
    } catch (err: any) {
      console.error('DOKU Checkout error:', err);
      setDokuErrorMessage(err?.message || 'Gagal memulai pembayaran DOKU. Silakan coba lagi nanti.');
      setDokuLoadingInvoiceId(null);
    }
  };

  // Submit Maintenance Ticket
  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) return;
    if (!ticketTitle.trim() || !ticketDescription.trim()) {
      setTicketMessage({ type: 'error', text: 'Judul dan deskripsi keluhan wajib diisi.' });
      return;
    }

    setIsSubmittingTicket(true);
    setTicketMessage(null);
    try {
      const res = await createMaintenanceTicket(
        {
          title: ticketTitle.trim(),
          description: ticketDescription.trim(),
          location: ticketLocation.trim() || undefined,
          priority: ticketPriority
        },
        session.token
      );

      setTicketMessage({
        type: 'success',
        text: res.message || 'Tiket kendala berhasil diajukan! Petugas kami akan segera menindaklanjuti.'
      });

      setTimeout(() => {
        setShowCreateTicket(false);
        setTicketTitle('');
        setTicketDescription('');
        setTicketLocation('');
        setTicketMessage(null);
        loadPortalData();
      }, 1600);
    } catch (err: any) {
      setTicketMessage({ type: 'error', text: err.message || 'Gagal mengajukan tiket kendala.' });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // OTP Countdown timer
  useEffect(() => {
    let timer: any;
    if (otpCountdown > 0) {
      timer = setInterval(() => {
        setOtpCountdown(prev => (prev <= 1 ? 0 : prev - 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  // Send WhatsApp OTP
  const handleSendOtp = async () => {
    if (!session?.token) return;
    setOtpError('');
    setOtpSuccess('');
    setIsSendingOtp(true);
    try {
      const res = await sendPhoneOtp({
        login: session.phone || session.email || '',
        channel: 'whatsapp'
      }, session.token);
      setIsVerifyingPhone(true);
      setOtpSuccess(res.message || 'Kode OTP telah dikirimkan ke WhatsApp Anda.');
      setOtpCountdown(60);
    } catch (err: any) {
      setOtpError(err.message || 'Gagal mengirim kode OTP.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Verify WhatsApp OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) return;
    if (!otpCode || otpCode.trim().length < 4) {
      setOtpError('Masukkan 6 digit kode OTP yang valid.');
      return;
    }

    setIsSubmittingOtp(true);
    setOtpError('');
    try {
      const { session: verifiedSession, response } = await verifyPhoneOtp({
        login: session.phone || session.email || '',
        code: otpCode.trim()
      }, session.token);

      setOtpSuccess(response.message || 'Nomor WhatsApp berhasil diverifikasi!');
      const updated: UserSession = {
        ...session,
        ...verifiedSession,
        token: session.token || verifiedSession.token,
        phone_verified: true,
        phone_verified_at: response.user?.phone_verified_at || new Date().toISOString()
      };
      if (onSessionUpdate) {
        onSessionUpdate(updated);
      }
      localStorage.setItem('userSession', JSON.stringify(updated));
      setTimeout(() => {
        setIsVerifyingPhone(false);
      }, 1500);
    } catch (err: any) {
      setOtpError(err.message || 'Kode OTP salah atau telah kadaluarsa.');
    } finally {
      setIsSubmittingOtp(false);
    }
  };

  if (!session) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-5">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.96, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full max-w-5xl bg-surface border border-stroke rounded-2xl sm:rounded-[28px] overflow-hidden shadow-2xl text-left flex flex-col h-[96vh] sm:h-auto max-h-[96vh]"
          >
            {/* Ambient glows */}
            <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />
            <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* TOP HEADER */}
            <div className="relative z-10 px-4 sm:px-6 py-3.5 sm:py-5 border-b border-stroke/50 bg-bg/40 flex flex-wrap items-center justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-text-primary text-bg flex items-center justify-center font-display italic font-bold text-lg shadow-md shrink-0">
                  {session.name ? session.name.charAt(0).toUpperCase() : 'P'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-display font-semibold text-text-primary">
                      {session.name || 'Penyewa Highlanderstay'}
                    </h2>
                    {session.phone_verified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                        <ShieldCheck size={11} /> Terverifikasi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-full">
                        <AlertTriangle size={11} /> Belum Verifikasi WA
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted mt-0.5 flex items-center gap-3">
                    <span>{session.phone || 'No WhatsApp belum ada'}</span>
                    {session.email && <span>• {session.email}</span>}
                  </p>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={loadPortalData}
                  disabled={isLoading}
                  className="p-2 text-muted hover:text-text-primary border border-stroke rounded-full transition-colors hover:bg-stroke/30"
                  title="Muat Ulang Data"
                >
                  <RefreshCw size={15} className={isLoading ? 'animate-spin' : ''} />
                </button>
                <button
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 rounded-full transition-colors"
                >
                  <LogOut size={13} /> Keluar
                </button>
                <button
                  onClick={onClose}
                  className="p-2 text-muted hover:text-text-primary text-lg transition-colors ml-1"
                  aria-label="Tutup"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* NAVIGATION TABS */}
            <div className="relative z-10 px-3 sm:px-6 pt-2.5 pb-2 border-b border-stroke/40 bg-surface/80 flex items-center gap-1.5 overflow-x-auto no-scrollbar touch-pan-x">
              <button
                onClick={() => setActiveTab('overview')}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'overview'
                    ? 'bg-text-primary text-bg shadow'
                    : 'text-muted hover:text-text-primary hover:bg-stroke/30'
                }`}
              >
                <Sparkles size={13} /> Ringkasan
              </button>

              <button
                onClick={() => setActiveTab('leases')}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'leases'
                    ? 'bg-text-primary text-bg shadow'
                    : 'text-muted hover:text-text-primary hover:bg-stroke/30'
                }`}
              >
                <Building2 size={13} /> Sewa Kamar
                {leases.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-blue-500 text-white font-mono">
                    {leases.length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('invoices')}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'invoices'
                    ? 'bg-text-primary text-bg shadow'
                    : 'text-muted hover:text-text-primary hover:bg-stroke/30'
                }`}
              >
                <CreditCard size={13} /> Tagihan & Pembayaran
                {invoices.filter(i => i.status !== 'paid').length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-500 text-bg font-bold font-mono">
                    {invoices.filter(i => i.status !== 'paid').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('maintenance')}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'maintenance'
                    ? 'bg-text-primary text-bg shadow'
                    : 'text-muted hover:text-text-primary hover:bg-stroke/30'
                }`}
              >
                <Wrench size={13} /> Layanan & Perbaikan
                {tickets.filter(t => t.status !== 'resolved').length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-bg font-bold font-mono">
                    {tickets.filter(t => t.status !== 'resolved').length}
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveTab('profile')}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap ${
                  activeTab === 'profile'
                    ? 'bg-text-primary text-bg shadow'
                    : 'text-muted hover:text-text-primary hover:bg-stroke/30'
                }`}
              >
                <User size={13} /> Profil Akun
              </button>
            </div>

            {/* TAB CONTENT BODY */}
            <div className="relative z-10 flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">

              {loadError && (
                <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs px-4 py-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={16} className="shrink-0" />
                    <span>{loadError}</span>
                  </div>
                  <button onClick={loadPortalData} className="text-xs font-bold underline hover:text-white">
                    Coba Lagi
                  </button>
                </div>
              )}

              {/* ===================== TAB 1: OVERVIEW ===================== */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3">
                    <div className="bg-bg/60 border border-stroke rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <div className="flex items-center justify-between text-muted mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Kamar Aktif</span>
                        <Building2 size={15} className="text-blue-400" />
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-text-primary truncate">
                        {dashboardData?.active_lease?.unit?.name || (leases[0]?.unit?.name ?? 'Belum ada sewa')}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-muted truncate mt-0.5">
                        {dashboardData?.active_lease?.property?.name || leases[0]?.property?.name || 'Status: Non-aktif'}
                      </div>
                    </div>

                    <div className="bg-bg/60 border border-stroke rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <div className="flex items-center justify-between text-muted mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Tagihan Belum Lunas</span>
                        <CreditCard size={15} className="text-amber-400" />
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-amber-400 truncate">
                        {formatRupiah(dashboardData?.account_summary?.total_outstanding_amount || 0)}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-muted mt-0.5 truncate">
                        {dashboardData?.account_summary?.total_unpaid_invoices || 0} tagihan menunggu
                      </div>
                    </div>

                    <div className="bg-bg/60 border border-stroke rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <div className="flex items-center justify-between text-muted mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Jatuh Tempo</span>
                        <Calendar size={15} className="text-emerald-400" />
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-text-primary truncate">
                        {formatDate(dashboardData?.account_summary?.next_due_date || dashboardData?.active_lease?.end_date)}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-muted mt-0.5 truncate">
                        Siklus: {dashboardData?.active_lease?.billing_label || 'Bulanan'}
                      </div>
                    </div>

                    <div className="bg-bg/60 border border-stroke rounded-xl sm:rounded-2xl p-3 sm:p-4">
                      <div className="flex items-center justify-between text-muted mb-1.5 sm:mb-2">
                        <span className="text-[10px] sm:text-[11px] uppercase tracking-wider font-semibold">Tiket Kendala</span>
                        <Wrench size={15} className="text-indigo-400" />
                      </div>
                      <div className="text-sm sm:text-lg font-bold text-text-primary">
                        {dashboardData?.account_summary?.open_maintenance_tickets || tickets.filter(t => t.status !== 'resolved').length}
                      </div>
                      <div className="text-[10px] sm:text-[11px] text-muted mt-0.5 truncate">
                        {tickets.length} total diajukan
                      </div>
                    </div>
                  </div>

                  {/* NEXT ACTION CALLOUT (if any) */}
                  {dashboardData?.next_action && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Receipt size={20} />
                        </div>
                        <div>
                          <div className="text-[10px] uppercase font-bold tracking-wider text-amber-400">Pemberitahuan Penting</div>
                          <h4 className="text-sm sm:text-base font-semibold text-text-primary mt-0.5">
                            {dashboardData.next_action.title}
                          </h4>
                          <p className="text-xs text-muted mt-0.5 max-w-xl">
                            {dashboardData.next_action.message}
                          </p>
                        </div>
                      </div>
                      {dashboardData.next_action.type === 'pay_invoice' && dashboardData.next_action.invoice_id && (
                        <button
                          onClick={() => {
                            const inv = invoices.find(i => i.id === dashboardData.next_action?.invoice_id);
                            if (inv) {
                              handleDokuOnlinePayment(inv);
                            } else {
                              setActiveTab('invoices');
                            }
                          }}
                          disabled={dokuLoadingInvoiceId === dashboardData.next_action.invoice_id}
                          className="px-4 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-bg hover:from-amber-300 hover:to-amber-400 rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {dokuLoadingInvoiceId === dashboardData.next_action.invoice_id ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-bg/40 border-t-bg rounded-full animate-spin" />
                              <span>Mempersiapkan DOKU...</span>
                            </>
                          ) : (
                            <>
                              <CreditCard size={13} />
                              <span>Bayar Online ({formatRupiah(dashboardData.next_action.amount)})</span>
                              <ArrowRight size={13} />
                            </>
                          )}
                        </button>
                      )}
                    </motion.div>
                  )}

                  {/* ACTIVE LEASE CARD */}
                  <div className="bg-bg/40 border border-stroke rounded-2xl p-5">
                    <div className="flex items-center justify-between border-b border-stroke/40 pb-3 mb-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                        <Building2 size={14} className="text-blue-400" />
                        Detail Kamar & Hunian Aktif
                      </div>
                      {dashboardData?.active_lease && (
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                          {dashboardData.active_lease.status}
                        </span>
                      )}
                    </div>

                    {dashboardData?.active_lease ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                          <span className="text-[11px] text-muted uppercase tracking-wider">Properti</span>
                          <div className="text-base font-bold text-text-primary">
                            {dashboardData.active_lease.property?.name}
                          </div>
                          <p className="text-xs text-muted">
                            {dashboardData.active_lease.property?.address}, {dashboardData.active_lease.property?.city}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] text-muted uppercase tracking-wider">Unit / Nomor Kamar</span>
                          <div className="text-base font-bold text-emerald-400">
                            {dashboardData.active_lease.unit?.name}
                          </div>
                          <p className="text-xs text-muted">
                            Biaya: {formatRupiah(dashboardData.active_lease.rent_amount)} / {dashboardData.active_lease.billing_label || 'Bulan'}
                          </p>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[11px] text-muted uppercase tracking-wider">Masa Sewa</span>
                          <div className="text-sm font-semibold text-text-primary">
                            {formatDate(dashboardData.active_lease.start_date)} — {formatDate(dashboardData.active_lease.end_date)}
                          </div>
                          <p className="text-xs text-muted font-mono">
                            Ref: {dashboardData.active_lease.reference}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6 text-muted">
                        <Building2 size={32} className="mx-auto text-stroke mb-2 opacity-50" />
                        <p className="text-xs">Belum ada sewa kamar aktif yang terhubung dengan akun ini.</p>
                        <p className="text-[11px] mt-1 text-muted/70">
                          Pesan kamar di beranda atau hubungi pengelola untuk mengaktifkan sewa Anda.
                        </p>
                      </div>
                    )}
                  </div>

                  {/* RECENT INVOICES & RECENT TICKETS SPLIT */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {/* Invoices Preview */}
                    <div className="bg-bg/40 border border-stroke rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-stroke/40 pb-3 mb-3">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                            <CreditCard size={14} className="text-amber-400" />
                            Tagihan Terbaru
                          </div>
                          <button
                            onClick={() => setActiveTab('invoices')}
                            className="text-xs text-emerald-400 hover:underline font-semibold"
                          >
                            Lihat Semua →
                          </button>
                        </div>

                        {invoices.length > 0 ? (
                          <div className="divide-y divide-stroke/30">
                            {invoices.slice(0, 3).map((inv) => (
                              <div key={inv.id} className="py-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-semibold text-text-primary font-mono">{inv.reference}</div>
                                  <div className="text-[11px] text-muted">Jatuh tempo: {formatDate(inv.due_date)}</div>
                                </div>
                                <div className="text-right">
                                  <div className="font-bold text-text-primary">{formatRupiah(inv.total)}</div>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                    inv.status === 'paid'
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : 'text-amber-400 bg-amber-500/10'
                                  }`}>
                                    {inv.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted py-4 text-center">Belum ada riwayat tagihan.</p>
                        )}
                      </div>
                    </div>

                    {/* Maintenance Tickets Preview */}
                    <div className="bg-bg/40 border border-stroke rounded-2xl p-5 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between border-b border-stroke/40 pb-3 mb-3">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted">
                            <Wrench size={14} className="text-indigo-400" />
                            Tiket Kendala Terbaru
                          </div>
                          <button
                            onClick={() => setActiveTab('maintenance')}
                            className="text-xs text-emerald-400 hover:underline font-semibold"
                          >
                            Lihat Semua →
                          </button>
                        </div>

                        {tickets.length > 0 ? (
                          <div className="divide-y divide-stroke/30">
                            {tickets.slice(0, 3).map((tkt) => (
                              <div key={tkt.id} className="py-2.5 flex items-center justify-between text-xs">
                                <div>
                                  <div className="font-semibold text-text-primary">{tkt.title}</div>
                                  <div className="text-[11px] text-muted">{tkt.location || 'Lokasi kamar'} • {formatDate(tkt.created_at)}</div>
                                </div>
                                <div className="text-right">
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${
                                    tkt.status === 'resolved'
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : 'text-blue-400 bg-blue-500/10'
                                  }`}>
                                    {tkt.status}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted py-4 text-center">Tidak ada laporan kendala aktif.</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setActiveTab('maintenance');
                          setShowCreateTicket(true);
                        }}
                        className="w-full mt-3 py-2 border border-stroke hover:border-text-primary rounded-xl text-xs text-text-primary font-semibold transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Plus size={13} /> Ajukan Keluhan / Kendala Baru
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* ===================== TAB 2: LEASES (SEWA KAMAR) ===================== */}
              {activeTab === 'leases' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <Building2 size={16} className="text-emerald-400" />
                      Sewa Kamar Aktif Saat Ini
                    </h3>
                    <p className="text-xs text-muted mt-0.5">Informasi unit kamar, kontrak sewa, dan properti Anda.</p>
                  </div>

                  {leases.length > 0 ? (
                    <div className="grid grid-cols-1 gap-4">
                      {leases.map((lease) => (
                        <div 
                          key={lease.id} 
                          className="bg-bg/50 border border-stroke rounded-2xl p-5 hover:border-stroke/80 transition-all"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke/40 pb-3 mb-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                                {lease.unit?.floor ? `Lt.${lease.unit.floor}` : 'KM'}
                              </div>
                              <div>
                                <h4 className="text-base font-bold text-text-primary">{lease.unit?.name}</h4>
                                <span className="text-xs text-muted font-mono">{lease.reference}</span>
                              </div>
                            </div>
                            <span className="text-xs font-semibold px-3 py-1 rounded-full uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              {lease.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                            <div>
                              <span className="text-muted block text-[11px] uppercase">Properti</span>
                              <strong className="text-text-primary block mt-0.5">{lease.property?.name}</strong>
                              <span className="text-muted block text-[11px] truncate">{lease.property?.address}</span>
                            </div>
                            <div>
                              <span className="text-muted block text-[11px] uppercase">Sewa Bulanan</span>
                              <strong className="text-emerald-400 block mt-0.5 text-sm">{formatRupiah(lease.rent_amount)}</strong>
                              <span className="text-muted block text-[11px]">Siklus: {lease.billing_cycle || 'Bulanan'}</span>
                            </div>
                            <div>
                              <span className="text-muted block text-[11px] uppercase">Tanggal Mulai</span>
                              <strong className="text-text-primary block mt-0.5">{formatDate(lease.start_date)}</strong>
                            </div>
                            <div>
                              <span className="text-muted block text-[11px] uppercase">Tanggal Berakhir</span>
                              <strong className="text-text-primary block mt-0.5">{formatDate(lease.end_date)}</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-bg/30 border border-stroke rounded-2xl p-8 text-center text-muted">
                      <Building2 size={36} className="mx-auto mb-2 opacity-40 text-stroke" />
                      <h4 className="text-sm font-semibold text-text-primary">Belum Ada Kontrak Sewa Aktif</h4>
                      <p className="text-xs mt-1 max-w-md mx-auto">
                        Setelah Anda melakukan pemesanan kamar dan diverifikasi oleh manajemen, data sewa kamar Anda akan tampil di sini.
                      </p>
                    </div>
                  )}

                  {/* Lease History */}
                  {leaseHistory.length > 0 && (
                    <div className="pt-4 border-t border-stroke/40">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-muted mb-3">Riwayat Sewa Lalu</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {leaseHistory.map((pastLease) => (
                          <div key={pastLease.id} className="bg-bg/30 border border-stroke/40 rounded-xl p-4 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-semibold text-text-primary">{pastLease.unit?.name} • {pastLease.property?.name}</div>
                              <div className="text-muted">{formatDate(pastLease.start_date)} s/d {formatDate(pastLease.end_date)}</div>
                            </div>
                            <span className="text-muted uppercase text-[10px] bg-stroke/30 px-2 py-0.5 rounded-full">
                              Selesai
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ===================== TAB 3: INVOICES (TAGIHAN & PEMBAYARAN) ===================== */}
              {activeTab === 'invoices' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <CreditCard size={16} className="text-amber-400" />
                        Daftar Tagihan & Pembayaran
                      </h3>
                      <p className="text-xs text-muted mt-0.5">Pantau status tagihan sewa Anda dan kirimkan bukti transfer.</p>
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1 bg-bg/70 p-1 border border-stroke rounded-full">
                      {(['all', 'unpaid', 'paid', 'overdue'] as const).map((filterKey) => (
                        <button
                          key={filterKey}
                          onClick={() => handleFilterChange(filterKey)}
                          className={`text-xs font-semibold px-3 py-1 rounded-full capitalize transition-colors ${
                            invoiceFilter === filterKey
                              ? 'bg-text-primary text-bg shadow'
                              : 'text-muted hover:text-text-primary'
                          }`}
                        >
                          {filterKey === 'all' ? 'Semua' : filterKey === 'unpaid' ? 'Belum Bayar' : filterKey === 'paid' ? 'Lunas' : 'Terlambat'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Error Alert for DOKU */}
                  {dokuErrorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-400 text-xs flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={15} className="shrink-0" />
                        <span>{dokuErrorMessage}</span>
                      </div>
                      <button onClick={() => setDokuErrorMessage(null)} className="hover:text-white font-bold">✕</button>
                    </div>
                  )}

                  {/* Invoices List */}
                  {invoices.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3.5">
                      {invoices.map((inv) => (
                        <div 
                          key={inv.id} 
                          className="bg-bg/50 border border-stroke rounded-2xl p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 hover:border-stroke/80 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                              <Receipt size={20} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-text-primary">{inv.reference}</span>
                                <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                                  inv.status === 'paid'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : inv.is_overdue || inv.status === 'overdue'
                                    ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                }`}>
                                  {inv.status === 'paid' ? 'Lunas' : inv.status === 'pending' ? 'Menunggu Pembayaran' : inv.status}
                                </span>
                              </div>
                              <p className="text-xs text-muted mt-1">
                                {inv.property_name || 'Kamar Kos'} • {inv.unit_name || ''}
                              </p>
                              <p className="text-[11px] text-muted flex items-center gap-2 mt-0.5">
                                <Clock size={12} />
                                Jatuh Tempo: <strong className="text-text-primary">{formatDate(inv.due_date)}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <div className="text-[11px] text-muted uppercase tracking-wider">Total Tagihan</div>
                              <div className="text-base font-bold text-text-primary">{formatRupiah(inv.total)}</div>
                              {inv.outstanding > 0 && inv.status !== 'paid' && (
                                <div className="text-[11px] text-rose-400 font-medium">
                                  Sisa: {formatRupiah(inv.outstanding)}
                                </div>
                              )}
                            </div>

                            {inv.status !== 'paid' ? (
                              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                                <button
                                  onClick={() => handleDokuOnlinePayment(inv)}
                                  disabled={dokuLoadingInvoiceId === inv.id}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-bg rounded-full text-xs font-bold transition-all shadow-md flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                                >
                                  {dokuLoadingInvoiceId === inv.id ? (
                                    <>
                                      <div className="w-3.5 h-3.5 border-2 border-bg/40 border-t-bg rounded-full animate-spin" />
                                      <span>Mempersiapkan...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CreditCard size={13} />
                                      <span>Bayar Online (DOKU)</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setPayingInvoice(inv);
                                    setPaymentAmount(inv.outstanding || inv.total);
                                    setPaymentMethod('bank_transfer');
                                    setPaymentMessage(null);
                                  }}
                                  className="px-3 py-1.5 border border-stroke hover:border-text-primary text-text-primary rounded-full text-[11px] font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Upload bukti transfer bank / tunai manual"
                                >
                                  <Upload size={12} />
                                  <span>Bukti Manual</span>
                                </button>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-400 font-semibold px-3 py-1.5 bg-emerald-500/10 rounded-full">
                                <CheckCircle2 size={14} /> Terbayar
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-bg/30 border border-stroke rounded-2xl p-8 text-center text-muted">
                      <Receipt size={36} className="mx-auto mb-2 opacity-40 text-stroke" />
                      <h4 className="text-sm font-semibold text-text-primary">Tidak Ada Tagihan Ditemukan</h4>
                      <p className="text-xs mt-1">Belum ada data tagihan untuk kategori yang Anda pilih.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===================== TAB 4: MAINTENANCE (LAYANAN & PERBAIKAN) ===================== */}
              {activeTab === 'maintenance' && (
                <div className="space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <Wrench size={16} className="text-indigo-400" />
                        Tiket Layanan & Keluhan Kamar
                      </h3>
                      <p className="text-xs text-muted mt-0.5">Laporkan kendala fasilitas kamar atau hunian kepada tim pengelola.</p>
                    </div>

                    <button
                      onClick={() => {
                        setShowCreateTicket(true);
                        setTicketMessage(null);
                      }}
                      className="px-4 py-2 bg-text-primary text-bg hover:bg-white/90 rounded-full text-xs font-bold transition-all shadow flex items-center gap-1.5"
                    >
                      <Plus size={14} /> Ajukan Tiket Baru
                    </button>
                  </div>

                  {/* Tickets List */}
                  {tickets.length > 0 ? (
                    <div className="grid grid-cols-1 gap-3.5">
                      {tickets.map((ticket) => (
                        <div 
                          key={ticket.id} 
                          className="bg-bg/50 border border-stroke rounded-2xl p-4 sm:p-5 hover:border-stroke/80 transition-all"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke/40 pb-2.5 mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-text-primary">{ticket.reference}</span>
                              <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                                ticket.priority === 'urgent'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                                  : ticket.priority === 'high'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              }`}>
                                Prioritas: {ticket.priority}
                              </span>
                            </div>
                            <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                              ticket.status === 'resolved'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : ticket.status === 'in_progress'
                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                : 'bg-stroke/40 text-muted'
                            }`}>
                              Status: {ticket.status === 'reported' ? 'Dilaporkan' : ticket.status === 'in_progress' ? 'Diproses' : ticket.status === 'resolved' ? 'Selesai' : ticket.status}
                            </span>
                          </div>

                          <h4 className="text-sm font-bold text-text-primary">{ticket.title}</h4>
                          <p className="text-xs text-muted mt-1 leading-relaxed">{ticket.description}</p>

                          <div className="flex items-center justify-between text-[11px] text-muted pt-3 mt-3 border-t border-stroke/30">
                            <span>Lokasi: <strong className="text-text-primary">{ticket.location || 'Kamar'}</strong></span>
                            <span>Diajukan: {formatDate(ticket.created_at)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-bg/30 border border-stroke rounded-2xl p-8 text-center text-muted">
                      <Wrench size={36} className="mx-auto mb-2 opacity-40 text-stroke" />
                      <h4 className="text-sm font-semibold text-text-primary">Tidak Ada Laporan Kendala</h4>
                      <p className="text-xs mt-1">Semua fasilitas kamar Anda dalam kondisi baik tanpa laporan kendala.</p>
                    </div>
                  )}
                </div>
              )}

              {/* ===================== TAB 5: PROFILE & VERIFICATION ===================== */}
              {activeTab === 'profile' && (
                <div className="space-y-6 max-w-2xl">
                  <div>
                    <h3 className="text-base font-bold text-text-primary flex items-center gap-2">
                      <User size={16} className="text-emerald-400" />
                      Informasi Profil Akun Penyewa
                    </h3>
                    <p className="text-xs text-muted mt-0.5">Kelola informasi kontak dan verifikasi keamanan akun Anda.</p>
                  </div>

                  <div className="bg-bg/50 border border-stroke rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted uppercase tracking-wider font-semibold">Nama Lengkap</label>
                      <div className="text-sm font-semibold text-text-primary bg-bg/80 border border-stroke/60 rounded-xl px-4 py-2.5">
                        {session.name || 'Belum diisi'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted uppercase tracking-wider font-semibold">Nomor WhatsApp</label>
                      <div className="flex items-center justify-between bg-bg/80 border border-stroke/60 rounded-xl px-4 py-2.5">
                        <div className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                          <Phone size={14} className="text-muted" />
                          <span>{session.phone || 'Belum terdaftar'}</span>
                        </div>
                        {session.phone_verified ? (
                          <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                            <ShieldCheck size={14} /> Terverifikasi
                          </span>
                        ) : (
                          <button
                            onClick={handleSendOtp}
                            disabled={isSendingOtp}
                            className="text-xs text-amber-400 hover:underline font-semibold"
                          >
                            {isSendingOtp ? 'Mengirim...' : 'Verifikasi Sekarang →'}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted uppercase tracking-wider font-semibold">Alamat Email</label>
                      <div className="flex items-center gap-2 text-sm text-text-primary bg-bg/80 border border-stroke/60 rounded-xl px-4 py-2.5">
                        <Mail size={14} className="text-muted" />
                        <span>{session.email || 'Email belum ditautkan'}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="text-xs text-muted uppercase tracking-wider font-semibold">ID Akun Penyewa</label>
                      <div className="text-xs font-mono text-muted bg-bg/80 border border-stroke/60 rounded-xl px-4 py-2.5">
                        #{session.id || 'N/A'} (Sanctum Tenant Token Aktif)
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp OTP Verification Box if unverified */}
                  {isVerifyingPhone && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 space-y-3"
                    >
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <ShieldCheck size={14} /> Masukkan Kode OTP WhatsApp
                      </h4>
                      <p className="text-xs text-muted">
                        Kode 6 digit telah dikirimkan ke nomor WhatsApp {session.phone}.
                      </p>

                      {otpError && <p className="text-xs text-rose-400">{otpError}</p>}
                      {otpSuccess && <p className="text-xs text-emerald-400">{otpSuccess}</p>}

                      <form onSubmit={handleVerifyOtp} className="flex flex-wrap items-center gap-3">
                        <input
                          type="text"
                          maxLength={6}
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••••"
                          className="bg-bg border border-stroke rounded-xl px-3 py-2 text-center text-lg font-mono tracking-widest text-text-primary focus:outline-none w-36"
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingOtp || otpCode.length < 4}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-bg rounded-xl text-xs font-bold transition-colors disabled:opacity-50"
                        >
                          {isSubmittingOtp ? 'Memverifikasi...' : 'Verifikasi OTP'}
                        </button>
                        {otpCountdown > 0 ? (
                          <span className="text-xs text-muted">Kirim ulang ({otpCountdown}d)</span>
                        ) : (
                          <button
                            type="button"
                            onClick={handleSendOtp}
                            disabled={isSendingOtp}
                            className="text-xs text-emerald-400 hover:underline"
                          >
                            Kirim Ulang
                          </button>
                        )}
                      </form>
                    </motion.div>
                  )}
                </div>
              )}

            </div>

            {/* ===================== SUB-MODAL: SUBMIT PAYMENT PROOF ===================== */}
            <AnimatePresence>
              {payingInvoice && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setPayingInvoice(null)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-md bg-surface border border-stroke rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-2xl z-20 space-y-4 max-h-[92vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between border-b border-stroke/40 pb-3">
                      <div>
                        <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                          <Upload size={16} className="text-emerald-400" />
                          Unggah Bukti Pembayaran
                        </h4>
                        <span className="text-xs text-muted font-mono">{payingInvoice.reference}</span>
                      </div>
                      <button
                        onClick={() => setPayingInvoice(null)}
                        className="text-muted hover:text-text-primary text-lg"
                      >
                        ✕
                      </button>
                    </div>

                    {/* DOKU Instant Checkout Suggestion Banner */}
                    <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                      <div>
                        <div className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                          <CreditCard size={14} />
                          <span>Bayar Lebih Praktis & Otomatis</span>
                        </div>
                        <p className="text-[10px] text-muted mt-0.5 leading-snug">
                          Gunakan DOKU Jokul Checkout untuk pembayaran instan via QRIS atau Virtual Account tanpa repot unggah struk.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const inv = payingInvoice;
                          setPayingInvoice(null);
                          handleDokuOnlinePayment(inv);
                        }}
                        className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-bg rounded-full text-[11px] font-bold shrink-0 transition-colors cursor-pointer shadow-sm"
                      >
                        Bayar Online DOKU →
                      </button>
                    </div>

                    {paymentMessage && (
                      <div className={`text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 ${
                        paymentMessage.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        {paymentMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        <span>{paymentMessage.text}</span>
                      </div>
                    )}

                    <form onSubmit={handlePaymentSubmit} className="space-y-3.5 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-muted font-semibold">Nominal Pembayaran (Rp)</label>
                        <input
                          type="number"
                          required
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(Number(e.target.value))}
                          className="w-full bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-base sm:text-sm text-text-primary font-bold focus:outline-none focus:border-text-primary"
                        />
                        <span className="text-[10px] text-muted">
                          Sisa tagihan: {formatRupiah(payingInvoice.outstanding || payingInvoice.total)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-muted font-semibold">Metode Pembayaran</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-text-primary focus:outline-none focus:border-text-primary"
                        >
                          <option value="bank_transfer">Transfer Bank (BCA / Mandiri / BNI / BRI)</option>
                          <option value="bca_va">BCA Virtual Account</option>
                          <option value="qris">QRIS / E-Wallet</option>
                          <option value="cash">Tunai / Cash ke Pengelola</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-muted font-semibold">Tanggal Pembayaran</label>
                        <input
                          type="date"
                          value={paymentDate}
                          onChange={(e) => setPaymentDate(e.target.value)}
                          className="w-full bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-text-primary focus:outline-none focus:border-text-primary"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-muted font-semibold">Foto Bukti Transfer (JPG / PNG)</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                          className="w-full bg-bg border border-stroke rounded-xl px-3 py-2 text-xs text-muted file:mr-3 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-stroke/60 file:text-text-primary hover:file:bg-stroke"
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-muted font-semibold">Catatan / Nama Pengirim</label>
                        <input
                          type="text"
                          value={paymentNotes}
                          onChange={(e) => setPaymentNotes(e.target.value)}
                          placeholder="misal: Transfer a.n. Jane Doe"
                          className="w-full bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-text-primary focus:outline-none focus:border-text-primary"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingPayment}
                        className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-bg rounded-full text-xs font-bold transition-colors disabled:opacity-50 mt-2 shadow-lg cursor-pointer"
                      >
                        {isSubmittingPayment ? 'Mengirim Bukti...' : 'Kirim Bukti Pembayaran'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* ===================== SUB-MODAL: CREATE MAINTENANCE TICKET ===================== */}
            <AnimatePresence>
              {showCreateTicket && (
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowCreateTicket(false)}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                  />

                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 15 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 15 }}
                    className="relative w-full max-w-md bg-surface border border-stroke rounded-2xl sm:rounded-[24px] p-4 sm:p-6 shadow-2xl z-20 space-y-4 max-h-[92vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between border-b border-stroke/40 pb-3">
                      <h4 className="text-base font-bold text-text-primary flex items-center gap-2">
                        <Wrench size={16} className="text-indigo-400" />
                        Ajukan Tiket Keluhan & Perbaikan
                      </h4>
                      <button
                        onClick={() => setShowCreateTicket(false)}
                        className="text-muted hover:text-text-primary text-lg"
                      >
                        ✕
                      </button>
                    </div>

                    {ticketMessage && (
                      <div className={`text-xs px-3.5 py-2.5 rounded-xl flex items-start gap-2 ${
                        ticketMessage.type === 'success'
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                          : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                      }`}>
                        {ticketMessage.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                        <span>{ticketMessage.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleTicketSubmit} className="space-y-3.5 text-xs">
                      <div className="flex flex-col gap-1">
                        <label className="text-muted font-semibold">Judul Keluhan / Masalah</label>
                        <input
                          type="text"
                          required
                          value={ticketTitle}
                          onChange={(e) => setTicketTitle(e.target.value)}
                          placeholder="misal: AC Bocor, Keran Kamar Mandi Rusak"
                          className="w-full bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-text-primary focus:outline-none focus:border-text-primary"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-muted font-semibold">Lokasi Fasilitas</label>
                          <input
                            type="text"
                            value={ticketLocation}
                            onChange={(e) => setTicketLocation(e.target.value)}
                            placeholder="misal: Kamar Mandi"
                            className="w-full bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-text-primary focus:outline-none focus:border-text-primary"
                          />
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-muted font-semibold">Prioritas</label>
                          <select
                            value={ticketPriority}
                            onChange={(e) => setTicketPriority(e.target.value as any)}
                            className="w-full bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-base sm:text-xs text-text-primary focus:outline-none focus:border-text-primary"
                          >
                            <option value="low">Rendah</option>
                            <option value="medium">Sedang</option>
                            <option value="high">Tinggi</option>
                            <option value="urgent">Mendesak</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-muted font-semibold">Deskripsi Lengkap Kendala</label>
                        <textarea
                          required
                          rows={3}
                          value={ticketDescription}
                          onChange={(e) => setTicketDescription(e.target.value)}
                          placeholder="Jelaskan kendala secara detail agar teknisi kami dapat mempersiapkan peralatan yang tepat..."
                          className="w-full bg-bg border border-stroke rounded-xl p-3 text-base sm:text-xs text-text-primary focus:outline-none focus:border-text-primary font-sans"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingTicket}
                        className="w-full py-3 bg-text-primary hover:bg-white/90 text-bg rounded-full text-xs font-bold transition-colors disabled:opacity-50 mt-2 shadow-lg cursor-pointer"
                      >
                        {isSubmittingTicket ? 'Mengirim Tiket...' : 'Kirim Tiket Perbaikan'}
                      </button>
                    </form>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
