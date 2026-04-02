const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');

dotenv.config();

// Default placeholders so it boots without crashing if .env is missing
const supabaseUrl = process.env.SUPABASE_URL || 'https://example.supabase.co';
// Usually the service role key is used on the backend to bypass RLS, but for security, ensure .env is set properly.
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'fake-backend-key';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
