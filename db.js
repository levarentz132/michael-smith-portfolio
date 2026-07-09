import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://your-project-id.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseKey);

// --- 1. PROPERTIES ---

export async function getProperties() {
  const { data, error } = await supabase
    .from('properties')
    .select('*, locations(name, slug)');
  if (error) throw error;
  
  return data.map(item => ({
    ...item,
    location_name: item.locations?.name || 'Jakarta',
    location_slug: item.locations?.slug || 'jakarta'
  }));
}

export async function getPropertyById(id) {
  const { data, error } = await supabase
    .from('properties')
    .select('*, locations(name, slug)')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  
  return {
    ...data,
    location_name: data.locations?.name || 'Jakarta',
    location_slug: data.locations?.slug || 'jakarta'
  };
}

export async function createProperty(property) {
  const { data, error } = await supabase
    .from('properties')
    .insert([property])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProperty(id, property) {
  const { data, error } = await supabase
    .from('properties')
    .update(property)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteProperty(id) {
  const { data, error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- 2. BOOKINGS ---

export async function getBookings(tenantId = null) {
  let query = supabase
    .from('bookings')
    .select('*, properties(name), tenants(*), admins(name)');
  
  if (tenantId) {
    query = query.eq('tenant_id', tenantId);
  }
  
  const { data, error } = await query.order('id', { ascending: false });
  if (error) throw error;
  
  return data.map(item => ({
    ...item,
    propertyName: item.properties?.name || `Property #${item.property_id}`,
    tenantName: item.tenants?.name || 'Anonymous Tenant',
    tenantEmail: item.tenants?.email || 'no-email@example.com',
    tenantPhone: item.tenants?.phone || '',
    tenantIdCardNumber: item.tenants?.id_card_number || '',
    tenantIdCardPhoto: item.tenants?.id_card_photo || '',
    tenantAddress: item.tenants?.address || '',
    tenantEmergencyContact: item.tenants?.emergency_contact || '',
    tenantEmergencyPhone: item.tenants?.emergency_phone || '',
    approvedByName: item.admins?.name || null
  }));
}

export async function createBooking(booking) {
  const { data, error } = await supabase
    .from('bookings')
    .insert([booking])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateBookingStatus(id, status, adminId = null, extraDetails = {}) {
  const updateData = { status };
  if (adminId) updateData.approved_by = adminId;
  
  const { data, error } = await supabase
    .from('bookings')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  
  // If we also need to update tenant details during approval
  if (Object.keys(extraDetails).length > 0 && data.tenant_id) {
    const { error: tenantErr } = await supabase
      .from('tenants')
      .update(extraDetails)
      .eq('id', data.tenant_id);
    if (tenantErr) console.error('Failed to update tenant details on booking approval:', tenantErr);
  }
  
  return data;
}

export async function deleteBooking(id) {
  const { data, error } = await supabase
    .from('bookings')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- 3. TENANTS ---

export async function getTenantById(id) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getTenants(adminId = null, role = null) {
  let query = supabase.from('tenants').select('*');
  
  // Custom filter if cashier admin is querying
  if (adminId && role === 'cashier') {
    query = query.eq('pic_admin_id', adminId);
  }
  
  const { data, error } = await query.order('id', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createTenant(tenant) {
  const { data, error } = await supabase
    .from('tenants')
    .insert([tenant])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTenant(id, tenant) {
  const { data, error } = await supabase
    .from('tenants')
    .update(tenant)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function findTenantByEmailOrPhone(email, phone) {
  let query = supabase.from('tenants').select('*');
  if (email && phone) {
    query = query.or(`email.eq."${email}",phone.eq."${phone}"`);
  } else if (email) {
    query = query.eq('email', email);
  } else if (phone) {
    query = query.eq('phone', phone);
  } else {
    return null;
  }
  
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data;
}

// --- 4. ADMINS ---

export async function getAdmins() {
  const { data, error } = await supabase
    .from('admins')
    .select('id, username, name, email, role, branch_id, is_active, created_at')
    .order('id', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAdminByUsername(username) {
  const { data, error } = await supabase
    .from('admins')
    .select('*')
    .eq('username', username)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createAdmin(admin) {
  const { data, error } = await supabase
    .from('admins')
    .insert([admin])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateAdmin(id, admin) {
  const { data, error } = await supabase
    .from('admins')
    .update(admin)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteAdmin(id) {
  const { data, error } = await supabase
    .from('admins')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- 5. TRANSACTIONS ---

export async function getTransactions(adminId = null, role = null, branchId = null) {
  let query = supabase.from('transactions').select('*, admins(name)');
  
  if (branchId) {
    query = query.eq('branch_id', branchId);
  }
  if (adminId && role === 'cashier') {
    query = query.eq('recorded_by', adminId);
  }
  
  const { data, error } = await query.order('id', { ascending: false });
  if (error) throw error;
  
  return data.map(item => ({
    ...item,
    recorded_by_name: item.admins?.name || `Admin #${item.recorded_by}`
  }));
}

export async function createTransaction(transaction) {
  const { data, error } = await supabase
    .from('transactions')
    .insert([transaction])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- 6. SETTINGS ---

export async function getSettings() {
  const { data, error } = await supabase
    .from('settings')
    .select('setting_key, setting_value');
  if (error) throw error;
  
  const settings = {};
  data.forEach(row => {
    let val = row.setting_value;
    try {
      val = JSON.parse(row.setting_value);
    } catch {
      // Keep raw string
    }
    settings[row.setting_key] = val;
  });
  return settings;
}

export async function updateSettings(settingsObj) {
  const promises = Object.entries(settingsObj).map(async ([key, val]) => {
    const valStr = JSON.stringify(val);
    const { error } = await supabase
      .from('settings')
      .upsert({ setting_key: key, setting_value: valStr }, { onConflict: 'setting_key' });
    if (error) throw error;
  });
  await Promise.all(promises);
}

// --- 7. ARTICLES ---

export async function getArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .order('id', { ascending: false });
  if (error) throw error;
  return data;
}

export async function getArticleById(id) {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createArticle(article) {
  const { data, error } = await supabase
    .from('articles')
    .insert([article])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateArticle(id, article) {
  const { data, error } = await supabase
    .from('articles')
    .update(article)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteArticle(id) {
  const { data, error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- 8. WHATSAPP OTPS ---

export async function saveOtp(phone, code, expiresAt) {
  const { data, error } = await supabase
    .from('whatsapp_otps')
    .insert([{ phone, code, expires_at: expiresAt }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getLatestOtp(phone) {
  const { data, error } = await supabase
    .from('whatsapp_otps')
    .select('*')
    .eq('phone', phone)
    .order('id', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteOtpsForPhone(phone) {
  const { error } = await supabase
    .from('whatsapp_otps')
    .delete()
    .eq('phone', phone);
  if (error) throw error;
}

// --- 9. COMPLAINTS ---

export async function getComplaints(tenantId) {
  const { data, error } = await supabase
    .from('complaints')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('id', { ascending: false });
  if (error) throw error;
  return data;
}

export async function createComplaint(complaint) {
  const { data, error } = await supabase
    .from('complaints')
    .insert([complaint])
    .select()
    .single();
  if (error) throw error;
  return data;
}

// --- 10. LOCATIONS ---

export async function getLocations() {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createLocation(location) {
  const { data, error } = await supabase
    .from('locations')
    .insert([location])
    .select()
    .single();
  if (error) throw error;
  return data;
}
