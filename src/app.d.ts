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
      profile: {
        id: string;
        username: string;
        display_name: string | null;
        avatar_url: string | null;
      } | null;
      /** số thông báo chưa đọc */
      unread?: number;
    }
    // interface Error {}
    // interface Platform {}
  }
}

export {};
