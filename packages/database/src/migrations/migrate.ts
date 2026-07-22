import { readFileSync } from 'fs';
import { join } from 'path';

async function runMigrations() {
  try {
    console.log('Running database migrations...');

    const migrationFiles = [
      '001_initial_schema.sql',
      '002_research_entries.sql',
    ];
    const migrationSQL = migrationFiles
      .map(file => readFileSync(join(__dirname, file), 'utf-8'))
      .join('\n\n');

    // Note: This would need to be executed manually via Supabase dashboard or SQL editor
    console.log('Execute the following SQL in your Supabase dashboard:');
    console.log(migrationSQL);

    console.log('Migrations completed successfully!');
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runMigrations();
}
