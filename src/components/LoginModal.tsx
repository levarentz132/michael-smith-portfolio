import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { loginAdmin, loginTenant } from '../api';
import type { UserSession } from '../api';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession) => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'tenant' | 'admin'>('tenant');
  
  // Fields for tenant login
  const [tenantEmail, setTenantEmail] = useState('');
  const [tenantPassword, setTenantPassword] = useState('');
  
  // Fields for admin login
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    
    try {
      let session: UserSession;
      if (activeTab === 'tenant') {
        if (!tenantEmail || !tenantPassword) {
          throw new Error('Mohon isi semua kolom.');
        }
        session = await loginTenant(tenantEmail, tenantPassword);
      } else {
        if (!adminUsername || !adminPassword) {
          throw new Error('Mohon isi semua kolom.');
        }
        session = await loginAdmin(adminUsername, adminPassword);
      }
      
      onLoginSuccess(session);
      onClose();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Login gagal. Silakan periksa kredensial Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none">
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
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 250 }}
            className="relative w-full max-w-md bg-surface border border-stroke rounded-3xl p-6 sm:p-8 overflow-hidden shadow-2xl text-left"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-muted hover:text-text-primary text-xl transition-colors duration-200"
            >
              ✕
            </button>

            {/* Halftone Overlay */}
            <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-10 pointer-events-none" />

            <div className="relative z-10">
              <div className="text-left border-b border-stroke/40 pb-4 mb-6">
                <span className="text-[10px] text-muted uppercase tracking-[0.25em] font-semibold">Selamat Datang Kembali</span>
                <h3 className="text-2xl font-display italic font-semibold text-text-primary mt-1">
                  Masuk ke HighlanderStay
                </h3>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-2 bg-bg border border-stroke p-1 rounded-full mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('tenant');
                    setError('');
                  }}
                  className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2.5 transition-all duration-300 ${
                    activeTab === 'tenant' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                  }`}
                >
                  Masuk Penyewa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setError('');
                  }}
                  className={`text-xs font-semibold uppercase tracking-wider rounded-full py-2.5 transition-all duration-300 ${
                    activeTab === 'admin' ? 'text-bg bg-text-primary' : 'text-muted hover:text-text-primary'
                  }`}
                >
                  Masuk Admin
                </button>
              </div>

              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs px-4 py-2.5 rounded-xl mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                {activeTab === 'tenant' ? (
                  <>
                    {/* Tenant Email */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Alamat Email</label>
                      <input 
                        type="email"
                        required
                        value={tenantEmail}
                        onChange={(e) => setTenantEmail(e.target.value)}
                        placeholder="email-anda@contoh.com"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Tenant Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Kata Sandi</label>
                      <input 
                        type="password"
                        required
                        value={tenantPassword}
                        onChange={(e) => setTenantPassword(e.target.value)}
                        placeholder="Masukkan kata sandi (nomor telepon Anda)"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                      <span className="text-[10px] text-muted/80 mt-1">
                        Catatan: Kata sandi default adalah nomor telepon yang dikirimkan saat pemesanan Anda.
                      </span>
                    </div>
                  </>
                ) : (
                  <>
                    {/* Admin Username */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Nama Pengguna</label>
                      <input 
                        type="text"
                        required
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        placeholder="Nama pengguna"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>

                    {/* Admin Password */}
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs text-muted uppercase tracking-wider font-medium">Kata Sandi</label>
                      <input 
                        type="password"
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="Kata sandi"
                        className="w-full bg-bg border border-stroke rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-muted/50 focus:outline-none focus:border-white/20 transition-colors duration-200"
                      />
                    </div>
                  </>
                )}

                {/* Login Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full relative group rounded-full text-xs font-semibold uppercase tracking-wider py-4 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 flex items-center justify-center gap-2 border border-transparent mt-3"
                >
                  <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 p-[1px] accent-gradient" style={{ margin: '-1px' }} />
                  {isSubmitting ? 'Masuk...' : 'Masuk'}
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
