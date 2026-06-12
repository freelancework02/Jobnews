const { createClient } = require('@supabase/supabase-js');
const dns = require('dns');

// Fix for Windows Node.js fetch failed errors
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

// Initialize Supabase with Service Key (Admin Access)
// We strip quotes just in case they were included in the .env file
const supabaseUrl = (process.env.SUPABASE_URL || '').replace(/['"]/g, '').trim();
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').replace(/['"]/g, '').trim();

if (!supabaseUrl || !supabaseKey) {
    console.error('CRITICAL: Missing Supabase Environment Variables');
} else {
    console.log('Connecting to Supabase URL:', supabaseUrl);
}

let supabase;
try {
    supabase = createClient(supabaseUrl, supabaseKey);
} catch (err) {
    console.error('Failed to initialize Supabase client:', err.message);
}

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
    };

    // CORS Preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (!supabase) {
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Supabase client not initialized. Check your credentials.' })
        };
    }

    try {
        // --- POST: Add Job ---
        if (event.httpMethod === 'POST') {
            const jobData = JSON.parse(event.body);

            // Insert into 'jobs' table
            const { data, error } = await supabase
                .from('jobs')
                .insert([jobData])
                .select();

            if (error) throw error;

            const slug = (data[0].title || 'job')
                .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            const seoUrl = `https://mahajobportal.in/Jobs/${data[0].id}/${slug}`;

            console.log('Job added. Dynamic sitemap will include:', seoUrl);

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    message: 'Job Added',
                    data,
                    seoUrl,
                    note: 'Dynamic sitemap at /sitemap-dynamic.xml will include this job automatically.'
                })
            };
        }

        // --- GET: List Jobs ---
        if (event.httpMethod === 'GET') {
            // Select all columns, order by created_at desc
            const { data, error } = await supabase
                .from('jobs')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify(data)
            };
        }

        // --- DELETE: Remove Job ---
        if (event.httpMethod === 'DELETE') {
            const { id } = JSON.parse(event.body);

            const { error } = await supabase
                .from('jobs')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Deleted' }) };
        }

        return { statusCode: 405, headers, body: 'Method Not Allowed' };

    } catch (err) {
        console.error('--- Supabase Function Error ---');
        console.error('Error Name:', err.name);
        console.error('Error Message:', err.message);
        console.error('Stack:', err.stack);
        
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ 
                error: 'Internal Server Error',
                details: err.message 
            })
        };
    }
};
