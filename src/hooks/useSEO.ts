import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  noindex?: boolean;
  canonicalUrl?: string;
  imageUrl?: string;
  structuredData?: object;
  enabled?: boolean;
}

export function useSEO({ title, description, keywords, noindex, canonicalUrl, imageUrl, structuredData, enabled = true }: SEOProps) {
  useEffect(() => {
    if (!enabled) return;

    // Update Title
    document.title = title;

    // Update Description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', description || '');
    } else if (description) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      metaDescription.setAttribute('content', description);
      document.head.appendChild(metaDescription);
    }

    // Update Keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', keywords || '');
    } else if (keywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.setAttribute('name', 'keywords');
      metaKeywords.setAttribute('content', keywords);
      document.head.appendChild(metaKeywords);
    }

    // Update Robots
    let metaRobots = document.querySelector('meta[name="robots"]');
    const robotsValue = noindex ? 'noindex, nofollow' : 'index, follow';
    if (metaRobots) {
      metaRobots.setAttribute('content', robotsValue);
    } else {
      metaRobots = document.createElement('meta');
      metaRobots.setAttribute('name', 'robots');
      metaRobots.setAttribute('content', robotsValue);
      document.head.appendChild(metaRobots);
    }

    // Update Open Graph (og:title / og:description)
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc && description) ogDesc.setAttribute('content', description);

    let ogUrl = document.querySelector('meta[property="og:url"]');
    if (canonicalUrl) {
      if (!ogUrl) {
        ogUrl = document.createElement('meta');
        ogUrl.setAttribute('property', 'og:url');
        document.head.appendChild(ogUrl);
      }
      ogUrl.setAttribute('content', canonicalUrl);
    }

    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement('link');
        canonical.setAttribute('rel', 'canonical');
        document.head.appendChild(canonical);
      }
      canonical.setAttribute('href', canonicalUrl);
    }

    if (imageUrl) {
      let ogImage = document.querySelector('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement('meta');
        ogImage.setAttribute('property', 'og:image');
        document.head.appendChild(ogImage);
      }
      ogImage.setAttribute('content', imageUrl);

      let twitterImage = document.querySelector('meta[property="twitter:image"]');
      if (!twitterImage) {
        twitterImage = document.createElement('meta');
        twitterImage.setAttribute('property', 'twitter:image');
        document.head.appendChild(twitterImage);
      }
      twitterImage.setAttribute('content', imageUrl);
    }

    // Update Twitter Tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);

    const twitterDesc = document.querySelector('meta[property="twitter:description"]');
    if (twitterDesc && description) twitterDesc.setAttribute('content', description);

    // Inject JSON-LD structured data
    let scriptJsonLd = document.getElementById('jsonld-seo') as HTMLScriptElement;
    if (structuredData) {
      if (!scriptJsonLd) {
        scriptJsonLd = document.createElement('script');
        scriptJsonLd.id = 'jsonld-seo';
        scriptJsonLd.type = 'application/ld+json';
        document.head.appendChild(scriptJsonLd);
      }
      scriptJsonLd.textContent = JSON.stringify(structuredData);
    } else if (scriptJsonLd) {
      scriptJsonLd.remove();
    }

    return () => {
      const existing = document.getElementById('jsonld-seo');
      if (existing) existing.remove();
    };

  }, [title, description, keywords, noindex, canonicalUrl, imageUrl, enabled, JSON.stringify(structuredData)]);
}
