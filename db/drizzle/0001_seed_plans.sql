ALTER TABLE "users" ADD CONSTRAINT "users_active_book_fk" FOREIGN KEY ("active_book_id") REFERENCES "books"("id") ON DELETE SET NULL;
--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_pending_email_uq" ON "invitations" ("book_id", lower("email")) WHERE "status" = 'pending';
--> statement-breakpoint
INSERT INTO "plans" ("code", "name", "description", "price", "period_days", "features") VALUES
  ('free', 'Gratis', 'Untuk mulai rapi mencatat keuangan pribadi.', 0, 0,
   '{"maxWallets":2,"maxGoals":1,"maxCategories":20,"partner":false,"bills":false,"export":false,"fullReports":false}'),
  ('premium', 'Premium', 'Semua fitur, termasuk kelola keuangan bersama pasangan.', 29000, 30,
   '{"maxWallets":null,"maxGoals":null,"maxCategories":null,"partner":true,"bills":true,"export":true,"fullReports":true}')
ON CONFLICT ("code") DO NOTHING;
