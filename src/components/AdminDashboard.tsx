import React, { useState, useEffect } from 'react';
import { 
  loginAdmin,
  fetchProperties,
  fetchTenants,
  fetchBookings,
  createProperty,
  updateProperty,
  deleteProperty,
  createTenant,
  updateTenant,
  updateBookingStatus,
  fetchLocations,
  createLocation
} from '../api';
import type { Property, Tenant, Booking, UserSession, Location } from '../api';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Home, 
  MapPin,
  LogOut, 
  Plus, 
  Trash2, 
  Edit, 
  DollarSign, 
  Check, 
  X, 
  Search,
  Lock
} from 'lucide-react';
import { useSEO } from '../hooks/useSEO';

// Helper to calculate total booking price
const getBookingAmount = (booking: Booking): number => {
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

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'tenants' | 'properties' | 'locations'>('overview');
  
  // Auth Session State
  const [session, setSession] = useState<UserSession | null>(() => {
    const raw = localStorage.getItem('adminSession');
    if (!raw) return null;
    try {
      const data = JSON.parse(raw);
      if (data.role === 'admin') return data;
      return null;
    } catch {
      return null;
    }
  });

  // Login Form State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // App Data State
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);

  // Property Form State
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [propertyForm, setPropertyForm] = useState({
    title: '',
    location: '',
    location_id: 0,
    type: 'kos', // Maps to Tipe Kamar
    price: 0,
    hourlyRate: 0,
    transit3h: 0,
    transit6h: 0,
    transit12h: 0,
    transit24h: 0,
    rooms: 10,
    mapUrl: '',
    description: '',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    deposit: 500000,
    status: 'available'
  });
  const [showPropertyForm, setShowPropertyForm] = useState(false);

  // Tenant Form State
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: '',
    phone: '',
    password: '',
    email: '',
    address: '',
    id_card_number: '',
    emergency_contact: '',
    emergency_phone: '',
    status: 'active' as 'active' | 'inactive'
  });
  const [showTenantForm, setShowTenantForm] = useState(false);

  // Location Form State
  const [showLocationForm, setShowLocationForm] = useState(false);
  const [locationForm, setLocationForm] = useState({
    name: '',
    slug: ''
  });

  // Search Filters
  const [searchQuery, setSearchQuery] = useState('');

  // SEO config
  useSEO({
    title: session ? 'Admin Panel | Highlanderstay' : 'Admin Login | Highlanderstay',
    noindex: true
  });

  // Load backend data if admin session exists
  useEffect(() => {
    if (!session) return;
    
    const loadAllData = async () => {
      try {
        setLoading(true);
        setDataError(null);
        
        const [pData, tData, bData, lData] = await Promise.all([
          fetchProperties(),
          fetchTenants(),
          fetchBookings(),
          fetchLocations()
        ]);
        
        setProperties(pData);
        setTenants(tData);
        setBookings(bData);
        setLocations(lData);
      } catch (err: any) {
        console.error(err);
        setDataError(err.message || 'Gagal memuat data dari database.');
      } finally {
        setLoading(false);
      }
    };
    
    loadAllData();
  }, [session]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);
    
    try {
      const data = await loginAdmin(username, password);
      localStorage.setItem('adminSession', JSON.stringify(data));
      setSession(data);
    } catch (err: any) {
      setLoginError(err.message || 'Login gagal. Periksa username dan password Anda.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminSession');
    setSession(null);
    navigate('/portal-admin');
  };

  // --- BOOKING OPERATIONS ---
  const handleApproveBooking = async (id: number) => {
    if (!window.confirm('Setujui pemesanan ini?')) return;
    try {
      await updateBookingStatus(id, 'approved', session?.id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'approved' } : b));
      alert('Pemesanan disetujui.');
    } catch (err) {
      alert('Gagal menyetujui pemesanan.');
    }
  };

  const handleRejectBooking = async (id: number) => {
    if (!window.confirm('Tolak pemesanan ini?')) return;
    try {
      await updateBookingStatus(id, 'rejected', session?.id);
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: 'rejected' } : b));
      alert('Pemesanan ditolak.');
    } catch (err) {
      alert('Gagal menolak pemesanan.');
    }
  };

  // --- LOCATION OPERATIONS ---
  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!locationForm.name || !locationForm.slug) {
        alert('Nama lokasi dan slug wajib diisi.');
        return;
      }
      const newLoc = await createLocation(locationForm.name, locationForm.slug);
      setLocations(prev => [...prev, newLoc]);
      setLocationForm({ name: '', slug: '' });
      setShowLocationForm(false);
      alert('Lokasi baru berhasil ditambahkan.');
    } catch (err) {
      alert('Gagal menyimpan lokasi.');
    }
  };

  // --- PROPERTY OPERATIONS ---
  const handleSaveProperty = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find matching location details
      const selectedLoc = locations.find(l => l.id === propertyForm.location_id);
      const locName = selectedLoc ? selectedLoc.name : propertyForm.location;

      const payload: Property = {
        title: propertyForm.title,
        location: locName,
        location_id: propertyForm.location_id,
        category: locName,
        type: propertyForm.type as any, // room type e.g. Single, Deluxe, VIP
        price: formatCurrency(propertyForm.price),
        rawPrice: propertyForm.price,
        hourlyRate: propertyForm.hourlyRate,
        transit3h: propertyForm.transit3h,
        transit6h: propertyForm.transit6h,
        transit12h: propertyForm.transit12h,
        transit24h: propertyForm.transit24h,
        rooms: propertyForm.rooms,
        availableRooms: propertyForm.rooms,
        mapUrl: propertyForm.mapUrl,
        description: propertyForm.description,
        image: propertyForm.image,
        deposit: propertyForm.deposit,
        status: propertyForm.status,
        rating: '4.8'
      };

      if (editingProperty) {
        const updated = await updateProperty(editingProperty.id!, payload);
        setProperties(prev => prev.map(p => p.id === editingProperty.id ? updated : p));
        alert('Hunian berhasil diperbarui.');
      } else {
        const created = await createProperty(payload);
        setProperties(prev => [created, ...prev]);
        alert('Hunian baru berhasil ditambahkan.');
      }
      setShowPropertyForm(false);
      setEditingProperty(null);
    } catch (err) {
      alert('Gagal menyimpan hunian.');
    }
  };

  const handleDeleteProperty = async (id: number) => {
    if (!window.confirm('Hapus hunian ini secara permanen?')) return;
    try {
      await deleteProperty(id);
      setProperties(prev => prev.filter(p => p.id !== id));
      alert('Hunian berhasil dihapus.');
    } catch (err) {
      alert('Gagal menghapus hunian.');
    }
  };

  const startEditProperty = (prop: Property) => {
    setEditingProperty(prop);
    
    // Find initial location ID matching location name if location_id is missing
    let locId = prop.location_id || 0;
    if (!locId && prop.location && locations.length > 0) {
      const match = locations.find(l => l.name.toLowerCase() === prop.location.toLowerCase());
      if (match) locId = match.id || 0;
    }

    setPropertyForm({
      title: prop.title,
      location: prop.location || 'Jakarta',
      location_id: locId,
      type: prop.type || 'kos',
      price: prop.rawPrice || 0,
      hourlyRate: prop.hourlyRate || 0,
      transit3h: prop.transit3h || 0,
      transit6h: prop.transit6h || 0,
      transit12h: prop.transit12h || 0,
      transit24h: prop.transit24h || 0,
      rooms: prop.rooms || 0,
      mapUrl: prop.mapUrl || '',
      description: prop.description || '',
      image: prop.image || '',
      deposit: prop.deposit || 0,
      status: prop.status || 'available'
    });
    setShowPropertyForm(true);
  };

  // --- TENANT OPERATIONS ---
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        const updated = await updateTenant(editingTenant.id!, {
          name: tenantForm.name,
          phone: tenantForm.phone,
          email: tenantForm.email || null,
          address: tenantForm.address || null,
          id_card_number: tenantForm.id_card_number || null,
          emergency_contact: tenantForm.emergency_contact || null,
          emergency_phone: tenantForm.emergency_phone || null,
          status: tenantForm.status
        });
        setTenants(prev => prev.map(t => t.id === editingTenant.id ? updated : t));
        alert('Penyewa berhasil diperbarui.');
      } else {
        const created = await createTenant({
          name: tenantForm.name,
          phone: tenantForm.phone,
          password: tenantForm.password,
          email: tenantForm.email || null,
          address: tenantForm.address || null,
          id_card_number: tenantForm.id_card_number || null,
          emergency_contact: tenantForm.emergency_contact || null,
          emergency_phone: tenantForm.emergency_phone || null,
          status: 'active'
        });
        setTenants(prev => [created, ...prev]);
        alert('Penyewa baru berhasil ditambahkan.');
      }
      setShowTenantForm(false);
      setEditingTenant(null);
    } catch (err) {
      alert('Gagal menyimpan data penyewa.');
    }
  };

  const startEditTenant = (tenant: Tenant) => {
    setEditingTenant(tenant);
    setTenantForm({
      name: tenant.name,
      phone: tenant.phone,
      password: '',
      email: tenant.email || '',
      address: tenant.address || '',
      id_card_number: tenant.id_card_number || '',
      emergency_contact: tenant.emergency_contact || '',
      emergency_phone: tenant.emergency_phone || '',
      status: tenant.status
    });
    setShowTenantForm(true);
  };

  const formatCurrency = (val?: number) => {
    if (val === undefined || val === null) return 'Rp. 0';
    return `Rp. ${val.toLocaleString('id-ID')}`;
  };

  // Metric Calculation
  const totalRevenue = bookings
    .filter(b => b.status === 'approved' || b.status === 'checked_out')
    .reduce((sum, b) => sum + getBookingAmount(b), 0);

  // Filter lists
  const filteredBookings = bookings.filter(b => 
    b.propertyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.phone?.includes(searchQuery)
  );

  const filteredTenants = tenants.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone.includes(searchQuery)
  );

  const filteredProperties = properties.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLocations = locations.filter(l => 
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render Login page if not authenticated
  if (!session) {
    return (
      <div className="min-h-screen bg-bg text-text-primary flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface border border-stroke rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />
          
          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-14 h-14 rounded-full bg-stroke/20 flex items-center justify-center border border-stroke mb-4 text-text-primary">
              <Lock className="w-6 h-6" />
            </div>
            
            <h2 className="text-2xl font-display italic font-semibold text-text-primary">Admin Console</h2>
            <p className="text-xs text-muted mt-1 mb-6 uppercase tracking-wider">HighlanderStay Administrator Access</p>
            
            {loginError && (
              <div className="w-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-xl mb-5 text-left">
                {loginError}
              </div>
            )}
            
            <form onSubmit={handleAdminLogin} className="w-full flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-medium">Username</label>
                <input 
                  type="text" 
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin_username"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/40 focus:outline-none"
                />
              </div>
              
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-muted uppercase tracking-wider font-medium">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/40 focus:outline-none"
                />
              </div>
              
              <button 
                type="submit"
                disabled={isLoggingIn}
                className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-2"
              >
                {isLoggingIn ? 'Logging In...' : 'Log In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Render Full Admin Dashboard View
  return (
    <div className="min-h-screen bg-bg text-text-primary flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-surface border-r border-stroke/40 flex flex-col justify-between p-6">
        <div className="flex flex-col gap-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center font-bold text-sm text-white">
              HS
            </div>
            <div className="text-left">
              <h1 className="text-sm font-bold tracking-wide leading-none">Highlander</h1>
              <span className="text-[10px] text-muted">Admin Control Hub</span>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex flex-col gap-1">
            <button 
              onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'overview' ? 'bg-text-primary text-bg font-bold' : 'text-muted hover:bg-stroke/10 hover:text-text-primary'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Ringkasan
            </button>
            <button 
              onClick={() => { setActiveTab('bookings'); setSearchQuery(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'bookings' ? 'bg-text-primary text-bg font-bold' : 'text-muted hover:bg-stroke/10 hover:text-text-primary'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Pemesanan
            </button>
            <button 
              onClick={() => { setActiveTab('tenants'); setSearchQuery(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'tenants' ? 'bg-text-primary text-bg font-bold' : 'text-muted hover:bg-stroke/10 hover:text-text-primary'
              }`}
            >
              <Users className="w-4 h-4" />
              Penyewa
            </button>
            <button 
              onClick={() => { setActiveTab('properties'); setSearchQuery(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'properties' ? 'bg-text-primary text-bg font-bold' : 'text-muted hover:bg-stroke/10 hover:text-text-primary'
              }`}
            >
              <Home className="w-4 h-4" />
              Hunian
            </button>
            <button 
              onClick={() => { setActiveTab('locations'); setSearchQuery(''); }}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition-all ${
                activeTab === 'locations' ? 'bg-text-primary text-bg font-bold' : 'text-muted hover:bg-stroke/10 hover:text-text-primary'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Lokasi
            </button>
          </nav>
        </div>
        
        {/* Footer Logout */}
        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl text-rose-400 hover:bg-rose-500/10 transition-all text-left"
        >
          <LogOut className="w-4 h-4" />
          Keluar Sesi
        </button>
      </aside>

      {/* Main Dashboard Section */}
      <main className="flex-1 flex flex-col min-h-screen">
        {/* Top Control Bar */}
        <header className="h-16 border-b border-stroke/40 px-8 flex justify-between items-center bg-surface/50 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3 w-72">
            {activeTab !== 'overview' && (
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari disini..."
                  className="w-full bg-bg border border-stroke rounded-xl pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-muted/50 focus:outline-none"
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-3 text-xs text-muted">
            <span>Login Sesi: <strong className="text-text-primary font-bold">{session.name}</strong> (Administrator)</span>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-8 overflow-y-auto">
          {dataError && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-5 py-3 rounded-2xl mb-6 text-left">
              {dataError}
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center py-48 text-muted">
              <Loader2 className="w-10 h-10 animate-spin text-text-primary mb-4" />
              <span className="text-xs uppercase tracking-widest font-black">Memuat Data Database...</span>
            </div>
          ) : (
            <div className="animate-fade-in text-left">
              
              {/* VIEW 1: OVERVIEW TAB */}
              {activeTab === 'overview' && (
                <div className="flex flex-col gap-8">
                  <div>
                    <h2 className="text-2xl font-bold font-display italic">Overview Hub</h2>
                    <p className="text-xs text-muted mt-1">Status dan metrik statistik HighlanderStay.</p>
                  </div>
                  
                  {/* Grid Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-surface border border-stroke p-6 rounded-2xl flex items-center justify-between shadow">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Total Pendapatan</span>
                        <h3 className="text-2xl font-bold text-emerald-400 mt-2 font-mono">{formatCurrency(totalRevenue)}</h3>
                      </div>
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <DollarSign className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-surface border border-stroke p-6 rounded-2xl flex items-center justify-between shadow">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Total Pemesanan</span>
                        <h3 className="text-2xl font-bold text-text-primary mt-2 font-mono">{bookings.length}</h3>
                      </div>
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-surface border border-stroke p-6 rounded-2xl flex items-center justify-between shadow">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Total Hunian</span>
                        <h3 className="text-2xl font-bold text-text-primary mt-2 font-mono">{properties.length}</h3>
                      </div>
                      <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                        <Home className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="bg-surface border border-stroke p-6 rounded-2xl flex items-center justify-between shadow">
                      <div>
                        <span className="text-[10px] uppercase tracking-wider text-muted font-semibold">Penyewa Terdaftar</span>
                        <h3 className="text-2xl font-bold text-text-primary mt-2 font-mono">{tenants.length}</h3>
                      </div>
                      <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: BOOKINGS TAB */}
              {activeTab === 'bookings' && (
                <div className="flex flex-col gap-6">
                  <div>
                    <h2 className="text-2xl font-bold font-display italic">Reservasi & Kelola Transaksi</h2>
                    <p className="text-xs text-muted mt-1">Konfirmasi dan pantau riwayat sewa harian/bulanan.</p>
                  </div>
                  
                  <div className="bg-surface border border-stroke rounded-2xl overflow-hidden shadow">
                    <table className="w-full border-collapse text-xs text-left">
                      <thead>
                        <tr className="bg-stroke/20 border-b border-stroke text-muted uppercase tracking-wider font-semibold">
                          <th className="p-4.5">Kamar</th>
                          <th className="p-4.5">Penyewa</th>
                          <th className="p-4.5">Jadwal / Tanggal</th>
                          <th className="p-4.5">Total Harga</th>
                          <th className="p-4.5 text-center">Status</th>
                          <th className="p-4.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.map((b) => (
                          <tr key={b.id} className="border-b border-stroke/30 hover:bg-stroke/5">
                            <td className="p-4.5 font-semibold text-text-primary">{b.propertyName}</td>
                            <td className="p-4.5">
                              <span className="font-semibold block">{b.userName}</span>
                              <span className="text-[10px] text-muted block mt-0.5">{b.phone}</span>
                            </td>
                            <td className="p-4.5">
                              {b.bookingType === 'transit' ? (
                                <span className="text-[10px] leading-relaxed block">
                                  Transit: {b.transitStartTime ? new Date(b.transitStartTime).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'} ➔ {b.transitEndTime ? new Date(b.transitEndTime).toLocaleTimeString('id-ID', { timeStyle: 'short' }) : '-'}
                                </span>
                              ) : (
                                <span className="font-semibold">Move In: {b.moveInDate}</span>
                              )}
                            </td>
                            <td className="p-4.5 font-bold font-mono text-emerald-400">{formatCurrency(getBookingAmount(b))}</td>
                            <td className="p-4.5 text-center">
                              <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${
                                b.status === 'approved' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : b.status === 'rejected'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : b.status === 'checked_out' || b.status === 'checked out' || b.status === 'completed'
                                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {b.status}
                              </span>
                            </td>
                            <td className="p-4.5 text-right flex justify-end gap-1.5">
                              {b.status === 'pending' && (
                                <>
                                  <button 
                                    onClick={() => handleApproveBooking(b.id!)}
                                    className="p-2 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl"
                                    title="Setujui"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleRejectBooking(b.id!)}
                                    className="p-2 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl"
                                    title="Tolak"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 3: TENANTS TAB */}
              {activeTab === 'tenants' && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold font-display italic">Manajemen Akun Penyewa</h2>
                      <p className="text-xs text-muted mt-1">Kelola biodata profil, kontak darurat, dan kata sandi penyewa.</p>
                    </div>
                    <button 
                      onClick={() => { setEditingTenant(null); setTenantForm({ name: '', phone: '', password: '', email: '', address: '', id_card_number: '', emergency_contact: '', emergency_phone: '', status: 'active' }); setShowTenantForm(true); }}
                      className="bg-text-primary text-bg hover:bg-text-primary/95 text-xs font-bold px-4 py-3.5 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Tambah Penyewa
                    </button>
                  </div>

                  <div className="bg-surface border border-stroke rounded-2xl overflow-hidden shadow">
                    <table className="w-full border-collapse text-xs text-left">
                      <thead>
                        <tr className="bg-stroke/20 border-b border-stroke text-muted uppercase tracking-wider font-semibold">
                          <th className="p-4.5">Nama Penyewa</th>
                          <th className="p-4.5">WhatsApp / Email</th>
                          <th className="p-4.5">KTP / Passport</th>
                          <th className="p-4.5">Alamat Keanggotaan</th>
                          <th className="p-4.5 text-center">Status</th>
                          <th className="p-4.5 text-right">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTenants.map((t) => (
                          <tr key={t.id} className="border-b border-stroke/30 hover:bg-stroke/5">
                            <td className="p-4.5 font-semibold text-text-primary">{t.name}</td>
                            <td className="p-4.5">
                              <span className="font-semibold block">{t.phone}</span>
                              <span className="text-[10px] text-muted block mt-0.5">{t.email || '-'}</span>
                            </td>
                            <td className="p-4.5 font-semibold">{t.id_card_number || '-'}</td>
                            <td className="p-4.5 text-muted leading-relaxed max-w-xs truncate">{t.address || '-'}</td>
                            <td className="p-4.5 text-center">
                              <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full ${
                                t.status === 'active' 
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="p-4.5 text-right flex justify-end gap-1.5">
                              <button 
                                onClick={() => startEditTenant(t)}
                                className="p-2 border border-stroke/50 bg-bg hover:bg-stroke/10 text-text-primary rounded-xl"
                                title="Edit"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* VIEW 4: PROPERTIES TAB */}
              {activeTab === 'properties' && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold font-display italic">Manajemen Hunian Kamar</h2>
                      <p className="text-xs text-muted mt-1">Konfigurasi tipe kamar, harga bulanan, transit paket (3h, 6h, 12h, 24h), dan deposit.</p>
                    </div>
                    <button 
                      onClick={() => { setEditingProperty(null); setPropertyForm({ title: '', location: 'Jakarta', location_id: locations[0]?.id || 1, type: 'kos', price: 1500000, hourlyRate: 50000, transit3h: 80000, transit6h: 110000, transit12h: 150000, transit24h: 200000, rooms: 10, mapUrl: '', description: '', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80', deposit: 500000, status: 'available' }); setShowPropertyForm(true); }}
                      className="bg-text-primary text-bg hover:bg-text-primary/95 text-xs font-bold px-4 py-3.5 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Tambah Kamar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {filteredProperties.map((p) => (
                      <div key={p.id} className="bg-surface border border-stroke/50 rounded-2xl overflow-hidden shadow flex flex-col justify-between">
                        <div>
                          <div className="h-44 bg-stroke/10 relative overflow-hidden">
                            <img 
                              src={p.image} 
                              alt={p.title} 
                              className="w-full h-full object-cover"
                            />
                            <span className={`text-[8px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full absolute top-3 right-3 ${
                              p.status === 'available' 
                                ? 'bg-emerald-500 text-bg shadow' 
                                : 'bg-rose-500 text-bg shadow'
                            }`}>
                              {p.status}
                            </span>
                          </div>
                          
                          <div className="p-5 flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <h3 className="font-bold text-base text-text-primary leading-snug">{p.title}</h3>
                            </div>
                            <span className="text-[10px] text-muted font-bold uppercase tracking-wider block mb-2">
                              Tipe: <strong className="text-text-primary">{p.type || 'Standard'}</strong> / {p.location}
                            </span>
                            
                            <div className="flex flex-col gap-1 text-xs">
                              <div className="flex justify-between border-b border-stroke/20 pb-1.5">
                                <span className="text-muted">Bulanan:</span>
                                <span className="font-semibold text-text-primary">{p.price}</span>
                              </div>
                              <div className="flex justify-between border-b border-stroke/10 pb-1 mt-1 text-[11px]">
                                <span className="text-muted">Transit 3 Jam:</span>
                                <span className="font-bold text-text-secondary">{formatCurrency(p.transit3h || 0)}</span>
                              </div>
                              <div className="flex justify-between border-b border-stroke/10 pb-1 text-[11px]">
                                <span className="text-muted">Transit 6 Jam:</span>
                                <span className="font-bold text-text-secondary">{formatCurrency(p.transit6h || 0)}</span>
                              </div>
                              <div className="flex justify-between border-b border-stroke/10 pb-1 text-[11px]">
                                <span className="text-muted">Transit 12 Jam:</span>
                                <span className="font-bold text-text-secondary">{formatCurrency(p.transit12h || 0)}</span>
                              </div>
                              <div className="flex justify-between border-b border-stroke/10 pb-1 text-[11px]">
                                <span className="text-muted">Transit 24 Jam:</span>
                                <span className="font-bold text-text-secondary">{formatCurrency(p.transit24h || 0)}</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-muted">Jumlah Kamar:</span>
                                <span className="font-semibold text-text-primary">{(p.rooms !== undefined ? p.rooms : 0)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="p-5 pt-0 flex gap-2">
                          <button 
                            onClick={() => startEditProperty(p)}
                            className="flex-1 py-2.5 border border-stroke hover:bg-stroke/10 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteProperty(p.id!)}
                            className="p-2.5 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 5: LOCATIONS TAB */}
              {activeTab === 'locations' && (
                <div className="flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold font-display italic">Kelola Wilayah & Lokasi</h2>
                      <p className="text-xs text-muted mt-1">Daftarkan kota atau area properti hunian Anda.</p>
                    </div>
                    <button 
                      onClick={() => { setLocationForm({ name: '', slug: '' }); setShowLocationForm(true); }}
                      className="bg-text-primary text-bg hover:bg-text-primary/95 text-xs font-bold px-4 py-3.5 rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> Tambah Lokasi
                    </button>
                  </div>

                  <div className="bg-surface border border-stroke rounded-2xl overflow-hidden shadow max-w-xl">
                    <table className="w-full border-collapse text-xs text-left">
                      <thead>
                        <tr className="bg-stroke/20 border-b border-stroke text-muted uppercase tracking-wider font-semibold">
                          <th className="p-4.5">Nama Wilayah</th>
                          <th className="p-4.5">Slug URL</th>
                          <th className="p-4.5">ID Referensi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLocations.map((l) => (
                          <tr key={l.id} className="border-b border-stroke/30 hover:bg-stroke/5">
                            <td className="p-4.5 font-bold text-text-primary">{l.name}</td>
                            <td className="p-4.5 font-mono text-muted">{l.slug}</td>
                            <td className="p-4.5 font-semibold">#{l.id}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </main>

      {/* MODAL 1: ADD/EDIT HUNIAN FORM */}
      {showPropertyForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface border border-stroke/60 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-text-primary mb-6 text-left">
              {editingProperty ? 'Edit Hunian Kamar' : 'Tambah Hunian Kamar Baru'}
            </h3>
            
            <form onSubmit={handleSaveProperty} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Nama Properti / Kamar</label>
                <input 
                  type="text" 
                  required
                  value={propertyForm.title}
                  onChange={(e) => setPropertyForm({ ...propertyForm, title: e.target.value })}
                  placeholder="Contoh: HighlanderStay Kost Tanjung Duren 647"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary placeholder:text-muted/40 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Lokasi Wilayah</label>
                <select
                  value={propertyForm.location_id}
                  onChange={(e) => setPropertyForm({ ...propertyForm, location_id: Number(e.target.value) })}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                >
                  {locations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Tipe Kamar (Room Type)</label>
                <input 
                  type="text" 
                  required
                  value={propertyForm.type}
                  onChange={(e) => setPropertyForm({ ...propertyForm, type: e.target.value })}
                  placeholder="Contoh: Deluxe, VIP, Suite, Standard, Putra"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Harga Sewa Bulanan</label>
                <input 
                  type="number" 
                  required
                  value={propertyForm.price}
                  onChange={(e) => setPropertyForm({ ...propertyForm, price: Number(e.target.value) })}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Uang Deposit (Jaminan)</label>
                <input 
                  type="number" 
                  required
                  value={propertyForm.deposit}
                  onChange={(e) => setPropertyForm({ ...propertyForm, deposit: Number(e.target.value) })}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none font-mono"
                />
              </div>

              {/* Transit Packages */}
              <div className="flex flex-col gap-1.5 md:col-span-2 border-t border-stroke/20 pt-4 mt-2">
                <h4 className="text-xs font-bold text-text-primary uppercase tracking-wider mb-2">Harga Paket Transit (Rupiah)</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-muted uppercase font-semibold">Transit 3 Jam</label>
                    <input 
                      type="number"
                      required
                      value={propertyForm.transit3h}
                      onChange={(e) => setPropertyForm({ ...propertyForm, transit3h: Number(e.target.value) })}
                      className="bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-muted uppercase font-semibold">Transit 6 Jam</label>
                    <input 
                      type="number"
                      required
                      value={propertyForm.transit6h}
                      onChange={(e) => setPropertyForm({ ...propertyForm, transit6h: Number(e.target.value) })}
                      className="bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-muted uppercase font-semibold">Transit 12 Jam</label>
                    <input 
                      type="number"
                      required
                      value={propertyForm.transit12h}
                      onChange={(e) => setPropertyForm({ ...propertyForm, transit12h: Number(e.target.value) })}
                      className="bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-muted uppercase font-semibold">Transit 24 Jam</label>
                    <input 
                      type="number"
                      required
                      value={propertyForm.transit24h}
                      onChange={(e) => setPropertyForm({ ...propertyForm, transit24h: Number(e.target.value) })}
                      className="bg-bg border border-stroke rounded-xl px-3.5 py-2.5 text-xs text-text-primary focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1.5 border-t border-stroke/20 pt-4 mt-2">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Jumlah Kamar</label>
                <input 
                  type="number" 
                  required
                  value={propertyForm.rooms}
                  onChange={(e) => setPropertyForm({ ...propertyForm, rooms: Number(e.target.value) })}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 border-t border-stroke/20 pt-4 mt-2">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Google Maps URL</label>
                <input 
                  type="url" 
                  value={propertyForm.mapUrl}
                  onChange={(e) => setPropertyForm({ ...propertyForm, mapUrl: e.target.value })}
                  placeholder="https://maps.google.com/..."
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Deskripsi Hunian</label>
                <textarea 
                  rows={3}
                  value={propertyForm.description}
                  onChange={(e) => setPropertyForm({ ...propertyForm, description: e.target.value })}
                  placeholder="Detail fasilitas, ukuran kamar..."
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary placeholder:text-muted/40 focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">URL Foto Kamar (Unsplash / Image URL)</label>
                <input 
                  type="text" 
                  value={propertyForm.image}
                  onChange={(e) => setPropertyForm({ ...propertyForm, image: e.target.value })}
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 md:col-span-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowPropertyForm(false); setEditingProperty(null); }}
                  className="bg-transparent border border-stroke text-text-primary text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-stroke/10"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-text-primary text-bg text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-text-primary/90 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD/EDIT PENYEWA FORM */}
      {showTenantForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface border border-stroke/60 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl relative overflow-y-auto max-h-[90vh]">
            <h3 className="text-lg font-bold text-text-primary mb-6 text-left">
              {editingTenant ? 'Edit Profil Penyewa' : 'Tambah Penyewa Baru'}
            </h3>
            
            <form onSubmit={handleSaveTenant} className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Nama Lengkap</label>
                <input 
                  type="text" 
                  required
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                  placeholder="Nama lengkap"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Nomor WhatsApp</label>
                <input 
                  type="tel" 
                  required
                  value={tenantForm.phone}
                  onChange={(e) => setTenantForm({ ...tenantForm, phone: e.target.value })}
                  placeholder="e.g. 08123456789"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              {!editingTenant && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Kata Sandi Awal</label>
                  <input 
                    type="password" 
                    required
                    value={tenantForm.password}
                    onChange={(e) => setTenantForm({ ...tenantForm, password: e.target.value })}
                    placeholder="Sandi login akun"
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Alamat Email (Opsional)</label>
                <input 
                  type="email" 
                  value={tenantForm.email}
                  onChange={(e) => setTenantForm({ ...tenantForm, email: e.target.value })}
                  placeholder="email@example.com"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Nomor KTP / Passport</label>
                <input 
                  type="text" 
                  value={tenantForm.id_card_number}
                  onChange={(e) => setTenantForm({ ...tenantForm, id_card_number: e.target.value })}
                  placeholder="320xxxxxxxxxxxxx"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Alamat Asal KTP</label>
                <textarea 
                  rows={2}
                  value={tenantForm.address}
                  onChange={(e) => setTenantForm({ ...tenantForm, address: e.target.value })}
                  placeholder="Alamat asal..."
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none resize-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Kontak Darurat</label>
                <input 
                  type="text" 
                  value={tenantForm.emergency_contact}
                  onChange={(e) => setTenantForm({ ...tenantForm, emergency_contact: e.target.value })}
                  placeholder="Nama kerabat dekat"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">No. HP Kontak Darurat</label>
                <input 
                  type="tel" 
                  value={tenantForm.emergency_phone}
                  onChange={(e) => setTenantForm({ ...tenantForm, emergency_phone: e.target.value })}
                  placeholder="No. HP kerabat dekat"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              {editingTenant && (
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Status Keanggotaan</label>
                  <select
                    value={tenantForm.status}
                    onChange={(e) => setTenantForm({ ...tenantForm, status: e.target.value as any })}
                    className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                  >
                    <option value="active">Active (Aktif)</option>
                    <option value="inactive">Inactive (Non-aktif)</option>
                  </select>
                </div>
              )}

              <div className="flex justify-end gap-2 md:col-span-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => { setShowTenantForm(false); setEditingTenant(null); }}
                  className="bg-transparent border border-stroke text-text-primary text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-stroke/10"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-text-primary text-bg text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-text-primary/90 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD LOCATION FORM */}
      {showLocationForm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
          <div className="bg-surface border border-stroke/60 rounded-3xl p-6 sm:p-8 w-full max-w-sm shadow-2xl relative">
            <h3 className="text-lg font-bold text-text-primary mb-6 text-left">Tambah Lokasi Wilayah Baru</h3>
            
            <form onSubmit={handleSaveLocation} className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Nama Wilayah</label>
                <input 
                  type="text" 
                  required
                  value={locationForm.name}
                  onChange={(e) => setLocationForm({ ...locationForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="Contoh: Jakarta Selatan, Bali"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-muted uppercase tracking-wider font-semibold">Slug URL</label>
                <input 
                  type="text" 
                  required
                  value={locationForm.slug}
                  onChange={(e) => setLocationForm({ ...locationForm, slug: e.target.value })}
                  placeholder="jakarta-selatan"
                  className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-xs text-text-primary focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 mt-4">
                <button 
                  type="button" 
                  onClick={() => setShowLocationForm(false)}
                  className="bg-transparent border border-stroke text-text-primary text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-stroke/10"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-text-primary text-bg text-xs font-semibold px-6 py-2.5 rounded-xl hover:bg-text-primary/90 transition-colors"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
