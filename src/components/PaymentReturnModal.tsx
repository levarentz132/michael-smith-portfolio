import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle, RefreshCw, ArrowRight, X } from 'lucide-react';
import { fetchTenantInvoiceDetails } from '../api';
import type { TenantInvoice } from '../api';

interface PaymentReturnModalProps {
  isOpen: boolean;
  onClose: () => void;
  token?: string;
  invoiceId?: number | null;
  onPaymentSuccess?: (invoice: TenantInvoice) => void;
  onOpenTenantPortal?: () => void;
}

export const PaymentReturnModal: React.FC<PaymentReturnModalProps> = ({
  isOpen,
  onClose,
  token,
  invoiceId,
  onPaymentSuccess,
  onOpenTenantPortal
}) => {
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<TenantInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingCount, setPollingCount] = useState(0);

  const checkStatus = useCallback(async (isManualRefresh = false) => {
    if (!token || !invoiceId) {
      // Check if we have saved context in sessionStorage
      try {
        const saved = sessionStorage.getItem('pending_doku_checkout');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.invoiceId && token) {
            return checkStatusForId(parsed.invoiceId);
          }
        }
      } catch (e) {
        // ignore
      }
      setLoading(false);
      return;
    }
    await checkStatusForId(invoiceId, isManualRefresh);
  }, [token, invoiceId]);

  const checkStatusForId = async (id: number, isManual = false) => {
    if (!token) return;
    if (isManual) setLoading(true);
    setError(null);

    try {
      const res = await fetchTenantInvoiceDetails(id, token);
      if (res?.invoice) {
        setInvoice(res.invoice);
        if (res.invoice.status === 'paid') {
          sessionStorage.removeItem('pending_doku_checkout');
          if (onPaymentSuccess) {
            onPaymentSuccess(res.invoice);
          }
        }
      }
    } catch (err: any) {
      console.error('Failed to verify DOKU payment status:', err);
      setError(err?.message || 'Gagal memeriksa status pembayaran dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen, checkStatus]);

  // Auto poll once after 3 seconds if status is still pending (giving webhook time to process)
  useEffect(() => {
    if (isOpen && invoice && invoice.status !== 'paid' && pollingCount < 2) {
      const timer = setTimeout(() => {
        setPollingCount(prev => prev + 1);
        checkStatus();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isOpen, invoice, pollingCount, checkStatus]);

  if (!isOpen) return null;

  const isPaid = invoice?.status === 'paid' || (invoice?.outstanding !== undefined && invoice.outstanding <= 0);

  const formatRupiah = (val?: number) => {
    if (!val && val !== 0) return 'Rp 0';
    return `Rp ${Number(val).toLocaleString('id-ID')}`;
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 280 }}
          className="relative w-full max-w-md bg-surface border border-stroke rounded-2xl sm:rounded-[32px] p-6 sm:p-8 shadow-2xl z-20 text-center overflow-hidden max-h-[92vh] overflow-y-auto"
        >
          {/* Halftone subtle background */}
          <div className="absolute inset-0 halftone-overlay opacity-10 pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted hover:text-text-primary p-2 transition-colors z-30"
          >
            <X size={18} />
          </button>

          {loading ? (
            <div className="py-8 flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/20 border-t-emerald-400 animate-spin" />
              <div>
                <h3 className="text-base font-bold text-text-primary">Memverifikasi Pembayaran...</h3>
                <p className="text-xs text-muted mt-1">Menghubungkan ke OpenKos & DOKU Payment Gateway</p>
              </div>
            </div>
          ) : isPaid ? (
            /* SUCCESS STATE */
            <div className="space-y-5 relative z-10">
              <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 size={36} />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Pembayaran Terverifikasi
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mt-2 font-display">
                  Pembayaran Berhasil! 🎉
                </h3>
                <p className="text-xs text-muted mt-1">
                  Tagihan sewa Anda telah berhasil diselesaikan melalui DOKU Jokul Checkout.
                </p>
              </div>

              {invoice && (
                <div className="bg-bg/60 border border-stroke rounded-2xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center text-muted">
                    <span>No. Referensi</span>
                    <span className="font-mono font-bold text-text-primary">{invoice.reference}</span>
                  </div>
                  {invoice.unit_name && (
                    <div className="flex justify-between items-center text-muted">
                      <span>Unit Kamar</span>
                      <span className="font-semibold text-text-primary">{invoice.unit_name}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-muted">
                    <span>Total Tagihan</span>
                    <span className="font-bold text-emerald-400 text-sm">
                      {formatRupiah(invoice.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted pt-1 border-t border-stroke/40">
                    <span>Status</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      Lunas (Paid)
                    </span>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-2">
                <button
                  onClick={() => {
                    onClose();
                    if (onOpenTenantPortal) onOpenTenantPortal();
                  }}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-bg rounded-full text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Buka Dashboard & Riwayat Tagihan</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ) : (
            /* PENDING STATE */
            <div className="space-y-5 relative z-10">
              <div className="w-16 h-16 rounded-full bg-amber-500/15 border border-amber-400/40 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Clock size={34} />
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Menunggu Pembayaran
                </span>
                <h3 className="text-xl sm:text-2xl font-bold text-text-primary mt-2 font-display">
                  Transaksi Sedang Diproses
                </h3>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Jika Anda memilih Virtual Account atau QRIS di DOKU, silakan selesaikan pembayaran sebelum batas waktu berakhir.
                </p>
              </div>

              {invoice && (
                <div className="bg-bg/60 border border-stroke rounded-2xl p-4 text-left space-y-2 text-xs">
                  <div className="flex justify-between items-center text-muted">
                    <span>No. Referensi</span>
                    <span className="font-mono font-bold text-text-primary">{invoice.reference}</span>
                  </div>
                  <div className="flex justify-between items-center text-muted">
                    <span>Nominal Pembayaran</span>
                    <span className="font-bold text-text-primary text-sm">
                      {formatRupiah(invoice.outstanding || invoice.total)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-muted pt-1 border-t border-stroke/40">
                    <span>Status Terkini</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                      {invoice.status}
                    </span>
                  </div>
                </div>
              )}

              {error && (
                <div className="p-3 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex flex-col gap-2.5 pt-2">
                <button
                  onClick={() => checkStatus(true)}
                  className="w-full py-3 bg-text-primary hover:bg-white text-bg rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
                  <span>Cek Status Pembayaran Terkini</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 bg-surface border border-stroke hover:border-text-primary/40 text-muted hover:text-text-primary rounded-full text-xs font-semibold transition-colors"
                >
                  Tutup & Kembali ke Website
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
