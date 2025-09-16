export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_analytics: {
        Row: {
          created_at: string | null
          date_recorded: string | null
          id: string
          metric_name: string
          metric_value: Json
        }
        Insert: {
          created_at?: string | null
          date_recorded?: string | null
          id?: string
          metric_name: string
          metric_value: Json
        }
        Update: {
          created_at?: string | null
          date_recorded?: string | null
          id?: string
          metric_name?: string
          metric_value?: Json
        }
        Relationships: []
      }
      admins: {
        Row: {
          created_at: string | null
          email: string
          full_name: string
          id: string
          password_hash: string
          role: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name: string
          id?: string
          password_hash: string
          role: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string
          id?: string
          password_hash?: string
          role?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      chatbot_conversations: {
        Row: {
          conversation_data: Json
          created_at: string | null
          id: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          conversation_data: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          conversation_data?: Json
          created_at?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chatbot_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_recipes: {
        Row: {
          added_at: string | null
          collection_id: string | null
          id: string
          recipe_id: string | null
        }
        Insert: {
          added_at?: string | null
          collection_id?: string | null
          id?: string
          recipe_id?: string | null
        }
        Update: {
          added_at?: string | null
          collection_id?: string | null
          id?: string
          recipe_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "collection_recipes_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "recipe_collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      communities: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "communities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_members: {
        Row: {
          community_id: string | null
          id: string
          joined_at: string | null
          role: string | null
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          id?: string
          joined_at?: string | null
          role?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_members_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_attachments: {
        Row: {
          created_at: string | null
          file_type: string | null
          file_url: string
          id: string
          post_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_type?: string | null
          file_url: string
          id?: string
          post_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_type?: string | null
          file_url?: string
          id?: string
          post_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_post_attachments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          post_id: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          post_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_post_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_post_reactions: {
        Row: {
          created_at: string | null
          id: string
          post_id: string | null
          reaction_type: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string | null
          reaction_type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_post_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "community_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_post_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          community_id: string | null
          content: string | null
          created_at: string | null
          id: string
          image_url: string | null
          recipe_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          community_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          recipe_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          community_id?: string | null
          content?: string | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          recipe_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_posts_community_id_fkey"
            columns: ["community_id"]
            isOneToOne: false
            referencedRelation: "communities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contextual_factors: {
        Row: {
          active_from: string | null
          active_until: string | null
          boost_cuisines: string[] | null
          boost_ingredients: string[] | null
          boost_recipes: string[] | null
          created_at: string | null
          factor_key: string
          factor_type: string
          id: string
          is_active: boolean | null
          multiplier: number | null
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          boost_cuisines?: string[] | null
          boost_ingredients?: string[] | null
          boost_recipes?: string[] | null
          created_at?: string | null
          factor_key: string
          factor_type: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          boost_cuisines?: string[] | null
          boost_ingredients?: string[] | null
          boost_recipes?: string[] | null
          created_at?: string | null
          factor_key?: string
          factor_type?: string
          id?: string
          is_active?: boolean | null
          multiplier?: number | null
        }
        Relationships: []
      }
      cuisines: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          image_url: string | null
          is_kenyan_local: boolean | null
          name: string
          origin_country: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_kenyan_local?: boolean | null
          name: string
          origin_country?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          is_kenyan_local?: boolean | null
          name?: string
          origin_country?: string | null
        }
        Relationships: []
      }
      ingredient_prices: {
        Row: {
          currency: string | null
          id: string
          ingredient_id: string | null
          is_available: boolean | null
          last_updated: string | null
          price: number | null
          quantity: number | null
          supermarket_id: string | null
          unit: Database["public"]["Enums"]["measurement_unit"] | null
        }
        Insert: {
          currency?: string | null
          id?: string
          ingredient_id?: string | null
          is_available?: boolean | null
          last_updated?: string | null
          price?: number | null
          quantity?: number | null
          supermarket_id?: string | null
          unit?: Database["public"]["Enums"]["measurement_unit"] | null
        }
        Update: {
          currency?: string | null
          id?: string
          ingredient_id?: string | null
          is_available?: boolean | null
          last_updated?: string | null
          price?: number | null
          quantity?: number | null
          supermarket_id?: string | null
          unit?: Database["public"]["Enums"]["measurement_unit"] | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_prices_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_prices_supermarket_id_fkey"
            columns: ["supermarket_id"]
            isOneToOne: false
            referencedRelation: "supermarkets"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          calories_per_100g: number | null
          category: string | null
          common_unit: Database["public"]["Enums"]["measurement_unit"] | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          nutritional_info: Json | null
        }
        Insert: {
          calories_per_100g?: number | null
          category?: string | null
          common_unit?: Database["public"]["Enums"]["measurement_unit"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          nutritional_info?: Json | null
        }
        Update: {
          calories_per_100g?: number | null
          category?: string | null
          common_unit?: Database["public"]["Enums"]["measurement_unit"] | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          nutritional_info?: Json | null
        }
        Relationships: []
      }
      knowledge_base: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_active: boolean | null
          question: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          answer: string
          category: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          question: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          question?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      meal_plan_comments: {
        Row: {
          comment: string
          created_at: string
          id: string
          user_id: string
          weekly_meal_plan_id: string
        }
        Insert: {
          comment: string
          created_at?: string
          id?: string
          user_id: string
          weekly_meal_plan_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          user_id?: string
          weekly_meal_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_comments_weekly_meal_plan_id_fkey"
            columns: ["weekly_meal_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_feedback: {
        Row: {
          completion_rate: number | null
          created_at: string | null
          feedback_tags: string[] | null
          feedback_text: string | null
          id: string
          meal_plan_id: string | null
          recipe_id: string | null
          satisfaction_score: number | null
          user_id: string
          would_recommend: boolean | null
        }
        Insert: {
          completion_rate?: number | null
          created_at?: string | null
          feedback_tags?: string[] | null
          feedback_text?: string | null
          id?: string
          meal_plan_id?: string | null
          recipe_id?: string | null
          satisfaction_score?: number | null
          user_id: string
          would_recommend?: boolean | null
        }
        Update: {
          completion_rate?: number | null
          created_at?: string | null
          feedback_tags?: string[] | null
          feedback_text?: string | null
          id?: string
          meal_plan_id?: string | null
          recipe_id?: string | null
          satisfaction_score?: number | null
          user_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_feedback_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_feedback_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plan_recipes: {
        Row: {
          id: string
          meal_date: string | null
          meal_plan_id: string | null
          meal_type: string | null
          recipe_id: string | null
          servings: number | null
        }
        Insert: {
          id?: string
          meal_date?: string | null
          meal_plan_id?: string | null
          meal_type?: string | null
          recipe_id?: string | null
          servings?: number | null
        }
        Update: {
          id?: string
          meal_date?: string | null
          meal_plan_id?: string | null
          meal_type?: string | null
          recipe_id?: string | null
          servings?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_recipes_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_planning_constraints: {
        Row: {
          constraint_type: string
          constraint_value: Json
          created_at: string | null
          id: string
          is_hard_constraint: boolean | null
          priority: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          constraint_type: string
          constraint_value: Json
          created_at?: string | null
          id?: string
          is_hard_constraint?: boolean | null
          priority?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          constraint_type?: string
          constraint_value?: Json
          created_at?: string | null
          id?: string
          is_hard_constraint?: boolean | null
          priority?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      meal_plans: {
        Row: {
          created_at: string
          day: string
          id: string
          meal_type: string
          recipe_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          day: string
          id?: string
          meal_type: string
          recipe_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          day?: string
          id?: string
          meal_type?: string
          recipe_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_meal_plans_recipe"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          template_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          template_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          template_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cooking_skill_level:
            | Database["public"]["Enums"]["recipe_difficulty"]
            | null
          created_at: string | null
          dietary_restrictions:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          full_name: string | null
          gender: string | null
          id: string
          location: string | null
          preferred_cuisines: string[] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cooking_skill_level?:
            | Database["public"]["Enums"]["recipe_difficulty"]
            | null
          created_at?: string | null
          dietary_restrictions?:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          full_name?: string | null
          gender?: string | null
          id: string
          location?: string | null
          preferred_cuisines?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cooking_skill_level?:
            | Database["public"]["Enums"]["recipe_difficulty"]
            | null
          created_at?: string | null
          dietary_restrictions?:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          full_name?: string | null
          gender?: string | null
          id?: string
          location?: string | null
          preferred_cuisines?: string[] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      recipe_analytics: {
        Row: {
          action_data: Json | null
          action_type: string
          created_at: string
          id: string
          recipe_id: string | null
          user_id: string | null
        }
        Insert: {
          action_data?: Json | null
          action_type: string
          created_at?: string
          id?: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Update: {
          action_data?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_analytics_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      recipe_collections: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_public: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_embeddings: {
        Row: {
          embedding_model: string | null
          embedding_vector: number[]
          id: string
          last_updated: string | null
          recipe_id: string
        }
        Insert: {
          embedding_model?: string | null
          embedding_vector: number[]
          id?: string
          last_updated?: string | null
          recipe_id: string
        }
        Update: {
          embedding_model?: string | null
          embedding_vector?: number[]
          id?: string
          last_updated?: string | null
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_embeddings_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: true
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_ingredients: {
        Row: {
          display_order: number | null
          id: string
          ingredient_id: string | null
          is_optional: boolean | null
          preparation_note: string | null
          quantity: number
          recipe_id: string | null
          unit: Database["public"]["Enums"]["measurement_unit"]
        }
        Insert: {
          display_order?: number | null
          id?: string
          ingredient_id?: string | null
          is_optional?: boolean | null
          preparation_note?: string | null
          quantity: number
          recipe_id?: string | null
          unit: Database["public"]["Enums"]["measurement_unit"]
        }
        Update: {
          display_order?: number | null
          id?: string
          ingredient_id?: string | null
          is_optional?: boolean | null
          preparation_note?: string | null
          quantity?: number
          recipe_id?: string | null
          unit?: Database["public"]["Enums"]["measurement_unit"]
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_data: Json | null
          interaction_type: string
          recipe_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_data?: Json | null
          interaction_type?: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_interactions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_reviews: {
        Row: {
          comment: string | null
          cooking_time_actual: number | null
          created_at: string | null
          difficulty_actual:
            | Database["public"]["Enums"]["recipe_difficulty"]
            | null
          id: string
          rating: number | null
          recipe_id: string | null
          updated_at: string | null
          user_id: string | null
          would_make_again: boolean | null
        }
        Insert: {
          comment?: string | null
          cooking_time_actual?: number | null
          created_at?: string | null
          difficulty_actual?:
            | Database["public"]["Enums"]["recipe_difficulty"]
            | null
          id?: string
          rating?: number | null
          recipe_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          would_make_again?: boolean | null
        }
        Update: {
          comment?: string | null
          cooking_time_actual?: number | null
          created_at?: string | null
          difficulty_actual?:
            | Database["public"]["Enums"]["recipe_difficulty"]
            | null
          id?: string
          rating?: number | null
          recipe_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          would_make_again?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_reviews_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_similarity: {
        Row: {
          id: string
          last_calculated: string | null
          recipe_a_id: string
          recipe_b_id: string
          similarity_score: number
          similarity_type: string | null
        }
        Insert: {
          id?: string
          last_calculated?: string | null
          recipe_a_id: string
          recipe_b_id: string
          similarity_score: number
          similarity_type?: string | null
        }
        Update: {
          id?: string
          last_calculated?: string | null
          recipe_a_id?: string
          recipe_b_id?: string
          similarity_score?: number
          similarity_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_similarity_recipe_a_id_fkey"
            columns: ["recipe_a_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_similarity_recipe_b_id_fkey"
            columns: ["recipe_b_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipe_views: {
        Row: {
          created_at: string
          id: string
          recipe_id: string
          search_term: string | null
          user_id: string
          view_type: string | null
          viewed_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          recipe_id: string
          search_term?: string | null
          user_id: string
          view_type?: string | null
          viewed_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          recipe_id?: string
          search_term?: string | null
          user_id?: string
          view_type?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_views_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          category_id: string | null
          cook_time_minutes: number | null
          created_at: string | null
          created_by: string | null
          cuisine_id: string | null
          description: string | null
          dietary_restrictions:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          difficulty: Database["public"]["Enums"]["recipe_difficulty"] | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          instructions: Json
          is_featured: boolean | null
          is_published: boolean | null
          nutritional_info: Json | null
          prep_time_minutes: number | null
          servings: number | null
          title: string
          total_time_minutes: number | null
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          category_id?: string | null
          cook_time_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          cuisine_id?: string | null
          description?: string | null
          dietary_restrictions?:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          difficulty?: Database["public"]["Enums"]["recipe_difficulty"] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          instructions: Json
          is_featured?: boolean | null
          is_published?: boolean | null
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          servings?: number | null
          title: string
          total_time_minutes?: number | null
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          category_id?: string | null
          cook_time_minutes?: number | null
          created_at?: string | null
          created_by?: string | null
          cuisine_id?: string | null
          description?: string | null
          dietary_restrictions?:
            | Database["public"]["Enums"]["dietary_restriction"][]
            | null
          difficulty?: Database["public"]["Enums"]["recipe_difficulty"] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          instructions?: Json
          is_featured?: boolean | null
          is_published?: boolean | null
          nutritional_info?: Json | null
          prep_time_minutes?: number | null
          servings?: number | null
          title?: string
          total_time_minutes?: number | null
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipes_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "recipe_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipes_cuisine_id_fkey"
            columns: ["cuisine_id"]
            isOneToOne: false
            referencedRelation: "cuisines"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_meal_plans: {
        Row: {
          created_at: string
          id: string
          shared_with: string[]
          user_id: string
          weekly_meal_plan_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          shared_with: string[]
          user_id: string
          weekly_meal_plan_id: string
        }
        Update: {
          created_at?: string
          id?: string
          shared_with?: string[]
          user_id?: string
          weekly_meal_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_meal_plans_weekly_meal_plan_id_fkey"
            columns: ["weekly_meal_plan_id"]
            isOneToOne: false
            referencedRelation: "weekly_meal_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_list_items: {
        Row: {
          custom_item_name: string | null
          estimated_price: number | null
          id: string
          ingredient_id: string | null
          is_purchased: boolean | null
          notes: string | null
          quantity: number | null
          shopping_list_id: string | null
          unit: Database["public"]["Enums"]["measurement_unit"] | null
        }
        Insert: {
          custom_item_name?: string | null
          estimated_price?: number | null
          id?: string
          ingredient_id?: string | null
          is_purchased?: boolean | null
          notes?: string | null
          quantity?: number | null
          shopping_list_id?: string | null
          unit?: Database["public"]["Enums"]["measurement_unit"] | null
        }
        Update: {
          custom_item_name?: string | null
          estimated_price?: number | null
          id?: string
          ingredient_id?: string | null
          is_purchased?: boolean | null
          notes?: string | null
          quantity?: number | null
          shopping_list_id?: string | null
          unit?: Database["public"]["Enums"]["measurement_unit"] | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_list_items_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_list_items_shopping_list_id_fkey"
            columns: ["shopping_list_id"]
            isOneToOne: false
            referencedRelation: "shopping_lists"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_lists: {
        Row: {
          created_at: string | null
          id: string
          is_completed: boolean | null
          meal_plan_id: string | null
          name: string
          supermarket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meal_plan_id?: string | null
          name: string
          supermarket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          meal_plan_id?: string | null
          name?: string
          supermarket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopping_lists_supermarket_id_fkey"
            columns: ["supermarket_id"]
            isOneToOne: false
            referencedRelation: "supermarkets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shopping_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      supermarkets: {
        Row: {
          contact_info: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          locations: Json | null
          logo_url: string | null
          name: string
          website: string | null
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          locations?: Json | null
          logo_url?: string | null
          name: string
          website?: string | null
        }
        Update: {
          contact_info?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          locations?: Json | null
          logo_url?: string | null
          name?: string
          website?: string | null
        }
        Relationships: []
      }
      support_ticket_responses: {
        Row: {
          created_at: string
          id: string
          is_admin_response: boolean | null
          message: string
          ticket_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_admin_response?: boolean | null
          message: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_admin_response?: boolean | null
          message?: string
          ticket_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_ticket_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "support_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          assigned_to: string | null
          created_at: string
          id: string
          message: string
          priority: string | null
          status: string | null
          subject: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message: string
          priority?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          id?: string
          message?: string
          priority?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      system_notifications: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          target_users: string[] | null
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          target_users?: string[] | null
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          target_users?: string[] | null
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          category: string | null
          description: string | null
          id: string
          is_public: boolean | null
          setting_key: string
          setting_value: Json
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key: string
          setting_value: Json
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          description?: string | null
          id?: string
          is_public?: boolean | null
          setting_key?: string
          setting_value?: Json
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          page_url: string | null
          user_id: string | null
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          page_url?: string | null
          user_id?: string | null
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          page_url?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_ai_preferences: {
        Row: {
          ai_recommendations_enabled: boolean | null
          created_at: string
          id: string
          include_healthy_recipes: boolean | null
          include_new_recipes: boolean | null
          include_popular_recipes: boolean | null
          include_quick_recipes: boolean | null
          include_seasonal_recipes: boolean | null
          learning_rate: number | null
          max_recommendations_per_day: number | null
          recommendation_frequency: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_recommendations_enabled?: boolean | null
          created_at?: string
          id?: string
          include_healthy_recipes?: boolean | null
          include_new_recipes?: boolean | null
          include_popular_recipes?: boolean | null
          include_quick_recipes?: boolean | null
          include_seasonal_recipes?: boolean | null
          learning_rate?: number | null
          max_recommendations_per_day?: number | null
          recommendation_frequency?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_recommendations_enabled?: boolean | null
          created_at?: string
          id?: string
          include_healthy_recipes?: boolean | null
          include_new_recipes?: boolean | null
          include_popular_recipes?: boolean | null
          include_quick_recipes?: boolean | null
          include_seasonal_recipes?: boolean | null
          learning_rate?: number | null
          max_recommendations_per_day?: number | null
          recommendation_frequency?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          recipe_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          recipe_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nutrition_targets: {
        Row: {
          created_at: string | null
          daily_calories: number | null
          daily_carbs: number | null
          daily_fat: number | null
          daily_fiber: number | null
          daily_protein: number | null
          id: string
          meal_distribution: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_fiber?: number | null
          daily_protein?: number | null
          id?: string
          meal_distribution?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_fiber?: number | null
          daily_protein?: number | null
          id?: string
          meal_distribution?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          created_at: string | null
          id: string
          preference_type: string
          preference_value: Json
          updated_at: string | null
          user_id: string | null
          weight: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          preference_type: string
          preference_value: Json
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          preference_type?: string
          preference_value?: Json
          updated_at?: string | null
          user_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences_v2: {
        Row: {
          allergies: string[] | null
          budget_preference: string | null
          cooking_skill_level: string | null
          cooking_time_preference: string | null
          created_at: string
          dietary_goals: string[] | null
          dietary_restrictions: string[] | null
          equipment_available: string[] | null
          favorite_cuisines: string[] | null
          health_conditions: string[] | null
          id: string
          preferred_meal_types: string[] | null
          serving_size_preference: string | null
          spice_tolerance: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          budget_preference?: string | null
          cooking_skill_level?: string | null
          cooking_time_preference?: string | null
          created_at?: string
          dietary_goals?: string[] | null
          dietary_restrictions?: string[] | null
          equipment_available?: string[] | null
          favorite_cuisines?: string[] | null
          health_conditions?: string[] | null
          id?: string
          preferred_meal_types?: string[] | null
          serving_size_preference?: string | null
          spice_tolerance?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          budget_preference?: string | null
          cooking_skill_level?: string | null
          cooking_time_preference?: string | null
          created_at?: string
          dietary_goals?: string[] | null
          dietary_restrictions?: string[] | null
          equipment_available?: string[] | null
          favorite_cuisines?: string[] | null
          health_conditions?: string[] | null
          id?: string
          preferred_meal_types?: string[] | null
          serving_size_preference?: string | null
          spice_tolerance?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_recipe_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_strength: number | null
          interaction_type: string
          recipe_id: string
          session_context: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_strength?: number | null
          interaction_type: string
          recipe_id: string
          session_context?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_strength?: number | null
          interaction_type?: string
          recipe_id?: string
          session_context?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recipe_interactions_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          actions_performed: Json | null
          device_info: Json | null
          duration_minutes: number | null
          id: string
          ip_address: string | null
          pages_visited: number | null
          session_end: string | null
          session_start: string
          user_id: string | null
        }
        Insert: {
          actions_performed?: Json | null
          device_info?: Json | null
          duration_minutes?: number | null
          id?: string
          ip_address?: string | null
          pages_visited?: number | null
          session_end?: string | null
          session_start?: string
          user_id?: string | null
        }
        Update: {
          actions_performed?: Json | null
          device_info?: Json | null
          duration_minutes?: number | null
          id?: string
          ip_address?: string | null
          pages_visited?: number | null
          session_end?: string | null
          session_start?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          auto_save_meal_plans: boolean | null
          created_at: string
          default_servings: number | null
          email_notifications: boolean | null
          id: string
          language: string | null
          measurement_system: string | null
          newsletter_subscription: boolean | null
          notifications_enabled: boolean | null
          privacy_level: string | null
          push_notifications: boolean | null
          show_cooking_tips: boolean | null
          show_nutritional_info: boolean | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_save_meal_plans?: boolean | null
          created_at?: string
          default_servings?: number | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          measurement_system?: string | null
          newsletter_subscription?: boolean | null
          notifications_enabled?: boolean | null
          privacy_level?: string | null
          push_notifications?: boolean | null
          show_cooking_tips?: boolean | null
          show_nutritional_info?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_save_meal_plans?: boolean | null
          created_at?: string
          default_servings?: number | null
          email_notifications?: boolean | null
          id?: string
          language?: string | null
          measurement_system?: string | null
          newsletter_subscription?: boolean | null
          notifications_enabled?: boolean | null
          privacy_level?: string | null
          push_notifications?: boolean | null
          show_cooking_tips?: boolean | null
          show_nutritional_info?: boolean | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_taste_profiles: {
        Row: {
          avoided_patterns: string[] | null
          confidence_score: number | null
          dominant_cuisines: string[] | null
          id: string
          last_updated: string | null
          preferred_ingredients: string[] | null
          profile_vector: number[]
          user_id: string
        }
        Insert: {
          avoided_patterns?: string[] | null
          confidence_score?: number | null
          dominant_cuisines?: string[] | null
          id?: string
          last_updated?: string | null
          preferred_ingredients?: string[] | null
          profile_vector: number[]
          user_id: string
        }
        Update: {
          avoided_patterns?: string[] | null
          confidence_score?: number | null
          dominant_cuisines?: string[] | null
          id?: string
          last_updated?: string | null
          preferred_ingredients?: string[] | null
          profile_vector?: number[]
          user_id?: string
        }
        Relationships: []
      }
      weekly_meal_plans: {
        Row: {
          created_at: string
          id: string
          is_template: boolean | null
          name: string
          plan_data: Json
          updated_at: string
          user_id: string
          week_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_template?: boolean | null
          name: string
          plan_data: Json
          updated_at?: string
          user_id: string
          week_start: string
        }
        Update: {
          created_at?: string
          id?: string
          is_template?: boolean | null
          name?: string
          plan_data?: Json
          updated_at?: string
          user_id?: string
          week_start?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_admin_privileges: {
        Args: { user_id: string }
        Returns: boolean
      }
      create_meal_plans_table: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_email: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_admin_password: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_user_recommendations: {
        Args: { p_context?: Json; p_limit?: number; p_user_id: string }
        Returns: {
          recipe_id: string
          recommendation_reason: string
          recommendation_score: number
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      hash_password: {
        Args: { password_text: string }
        Returns: string
      }
      health_check: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      initialize_basic_user_settings: {
        Args: { user_id: string }
        Returns: undefined
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      track_recipe_view: {
        Args: { recipe_id: string; search_term?: string; view_type?: string }
        Returns: undefined
      }
      verify_admin_password: {
        Args: { p_email: string; p_password: string }
        Returns: boolean
      }
    }
    Enums: {
      dietary_restriction:
        | "vegetarian"
        | "vegan"
        | "gluten_free"
        | "dairy_free"
        | "nut_free"
        | "halal"
        | "kosher"
      measurement_unit:
        | "grams"
        | "kg"
        | "ml"
        | "liters"
        | "cups"
        | "tbsp"
        | "tsp"
        | "pieces"
        | "cloves"
        | "pinch"
      recipe_difficulty: "easy" | "medium" | "hard"
      user_role: "super_admin" | "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      dietary_restriction: [
        "vegetarian",
        "vegan",
        "gluten_free",
        "dairy_free",
        "nut_free",
        "halal",
        "kosher",
      ],
      measurement_unit: [
        "grams",
        "kg",
        "ml",
        "liters",
        "cups",
        "tbsp",
        "tsp",
        "pieces",
        "cloves",
        "pinch",
      ],
      recipe_difficulty: ["easy", "medium", "hard"],
      user_role: ["super_admin", "admin", "moderator", "user"],
    },
  },
} as const
