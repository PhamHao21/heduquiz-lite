// src/app.d.ts
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>;
    }
    interface PageData {
      session: Session | null;
      recentQuizzes?: {
        id: string; title: string; subject: string | null;
        play_count: number; created_at: string;
      }[];
      topQuizzes?: {
        id: string; title: string; play_count: number;
        profiles: { username: string; display_name: string | null } | null;
      }[];
      userStats?: { totalQuizzes: number; totalAttempts: number };
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};
