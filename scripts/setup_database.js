#!/usr/bin/env node

/**
 * Database Setup Script for School Examination Portal
 * This script helps you set up the Supabase database with all required tables
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables (you might need to install dotenv)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qhhqygidoqbnqhhggunu.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupDatabase() {
  console.log('🚀 Starting database setup for School Examination Portal...');
  console.log(`📡 Connecting to Supabase: ${supabaseUrl}`);

  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '..', 'supabase', 'setup_complete_database.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL file loaded successfully');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];

      try {
        // Skip comments and empty statements
        if (statement.startsWith('--') || statement.trim() === '') {
          continue;
        }

        const { error } = await supabase.rpc('exec_sql', { query: statement });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error(`📄 Statement: ${statement.substring(0, 100)}...`);
          errorCount++;
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        errorCount++;
      }

      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Database Setup Summary:');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);

    if (errorCount === 0) {
      console.log('🎉 Database setup completed successfully!');

      // Verify tables were created
      await verifyTables();
    } else {
      console.log('⚠️ Database setup completed with some errors. Please check the logs above.');
    }

  } catch (error) {
    console.error('💥 Fatal error during database setup:', error);
    process.exit(1);
  }
}

async function verifyTables() {
  console.log('\n🔍 Verifying tables were created...');

  const tables = ['teachers', 'students', 'exams', 'grade_criteria', 'grades'];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);

      if (error) {
        console.error(`❌ Table ${tableName}: ${error.message}`);
      } else {
        console.log(`✅ Table ${tableName}: OK`);
      }
    } catch (err) {
      console.error(`❌ Table ${tableName}: ${err.message}`);
    }
  }
}

// Instructions for manual setup if the script fails
console.log(`
📋 MANUAL SETUP INSTRUCTIONS:
If this script doesn't work, please follow these steps:

1. Go to your Supabase project dashboard: https://qhhqygidoqbnqhhggunu.supabase.co
2. Navigate to the SQL Editor
3. Copy and paste the entire contents of: supabase/setup_complete_database.sql
4. Click "Run" to execute all the SQL statements
5. Verify that all tables were created in the Table Editor

🔑 IMPORTANT:
- Use the Service Role Key for admin operations
- Make sure your environment variables are correctly set
- The service role key should start with 'eyJ...' and be quite long
`);

// Run the setup
setupDatabase().catch(console.error);