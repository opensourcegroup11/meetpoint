export type Database = {
    public: {
      Tables: {
        users: {
          Row: {
            id: string;
            nickname: string;
            nickname_normalized: string;
            password_hash: string;
            lat: number | null;
            lng: number | null;
            location_updated_at: string | null;
            created_at: string;
          };
          Insert: {
            id?: string;
            nickname: string;
            nickname_normalized: string;
            password_hash: string;
            lat?: number | null;
            lng?: number | null;
            location_updated_at?: string | null;
            created_at?: string;
          };
          Update: {
            id?: string;
            nickname?: string;
            nickname_normalized?: string;
            password_hash?: string;
            lat?: number | null;
            lng?: number | null;
            location_updated_at?: string | null;
            created_at?: string;
          };
          Relationships: [];
        };
        friends: {
          Row: {
            id: string;
            user_id: string;
            friend_id: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            user_id: string;
            friend_id: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            user_id?: string;
            friend_id?: string;
            created_at?: string;
          };
          Relationships: [];
        };
        messages: {
          Row: {
            id: string;
            sender_id: string;
            receiver_id: string;
            content: string;
            created_at: string;
          };
          Insert: {
            id?: string;
            sender_id: string;
            receiver_id: string;
            content: string;
            created_at?: string;
          };
          Update: {
            id?: string;
            sender_id?: string;
            receiver_id?: string;
            content?: string;
            created_at?: string;
          };
          Relationships: [];
        };
      };
      Views: Record<string, never>;
      Functions: Record<string, never>;
      Enums: Record<string, never>;
      CompositeTypes: Record<string, never>;
    };
  };