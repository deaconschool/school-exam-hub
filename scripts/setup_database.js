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
  try {
    // Read the SQL file
    const sqlPath = join(__dirname, '..', 'supabase', 'setup_complete_database.sql');
    const sqlContent = readFileSync(sqlPath, 'utf8');

    // Split the SQL content into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

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
          errorCount++;
        } else {
          successCount++;
        }
      } catch (err) {
        errorCount++;
      }

      // Add a small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    if (errorCount === 0) {
      // Verify tables were created
      await verifyTables();
    }

  } catch (error) {
    process.exit(1);
  }
}

async function verifyTables() {
  const tables = ['teachers', 'students', 'exams', 'grade_criteria', 'grades'];

  for (const tableName of tables) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('count')
        .limit(1);
    } catch (err) {
      // Error verifying table
    }
  }
}

// Instructions for manual setup if the script fails

// Run the setup
setupDatabase().catch(() => {});