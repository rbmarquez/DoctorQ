-- Migration: Add password hash column and allow nullable Microsoft ID
ALTER TABLE tb_users
    ADD COLUMN IF NOT EXISTS nm_password_hash VARCHAR(255);

ALTER TABLE tb_users
    ALTER COLUMN nm_microsoft_id DROP NOT NULL;