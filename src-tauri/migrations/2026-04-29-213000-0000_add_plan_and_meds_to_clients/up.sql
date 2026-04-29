-- Add plan and medications to clients
ALTER TABLE clients ADD COLUMN plan TEXT NOT NULL DEFAULT '';
ALTER TABLE clients ADD COLUMN medications TEXT NOT NULL DEFAULT '';
