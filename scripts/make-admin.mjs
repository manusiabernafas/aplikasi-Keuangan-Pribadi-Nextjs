// Menjadikan akun sebagai super admin. Pakai: npm run make-admin -- email@contoh.com
import pg from "pg";

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Pakai: npm run make-admin -- email@contoh.com");
  process.exit(1);
}
const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const res = await client.query("update users set role = 'super_admin', updated_at = now() where lower(email) = $1 returning email", [email]);
console.log(res.rowCount ? `${res.rows[0].email} sekarang super admin.` : "Akun belum ada. Minta orangnya masuk dengan Google sekali dulu.");
await client.end();
