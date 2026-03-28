import { createClient } from '@supabase/supabase-js'

// இங்க உங்க Supabase URL மற்றும் Anon Key-ஐ போடணும்
const supabaseUrl = 'https://seddhkayqkndvzlrchmr.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlZGRoa2F5cWtuZHZ6bHJjaG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0MTk3NjYsImV4cCI6MjA4OTk5NTc2Nn0.jaFDc91WNdoWhdi0LzPS5K0rImKpOSBrhESRQ91Wm0k'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)