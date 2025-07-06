import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: string;
  schemaData?: object;
  noIndex?: boolean;
}

export default function SEOHead({
  title,
  description,
  keywords = "free WordPress hosting, WordPress plugins, premium plugins, free hosting, web hosting, WordPress, hosting services, subdomain hosting",
  canonical,
  ogImage = "/og-default.jpg",
  ogType = "website",
  schemaData,
  noIndex = false
}: SEOHeadProps) {
  useEffect(() => {
    // Set document title
    document.title = title;

    // Create or update meta tags
    const updateOrCreateMeta = (property: string, content: string, isProperty = false) => {
      const selector = isProperty ? `meta[property="${property}"]` : `meta[name="${property}"]`;
      let meta = document.querySelector(selector) as HTMLMetaElement;
      
      if (!meta) {
        meta = document.createElement('meta');
        if (isProperty) {
          meta.setAttribute('property', property);
        } else {
          meta.setAttribute('name', property);
        }
        document.head.appendChild(meta);
      }
      meta.setAttribute('content', content);
    };

    // Basic meta tags
    updateOrCreateMeta('description', description);
    updateOrCreateMeta('keywords', keywords);
    updateOrCreateMeta('robots', noIndex ? 'noindex, nofollow' : 'index, follow');
    updateOrCreateMeta('viewport', 'width=device-width, initial-scale=1.0');
    updateOrCreateMeta('author', 'HostFarm.org - Free WordPress Hosting & Premium Plugins');

    // Open Graph meta tags
    updateOrCreateMeta('og:title', title, true);
    updateOrCreateMeta('og:description', description, true);
    updateOrCreateMeta('og:type', ogType, true);
    updateOrCreateMeta('og:image', ogImage, true);
    updateOrCreateMeta('og:site_name', 'HostFarm.org', true);
    updateOrCreateMeta('og:locale', 'en_US', true);

    // Twitter Card meta tags
    updateOrCreateMeta('twitter:card', 'summary_large_image');
    updateOrCreateMeta('twitter:title', title);
    updateOrCreateMeta('twitter:description', description);
    updateOrCreateMeta('twitter:image', ogImage);

    // Canonical URL
    if (canonical) {
      let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
      if (!canonicalLink) {
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
      }
      canonicalLink.setAttribute('href', canonical);
    }

    // Schema.org structured data
    if (schemaData) {
      let schemaScript = document.querySelector('script[type="application/ld+json"]');
      if (!schemaScript) {
        schemaScript = document.createElement('script');
        schemaScript.setAttribute('type', 'application/ld+json');
        document.head.appendChild(schemaScript);
      }
      schemaScript.textContent = JSON.stringify(schemaData);
    }

    // Additional SEO meta tags
    updateOrCreateMeta('theme-color', '#3b82f6');
    updateOrCreateMeta('msapplication-TileColor', '#3b82f6');
    updateOrCreateMeta('generator', 'HostFarm.org - Premium WordPress Platform');

    // Mobile optimization
    updateOrCreateMeta('mobile-web-app-capable', 'yes');
    updateOrCreateMeta('apple-mobile-web-app-capable', 'yes');
    updateOrCreateMeta('apple-mobile-web-app-status-bar-style', 'default');
    updateOrCreateMeta('apple-mobile-web-app-title', 'HostFarm.org');

  }, [title, description, keywords, canonical, ogImage, ogType, schemaData, noIndex]);

  return null;
}

// Utility function to generate schema data for different page types
export const generateSchemaData = {
  organization: () => ({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "HostFarm.org",
    "description": "Free WordPress hosting and premium plugin library platform",
    "url": "https://hostfarm.org",
    "logo": "https://hostfarm.org/logo.png",
    "sameAs": [
      "https://twitter.com/hostfarm",
      "https://facebook.com/hostfarm"
    ],
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "+1-800-HOSTFARM",
      "contactType": "customer service",
      "email": "support@hostfarm.org"
    },
    "address": {
      "@type": "PostalAddress",
      "addressCountry": "US"
    }
  }),

  webHostingService: () => ({
    "@context": "https://schema.org",
    "@type": "Service",
    "name": "Free WordPress Hosting",
    "description": "Professional WordPress hosting with SSL certificates, daily backups, and 99.9% uptime guarantee - completely free",
    "provider": {
      "@type": "Organization",
      "name": "HostFarm.org"
    },
    "serviceType": "Web Hosting",
    "areaServed": "Worldwide",
    "hasOfferCatalog": {
      "@type": "OfferCatalog",
      "name": "WordPress Hosting Plans",
      "itemListElement": [
        {
          "@type": "Offer",
          "itemOffered": {
            "@type": "Service",
            "name": "Free WordPress Hosting",
            "description": "Free WordPress hosting with SSL, backups, and premium plugins"
          },
          "price": "0",
          "priceCurrency": "USD"
        }
      ]
    }
  }),

  softwareApplication: (pluginName: string, description: string) => ({
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": pluginName,
    "description": description,
    "applicationCategory": "WordPress Plugin",
    "operatingSystem": "WordPress",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "downloadUrl": `https://hostfarm.org/plugins/${pluginName.toLowerCase().replace(/\s+/g, '-')}`
  }),

  breadcrumb: (items: Array<{name: string, url: string}>) => ({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  })
};