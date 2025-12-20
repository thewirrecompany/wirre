import { supabase } from "./supabase";

export type WaitlistRole = "candidate" | "company";

export async function addToWaitlist(email: string, role: WaitlistRole) {
  const { data, error } = await supabase.from("waitlist").insert([{ email, role }]);
  return { data, error };
}
