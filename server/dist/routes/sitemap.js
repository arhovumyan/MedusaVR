import express from 'express';
const router = express.Router();
// Generate dynamic sitemap.xml
router.get('/sitemap.xml', async (req, res) => {
    try {
        // Set headers for XML content
        res.set('Content-Type', 'application/xml');
        res.set('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
        // Start XML document
        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
        // Static pages with priorities - including blog/guides
        const staticPages = [
            { url: '/', changefreq: 'daily', priority: 1.0 },
            { url: '/ForYouPage', changefreq: 'daily', priority: 0.9 },
            { url: '/search', changefreq: 'weekly', priority: 0.8 },
            { url: '/features', changefreq: 'monthly', priority: 0.7 },
            { url: '/creators', changefreq: 'weekly', priority: 0.6 },
            { url: '/legal', changefreq: 'monthly', priority: 0.5 },
            // Blog/Guides pages
            { url: '/guides', changefreq: 'weekly', priority: 0.8 },
            { url: '/guides/complete-guide-ai-character-creation', changefreq: 'monthly', priority: 0.7 },
            { url: '/guides/advanced-prompting-techniques-ai-conversations', changefreq: 'monthly', priority: 0.7 },
            { url: '/guides/nsfw-ai-content-ethics-safety-best-practices', changefreq: 'monthly', priority: 0.7 },
        ];
        const currentDate = new Date().toISOString().split('T')[0];
        // Add static pages
        staticPages.forEach(page => {
            sitemap += `
  <url>
    <loc>https://medusavr.art${page.url}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
        });
        // Add popular character example pages (static for now)
        const exampleCharacterIds = [1, 2, 3, 4, 5, 10, 15, 20, 25, 30];
        exampleCharacterIds.forEach(id => {
            sitemap += `
  <url>
    <loc>https://medusavr.art/characters/${id}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });
        // Add popular tags
        const popularTags = [
            'anime', 'fantasy', 'realistic', 'romance', 'adventure',
            'comedy', 'drama', 'action', 'mystery', 'horror', 'nsfw'
        ];
        popularTags.forEach(tag => {
            sitemap += `
  <url>
    <loc>https://medusavr.art/tags/${encodeURIComponent(tag)}</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
        });
        // Close XML document
        sitemap += `
</urlset>`;
        res.send(sitemap);
    }
    catch (error) {
        console.error('Error generating sitemap:', error);
        // Fallback to basic sitemap
        const basicSitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://medusavr.art/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`;
        res.set('Content-Type', 'application/xml');
        res.send(basicSitemap);
    }
});
export default router;
