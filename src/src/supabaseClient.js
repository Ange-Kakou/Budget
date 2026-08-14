import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://uinkrzcfdtqonhkvcxsb.supabase.co";
const supabaseAnonKey = "sb_publishable_I-y39f0P0gGyjp-9RllW6Q_Smjo3sJ2";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
