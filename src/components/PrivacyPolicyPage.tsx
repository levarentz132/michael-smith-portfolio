import React from 'react';
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSEO } from '../hooks/useSEO';

export const PrivacyPolicyPage: React.FC = () => {
  const navigate = useNavigate();

  useSEO({
    title: 'Privacy Policy | Highlanderstay',
    description: 'Privacy Policy for Highlanderstay, including how we collect, use, protect, and manage customer data for room booking and communication services.',
    keywords: 'Highlanderstay privacy policy, privacy policy, data protection, booking privacy',
    canonicalUrl: 'https://highlanderstay.com/privacy-policy'
  });

  return (
    <main className="min-h-screen bg-bg text-text-primary">
      <section className="max-w-3xl mx-auto px-6 py-10 md:py-16">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted hover:text-text-primary transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Highlanderstay
        </button>

        <div className="border border-stroke bg-surface rounded-3xl p-6 md:p-10 shadow-xl">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-muted font-bold">Highlanderstay</p>
              <h1 className="text-2xl md:text-4xl font-display italic font-semibold">Privacy Policy</h1>
            </div>
          </div>

          <p className="text-xs text-muted mb-8">Last updated: August 9, 2026</p>

          <div className="space-y-7 text-sm leading-relaxed text-muted">
            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">1. Information We Collect</h2>
              <p>
                Highlanderstay may collect personal information such as name, phone number, email address,
                booking details, identity information submitted for tenant verification, payment status, and
                messages sent to us through our website, WhatsApp, Meta/Facebook lead forms, or related services.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">2. How We Use Information</h2>
              <p>
                We use customer information to process room bookings, confirm availability, contact customers,
                provide tenant support, handle complaints, improve our service, and comply with operational or
                legal requirements. We may also use contact details to respond to inquiries submitted through
                Facebook, Instagram, WhatsApp, or our website.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">3. Payments</h2>
              <p>
                Online payments for eligible transit bookings may be processed by a third-party payment provider.
                Highlanderstay does not store full card or bank account details. Payment provider data is handled
                according to the provider&apos;s own security and privacy practices.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">4. Sharing of Information</h2>
              <p>
                We do not sell personal information. We may share limited information with service providers that
                help us operate bookings, payments, customer communication, hosting, analytics, or security. We may
                also disclose information when required by law or to protect our business, customers, or property.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">5. Data Security</h2>
              <p>
                We apply reasonable technical and organizational safeguards to protect personal information.
                However, no internet-based service can be guaranteed to be completely secure.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">6. Data Retention</h2>
              <p>
                We keep personal information only as long as needed for booking operations, tenant management,
                customer support, accounting records, dispute handling, and legal compliance.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">7. Your Choices</h2>
              <p>
                You may contact us to request access, correction, or deletion of your personal information,
                subject to operational, legal, and record-keeping requirements.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">8. Contact Us</h2>
              <p>
                For privacy questions or data requests, please contact Highlanderstay through our official
                customer support channel.
              </p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-stroke bg-bg px-4 py-3 text-text-primary">
                <Mail className="w-4 h-4 text-muted" />
                <span className="text-xs font-semibold">support@highlanderstay.com</span>
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
};
