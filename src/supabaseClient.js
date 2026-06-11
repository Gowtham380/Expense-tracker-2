import { createClient } from '@supabase/supabase-js'

// .env ஃபைலில் இருந்து பாதுகாப்பாக URL மற்றும் Key-ஐ எடுக்கிறோம் 🛡️
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)