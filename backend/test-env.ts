
// Set environment variables directly for testing
process.env.SUPABASE_URL = 'https://esyardsjumxqwstdoaod.supabase.co';
process.env.SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzeWFyZHNqdW14cXdzdGRvYW9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQzMDg2NjQsImV4cCI6MjA2OTg4NDY2NH0.UB8PO1jD1ahbiMW43Ao5keVxChnOMSqohqminGZm7tg';
process.env.GOOGLE_MAPS_API_KEY = 'AIzaSyBUNUKncuC9GT6h4U-nDdjOea4-P7F_w4E';

console.log('SUPABASE_URL:', process.env.SUPABASE_URL);
console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
console.log('GOOGLE_MAPS_API_KEY:', process.env.GOOGLE_MAPS_API_KEY ? 'SET' : 'NOT SET'); 