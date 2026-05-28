import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://qvtgxpikywhrfrkyehib.supabase.co"

const supabaseKey = "sb_publishable_zdhAS5nf6SXPMj0BGeK4nw_bel1sqGs"

export const supabase = createClient(supabaseUrl, supabaseKey)