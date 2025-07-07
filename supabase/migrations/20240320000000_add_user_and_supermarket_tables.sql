-- Create profiles table
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    full_name text,
    username text unique,
    avatar_url text,
    role text check (role in ('user', 'admin', 'super_admin')) default 'user',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS) on profiles
alter table public.profiles enable row level security;

-- Create profiles policies
create policy "Public profiles are viewable by everyone"
    on profiles for select
    using ( true );

create policy "Users can insert their own profile"
    on profiles for insert
    with check ( auth.uid() = id );

create policy "Users can update their own profile"
    on profiles for update
    using ( auth.uid() = id );

-- Create supermarkets table
create table public.supermarkets (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    description text,
    website_url text,
    logo_url text,
    location text,
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on supermarkets
alter table public.supermarkets enable row level security;

-- Create supermarkets policies
create policy "Supermarkets are viewable by everyone"
    on supermarkets for select
    using ( true );

create policy "Only admins can insert supermarkets"
    on supermarkets for insert
    with check ( 
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'super_admin')
        )
    );

create policy "Only admins can update supermarkets"
    on supermarkets for update
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'super_admin')
        )
    );

-- Create supermarket_ingredients table
create table public.supermarket_ingredients (
    id uuid default gen_random_uuid() primary key,
    supermarket_id uuid references supermarkets on delete cascade not null,
    ingredient_id uuid references ingredients on delete cascade not null,
    price decimal(10,2) not null,
    currency text default 'KES' not null,
    unit text not null,
    quantity numeric not null,
    product_url text,
    in_stock boolean default true,
    last_updated timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(supermarket_id, ingredient_id)
);

-- Enable RLS on supermarket_ingredients
alter table public.supermarket_ingredients enable row level security;

-- Create supermarket_ingredients policies
create policy "Supermarket ingredients are viewable by everyone"
    on supermarket_ingredients for select
    using ( true );

create policy "Only admins can insert supermarket ingredients"
    on supermarket_ingredients for insert
    with check (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'super_admin')
        )
    );

create policy "Only admins can update supermarket ingredients"
    on supermarket_ingredients for update
    using (
        exists (
            select 1 from profiles
            where profiles.id = auth.uid()
            and profiles.role in ('admin', 'super_admin')
        )
    );

-- Create functions to handle timestamps
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$;

-- Create triggers for updated_at
create trigger handle_updated_at
    before update on public.profiles
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.supermarkets
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.supermarket_ingredients
    for each row
    execute function public.handle_updated_at(); 