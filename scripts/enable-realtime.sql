-- Enable Realtime for messages and contacts tables
-- Run this script in your Supabase SQL editor if you haven't recreated the tables yet

-- Enable realtime on messages table (critical for real-time messaging)
alter publication supabase_realtime add table messages;

-- Enable realtime on contacts table (for live contact updates)
alter publication supabase_realtime add table contacts;

-- Verify realtime is enabled (optional - for checking)
-- You should see 'messages' and 'contacts' in the results
select schemaname, tablename 
from pg_publication_tables 
where pubname = 'supabase_realtime';

