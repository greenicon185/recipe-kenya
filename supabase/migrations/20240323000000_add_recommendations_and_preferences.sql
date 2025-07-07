-- Add tags array to recipes table
alter table public.recipes add column if not exists tags text[] default '{}';
alter table public.recipes add column if not exists meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack'));

-- Create user_preferences table
create table public.user_preferences (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    dietary_restrictions text[] default '{}',
    favorite_cuisines text[] default '{}',
    cooking_skill_level text check (cooking_skill_level in ('beginner', 'intermediate', 'advanced')),
    preferred_meal_types text[] default '{}',
    allergies text[] default '{}',
    cooking_time_preference text check (cooking_time_preference in ('quick', 'medium', 'lengthy')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id)
);

-- Create recipe_views table for tracking popularity
create table public.recipe_views (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid references recipes on delete cascade not null,
    user_id uuid references auth.users on delete cascade not null,
    viewed_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create function to get popular recipes
create or replace function get_popular_recipes(
    start_date timestamp with time zone,
    end_date timestamp with time zone,
    limit_count integer default 10
)
returns table (
    id uuid,
    title text,
    description text,
    image_url text,
    view_count bigint
)
language sql
security definer
as $$
    select
        r.id,
        r.title,
        r.description,
        r.image_url,
        count(rv.id) as view_count
    from recipes r
    left join recipe_views rv on r.id = rv.recipe_id
    where
        rv.viewed_at >= start_date
        and rv.viewed_at <= end_date
        and r.is_published = true
    group by r.id
    order by view_count desc
    limit limit_count;
$$;

-- Enable RLS on new tables
alter table public.user_preferences enable row level security;
alter table public.recipe_views enable row level security;

-- Create policies for user_preferences
create policy "Users can view their own preferences"
    on user_preferences for select
    using (auth.uid() = user_id);

create policy "Users can update their own preferences"
    on user_preferences for all
    using (auth.uid() = user_id);

-- Create policies for recipe_views
create policy "Users can view recipe view statistics"
    on recipe_views for select
    using (true);

create policy "Users can create recipe views"
    on recipe_views for insert
    with check (auth.uid() = user_id);

-- Add trigger for updated_at
create trigger handle_updated_at
    before update on user_preferences
    for each row
    execute function public.handle_updated_at();

-- Create function to track recipe view
create or replace function track_recipe_view(recipe_id uuid)
returns void
language plpgsql
security definer
as $$
begin
    insert into recipe_views (recipe_id, user_id)
    values (recipe_id, auth.uid());
end;
$$; 