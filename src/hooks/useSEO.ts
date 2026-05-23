import { useEffect } from 'react';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  noindex?: boolean;
}

export function useSEO({ title, description, keywords, noindex }: SEOProps) {
  useEffect(() => {
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

    // Update Twitter Tags
    const twitterTitle = document.querySelector('meta[property="twitter:title"]');
    if (twitterTitle) twitterTitle.setAttribute('content', title);

    const twitterDesc = document.querySelector('meta[property="twitter:description"]');
    if (twitterDesc && description) twitterDesc.setAttribute('content', description);

  }, [title, description, keywords, noindex]);
}
