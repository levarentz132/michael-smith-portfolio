export interface AvailableRoomDetail {
  id: number;
  name: string;
  slug: string;
  floor?: string | null;
  capacity?: number;
  size_sqm?: number | null;
  monthly_rate?: number | null;
  image_url?: string | null;
  video_url?: string | null;
}

export interface Property {
  id?: number;
  title: string;
  slug?: string;
  canonicalSlug?: string;
  canonicalId?: string;
  category: string;
  type: 'kos' | 'apartment' | 'resort' | 'villa' | 'kiosk' | 'commercial' | 'house' | 'land';
  price: string;
  priceRange?: string;
  location: string;
  kecamatan?: string | null;
  rating: string;
  image: string;
  imageUrls?: string[];
  videoUrl?: string | null;
  phone?: string | null;
  addressUrl?: string | null;
  colSpan?: string;
  aspectRatio?: string;
  hourlyRate?: number | null;
  rawPrice?: number;
  address?: string;
  minTransitHours?: number;
  transit3h?: number | null;
  transit6h?: number | null;
  transit12h?: number | null;
  transit24h?: number | null;
  mapUrl?: string;
  description?: string;
  rooms?: number;
  availableRooms?: number;
  availableRoomsList?: string[];
  availableRoomDetails?: AvailableRoomDetail[];
  availabilityStatus?: string;
  status?: string;
  promoPrice?: number | null;
  promoLabel?: string | null;
  available?: number | boolean;
  branchId?: number | null;
  deposit?: number | null;
}

export interface Booking {
  id?: number;
  propertyName: string;
  userName: string;
  userEmail: string;
  phone?: string;
  moveInDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'followup' | 'surveyed' | 'payments' | string;
  createdAt?: string;
  bookingType?: 'monthly' | 'transit';
  transitDate?: string;
  transitStartTime?: string;
  transitEndTime?: string;
  duration?: number;
  monthlyRent?: number;
  hourlyRate?: number | null;
  tenantId?: number;
  idCardNumber?: string | null;
  idCardPhoto?: string | null;
  address?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  notes?: string | null;
  approvedByName?: string | null;
  snapToken?: string | null;
  snapRedirectUrl?: string | null;
}

export interface TenantProfile {
  id?: number;
  name?: string;
  phone?: string;
  id_card_number?: string | null;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  phone_verified: boolean;
  phone_verified_at: string | null;
  is_active: boolean;
  roles?: string[];
  has_tenant_profile?: boolean;
  tenant?: TenantProfile | null;
}

export interface UserSession {
  role: 'tenant';
  id: number;
  name: string;
  email?: string;
  phone?: string;
  token?: string;
  phone_verified?: boolean;
  phone_verified_at?: string | null;
  is_active?: boolean;
  has_tenant_profile?: boolean;
  tenant?: TenantProfile | null;
  branchId?: number | null;
  username?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  otp_channel?: 'whatsapp' | 'email';
  device_name?: string;
}

export interface RegisterResponse {
  message: string;
  registration_token: string;
  otp_sent: boolean;
  otp_channel: string;
  target: string;
}

export interface SendOtpPayload {
  registration_token?: string;
  login?: string;
  channel?: 'whatsapp' | 'email';
}

export interface SendOtpResponse {
  message: string;
  channel: string;
  target: string;
  sent: boolean;
}

export interface VerifyOtpPayload {
  registration_token?: string;
  login?: string;
  code: string;
  device_name?: string;
}

export interface VerifyOtpResponse {
  message: string;
  verified: boolean;
  token: string;
  channel?: string;
  phone_verified?: boolean;
  email_verified?: boolean;
  user: AuthUser;
}

export interface LoginPayload {
  login: string;
  password: string;
  device_name?: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: AuthUser;
}

export interface CheckStatusPayload {
  login: string;
}

export interface CheckStatusResponse {
  status: 'registered' | 'pending_registration' | 'unregistered' | string;
  registered: boolean;
  pending_registration: boolean;
  registration_token?: string;
  message?: string;
  id?: number;
  name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  user?: {
    name: string;
    email: string;
    phone: string;
  };
  verifications?: {
    whatsapp?: {
      available: boolean;
      target: string;
      verified: boolean;
      verified_at: string | null;
      status: string;
    };
    email?: {
      available: boolean;
      target: string;
      verified: boolean;
      verified_at: string | null;
      status: string;
    };
  };
  is_fully_verified?: boolean;
}

export interface Tenant {
  id?: number;
  name: string;
  email: string | null;
  phone: string;
  id_card_number?: string | null;
  id_card_photo?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  status: 'active' | 'inactive';
  pic_admin_id?: number | null;
  pic_admin_name?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id?: number;
  branch_id: number | null;
  payment_id?: number | null;
  transaction_type: 'income' | 'expense';
  category: string | null;
  amount: number;
  transaction_date: string;
  description: string | null;
  recorded_by: number;
  recorded_by_name?: string;
  created_at?: string;
}

async function handleResponse<T>(res: Response, fallbackError: string): Promise<T> {
  if (!res.ok) {
    let errorMsg = fallbackError;
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch {
      errorMsg = `Server error ${res.status}: ${res.statusText || 'Unknown error'}`;
    }
    throw new Error(errorMsg);
  }
  try {
    return await res.json() as T;
  } catch {
    throw new Error('Server returned an invalid response format (non-JSON). Please verify that the backend server is running on port 5000.');
  }
}

// Fetch all properties (calls backend proxy, with fallback to direct dashboard API)
export async function fetchProperties(): Promise<Property[]> {
  try {
    const res = await fetch('/api/properties');
    if (res.ok) {
      return await res.json() as Property[];
    }
  } catch (err) {
    console.warn('Failed to fetch /api/properties, trying direct API:', err);
  }

  // Fallback: fetch directly from dashboard API if backend is unreachable
  try {
    const directRes = await fetch('https://dashboard.highlanderstay.com/api/v1/available-rooms');
    if (directRes.ok) {
      const json = await directRes.json();
      if (Array.isArray(json.data)) {
        return json.data.map((item: any, idx: number) => {
          const isApt = item.canonical_slug === 'apartemen' || item.slug?.includes('apartemen');
          const cleanImg = item.image_url ? item.image_url.replace(/^http:\/\//, 'https://') : (isApt ? 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80' : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80');
          const cleanImgs = Array.isArray(item.image_urls) ? item.image_urls.map((u: string) => u.replace(/^http:\/\//, 'https://')) : [cleanImg];
          const roomsCount = item.available_rooms?.length || 0;
          const status = item.availability_status || (roomsCount > 0 ? `Ready ${roomsCount} kamar` : 'Kamar full');

          return {
            id: idx + 1,
            title: item.name,
            slug: item.slug,
            canonicalSlug: item.canonical_slug,
            canonicalId: item.canonical_id,
            category: isApt ? 'Luxury Apartment' : 'Premium Boarding Room',
            type: isApt ? 'apartment' : 'kos',
            price: item.price_range || 'Rp 1.500.000 / bulan',
            priceRange: item.price_range,
            rawPrice: 1500000,
            location: item.kecamatan || 'Jakarta',
            kecamatan: item.kecamatan,
            address: item.kecamatan || 'Jakarta',
            phone: item.phone,
            addressUrl: item.address_url,
            rating: (idx % 2 === 0 ? '4.9 ★' : '4.8 ★'),
            image: cleanImg,
            imageUrls: cleanImgs,
            videoUrl: item.video_url?.replace(/^http:\/\//, 'https://'),
            colSpan: idx % 3 === 0 ? 'md:col-span-7' : 'md:col-span-5',
            aspectRatio: idx % 3 === 0 ? 'aspect-[4/3] md:aspect-[1.5/1]' : 'aspect-[4/3] md:aspect-[1.1/1]',
            available: roomsCount > 0 && status.toLowerCase() !== 'kamar full',
            description: item.description || '',
            rooms: roomsCount > 0 ? roomsCount + 10 : 20,
            availableRooms: roomsCount,
            availableRoomsList: item.available_rooms || [],
            availableRoomDetails: item.available_room_details || [],
            availabilityStatus: status,
            status: roomsCount > 0 ? 'available' : 'booked',
            deposit: 0
          } as Property;
        });
      }
    }
  } catch (directErr) {
    console.error('Direct API fallback also failed:', directErr);
  }

  throw new Error('Failed to fetch properties from server and API.');
}

// Fetch a single property by ID or slug
export async function fetchPropertyById(id: number | string): Promise<Property> {
  try {
    const res = await fetch(`/api/properties/${id}`);
    if (res.ok) {
      return await res.json() as Property;
    }
  } catch (err) {
    console.warn(`Failed to fetch /api/properties/${id}, trying list lookup:`, err);
  }

  // Fallback: find from all properties list
  const all = await fetchProperties();
  const lookupKey = String(id).toLowerCase().trim();
  const prefixId = lookupKey.includes('-') ? lookupKey.split('-')[0] : null;
  const suffixSlug = lookupKey.includes('-') ? lookupKey.split('-').slice(1).join('-') : null;

  const found = all.find(p => {
    if (String(p.id) === lookupKey) return true;
    if (prefixId && String(p.id) === prefixId) return true;
    if (p.slug && p.slug.toLowerCase() === lookupKey) return true;
    if (suffixSlug && p.slug && p.slug.toLowerCase() === suffixSlug) return true;
    if (p.canonicalSlug && p.canonicalSlug.toLowerCase() === lookupKey) return true;
    if (suffixSlug && p.canonicalSlug && p.canonicalSlug.toLowerCase() === suffixSlug) return true;
    if (p.canonicalId && p.canonicalId.toLowerCase() === lookupKey) return true;
    return false;
  });

  if (found) return found;

  throw new Error(`Failed to fetch details for property #${id}`);
}

// Create a new property
export async function createProperty(property: Omit<Property, 'id'>): Promise<Property> {
  const res = await fetch('/api/properties', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(property)
  });
  return handleResponse<Property>(res, 'Failed to create property');
}

// Update a property
export async function updateProperty(id: number, property: Property): Promise<Property> {
  const res = await fetch(`/api/properties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(property)
  });
  return handleResponse<Property>(res, 'Failed to update property');
}

// Delete a property
export async function deleteProperty(id: number): Promise<{ id: number }> {
  const res = await fetch(`/api/properties/${id}`, {
    method: 'DELETE'
  });
  return handleResponse<{ id: number }>(res, 'Failed to delete property');
}

// Fetch all bookings
export async function fetchBookings(): Promise<Booking[]> {
  const res = await fetch('/api/bookings');
  return handleResponse<Booking[]>(res, 'Failed to fetch bookings');
}

// Create a booking
export async function createBooking(booking: Omit<Booking, 'id' | 'status'> & { phone: string }): Promise<Booking> {
  const res = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(booking)
  });
  return handleResponse<Booking>(res, 'Failed to create booking');
}

// Update booking status (approve / reject)
export async function updateBookingStatus(
  id: number, 
  status: string, 
  adminId?: number,
  extraDetails?: {
    idCardNumber?: string | null;
    idCardPhoto?: string | null;
    address?: string | null;
    emergencyContact?: string | null;
    emergencyPhone?: string | null;
  }
): Promise<{ id: number, status: string }> {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, adminId, ...extraDetails })
  });
  return handleResponse<{ id: number, status: string }>(res, 'Failed to update booking status');
}

// Delete booking
export async function deleteBooking(id: number): Promise<{ id: number }> {
  const res = await fetch(`/api/bookings/${id}`, {
    method: 'DELETE'
  });
  return handleResponse<{ id: number }>(res, 'Failed to delete booking');
}

export const AUTH_API_PROXY = '/api/v1/auth';
export const AUTH_API_BASE = (import.meta as any).env?.VITE_AUTH_API_URL || '/api/v1/auth';

async function callAuthApi<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const directUrl = `${AUTH_API_BASE}${normalizedPath}`;
  const proxyUrl = `${AUTH_API_PROXY}${normalizedPath}`;

  const defaultHeaders: Record<string, string> = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  const mergedHeaders = {
    ...defaultHeaders,
    ...(options.headers as Record<string, string> || {})
  };

  const reqOptions: RequestInit = {
    ...options,
    headers: mergedHeaders
  };

  // Try directUrl first
  try {
    const res = await fetch(directUrl, reqOptions);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.message || 
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
        `Request failed with status ${res.status}`;
      throw new Error(errorMsg);
    }

    return data as T;
  } catch (err: any) {
    if (err?.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('fetch failed')) {
      throw err;
    }

    if (directUrl === proxyUrl) {
      throw err;
    }

    // Try proxy fallback
    try {
      const res = await fetch(proxyUrl, reqOptions);
      const data = await res.json().catch(() => null);

      if (!res.ok) {
        const errorMsg = data?.message || 
          (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
          `Request failed with status ${res.status}`;
        throw new Error(errorMsg);
      }

      return data as T;
    } catch (proxyErr: any) {
      throw new Error(err?.message || proxyErr?.message || 'Gagal terhubung ke server autentikasi.');
    }
  }
}

// 1. Register a new tenant account (Staged Anti-Spam Registration)
export async function registerTenant(payload: RegisterPayload): Promise<RegisterResponse> {
  return await callAuthApi<RegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      otp_channel: payload.otp_channel || 'whatsapp',
      device_name: payload.device_name || 'highlanderstay-web'
    })
  });
}

// 2. Send / Resend OTP via WhatsApp or Email
export async function sendPhoneOtp(payload: SendOtpPayload, token?: string): Promise<SendOtpResponse> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return await callAuthApi<SendOtpResponse>('/otp/send', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      channel: 'whatsapp',
      ...payload
    })
  });
}

// 3. Verify OTP code (either with registration_token or with login/token)
export async function verifyPhoneOtp(payload: VerifyOtpPayload, token?: string): Promise<{ session: UserSession; response: VerifyOtpResponse }> {
  const headers: Record<string, string> = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const data = await callAuthApi<VerifyOtpResponse>('/otp/verify', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      device_name: 'highlanderstay-web',
      ...payload
    })
  });

  const session: UserSession = {
    role: 'tenant',
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    phone: data.user.phone,
    token: data.token,
    phone_verified: Boolean(data.phone_verified ?? data.user.phone_verified),
    phone_verified_at: data.user.phone_verified_at || new Date().toISOString(),
    is_active: Boolean(data.user.is_active),
    has_tenant_profile: Boolean(data.user.has_tenant_profile),
    tenant: data.user.tenant || null
  };

  return {
    session,
    response: data
  };
}

// 4. Login tenant (accepts email OR phone number)
export async function loginTenant(payload: LoginPayload): Promise<{ session: UserSession; message: string; token: string }> {
  const data = await callAuthApi<LoginResponse>('/login', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      device_name: payload.device_name || 'highlanderstay-web'
    })
  });

  const session: UserSession = {
    role: 'tenant',
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    phone: data.user.phone,
    token: data.token,
    phone_verified: Boolean(data.user.phone_verified),
    phone_verified_at: (data.user as any).phone_verified_at || null,
    is_active: Boolean(data.user.is_active),
    has_tenant_profile: Boolean((data.user as any).has_tenant_profile),
    tenant: (data.user as any).tenant || null
  };

  return {
    session,
    message: data.message || 'Login berhasil.',
    token: data.token
  };
}

// 5. Fetch current logged in user profile
export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const data = await callAuthApi<{ user: AuthUser }>('/me', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data.user;
}

// 6. Delete account permanently
export async function deleteMyAccount(token: string): Promise<{ message: string }> {
  return await callAuthApi<{ message: string }>('/me', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

// 7. Logout tenant
export async function logoutTenant(token: string): Promise<{ message: string }> {
  return await callAuthApi<{ message: string }>('/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
}

// 8. Check registration and verification status (dual-channel status)
export async function checkAuthStatus(login: string): Promise<CheckStatusResponse> {
  return await callAuthApi<CheckStatusResponse>('/check-status', {
    method: 'POST',
    body: JSON.stringify({
      login: login.trim()
    })
  });
}

// Fetch bookings for a specific tenant
export async function fetchTenantBookings(tenantId: number): Promise<Booking[]> {
  const res = await fetch(`/api/bookings?tenantId=${tenantId}`);
  return handleResponse<Booking[]>(res, 'Failed to fetch tenant bookings');
}

// Fetch specific tenant info
export interface TenantInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  id_card_number?: string | null;
  id_card_photo?: string | null;
  address?: string | null;
  emergency_contact?: string | null;
  emergency_phone?: string | null;
  status: string;
  created_at: string;
}

export async function fetchTenantInfo(tenantId: number): Promise<TenantInfo> {
  const res = await fetch(`/api/tenants/${tenantId}`);
  return handleResponse<TenantInfo>(res, 'Failed to fetch tenant info');
}

// Fetch all tenants
export async function fetchTenants(adminId?: number, role?: string): Promise<Tenant[]> {
  const params = new URLSearchParams();
  if (adminId) params.append('adminId', String(adminId));
  if (role) params.append('role', role);
  const res = await fetch(`/api/tenants?${params.toString()}`);
  return handleResponse<Tenant[]>(res, 'Failed to fetch tenants');
}

// Create a new tenant
export async function createTenant(tenant: Omit<Tenant, 'id'>): Promise<Tenant> {
  const res = await fetch('/api/tenants', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tenant)
  });
  return handleResponse<Tenant>(res, 'Failed to create tenant');
}

// Update a tenant
export async function updateTenant(id: number, tenant: Tenant): Promise<Tenant> {
  const res = await fetch(`/api/tenants/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tenant)
  });
  return handleResponse<Tenant>(res, 'Failed to update tenant');
}

// Fetch all transactions
export async function fetchTransactions(adminId?: number, role?: string, branchId?: number | null): Promise<Transaction[]> {
  const params = new URLSearchParams();
  if (adminId) params.append('adminId', String(adminId));
  if (role) params.append('role', role);
  if (branchId) params.append('branchId', String(branchId));
  const res = await fetch(`/api/transactions?${params.toString()}`);
  return handleResponse<Transaction[]>(res, 'Failed to fetch transactions');
}

// Create a new transaction
export async function createTransaction(transaction: Omit<Transaction, 'id'>): Promise<Transaction> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  });
  return handleResponse<Transaction>(res, 'Failed to create transaction');
}

// Settings Interface
export interface ResortPageSettings {
  heroEyebrow?: string;
  heroTitle?: string;
  heroDescription?: string;
  heroImage?: string;
  locationLabel?: string;
  elevationLabel?: string;
  ratingLabel?: string;
  featureEyebrow?: string;
  featureTitle?: string;
  featureDescription?: string;
  featureImage?: string;
  featureCardTitle?: string;
  featureCardDescription?: string;
  collectionEyebrow?: string;
  collectionTitle?: string;
  collectionDescription?: string;
  ctaEyebrow?: string;
  ctaTitle?: string;
  ctaDescription?: string;
}

export interface WebsiteSettings {
  logo_text: string;
  logo_gradient_start: string;
  logo_gradient_end: string;
  banner_eyebrow: string;
  banner_title: string;
  banner_description: string;
  banner_image: string;
  banner_cta: string;
  promo_enabled: string; // 'true' or 'false'
  promo_text: string;
  logo_image?: string;
  whatsapp_number?: string;
  banners?: string[];
  facilities_premium?: Array<{ id: number; title: string; image: string; rotation?: number }>;
  resort_page?: ResortPageSettings;
  resort_property_ids?: number[];
}

// Fetch Website Settings
export async function fetchSettings(): Promise<WebsiteSettings> {
  const res = await fetch('/api/settings');
  return handleResponse<WebsiteSettings>(res, 'Failed to fetch settings');
}

// Update Website Settings
export async function updateSettings(settings: Partial<WebsiteSettings>): Promise<{ success: boolean }> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings)
  });
  return handleResponse<{ success: boolean }>(res, 'Failed to update settings');
}

// Article Interface
export interface Article {
  id?: number;
  title: string;
  content: string;
  image?: string;
  read_time?: string;
  created_at?: string;
  updated_at?: string;
}

// Fetch all articles
export async function fetchArticles(): Promise<Article[]> {
  const res = await fetch('/api/articles');
  return handleResponse<Article[]>(res, 'Failed to fetch articles');
}

// Fetch single article
export async function fetchArticle(id: number | string): Promise<Article> {
  const res = await fetch(`/api/articles/${id}`);
  return handleResponse<Article>(res, 'Failed to fetch article');
}

// Create new article
export async function createArticle(article: Omit<Article, 'id'>): Promise<Article> {
  const res = await fetch('/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article)
  });
  return handleResponse<Article>(res, 'Failed to create article');
}

// Update article
export async function updateArticle(id: number, article: Article): Promise<Article> {
  const res = await fetch(`/api/articles/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(article)
  });
  return handleResponse<Article>(res, 'Failed to update article');
}

// Delete article
export async function deleteArticle(id: number): Promise<{ success: boolean; message: string; id: number }> {
  const res = await fetch(`/api/articles/${id}`, {
    method: 'DELETE'
  });
  return handleResponse<{ success: boolean; message: string; id: number }>(res, 'Failed to delete article');
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}
