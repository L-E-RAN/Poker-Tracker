import { supabase, TRIAL_DAYS } from './supabase';

// ---- Profiles (trial / subscription) ----

// Create the profile row on first login. Trial fields are forced server-side
// by a trigger, so values sent here are ignored — safe to call every login.
export async function ensureProfile(user) {
  const { error } = await supabase
    .from('poker_profiles')
    .insert({ user_id: user.id, email: user.email });
  // 23505 = unique_violation => row already exists, which is fine.
  if (error && error.code !== '23505') throw error;
}

export async function getProfile() {
  const { data, error } = await supabase
    .from('poker_profiles')
    .select('user_id, email, trial_started_at, sub_status, grow_subscription_id')
    .maybeSingle();
  if (error) throw error;
  return data;
}

// Mirror of DB poker_has_access() for UI gating. DB enforces the real gate.
export function computeAccess(profile) {
  if (!profile) return { allowed: false, reason: 'no_profile', daysLeft: 0 };
  if (profile.sub_status === 'active') {
    return { allowed: true, reason: 'subscribed', daysLeft: null };
  }
  if (profile.sub_status === 'trialing') {
    const start = new Date(profile.trial_started_at).getTime();
    const end = start + TRIAL_DAYS * 86400000;
    const daysLeft = Math.ceil((end - Date.now()) / 86400000);
    if (daysLeft > 0) return { allowed: true, reason: 'trial', daysLeft };
    return { allowed: false, reason: 'trial_expired', daysLeft: 0 };
  }
  return { allowed: false, reason: profile.sub_status, daysLeft: 0 };
}

// ---- Entries ----

export async function getEntries() {
  const { data, error } = await supabase
    .from('poker_entries')
    .select('id, date, type, amount')
    .order('date', { ascending: true });
  if (error) throw error;
  return (data || []).map(e => ({ ...e, amount: Number(e.amount) }));
}

export async function addEntry(user, entry) {
  const { data, error } = await supabase
    .from('poker_entries')
    .insert({
      user_id: user.id,
      date: entry.date,
      type: entry.type,
      amount: entry.amount,
    })
    .select('id, date, type, amount')
    .single();
  if (error) throw error;
  return { ...data, amount: Number(data.amount) };
}

export async function updateEntry(id, data) {
  const { error } = await supabase
    .from('poker_entries')
    .update({ date: data.date, type: data.type, amount: data.amount })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteEntry(id) {
  const { error } = await supabase.from('poker_entries').delete().eq('id', id);
  if (error) throw error;
}

// ---- Settings ----

export async function getSettings() {
  const { data, error } = await supabase
    .from('poker_settings')
    .select('monthly_goal, stop_loss')
    .maybeSingle();
  if (error) throw error;
  return {
    monthlyGoal: data?.monthly_goal ?? '',
    stopLoss: data?.stop_loss ?? '',
  };
}

export async function saveSettings(user, settings) {
  const toNum = v => (v === '' || v == null ? null : Number(v));
  const { error } = await supabase
    .from('poker_settings')
    .upsert({
      user_id: user.id,
      monthly_goal: toNum(settings.monthlyGoal),
      stop_loss: toNum(settings.stopLoss),
      updated_at: new Date().toISOString(),
    });
  if (error) throw error;
}
