const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const STATIC_URLS = [
  { loc: 'https://mahajobportal.in/', changefreq: 'daily', priority: '1.0' },
  { loc: 'https://mahajobportal.in/marathi-naukri.html', changefreq: 'daily', priority: '0.9' },
  { loc: 'https://mahajobportal.in/category/zp-bharti.html', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://mahajobportal.in/category/police-bharti.html', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://mahajobportal.in/category/talaathi-bharti.html', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://mahajobportal.in/category/jal-vibhag-bharti.html', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://mahajobportal.in/category/mpsc.html', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://mahajobportal.in/category/nhm-maharashtra.html', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://mahajobportal.in/category/gram-sevak-bharti.html', changefreq: 'daily', priority: '0.8' },
  { loc: 'https://mahajobportal.in/district/jalgaon-zp-bharti.html', changefreq: 'weekly', priority: '0.7' },
  { loc: 'https://mahajobportal.in/district/nashik-zp-bharti.html', changefreq: 'weekly', priority: '0.7' },
  { loc: 'https://mahajobportal.in/district/pune-zp-bharti.html', changefreq: 'weekly', priority: '0.7' },
  { loc: 'https://mahajobportal.in/district/aurangabad-zp-bharti.html', changefreq: 'weekly', priority: '0.7' },
  { loc: 'https://mahajobportal.in/district/nagpur-zp-bharti.html', changefreq: 'weekly', priority: '0.7' },
  { loc: 'https://mahajobportal.in/qualification/10th-pass-jobs.html', changefreq: 'daily', priority: '0.7' },
  { loc: 'https://mahajobportal.in/qualification/12th-pass-jobs.html', changefreq: 'daily', priority: '0.7' },
  { loc: 'https://mahajobportal.in/qualification/iti-diploma-jobs.html', changefreq: 'daily', priority: '0.7' },
  { loc: 'https://mahajobportal.in/qualification/graduate-jobs.html', changefreq: 'daily', priority: '0.7' },
  { loc: 'https://mahajobportal.in/about-us.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://mahajobportal.in/contact-us.html', changefreq: 'monthly', priority: '0.5' },
  { loc: 'https://mahajobportal.in/privacy-policy.html', changefreq: 'yearly', priority: '0.3' },
  { loc: 'https://mahajobportal.in/terms.html', changefreq: 'yearly', priority: '0.3' },
];

exports.handler = async () => {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, title, created_at, updated_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const jobUrls = (jobs || []).map(job => {
      const slug = (job.title || 'job')
        .toLowerCase()
        .replace(/[^a-z0-9\u0900-\u097F]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const lastmod = (job.updated_at || job.created_at || '').split('T')[0];
      return `  <url>
    <loc>https://mahajobportal.in/Jobs/${job.id}/${slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    const staticEntries = STATIC_URLS.map(u => `  <url>
    <loc>${u.loc}</loc>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticEntries.join('\n')}
${jobUrls.join('\n')}
</urlset>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600'
      },
      body: xml
    };
  } catch (err) {
    console.error('Sitemap error:', err);
    return { statusCode: 500, body: 'Sitemap generation failed' };
  }
};
