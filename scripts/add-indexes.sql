-- [Perbaikan Imam] - Tambahkan index untuk optimasi query
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON users(auth_id);
CREATE INDEX IF NOT EXISTS idx_user_divisions_user_id ON user_divisions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_divisions_division_name ON user_divisions(division_name);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
