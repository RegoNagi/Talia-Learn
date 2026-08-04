import { createClient } from '@supabase/supabase-js';

// نفس قاعدة بيانات Talia 360 بالظبط — مصدر بيانات واحد للمشروعين
const SUPABASE_URL = 'https://ihomapsgjttlmljoysds.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlob21hcHNnanR0bG1sam95c2RzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU2NTcwMzQsImV4cCI6MjEwMTIzMzAzNH0.HwVsY1GMCeJNMvhmnTas1V_iJ_sqLGhHIOnY4p-gfz8';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
