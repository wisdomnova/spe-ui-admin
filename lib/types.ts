/* ──────────────────────────────────────────────────
   Supabase Database Types - Generated from schema
   ────────────────────────────────────────────────── */

export type Database = {
  public: {
    Tables: {
      team_members: {
        Row: TeamMember;
        Insert: Omit<TeamMember, "id" | "created_at">;
        Update: Partial<Omit<TeamMember, "id" | "created_at">>;
        Relationships: [];
      };
      blog_posts: {
        Row: BlogPost;
        Insert: Omit<BlogPost, "id" | "created_at">;
        Update: Partial<Omit<BlogPost, "id" | "created_at">>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: Omit<Event, "id" | "created_at">;
        Update: Partial<Omit<Event, "id" | "created_at">>;
        Relationships: [];
      };
      media_files: {
        Row: MediaFile;
        Insert: Omit<MediaFile, "id" | "created_at">;
        Update: Partial<Omit<MediaFile, "id" | "created_at">>;
        Relationships: [];
      };
      spotlights: {
        Row: Spotlight;
        Insert: Omit<Spotlight, "id" | "created_at">;
        Update: Partial<Omit<Spotlight, "id" | "created_at">>;
        Relationships: [];
      };
      submissions: {
        Row: Submission;
        Insert: Omit<Submission, "id" | "created_at">;
        Update: Partial<Omit<Submission, "id" | "created_at">>;
        Relationships: [];
      };
      admin_users: {
        Row: AdminUser;
        Insert: Omit<AdminUser, "id" | "created_at">;
        Update: Partial<Omit<AdminUser, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
};

/* ── Row types ─────────────────────────────────── */

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  linkedin: string | null;
  twitter: string | null;
  image_url: string | null;
  created_at: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  category: string;
  description: string;
  /** Raw HTML from TipTap - stored and retrieved byte-for-byte */
  content: string;
  cover_image_url: string | null;
  author: string;
  status: "Published" | "Draft";
  read_time: string;
  created_at: string;
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  image_url: string | null;
  youtube_url: string | null;
  status: "Upcoming" | "Draft" | "Completed";
  description: string;
  created_at: string;
}

export interface MediaFile {
  id: string;
  name: string;
  url: string;
  size: string;
  type: string;
  tags: string[];
  file_group: string;
  created_at: string;
}

export interface Spotlight {
  id: string;
  team_member_id: string;
  tags: string[];
  created_at: string;
  /** Joined from team_members - not in the DB column itself */
  team_member?: TeamMember;
}

export interface Submission {
  id: string;
  email: string;
  status: "New" | "Read";
  created_at: string;
}

export interface AdminUser {
  id: string;
  email: string;
  password_hash: string;
  role: "admin" | "programs" | "editorial" | "dni" | "overall" | "partnership" | "electoral";
  created_at: string;
}
