# MedusaVR SEO Structured Data

## JSON-LD Schema for Enhanced Search Results

Add this to your `index.html` in the `<head>` section for rich search results:

```json
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "MedusaVR",
  "description": "AI-powered virtual reality experiences with interactive characters and immersive environments",
  "url": "https://medusavr.art",
  "applicationCategory": "EntertainmentApplication",
  "operatingSystem": "Any",
  "browserRequirements": "Requires JavaScript. Requires HTML5.",
  "offers": {
    "@type": "Offer",
    "category": "Free"
  },
  "author": {
    "@type": "Organization",
    "name": "MedusaVR",
    "url": "https://medusavr.art"
  },
  "provider": {
    "@type": "Organization",
    "name": "MedusaVR",
    "url": "https://medusavr.art"
  }
}
</script>
```

## Social Media Meta Tags Enhancement

Additional meta tags for better social sharing:

```html
<!-- Additional Social Meta -->
<meta property="og:locale" content="en_US" />
<meta property="article:author" content="MedusaVR" />
<meta name="twitter:site" content="@MedusaVR" />
<meta name="twitter:creator" content="@MedusaVR" />

<!-- Pinterest -->
<meta name="pinterest-rich-pin" content="true" />

<!-- LinkedIn -->
<meta property="og:site_name" content="MedusaVR" />
```

## Analytics & Tracking Setup

When ready, add these tracking codes:

### Google Analytics 4
```html
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

### Google Tag Manager
```html
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM_ID');</script>
<!-- End Google Tag Manager -->

<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM_ID"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
```
