
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env from TulBoxClient
const envFile = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
    }
});

const supabaseUrl = env.EXPO_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const supabaseKey = env.EXPO_PUBLIC_SUPABASE_ANON_KEY || env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- Client DB Check ---');
    const { data: leads, error } = await supabase.from('leads').select('*').limit(5);
    if (error) console.error('Error leads:', error);
    else console.log('Leads found in TulBoxClient/leads:', leads.length);

    const { data: jobs, error: jobsErr } = await supabase.from('jobs').select('*').limit(5);
    if (jobsErr) console.error('Error jobs:', jobsErr);
    else console.log('Jobs found in TulBoxClient/jobs:', jobs.length);
}

check();
