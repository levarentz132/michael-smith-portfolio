import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Calendar, Share2, Sparkles } from 'lucide-react';
import { fetchArticle, fetchSettings, type Article, type WebsiteSettings, type UserSession } from '../api';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { useSEO } from '../hooks/useSEO';

export const ArticlePage: React.FC = () => {
  const { idSlug } = useParams<{ idSlug: string }>();
  const id = idSlug ? parseInt(idSlug.split('-')[0]) : undefined;
  const navigate = useNavigate();

  const [article, setArticle] = useState<Article | null>(null);
  const [settings, setSettings] = useState<WebsiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const savedSession = localStorage.getItem('userSession');
    if (savedSession) {
      try {
        return JSON.parse(savedSession);
      } catch (e) {
        console.error('Error parsing session', e);
      }
    }
    return null;
  });

  // SEO optimization
  useSEO({
    title: article 
      ? `${article.title} | Highlanderstay Jurnal`
      : 'Memuat Artikel... | Highlanderstay',
    description: article 
      ? article.content.replace(/<[^>]*>/g, '').substring(0, 160)
      : 'Membaca artikel panduan hunian terbaru di Highlanderstay...',
    keywords: article
      ? `co-living, panduan kos, tips apartemen, ${article.title.toLowerCase().replace(/[^a-zA-Z0-9\s]/g, '').split(' ').join(', ')}`
      : 'co-living, panduan sewa, tips sewa kos, Jakarta'
  });

  const loadData = async (articleId: number) => {
    try {
      setLoading(true);
      setError(null);
      const [articleData, settingsData] = await Promise.all([
        fetchArticle(articleId),
        fetchSettings()
      ]);
      setArticle(articleData);
      setSettings(settingsData);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Gagal memuat artikel.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      loadData(id);
    } else {
      setError('ID artikel tidak valid.');
      setLoading(false);
    }
  }, [id]);

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: article?.title,
        url: window.location.href
      }).catch(err => console.error(err));
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Tautan artikel berhasil disalin!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userSession');
    setUserSession(null);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-bg text-text-primary flex flex-col font-sans select-none">
      {/* Navbar */}
      <Navbar 
        activeSection="" 
        onNavClick={(sec) => {
          if (sec === 'admin') {
            navigate('/admin');
          } else {
            navigate(`/#${sec}`);
          }
        }} 
        session={userSession}
        onLogout={handleLogout}
        onLoginClick={() => navigate('/#login')}
        settings={settings}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-[800px] mx-auto w-full px-6 py-12 mt-12">
        
        {/* Back Button & Share */}
        <div className="flex justify-between items-center mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted hover:text-text-primary border border-stroke px-4 py-2 rounded-full transition-colors duration-200"
          >
            <ArrowLeft size={14} />
            Kembali
          </button>
          
          {article && (
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-muted hover:text-text-primary border border-stroke px-4 py-2 rounded-full transition-colors duration-200"
            >
              <Share2 size={14} />
              Bagikan
            </button>
          )}
        </div>

        {/* Loading Indicator */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted">
            <div className="w-8 h-8 rounded-full border-2 border-stroke border-t-text-primary animate-spin mb-4" />
            <span className="text-xs uppercase tracking-widest font-semibold">Memuat Artikel...</span>
          </div>
        ) : error ? (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm p-5 rounded-2xl text-left my-10">
            <p className="font-semibold mb-1">Terjadi Kesalahan</p>
            <p className="opacity-80">{error}</p>
          </div>
        ) : article ? (
          <article className="animate-fade-in text-left">
            {/* Metadata Eyebrow */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted mb-4 font-medium uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calendar size={12} />
                {article.created_at ? new Date(article.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Tanggal tidak tersedia'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-stroke" />
              <span className="flex items-center gap-1.5 bg-stroke/30 px-3 py-1 rounded-full text-[10px] font-semibold text-text-primary/80">
                <Clock size={11} />
                {article.read_time}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-display font-medium text-text-primary leading-tight mb-8">
              {article.title}
            </h1>

            {/* Hero Image */}
            {article.image && (
              <div className="w-full aspect-[16/9] rounded-3xl overflow-hidden border border-stroke bg-surface mb-10 shadow-lg relative">
                <img 
                  src={article.image} 
                  alt={article.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 halftone-overlay mix-blend-multiply opacity-15 pointer-events-none" />
              </div>
            )}

            {/* Content Body */}
            <div 
              className="prose prose-invert prose-p:text-muted prose-p:font-light prose-p:leading-relaxed prose-p:mb-5 prose-headings:text-text-primary prose-headings:font-display prose-headings:font-semibold prose-strong:text-text-primary text-sm sm:text-base border-t border-stroke/30 pt-8"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />

            {/* Premium CTA Bottom Card */}
            <div className="mt-16 bg-surface/30 border border-stroke/50 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl relative overflow-hidden backdrop-blur-md">
              <div className="absolute right-4 top-4 text-4xl opacity-10">
                <Sparkles />
              </div>
              <div className="text-left max-w-md">
                <h4 className="text-base sm:text-lg font-semibold text-text-primary mb-1">Mencari Hunian Co-living?</h4>
                <p className="text-xs sm:text-sm text-muted font-light leading-relaxed">
                  Highlanderstay menyediakan ruang hunian modern, berfurnitur lengkap, dan aman di berbagai kawasan perkotaan strategis.
                </p>
              </div>
              <button 
                onClick={() => navigate('/#work')}
                className="relative group rounded-full text-xs font-semibold uppercase tracking-wider px-6 py-3.5 bg-text-primary text-bg hover:bg-bg hover:text-text-primary transition-all duration-300 border border-transparent shrink-0"
              >
                Jelajahi Hunian
              </button>
            </div>

          </article>
        ) : null}

      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};
