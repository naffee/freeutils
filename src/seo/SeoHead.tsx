import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { domainLabels, getRouteMeta, getToolDisplayName, isDomain, isKnownRoute } from './routeMeta';

const siteUrl = 'https://freeutils.xyz';
const ogImageUrl = `${siteUrl}/og-image.svg`;

function upsertMeta(name: string, content: string) {
  let element = document.head.querySelector(`meta[name="${name}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('name', name);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertPropertyMeta(property: string, content: string) {
  let element = document.head.querySelector(`meta[property="${property}"]`);

  if (!element) {
    element = document.createElement('meta');
    element.setAttribute('property', property);
    document.head.appendChild(element);
  }

  element.setAttribute('content', content);
}

function upsertCanonical(href: string) {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', 'canonical');
    document.head.appendChild(element);
  }

  element.setAttribute('href', href);
}

function upsertJsonLd(id: string, payload: Record<string, unknown> | Record<string, unknown>[]) {
  let element = document.head.querySelector(`script[data-seo-id="${id}"]`);

  if (!element) {
    element = document.createElement('script');
    element.setAttribute('type', 'application/ld+json');
    element.setAttribute('data-seo-id', id);
    document.head.appendChild(element);
  }

  element.textContent = JSON.stringify(payload);
}

function getStructuredData(pathname: string) {
  if (pathname === '/') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'freeutils',
      url: siteUrl,
      description: getRouteMeta(pathname).description,
    };
  }

  const [appSegment, domain, tool] = pathname.split('/').filter(Boolean);

  if (appSegment !== 'app' || !domain || !isDomain(domain)) {
    return null;
  }

  const categoryUrl = `${siteUrl}/app/${domain}`;
  const domainLabel = domainLabels[domain];

  if (!tool) {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: `${domainLabel} Tools`,
        url: categoryUrl,
        description: getRouteMeta(pathname).description,
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: 'Home',
            item: siteUrl,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: `${domainLabel} Tools`,
            item: categoryUrl,
          },
        ],
      },
    ];
  }

  const toolUrl = `${categoryUrl}/${tool}`;
  const toolName = getToolDisplayName(tool);

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: toolName,
      applicationCategory: `${domainLabel}Application`,
      operatingSystem: 'Web',
      isAccessibleForFree: true,
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      url: toolUrl,
      description: getRouteMeta(pathname).description,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: siteUrl,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `${domainLabel} Tools`,
          item: categoryUrl,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: toolName,
          item: toolUrl,
        },
      ],
    },
  ];
}

export function SeoHead() {
  const location = useLocation();

  useEffect(() => {
    const meta = getRouteMeta(location.pathname);
    const canonicalUrl = `${siteUrl}${location.pathname === '/' ? '/' : location.pathname.replace(/\/+$/, '')}`;
    const structuredData = getStructuredData(location.pathname);
    const shouldIndex = isKnownRoute(location.pathname);

    document.title = meta.title;
    upsertMeta('description', meta.description);
    upsertMeta('robots', shouldIndex ? 'index,follow' : 'noindex,nofollow');
    upsertMeta('twitter:card', 'summary_large_image');
    upsertMeta('twitter:title', meta.title);
    upsertMeta('twitter:description', meta.description);
    upsertMeta('twitter:image', ogImageUrl);
    upsertCanonical(canonicalUrl);
    upsertPropertyMeta('og:type', location.pathname === '/' ? 'website' : 'article');
    upsertPropertyMeta('og:site_name', 'freeutils');
    upsertPropertyMeta('og:title', meta.title);
    upsertPropertyMeta('og:description', meta.description);
    upsertPropertyMeta('og:url', canonicalUrl);
    upsertPropertyMeta('og:image', ogImageUrl);

    if (structuredData) {
      upsertJsonLd('route-structured-data', structuredData);
    }
  }, [location.pathname]);

  return null;
}
