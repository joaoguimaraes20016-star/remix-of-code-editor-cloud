-- Enable real-time updates for sales table
ALTER TABLE sales REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE sales;