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
  phone: string;
  password: string;
  name?: string;
  email?: string;
  password_confirmation?: string;
  otp_channel?: 'whatsapp' | 'email';
  device_name?: string;
  otp?: string;
}

export interface RegisterResponse {
  message: string;
  registration_token: string;
  otp_sent: boolean;
  otp_channel: string;
  target: string;
  driver?: string;
  delivery_warning?: string;
  delivery_error?: string;
  debug_otp?: string;
}

export interface ForgotPasswordPayload {
  login: string;
  channel?: 'whatsapp' | 'email';
}

export interface ForgotPasswordResponse {
  message: string;
  reset_token: string;
  channel: string;
  target: string;
  sent: boolean;
  driver?: string;
  delivery_warning?: string;
  delivery_error?: string;
  debug_otp?: string;
}

export interface ResetPasswordPayload {
  reset_token?: string;
  login?: string;
  code?: string;
  otp?: string;
  password: string;
  password_confirmation?: string;
  device_name?: string;
}

export interface ResetPasswordResponse {
  message: string;
  token: string;
  user: AuthUser;
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

export interface TenantUnit {
  id: number;
  name: string;
  floor?: number;
  status?: string;
}

export interface TenantProperty {
  id: number;
  name: string;
  address: string;
  city?: string;
  image_url?: string;
}

export interface TenantPayment {
  id: number;
  invoice_id: number;
  amount: number;
  payment_method?: string;
  status: string;
  payment_date?: string;
  notes?: string | null;
}

export interface TenantInvoice {
  id: number;
  reference: string;
  lease_id?: number;
  lease_reference?: string;
  property_name?: string;
  unit_name?: string;
  period_start?: string;
  period_end?: string;
  due_date: string;
  status: string;
  total: number;
  amount_paid: number;
  outstanding: number;
  is_overdue: boolean;
  lease?: {
    reference: string;
    unit_name: string;
    property_name: string;
    address: string;
  };
  payments?: TenantPayment[];
}

export interface TenantLease {
  id: number;
  reference: string;
  start_date: string;
  end_date: string;
  rent_amount: number;
  deposit_amount?: number;
  billing_label?: string;
  billing_cycle?: string;
  status: string;
  notes?: string | null;
  unit: TenantUnit;
  property: TenantProperty;
  invoices?: TenantInvoice[];
}

export interface TenantAccountSummary {
  total_unpaid_invoices: number;
  total_outstanding_amount: number;
  next_due_date?: string | null;
  open_maintenance_tickets: number;
}

export interface TenantNextAction {
  type: string;
  title: string;
  message: string;
  invoice_id?: number;
  reference?: string;
  amount?: number;
  due_date?: string;
}

export interface MaintenanceTicket {
  id: number;
  reference: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  location?: string | null;
  property_name?: string;
  unit_name?: string;
  created_at: string;
  resolved_at?: string | null;
}

export interface TenantDashboardData {
  tenant: {
    id: number;
    name: string;
    phone: string;
    email?: string | null;
    phone_verified: boolean;
  };
  active_lease?: TenantLease | null;
  account_summary: TenantAccountSummary;
  next_action?: TenantNextAction | null;
  recent_invoices: TenantInvoice[];
  recent_tickets: MaintenanceTicket[];
}

export interface TenantLeasesResponse {
  current_leases: TenantLease[];
  lease_history: TenantLease[];
}

export interface TenantInvoicesResponse {
  invoices: {
    current_page: number;
    data: TenantInvoice[];
    last_page: number;
    total: number;
  };
}

export interface DokuCheckoutAttempt {
  id?: number;
  reference: string;
  provider_reference?: string;
  amount: number;
  currency?: string;
  status: string;
  expires_at?: string;
}

export interface DokuCheckoutResponse {
  message: string;
  checkout_url: string;
  reused?: boolean;
  attempt?: DokuCheckoutAttempt;
}

export interface CreateOrderPayload {
  unit_id: number;
  name: string;
  phone: string;
  email?: string;
  start_date: string; // YYYY-MM-DD
  duration_months?: number;
  notes?: string;
}

export interface CreateOrderResponse {
  message: string;
  order: {
    lease_id: number;
    lease_reference: string;
    property?: {
      id: number;
      name: string;
      address?: string;
    };
    unit?: {
      id: number;
      name: string;
    };
    period?: {
      start_date: string;
      end_date: string;
      duration_months: number;
    };
    tenant?: {
      id: number;
      name: string;
      phone: string;
      email?: string;
    };
    invoice?: {
      id: number;
      reference: string;
      status: string;
      total: number;
      due_date: string;
    };
    checkout_url?: string | null;
    payment_attempt?: any;
    token?: string;
  };
}

// --- CART INTERFACES (Cart-First Booking Flow) ---
export interface CartItem {
  id: number;
  reference: string;
  property_name?: string;
  unit_name?: string;
  guest_name?: string;
  guest_phone?: string;
  start_date?: string;
  end_date?: string;
  duration_months?: number;
  amount: number;
  currency?: string;
  status: string;
  is_available?: boolean;
  is_paid?: boolean;
  lease_id?: number | null;
  conflict_message?: string | null;
  checkout_url?: string | null;
  expires_at?: string;
  property?: { id?: number; name?: string; address?: string };
  unit?: { id?: number; name?: string };
  guest?: { name?: string; phone?: string; email?: string };
  period?: { start_date?: string; end_date?: string; duration_months?: number };
}

export interface CartData {
  cart_token: string;
  count: number;
  total: number;
  items: CartItem[];
}

export interface AddToCartPayload {
  unit_id: number;
  name: string;
  phone: string;
  email?: string;
  start_date: string; // YYYY-MM-DD
  duration_months?: number;
  notes?: string;
}

export interface AddToCartResponse {
  message: string;
  order: {
    id: number;
    reference: string;
    cart_token: string;
    status: string;
    property: {
      id: number;
      name: string;
      address?: string;
    };
    unit: {
      id: number;
      name: string;
    };
    guest: {
      name: string;
      phone: string;
      email?: string;
    };
    period: {
      start_date: string;
      end_date?: string;
      duration_months: number;
    };
    amount: number;
    currency?: string;
    checkout_url?: string | null;
    expires_at?: string;
    lease_created: boolean;
    is_available?: boolean;
    conflict_message?: string | null;
  };
}

export interface RefreshCheckoutResponse {
  message: string;
  checkout_url: string;
  order?: {
    id: number;
    reference: string;
    amount: number;
    status: string;
  };
}

export interface TenantTicketsResponse {
  tickets: {
    current_page: number;
    data: MaintenanceTicket[];
    total: number;
  };
}

export interface SubmitPaymentPayload {
  invoiceId: number;
  amount: number;
  payment_method: string;
  proof_image?: File | null;
  payment_date?: string;
  notes?: string;
}

export interface CreateTicketPayload {
  title: string;
  description: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  location?: string;
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
export const AUTH_API_BASE = 
  (import.meta as any).env?.VITE_API_BASE_URL || 
  (import.meta as any).env?.API_BASE_URL || 
  (import.meta as any).env?.VITE_AUTH_API_URL || 
  'https://dashboard.highlanderstay.com/api/v1/auth';

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

// 1. Register a new tenant account (Staged Anti-Spam Registration with phone & password)
export async function registerTenant(payload: RegisterPayload): Promise<RegisterResponse> {
  const phone = payload.phone.trim();
  const password = payload.password;
  const name = payload.name?.trim() || `Penyewa ${phone}`;
  const password_confirmation = payload.password_confirmation || password;

  return await callAuthApi<RegisterResponse>('/register', {
    method: 'POST',
    body: JSON.stringify({
      name,
      email: payload.email?.trim() || '',
      phone,
      password,
      password_confirmation,
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

// 9. Request Password Reset OTP (WhatsApp / Email)
export async function forgotPassword(payload: ForgotPasswordPayload): Promise<ForgotPasswordResponse> {
  return await callAuthApi<ForgotPasswordResponse>('/password/forgot', {
    method: 'POST',
    body: JSON.stringify({
      login: payload.login.trim(),
      channel: payload.channel || 'whatsapp'
    })
  });
}

// 10. Reset Password with OTP and automatically sign in
export async function resetPassword(payload: ResetPasswordPayload): Promise<{ session: UserSession; message: string; token: string }> {
  const code = (payload.code || payload.otp || '').trim();
  const passwordConfirmation = payload.password_confirmation || payload.password;

  const body: Record<string, any> = {
    code,
    otp: code,
    password: payload.password,
    password_confirmation: passwordConfirmation,
    device_name: payload.device_name || 'highlanderstay-web'
  };

  if (payload.reset_token) {
    body.reset_token = payload.reset_token;
  }
  if (payload.login) {
    body.login = payload.login.trim();
  }

  const data = await callAuthApi<ResetPasswordResponse>('/password/reset', {
    method: 'POST',
    body: JSON.stringify(body)
  });

  const session: UserSession = {
    role: 'tenant',
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    phone: data.user.phone,
    token: data.token,
    phone_verified: Boolean(data.user.phone_verified),
    phone_verified_at: (data.user as any).phone_verified_at || new Date().toISOString(),
    is_active: Boolean(data.user.is_active),
    has_tenant_profile: Boolean((data.user as any).has_tenant_profile),
    tenant: (data.user as any).tenant || null
  };

  return {
    session,
    message: data.message || 'Password berhasil direset! Anda telah otomatis masuk.',
    token: data.token
  };
}

// --- TENANT PORTAL SECURED API ---
export const TENANT_API_PROXY = '/api/v1/tenant';
export const TENANT_API_BASE = 
  (import.meta as any).env?.VITE_TENANT_API_URL || 
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/auth$/, '/tenant') || 
  'https://dashboard.highlanderstay.com/api/v1/tenant';

async function callTenantApi<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const directUrl = `${TENANT_API_BASE}${normalizedPath}`;
  const proxyUrl = `${TENANT_API_PROXY}${normalizedPath}`;

  const headers: Record<string, string> = {
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // Only set application/json if body is not FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const mergedHeaders = {
    ...headers,
    ...(options.headers as Record<string, string> || {})
  };

  const reqOptions: RequestInit = {
    ...options,
    headers: mergedHeaders
  };

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
      throw new Error(err?.message || proxyErr?.message || 'Gagal terhubung ke server portal penyewa.');
    }
  }
}

// 1. Fetch Tenant Dashboard Overview
export async function fetchTenantDashboard(token: string): Promise<TenantDashboardData> {
  return await callTenantApi<TenantDashboardData>('/dashboard', token, { method: 'GET' });
}

// 2. Fetch Tenant Leases
export async function fetchTenantLeases(token: string): Promise<TenantLeasesResponse> {
  return await callTenantApi<TenantLeasesResponse>('/leases', token, { method: 'GET' });
}

// 3. Fetch Single Lease Details
export async function fetchTenantLeaseDetails(leaseId: number, token: string): Promise<{ lease: TenantLease }> {
  return await callTenantApi<{ lease: TenantLease }>(`/leases/${leaseId}`, token, { method: 'GET' });
}

// 4. Fetch Tenant Invoices (with filtering)
export async function fetchTenantInvoices(
  token: string, 
  params?: { status?: string; lease_id?: number; page?: number }
): Promise<TenantInvoicesResponse> {
  const query = new URLSearchParams();
  if (params?.status && params.status !== 'all') query.set('status', params.status);
  if (params?.lease_id) query.set('lease_id', String(params.lease_id));
  if (params?.page) query.set('page', String(params.page));
  const queryString = query.toString() ? `?${query.toString()}` : '';

  return await callTenantApi<TenantInvoicesResponse>(`/invoices${queryString}`, token, { method: 'GET' });
}

// 5. Fetch Single Invoice Details
export async function fetchTenantInvoiceDetails(invoiceId: number, token: string): Promise<{ invoice: TenantInvoice }> {
  return await callTenantApi<{ invoice: TenantInvoice }>(`/invoices/${invoiceId}`, token, { method: 'GET' });
}

// 5b. Create DOKU Checkout Session for Invoice
export async function createTenantInvoiceCheckout(
  invoiceId: number,
  token: string
): Promise<DokuCheckoutResponse> {
  return await callTenantApi<DokuCheckoutResponse>(
    `/invoices/${invoiceId}/checkout`,
    token,
    {
      method: 'POST',
      body: JSON.stringify({})
    }
  );
}

// 5c. Create New Room Order & Lease (OpenKos Orders API with automatic DOKU Checkout URL)
export const ORDERS_API_PROXY = '/api/v1/orders';
export const ORDERS_API_BASE = 
  (import.meta as any).env?.VITE_ORDERS_API_URL || 
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/auth$/, '/orders') || 
  'https://dashboard.highlanderstay.com/api/v1/orders';

export async function createOpenKosOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
  const reqBody = {
    unit_id: payload.unit_id,
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || undefined,
    start_date: payload.start_date,
    duration_months: payload.duration_months || 1,
    notes: payload.notes?.trim() || undefined
  };

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  // 1. Try direct URL first
  try {
    const res = await fetch(ORDERS_API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody)
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.order) {
      return data as CreateOrderResponse;
    }

    if (res.status === 422 || res.status === 400 || res.status === 404) {
      const errorMsg = data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
        'Gagal memproses pemesanan kamar.';
      throw new Error(errorMsg);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('fetch failed')) {
      throw err;
    }
  }

  // 2. Try proxy URL
  try {
    const res = await fetch(ORDERS_API_PROXY, {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody)
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.order) {
      return data as CreateOrderResponse;
    }

    if (data?.message || data?.errors) {
      const errorMsg = data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null);
      throw new Error(errorMsg);
    }
  } catch (proxyErr: any) {
    if (proxyErr.message && !proxyErr.message.includes('Failed to fetch') && !proxyErr.message.includes('NetworkError') && !proxyErr.message.includes('fetch failed')) {
      throw proxyErr;
    }
  }

  // 3. Fallback to local OpenKos instance (port 8000)
  try {
    const res = await fetch('http://localhost:8000/api/v1/orders', {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody)
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.order) {
      return data as CreateOrderResponse;
    }

    if (data?.message || data?.errors) {
      const errorMsg = data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null);
      throw new Error(errorMsg);
    }
  } catch (localErr: any) {
    if (localErr.message && !localErr.message.includes('Failed to fetch')) {
      throw localErr;
    }
  }

  throw new Error('Gagal terhubung ke layanan pemesanan OpenKos. Mohon periksa koneksi Anda.');
}

// --- 5d. Cart-First Booking API Functions ---
export const CART_API_PROXY = '/api/v1/cart';
export const CART_API_BASE =
  (import.meta as any).env?.VITE_CART_API_URL ||
  (import.meta as any).env?.VITE_API_BASE_URL?.replace(/\/auth$/, '/cart') ||
  'https://dashboard.highlanderstay.com/api/v1/cart';

export function getOrCreateCartToken(): string {
  let token = localStorage.getItem('openkos_cart_token');
  if (!token) {
    token = 'cart-' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    localStorage.setItem('openkos_cart_token', token);
  }
  return token;
}

export async function addToCart(payload: AddToCartPayload, customCartToken?: string): Promise<AddToCartResponse> {
  const cartToken = customCartToken || getOrCreateCartToken();
  const reqBody = {
    unit_id: payload.unit_id,
    name: payload.name.trim(),
    phone: payload.phone.trim(),
    email: payload.email?.trim() || undefined,
    start_date: payload.start_date,
    duration_months: payload.duration_months || 1,
    notes: payload.notes?.trim() || undefined
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-Cart-Token': cartToken
  };

  // 1. Try direct URL first
  try {
    const res = await fetch(CART_API_BASE, {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody)
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.order) {
      if (data.order.cart_token) {
        localStorage.setItem('openkos_cart_token', data.order.cart_token);
      }
      return data as AddToCartResponse;
    }

    if (res.status === 409 || res.status === 422 || res.status === 400 || res.status === 404) {
      const errorMsg = data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
        'Kamar ini sudah tidak tersedia atau telah dipesan oleh orang lain.';
      const err: any = new Error(errorMsg);
      err.code = data?.code || (res.status === 409 ? 'ROOM_ALREADY_PAID' : undefined);
      err.response = { data, status: res.status };
      throw err;
    }
  } catch (err: any) {
    if (err.code || (err.message && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError') && !err.message.includes('fetch failed'))) {
      throw err;
    }
  }

  // 2. Try proxy URL
  try {
    const res = await fetch(CART_API_PROXY, {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody)
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data?.order) {
      if (data.order.cart_token) {
        localStorage.setItem('openkos_cart_token', data.order.cart_token);
      }
      return data as AddToCartResponse;
    }

    if (res.status === 409 || res.status === 422 || res.status === 400 || res.status === 404 || data?.message || data?.errors) {
      const errorMsg = data?.message ||
        (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
        'Kamar ini sudah tidak tersedia atau telah dipesan oleh orang lain.';
      const err: any = new Error(errorMsg);
      err.code = data?.code || (res.status === 409 ? 'ROOM_ALREADY_PAID' : undefined);
      err.response = { data, status: res.status };
      throw err;
    }
  } catch (proxyErr: any) {
    if (proxyErr.code || (proxyErr.message && !proxyErr.message.includes('Failed to fetch') && !proxyErr.message.includes('NetworkError') && !proxyErr.message.includes('fetch failed'))) {
      throw proxyErr;
    }
  }

  // 3. Fallback to local dev server (port 8000)
  try {
    const res = await fetch('http://localhost:8000/api/v1/cart', {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody)
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.order) {
      if (data.order.cart_token) {
        localStorage.setItem('openkos_cart_token', data.order.cart_token);
      }
      return data as AddToCartResponse;
    }
    if (data?.message) {
      throw new Error(data.message);
    }
  } catch (localErr: any) {
    if (localErr.message && !localErr.message.includes('Failed to fetch')) {
      throw localErr;
    }
  }

  throw new Error('Gagal menambahkan kamar ke keranjang pemesanan. Silakan coba lagi.');
}

export async function fetchCart(customCartToken?: string): Promise<{ cart: CartData }> {
  const cartToken = customCartToken || getOrCreateCartToken();
  const query = `?cart_token=${encodeURIComponent(cartToken)}`;
  const headers = { 'Accept': 'application/json', 'X-Cart-Token': cartToken };

  // 1. Try direct URL
  try {
    const res = await fetch(`${CART_API_BASE}${query}`, { headers });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.cart) {
      return data as { cart: CartData };
    }
  } catch {}

  // 2. Try proxy URL
  try {
    const res = await fetch(`${CART_API_PROXY}${query}`, { headers });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.cart) {
      return data as { cart: CartData };
    }
  } catch {}

  // 3. Fallback to local
  try {
    const res = await fetch(`http://localhost:8000/api/v1/cart${query}`, { headers });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.cart) {
      return data as { cart: CartData };
    }
  } catch {}

  return {
    cart: {
      cart_token: cartToken,
      count: 0,
      total: 0,
      items: []
    }
  };
}

export async function removeFromCart(orderId: number): Promise<{ message: string }> {
  const cartToken = getOrCreateCartToken();
  const headers = { 'Accept': 'application/json', 'X-Cart-Token': cartToken };

  // 1. Try direct URL
  try {
    const res = await fetch(`${CART_API_BASE}/${orderId}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return data || { message: 'Booking item removed from cart.' };
  } catch {}

  // 2. Try proxy URL
  try {
    const res = await fetch(`${CART_API_PROXY}/${orderId}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return data || { message: 'Booking item removed from cart.' };
  } catch {}

  // 3. Fallback to local
  try {
    const res = await fetch(`http://localhost:8000/api/v1/cart/${orderId}`, {
      method: 'DELETE',
      headers
    });
    const data = await res.json().catch(() => null);
    if (res.ok) return data || { message: 'Booking item removed from cart.' };
  } catch {}

  return { message: 'Booking item removed from cart.' };
}

export function isValidCheckoutUrl(url?: string | null): boolean {
  if (!url || typeof url !== 'string') return false;
  const clean = url.trim().toLowerCase();
  if (clean.length < 10) return false;
  if (clean.includes('/api/v1/') || clean.endsWith('/checkout')) {
    return false;
  }
  return clean.startsWith('http://') || clean.startsWith('https://');
}

export async function refreshCartCheckout(orderId: number): Promise<RefreshCheckoutResponse> {
  const cartToken = getOrCreateCartToken();
  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Cart-Token': cartToken
  };

  // 1. Try proxy URL first (goes through local Express server with error interceptor)
  try {
    const res = await fetch(`${CART_API_PROXY}/${orderId}/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.checkout_url && isValidCheckoutUrl(data.checkout_url)) {
      return data as RefreshCheckoutResponse;
    }
    if (res.status === 409 || res.status === 400 || res.status === 422 || data?.code === 'ROOM_ALREADY_PAID' || data?.message) {
      let errorMsg = data?.message || 'Kamar ini sudah dibayar oleh orang lain.';
      if (res.status === 502 || errorMsg.includes('The GET method is not supported') || data?.code === 'PAYMENT_GATEWAY_ERROR') {
        errorMsg = 'Layanan pembayaran online (DOKU Checkout) di server sedang mengalami kendala teknis (HTTP 502). Pesanan kamar Anda telah tersimpan di keranjang. Silakan hubungi admin untuk konfirmasi pembayaran manual.';
      }
      const err: any = new Error(errorMsg);
      err.code = data?.code || (res.status === 409 ? 'ROOM_ALREADY_PAID' : (res.status === 502 ? 'PAYMENT_GATEWAY_ERROR' : undefined));
      err.response = { data, status: res.status };
      throw err;
    }
  } catch (proxyErr: any) {
    if (proxyErr.code || (proxyErr.message && !proxyErr.message.includes('Failed to fetch') && !proxyErr.message.includes('NetworkError') && !proxyErr.message.includes('fetch failed'))) {
      throw proxyErr;
    }
  }

  // 2. Try direct URL fallback
  try {
    const res = await fetch(`${CART_API_BASE}/${orderId}/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({})
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.checkout_url && isValidCheckoutUrl(data.checkout_url)) {
      return data as RefreshCheckoutResponse;
    }
    if (res.status === 409 || res.status === 400 || res.status === 422 || data?.code === 'ROOM_ALREADY_PAID' || data?.message) {
      let errorMsg = data?.message || 'Kamar ini sudah dibayar oleh orang lain.';
      if (res.status === 502 || errorMsg.includes('The GET method is not supported') || data?.code === 'PAYMENT_GATEWAY_ERROR') {
        errorMsg = 'Layanan pembayaran online (DOKU Checkout) di server sedang mengalami kendala teknis (HTTP 502). Pesanan kamar Anda telah tersimpan di keranjang. Silakan hubungi admin untuk konfirmasi pembayaran manual.';
      }
      const err: any = new Error(errorMsg);
      err.code = data?.code || (res.status === 409 ? 'ROOM_ALREADY_PAID' : (res.status === 502 ? 'PAYMENT_GATEWAY_ERROR' : undefined));
      err.response = { data, status: res.status };
      throw err;
    }
  } catch (directErr: any) {
    if (directErr.code || (directErr.message && !directErr.message.includes('Failed to fetch') && !directErr.message.includes('NetworkError') && !directErr.message.includes('fetch failed'))) {
      throw directErr;
    }
  }

  throw new Error('Tautan pembayaran DOKU belum tersedia dari server.');
}

// 5e. Sandbox / Payment Simulation API
export const SANDBOX_API_PROXY = '/api/v1/sandbox';
export const SANDBOX_API_BASE =
  (import.meta as any).env?.VITE_SANDBOX_API_URL ||
  'https://dashboard.highlanderstay.com/api/v1/sandbox';

export interface SimulatePaymentResponse {
  success: boolean;
  status: string;
  message: string;
  order: {
    id: number;
    reference: string;
    status: string;
    lease_id: number;
    invoice_id: number;
    unit_id: number;
    paid_at: string;
  };
}

export async function simulatePaymentSuccess(orderIdOrRef: number | string): Promise<SimulatePaymentResponse> {
  const payload = typeof orderIdOrRef === 'number'
    ? { booking_order_id: orderIdOrRef }
    : { reference: orderIdOrRef };

  const headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/json'
  };

  // 1. Try proxy first (express proxy on port 5000)
  try {
    const res = await fetch(`${SANDBOX_API_PROXY}/simulate-payment`, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success) {
      return data as SimulatePaymentResponse;
    }
  } catch {}

  // 2. Try direct API base
  const res = await fetch(`${SANDBOX_API_BASE}/simulate-payment`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => null);
  if (res.ok && data?.success) {
    return data as SimulatePaymentResponse;
  }

  throw new Error(data?.message || 'Gagal melakukan simulasi pembayaran.');
}


// 6. Submit Invoice Payment Proof
export async function submitInvoicePaymentProof(
  payload: SubmitPaymentPayload,
  token: string
): Promise<{ message: string; payment: TenantPayment }> {
  const formData = new FormData();
  formData.append('amount', String(payload.amount));
  formData.append('payment_method', payload.payment_method);
  if (payload.proof_image) {
    formData.append('proof_image', payload.proof_image);
  }
  if (payload.payment_date) {
    formData.append('payment_date', payload.payment_date);
  }
  if (payload.notes) {
    formData.append('notes', payload.notes);
  }

  return await callTenantApi<{ message: string; payment: TenantPayment }>(
    `/invoices/${payload.invoiceId}/pay`,
    token,
    {
      method: 'POST',
      body: formData
    }
  );
}

// 7. Fetch Maintenance Tickets
export async function fetchMaintenanceTickets(token: string): Promise<TenantTicketsResponse> {
  return await callTenantApi<TenantTicketsResponse>('/maintenance-tickets', token, { method: 'GET' });
}

// 8. Create Maintenance Ticket
export async function createMaintenanceTicket(
  payload: CreateTicketPayload,
  token: string
): Promise<{ message: string; ticket: MaintenanceTicket }> {
  return await callTenantApi<{ message: string; ticket: MaintenanceTicket }>(
    '/maintenance-tickets',
    token,
    {
      method: 'POST',
      body: JSON.stringify(payload)
    }
  );
}

// 9. Fetch Maintenance Ticket Details
export async function fetchMaintenanceTicketDetails(ticketId: number, token: string): Promise<{ ticket: MaintenanceTicket }> {
  return await callTenantApi<{ ticket: MaintenanceTicket }>(`/maintenance-tickets/${ticketId}`, token, { method: 'GET' });
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
