import pg from 'pg';

async function test() {
  console.log("Testing connection pooler...");
  // Try transaction pooler
  const connStr = "postgres://postgres.taypewrtpqsxugafmetw:OLW7vxuju1ZY868F@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres";
  const client = new pg.Client({
    connectionString: connStr,
    ssl: { rejectUnauthorized: false }
  });
  
  try {
    await client.connect();
    console.log("Connected successfully!");
    const res = await client.query("SELECT NOW()");
    console.log("Result:", res.rows[0]);
  } catch (err) {
    console.error("Connection failed:", err.message);
  } finally {
    await client.end();
  }
}

test();
