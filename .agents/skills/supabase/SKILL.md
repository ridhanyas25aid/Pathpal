---
name: supabase
description: Specialized instructions and workflows for working with Supabase databases, authentication, and edge functions.
---

# Supabase Agent Skills

Use these guidelines and cheatsheets to build and debug applications running on Supabase.

---

## 1. Client Initialization
Always initialize the Supabase client using your project URL and public Anon Key:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://your-project-ref.supabase.co'
const supabaseAnonKey = 'your-anon-key'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

---

## 2. Database Operations (CRUD)

### Reading Data
```javascript
const { data, error } = await supabase
  .from('profiles')
  .select('id, name, city')
  .eq('city', 'Chennai')
  .order('name', { ascending: true })
```

### Inserting Data
```javascript
const { data, error } = await supabase
  .from('reports')
  .insert([
    { 
      type: 'Crime', 
      description: 'Theft reported', 
      latitude: 13.0827, 
      longitude: 80.2707,
      status: 'Pending' 
    }
  ])
  .select()
```

### Updating Data
```javascript
const { data, error } = await supabase
  .from('reports')
  .update({ status: 'Approved' })
  .eq('id', reportId)
  .select()
```

### Deleting Data
```javascript
const { error } = await supabase
  .from('reports')
  .delete()
  .eq('id', reportId)
```

---

## 3. Row Level Security (RLS) & Policies

Always ensure Row Level Security is enabled on your tables to protect user data:

```sql
-- Enable RLS on the reports table
alter table public.reports enable row level security;

-- Create policy to allow read access to authenticated users
create policy "Allow read access for authenticated users" 
on public.reports for select 
using (auth.role() = 'authenticated');

-- Create policy to allow insert access for authenticated users
create policy "Allow insert access for owners" 
on public.reports for insert 
with check (auth.uid() = user_id);
```

---

## 4. Supabase Authentication

### Sign Up / Sign In with Email
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'secure-password-here',
})
```

### Sign In with Phone OTP
```javascript
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+918879998795',
})
```

---

## 5. Edge Functions

Deploy edge functions from the command line:

```bash
# Create a new function
supabase functions new hello-world

# Deploy function to cloud
supabase functions deploy hello-world --project-ref your-project-ref
```
