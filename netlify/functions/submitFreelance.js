const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase with Service Key (Admin Access)
// Using existing environment variables as seen in manageJobs.js
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    };

    // CORS Preflight
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: 'Method Not Allowed' };
    }

    try {
        const data = JSON.parse(event.body);

        // Validation
        if (!data.name || !data.email) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Name and Email are required.' })
            };
        }

        // Map form fields to table columns
        // Assuming table 'freelance_applications' or similar. 
        // I will use 'freelancers' as a generic safe bet, or 'freelance_applications' for specificity.
        // Let's go with 'freelance_applications' to be clear.
        const dbRecord = {
            name: data.name,
            email: data.email,
            message: data.text || data.message, // flexible mapping
            portfolio_url: data.portfolio_link,
            created_at: new Date().toISOString()
        };

        const { data: insertedData, error } = await supabase
            .from('freelance_applications')
            .insert([dbRecord])
            .select();

        if (error) {
            // Check if table doesn't exist or column mismatch
            console.error('Supabase Insert Error:', error);
            throw error;
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ message: 'Application submitted successfully!', data: insertedData })
        };

    } catch (err) {
        console.error('Function Error:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Failed to submit application. Please try again later.' })
        };
    }
};
