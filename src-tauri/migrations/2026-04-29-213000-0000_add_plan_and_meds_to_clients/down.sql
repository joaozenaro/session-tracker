-- Remove plan and medications from clients (SQLite 3.35+)
ALTER TABLE clients DROP COLUMN plan;
ALTER TABLE clients DROP COLUMN medications;
