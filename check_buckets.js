import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Bucket Error:', error);
  } else {
    buckets.forEach(b => console.log('Bucket:', b.name, 'Public:', b.public));
  }
}
run();
