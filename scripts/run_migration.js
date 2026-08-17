const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const client = new Client({
  connectionString: 'postgresql://postgres.yduhtnmktudiyjjftjnw:vZbtfPmKWtqheDTX@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    await client.connect();
    console.log('Connected to Supabase DB.');
    const sql = fs.readFileSync(path.join(__dirname, 'init_schema.sql'), 'utf8');
    await client.query(sql);
    console.log('Schema migration applied successfully.');

    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Created tables in public schema:');
    console.table(res.rows);
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
