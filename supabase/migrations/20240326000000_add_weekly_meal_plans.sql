-- Create weekly_meal_plans table for storing complex meal plan structures
create table if not exists public.weekly_meal_plans (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    name text not null,
    plan_data jsonb not null,
    week_start date not null,
    is_template boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create meal_templates table
create table if not exists public.meal_templates (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    name text not null,
    description text,
    template_data jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create shared_meal_plans table
create table if not exists public.shared_meal_plans (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    weekly_meal_plan_id uuid references weekly_meal_plans on delete cascade not null,
    shared_with text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create meal_plan_comments table
create table if not exists public.meal_plan_comments (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users on delete cascade not null,
    weekly_meal_plan_id uuid references weekly_meal_plans on delete cascade not null,
    comment text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.weekly_meal_plans enable row level security;
alter table public.meal_templates enable row level security;
alter table public.shared_meal_plans enable row level security;
alter table public.meal_plan_comments enable row level security;

-- Create policies for weekly_meal_plans
drop policy if exists "Users can view their own weekly meal plans" on weekly_meal_plans;
create policy "Users can view their own weekly meal plans"
    on weekly_meal_plans for select
    using (auth.uid() = user_id);

drop policy if exists "Users can create their own weekly meal plans" on weekly_meal_plans;
create policy "Users can create their own weekly meal plans"
    on weekly_meal_plans for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their own weekly meal plans" on weekly_meal_plans;
create policy "Users can update their own weekly meal plans"
    on weekly_meal_plans for update
    using (auth.uid() = user_id);

drop policy if exists "Users can delete their own weekly meal plans" on weekly_meal_plans;
create policy "Users can delete their own weekly meal plans"
    on weekly_meal_plans for delete
    using (auth.uid() = user_id);

-- Create policies for meal_templates
drop policy if exists "Users can view their own meal templates" on meal_templates;
create policy "Users can view their own meal templates"
    on meal_templates for select
    using (auth.uid() = user_id);

drop policy if exists "Users can create their own meal templates" on meal_templates;
create policy "Users can create their own meal templates"
    on meal_templates for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their own meal templates" on meal_templates;
create policy "Users can update their own meal templates"
    on meal_templates for update
    using (auth.uid() = user_id);

drop policy if exists "Users can delete their own meal templates" on meal_templates;
create policy "Users can delete their own meal templates"
    on meal_templates for delete
    using (auth.uid() = user_id);

-- Create policies for shared_meal_plans
drop policy if exists "Users can view shared meal plans they created" on shared_meal_plans;
create policy "Users can view shared meal plans they created"
    on shared_meal_plans for select
    using (auth.uid() = user_id);

drop policy if exists "Users can view meal plans shared with them" on shared_meal_plans;
create policy "Users can view meal plans shared with them"
    on shared_meal_plans for select
    using (auth.uid()::text = any(shared_with) or user_id = auth.uid());

drop policy if exists "Users can create shared meal plans" on shared_meal_plans;
create policy "Users can create shared meal plans"
    on shared_meal_plans for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update their own shared meal plans" on shared_meal_plans;
create policy "Users can update their own shared meal plans"
    on shared_meal_plans for update
    using (auth.uid() = user_id);

drop policy if exists "Users can delete their own shared meal plans" on shared_meal_plans;
create policy "Users can delete their own shared meal plans"
    on shared_meal_plans for delete
    using (auth.uid() = user_id);

-- Create policies for meal_plan_comments
drop policy if exists "Users can view comments on meal plans they have access to" on meal_plan_comments;
create policy "Users can view comments on meal plans they have access to"
    on meal_plan_comments for select
    using (
        exists (
            select 1 from weekly_meal_plans
            where weekly_meal_plans.id = weekly_meal_plan_id
            and weekly_meal_plans.user_id = auth.uid()
        ) or
        exists (
            select 1 from shared_meal_plans
            where shared_meal_plans.weekly_meal_plan_id = weekly_meal_plan_id
            and (shared_meal_plans.user_id = auth.uid() or auth.uid()::text = any(shared_meal_plans.shared_with))
        )
    );

drop policy if exists "Users can create comments on meal plans they have access to" on meal_plan_comments;
create policy "Users can create comments on meal plans they have access to"
    on meal_plan_comments for insert
    with check (
        exists (
            select 1 from weekly_meal_plans
            where weekly_meal_plans.id = weekly_meal_plan_id
            and weekly_meal_plans.user_id = auth.uid()
        ) or
        exists (
            select 1 from shared_meal_plans
            where shared_meal_plans.weekly_meal_plan_id = weekly_meal_plan_id
            and (shared_meal_plans.user_id = auth.uid() or auth.uid()::text = any(shared_meal_plans.shared_with))
        )
    );

drop policy if exists "Users can update their own comments" on meal_plan_comments;
create policy "Users can update their own comments"
    on meal_plan_comments for update
    using (auth.uid() = user_id);

drop policy if exists "Users can delete their own comments" on meal_plan_comments;
create policy "Users can delete their own comments"
    on meal_plan_comments for delete
    using (auth.uid() = user_id);

-- Create indexes for better performance
create index if not exists idx_weekly_meal_plans_user_id on weekly_meal_plans(user_id);
create index if not exists idx_weekly_meal_plans_week_start on weekly_meal_plans(week_start);
create index if not exists idx_meal_templates_user_id on meal_templates(user_id);
create index if not exists idx_shared_meal_plans_user_id on shared_meal_plans(user_id);
create index if not exists idx_shared_meal_plans_shared_with on shared_meal_plans using gin(shared_with);
create index if not exists idx_meal_plan_comments_weekly_meal_plan_id on meal_plan_comments(weekly_meal_plan_id);