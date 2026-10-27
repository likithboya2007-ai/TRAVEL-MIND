// Script to run Supabase migrations
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  console.log('🔄 Running migration: 003_generated_attractions.sql...\n');
  
  try {
    // Read the migration file
    const migrationSQL = readFileSync('./migrations/003_generated_attractions.sql', 'utf-8');
    
    // Split by semicolons to execute statements individually
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      if (!stmt) continue;
      
      // Skip comments
      if (stmt.startsWith('--') || stmt.startsWith('COMMENT')) {
        continue;
      }
      
      console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
      
      // Use rpc to execute raw SQL (requires creating a function first)
      // Alternative: Use Supabase REST API directly
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: stmt + ';' })
      }).catch(err => ({ error: err }));
      
      if (response.error) {
        console.log(`⚠️  Statement ${i + 1} may need manual execution`);
      }
    }
    
    console.log('\n✅ Migration completed!');
    console.log('\n📊 Verifying table creation...');
    
    // Verify the table exists
    const { data, error } = await supabase
      .from('generated_attractions')
      .select('count')
      .limit(0);
    
    if (error) {
      if (error.message.includes('does not exist')) {
        console.log('\n❌ Table not created. Please run the migration manually in Supabase SQL Editor.');
        console.log('\n📋 Steps:');
        console.log('1. Open https://supabase.com/dashboard');
        console.log('2. Go to SQL Editor');
        console.log('3. Copy the contents of migrations/003_generated_attractions.sql');
        console.log('4. Paste and click "Run"');
      } else {
        console.log('\n⚠️  Verification error:', error.message);
      }
    } else {
      console.log('✅ Table "generated_attractions" verified successfully!');
      console.log('\n🎉 All set! Your AI attractions caching is now enabled.');
    }
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n💡 Please run the migration manually:');
    console.log('1. Open Supabase Dashboard → SQL Editor');
    console.log('2. Copy contents of migrations/003_generated_attractions.sql');
    console.log('3. Paste and click "Run"');
    process.exit(1);
  }
}

runMigration();
