-- RPC Function to List Tables in Public Schema
-- 
-- This function queries the information_schema to get all tables in the public schema.
-- It returns table names along with basic metadata.
--
-- To install:
-- 1. Go to your Supabase dashboard
-- 2. Navigate to SQL Editor
-- 3. Paste this function
-- 4. Click "Run" to execute

CREATE OR REPLACE FUNCTION list_tables()
RETURNS TABLE (
  table_name text,
  table_schema text,
  table_type text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.table_name::text,
    t.table_schema::text,
    t.table_type::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public'
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
END;
$$;

-- Grant execute permission to authenticated users (or anon if using anon key)
-- Adjust based on your security requirements
GRANT EXECUTE ON FUNCTION list_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION list_tables() TO anon;

