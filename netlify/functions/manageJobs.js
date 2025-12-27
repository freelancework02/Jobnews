// netlify/functions/manageJobs.js
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with Service Key (Admin Access)
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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

            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({ message: 'Job Added', data })
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
        console.error('Supabase Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: err.message })
        };
    }
};
