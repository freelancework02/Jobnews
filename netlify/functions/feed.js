const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async () => {
  try {
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const escape = str => (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

    const items = (jobs || []).map(job => {
      const slug = (job.title || 'job')
        .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const url = `https://mahajobportal.in/Jobs/${job.id}/${slug}`;
      const pubDate = new Date(job.created_at || Date.now()).toUTCString();
      const lastDate = job.last_date
        ? new Date(job.last_date).toLocaleDateString('en-IN')
        : 'See notification';

      return `    <item>
      <title>${escape(job.title)} - ${escape(job.department)} Recruitment 2026</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[
        Department: ${job.department || 'N/A'}<br>
        Vacancy: ${job.vacancy || 'N/A'}<br>
        Last Date: ${lastDate}<br>
        Qualification: ${job.qualification || 'N/A'}<br>
        Location: ${job.location || 'Maharashtra'}<br><br>
        ${job.short_desc || ''}
      ]]></description>
      <category>Maharashtra Government Jobs</category>
      <author>admin@mahajobportal.in (MahaJobPortal)</author>
    </item>`;
    });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>MahaJobPortal - Latest Maharashtra Government Jobs 2026</title>
    <link>https://mahajobportal.in/</link>
    <description>Latest government job notifications from Maharashtra - ZP Bharti, Police, MPSC, NHM and more.</description>
    <language>mr-IN</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://mahajobportal.in/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://mahajobportal.in/weblogo.webp</url>
      <title>MahaJobPortal</title>
      <link>https://mahajobportal.in/</link>
    </image>
${items.join('\n')}
  </channel>
</rss>`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/rss+xml; charset=utf-8',
        'Cache-Control': 'public, max-age=1800'
      },
      body: xml
    };
  } catch (err) {
    return { statusCode: 500, body: 'Feed generation failed: ' + err.message };
  }
};
