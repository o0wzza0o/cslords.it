-- SQL Migration Script: Add Course Components (Tutorial and Lab) support

-- 1. Add has_tutorial and has_lab columns to courses table
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS has_tutorial boolean DEFAULT false NOT NULL,
ADD COLUMN IF NOT EXISTS has_lab boolean DEFAULT false NOT NULL;

-- 2. Add component_type column to lessons table (default: 'lecture')
ALTER TABLE public.lessons 
ADD COLUMN IF NOT EXISTS component_type text DEFAULT 'lecture' NOT NULL;

-- 3. Add component_type column to assignments table (default: 'lecture')
ALTER TABLE public.assignments 
ADD COLUMN IF NOT EXISTS component_type text DEFAULT 'lecture' NOT NULL;

-- 4. Add optional check constraint for valid component types
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'lessons_component_type_check'
  ) THEN
    ALTER TABLE public.lessons 
    ADD CONSTRAINT lessons_component_type_check 
    CHECK (component_type IN ('lecture', 'tutorial', 'lab'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assignments_component_type_check'
  ) THEN
    ALTER TABLE public.assignments 
    ADD CONSTRAINT assignments_component_type_check 
    CHECK (component_type IN ('lecture', 'tutorial', 'lab'));
  END IF;
END $$;
