import React, { useState, useEffect } from 'react';
import { 
  fetchBookings, 
  fetchProperties, 
  createProperty, 
  updateProperty, 
  deleteProperty, 
  updateBookingStatus, 
  deleteBooking,
  fetchTenantBookings,
  fetchTenantInfo,
  fetchTenants,
  createTenant,
  updateTenant,
  fetchTransactions,
  createTransaction,
  fetchSettings,
  updateSettings,
  fetchArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser
} from '../api';
import type { Property, Booking, UserSession, TenantInfo, Tenant, Transaction, Article, AdminUser } from '../api';
import { useNavigate } from 'react-router-dom';
import { Upload, Loader2, Trash2, Plus, Printer } from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();

  // SEO optimization for Admin Panel (No index, no follow)
  useSEO({
    title: 'Admin Portal | Highlanderstay',
    description: 'Internal administration portal for managing Highlanderstay co-living properties, bookings, and tenants.',
    noindex: true
  });
  const [session, setSession] = useState<UserSession | null>(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        return JSON.parse(savedSession) as UserSession;
      } catch (e) {
        console.error('Failed to parse user session', e);
      }
    }
    return null;
  });

  const isAdminRole = (role?: string) => role === 'admin' || role === 'owner' || role === 'cashier';

  const [tenantInfo, setTenantInfo] = useState<TenantInfo | null>(null);
  const [activeTab, setActiveTab] = useState<'bookings' | 'monthly_bookings' | 'properties' | 'tenants' | 'earnings' | 'settings' | 'articles' | 'users'>('bookings');

  // Settings tab states
  const [logoText, setLogoText] = useState('HS');
  const [logoStartColor, setLogoStartColor] = useState('#89AACC');
  const [logoEndColor, setLogoEndColor] = useState('#4E85BF');
  const [logoImage, setLogoImage] = useState('');
  const [banners, setBanners] = useState<string[]>([]);
  const [promoEnabled, setPromoEnabled] = useState(false);
  const [promoText, setPromoText] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('628123456789');
  const [facilitiesPremium, setFacilitiesPremium] = useState<Array<{ id: number; title: string; image: string; rotation?: number }>>([]);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [bannerUploadError, setBannerUploadError] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoUploadError, setLogoUploadError] = useState('');

  // Articles States
  const [articles, setArticles] = useState<Article[]>([]);
  const [isArticleFormOpen, setIsArticleFormOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleImage, setArticleImage] = useState('');
  const [articleReadTime, setArticleReadTime] = useState('5 menit baca');
  const [isUploadingArticleImage, setIsUploadingArticleImage] = useState(false);
  const [articleUploadError, setArticleUploadError] = useState('');

  // Premium Facility submodal States
  const [isFacilityModalOpen, setIsFacilityModalOpen] = useState(false);
  const [editingFacilityIndex, setEditingFacilityIndex] = useState<number | null>(null);
  const [facilityTitle, setFacilityTitle] = useState('');
  const [facilityImage, setFacilityImage] = useState('');
  const [isUploadingFacilityImage, setIsUploadingFacilityImage] = useState(false);
  const [facilityUploadError, setFacilityUploadError] = useState('');

  // Staff User Management States
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'owner' | 'admin' | 'cashier'>('cashier');
  const [userBranchId, setUserBranchId] = useState('');
  const [userIsActive, setUserIsActive] = useState(true);

  // Transit booking approval verification states
  const [approvingBooking, setApprovingBooking] = useState<Booking | null>(null);
  const [approveIdCardNumber, setApproveIdCardNumber] = useState('');
  const [approveIdCardPhoto, setApproveIdCardPhoto] = useState('');
  const [approveAddress, setApproveAddress] = useState('');
  const [approveEmergencyContact, setApproveEmergencyContact] = useState('');
  const [approveEmergencyPhone, setApproveEmergencyPhone] = useState('');
  const [isUploadingApprovePhoto, setIsUploadingApprovePhoto] = useState(false);
  const [approvePhotoError, setApprovePhotoError] = useState('');

  const handleBannerImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setBannerUploadError('Please select a valid image file (PNG, JPG, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setBannerUploadError('Image file size must be less than 5MB.');
      return;
    }

    setIsUploadingBanner(true);
    setBannerUploadError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setBanners(prev => [...prev, '/' + data.url]);
    } catch (err) {
      console.error(err);
      setBannerUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleDeleteBanner = (indexToDelete: number) => {
    setBanners(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  const handleLogoImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setLogoUploadError('Please select a valid image file (PNG, JPG, SVG, etc.).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setLogoUploadError('Logo file size must be less than 2MB.');
      return;
    }

    setIsUploadingLogo(true);
    setLogoUploadError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setLogoImage('/' + data.url);
    } catch (err) {
      console.error(err);
      setLogoUploadError('Failed to upload logo. Please try again.');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      await updateSettings({
        logo_text: logoText,
        logo_gradient_start: logoStartColor,
        logo_gradient_end: logoEndColor,
        logo_image: logoImage,
        promo_enabled: promoEnabled ? 'true' : 'false',
        promo_text: promoText,
        whatsapp_number: whatsappNumber,
        banners: banners,
        facilities_premium: facilitiesPremium
      });
      alert('Settings updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setIsSavingSettings(false);
    }
  };

  const formatTransitDateTime = (startStr?: string, endStr?: string) => {
    if (!startStr) return '';
    try {
      const start = new Date(startStr);
      const optionsDate: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
      const datePart = start.toLocaleDateString(undefined, optionsDate);
      const startHrs = String(start.getHours()).padStart(2, '0');
      const startMins = String(start.getMinutes()).padStart(2, '0');
      
      if (endStr) {
        const end = new Date(endStr);
        const endHrs = String(end.getHours()).padStart(2, '0');
        const endMins = String(end.getMinutes()).padStart(2, '0');
        
        // If ends on a different date
        if (start.toDateString() !== end.toDateString()) {
          const endDatePart = end.toLocaleDateString(undefined, optionsDate);
          return `${datePart} ${startHrs}:${startMins} - ${endDatePart} ${endHrs}:${endMins}`;
        }
        return `${datePart}, ${startHrs}:${startMins} - ${endHrs}:${endMins}`;
      }
      return `${datePart}, ${startHrs}:${startMins}`;
    } catch {
      return startStr;
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  };
  
  // States
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [earningStartDate, setEarningStartDate] = useState('');
  const [earningEndDate, setEarningEndDate] = useState('');
  const [selectedInvoiceBooking, setSelectedInvoiceBooking] = useState<Booking | null>(null);
  
  const [loading, setLoading] = useState(() => {
    const savedSession = localStorage.getItem('userSession');
    return savedSession !== null;
  });
  const [error, setError] = useState('');

  // Property Form Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  
  // Property Form Inputs
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [type, setType] = useState<'kos' | 'apartment'>('kos');
  const [price, setPrice] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState('4.8 ★');
  const [image, setImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (PNG, JPG, etc.).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image file size must be less than 5MB.');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setImage('/' + data.url);
    } catch (err) {
      console.error(err);
      setUploadError('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Expanded Property Form Inputs
  const [mapUrl, setMapUrl] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [minTransitHours, setMinTransitHours] = useState('3');
  const [transit3h, setTransit3h] = useState('');
  const [transit6h, setTransit6h] = useState('');
  const [transit12h, setTransit12h] = useState('');
  const [transit24h, setTransit24h] = useState('');
  const [promoPrice, setPromoPrice] = useState('');
  const [promoLabel, setPromoLabel] = useState('');
  const [available, setAvailable] = useState(true);
  const [description, setDescription] = useState('');
  const [rooms, setRooms] = useState('0');
  const [availableRooms, setAvailableRooms] = useState('0');
  const [branchId, setBranchId] = useState('');
  const [status, setStatus] = useState('available');

  // Tenants manual creation modal & search
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantIdCardNumber, setNewTenantIdCardNumber] = useState('');
  const [newTenantIdCardPhoto, setNewTenantIdCardPhoto] = useState('');
  const [newTenantAddress, setNewTenantAddress] = useState('');
  const [newTenantEmergencyContact, setNewTenantEmergencyContact] = useState('');
  const [newTenantEmergencyPhone, setNewTenantEmergencyPhone] = useState('');
  const [newTenantStatus, setNewTenantStatus] = useState<'active' | 'inactive'>('active');
  const [tenantSearchTerm, setTenantSearchTerm] = useState('');

  // Transactions manual creation modal
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txCategory, setTxCategory] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txDescription, setTxDescription] = useState('');
  const [txBranchId, setTxBranchId] = useState('');

  // Load Data function
  const loadData = React.useCallback(async (currentSession: UserSession) => {
    setLoading(true);
    setError('');
    try {
      if (currentSession.role === 'tenant') {
        const [tenantDetails, tenantBookings] = await Promise.all([
          fetchTenantInfo(currentSession.id),
          fetchTenantBookings(currentSession.id)
        ]);
        setTenantInfo(tenantDetails);
        setBookings(tenantBookings);
      } else if (isAdminRole(currentSession.role)) {
        const fetchAdminsPromise = (currentSession.role === 'admin' || currentSession.role === 'owner')
          ? fetchAdminUsers()
          : Promise.resolve([] as AdminUser[]);

        const [allBookings, allProperties, allTenants, allTransactions, websiteSettings, allArticles, allAdminUsers] = await Promise.all([
          fetchBookings(),
          fetchProperties(),
          fetchTenants(currentSession.id, currentSession.role),
          fetchTransactions(currentSession.id, currentSession.role, currentSession.branchId),
          fetchSettings(),
          fetchArticles(),
          fetchAdminsPromise
        ]);
        setBookings(allBookings);
        setProperties(allProperties);
        setTenants(allTenants);
        setTransactions(allTransactions);
        setArticles(allArticles);
        setAdminUsers(allAdminUsers);

        if (websiteSettings) {
          setLogoText(websiteSettings.logo_text || 'HS');
          setLogoStartColor(websiteSettings.logo_gradient_start || '#89AACC');
          setLogoEndColor(websiteSettings.logo_gradient_end || '#4E85BF');
          setLogoImage(websiteSettings.logo_image || '');
          setBanners(websiteSettings.banners || []);
          setPromoEnabled(websiteSettings.promo_enabled === 'true');
          setPromoText(websiteSettings.promo_text || '');
          setWhatsappNumber(websiteSettings.whatsapp_number || '628123456789');
          setFacilitiesPremium(websiteSettings.facilities_premium || []);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      if (session.role === 'cashier') {
        setActiveTab('bookings');
      }
      Promise.resolve().then(() => {
        loadData(session);
      });
    } else {
      Promise.resolve().then(() => {
        setLoading(false);
      });
    }
  }, [session, loadData]);

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setSession(null);
    setTenantInfo(null);
    navigate('/');
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'rejected':
      case 'cancelled':
        return 'bg-rose-500/10 text-rose-400 border border-rose-500/20';
      case 'followup':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      case 'surveyed':
        return 'bg-purple-500/10 text-purple-400 border border-purple-500/20';
      case 'payments':
        return 'bg-teal-500/10 text-teal-400 border border-teal-500/20';
      case 'checked_out':
      case 'checked out':
      case 'completed':
        return 'bg-sky-500/10 text-sky-400 border border-sky-500/20';
      case 'pending':
      default:
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'approved':
      case 'confirmed':
        return 'APPROVED';
      case 'rejected':
      case 'cancelled':
        return 'REJECTED';
      case 'followup':
        return 'FOLLOW UP';
      case 'surveyed':
        return 'SURVEYED';
      case 'payments':
        return 'PAYMENTS';
      case 'checked_out':
      case 'checked out':
      case 'completed':
        return 'CHECKED OUT';
      case 'pending':
      default:
        return 'PENDING';
    }
  };

  const handleOpenApproveModal = (booking: Booking) => {
    setApprovingBooking(booking);
    setApproveIdCardNumber(booking.idCardNumber || '');
    setApproveIdCardPhoto(booking.idCardPhoto || '');
    setApproveAddress(booking.address || '');
    setApproveEmergencyContact(booking.emergencyContact || '');
    setApproveEmergencyPhone(booking.emergencyPhone || '');
    setApprovePhotoError('');
  };

  const handleApprovePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setApprovePhotoError('Pilih file gambar valid (PNG, JPG, dll).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApprovePhotoError('Ukuran gambar tidak boleh melebihi 5MB.');
      return;
    }

    setIsUploadingApprovePhoto(true);
    setApprovePhotoError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setApproveIdCardPhoto('/' + data.url);
    } catch (err) {
      console.error(err);
      setApprovePhotoError('Gagal mengunggah foto KTP. Silakan coba lagi.');
    } finally {
      setIsUploadingApprovePhoto(false);
    }
  };

  const handleConfirmApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingBooking || !approvingBooking.id) return;

    if (!approveIdCardNumber || !approveIdCardPhoto || !approveAddress || !approveEmergencyContact || !approveEmergencyPhone) {
      alert('Semua informasi identitas dan kontak darurat wajib diisi.');
      return;
    }

    try {
      const extraDetails = {
        idCardNumber: approveIdCardNumber,
        idCardPhoto: approveIdCardPhoto,
        address: approveAddress,
        emergencyContact: approveEmergencyContact,
        emergencyPhone: approveEmergencyPhone
      };

      await updateBookingStatus(approvingBooking.id, 'approved', session?.id, extraDetails);
      
      setBookings(prev => prev.map(b => b.id === approvingBooking.id ? { 
        ...b, 
        status: 'approved',
        idCardNumber: approveIdCardNumber,
        idCardPhoto: approveIdCardPhoto,
        address: approveAddress,
        emergencyContact: approveEmergencyContact,
        emergencyPhone: approveEmergencyPhone
      } : b));

      setApprovingBooking(null);

      if (session) {
        const txs = await fetchTransactions(session.id, session.role, session.branchId);
        setTransactions(txs);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Gagal menyetujui booking.');
    }
  };

  const handleUpdateMonthlyStatus = async (id: number, newStatus: string) => {
    try {
      await updateBookingStatus(id, newStatus, session?.id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
    } catch (err) {
      console.error(err);
      alert('Gagal memperbarui status booking.');
    }
  };

  // Booking Actions
  const handleRejectBooking = async (id: number) => {
    try {
      await updateBookingStatus(id, 'rejected', session?.id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
    } catch (err) {
      console.error(err);
      alert('Failed to update booking status.');
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

  const handleDeleteBookingRecord = async (id: number) => {
    if (!window.confirm('Delete this booking record?')) return;
    try {
      await deleteBooking(id);
      setBookings(prev => prev.filter(b => b.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete booking.');
    }
  };

  // Property Actions
  const handleOpenAddForm = () => {
    setEditingProperty(null);
    setTitle('');
    setCategory('Premium Boarding Room (Kos)');
    setType('kos');
    setPrice('Rp. 3.000.000 / month');
    setLocation('South Jakarta');
    setRating('4.8 ★');
    setImage('https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80');
    setMapUrl('');
    setHourlyRate('');
    setMinTransitHours('3');
    setTransit3h('');
    setTransit6h('');
    setTransit12h('');
    setTransit24h('');
    setPromoPrice('');
    setPromoLabel('');
    setAvailable(true);
    setDescription('');
    setRooms('0');
    setAvailableRooms('0');
    setBranchId('');
    setStatus('available');
    setIsFormOpen(true);
  };

  const handleOpenEditForm = (prop: Property) => {
    setEditingProperty(prop);
    setTitle(prop.title);
    setCategory(prop.category);
    setType(prop.type);
    setPrice(prop.price);
    setLocation(prop.location);
    setRating(prop.rating);
    setImage(prop.image);
    setMapUrl(prop.mapUrl || '');
    setHourlyRate(prop.hourlyRate !== undefined && prop.hourlyRate !== null ? String(prop.hourlyRate) : '');
    setMinTransitHours(prop.minTransitHours !== undefined ? String(prop.minTransitHours) : '3');
    setTransit3h(prop.transit3h !== undefined && prop.transit3h !== null ? String(prop.transit3h) : '');
    setTransit6h(prop.transit6h !== undefined && prop.transit6h !== null ? String(prop.transit6h) : '');
    setTransit12h(prop.transit12h !== undefined && prop.transit12h !== null ? String(prop.transit12h) : '');
    setTransit24h(prop.transit24h !== undefined && prop.transit24h !== null ? String(prop.transit24h) : '');
    setPromoPrice(prop.promoPrice !== undefined && prop.promoPrice !== null ? String(prop.promoPrice) : '');
    setPromoLabel(prop.promoLabel || '');
    setAvailable(prop.available === undefined ? true : !!prop.available);
    setDescription(prop.description || '');
    setRooms(prop.rooms !== undefined ? String(prop.rooms) : '0');
    setAvailableRooms(prop.availableRooms !== undefined ? String(prop.availableRooms) : '0');
    setBranchId(prop.branchId !== undefined && prop.branchId !== null ? String(prop.branchId) : '');
    setStatus(prop.status || 'available');
    setIsFormOpen(true);
  };

  const handleDeleteProp = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this property listing?')) return;
    try {
      await deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
      alert('Failed to delete property.');
    }
  };

  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !location || !image) {
      alert('Please fill in all required fields.');
      return;
    }

    let finalImage = image;
    if (finalImage.startsWith('/uploads/')) {
      finalImage = finalImage.substring(1);
    }

    const payload: Omit<Property, 'id'> = {
      title,
      category,
      type,
      price,
      location,
      rating,
      image: finalImage,
      mapUrl: mapUrl || undefined,
      hourlyRate: hourlyRate !== '' ? parseFloat(hourlyRate) : null,
      minTransitHours: minTransitHours !== '' ? parseInt(minTransitHours, 10) : 3,
      transit3h: transit3h !== '' ? parseFloat(transit3h) : null,
      transit6h: transit6h !== '' ? parseFloat(transit6h) : null,
      transit12h: transit12h !== '' ? parseFloat(transit12h) : null,
      transit24h: transit24h !== '' ? parseFloat(transit24h) : null,
      promoPrice: promoPrice !== '' ? parseFloat(promoPrice) : null,
      promoLabel: promoLabel || null,
      available: available ? 1 : 0,
      description: description || undefined,
      rooms: rooms !== '' ? parseInt(rooms, 10) : 0,
      availableRooms: availableRooms !== '' ? parseInt(availableRooms, 10) : 0,
      branchId: branchId !== '' ? parseInt(branchId, 10) : null,
      status: status,
      colSpan: editingProperty?.colSpan || 'md:col-span-5',
      aspectRatio: editingProperty?.aspectRatio || 'aspect-[4/3] md:aspect-[1.1/1]'
    };

    try {
      if (editingProperty && editingProperty.id) {
        const updated = await updateProperty(editingProperty.id, { id: editingProperty.id, ...payload });
        setProperties(prev => prev.map(p => p.id === editingProperty.id ? updated : p));
      } else {
        const created = await createProperty(payload);
        setProperties(prev => [...prev, created]);
      }
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      alert('Failed to save property.');
    }
  };

  // Article Actions
  const handleOpenAddArticleForm = () => {
    setEditingArticle(null);
    setArticleTitle('');
    setArticleContent('');
    setArticleImage('');
    setArticleReadTime('5 menit baca');
    setArticleUploadError('');
    setIsArticleFormOpen(true);
  };

  const handleOpenEditArticleForm = (art: Article) => {
    setEditingArticle(art);
    setArticleTitle(art.title);
    setArticleContent(art.content);
    setArticleImage(art.image || '');
    setArticleReadTime(art.read_time || '5 menit baca');
    setArticleUploadError('');
    setIsArticleFormOpen(true);
  };

  const handleArticleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setArticleUploadError('Pilih file gambar valid (PNG, JPG, dll).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setArticleUploadError('Ukuran gambar tidak boleh melebihi 5MB.');
      return;
    }

    setIsUploadingArticleImage(true);
    setArticleUploadError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setArticleImage('/' + data.url);
    } catch (err) {
      console.error(err);
      setArticleUploadError('Gagal mengunggah gambar. Silakan coba lagi.');
    } finally {
      setIsUploadingArticleImage(false);
    }
  };

  const handleSaveArticle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!articleTitle || !articleContent) {
      alert('Judul dan isi artikel harus diisi.');
      return;
    }

    const payload = {
      title: articleTitle,
      content: articleContent,
      image: articleImage,
      read_time: articleReadTime
    };

    try {
      if (editingArticle && editingArticle.id) {
        const updated = await updateArticle(editingArticle.id, payload);
        setArticles(prev => prev.map(a => a.id === editingArticle.id ? updated : a));
      } else {
        const created = await createArticle(payload);
        setArticles(prev => [created, ...prev]);
      }
      setIsArticleFormOpen(false);
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan artikel.');
    }
  };

  const handleDeleteArticle = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus artikel panduan ini?')) return;
    try {
      await deleteArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus artikel.');
    }
  };

  // Premium Facility Actions (In settings tab)
  const handleOpenAddFacilityForm = () => {
    setEditingFacilityIndex(null);
    setFacilityTitle('');
    setFacilityImage('');
    setFacilityUploadError('');
    setIsFacilityModalOpen(true);
  };

  const handleOpenEditFacilityForm = (idx: number) => {
    setEditingFacilityIndex(idx);
    setFacilityTitle(facilitiesPremium[idx].title);
    setFacilityImage(facilitiesPremium[idx].image);
    setFacilityUploadError('');
    setIsFacilityModalOpen(true);
  };

  const handleFacilityImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setFacilityUploadError('Pilih file gambar valid (PNG, JPG, dll).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setFacilityUploadError('Ukuran gambar tidak boleh melebihi 5MB.');
      return;
    }

    setIsUploadingFacilityImage(true);
    setFacilityUploadError('');

    const formData = new FormData();
    formData.append('image', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      setFacilityImage('/' + data.url);
    } catch (err) {
      console.error(err);
      setFacilityUploadError('Gagal mengunggah gambar. Silakan coba lagi.');
    } finally {
      setIsUploadingFacilityImage(false);
    }
  };

  const handleSaveFacility = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityTitle || !facilityImage) {
      alert('Nama dan gambar fasilitas harus diisi.');
      return;
    }

    if (editingFacilityIndex !== null) {
      // Edit
      setFacilitiesPremium(prev => prev.map((item, idx) => 
        idx === editingFacilityIndex 
          ? { ...item, title: facilityTitle, image: facilityImage } 
          : item
      ));
    } else {
      // Add
      const newId = facilitiesPremium.length > 0 ? Math.max(...facilitiesPremium.map(f => f.id)) + 1 : 1;
      const newRot = Math.floor(Math.random() * 11) - 5; // random between -5 and 5
      setFacilitiesPremium(prev => [
        ...prev,
        { id: newId, title: facilityTitle, image: facilityImage, rotation: newRot }
      ]);
    }
    setIsFacilityModalOpen(false);
  };

  const handleDeleteFacility = (indexToDelete: number) => {
    if (!window.confirm('Hapus fasilitas premium ini?')) return;
    setFacilitiesPremium(prev => prev.filter((_, idx) => idx !== indexToDelete));
  };

  // Staff User Management Actions
  const handleOpenAddUserForm = () => {
    setEditingUser(null);
    setUserUsername('');
    setUserPassword('');
    setUserName('');
    setUserEmail('');
    setUserRole('cashier');
    setUserBranchId('');
    setUserIsActive(true);
    setIsUserModalOpen(true);
  };

  const handleOpenEditUserForm = (usr: AdminUser) => {
    setEditingUser(usr);
    setUserUsername(usr.username);
    setUserPassword(''); // Leave blank if not changing
    setUserName(usr.name);
    setUserEmail(usr.email || '');
    setUserRole(usr.role);
    setUserBranchId(usr.branch_id !== undefined && usr.branch_id !== null ? String(usr.branch_id) : '');
    setUserIsActive(usr.is_active === undefined ? true : !!usr.is_active);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userUsername || !userName || (!editingUser && !userPassword)) {
      alert('Username, nama, dan password (untuk staf baru) wajib diisi.');
      return;
    }

    const payload = {
      username: userUsername,
      name: userName,
      email: userEmail || null,
      role: userRole,
      branch_id: userBranchId !== '' ? parseInt(userBranchId, 10) : null,
      is_active: userIsActive ? 1 : 0,
      ...(userPassword ? { password: userPassword } : {})
    };

    try {
      if (editingUser && editingUser.id) {
        const updated = await updateAdminUser(editingUser.id, payload);
        setAdminUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...updated } : u));
      } else {
        const created = await createAdminUser(payload);
        setAdminUsers(prev => [created, ...prev]);
      }
      setIsUserModalOpen(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Gagal menyimpan data staf.');
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (id === session?.id) {
      alert('Anda tidak bisa menghapus akun Anda sendiri.');
      return;
    }
    if (!window.confirm('Apakah Anda yakin ingin menghapus akun staf ini?')) return;
    try {
      await deleteAdminUser(id);
      setAdminUsers(prev => prev.filter(u => u.id !== id));
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus staf.');
    }
  };

  // Tenant Actions
  const handleOpenAddTenantModal = () => {
    setEditingTenant(null);
    setNewTenantName('');
    setNewTenantEmail('');
    setNewTenantPhone('');
    setNewTenantIdCardNumber('');
    setNewTenantIdCardPhoto('');
    setNewTenantAddress('');
    setNewTenantEmergencyContact('');
    setNewTenantEmergencyPhone('');
    setNewTenantStatus('active');
    setIsTenantModalOpen(true);
  };

  const handleOpenEditTenantModal = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setNewTenantName(tenant.name || '');
    setNewTenantEmail(tenant.email || '');
    setNewTenantPhone(tenant.phone || '');
    setNewTenantIdCardNumber(tenant.id_card_number || '');
    setNewTenantIdCardPhoto(tenant.id_card_photo || '');
    setNewTenantAddress(tenant.address || '');
    setNewTenantEmergencyContact(tenant.emergency_contact || '');
    setNewTenantEmergencyPhone(tenant.emergency_phone || '');
    setNewTenantStatus(tenant.status || 'active');
    setIsTenantModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantPhone) {
      alert('Name and phone number are required.');
      return;
    }
    const payload = {
      name: newTenantName,
      email: newTenantEmail || null,
      phone: newTenantPhone,
      id_card_number: newTenantIdCardNumber || null,
      id_card_photo: newTenantIdCardPhoto || null,
      address: newTenantAddress || null,
      emergency_contact: newTenantEmergencyContact || null,
      emergency_phone: newTenantEmergencyPhone || null,
      status: newTenantStatus,
      pic_admin_id: editingTenant ? editingTenant.pic_admin_id : (session?.id || null)
    };

    try {
      if (editingTenant && editingTenant.id) {
        await updateTenant(editingTenant.id, { id: editingTenant.id, ...payload });
      } else {
        await createTenant(payload);
      }

      setIsTenantModalOpen(false);
      setEditingTenant(null);
      setNewTenantName('');
      setNewTenantEmail('');
      setNewTenantPhone('');
      setNewTenantIdCardNumber('');
      setNewTenantIdCardPhoto('');
      setNewTenantAddress('');
      setNewTenantEmergencyContact('');
      setNewTenantEmergencyPhone('');
      setNewTenantStatus('active');

      if (session) {
        const refreshed = await fetchTenants(session.id, session.role);
        setTenants(refreshed);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to save tenant.');
    }
  };

  // Transaction Actions
  const handleSaveTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!txAmount || !txDate) {
      alert('Amount and date are required.');
      return;
    }
    try {
      await createTransaction({
        transaction_type: txType,
        category: txCategory || null,
        amount: parseFloat(txAmount),
        transaction_date: txDate,
        description: txDescription || null,
        recorded_by: session?.id || 1,
        branch_id: txBranchId ? parseInt(txBranchId, 10) : (session?.branchId || null)
      });

      setIsTxModalOpen(false);
      setTxType('income');
      setTxCategory('');
      setTxAmount('');
      setTxDescription('');
      setTxBranchId('');

      if (session) {
        const refreshed = await fetchTransactions(session.id, session.role, session.branchId);
        setTransactions(refreshed);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to log transaction.');
    }
  };

  // Filter Tenants
  const filteredTenants = tenants.filter(t => {
    const term = tenantSearchTerm.toLowerCase();
    return (
      t.name.toLowerCase().includes(term) ||
      (t.email && t.email.toLowerCase().includes(term)) ||
      t.phone.includes(term) ||
      (t.address && t.address.toLowerCase().includes(term))
    );
  });

  // Filter transactions by date range
  const filteredTransactions = transactions.filter(tx => {
    if (!tx.transaction_date) return true;
    const txDate = new Date(tx.transaction_date);
    if (earningStartDate) {
      const start = new Date(earningStartDate);
      start.setHours(0, 0, 0, 0);
      if (txDate < start) return false;
    }
    if (earningEndDate) {
      const end = new Date(earningEndDate);
      end.setHours(23, 59, 59, 999);
      if (txDate > end) return false;
    }
    return true;
  });

  // Calculate earnings stats
  const totalIncome = filteredTransactions
    .filter(t => t.transaction_type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpense = filteredTransactions
    .filter(t => t.transaction_type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const netEarnings = totalIncome - totalExpense;

  if (!loading && !session) {
    return (
      <div className="min-h-screen bg-bg text-text-primary flex flex-col justify-center items-center px-6">
        <div className="bg-surface/30 border border-stroke/50 rounded-3xl p-8 max-w-md w-full text-center backdrop-blur-md shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-2xl text-rose-400">🔒</span>
          </div>
          <h2 className="text-2xl font-display font-medium text-text-primary mb-3">Login Required</h2>
          <p className="text-sm text-muted mb-6 leading-relaxed">
            You must be signed in to view this page. Please return to the homepage and log in as either a tenant or an admin.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col font-sans select-none pb-12">
      {/* Top Header */}
      <header className="border-b border-stroke/50 bg-surface/40 backdrop-blur-md px-6 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center border border-white/10 bg-surface">
            {logoImage ? (
              <img 
                src={logoImage} 
                alt="Logo" 
                className="w-full h-full object-contain p-1"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/favicon.svg';
                }}
              />
            ) : (
              <span className="font-display italic text-[11px] font-bold text-text-primary">{logoText}</span>
            )}
          </div>
          <h1 className="text-lg font-semibold tracking-wide">
            {isAdminRole(session?.role) ? 'Highlanderstay Admin Portal' : 'Highlanderstay Tenant Portal'}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="text-xs uppercase tracking-[0.15em] font-semibold text-muted hover:text-text-primary border border-stroke px-4 py-2 rounded-full transition-colors duration-200"
          >
            ← Go To Website
          </button>
          <button 
            onClick={handleLogout}
            className="text-xs uppercase tracking-[0.15em] font-semibold text-rose-400 hover:text-rose-300 border border-rose-500/20 bg-rose-500/5 px-4 py-2 rounded-full transition-colors duration-200"
          >
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-[1200px] mx-auto w-full px-6 mt-8 flex-1">
        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-4 rounded-2xl mb-8 text-left">
            {error}
          </div>
        )}

        {/* Loader */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted">
            <div className="w-8 h-8 rounded-full border-2 border-stroke border-t-text-primary animate-spin mb-4" />
            <span className="text-xs uppercase tracking-widest font-medium">Loading records...</span>
          </div>
        ) : (
          <div>
            {/* ADMIN VIEW */}
            {isAdminRole(session?.role) && (
              <div>
                {/* Top Control Tabs */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-stroke/40 pb-6 mb-8 gap-4">
                  <div className="flex flex-wrap items-center gap-2 bg-surface border border-stroke p-1 rounded-full shadow-md">
                    <button
                      onClick={() => setActiveTab('bookings')}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full px-5 py-2.5 transition-all duration-300 ${
                        activeTab === 'bookings' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Transit ({bookings.filter(b => b.bookingType === 'transit').length})
                    </button>
                    <button
                      onClick={() => setActiveTab('monthly_bookings')}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full px-5 py-2.5 transition-all duration-300 ${
                        activeTab === 'monthly_bookings' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Bulanan ({bookings.filter(b => b.bookingType !== 'transit').length})
                    </button>
                    {session?.role !== 'cashier' && (
                      <button
                        onClick={() => setActiveTab('properties')}
                        className={`text-xs font-semibold uppercase tracking-wider rounded-full px-5 py-2.5 transition-all duration-300 ${
                          activeTab === 'properties' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                        }`}
                      >
                        Properties ({properties.length})
                      </button>
                    )}
                    <button
                      onClick={() => setActiveTab('tenants')}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full px-5 py-2.5 transition-all duration-300 ${
                        activeTab === 'tenants' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Tenants ({tenants.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('earnings')}
                      className={`text-xs font-semibold uppercase tracking-wider rounded-full px-5 py-2.5 transition-all duration-300 ${
                        activeTab === 'earnings' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                      }`}
                    >
                      Earnings
                    </button>
                    {session?.role !== 'cashier' && (
                      <button
                        onClick={() => setActiveTab('settings')}
                        className={`text-xs font-semibold uppercase tracking-wider rounded-full px-5 py-2.5 transition-all duration-300 ${
                          activeTab === 'settings' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                        }`}
                      >
                        Settings
                      </button>
                    )}
                    {session?.role !== 'cashier' && (
                      <button
                        onClick={() => setActiveTab('articles')}
                        className={`text-xs font-semibold uppercase tracking-wider rounded-full px-5 py-2.5 transition-all duration-300 ${
                          activeTab === 'articles' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                        }`}
                      >
                        Panduan Terbaru ({articles.length})
                      </button>
                    )}
                    {(session?.role === 'admin' || session?.role === 'owner') && (
                      <button
                        onClick={() => setActiveTab('users')}
                        className={`text-xs font-semibold uppercase tracking-wider rounded-full px-5 py-2.5 transition-all duration-300 ${
                          activeTab === 'users' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                        }`}
                      >
                        Kelola Staf ({adminUsers.length})
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => loadData(session!)}
                      className="text-xs uppercase tracking-wider font-semibold text-muted hover:text-text-primary border border-stroke/60 px-4 py-2.5 rounded-full transition-colors duration-200"
                    >
                      Refresh
                    </button>
                    {activeTab === 'properties' && (
                      <button
                        onClick={handleOpenAddForm}
                        className="relative group rounded-full text-xs font-semibold uppercase tracking-wider px-6 py-2.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        + Add Space
                      </button>
                    )}
                    {activeTab === 'tenants' && (
                      <button
                        onClick={handleOpenAddTenantModal}
                        className="relative group rounded-full text-xs font-semibold uppercase tracking-wider px-6 py-2.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        + Add Tenant
                      </button>
                    )}
                    {activeTab === 'earnings' && (
                      <button
                        onClick={() => setIsTxModalOpen(true)}
                        className="relative group rounded-full text-xs font-semibold uppercase tracking-wider px-6 py-2.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        + Log Billing
                      </button>
                    )}
                    {activeTab === 'articles' && (
                      <button
                        onClick={handleOpenAddArticleForm}
                        className="relative group rounded-full text-xs font-semibold uppercase tracking-wider px-6 py-2.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        + Tambah Artikel
                      </button>
                    )}
                    {activeTab === 'users' && (
                      <button
                        onClick={handleOpenAddUserForm}
                        className="relative group rounded-full text-xs font-semibold uppercase tracking-wider px-6 py-2.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent"
                      >
                        <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                        + Tambah Staf
                      </button>
                    )}
                  </div>
                </div>

                {/* BOOKINGS TABLE TAB */}
                {activeTab === 'bookings' && (
                  <div className="bg-surface/30 border border-stroke/50 rounded-3xl overflow-hidden shadow-xl">
                    {bookings.filter(b => b.bookingType === 'transit').length === 0 ? (
                      <div className="py-16 text-center text-muted text-xs uppercase tracking-widest font-medium">
                        No transit bookings found in the database.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-stroke/60 bg-surface/50 text-[10px] text-muted uppercase tracking-[0.15em] font-semibold">
                              <th className="py-4 px-6">Tenant</th>
                              <th className="py-4 px-6">Space Preference</th>
                              <th className="py-4 px-6">Schedule / Date</th>
                              <th className="py-4 px-6">Amount</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6">PIC</th>
                              <th className="py-4 px-6">Created At</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stroke/30 text-sm">
                            {bookings.filter(b => b.bookingType === 'transit').map((booking) => (
                              <tr key={booking.id} className="hover:bg-surface/20 transition-colors duration-200">
                                <td className="py-4 px-6">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-text-primary">{booking.userName}</span>
                                    <span className="text-xs text-muted font-light">{booking.userEmail}</span>
                                    {booking.phone && <span className="text-[11px] text-muted font-light mt-0.5">{booking.phone}</span>}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-text-primary font-medium">
                                  <div className="flex flex-col">
                                    <span>{booking.propertyName}</span>
                                    {booking.bookingType === 'transit' && (
                                      <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider mt-0.5">
                                        Transit (Hourly)
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-muted">
                                  {booking.bookingType === 'transit' ? (
                                    <span className="text-xs font-medium text-text-primary">
                                      {formatTransitDateTime(booking.transitStartTime, booking.transitEndTime)}
                                    </span>
                                  ) : (
                                    <span>{booking.moveInDate}</span>
                                  )}
                                </td>
                                <td className="py-4 px-6 text-emerald-400 font-semibold font-sans">
                                  {formatCurrency(getBookingAmount(booking))}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${getStatusBadgeClass(booking.status)}`}>
                                    {getStatusLabel(booking.status)}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-xs font-medium text-text-primary font-sans">
                                  {booking.approvedByName || '-'}
                                </td>
                                <td className="py-4 px-6 text-xs text-muted">
                                  {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '-'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex justify-end gap-2">
                                    {booking.status === 'pending' && (
                                      <>
                                        <button
                                          onClick={() => handleOpenApproveModal(booking)}
                                          className="text-xs font-semibold bg-emerald-500 text-bg hover:bg-emerald-400 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                          Approve
                                        </button>
                                        <button
                                          onClick={() => handleRejectBooking(booking.id!)}
                                          className="text-xs font-semibold bg-rose-500 text-bg hover:bg-rose-400 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                          Reject
                                        </button>
                                      </>
                                    )}
                                    {booking.status === 'approved' && (
                                      <button
                                        onClick={() => handleCheckoutTransit(booking.id!)}
                                        className="text-xs font-semibold bg-blue-500 text-bg hover:bg-blue-400 px-3 py-1.5 rounded-lg transition-colors"
                                      >
                                        Checkout
                                      </button>
                                    )}
                                    {(booking.status === 'checked_out' || booking.status === 'checked out') && (
                                      <button
                                        onClick={() => setSelectedInvoiceBooking(booking)}
                                        className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                                      >
                                        <Printer className="w-3.5 h-3.5" />
                                        Invoice
                                      </button>
                                    )}
                                    {session?.role !== 'cashier' && (
                                      <button
                                        onClick={() => handleDeleteBookingRecord(booking.id!)}
                                        className="text-xs font-semibold border border-stroke text-muted hover:text-rose-400 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* MONTHLY BOOKINGS TABLE TAB */}
                {activeTab === 'monthly_bookings' && (
                  <div className="bg-surface/30 border border-stroke/50 rounded-3xl overflow-hidden shadow-xl">
                    {bookings.filter(b => b.bookingType !== 'transit').length === 0 ? (
                      <div className="py-16 text-center text-muted text-xs uppercase tracking-widest font-medium">
                        No monthly bookings found in the database.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-stroke/60 bg-surface/50 text-[10px] text-muted uppercase tracking-[0.15em] font-semibold">
                              <th className="py-4 px-6">Tenant</th>
                              <th className="py-4 px-6">Space Preference</th>
                              <th className="py-4 px-6 font-sans">Move In Date</th>
                              <th className="py-4 px-6">Status</th>
                              <th className="py-4 px-6">PIC</th>
                              <th className="py-4 px-6 font-sans">Notes/Survey</th>
                              <th className="py-4 px-6">Created At</th>
                              <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stroke/30 text-sm">
                            {bookings.filter(b => b.bookingType !== 'transit').map((booking) => (
                              <tr key={booking.id} className="hover:bg-surface/20 transition-colors duration-200">
                                <td className="py-4 px-6">
                                  <div className="flex flex-col">
                                    <span className="font-semibold text-text-primary">{booking.userName}</span>
                                    <span className="text-xs text-muted font-light">{booking.userEmail}</span>
                                    {booking.phone && <span className="text-[11px] text-muted">{booking.phone}</span>}
                                  </div>
                                </td>
                                <td className="py-4 px-6 text-text-primary font-medium">
                                  {booking.propertyName}
                                </td>
                                <td className="py-4 px-6 text-muted">
                                  {booking.moveInDate}
                                </td>
                                <td className="py-4 px-6">
                                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${getStatusBadgeClass(booking.status)}`}>
                                    {getStatusLabel(booking.status)}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-xs font-medium text-text-primary font-sans">
                                  {booking.approvedByName || '-'}
                                </td>
                                <td className="py-4 px-6 text-xs text-muted max-w-[200px] truncate font-sans" title={booking.notes || ''}>
                                  {booking.notes || '-'}
                                </td>
                                <td className="py-4 px-6 text-xs text-muted">
                                  {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '-'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex justify-end gap-2">
                                    {booking.status !== 'followup' && (
                                      <button
                                        onClick={() => handleUpdateMonthlyStatus(booking.id!, 'followup')}
                                        className="text-xs font-semibold bg-blue-500 text-bg hover:bg-blue-400 px-3 py-1.5 rounded-lg transition-colors font-sans"
                                      >
                                        Follow Up
                                      </button>
                                    )}
                                    {booking.status !== 'surveyed' && (
                                      <button
                                        onClick={() => handleUpdateMonthlyStatus(booking.id!, 'surveyed')}
                                        className="text-xs font-semibold bg-purple-500 text-bg hover:bg-purple-400 px-3 py-1.5 rounded-lg transition-colors font-sans"
                                      >
                                        Surveyed
                                      </button>
                                    )}
                                    {booking.status !== 'payments' && (
                                      <button
                                        onClick={() => handleUpdateMonthlyStatus(booking.id!, 'payments')}
                                        className="text-xs font-semibold bg-teal-500 text-bg hover:bg-teal-400 px-3 py-1.5 rounded-lg transition-colors font-sans"
                                      >
                                        Payments
                                      </button>
                                    )}
                                    {session?.role !== 'cashier' && (
                                      <button
                                        onClick={() => handleDeleteBookingRecord(booking.id!)}
                                        className="text-xs font-semibold border border-stroke text-muted hover:text-rose-400 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors"
                                      >
                                        Delete
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* PROPERTIES TAB LIST */}
                {activeTab === 'properties' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {properties.length === 0 ? (
                      <div className="col-span-2 py-16 text-center text-muted text-xs uppercase tracking-widest font-medium">
                        No properties listings found in the database.
                      </div>
                    ) : (
                      properties.map((prop) => (
                        <div 
                          key={prop.id}
                          className="bg-surface/30 border border-stroke/50 rounded-3xl p-5 flex gap-4 items-center hover:border-white/10 transition-colors shadow-lg"
                        >
                          <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border border-stroke bg-surface">
                            <img 
                              src={prop.image} 
                              alt={prop.title} 
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback image if unsplash URL is invalid
                                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex justify-between items-start gap-2 mb-1">
                              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold truncate">
                                {prop.category}
                              </span>
                              <span className="text-xs font-bold text-text-primary shrink-0">
                                {prop.rating}
                              </span>
                            </div>
                            <h4 className="text-base font-semibold text-text-primary truncate mb-1">
                              {prop.title}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-muted flex-wrap">
                              <span>{prop.location}</span>
                              <span className="w-1 h-1 rounded-full bg-stroke" />
                              {prop.promoPrice ? (
                                <div className="flex items-center gap-1.5 font-medium">
                                  <span className="animate-strike text-text-primary/45 text-[10px]">
                                    Rp. {Number(prop.rawPrice).toLocaleString('id-ID')}
                                  </span>
                                  <span className="text-emerald-400">
                                    Rp. {Number(prop.promoPrice).toLocaleString('id-ID')} / month
                                  </span>
                                </div>
                              ) : (
                                <span className="text-text-primary font-medium">{prop.price}</span>
                              )}
                              {(prop.transit3h || prop.transit6h || prop.transit12h || prop.transit24h) ? (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-stroke" />
                                  <span className="text-emerald-400 font-semibold text-[11px]">
                                    Transit: 3h({prop.transit3h ? formatCurrency(prop.transit3h) : '-'}) | 6h({prop.transit6h ? formatCurrency(prop.transit6h) : '-'}) | 12h({prop.transit12h ? formatCurrency(prop.transit12h) : '-'}) | 24h({prop.transit24h ? formatCurrency(prop.transit24h) : '-'})
                                  </span>
                                </>
                              ) : prop.hourlyRate ? (
                                <>
                                  <span className="w-1 h-1 rounded-full bg-stroke" />
                                  <span className="text-emerald-400 font-semibold">{formatCurrency(prop.hourlyRate)}/hr</span>
                                </>
                              ) : null}
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-muted mt-2">
                              <span className={`px-2 py-0.5 rounded-full border ${prop.status === 'full' ? 'bg-rose-500/15 border-rose-500/20 text-rose-400' : 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'}`}>
                                {prop.status === 'full' ? 'FULL' : 'AVAILABLE'}
                              </span>
                              <span>Rooms: {prop.availableRooms}/{prop.rooms}</span>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 shrink-0">
                            <button
                              onClick={() => handleOpenEditForm(prop)}
                              className="text-xs font-semibold border border-stroke hover:border-white/20 text-text-primary px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteProp(prop.id!)}
                              className="text-xs font-semibold border border-stroke hover:border-rose-500/30 text-muted hover:text-rose-400 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* TENANTS DATABASE TAB */}
                {activeTab === 'tenants' && (
                  <div className="flex flex-col gap-6">
                    {/* Search and Filters */}
                    <div className="flex justify-between items-center gap-4 bg-surface/20 border border-stroke/40 p-4 rounded-3xl backdrop-blur-md">
                      <div className="relative flex-1 max-w-md">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
                        <input 
                          type="text"
                          placeholder="Search tenants by name, email, phone or address..."
                          value={tenantSearchTerm}
                          onChange={(e) => setTenantSearchTerm(e.target.value)}
                          className="w-full bg-bg border border-stroke rounded-2xl pl-10 pr-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                        />
                      </div>
                      <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">
                        Showing {filteredTenants.length} of {tenants.length} Tenants
                      </span>
                    </div>

                    {/* Tenants Table */}
                    <div className="bg-surface/30 border border-stroke/50 rounded-3xl overflow-hidden shadow-xl">
                      {filteredTenants.length === 0 ? (
                        <div className="py-16 text-center text-muted text-xs uppercase tracking-widest font-medium">
                          No tenants found matching your query.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-stroke/60 bg-surface/50 text-[10px] text-muted uppercase tracking-[0.15em] font-semibold">
                                <th className="py-4 px-6">Name & Email</th>
                                <th className="py-4 px-6">Contact Info</th>
                                <th className="py-4 px-6">ID Details</th>
                                <th className="py-4 px-6">Address</th>
                                <th className="py-4 px-6">Emergency Contact</th>
                                <th className="py-4 px-6">PIC / Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stroke/30 text-sm">
                              {filteredTenants.map((t) => (
                                <tr key={t.id} className="hover:bg-surface/20 transition-colors duration-200">
                                  <td className="py-4 px-6">
                                    <div className="flex flex-col text-left">
                                      <span className="font-semibold text-text-primary">{t.name}</span>
                                      <span className="text-xs text-muted font-light">{t.email || 'No email registered'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-left">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-text-primary">{t.phone}</span>
                                      <span className="text-[10px] text-muted">Password: [Same as Phone]</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-left">
                                    <div className="flex flex-col">
                                      <span className="font-medium text-text-primary">{t.id_card_number || 'N/A'}</span>
                                      {t.id_card_photo && (
                                        <a href={t.id_card_photo} target="_blank" rel="noreferrer" className="text-[10px] text-emerald-400 hover:underline">
                                          View ID Card File
                                        </a>
                                      )}
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-left text-xs max-w-[200px] truncate text-muted" title={t.address || ''}>
                                    {t.address || 'N/A'}
                                  </td>
                                  <td className="py-4 px-6 text-left">
                                    {t.emergency_contact ? (
                                      <div className="flex flex-col">
                                        <span className="font-semibold text-text-primary">{t.emergency_contact}</span>
                                        <span className="text-xs text-muted">{t.emergency_phone || '-'}</span>
                                      </div>
                                    ) : (
                                      <span className="text-muted">N/A</span>
                                    )}
                                  </td>
                                  <td className="py-4 px-6 text-left">
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                        t.status === 'active' 
                                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                      }`}>
                                        {t.status}
                                      </span>
                                      <span className="text-[10px] text-muted">PIC: {t.pic_admin_name || 'System / Default'}</span>
                                    </div>
                                  </td>
                                  <td className="py-4 px-6 text-right">
                                    <button
                                      onClick={() => handleOpenEditTenantModal(t)}
                                      className="text-xs font-semibold border border-stroke hover:border-white/20 text-text-primary px-3 py-1.5 rounded-lg transition-colors font-sans"
                                    >
                                      Edit
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* EARNINGS / CASHIER TAB */}
                {activeTab === 'earnings' && (
                  <div className="flex flex-col gap-8">
                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-surface/30 border border-stroke/50 rounded-3xl p-6 text-left backdrop-blur-md shadow-lg relative overflow-hidden">
                        <div className="absolute right-4 top-4 text-3xl opacity-20">💰</div>
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Total Revenue / Income</span>
                        <h3 className="text-3xl font-semibold text-emerald-400 mt-2">{formatCurrency(totalIncome)}</h3>
                        <p className="text-[10px] text-muted mt-2">Includes bookings and manual logs</p>
                      </div>

                      <div className="bg-surface/30 border border-stroke/50 rounded-3xl p-6 text-left backdrop-blur-md shadow-lg relative overflow-hidden">
                        <div className="absolute right-4 top-4 text-3xl opacity-20">💸</div>
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Total Expense / Outcome</span>
                        <h3 className="text-3xl font-semibold text-rose-400 mt-2">{formatCurrency(totalExpense)}</h3>
                        <p className="text-[10px] text-muted mt-2">Log operational expenses manually</p>
                      </div>

                      <div className="bg-surface/30 border border-stroke/50 rounded-3xl p-6 text-left backdrop-blur-md shadow-lg relative overflow-hidden">
                        <div className="absolute right-4 top-4 text-3xl opacity-20">📈</div>
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Net Earnings</span>
                        <h3 className={`text-3xl font-semibold mt-2 ${netEarnings >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(netEarnings)}
                        </h3>
                        <p className="text-[10px] text-muted mt-2">Total Income minus Expenses</p>
                      </div>
                    </div>

                    {/* Transaction Logs Table */}
                    <div className="bg-surface/30 border border-stroke/50 rounded-3xl overflow-hidden shadow-xl text-left">
                      <div className="px-6 py-4 border-b border-stroke/60 bg-surface/50 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary">
                          Transaction Histories & Bills
                        </h4>
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Start Date:</label>
                            <input 
                              type="date"
                              value={earningStartDate}
                              onChange={(e) => setEarningStartDate(e.target.value)}
                              className="bg-bg border border-stroke rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-text-primary/40 font-sans"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">End Date:</label>
                            <input 
                              type="date"
                              value={earningEndDate}
                              onChange={(e) => setEarningEndDate(e.target.value)}
                              className="bg-bg border border-stroke rounded-xl px-3 py-1.5 text-xs text-text-primary focus:outline-none focus:border-text-primary/40 font-sans"
                            />
                          </div>
                          {(earningStartDate || earningEndDate) && (
                            <button
                              onClick={() => {
                                setEarningStartDate('');
                                setEarningEndDate('');
                              }}
                              className="text-[10px] uppercase font-bold tracking-wider text-rose-400 hover:text-rose-300 transition-colors py-1 px-2 border border-rose-500/20 bg-rose-500/5 rounded-lg"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                      </div>
                      {filteredTransactions.length === 0 ? (
                        <div className="py-16 text-center text-muted text-xs uppercase tracking-widest font-medium">
                          No transactions found for the selected date range.
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="border-b border-stroke/60 bg-surface/50 text-[10px] text-muted uppercase tracking-[0.15em] font-semibold">
                                <th className="py-4 px-6">Date</th>
                                <th className="py-4 px-6">Type</th>
                                <th className="py-4 px-6">Category</th>
                                <th className="py-4 px-6">Amount</th>
                                <th className="py-4 px-6">Description</th>
                                <th className="py-4 px-6">Recorded By</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-stroke/30 text-sm">
                              {filteredTransactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-surface/20 transition-colors duration-200">
                                  <td className="py-4 px-6 text-xs text-muted">
                                    {tx.transaction_date ? new Date(tx.transaction_date).toLocaleDateString() : '-'}
                                  </td>
                                  <td className="py-4 px-6">
                                    <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                                      tx.transaction_type === 'income' 
                                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                    }`}>
                                      {tx.transaction_type}
                                    </span>
                                  </td>
                                  <td className="py-4 px-6 text-xs text-text-primary capitalize">
                                    {tx.category || 'general'}
                                  </td>
                                  <td className={`py-4 px-6 font-semibold ${tx.transaction_type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {tx.transaction_type === 'income' ? '+' : '-'} {formatCurrency(tx.amount)}
                                  </td>
                                  <td className="py-4 px-6 text-muted text-xs max-w-sm truncate" title={tx.description || ''}>
                                    {tx.description || 'No description provided'}
                                  </td>
                                  <td className="py-4 px-6 text-xs text-muted">
                                    {tx.recorded_by_name || `Admin #${tx.recorded_by}`}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'settings' && (
                  <div className="bg-surface/30 border border-stroke/50 rounded-3xl p-6 md:p-8 text-left backdrop-blur-md shadow-lg">
                    <h3 className="text-lg font-semibold mb-6 text-text-primary flex items-center gap-2">
                      ⚙️ Website Settings & Branding
                    </h3>
                    
                    <form onSubmit={handleSaveSettings} className="flex flex-col gap-8">
                      {/* Logo Customization */}
                      <div className="border-b border-stroke/40 pb-6">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary mb-4">Logo branding</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-muted uppercase tracking-wider">Logo Text</label>
                            <input 
                              type="text"
                              value={logoText}
                              onChange={(e) => setLogoText(e.target.value)}
                              className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-muted uppercase tracking-wider">Logo Gradient Start</label>
                            <div className="flex gap-2">
                              <input 
                                type="color"
                                value={logoStartColor}
                                onChange={(e) => setLogoStartColor(e.target.value)}
                                className="w-10 h-10 bg-transparent border-0 cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={logoStartColor}
                                onChange={(e) => setLogoStartColor(e.target.value)}
                                className="w-full bg-bg border border-stroke rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs text-muted uppercase tracking-wider">Logo Gradient End</label>
                            <div className="flex gap-2">
                              <input 
                                type="color"
                                value={logoEndColor}
                                onChange={(e) => setLogoEndColor(e.target.value)}
                                className="w-10 h-10 bg-transparent border-0 cursor-pointer"
                              />
                              <input 
                                type="text"
                                value={logoEndColor}
                                onChange={(e) => setLogoEndColor(e.target.value)}
                                className="w-full bg-bg border border-stroke rounded-xl px-3 py-2 text-xs text-text-primary focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Logo Image Uploader */}
                        <div className="flex flex-col gap-1.5 mt-4">
                          <label className="text-xs text-muted uppercase tracking-wider font-semibold">Logo Image (Overrides text logo)</label>
                          <div className="flex items-center gap-4 p-4 rounded-xl border border-stroke bg-bg/50 hover:bg-bg transition-colors">
                            {/* Preview Thumbnail */}
                            <div className="relative w-12 h-12 rounded-full overflow-hidden border border-stroke bg-bg-muted flex-shrink-0 flex items-center justify-center bg-surface">
                              {logoImage ? (
                                <img 
                                  src={logoImage} 
                                  alt="Logo Preview" 
                                  className="w-full h-full object-contain p-1"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = '/favicon.svg';
                                  }}
                                />
                              ) : (
                                <div className="text-muted text-[10px] text-center px-1">No Image</div>
                              )}
                              {isUploadingLogo && (
                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                                </div>
                              )}
                            </div>
                            
                            {/* Upload Controls */}
                            <div className="flex-1 flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-white/10 hover:bg-white/15 text-text-primary font-medium text-xs py-2 px-3.5 rounded-lg border border-white/5 inline-flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] w-fit">
                                  <Upload className="w-3 h-3" />
                                  {isUploadingLogo ? 'Uploading...' : 'Choose Logo Image'}
                                  <input 
                                    type="file" 
                                    accept="image/*" 
                                    onChange={handleLogoImageUpload} 
                                    className="hidden" 
                                    disabled={isUploadingLogo}
                                  />
                                </label>
                                {logoImage && (
                                  <button
                                    type="button"
                                    onClick={() => setLogoImage('')}
                                    className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2.5 py-1 rounded-lg border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 transition-colors"
                                  >
                                    Clear Image (Use Text)
                                  </button>
                                )}
                              </div>
                              <p className="text-[10px] text-muted leading-normal">
                                Supports PNG, JPG, SVG or WEBP up to 2MB.
                              </p>
                              {logoUploadError && (
                                <p className="text-[10px] text-red-400 font-medium">
                                  {logoUploadError}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Logo Live Preview */}
                        <div className="mt-4 p-4 bg-bg/50 border border-stroke/60 rounded-2xl flex items-center gap-4 w-fit">
                          <span className="text-xs text-muted uppercase tracking-wider font-semibold">Live Logo Preview:</span>
                          {logoImage ? (
                            <div className="relative w-10 h-10 flex items-center justify-center rounded-full overflow-hidden border border-white/10 bg-surface">
                              <img 
                                src={logoImage} 
                                alt="Live Logo Preview" 
                                className="w-full h-full object-contain p-1"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = '/favicon.svg';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="relative w-10 h-10 flex items-center justify-center rounded-full overflow-hidden">
                              <div 
                                className="absolute inset-0"
                                style={{
                                  background: `linear-gradient(90deg, ${logoStartColor} 0%, ${logoEndColor} 100%)`,
                                }}
                              />
                              <div className="absolute inset-[2.5px] bg-bg rounded-full flex items-center justify-center">
                                <span className="font-display italic text-[14px] text-text-primary font-bold tracking-tight">{logoText}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Promo Bar Customization */}
                      <div className="border-b border-stroke/40 pb-6">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary">Promo announcement bar</h4>
                          <div className="flex items-center gap-2">
                            <input 
                              type="checkbox"
                              id="promoEnabled"
                              checked={promoEnabled}
                              onChange={(e) => setPromoEnabled(e.target.checked)}
                              className="w-4 h-4 accent-text-primary cursor-pointer"
                            />
                            <label htmlFor="promoEnabled" className="text-xs text-muted uppercase tracking-wider select-none cursor-pointer">
                              Enable Bar
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-muted uppercase tracking-wider">Promo text message</label>
                          <input 
                            type="text"
                            value={promoText}
                            onChange={(e) => setPromoText(e.target.value)}
                            placeholder="Special Promo: Use code FIRSTMO for 10% off your first month!"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
                          />
                        </div>

                        {/* Promo Live Preview */}
                        {promoEnabled && (
                          <div className="mt-4 p-3 bg-bg/50 border border-stroke/60 rounded-2xl flex items-center gap-3 text-xs w-full">
                            <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Live Promo Preview:</span>
                            <div className="flex-1 bg-gradient-to-r from-stroke/20 via-surface/40 to-stroke/20 border border-white/10 px-4 py-1.5 rounded-full flex items-center justify-between">
                              <span className="text-text-primary font-medium truncate">{promoText || 'Promo message will display here...'}</span>
                              <span className="text-[9px] text-text-primary font-bold uppercase tracking-wider border border-white/10 bg-white/5 px-2 py-0.5 rounded-full shrink-0">Promo Active</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {/* WhatsApp Integration Settings */}
                      <div className="border-b border-stroke/40 pb-6">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary mb-4">WhatsApp Integration</h4>
                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs text-muted uppercase tracking-wider">WhatsApp Admin Number</label>
                          <input 
                            type="text"
                            value={whatsappNumber}
                            onChange={(e) => setWhatsappNumber(e.target.value.replace(/[^\d]/g, ''))}
                            placeholder="e.g. 628123456789"
                            className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
                          />
                          <p className="text-[10px] text-muted leading-normal font-light">
                            Input numbers only, including country code (e.g. 62 for Indonesia). Avoid leading 0 or characters like '+' or '-'.
                          </p>
                        </div>
                      </div>

                      {/* Hero Banner Customization */}
                      <div>
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary mb-4">Spesifikasi Banner Kampanye (Home Page)</h4>
                        <p className="text-xs text-muted mb-6 leading-relaxed">
                          Tambahkan beberapa gambar banner promosi. Banner-banner ini akan ditampilkan sebagai carousel interaktif di halaman utama. Semua teks dan CTA pada banner akan dihilangkan, sehingga desain grafis banner Anda akan tampil penuh dan bersih.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                          {/* Banner list */}
                          {banners.map((url, index) => (
                            <div key={index} className="relative group aspect-[16/10] rounded-xl overflow-hidden border border-stroke bg-bg/50">
                              <img 
                                src={url} 
                                alt={`Banner ${index + 1}`} 
                                className="w-full h-full object-cover"
                              />
                              {/* Hover delete overlay */}
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteBanner(index)}
                                  className="p-2 rounded-full bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                  title="Hapus Banner"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                                <span className="text-[10px] text-white/80 font-medium font-body">Hapus</span>
                              </div>
                              {/* Index badge */}
                              <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] text-white px-2 py-0.5 rounded-md font-semibold border border-white/10 font-body">
                                Banner {index + 1}
                              </div>
                            </div>
                          ))}

                          {/* Add Banner Card */}
                          <label className={`relative aspect-[16/10] rounded-xl border border-dashed border-stroke bg-surface hover:bg-bg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group ${isUploadingBanner ? 'pointer-events-none opacity-60' : ''}`}>
                            {isUploadingBanner ? (
                              <>
                                <Loader2 className="w-6 h-6 animate-spin text-muted" />
                                <span className="text-[10px] text-muted font-medium font-body">Mengunggah...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-6 h-6 text-muted group-hover:text-text-primary transition-colors" />
                                <span className="text-[10px] text-muted font-medium font-body">Tambah Banner</span>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  onChange={handleBannerImageUpload} 
                                  className="hidden" 
                                  disabled={isUploadingBanner}
                                />
                              </>
                            )}
                          </label>
                        </div>

                        {bannerUploadError && (
                          <p className="text-xs text-red-400 font-medium mb-4 font-body">
                            {bannerUploadError}
                          </p>
                        )}
                      </div>

                      {/* Fasilitas Premium Customization */}
                      <div className="border-t border-stroke/40 pt-6">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary mb-4 font-sans">Fasilitas Premium (Home Page)</h4>
                        <p className="text-xs text-muted mb-6 leading-relaxed font-body">
                          Kelola daftar fasilitas premium yang ditampilkan pada halaman utama. Anda dapat menambahkan nama fasilitas dan mengunggah gambar.
                        </p>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
                          {/* Facilities list */}
                          {facilitiesPremium.map((facility, index) => (
                            <div key={facility.id || index} className="relative group aspect-square rounded-xl overflow-hidden border border-stroke bg-bg/50">
                              <img 
                                src={facility.image} 
                                alt={facility.title} 
                                className="w-full h-full object-cover"
                              />
                              {/* Hover actions overlay */}
                              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center gap-2">
                                <div className="flex gap-2">
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditFacilityForm(index)}
                                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white hover:bg-text-primary hover:text-bg transition-all active:scale-95 text-xs font-semibold"
                                    title="Edit Fasilitas"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteFacility(index)}
                                    className="p-2 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                                    title="Hapus Fasilitas"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              {/* Title badge */}
                              <div className="absolute bottom-2 left-2 right-2 bg-black/60 backdrop-blur-md text-[10px] text-white px-2 py-1 rounded-md font-semibold border border-white/10 font-body truncate">
                                {facility.title}
                              </div>
                            </div>
                          ))}

                          {/* Add Facility Card */}
                          <button
                            type="button"
                            onClick={handleOpenAddFacilityForm}
                            className="relative aspect-square rounded-xl border border-dashed border-stroke bg-surface hover:bg-bg transition-all flex flex-col items-center justify-center gap-2 cursor-pointer group"
                          >
                            <Plus className="w-6 h-6 text-muted group-hover:text-text-primary transition-colors" />
                            <span className="text-[10px] text-muted font-medium font-body font-sans">Tambah Fasilitas</span>
                          </button>
                        </div>
                      </div>

                      {/* Submit button */}
                      <button
                        type="submit"
                        disabled={isSavingSettings}
                        className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent mt-4 flex items-center justify-center gap-2"
                      >
                        {isSavingSettings ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" /> Saving settings...
                          </>
                        ) : (
                          <>
                            <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                            Save Website Settings
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* ARTICLES TAB */}
                {activeTab === 'articles' && (
                  <div className="bg-surface/30 border border-stroke/50 rounded-3xl overflow-hidden shadow-xl text-left">
                    <div className="px-6 py-4 border-b border-stroke/60 bg-surface/50 flex justify-between items-center">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary font-sans">
                        Daftar Panduan & Artikel
                      </h4>
                    </div>
                    {articles.length === 0 ? (
                      <div className="py-16 text-center text-muted text-xs uppercase tracking-widest font-medium">
                        Belum ada artikel panduan yang terdaftar.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-stroke/60 bg-surface/50 text-[10px] text-muted uppercase tracking-[0.15em] font-semibold font-sans">
                              <th className="py-4 px-6">Gambar</th>
                              <th className="py-4 px-6">Judul</th>
                              <th className="py-4 px-6">Waktu Baca</th>
                              <th className="py-4 px-6">Tanggal Rilis</th>
                              <th className="py-4 px-6 text-right">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stroke/30 text-sm">
                            {articles.map((art) => (
                              <tr key={art.id} className="hover:bg-surface/20 transition-colors duration-200">
                                <td className="py-4 px-6 shrink-0">
                                  <div className="w-16 h-10 rounded-lg overflow-hidden border border-stroke bg-surface">
                                    {art.image ? (
                                      <img 
                                        src={art.image} 
                                        alt={art.title} 
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full bg-bg-muted flex items-center justify-center text-[10px] text-muted font-sans">
                                        No Image
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="py-4 px-6 font-semibold text-text-primary font-sans">
                                  {art.title}
                                </td>
                                <td className="py-4 px-6 text-muted text-xs font-sans">
                                  {art.read_time || '5 menit baca'}
                                </td>
                                <td className="py-4 px-6 text-xs text-muted font-sans">
                                  {art.created_at ? new Date(art.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenEditArticleForm(art)}
                                      className="text-xs font-semibold border border-stroke text-text-primary hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors font-sans"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      onClick={() => handleDeleteArticle(art.id!)}
                                      className="text-xs font-semibold border border-stroke text-muted hover:text-rose-400 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors font-sans"
                                    >
                                      Hapus
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}

                {/* STAFF USER MANAGEMENT TAB */}
                {activeTab === 'users' && (
                  <div className="bg-surface/30 border border-stroke/50 rounded-3xl overflow-hidden shadow-xl text-left animate-fade-in">
                    <div className="px-6 py-4 border-b border-stroke/60 bg-surface/50 flex justify-between items-center">
                      <h4 className="text-sm font-semibold uppercase tracking-wider text-text-primary font-sans">
                        Daftar Staf & Hak Akses
                      </h4>
                    </div>
                    {adminUsers.length === 0 ? (
                      <div className="py-16 text-center text-muted text-xs uppercase tracking-widest font-medium">
                        Belum ada staf yang terdaftar.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-stroke/60 bg-surface/50 text-[10px] text-muted uppercase tracking-[0.15em] font-semibold font-sans">
                              <th className="py-4 px-6 font-sans">Nama</th>
                              <th className="py-4 px-6 font-sans">Username</th>
                              <th className="py-4 px-6 font-sans">Email</th>
                              <th className="py-4 px-6 font-sans">Peran (Role)</th>
                              <th className="py-4 px-6 font-sans">Branch ID</th>
                              <th className="py-4 px-6 font-sans">Status</th>
                              <th className="py-4 px-6 text-right font-sans">Aksi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-stroke/30 text-sm">
                            {adminUsers.map((usr) => (
                              <tr key={usr.id} className="hover:bg-surface/20 transition-colors duration-200">
                                <td className="py-4 px-6 font-semibold text-text-primary font-sans">
                                  {usr.name}
                                </td>
                                <td className="py-4 px-6 text-text-primary font-sans">
                                  {usr.username}
                                </td>
                                <td className="py-4 px-6 text-muted text-xs font-sans">
                                  {usr.email || '-'}
                                </td>
                                <td className="py-4 px-6 font-sans">
                                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                                    usr.role === 'owner' 
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' 
                                      : usr.role === 'admin'
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {usr.role}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-muted text-xs font-sans">
                                  {usr.branch_id !== null && usr.branch_id !== undefined ? usr.branch_id : '-'}
                                </td>
                                <td className="py-4 px-6 font-sans">
                                  <span className={`text-[9px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full ${
                                    usr.is_active === 1 || usr.is_active === true
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  }`}>
                                    {usr.is_active === 1 || usr.is_active === true ? 'Aktif' : 'Nonaktif'}
                                  </span>
                                </td>
                                <td className="py-4 px-6 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => handleOpenEditUserForm(usr)}
                                      className="text-xs font-semibold border border-stroke text-text-primary hover:border-white/20 px-3 py-1.5 rounded-lg transition-colors font-sans"
                                    >
                                      Edit
                                    </button>
                                    {usr.id !== session?.id && (
                                      <button
                                        onClick={() => handleDeleteUser(usr.id!)}
                                        className="text-xs font-semibold border border-stroke text-muted hover:text-rose-400 hover:border-rose-500/30 px-3 py-1.5 rounded-lg transition-colors font-sans"
                                      >
                                        Hapus
                                      </button>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* TENANT VIEW */}
            {session?.role === 'tenant' && (
              <div className="flex flex-col gap-8">
                {/* Welcome Banner */}
                <div className="bg-surface/30 border border-stroke/50 rounded-3xl p-6 md:p-8 text-left relative overflow-hidden shadow-lg animate-fade-in">
                  <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-5 pointer-events-none" />
                  <span className="text-[10px] text-muted uppercase tracking-[0.2em] font-semibold">Tenant Portal</span>
                  <h2 className="text-3xl font-display italic font-semibold text-text-primary mt-2">
                    Welcome back, {tenantInfo?.name || session.name}!
                  </h2>
                  <p className="text-xs text-muted mt-1 max-w-lg leading-relaxed">
                    Manage your space reservations, view inquiry status, and check your tenancy details here.
                  </p>
                </div>

                {/* Grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left Column: Profile */}
                  <div className="lg:col-span-1 bg-surface/30 border border-stroke/50 rounded-3xl p-6 text-left flex flex-col gap-5 shadow-lg">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary border-b border-stroke pb-3">
                      My Profile
                    </h3>
                    
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Full Name</span>
                        <span className="text-sm font-semibold text-text-primary">{tenantInfo?.name || session.name}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Email Address</span>
                        <span className="text-sm font-semibold text-text-primary">{tenantInfo?.email || session.email || '-'}</span>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Phone Number</span>
                        <span className="text-sm font-semibold text-text-primary">{tenantInfo?.phone || session.phone || '-'}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">KTP / Passport Number</span>
                        <span className="text-sm font-semibold text-text-primary">{tenantInfo?.id_card_number || 'Not Verified'}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Residential Address</span>
                        <span className="text-sm font-semibold text-text-primary whitespace-pre-wrap">{tenantInfo?.address || 'Not Verified'}</span>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Emergency Contact</span>
                        <span className="text-sm font-semibold text-text-primary">
                          {tenantInfo?.emergency_contact ? `${tenantInfo.emergency_contact} (${tenantInfo.emergency_phone || '-'})` : 'Not Verified'}
                        </span>
                      </div>

                      {tenantInfo?.id_card_photo && (
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">KTP / ID Card Photo</span>
                          <div>
                            <a
                              href={tenantInfo.id_card_photo.startsWith('/') ? tenantInfo.id_card_photo : `/${tenantInfo.id_card_photo}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-blue-400 hover:text-blue-300 font-semibold hover:underline inline-flex items-center gap-1 mt-1 font-sans"
                            >
                              <span>View Uploaded KTP / ID Card</span>
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Status</span>
                        <div>
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {tenantInfo?.status || 'Active'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Member Since</span>
                        <span className="text-xs text-muted">
                          {tenantInfo?.created_at ? new Date(tenantInfo.created_at).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Bookings */}
                  <div className="lg:col-span-2 flex flex-col gap-4 text-left">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-text-primary border-b border-stroke pb-3 mb-2">
                      My Space Reservations ({bookings.length})
                    </h3>

                    {bookings.length === 0 ? (
                      <div className="bg-surface/30 border border-stroke/50 rounded-3xl py-12 text-center text-muted text-xs uppercase tracking-widest font-medium">
                        You have not submitted any reservations.
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {bookings.map((booking) => (
                          <div 
                            key={booking.id}
                            className="bg-surface/30 border border-stroke/50 rounded-3xl p-5 md:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-white/10 transition-colors shadow-md"
                          >
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-muted uppercase tracking-wider font-semibold">Space Title</span>
                              <h4 className="text-base font-bold text-text-primary">{booking.propertyName}</h4>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted mt-1.5">
                                {booking.bookingType === 'transit' ? (
                                  <span>Transit Schedule: <strong className="text-text-primary">{formatTransitDateTime(booking.transitStartTime, booking.transitEndTime)}</strong></span>
                                ) : (
                                  <span>Move-in Date: <strong className="text-text-primary">{booking.moveInDate}</strong></span>
                                )}
                                <span className="w-1.5 h-1.5 rounded-full bg-stroke hidden sm:inline-block" />
                                <span>Amount: <strong className="text-emerald-400">{formatCurrency(getBookingAmount(booking))}</strong></span>
                                <span className="w-1.5 h-1.5 rounded-full bg-stroke hidden sm:inline-block" />
                                <span>Submitted: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : '-'}</span>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-3">
                              {booking.bookingType === 'transit' && booking.status === 'approved' && (
                                <button
                                  onClick={() => handleCheckoutTransit(booking.id!)}
                                  className="text-xs font-semibold bg-blue-500 text-bg hover:bg-blue-400 px-4 py-2 rounded-full transition-colors"
                                >
                                  Checkout
                                </button>
                              )}
                              {booking.bookingType === 'transit' && (booking.status === 'checked_out' || booking.status === 'checked out') && (
                                <button
                                  onClick={() => setSelectedInvoiceBooking(booking)}
                                  className="text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-4 py-2 rounded-full transition-colors flex items-center gap-1.5"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  Invoice
                                </button>
                              )}
                              <span className={`text-[10px] uppercase font-bold tracking-wider px-3.5 py-1.5 rounded-full ${
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
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Property Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsFormOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-2xl bg-surface border border-stroke rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl text-left">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl"
            >
              ✕
            </button>

            <div className="border-b border-stroke pb-4 mb-6">
              <h3 className="text-xl font-display italic font-semibold text-text-primary">
                {editingProperty ? 'Edit Property Space' : 'Add New Property Space'}
              </h3>
            </div>

            <form onSubmit={handleSaveProperty} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Property Name (Title)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Highlander Tebet"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Subtitle Category</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Premium Boarding Room (Kos)"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Space Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'kos' | 'apartment')}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="kos">Boarding Room (Kos)</option>
                    <option value="apartment">Apartment</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Rating</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 4.8 ★"
                    value={rating}
                    onChange={(e) => setRating(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Monthly Rent Label (Price)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Rp. 3.000.000 / month"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Location / District</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. South Jakarta"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* 3D and Media links */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider font-semibold text-text-secondary">Property Image</label>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-stroke bg-bg/50 hover:bg-bg transition-colors">
                    {/* Preview Thumbnail */}
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-stroke bg-bg-muted flex-shrink-0 flex items-center justify-center">
                      {image ? (
                        <img 
                          src={image.startsWith('http') || image.startsWith('/') ? image : `/${image}`} 
                          alt="Preview" 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80';
                          }}
                        />
                      ) : (
                        <div className="text-muted text-xs">No Image</div>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <Loader2 className="w-6 h-6 animate-spin text-white" />
                        </div>
                      )}
                    </div>
                    
                    {/* Upload Controls */}
                    <div className="flex-1 flex flex-col gap-1">
                      <label className="cursor-pointer bg-white/10 hover:bg-white/15 text-text-primary font-medium text-xs py-2 px-3.5 rounded-lg border border-white/5 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] w-fit">
                        <Upload className="w-3.5 h-3.5" />
                        {isUploading ? 'Uploading...' : 'Choose File'}
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageUpload} 
                          className="hidden" 
                          disabled={isUploading}
                        />
                      </label>
                      <p className="text-[10px] text-muted leading-normal">
                        Supports PNG, JPG, or JPEG up to 5MB.
                      </p>
                      {uploadError && (
                        <p className="text-[10px] text-red-400 font-medium">
                          {uploadError}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Map URL / Location Iframe Link</label>
                  <input 
                    type="text"
                    placeholder="Google Maps sharing Link"
                    value={mapUrl}
                    onChange={(e) => setMapUrl(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Transit configuration */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Transit 3h Price (Rp, empty if none)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 300000"
                    value={transit3h}
                    onChange={(e) => setTransit3h(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Transit 6h Price (Rp, empty if none)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 500000"
                    value={transit6h}
                    onChange={(e) => setTransit6h(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Transit 12h Price (Rp, empty if none)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 800000"
                    value={transit12h}
                    onChange={(e) => setTransit12h(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Transit 24h Price (Rp, empty if none)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 1500000"
                    value={transit24h}
                    onChange={(e) => setTransit24h(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  />
                </div>
              </div>

              {/* Promos */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Promo Price (Rupiah, empty if none)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 2800000"
                    value={promoPrice}
                    onChange={(e) => setPromoPrice(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Promo Label (e.g. 10% OFF)</label>
                  <input 
                    type="text"
                    placeholder="Promo badge text"
                    value={promoLabel}
                    onChange={(e) => setPromoLabel(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              {/* Rooms & availability */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Total Rooms</label>
                  <input 
                    type="number"
                    value={rooms}
                    onChange={(e) => setRooms(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Available Rooms</label>
                  <input 
                    type="number"
                    value={availableRooms}
                    onChange={(e) => setAvailableRooms(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors"
                  >
                    <option value="available">Available</option>
                    <option value="full">Full / Occupied</option>
                  </select>
                </div>
              </div>

              {/* Branch and direct settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Branch ID (default branch index)</label>
                  <input 
                    type="number"
                    placeholder="e.g. 1"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none"
                  />
                </div>

                <div className="flex items-center gap-3 pt-6">
                  <input 
                    type="checkbox"
                    id="available"
                    checked={available}
                    onChange={(e) => setAvailable(e.target.checked)}
                    className="w-4 h-4 accent-text-primary cursor-pointer bg-bg border border-stroke rounded"
                  />
                  <label htmlFor="available" className="text-xs text-muted uppercase tracking-wider select-none cursor-pointer">
                    Is Listed / Visible on website
                  </label>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider">Property Description (HTML/Rich-text or Text)</label>
                <textarea 
                  rows={4}
                  placeholder="Tell tenants about this property listing (amenities, facilities, rules)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent mt-4"
              >
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                Save Property Details
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Tenant Add Modal */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsTenantModalOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-xl bg-surface border border-stroke rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl text-left">
            <button 
              onClick={() => setIsTenantModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl"
            >
              ✕
            </button>

            <div className="border-b border-stroke pb-4 mb-6">
              <h3 className="text-xl font-display italic font-semibold text-text-primary">
                {editingTenant ? 'Edit Tenant Details' : 'Add New Tenant Database'}
              </h3>
            </div>

            <form onSubmit={handleSaveTenant} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Full Name *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-muted/50 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email"
                    placeholder="e.g. john@example.com"
                    value={newTenantEmail}
                    onChange={(e) => setNewTenantEmail(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Phone Number * (Will be Default Password)</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. 08123456789"
                    value={newTenantPhone}
                    onChange={(e) => setNewTenantPhone(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">ID Card (KTP/Passport) Number</label>
                  <input 
                    type="text"
                    placeholder="e.g. 32730123456789"
                    value={newTenantIdCardNumber}
                    onChange={(e) => setNewTenantIdCardNumber(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider">ID Card Image Link</label>
                <input 
                  type="text"
                  placeholder="https://..."
                  value={newTenantIdCardPhoto}
                  onChange={(e) => setNewTenantIdCardPhoto(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider">Residential Address</label>
                <input 
                  type="text"
                  placeholder="Home address"
                  value={newTenantAddress}
                  onChange={(e) => setNewTenantAddress(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Emergency Contact Person</label>
                  <input 
                    type="text"
                    placeholder="Emergency Contact Name"
                    value={newTenantEmergencyContact}
                    onChange={(e) => setNewTenantEmergencyContact(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider">Emergency Phone</label>
                  <input 
                    type="text"
                    placeholder="Emergency Phone Number"
                    value={newTenantEmergencyPhone}
                    onChange={(e) => setNewTenantEmergencyPhone(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider">Tenancy Status</label>
                <select
                  value={newTenantStatus}
                  onChange={(e) => setNewTenantStatus(e.target.value as 'active' | 'inactive')}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent mt-4"
              >
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                {editingTenant ? 'Save Tenant Details' : 'Register Tenant'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Transit Booking Approval & Identity Verification Modal */}
      {approvingBooking && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            onClick={() => setApprovingBooking(null)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-lg bg-surface border border-stroke rounded-3xl p-6 sm:p-8 shadow-2xl text-left overflow-y-auto max-h-[90vh]">
            <button 
              onClick={() => setApprovingBooking(null)}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl"
            >
              ✕
            </button>

            <div className="border-b border-stroke pb-4 mb-6">
              <h3 className="text-xl font-display italic font-semibold text-text-primary font-sans">
                Verifikasi Identitas & Kontak Darurat
              </h3>
              <p className="text-xs text-muted mt-1 leading-normal font-sans">
                Lengkapi informasi identitas penyewa ({approvingBooking.userName}) sebelum menyetujui pesanan transit.
              </p>
            </div>

            <form onSubmit={handleConfirmApproval} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold font-sans">Nomor Identitas (KTP / Passport)*</label>
                <input 
                  type="text"
                  required
                  placeholder="Masukkan nomor KTP atau Passport"
                  value={approveIdCardNumber}
                  onChange={(e) => setApproveIdCardNumber(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-white/20 transition-colors font-sans"
                />
              </div>

              {/* Photo KTP Upload */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold font-sans">Foto Identitas (KTP / Passport)*</label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-stroke bg-bg/50 hover:bg-bg transition-colors">
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-stroke bg-bg-muted flex-shrink-0 flex items-center justify-center bg-surface">
                    {approveIdCardPhoto ? (
                      <img 
                        src={approveIdCardPhoto} 
                        alt="KTP Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted text-xs font-sans">No Image</div>
                    )}
                    {isUploadingApprovePhoto && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="cursor-pointer bg-white/10 hover:bg-white/15 text-text-primary font-medium text-xs py-2 px-3.5 rounded-lg border border-white/5 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] w-fit font-sans">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingApprovePhoto ? 'Mengunggah...' : 'Pilih Gambar'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleApprovePhotoUpload} 
                        className="hidden" 
                        disabled={isUploadingApprovePhoto}
                      />
                    </label>
                    <p className="text-[10px] text-muted leading-normal font-sans">
                      Mendukung PNG, JPG, JPEG hingga 5MB.
                    </p>
                    {approvePhotoError && (
                      <p className="text-[10px] text-red-400 font-medium font-sans">
                        {approvePhotoError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold font-sans">Alamat Lengkap KTP*</label>
                <input 
                  type="text"
                  required
                  placeholder="Masukkan alamat lengkap sesuai KTP"
                  value={approveAddress}
                  onChange={(e) => setApproveAddress(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-white/20 transition-colors font-sans"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider font-semibold font-sans">Nama Kontak Darurat*</label>
                  <input 
                    type="text"
                    required
                    placeholder="Nama Kerabat"
                    value={approveEmergencyContact}
                    onChange={(e) => setApproveEmergencyContact(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-white/20 transition-colors font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider font-semibold font-sans">Nomor Telp Darurat*</label>
                  <input 
                    type="text"
                    required
                    placeholder="No. Telp Kerabat"
                    value={approveEmergencyPhone}
                    onChange={(e) => setApproveEmergencyPhone(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none focus:border-white/20 transition-colors font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploadingApprovePhoto}
                className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-emerald-500 text-bg hover:bg-emerald-400 transition-all duration-300 border border-transparent mt-4 font-sans disabled:opacity-50"
              >
                Setujui & Simpan Verifikasi
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Manual Transaction Log Modal */}
      {isTxModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsTxModalOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 shadow-2xl text-left">
            <button 
              onClick={() => setIsTxModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl"
            >
              ✕
            </button>

            <div className="border-b border-stroke pb-4 mb-6">
              <h3 className="text-xl font-display italic font-semibold text-text-primary">
                Log Billing Transaction
              </h3>
            </div>

            <form onSubmit={handleSaveTransaction} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold">Transaction Type</label>
                <div className="grid grid-cols-2 bg-bg border border-stroke p-1 rounded-full">
                  <button
                    type="button"
                    onClick={() => setTxType('income')}
                    className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2 transition-all duration-300 ${
                      txType === 'income' ? 'text-bg bg-emerald-500' : 'text-muted hover:text-text-primary'
                    }`}
                  >
                    Income
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2 transition-all duration-300 ${
                      txType === 'expense' ? 'text-bg bg-rose-500' : 'text-muted hover:text-text-primary'
                    }`}
                  >
                    Expense
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold">Category</label>
                <input 
                  type="text"
                  placeholder="e.g. utilities, laundry, maintenance, refund, etc."
                  value={txCategory}
                  onChange={(e) => setTxCategory(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-muted/50 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold">Amount (IDR)*</label>
                <input 
                  type="number"
                  required
                  placeholder="e.g. 500000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold">Transaction Date*</label>
                <input 
                  type="date"
                  required
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold">Branch ID (Optional)</label>
                <input 
                  type="number"
                  placeholder="Defaults to your branch"
                  value={txBranchId}
                  onChange={(e) => setTxBranchId(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold">Description / Note</label>
                <textarea 
                  rows={3}
                  placeholder="Provide transaction details..."
                  value={txDescription}
                  onChange={(e) => setTxDescription(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder:text-muted/50 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent mt-3"
              >
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                Save Log Record
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Article Form Modal */}
      {isArticleFormOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsArticleFormOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-2xl bg-surface border border-stroke rounded-3xl p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl text-left">
            <button 
              onClick={() => setIsArticleFormOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl"
            >
              ✕
            </button>

            <div className="border-b border-stroke pb-4 mb-6">
              <h3 className="text-xl font-display italic font-semibold text-text-primary font-sans">
                {editingArticle ? 'Edit Artikel Panduan' : 'Tambah Artikel Panduan Baru'}
              </h3>
            </div>

            <form onSubmit={handleSaveArticle} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider font-sans">Judul Artikel *</label>
                  <input 
                    type="text"
                    required
                    placeholder="e.g. Tips Memilih Kamar Kos"
                    value={articleTitle}
                    onChange={(e) => setArticleTitle(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors font-sans"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs text-muted uppercase tracking-wider font-sans">Waktu Baca</label>
                  <input 
                    type="text"
                    placeholder="e.g. 5 menit baca"
                    value={articleReadTime}
                    onChange={(e) => setArticleReadTime(e.target.value)}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary focus:outline-none focus:border-white/20 transition-colors font-sans"
                  />
                </div>
              </div>

              {/* Article Image Uploader */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold text-text-secondary font-sans">Gambar Artikel</label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-stroke bg-bg/50 hover:bg-bg transition-colors">
                  {/* Preview Thumbnail */}
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden border border-stroke bg-bg-muted flex-shrink-0 flex items-center justify-center bg-surface">
                    {articleImage ? (
                      <img 
                        src={articleImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted text-xs font-sans">No Image</div>
                    )}
                    {isUploadingArticleImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="cursor-pointer bg-white/10 hover:bg-white/15 text-text-primary font-medium text-xs py-2 px-3.5 rounded-lg border border-white/5 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] w-fit font-sans">
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingArticleImage ? 'Mengunggah...' : 'Pilih Gambar'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleArticleImageUpload} 
                        className="hidden" 
                        disabled={isUploadingArticleImage}
                      />
                    </label>
                    <p className="text-[10px] text-muted leading-normal font-sans">
                      Mendukung format PNG, JPG, JPEG hingga 5MB.
                    </p>
                    {articleUploadError && (
                      <p className="text-[10px] text-red-400 font-medium font-body font-sans">
                        {articleUploadError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-sans">Isi Artikel (Mendukung Tag HTML) *</label>
                <textarea 
                  rows={8}
                  required
                  placeholder="Tulis konten artikel Anda di sini... Anda bisa menggunakan tag HTML seperti <p>, <strong>, <ul>, etc."
                  value={articleContent}
                  onChange={(e) => setArticleContent(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent mt-4 font-sans"
              >
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                Simpan Artikel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Premium Facility Modal */}
      {isFacilityModalOpen && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsFacilityModalOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 shadow-2xl text-left">
            <button 
              onClick={() => setIsFacilityModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl"
            >
              ✕
            </button>

            <div className="border-b border-stroke pb-4 mb-6">
              <h3 className="text-xl font-display italic font-semibold text-text-primary font-sans">
                {editingFacilityIndex !== null ? 'Edit Fasilitas Premium' : 'Tambah Fasilitas Premium Baru'}
              </h3>
            </div>

            <form onSubmit={handleSaveFacility} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-sans">Nama Fasilitas *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. WiFi Fiber Kecepatan Tinggi"
                  value={facilityTitle}
                  onChange={(e) => setFacilityTitle(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none font-sans"
                />
              </div>

              {/* Facility Image Uploader */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-semibold text-text-secondary font-sans">Gambar Fasilitas *</label>
                <div className="flex items-center gap-4 p-4 rounded-xl border border-stroke bg-bg/50 hover:bg-bg transition-colors">
                  {/* Preview Thumbnail */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-stroke bg-bg-muted flex-shrink-0 flex items-center justify-center bg-surface">
                    {facilityImage ? (
                      <img 
                        src={facilityImage} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-muted text-xs font-sans">No Image</div>
                    )}
                    {isUploadingFacilityImage && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                  
                  {/* Upload Controls */}
                  <div className="flex-1 flex flex-col gap-1">
                    <label className="cursor-pointer bg-white/10 hover:bg-white/15 text-text-primary font-medium text-xs py-2 px-3.5 rounded-lg border border-white/5 inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] w-fit font-sans">
                      <Upload className="w-3 h-3" />
                      {isUploadingFacilityImage ? 'Mengunggah...' : 'Pilih Gambar'}
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleFacilityImageUpload} 
                        className="hidden" 
                        disabled={isUploadingFacilityImage}
                      />
                    </label>
                    <p className="text-[10px] text-muted leading-normal font-sans">
                      Mendukung format PNG, JPG, JPEG hingga 5MB.
                    </p>
                    {facilityUploadError && (
                      <p className="text-[10px] text-red-400 font-medium font-body font-sans">
                        {facilityUploadError}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent mt-3 font-sans"
              >
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                Simpan Fasilitas
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Staff Add/Edit Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          <div 
            onClick={() => setIsUserModalOpen(false)}
            className="absolute inset-0 bg-black/85 backdrop-blur-sm"
          />

          <div className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 shadow-2xl text-left">
            <button 
              onClick={() => setIsUserModalOpen(false)}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl"
            >
              ✕
            </button>

            <div className="border-b border-stroke pb-4 mb-6">
              <h3 className="text-xl font-display italic font-semibold text-text-primary font-sans">
                {editingUser ? 'Edit Data Staf' : 'Tambah Staf Baru'}
              </h3>
            </div>

            <form onSubmit={handleSaveUser} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-sans">Nama Lengkap *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Michael Smith"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-sans">Username *</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. michaelsmith"
                  value={userUsername}
                  onChange={(e) => setUserUsername(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-sans">
                  Password {editingUser && '(Kosongkan jika tidak diubah)'} {!editingUser && '*'}
                </label>
                <input 
                  type="password"
                  required={!editingUser}
                  placeholder="Masukkan password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-sans">Email</label>
                <input 
                  type="email"
                  placeholder="e.g. michael@highlanderstay.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none font-sans"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-sans">Peran (Role) *</label>
                <select
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value as 'owner' | 'admin' | 'cashier')}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none font-sans"
                >
                  <option value="owner">Owner</option>
                  <option value="admin">Admin</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-sans">Branch ID (Hanya untuk Cashier)</label>
                <input 
                  type="number"
                  placeholder="e.g. 1"
                  value={userBranchId}
                  onChange={(e) => setUserBranchId(e.target.value)}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-2.5 text-xs text-text-primary focus:outline-none font-sans"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input 
                  type="checkbox"
                  id="userIsActive"
                  checked={userIsActive}
                  onChange={(e) => setUserIsActive(e.target.checked)}
                  className="w-4 h-4 accent-text-primary cursor-pointer bg-bg border border-stroke rounded"
                />
                <label htmlFor="userIsActive" className="text-xs text-muted uppercase tracking-wider select-none cursor-pointer font-sans font-medium">
                  Status Staf Aktif
                </label>
              </div>

              <button
                type="submit"
                className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent mt-3 font-sans"
              >
                <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                Simpan Staf
              </button>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE PRINT MODAL */}
      {selectedInvoiceBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
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
          <div id="invoice-print-area" className="bg-surface border border-stroke/50 rounded-3xl p-8 max-w-2xl w-full shadow-2xl relative overflow-y-auto max-h-[90vh] text-left">
            {/* Header / Brand */}
            <div className="flex justify-between items-start border-b border-stroke/30 pb-6 mb-6">
              <div className="flex items-center gap-3">
                {logoImage ? (
                  <img 
                    src={logoImage.startsWith('/') ? logoImage : `/${logoImage}`} 
                    alt="Logo" 
                    className="h-10 w-10 object-contain rounded-xl border border-stroke/30 p-1 bg-surface/50" 
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div 
                    className="h-10 w-10 rounded-xl flex items-center justify-center font-bold text-sm tracking-wider"
                    style={{
                      background: `linear-gradient(135deg, ${logoStartColor}, ${logoEndColor})`,
                      color: '#fff'
                    }}
                  >
                    {logoText}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold uppercase tracking-wider text-text-primary">Highlander Stay</h2>
                  <p className="text-xs text-muted mt-0.5">Premium Accommodations & Transit Space</p>
                </div>
              </div>
              <div className="text-right flex flex-col items-end gap-1">
                <div className="border-2 border-emerald-500 text-emerald-500 uppercase tracking-widest font-black text-[10px] px-2 py-0.5 rounded rotate-[-6deg] shadow-sm select-none">
                  PAID
                </div>
                <p className="text-[10px] text-muted mt-1.5">Invoice: #INV-{selectedInvoiceBooking.id}</p>
              </div>
            </div>

            {/* Invoice Info Details */}
            <div className="grid grid-cols-2 gap-6 mb-6 text-xs text-text-primary">
              <div>
                <h5 className="font-semibold uppercase tracking-wider text-muted mb-2 text-[10px]">Tenant Details</h5>
                <p className="font-medium">{selectedInvoiceBooking.userName}</p>
                <p className="text-muted mt-1">{selectedInvoiceBooking.userEmail}</p>
                {selectedInvoiceBooking.phone && <p className="text-muted mt-0.5">{selectedInvoiceBooking.phone}</p>}
              </div>
              <div>
                <h5 className="font-semibold uppercase tracking-wider text-muted mb-2 text-[10px]">Space & Schedule</h5>
                <p className="font-medium">{selectedInvoiceBooking.propertyName}</p>
                <p className="text-muted mt-1">
                  Check-in: {selectedInvoiceBooking.transitStartTime ? new Date(selectedInvoiceBooking.transitStartTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                </p>
                <p className="text-muted mt-0.5">
                  Check-out: {selectedInvoiceBooking.transitEndTime ? new Date(selectedInvoiceBooking.transitEndTime).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                </p>
              </div>
            </div>

            {/* Calculation Table */}
            <div className="border border-stroke/30 rounded-2xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-surface/50 border-b border-stroke/30 text-muted uppercase tracking-wider">
                    <th className="p-4">Description</th>
                    <th className="p-4 text-center">Hours</th>
                    <th className="p-4 text-right">Rate / Hr</th>
                    <th className="p-4 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke/30">
                  <tr>
                    <td className="p-4">
                      <p className="font-medium text-text-primary">Transit Space Rental (Hourly)</p>
                      <p className="text-muted text-[10px] mt-0.5">Checked-in details verified by {selectedInvoiceBooking.approvedByName || 'System'}</p>
                    </td>
                    <td className="p-4 text-center text-text-primary font-medium">
                      {(() => {
                        if (selectedInvoiceBooking.transitStartTime && selectedInvoiceBooking.transitEndTime) {
                          const start = new Date(selectedInvoiceBooking.transitStartTime);
                          const end = new Date(selectedInvoiceBooking.transitEndTime);
                          const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
                          return Math.max(1, hours);
                        }
                        return 1;
                      })()}
                    </td>
                    <td className="p-4 text-right text-text-primary font-medium">
                      {formatCurrency(selectedInvoiceBooking.hourlyRate || 0)}
                    </td>
                    <td className="p-4 text-right text-emerald-400 font-semibold">
                      {formatCurrency(getBookingAmount(selectedInvoiceBooking))}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Area */}
            <div className="flex justify-end mb-8">
              <div className="w-64 text-right flex flex-col gap-2">
                <div className="flex justify-between text-xs text-muted">
                  <span>Subtotal:</span>
                  <span className="text-text-primary font-medium">{formatCurrency(getBookingAmount(selectedInvoiceBooking))}</span>
                </div>
                <div className="border-t border-stroke/30 my-1"></div>
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-text-primary">Total Paid:</span>
                  <span className="text-emerald-400">{formatCurrency(getBookingAmount(selectedInvoiceBooking))}</span>
                </div>
              </div>
            </div>

            {/* Footer Notes */}
            <div className="border-t border-stroke/30 pt-6 text-[10px] text-muted leading-relaxed mb-6">
              <p>Thank you for staying at Highlander Stay! This is an official system-generated invoice for your transit booking.</p>
              <p className="mt-1">For any queries, please contact us at support@highlanderstay.com.</p>
            </div>

            {/* Modal Controls (no-print) */}
            <div className="flex justify-end gap-3 no-print">
              <button
                onClick={() => window.print()}
                className="bg-emerald-500 text-bg hover:bg-emerald-400 font-semibold text-xs py-2.5 px-5 rounded-full transition-colors flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                Print Invoice
              </button>
              <button
                onClick={() => setSelectedInvoiceBooking(null)}
                className="bg-surface hover:bg-surface-muted text-text-primary font-semibold text-xs py-2.5 px-5 rounded-full border border-stroke transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
