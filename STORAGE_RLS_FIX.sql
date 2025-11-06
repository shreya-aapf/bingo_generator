-- Fix Storage RLS Policies for Bingo Cards Upload
-- Run this in Supabase SQL Editor

-- 1. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 2. Create policy for INSERT operations (uploading new files)
-- This allows anyone to upload to the bingo_cards bucket
CREATE POLICY "Allow uploads to bingo_cards bucket" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'bingo_cards');

-- 3. Create policy for SELECT operations (reading/downloading files)
-- This allows anyone to read files from the bingo_cards bucket
CREATE POLICY "Allow downloads from bingo_cards bucket" ON storage.objects
FOR SELECT USING (bucket_id = 'bingo_cards');

-- 4. Create policy for UPDATE operations (if needed for upserting)
-- This allows updates to files in the bingo_cards bucket
CREATE POLICY "Allow updates to bingo_cards bucket" ON storage.objects
FOR UPDATE USING (bucket_id = 'bingo_cards');

-- 5. Create policy for DELETE operations (optional - for admin cleanup)
-- This allows deletion of files from the bingo_cards bucket
CREATE POLICY "Allow deletes from bingo_cards bucket" ON storage.objects
FOR DELETE USING (bucket_id = 'bingo_cards');

-- 6. Verify the bucket exists and is public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'bingo_cards';

-- 7. Check current policies (for debugging)
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';
