-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY, -- Clerk/Firebase UID
  email TEXT NOT NULL,
  display_name TEXT,
  role TEXT DEFAULT 'volunteer',
  permissions TEXT[] DEFAULT '{}',
  region TEXT,
  photo_url TEXT,
  verification_status TEXT DEFAULT 'pending',
  phone TEXT,
  skills TEXT[] DEFAULT '{}',
  id_proof_url TEXT,
  availability TEXT,
  aadhaar_number TEXT,
  face_verified BOOLEAN DEFAULT FALSE,
  face_photo_url TEXT,
  face_match_confidence NUMERIC,
  ocr_confidence NUMERIC,
  languages TEXT[] DEFAULT '{}',
  date_of_birth TEXT,
  gender TEXT,
  address TEXT,
  ngo_affiliation TEXT,
  ngo_name TEXT,
  ngo_email TEXT,
  ngo_registration_number TEXT,
  ngo_logo_url TEXT,
  ngo_id TEXT,
  fcm_token TEXT,
  is_registered BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NEEDS TABLE
CREATE TABLE IF NOT EXISTS public.needs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'medical', 'education', 'shelter', 'water', 'other')),
  urgency TEXT NOT NULL CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  location_name TEXT NOT NULL,
  reported_at TIMESTAMPTZ DEFAULT NOW(),
  reported_by TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'assigned', 'in_progress', 'resolved', 'dismissed')),
  assigned_volunteers TEXT[] DEFAULT '{}',
  photo_url TEXT,
  description TEXT NOT NULL,
  summary TEXT,
  description_hindi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  need_id UUID REFERENCES public.needs(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL,
  volunteer_ids TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'in_progress', 'completed', 'escalated')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  due_at TIMESTAMPTZ,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  recurring BOOLEAN DEFAULT FALSE,
  frequency TEXT,
  attachment_urls TEXT[] DEFAULT '{}',
  description TEXT NOT NULL,
  location_lat DOUBLE PRECISION NOT NULL,
  location_lng DOUBLE PRECISION NOT NULL,
  location_name TEXT NOT NULL
);

-- 4. VOLUNTEERS TABLE
CREATE TABLE IF NOT EXISTS public.volunteers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  skills TEXT[] DEFAULT '{}',
  languages TEXT[] DEFAULT '{}',
  lat DOUBLE PRECISION DEFAULT 19.0760,
  lng DOUBLE PRECISION DEFAULT 72.8777,
  available BOOLEAN DEFAULT TRUE,
  availability_schedule JSONB DEFAULT '{}'::jsonb,
  rating NUMERIC DEFAULT 5.0,
  tasks_completed INTEGER DEFAULT 0,
  total_hours NUMERIC DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT TRUE,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  region TEXT,
  location_name TEXT,
  face_verified BOOLEAN DEFAULT FALSE
);

-- 5. NGOS TABLE
CREATE TABLE IF NOT EXISTS public.ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  registration_number TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending_review',
  tier TEXT DEFAULT 'grassroots',
  founded_year INTEGER,
  focus_areas TEXT[] DEFAULT '{}',
  sdg_goals INTEGER[] DEFAULT '{}',
  primary_contact JSONB NOT NULL,
  secondary_contact JSONB,
  address JSONB NOT NULL,
  operating_regions TEXT[] DEFAULT '{}',
  logo_url TEXT,
  website TEXT,
  description TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  founder_id TEXT NOT NULL,
  member_ids TEXT[] DEFAULT '{}',
  volunteer_count INTEGER DEFAULT 0,
  active_mission_count INTEGER DEFAULT 0,
  total_missions_completed INTEGER DEFAULT 0,
  impact_score NUMERIC DEFAULT 0,
  response_time_avg NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. NGO MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.ngo_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES public.ngos(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE (ngo_id, user_id)
);

-- 7. INVENTORY ITEMS
CREATE TABLE IF NOT EXISTS public.inventory_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('food', 'water', 'medical', 'shelter', 'other')),
  description TEXT,
  quantity NUMERIC DEFAULT 0,
  unit TEXT DEFAULT 'units',
  location TEXT NOT NULL,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  qr_code TEXT,
  minimum_threshold NUMERIC DEFAULT 10,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'optimal' CHECK (status IN ('optimal', 'low', 'critical', 'out_of_stock'))
);

-- 8. INVENTORY TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.inventory_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('inbound', 'outbound', 'adjustment')),
  quantity NUMERIC NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  performed_by TEXT NOT NULL,
  notes TEXT,
  qr_code_scanned BOOLEAN DEFAULT FALSE
);

-- 9. ACTIVITIES
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL,
  text TEXT NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  dot_class TEXT DEFAULT 'bg-primary'
);

-- 10. AI MATCHES
CREATE TABLE IF NOT EXISTS public.ai_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
  volunteer_id TEXT REFERENCES public.volunteers(id) ON DELETE CASCADE,
  confidence_score NUMERIC NOT NULL,
  reason TEXT NOT NULL,
  estimated_arrival TEXT,
  skill_match_tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for high-frequency queries
CREATE INDEX IF NOT EXISTS idx_needs_status_urgency ON public.needs(status, urgency);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_volunteers_active_available ON public.volunteers(active, available);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON public.activities(timestamp DESC);
