-- ETL Cleaning Script: Hapus data NULL, duplikat, dan format tidak valid dari tabel users

-- Hapus user dengan kolom penting NULL
DELETE FROM users WHERE username IS NULL OR email IS NULL OR full_name IS NULL;

-- Hapus duplikat berdasarkan email (simpan yang paling baru)
DELETE FROM users
WHERE id NOT IN (
  SELECT MAX(id) FROM users GROUP BY email
);

-- Hapus data dengan email tidak valid
DELETE FROM users
WHERE email !~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$';

-- Hapus data dengan nomor telepon tidak valid (bukan digit 10-15)
DELETE FROM users
WHERE phone_number IS NOT NULL AND phone_number !~ '^[0-9]{10,15}$';