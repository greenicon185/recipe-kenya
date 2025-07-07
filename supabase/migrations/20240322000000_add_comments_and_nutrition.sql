-- Add nutritional information columns to ingredients table
alter table public.ingredients add column if not exists protein_per_100g numeric;
alter table public.ingredients add column if not exists carbs_per_100g numeric;
alter table public.ingredients add column if not exists fat_per_100g numeric;
alter table public.ingredients add column if not exists fiber_per_100g numeric;
alter table public.ingredients add column if not exists sugar_per_100g numeric;
alter table public.ingredients add column if not exists sodium_per_100g numeric;
alter table public.ingredients add column if not exists cholesterol_per_100g numeric;

-- Create recipe_comments table
create table public.recipe_comments (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid references recipes on delete cascade not null,
    user_id uuid references auth.users on delete cascade not null,
    parent_comment_id uuid references recipe_comments on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create recipe_shares table
create table public.recipe_shares (
    id uuid default gen_random_uuid() primary key,
    recipe_id uuid references recipes on delete cascade not null,
    shared_by uuid references auth.users on delete cascade not null,
    shared_with uuid references auth.users on delete cascade not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(recipe_id, shared_by, shared_with)
);

-- Enable RLS on new tables
alter table public.recipe_comments enable row level security;
alter table public.recipe_shares enable row level security;

-- Create policies for recipe_comments
create policy "Users can view comments on recipes"
    on recipe_comments for select
    using ( true );

create policy "Users can create comments"
    on recipe_comments for insert
    with check ( auth.uid() = user_id );

create policy "Users can update their own comments"
    on recipe_comments for update
    using ( auth.uid() = user_id );

create policy "Users can delete their own comments"
    on recipe_comments for delete
    using ( auth.uid() = user_id );

-- Create policies for recipe_shares
create policy "Users can view recipes shared with them"
    on recipe_shares for select
    using (
        auth.uid() = shared_with
        or auth.uid() = shared_by
    );

create policy "Users can share recipes"
    on recipe_shares for insert
    with check ( auth.uid() = shared_by );

create policy "Users can delete their shared recipes"
    on recipe_shares for delete
    using ( auth.uid() = shared_by );

-- Add triggers for updated_at
create trigger handle_updated_at
    before update on recipe_comments
    for each row
    execute function public.handle_updated_at();

-- Create function to notify users when a recipe is shared with them
create or replace function notify_recipe_share()
returns trigger
language plpgsql
security definer
as $$
begin
    insert into public.notifications (
        user_id,
        type,
        title,
        message,
        data
    )
    values (
        new.shared_with,
        'recipe_share',
        'New Recipe Shared',
        (
            select profiles.full_name
            from profiles
            where profiles.id = new.shared_by
        ) || ' shared a recipe with you',
        jsonb_build_object(
            'recipe_id', new.recipe_id,
            'shared_by', new.shared_by
        )
    );
    return new;
end;
$$;

-- Create trigger for recipe share notifications
create trigger on_recipe_share
    after insert on recipe_shares
    for each row
    execute function notify_recipe_share();

-- Create function to notify users when someone comments on their recipe
create or replace function notify_recipe_comment()
returns trigger
language plpgsql
security definer
as $$
declare
    recipe_owner_id uuid;
begin
    -- Get the recipe owner
    select user_id into recipe_owner_id
    from recipes
    where id = new.recipe_id;

    -- Only notify if the commenter is not the recipe owner
    if recipe_owner_id != new.user_id then
        insert into public.notifications (
            user_id,
            type,
            title,
            message,
            data
        )
        values (
            recipe_owner_id,
            'recipe_comment',
            'New Comment',
            (
                select profiles.full_name
                from profiles
                where profiles.id = new.user_id
            ) || ' commented on your recipe',
            jsonb_build_object(
                'recipe_id', new.recipe_id,
                'comment_id', new.id
            )
        );
    end if;

    -- If this is a reply, notify the parent comment author
    if new.parent_comment_id is not null then
        insert into public.notifications (
            user_id,
            type,
            title,
            message,
            data
        )
        select
            rc.user_id,
            'comment_reply',
            'New Reply',
            (
                select profiles.full_name
                from profiles
                where profiles.id = new.user_id
            ) || ' replied to your comment',
            jsonb_build_object(
                'recipe_id', new.recipe_id,
                'comment_id', new.id
            )
        from recipe_comments rc
        where rc.id = new.parent_comment_id
        and rc.user_id != new.user_id;
    end if;

    return new;
end;
$$;

-- Create trigger for recipe comment notifications
create trigger on_recipe_comment
    after insert on recipe_comments
    for each row
    execute function notify_recipe_comment(); 