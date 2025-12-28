require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 1. Check for Environment Variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('--- Supabase Connection Test ---');

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Error: Missing configuration.');
    console.error('Please make sure you have a .env file with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
}

console.log('Context:');
console.log(`- URL: ${supabaseUrl}`);
console.log(`- Key: ${supabaseKey ? 'Loaded (Hidden)' : 'Missing'}`);

// 2. Initialize Client
const supabase = createClient(supabaseUrl, supabaseKey);

// 3. Run Test Query
async function testConnection() {
    try {
        console.log('\nAttempting to fetch data from "jobs" table...');
        
        // Fetch 1 row just to test auth and existence
        const { data, error } = await supabase
            .from('jobs')
            .select('*')
            .limit(1);

        if (error) {
            throw error;
        }

        console.log('✅ Connection Successful!');
        console.log(`- Query executed without error.`);
        console.log(`- Rows returned: ${data.length}`);
        if(data.length > 0) {
            console.log('- Sample Data:', JSON.stringify(data[0], null, 2));
        } else {
            console.log('- Table is empty, but connection works.');
        }

    } catch (err) {
        console.error('❌ Connection Failed.');
        console.error('Error Details:', err.message);
        if (err.code) console.error('Error Code:', err.code);
        if (err.hint) console.error('Hint:', err.hint);
    }
}

testConnection();
