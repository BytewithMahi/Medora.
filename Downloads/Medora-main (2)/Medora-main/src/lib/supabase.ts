import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bmssgrwemsmdbclbdhfq.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJtc3NncndlbXNtZGJjbGJkaGZxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMzc1NzMsImV4cCI6MjA4ODgxMzU3M30.ybUD3vxYWuUrCDWGmulTqD6VM8Goqhgk9zYCsgQvn-U';

export const supabase = createClient(supabaseUrl, supabaseKey);
