export interface Property {
  id?: number;
  title: string;
  category: string;
  type: 'kos' | 'apartment';
  price: string;
  location: string;
  rating: string;
  image: string;
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
}

export interface UserSession {
  role: 'admin' | 'tenant' | 'cashier' | 'owner';
  id: number;
  name: string;
  email?: string;
  username?: string;
  phone?: string;
  branchId?: number | null;
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

// Fetch all properties
export async function fetchProperties(): Promise<Property[]> {
  const res = await fetch('/api/properties');
  return handleResponse<Property[]>(res, 'Failed to fetch properties');
}

// Fetch a single property by ID
export async function fetchPropertyById(id: number): Promise<Property> {
  const res = await fetch(`/api/properties/${id}`);
  return handleResponse<Property>(res, `Failed to fetch details for property #${id}`);
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

// Login Admin
export async function loginAdmin(username: string, password: string): Promise<UserSession> {
  const res = await fetch('/api/login/admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  return handleResponse<UserSession>(res, 'Admin login failed');
}

// Login Tenant
export async function loginTenant(email: string, password: string): Promise<UserSession> {
  const res = await fetch('/api/login/tenant', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  return handleResponse<UserSession>(res, 'Tenant login failed');
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

// Admin User Interface
export interface AdminUser {
  id?: number;
  username: string;
  password?: string;
  name: string;
  email?: string | null;
  role: 'owner' | 'admin' | 'cashier';
  branch_id?: number | null;
  is_active?: number | boolean;
  created_at?: string;
}

// Fetch all admin users
export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch('/api/admins');
  return handleResponse<AdminUser[]>(res, 'Failed to fetch admin users');
}

// Create a new admin user
export async function createAdminUser(admin: Omit<AdminUser, 'id'>): Promise<AdminUser> {
  const res = await fetch('/api/admins', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin)
  });
  return handleResponse<AdminUser>(res, 'Failed to create admin user');
}

// Update an admin user
export async function updateAdminUser(id: number, admin: Partial<AdminUser>): Promise<AdminUser> {
  const res = await fetch(`/api/admins/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(admin)
  });
  return handleResponse<AdminUser>(res, 'Failed to update admin user');
}

// Delete an admin user
export async function deleteAdminUser(id: number): Promise<{ success: boolean; id: number }> {
  const res = await fetch(`/api/admins/${id}`, {
    method: 'DELETE'
  });
  return handleResponse<{ success: boolean; id: number }>(res, 'Failed to delete admin user');
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
