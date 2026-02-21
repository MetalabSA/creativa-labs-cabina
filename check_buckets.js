const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) console.error(error);
  else console.log('Buckets:', buckets.map(b => b.name));

  if (!buckets.find(b => b.name === 'user_photos')) {
    console.log('Creating user_photos bucket...');
    await supabase.storage.createBucket('user_photos', { public: true });
  }
}
run();
