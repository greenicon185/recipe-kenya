-- Create collections table
create table public.collections (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    name text not null,
    description text,
    is_public boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create collection_recipes junction table
create table public.collection_recipes (
    id uuid default gen_random_uuid() primary key,
    collection_id uuid references collections on delete cascade not null,
    recipe_id uuid references recipes on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(collection_id, recipe_id)
);

-- Create meal_plans table
create table public.meal_plans (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    recipe_id uuid references recipes on delete cascade not null,
    date date not null,
    meal_type text check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')) not null,
    servings integer not null,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create shopping_lists table
create table public.shopping_lists (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    name text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create shopping_list_items table
create table public.shopping_list_items (
    id uuid default gen_random_uuid() primary key,
    shopping_list_id uuid references shopping_lists on delete cascade not null,
    ingredient_id uuid references ingredients on delete cascade not null,
    quantity numeric not null,
    unit text not null,
    is_checked boolean default false,
    recipe_id uuid references recipes on delete set null,
    custom_note text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.collections enable row level security;
alter table public.collection_recipes enable row level security;
alter table public.meal_plans enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;

-- Create policies for collections
create policy "Users can view their own collections"
    on collections for select
    using (auth.uid() = user_id);

create policy "Users can view public collections"
    on collections for select
    using (is_public = true);

create policy "Users can create their own collections"
    on collections for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own collections"
    on collections for update
    using (auth.uid() = user_id);

create policy "Users can delete their own collections"
    on collections for delete
    using (auth.uid() = user_id);

-- Create policies for collection_recipes
create policy "Users can view collection recipes they have access to"
    on collection_recipes for select
    using (
        exists (
            select 1 from collections
            where collections.id = collection_id
            and (collections.user_id = auth.uid() or collections.is_public = true)
        )
    );

create policy "Users can manage recipes in their collections"
    on collection_recipes for all
    using (
        exists (
            select 1 from collections
            where collections.id = collection_id
            and collections.user_id = auth.uid()
        )
    );

-- Create policies for meal_plans
create policy "Users can view their own meal plans"
    on meal_plans for select
    using (auth.uid() = user_id);

create policy "Users can create their own meal plans"
    on meal_plans for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own meal plans"
    on meal_plans for update
    using (auth.uid() = user_id);

create policy "Users can delete their own meal plans"
    on meal_plans for delete
    using (auth.uid() = user_id);

-- Create policies for shopping_lists
create policy "Users can view their own shopping lists"
    on shopping_lists for select
    using (auth.uid() = user_id);

create policy "Users can create their own shopping lists"
    on shopping_lists for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own shopping lists"
    on shopping_lists for update
    using (auth.uid() = user_id);

create policy "Users can delete their own shopping lists"
    on shopping_lists for delete
    using (auth.uid() = user_id);

-- Create policies for shopping_list_items
create policy "Users can view items in their shopping lists"
    on shopping_list_items for select
    using (
        exists (
            select 1 from shopping_lists
            where shopping_lists.id = shopping_list_id
            and shopping_lists.user_id = auth.uid()
        )
    );

create policy "Users can manage items in their shopping lists"
    on shopping_list_items for all
    using (
        exists (
            select 1 from shopping_lists
            where shopping_lists.id = shopping_list_id
            and shopping_lists.user_id = auth.uid()
        )
    );

-- Add triggers for updated_at
create trigger handle_updated_at
    before update on collections
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on meal_plans
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on shopping_lists
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on shopping_list_items
    for each row
    execute function public.handle_updated_at(); 