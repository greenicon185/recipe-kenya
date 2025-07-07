-- Create chat_messages table
create table public.chat_messages (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    content text not null,
    type text check (type in ('user', 'assistant')) not null,
    context jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create cooking_tips table for reusable tips
create table public.cooking_tips (
    id uuid default gen_random_uuid() primary key,
    category text not null,
    difficulty text,
    tip text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users on delete set null
);

-- Create ingredient_substitutions table
create table public.ingredient_substitutions (
    id uuid default gen_random_uuid() primary key,
    ingredient_id uuid references ingredients on delete cascade not null,
    substitute_ingredient_id uuid references ingredients on delete cascade not null,
    substitution_ratio numeric,
    notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users on delete set null,
    unique(ingredient_id, substitute_ingredient_id)
);

-- Create cooking_terms table for glossary
create table public.cooking_terms (
    id uuid default gen_random_uuid() primary key,
    term text not null unique,
    definition text not null,
    example_usage text,
    difficulty_level text check (difficulty_level in ('beginner', 'intermediate', 'advanced')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users on delete set null
);

-- Create common_mistakes table
create table public.common_mistakes (
    id uuid default gen_random_uuid() primary key,
    category text not null,
    mistake_description text not null,
    solution text not null,
    prevention_tips text[],
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_by uuid references auth.users on delete set null
);

-- Enable RLS on new tables
alter table public.chat_messages enable row level security;
alter table public.cooking_tips enable row level security;
alter table public.ingredient_substitutions enable row level security;
alter table public.cooking_terms enable row level security;
alter table public.common_mistakes enable row level security;

-- Create policies for chat_messages
create policy "Users can view their own chat messages"
    on chat_messages for select
    using (auth.uid() = user_id);

create policy "Users can create chat messages"
    on chat_messages for insert
    with check (auth.uid() = user_id);

-- Create policies for cooking_tips
create policy "Everyone can view cooking tips"
    on cooking_tips for select
    using (true);

create policy "Admins can manage cooking tips"
    on cooking_tips for all
    using (
        exists (
            select 1 from user_roles
            where user_id = auth.uid()
            and role in ('admin', 'super_admin')
        )
    );

-- Create policies for ingredient_substitutions
create policy "Everyone can view ingredient substitutions"
    on ingredient_substitutions for select
    using (true);

create policy "Admins can manage ingredient substitutions"
    on ingredient_substitutions for all
    using (
        exists (
            select 1 from user_roles
            where user_id = auth.uid()
            and role in ('admin', 'super_admin')
        )
    );

-- Create policies for cooking_terms
create policy "Everyone can view cooking terms"
    on cooking_terms for select
    using (true);

create policy "Admins can manage cooking terms"
    on cooking_terms for all
    using (
        exists (
            select 1 from user_roles
            where user_id = auth.uid()
            and role in ('admin', 'super_admin')
        )
    );

-- Create policies for common_mistakes
create policy "Everyone can view common mistakes"
    on common_mistakes for select
    using (true);

create policy "Admins can manage common mistakes"
    on common_mistakes for all
    using (
        exists (
            select 1 from user_roles
            where user_id = auth.uid()
            and role in ('admin', 'super_admin')
        )
    );

-- Create function to get relevant cooking tips
create or replace function get_relevant_tips(
    recipe_category text,
    recipe_difficulty text,
    limit_count integer default 5
)
returns table (
    category text,
    difficulty text,
    tip text
)
language sql
security definer
as $$
    select
        category,
        difficulty,
        tip
    from cooking_tips
    where
        (category = recipe_category or category = 'general')
        and (difficulty = recipe_difficulty or difficulty is null)
    order by
        case when category = recipe_category then 0 else 1 end,
        case when difficulty = recipe_difficulty then 0 else 1 end,
        random()
    limit limit_count;
$$;

-- Create function to find ingredient substitutions
create or replace function find_ingredient_substitutions(ingredient_ids uuid[])
returns table (
    original_ingredient_id uuid,
    substitute_ingredient_id uuid,
    substitute_name text,
    substitution_ratio numeric,
    notes text
)
language sql
security definer
as $$
    select
        s.ingredient_id as original_ingredient_id,
        s.substitute_ingredient_id,
        i.name as substitute_name,
        s.substitution_ratio,
        s.notes
    from ingredient_substitutions s
    join ingredients i on i.id = s.substitute_ingredient_id
    where s.ingredient_id = any(ingredient_ids);
$$;

-- Insert some initial cooking terms
insert into cooking_terms (term, definition, difficulty_level) values
    ('mise en place', 'French term meaning "everything in its place". Refers to having all ingredients prepared and ready before cooking.', 'beginner'),
    ('blanch', 'Briefly cooking ingredients in boiling water, then immediately placing in ice water to stop the cooking process.', 'beginner'),
    ('sauté', 'Cooking food quickly in a small amount of hot fat over high heat while stirring.', 'beginner'),
    ('deglaze', 'Adding liquid to a hot pan to loosen browned bits of food stuck to the bottom.', 'intermediate'),
    ('braise', 'Cooking method that uses both moist and dry heat: typically, meat is first seared at high temperature, then finished in a covered pot with liquid.', 'intermediate'),
    ('emulsify', 'The process of combining two liquids that normally don''t mix, like oil and vinegar, into a smooth mixture.', 'intermediate'),
    ('temper', 'Gradually raising the temperature of a cold or room temperature ingredient by adding small amounts of a hot ingredient.', 'advanced'),
    ('reduce', 'To boil a liquid until some of it evaporates, concentrating its flavor and thickening it.', 'beginner');

-- Insert some common mistakes
insert into common_mistakes (category, mistake_description, solution, prevention_tips) values
    ('baking', 'Opening the oven door too frequently while baking', 'Use the oven light to check progress instead of opening the door', ARRAY['Set a timer', 'Trust the recipe timing', 'Use visual cues through the oven window']),
    ('seasoning', 'Adding salt only at the end of cooking', 'Season throughout the cooking process to build layers of flavor', ARRAY['Taste as you go', 'Add salt in small amounts', 'Remember you can always add more but can''t take it away']),
    ('temperature', 'Not letting meat rest after cooking', 'Allow meat to rest for 5-10 minutes before cutting', ARRAY['Use a timer', 'Cover meat loosely with foil while resting', 'Plan your timing to include resting period']); 