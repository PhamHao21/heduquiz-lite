// src/lib/stores/auth.svelte.ts
import { supabase } from '$lib/supabase/client';
import type { User } from '@supabase/supabase-js';

let user    = $state<User | null>(null);
let loading = $state(true);

async function refreshUser() {
  const { data } = await supabase.auth.getUser();
  user    = data.user ?? null;
  loading = false;
}

if (typeof window !== 'undefined') {
  refreshUser();

  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_OUT') {
      user    = null;
      loading = false;
    } else {
      refreshUser();
    }
  });
}

export const authStore = {
  get user()     { return user; },
  get loading()  { return loading; },
  get isAuthed() { return user !== null; },

  async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` }
    });
    if (error) throw error;
  },

  async signOut() {
    await supabase.auth.signOut();
    user = null;
  }
};