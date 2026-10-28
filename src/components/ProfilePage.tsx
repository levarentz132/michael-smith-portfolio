import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
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
  ArrowRight,
  ArrowLeft,
  ShoppingCart,
  Trash2,
  Landmark,
  Edit3,
  ChevronRight,
  X,
  BadgeCheck,
  Send
} from 'lucide-react';
import type { 
  UserSession, 
  TenantDashboardData, 
  TenantLease, 
  TenantInvoice, 
  MaintenanceTicket,
  CartData,
  CartItem,
  WebsiteSettings
} from '../api';
import { 
  sendPhoneOtp, 
  verifyPhoneOtp, 
  fetchTenantDashboard, 
  updateTenantProfile,
  fetchTenantLeases, 
  fetchTenantInvoices, 
  createTenantInvoiceCheckout,
  submitInvoicePaymentProof, 
  fetchMaintenanceTickets, 
  createMaintenanceTicket,
  fetchCart,
  removeFromCart,
  refreshCartCheckout,
  isValidCheckoutUrl,
  loginTenant
} from '../api';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { LoginModal } from './LoginModal';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useSEO } from '../hooks/useSEO';

export interface ProfilePageProps {
  session: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  onSessionUpdate: (updatedSession: UserSession) => void;
  settings?: WebsiteSettings | null;
  initialTab?: 'overview' | 'profile' | 'leases' | 'invoices' | 'maintenance' | 'cart';
}

type TabType = 'overview' | 'profile' | 'leases' | 'invoices' | 'maintenance' | 'cart';

const POPULAR_BANKS = [
  'BCA',
  'Mandiri',
  'BRI',
  'BNI',
  'BSI',
  'CIMB Niaga',
  'Permata',
  'Bank Danamon',
  'Bank Jago',
  'SeaBank',
  'Lainnya'
];

export const ProfilePage: React.FC<ProfilePageProps> = ({
  session,
  onLoginSuccess,
  onLogout,
  onSessionUpdate,
  settings,
  initialTab = 'overview'
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  // Parse URL tab query if provided, e.g. /akun?tab=leases or /profil?tab=invoices
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabType | null;
    if (tabParam && ['overview', 'profile', 'leases', 'invoices', 'maintenance', 'cart'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // SEO metadata
  useSEO({
    title: session ? `Akun Saya - ${session.name} | Highlanderstay` : 'Akun & Profil Penghuni | Highlanderstay',
    description: 'Kelola profil penghuni kos, data rekening bank, status sewa aktif, tagihan bulanan dan laporan perbaikan fasilitas di Highlanderstay.',
    keywords: 'profil tenant, akun penghuni, tagihan sewa kos, rekening bank tenant, komplain fasilitas, highlanderstay',
    canonicalUrl: 'https://highlanderstay.com/akun',
    enabled: true
  });

  // Modal Login state for unauthenticated users
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'login' | 'register'>('login');

  // In-page Login form state (if user prefers typing directly on page)
  const [quickLoginPhone, setQuickLoginPhone] = useState('');
  const [quickLoginPassword, setQuickLoginPassword] = useState('');
  const [isQuickLoggingIn, setIsQuickLoggingIn] = useState(false);
  const [quickLoginError, setQuickLoginError] = useState('');

  // Dashboard Data State
  const [dashboardData, setDashboardData] = useState<TenantDashboardData | null>(null);
  const [leases, setLeases] = useState<TenantLease[]>([]);
  const [leaseHistory, setLeaseHistory] = useState<TenantLease[]>([]);
  const [invoices, setInvoices] = useState<TenantInvoice[]>([]);
  const [invoiceFilter, setInvoiceFilter] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all');
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState('');

  // Cart State (Pemesanan Tertunda)
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartActionLoadingId, setCartActionLoadingId] = useState<number | null>(null);
  const [cartErrorMessage, setCartErrorMessage] = useState<string | null>(null);

  // Bank Account State in Profile Tab
  const [isEditingBank, setIsEditingBank] = useState(false);
  const [bankName, setBankName] = useState('');
  const [customBankName, setCustomBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankAccountHolder, setBankAccountHolder] = useState('');
  const [isUpdatingBank, setIsUpdatingBank] = useState(false);
  const [bankUpdateMsg, setBankUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Personal Information Edit State in Profile Tab
  const [isEditingPersonalInfo, setIsEditingPersonalInfo] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editIdCardNumber, setEditIdCardNumber] = useState('');
  const [editEmergencyName, setEditEmergencyName] = useState('');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState('');
  const [isUpdatingPersonalInfo, setIsUpdatingPersonalInfo] = useState(false);
  const [personalInfoUpdateMsg, setPersonalInfoUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Phone Verification State
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpSuccess, setOtpSuccess] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);

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

  // Maintenance Ticket Modal State
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDescription, setTicketDescription] = useState('');
  const [ticketLocation, setTicketLocation] = useState('');
  const [ticketPriority, setTicketPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);
  const [ticketMessage, setTicketMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Format currency helper
  const formatRupiah = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format date helper (Timezone-safe YYYY-MM-DD parsing)
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

  // Load Cart Data
  const loadCartData = useCallback(async () => {
    setCartLoading(true);
    setCartErrorMessage(null);
    try {
      const res = await fetchCart();
      if (res?.cart) {
        setCartData(res.cart);
      }
    } catch (err: any) {
      console.warn('Load cart error:', err?.message || err);
    } finally {
      setCartLoading(false);
    }
  }, []);

  // Pay Cart Item via DOKU
  const handlePayCartItem = async (item: CartItem) => {
    if (item.is_available === false) {
      setCartErrorMessage(item.conflict_message || 'Kamar ini sudah diisi atau dibayar oleh orang lain.');
      return;
    }
    setCartActionLoadingId(item.id);
    setCartErrorMessage(null);
    try {
      const res = await refreshCartCheckout(item.id);
      if (isValidCheckoutUrl(res?.checkout_url)) {
        sessionStorage.setItem('pending_doku_checkout', JSON.stringify({
          orderId: item.id,
          reference: item.reference,
          amount: item.amount,
          isCart: true,
          timestamp: Date.now()
        }));
        window.location.href = res.checkout_url!;
      } else {
        throw new Error('Tautan pembayaran resmi DOKU belum tersedia dari server.');
      }
    } catch (err: any) {
      console.error('Pay cart error:', err);
      setCartErrorMessage(err?.message || 'Gagal memproses pembayaran keranjang.');
    } finally {
      setCartActionLoadingId(null);
    }
  };

  // Remove item from cart
  const handleRemoveCartItem = async (orderId: number) => {
    if (!window.confirm('Apakah Anda yakin ingin membatalkan pesanan kamar ini?')) return;
    setCartActionLoadingId(orderId);
    setCartErrorMessage(null);
    try {
      await removeFromCart(orderId);
      await loadCartData();
      window.dispatchEvent(new CustomEvent('cart-updated'));
    } catch (err: any) {
      console.error('Cancel cart error:', err);
      setCartErrorMessage(err?.message || 'Gagal membatalkan pesanan.');
    } finally {
      setCartActionLoadingId(null);
    }
  };

  // Load tenant portal data
  const loadPortalData = useCallback(async () => {
    loadCartData();
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
  }, [session?.token, invoiceFilter, loadCartData]);

  // Initial data loading
  useEffect(() => {
    if (session?.token) {
      loadPortalData();
    } else {
      loadCartData();
    }
  }, [session?.token, loadPortalData, loadCartData]);

  // Sync bank account data from dashboardData or session
  useEffect(() => {
    const rawBank = dashboardData?.tenant?.bank_name || session?.tenant?.bank_name || '';
    const rawAccNum = dashboardData?.tenant?.bank_account_number || session?.tenant?.bank_account_number || '';
    const rawAccHolder = dashboardData?.tenant?.bank_account_holder || session?.tenant?.bank_account_holder || '';

    if (rawBank && !POPULAR_BANKS.includes(rawBank)) {
      setBankName('Lainnya');
      setCustomBankName(rawBank);
    } else {
      setBankName(rawBank || 'BCA');
      setCustomBankName('');
    }
    setBankAccountNumber(rawAccNum);
    setBankAccountHolder(rawAccHolder);
  }, [dashboardData, session]);

  // Sync personal information from session and dashboardData
  useEffect(() => {
    if (session) {
      setEditName(session.name || '');
      setEditEmail(session.email || '');
      setEditPhone(session.phone || '');
    }
    if (dashboardData?.tenant) {
      if (dashboardData.tenant.name) setEditName(dashboardData.tenant.name);
      if (dashboardData.tenant.email) setEditEmail(dashboardData.tenant.email);
      if (dashboardData.tenant.phone) setEditPhone(dashboardData.tenant.phone);
      if (dashboardData.tenant.id_card_number) setEditIdCardNumber(dashboardData.tenant.id_card_number);
      if (dashboardData.tenant.emergency_contact_name) setEditEmergencyName(dashboardData.tenant.emergency_contact_name);
      if (dashboardData.tenant.emergency_contact_phone) setEditEmergencyPhone(dashboardData.tenant.emergency_contact_phone);
    }
  }, [dashboardData, session]);

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

  // Quick In-Page Login handler (Email Only)
  const handleQuickLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = quickLoginPhone.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !quickLoginPassword.trim()) {
      setQuickLoginError('Harap isi alamat email dan kata sandi.');
      return;
    }
    if (!emailRegex.test(cleanEmail)) {
      setQuickLoginError('Format alamat email tidak valid (contoh: nama@email.com).');
      return;
    }
    setIsQuickLoggingIn(true);
    setQuickLoginError('');
    try {
      const res = await loginTenant({
        login: cleanEmail,
        password: quickLoginPassword.trim()
      });
      if (res?.session) {
        onLoginSuccess(res.session);
      } else {
        throw new Error('Gagal masuk. Periksa kembali informasi akun Anda.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setQuickLoginError(err?.message || 'Alamat email atau kata sandi tidak cocok.');
    } finally {
      setIsQuickLoggingIn(false);
    }
  };

  // Handle Save Bank Account Details
  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) return;
    setIsUpdatingBank(true);
    setBankUpdateMsg(null);
    try {
      const finalBankName = (bankName === 'Lainnya' ? customBankName : bankName).trim();
      const res = await updateTenantProfile({
        bank_name: finalBankName,
        bank_account_number: bankAccountNumber.trim(),
        bank_account_holder: bankAccountHolder.trim()
      }, session.token);

      setBankUpdateMsg({
        type: 'success',
        text: res.message || 'Nomor rekening bank berhasil diperbarui!'
      });
      setIsEditingBank(false);

      // Update local state and session
      const updatedTenant = {
        ...(session.tenant || {}),
        bank_name: finalBankName,
        bank_account_number: bankAccountNumber.trim(),
        bank_account_holder: bankAccountHolder.trim()
      };
      const updatedSession: UserSession = {
        ...session,
        tenant: updatedTenant
      };
      onSessionUpdate(updatedSession);
      localStorage.setItem('userSession', JSON.stringify(updatedSession));

      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          tenant: {
            ...dashboardData.tenant,
            bank_name: finalBankName,
            bank_account_number: bankAccountNumber.trim(),
            bank_account_holder: bankAccountHolder.trim()
          }
        });
      }
    } catch (err: any) {
      console.error('Update bank error:', err);
      setBankUpdateMsg({
        type: 'error',
        text: err.message || 'Gagal memperbarui rekening bank. Pastikan data terisi lengkap.'
      });
    } finally {
      setIsUpdatingBank(false);
    }
  };

  // Handle Save Personal Information Details
  const handleSavePersonalInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.token) return;
    if (!editName.trim()) {
      setPersonalInfoUpdateMsg({
        type: 'error',
        text: 'Nama lengkap wajib diisi.'
      });
      return;
    }
    setIsUpdatingPersonalInfo(true);
    setPersonalInfoUpdateMsg(null);
    try {
      const res = await updateTenantProfile({
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        phone: editPhone.trim() || undefined,
        id_card_number: editIdCardNumber.trim() || undefined,
        emergency_contact_name: editEmergencyName.trim() || undefined,
        emergency_contact_phone: editEmergencyPhone.trim() || undefined
      }, session.token);

      setPersonalInfoUpdateMsg({
        type: 'success',
        text: res.message || 'Informasi pribadi berhasil disimpan!'
      });
      setIsEditingPersonalInfo(false);

      // Update local state and session
      const updatedTenant = {
        ...(session.tenant || {}),
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        id_card_number: editIdCardNumber.trim(),
        emergency_contact_name: editEmergencyName.trim(),
        emergency_contact_phone: editEmergencyPhone.trim()
      };
      const updatedSession: UserSession = {
        ...session,
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        tenant: updatedTenant
      };
      onSessionUpdate(updatedSession);
      localStorage.setItem('userSession', JSON.stringify(updatedSession));

      if (dashboardData) {
        setDashboardData({
          ...dashboardData,
          tenant: {
            ...dashboardData.tenant,
            name: editName.trim(),
            email: editEmail.trim(),
            phone: editPhone.trim(),
            id_card_number: editIdCardNumber.trim(),
            emergency_contact_name: editEmergencyName.trim(),
            emergency_contact_phone: editEmergencyPhone.trim()
          }
        });
      }
    } catch (err: any) {
      console.error('Update personal info error:', err);
      setPersonalInfoUpdateMsg({
        type: 'error',
        text: err?.message || 'Gagal memperbarui informasi pribadi. Silakan periksa kembali data Anda.'
      });
    } finally {
      setIsUpdatingPersonalInfo(false);
    }
  };

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
      onSessionUpdate(updated);
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

  // Invoice Filter handler
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

  // DOKU Jokul Checkout for Invoice
  const handleDokuCheckout = async (inv: TenantInvoice) => {
    if (!session?.token) return;
    setDokuLoadingInvoiceId(inv.id);
    setDokuErrorMessage(null);
    try {
      sessionStorage.setItem('pending_doku_checkout', JSON.stringify({
        invoiceId: inv.id,
        reference: inv.reference,
        amount: inv.outstanding || inv.total,
        timestamp: Date.now()
      }));

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
        loadPortalData();
      }, 1800);
    } catch (err: any) {
      setPaymentMessage({ type: 'error', text: err.message || 'Gagal mengirim bukti pembayaran.' });
    } finally {
      setIsSubmittingPayment(false);
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
        text: res.message || 'Tiket kendala berhasil diajukan! Tim teknisi akan segera menindaklanjuti.'
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

  // Total unpaid outstanding badge calculation
  const totalOutstanding = dashboardData?.account_summary?.total_outstanding_amount ?? 
    invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue')
      .reduce((acc, curr) => acc + (curr.outstanding || curr.total || 0), 0);

  const unpaidInvoicesCount = invoices.filter(i => i.status === 'unpaid' || i.status === 'overdue').length;
  const openTicketsCount = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const cartItemsCount = cartData?.items?.length || 0;

  return (
    <div className="min-h-screen bg-[#070a12] text-text-primary flex flex-col justify-between selection:bg-amber-400 selection:text-slate-950 font-sans">
      {/* Global Desktop Navbar */}
      <Navbar 
        activeSection="akun" 
        onNavClick={(sec) => {
          if (sec === 'home') navigate('/');
          else if (sec === 'work' || sec === 'katalog') navigate('/katalog');
          else if (sec === 'map') navigate('/map');
          else if (sec === 'resort') navigate('/resort');
          else if (sec === 'cart') navigate('/cart');
          else if (sec === 'akun' || sec === 'portal') navigate('/akun');
          else navigate('/');
        }} 
        session={session}
        onLogout={onLogout}
        onLoginClick={() => {
          setLoginTab('login');
          setLoginModalOpen(true);
        }}
        onProfileClick={() => setActiveTab('profile')}
        onCartClick={() => navigate('/cart')}
        cartCount={cartItemsCount}
        settings={settings}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto pt-20 sm:pt-24 md:pt-28 pb-28 px-3.5 sm:px-6">
        
        {/* Navigation Breadcrumb & Back Header */}
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2.5">
            <Link
              to="/"
              className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-amber-400 hover:border-amber-500/40 transition-all active:scale-95 shadow-md flex items-center justify-center cursor-pointer"
              title="Kembali ke Beranda"
            >
              <ArrowLeft size={18} />
            </Link>
            <div>
              <h1 className="text-lg sm:text-2xl font-black font-display text-white tracking-tight flex items-center gap-2">
                <span>Profil & Akun Penghuni</span>
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                  Tenant
                </span>
              </h1>
              <p className="text-xs text-slate-400 hidden sm:block">
                Kelola informasi akun, rekening bank, tagihan sewa kamar, dan komplain perbaikan.
              </p>
            </div>
          </div>

          {session ? (
            <button
              type="button"
              onClick={onLogout}
              className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer shadow-sm"
              title="Keluar dari Akun"
            >
              <LogOut size={14} />
              <span className="hidden xs:inline">Keluar</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setLoginTab('login');
                setLoginModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <User size={14} />
              <span>Masuk / Daftar</span>
            </button>
          )}
        </div>

        {/* =========================================================================
            STATE 1: Unauthenticated User (Not Logged In)
            ========================================================================= */}
        {!session ? (
          <div className="max-w-xl mx-auto my-6 space-y-6">
            <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-xl text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/10">
                <ShieldCheck size={32} />
              </div>
              
              <h2 className="text-xl sm:text-2xl font-black text-white mb-2">Masuk ke Akun Anda</h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed mb-6">
                Akses status sewa kamar, kelola nomor rekening bank untuk pencairan deposit, bayar invoice instan, dan laporkan keluhan fasilitas.
              </p>

              {/* Instant Google Login / Register (No OTP needed) */}
              <div className="mb-5">
                <GoogleSignInButton
                  text="continue"
                  onSuccess={(sess) => {
                    onLoginSuccess(sess);
                  }}
                  clientId={settings?.google_client_id}
                />
                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-slate-800" />
                  <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold">atau dengan Email & Kata Sandi</span>
                  <div className="flex-1 h-px bg-slate-800" />
                </div>
              </div>

              {/* Direct In-Page Login Form */}
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
                    placeholder="Contoh: nama@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Kata Sandi (Password)</label>
                  <input
                    type="password"
                    value={quickLoginPassword}
                    onChange={(e) => setQuickLoginPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun Anda"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700/80 text-white placeholder-slate-500 text-xs sm:text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isQuickLoggingIn}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 text-xs sm:text-sm font-black shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isQuickLoggingIn ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Sedang Masuk...</span>
                    </>
                  ) : (
                    <>
                      <span>Masuk Sekarang</span>
                      <ArrowRight size={15} />
                    </>
                  )}
                </button>
              </form>

              {/* Alternative Options */}
              <div className="pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <span className="text-slate-400">Belum punya akun atau ingin verifikasi WhatsApp OTP?</span>
                <button
                  type="button"
                  onClick={() => {
                    setLoginTab('register');
                    setLoginModalOpen(true);
                  }}
                  className="text-amber-400 hover:text-amber-300 font-bold underline cursor-pointer"
                >
                  Daftar Akun Baru
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* =========================================================================
              STATE 2: Authenticated Tenant (Logged In)
              ========================================================================= */
          <div className="space-y-5">
            {/* Profile Hero Header Card */}
            <div className="p-4 sm:p-6 rounded-3xl bg-gradient-to-b from-slate-900 to-[#0c101c] border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

              <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black text-2xl flex items-center justify-center shadow-lg shadow-amber-500/25 shrink-0 border border-amber-300/40">
                    {session.name ? session.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-lg sm:text-xl font-bold text-white truncate">{session.name}</h2>
                      {session.phone_verified ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          <BadgeCheck size={12} />
                          <span>WhatsApp Terverifikasi</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('profile');
                            setIsVerifyingPhone(true);
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-full hover:bg-amber-500/25 cursor-pointer"
                        >
                          <AlertTriangle size={11} />
                          <span>Verifikasi Nomor</span>
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Phone size={12} className="text-slate-500" />
                        <span>{session.phone || 'Nomor HP belum diisi'}</span>
                      </span>
                      {session.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={12} className="text-slate-500" />
                          <span>{session.email}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Quick Account Info Pills */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('profile')}
                    className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Edit3 size={13} className="text-amber-400" />
                    <span>Ubah Biodata & Bank</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Horizontal Nav Tabs for Mobile & Desktop */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-b border-slate-800/80">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'overview'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Sparkles size={14} />
                <span>Ringkasan</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'profile'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <User size={14} />
                <span>Biodata & Rekening Bank</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('leases')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'leases'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Building2 size={14} />
                <span>Kamar & Sewa Aktif</span>
                {leases.length > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'leases' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'}`}>
                    {leases.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('invoices')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'invoices'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Receipt size={14} />
                <span>Tagihan & Bayar</span>
                {unpaidInvoicesCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-rose-500 text-white font-bold animate-pulse">
                    {unpaidInvoicesCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('maintenance')}
                className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                  activeTab === 'maintenance'
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Wrench size={14} />
                <span>Komplain Kendala</span>
                {openTicketsCount > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeTab === 'maintenance' ? 'bg-slate-950 text-amber-400' : 'bg-sky-500/20 text-sky-300'}`}>
                    {openTicketsCount}
                  </span>
                )}
              </button>

              {cartItemsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('cart')}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                    activeTab === 'cart'
                      ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <ShoppingCart size={14} />
                  <span>Pesanan Pending</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-amber-500 text-slate-950 font-bold">
                    {cartItemsCount}
                  </span>
                </button>
              )}
            </div>

            {/* Loading state indicator */}
            {isLoading && (
              <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs flex items-center justify-center gap-2">
                <RefreshCw size={14} className="animate-spin text-amber-400" />
                <span>Memperbarui data akun...</span>
              </div>
            )}

            {/* Error banner */}
            {loadError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{loadError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadPortalData}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-bold cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* TAB CONTENT: 1. OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* 3 Overview Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  {/* Tagihan Belum Dibayar */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Tagihan Belum Lunas</span>
                      <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center">
                        <CreditCard size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-white">
                        {formatRupiah(totalOutstanding)}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {unpaidInvoicesCount > 0 ? `${unpaidInvoicesCount} invoice menunggu pembayaran` : 'Semua tagihan lunas'}
                      </p>
                    </div>
                    {unpaidInvoicesCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('invoices')}
                        className="w-full py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <span>Bayar Sekarang</span>
                        <ChevronRight size={14} />
                      </button>
                    )}
                  </div>

                  {/* Kamar & Sewa Aktif */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Kamar Sewa Aktif</span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <Building2 size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="text-xl sm:text-2xl font-black text-white">
                        {leases.length > 0 ? `${leases.length} Unit` : 'Belum Ada'}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {leases.length > 0 ? (leases[0].unit?.name ? `Kamar ${leases[0].unit.name}` : 'Kamar Kos Aktif') : 'Pesan kamar di katalog'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('leases')}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Lihat Detail Kamar</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>

                  {/* Rekening Bank & Deposit */}
                  <div className="p-4 sm:p-5 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">Rekening Pengembalian</span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
                        <Landmark size={16} />
                      </div>
                    </div>
                    <div>
                      <div className="text-base sm:text-lg font-bold text-white truncate">
                        {bankAccountNumber ? `${bankName} • ${bankAccountNumber}` : 'Belum Diatur'}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {bankAccountHolder ? `a/n ${bankAccountHolder}` : 'Untuk pencairan uang deposit'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span>Atur Rekening</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                {/* Quick Action Shortcuts */}
                <div className="p-5 rounded-3xl bg-slate-900/60 border border-slate-800 space-y-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Layanan Cepat Penghuni</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <button
                      type="button"
                      onClick={() => setActiveTab('profile')}
                      className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer"
                    >
                      <User size={18} className="text-amber-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Biodata & Rekening</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Kelola data bank & HP</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab('invoices')}
                      className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer"
                    >
                      <Receipt size={18} className="text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Bayar Tagihan</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">DOKU Jokul & Transfer</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setActiveTab('maintenance');
                        setShowCreateTicket(true);
                      }}
                      className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer"
                    >
                      <Wrench size={18} className="text-sky-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Lapor Kerusakan</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">AC, lampu, air, dll</p>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigate('/katalog')}
                      className="p-3.5 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 hover:border-amber-500/40 transition-all text-left group cursor-pointer"
                    >
                      <Building2 size={18} className="text-purple-400 mb-2 group-hover:scale-110 transition-transform" />
                      <div className="text-xs font-bold text-white">Cari Kamar Lain</div>
                      <p className="text-[10px] text-slate-500 mt-0.5">Katalog & Peta lokasi</p>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: 2. BIODATA & REKENING BANK */}
            {activeTab === 'profile' && (
              <div className="space-y-5">
                {/* Bank Account Section (Primary User Feature) */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-400/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                        <Landmark size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Rekening Bank Tenant</h3>
                        <p className="text-xs text-slate-400">
                          Digunakan untuk pengembalian dana deposit sewa & transaksi resmi.
                        </p>
                      </div>
                    </div>

                    {!isEditingBank && (
                      <button
                        type="button"
                        onClick={() => setIsEditingBank(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>{bankAccountNumber ? 'Ubah Rekening' : 'Tambah Rekening'}</span>
                      </button>
                    )}
                  </div>

                  {/* Feedback Message */}
                  {bankUpdateMsg && (
                    <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                      bankUpdateMsg.type === 'success'
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {bankUpdateMsg.type === 'success' ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
                      <span>{bankUpdateMsg.text}</span>
                    </div>
                  )}

                  {!isEditingBank ? (
                    <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Bank Terdaftar</div>
                        <div className="text-base font-bold text-white mt-0.5">
                          {bankName === 'Lainnya' ? customBankName || 'Bank Lainnya' : bankName || 'Belum diisi'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Nomor Rekening</div>
                        <div className="text-base font-mono font-bold text-amber-400 mt-0.5">
                          {bankAccountNumber || '-'}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Nama Pemilik Rekening</div>
                        <div className="text-base font-bold text-white mt-0.5">
                          {bankAccountHolder || '-'}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Edit Bank Form */
                    <form onSubmit={handleSaveBank} className="p-4 rounded-2xl bg-slate-950/90 border border-amber-500/30 space-y-3.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Bank</label>
                          <select
                            value={bankName}
                            onChange={(e) => setBankName(e.target.value)}
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400 cursor-pointer"
                            required
                          >
                            <option value="">Pilih Bank</option>
                            {POPULAR_BANKS.map((b) => (
                              <option key={b} value={b}>{b}</option>
                            ))}
                          </select>
                        </div>

                        {bankName === 'Lainnya' && (
                          <div>
                            <label className="block text-xs font-semibold text-slate-300 mb-1">Tulis Nama Bank</label>
                            <input
                              type="text"
                              value={customBankName}
                              onChange={(e) => setCustomBankName(e.target.value)}
                              placeholder="Contoh: Bank DKI, Bank Jabar, dll"
                              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                              required
                            />
                          </div>
                        )}

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Rekening</label>
                          <input
                            type="text"
                            value={bankAccountNumber}
                            onChange={(e) => setBankAccountNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="Nomor rekening bank Anda"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Pemilik Rekening (Sesuai Buku Tabungan)</label>
                          <input
                            type="text"
                            value={bankAccountHolder}
                            onChange={(e) => setBankAccountHolder(e.target.value)}
                            placeholder="Nama lengkap pemilik rekening"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => setIsEditingBank(false)}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingBank}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isUpdatingBank ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Simpan Rekening</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Personal Information & Verification */}
                <div className="p-5 sm:p-6 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                        <User size={20} />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">Informasi Pribadi</h3>
                        <p className="text-xs text-slate-400">Data identitas penyewa yang terdaftar di sistem.</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingPersonalInfo(!isEditingPersonalInfo);
                        setPersonalInfoUpdateMsg(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-slate-700 shadow-sm"
                    >
                      <Edit3 size={13} />
                      <span>{isEditingPersonalInfo ? 'Batal' : 'Ubah Data'}</span>
                    </button>
                  </div>

                  {personalInfoUpdateMsg && (
                    <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                      personalInfoUpdateMsg.type === 'success' 
                        ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300' 
                        : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
                    }`}>
                      {personalInfoUpdateMsg.type === 'success' ? <CheckCircle2 size={15} className="shrink-0" /> : <AlertCircle size={15} className="shrink-0" />}
                      <span>{personalInfoUpdateMsg.text}</span>
                    </div>
                  )}

                  {!isEditingPersonalInfo ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <span className="text-xs text-slate-500">Nama Lengkap</span>
                        <div className="text-sm font-bold text-white mt-0.5">{session.name || '-'}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <span className="text-xs text-slate-500">Alamat Email</span>
                        <div className="text-sm font-bold text-white mt-0.5">{session.email || '-'}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-slate-500">Nomor WhatsApp</span>
                          {session.phone_verified ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                              Terverifikasi
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                              Belum Verifikasi
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-bold text-white mt-0.5">{session.phone || '-'}</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
                        <span className="text-xs text-slate-500">Nomor Identitas (NIK / KTP)</span>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {dashboardData?.tenant?.id_card_number || 'Belum diisi'}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 sm:col-span-2">
                        <span className="text-xs text-slate-500">Kontak Darurat</span>
                        <div className="text-sm font-bold text-white mt-0.5">
                          {dashboardData?.tenant?.emergency_contact_name ? (
                            <span>{dashboardData.tenant.emergency_contact_name} {dashboardData.tenant.emergency_contact_phone ? `(${dashboardData.tenant.emergency_contact_phone})` : ''}</span>
                          ) : (
                            <span className="text-slate-500 italic">Belum dicantumkan</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleSavePersonalInfo} className="space-y-3.5 pt-2 border-t border-slate-800">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Lengkap</label>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Nama lengkap sesuai KTP"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Alamat Email</label>
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            placeholder="alamat@email.com"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor WhatsApp / HP</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            placeholder="Contoh: 08123456789"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Identitas (NIK / KTP)</label>
                          <input
                            type="text"
                            value={editIdCardNumber}
                            onChange={(e) => setEditIdCardNumber(e.target.value.replace(/[^0-9]/g, ''))}
                            maxLength={16}
                            placeholder="16 digit nomor KTP / NIK"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-mono focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nama Kontak Darurat</label>
                          <input
                            type="text"
                            value={editEmergencyName}
                            onChange={(e) => setEditEmergencyName(e.target.value)}
                            placeholder="Nama orang tua / kerabat terdekat"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-300 mb-1">Nomor Telepon Kontak Darurat</label>
                          <input
                            type="tel"
                            value={editEmergencyPhone}
                            onChange={(e) => setEditEmergencyPhone(e.target.value)}
                            placeholder="Nomor HP kontak darurat"
                            className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm focus:outline-none focus:border-amber-400"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPersonalInfo(false);
                            setPersonalInfoUpdateMsg(null);
                          }}
                          className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold transition-all cursor-pointer"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdatingPersonalInfo}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isUpdatingPersonalInfo ? (
                            <>
                              <RefreshCw size={14} className="animate-spin" />
                              <span>Menyimpan...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 size={14} />
                              <span>Simpan Perubahan</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Phone OTP Verification Section */}
                  {!session.phone_verified && (
                    <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-3">
                      <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                        <AlertTriangle size={15} />
                        <span>Verifikasi Nomor WhatsApp Anda</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Verifikasi nomor WhatsApp untuk menerima notifikasi tagihan jatuh tempo dan konfirmasi pembayaran otomatis.
                      </p>

                      {otpError && (
                        <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                          {otpError}
                        </div>
                      )}
                      {otpSuccess && (
                        <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs">
                          {otpSuccess}
                        </div>
                      )}

                      {!isVerifyingPhone ? (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={isSendingOtp}
                          className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          {isSendingOtp ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Mengirim OTP...</span>
                            </>
                          ) : (
                            <>
                              <Send size={13} />
                              <span>Kirim Kode OTP ke WhatsApp</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <form onSubmit={handleVerifyOtp} className="flex items-center gap-2 max-w-sm">
                          <input
                            type="text"
                            maxLength={6}
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            placeholder="6 Digit OTP"
                            className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-center tracking-widest text-sm focus:outline-none focus:border-amber-400"
                            required
                          />
                          <button
                            type="submit"
                            disabled={isSubmittingOtp || otpCode.length < 4}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                          >
                            {isSubmittingOtp ? 'Memverifikasi...' : 'Verifikasi'}
                          </button>
                          {otpCountdown > 0 ? (
                            <span className="text-[11px] text-slate-400 font-mono">({otpCountdown}s)</span>
                          ) : (
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              className="text-xs text-amber-400 underline font-semibold cursor-pointer"
                            >
                              Kirim Ulang
                            </button>
                          )}
                        </form>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: 3. KAMAR & SEWA AKTIF */}
            {activeTab === 'leases' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 size={16} className="text-amber-400" />
                    <span>Daftar Unit & Sewa Kamar</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/katalog')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Cari Kamar Lain</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {leases.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                    <Building2 size={36} className="text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-white">Belum Ada Kamar Aktif</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Anda belum memiliki masa sewa aktif yang tercatat. Silakan lakukan pemesanan kamar melalui katalog kos kami.
                    </p>
                    <button
                      type="button"
                      onClick={() => navigate('/katalog')}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-400/20 active:scale-95 transition-all cursor-pointer"
                    >
                      Buka Katalog Kamar
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {leases.map((lease) => (
                      <div key={lease.id} className="p-5 sm:p-6 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-xl space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-500">Ref: {lease.reference || `#LS-${lease.id}`}</span>
                            <h4 className="text-base sm:text-lg font-bold text-white mt-0.5">
                              {lease.unit?.name ? `Kamar ${lease.unit.name}` : 'Kamar Kos'}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {lease.property?.name || 'Highlanderstay'}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                              lease.status === 'active' 
                                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                : lease.status === 'pending'
                                ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}>
                              {lease.status === 'active' ? 'Sewa Aktif' : lease.status}
                            </span>
                          </div>
                        </div>

                        {/* Lease Specs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                            <span className="text-[10px] text-slate-500">Harga Sewa</span>
                            <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                              {formatRupiah(lease.rent_amount)} <span className="text-[10px] text-slate-400 font-normal">/ {lease.billing_label || lease.billing_cycle || 'bln'}</span>
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                            <span className="text-[10px] text-slate-500">Uang Jaminan (Deposit)</span>
                            <div className="text-xs sm:text-sm font-bold text-amber-400 mt-0.5">
                              {formatRupiah(lease.deposit_amount)}
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                            <span className="text-[10px] text-slate-500">Tanggal Mulai</span>
                            <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                              {formatDate(lease.start_date)}
                            </div>
                          </div>

                          <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80">
                            <span className="text-[10px] text-slate-500">Jatuh Tempo / Berakhir</span>
                            <div className="text-xs sm:text-sm font-bold text-white mt-0.5">
                              {formatDate(lease.end_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Lease History if any */}
                    {leaseHistory.length > 0 && (
                      <div className="pt-4 border-t border-slate-800/80">
                        <h4 className="text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">Riwayat Sewa Sebelumnya</h4>
                        <div className="space-y-2">
                          {leaseHistory.map(oldLease => (
                            <div key={oldLease.id} className="p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800/60 flex items-center justify-between text-xs">
                              <div>
                                <span className="font-semibold text-slate-300">{oldLease.unit?.name ? `Kamar ${oldLease.unit.name}` : 'Unit Kos'}</span>
                                <span className="text-slate-500 ml-2">({formatDate(oldLease.start_date)} - {formatDate(oldLease.end_date)})</span>
                              </div>
                              <span className="text-slate-500 text-[10px] uppercase font-mono">{oldLease.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 4. TAGIHAN & PEMBAYARAN */}
            {activeTab === 'invoices' && (
              <div className="space-y-4">
                {/* DOKU Error Banner if any */}
                {dokuErrorMessage && (
                  <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={15} className="shrink-0" />
                      <span>{dokuErrorMessage}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDokuErrorMessage(null)}
                      className="p-1 hover:bg-rose-500/20 rounded cursor-pointer"
                    >
                      <X size={14} />
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
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                        invoiceFilter === f
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {f === 'all' ? 'Semua' : f === 'unpaid' ? 'Belum Bayar' : f === 'paid' ? 'Lunas' : 'Jatuh Tempo'}
                    </button>
                  ))}
                </div>

                {invoices.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                    <Receipt size={36} className="text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-white">Tidak Ada Tagihan</div>
                    <p className="text-xs text-slate-400">Tidak ada riwayat tagihan pada filter ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {invoices.map((inv) => (
                      <div key={inv.id} className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-lg space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">#{inv.reference || inv.id}</span>
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
                              <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider mt-0.5 ${
                                inv.status === 'paid'
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                  : inv.status === 'overdue'
                                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              }`}>
                                {inv.status === 'paid' ? 'Lunas' : inv.status === 'overdue' ? 'Jatuh Tempo' : 'Belum Bayar'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Pay actions if unpaid */}
                        {(inv.status === 'unpaid' || inv.status === 'overdue') && (
                          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                            <button
                              type="button"
                              onClick={() => {
                                setPayingInvoice(inv);
                                setPaymentAmount(inv.outstanding || inv.total || 0);
                              }}
                              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                            >
                              <Upload size={13} />
                              <span>Upload Bukti</span>
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

            {/* TAB CONTENT: 5. KOMPLAIN & TIKET PERBAIKAN */}
            {activeTab === 'maintenance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Wrench size={16} className="text-sky-400" />
                    <span>Layanan Komplain & Kendala Kamar</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowCreateTicket(true)}
                    className="px-3.5 py-1.5 rounded-xl bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Lapor Kendala</span>
                  </button>
                </div>

                {tickets.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
                    <Wrench size={36} className="text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-white">Tidak Ada Tiket Kendala</div>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Semua fasilitas kamar Anda dalam keadaan baik. Tekan tombol &quot;Lapor Kendala&quot; jika membutuhkan bantuan teknisi.
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowCreateTicket(true)}
                      className="px-4 py-2 rounded-xl bg-sky-500 text-slate-950 text-xs font-black transition-all cursor-pointer"
                    >
                      Buat Laporan Baru
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {tickets.map((t) => (
                      <div key={t.id} className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-lg space-y-2.5">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500">#{t.reference || t.id}</span>
                            <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">{t.title}</h4>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">{t.description}</p>
                          </div>
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 ${
                            t.status === 'resolved' || t.status === 'closed'
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              : t.status === 'in_progress'
                              ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                              : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          }`}>
                            {t.status === 'resolved' ? 'Selesai' : t.status === 'in_progress' ? 'Diproses' : 'Menunggu'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-2 border-t border-slate-800/80">
                          {t.location && (
                            <span className="flex items-center gap-1">
                              <Building2 size={12} />
                              <span>{t.location}</span>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            <span>{formatDate(t.created_at)}</span>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: 6. KERANJANG PEMESANAN */}
            {activeTab === 'cart' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShoppingCart size={16} className="text-amber-400" />
                    <span>Pesanan Kamar Tertunda</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigate('/katalog')}
                    className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <span>Tambah Kamar</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {cartLoading ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    <RefreshCw size={16} className="animate-spin mx-auto mb-2 text-amber-400" />
                    <span>Memuat keranjang...</span>
                  </div>
                ) : cartItemsCount === 0 ? (
                  <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                    <ShoppingCart size={36} className="text-slate-600 mx-auto" />
                    <div className="text-sm font-bold text-white">Keranjang Kosong</div>
                    <p className="text-xs text-slate-400">Tidak ada pemesanan kamar tertunda saat ini.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3.5">
                    {cartErrorMessage && (
                      <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                        {cartErrorMessage}
                      </div>
                    )}
                    {cartData?.items?.map((item) => (
                      <div key={item.id} className="p-4 sm:p-5 rounded-3xl bg-slate-900/95 border border-slate-800 shadow-lg space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">Order #{item.reference || item.id}</span>
                            <h4 className="text-base font-bold text-white mt-0.5">{item.unit_name || item.property_name || 'Kamar Kos'}</h4>
                            <p className="text-xs text-slate-400">
                              {item.property_name || 'Highlanderstay'} • Masuk: {formatDate(item.start_date)}
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <div className="text-base font-black text-amber-400">{formatRupiah(item.amount)}</div>
                            <span className="text-[10px] text-slate-400">{item.duration_months || 1} Bulan Sewa</span>
                          </div>
                        </div>

                        <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => handleRemoveCartItem(item.id)}
                            disabled={cartActionLoadingId === item.id}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                            <span>Batal</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handlePayCartItem(item)}
                            disabled={cartActionLoadingId === item.id}
                            className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-400/20"
                          >
                            {cartActionLoadingId === item.id ? (
                              <RefreshCw size={13} className="animate-spin" />
                            ) : (
                              <CreditCard size={13} />
                            )}
                            <span>Lanjut Bayar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* =========================================================================
          MODAL: Submit Payment Proof
          ========================================================================= */}
      <AnimatePresence>
        {payingInvoice && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Upload size={18} className="text-amber-400" />
                  <span>Upload Bukti Pembayaran</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setPayingInvoice(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {paymentMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  paymentMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                }`}>
                  {paymentMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{paymentMessage.text}</span>
                </div>
              )}

              <form onSubmit={handlePaymentSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nominal Pembayaran</label>
                  <input
                    type="number"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Metode Pembayaran</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="bank_transfer">Transfer Bank Manual</option>
                    <option value="qris">QRIS / E-Wallet</option>
                    <option value="cash">Tunai ke Pengelola</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tanggal Transfer</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Foto / Screenshot Bukti Transfer</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setProofImage(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-amber-400 file:text-slate-950 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Catatan Tambahan (Opsional)</label>
                  <textarea
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Contoh: Transfer dari rekening a/n Budi Santoso"
                    rows={2}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setPayingInvoice(null)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingPayment}
                    className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingPayment ? 'Mengirim...' : 'Kirim Bukti'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MODAL: Create Maintenance Ticket
          ========================================================================= */}
      <AnimatePresence>
        {showCreateTicket && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 p-5 sm:p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wrench size={18} className="text-sky-400" />
                  <span>Laporkan Kendala Fasilitas</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCreateTicket(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {ticketMessage && (
                <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                  ticketMessage.type === 'success' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-rose-500/15 text-rose-300'
                }`}>
                  {ticketMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                  <span>{ticketMessage.text}</span>
                </div>
              )}

              <form onSubmit={handleTicketSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Judul Keluhan</label>
                  <input
                    type="text"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    placeholder="Contoh: AC kurang dingin / Lampu kamar mandi mati"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs sm:text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Lokasi Kamar / Fasilitas</label>
                  <input
                    type="text"
                    value={ticketLocation}
                    onChange={(e) => setTicketLocation(e.target.value)}
                    placeholder="Contoh: Kamar 204 Lantai 2"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tingkat Prioritas</label>
                  <select
                    value={ticketPriority}
                    onChange={(e) => setTicketPriority(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                  >
                    <option value="low">Rendah (Dapat menunggu)</option>
                    <option value="medium">Sedang (Perlu dicek)</option>
                    <option value="high">Tinggi (Mendesak)</option>
                    <option value="urgent">Darurat (Air mati / listrik korslet)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Deskripsi Detail Masalah</label>
                  <textarea
                    value={ticketDescription}
                    onChange={(e) => setTicketDescription(e.target.value)}
                    placeholder="Jelaskan kendala secara rinci agar teknisi dapat menyiapkan peralatan yang tepat..."
                    rows={3}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    required
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setShowCreateTicket(false)}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingTicket}
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-black transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingTicket ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Global Login/Register Modal Fallback */}
      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        initialTab={loginTab}
        onLoginSuccess={(newSession) => {
          onLoginSuccess(newSession);
          setLoginModalOpen(false);
        }}
      />
    </div>
  );
};
