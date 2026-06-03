export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

// Ecosystem and account category are user-defined (free-form) in beta —
// users type their own when adding sources, so these are open strings.
export type Ecosystem = string;
export type AccountCategory = string;

export type EventCategory =
  | "campaign"
  | "launch"
  | "partnership"
  | "migration"
  | "staking"
  | "gameplay"
  | "tournament"
  | "funding"
  | "metrics"
  | "token"
  | "nft"
  | "patch"
  | "leaderboard"
  | "other";

export type ContentFormat = "thread" | "infographic" | "guide" | "comparison" | "analysis" | "narrative" | "breakdown";
export type ContentPotential = "high" | "medium" | "low";
export type PipelineStatus = "idea" | "draft" | "preparing" | "review" | "published";

export type ActivityType =
  | "source_added"
  | "source_updated"
  | "tweet_collected"
  | "event_detected"
  | "event_clustered"
  | "summary_generated"
  | "idea_generated"
  | "pipeline_moved"
  | "system";

export interface Database {
  public: {
    Tables: {
      accounts: {
        Row: {
          id: string;
          user_id: string | null;
          username: string;
          display_name: string | null;
          ecosystem: Ecosystem | null;
          category: AccountCategory | null;
          priority: number;
          active: boolean;
          last_checked: string | null;
          created_at: string;
          notes: string | null;
          follower_count: number | null;
          avatar_url: string | null;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          username: string;
          display_name?: string | null;
          ecosystem?: Ecosystem | null;
          category?: AccountCategory | null;
          priority?: number;
          active?: boolean;
          last_checked?: string | null;
          created_at?: string;
          notes?: string | null;
          follower_count?: number | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          username?: string;
          display_name?: string | null;
          ecosystem?: Ecosystem | null;
          category?: AccountCategory | null;
          priority?: number;
          active?: boolean;
          last_checked?: string | null;
          created_at?: string;
          notes?: string | null;
          follower_count?: number | null;
          avatar_url?: string | null;
        };
      };
      tweets: {
        Row: {
          id: string;
          user_id: string | null;
          tweet_id: string;
          username: string | null;
          display_name: string | null;
          content: string | null;
          url: string | null;
          likes: number;
          reposts: number;
          replies: number;
          views: number;
          posted_at: string | null;
          fetched_at: string;
          processed: boolean;
          raw_data: Json | null;
        };
        Insert: {
          id?: string;
          tweet_id: string;
          username?: string | null;
          display_name?: string | null;
          content?: string | null;
          url?: string | null;
          likes?: number;
          reposts?: number;
          replies?: number;
          views?: number;
          posted_at?: string | null;
          fetched_at?: string;
          processed?: boolean;
          raw_data?: Json | null;
        };
        Update: Partial<Database["public"]["Tables"]["tweets"]["Insert"]>;
      };
      events: {
        Row: {
          id: string;
          user_id: string | null;
          title: string | null;
          summary: string | null;
          ecosystem: Ecosystem | null;
          category: EventCategory | null;
          importance_score: number | null;
          keywords: string[] | null;
          source_tweets: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title?: string | null;
          summary?: string | null;
          ecosystem?: Ecosystem | null;
          category?: EventCategory | null;
          importance_score?: number | null;
          keywords?: string[] | null;
          source_tweets?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["events"]["Insert"]>;
      };
      summaries: {
        Row: {
          id: string;
          user_id: string | null;
          timeframe: string | null;
          ecosystems: string[] | null;
          content: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          timeframe?: string | null;
          ecosystems?: string[] | null;
          content?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["summaries"]["Insert"]>;
      };
      content_ideas: {
        Row: {
          id: string;
          user_id: string | null;
          title: string | null;
          description: string | null;
          format: ContentFormat | null;
          angle: string | null;
          potential: ContentPotential | null;
          source_events: Json | null;
          status: PipelineStatus;
          created_at: string;
          notes: string | null;
          priority: number;
        };
        Insert: {
          id?: string;
          title?: string | null;
          description?: string | null;
          format?: ContentFormat | null;
          angle?: string | null;
          potential?: ContentPotential | null;
          source_events?: Json | null;
          status?: PipelineStatus;
          created_at?: string;
          notes?: string | null;
          priority?: number;
        };
        Update: Partial<Database["public"]["Tables"]["content_ideas"]["Insert"]>;
      };
      activities: {
        Row: {
          id: string;
          user_id: string | null;
          type: ActivityType | null;
          message: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          type?: ActivityType | null;
          message?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["activities"]["Insert"]>;
      };
      invites: {
        Row: {
          id: string;
          email: string;
          code: string;
          invited_by: string | null;
          used_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          code: string;
          invited_by?: string | null;
          used_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["invites"]["Insert"]>;
      };
    };
  };
}

export type Account = Database["public"]["Tables"]["accounts"]["Row"];
export type AccountInsert = Database["public"]["Tables"]["accounts"]["Insert"];
export type Tweet = Database["public"]["Tables"]["tweets"]["Row"];
export type Event = Database["public"]["Tables"]["events"]["Row"];
export type Summary = Database["public"]["Tables"]["summaries"]["Row"];
export type ContentIdea = Database["public"]["Tables"]["content_ideas"]["Row"];
export type Activity = Database["public"]["Tables"]["activities"]["Row"];
export type Invite = Database["public"]["Tables"]["invites"]["Row"];
