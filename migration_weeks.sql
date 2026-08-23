-- Create the course_weeks table
CREATE TABLE IF NOT EXISTS public.course_weeks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  start_date date,
  end_date date,
  order_index integer NOT NULL DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on course_weeks
ALTER TABLE public.course_weeks ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read course_weeks
CREATE POLICY "Public course_weeks are viewable by everyone." ON public.course_weeks
FOR SELECT USING (true);

-- Policy: Admins and teachers can manage course_weeks
CREATE POLICY "Admins and teachers can manage course_weeks" ON public.course_weeks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'teacher')
  )
);

-- Add week_id to lessons
ALTER TABLE public.lessons ADD COLUMN week_id uuid REFERENCES public.course_weeks(id) ON DELETE SET NULL;

-- Add week_id to assignments
ALTER TABLE public.assignments ADD COLUMN week_id uuid REFERENCES public.course_weeks(id) ON DELETE SET NULL;

-- Migrate existing data safely
DO $$
DECLARE
  v_course_record record;
  v_week_id uuid;
BEGIN
  -- Find courses that have lessons or assignments
  FOR v_course_record IN 
    SELECT DISTINCT id FROM public.courses 
    WHERE id IN (SELECT course_id FROM public.lessons UNION SELECT course_id FROM public.assignments)
  LOOP
    -- Check if a week already exists for this course (idempotent step)
    SELECT id INTO v_week_id FROM public.course_weeks WHERE course_id = v_course_record.id LIMIT 1;
    
    IF NOT FOUND THEN
      -- Create a default "Week 1"
      INSERT INTO public.course_weeks (course_id, title, start_date, end_date, order_index)
      VALUES (v_course_record.id, 'Week 1', CURRENT_DATE, CURRENT_DATE + interval '7 days', 0)
      RETURNING id INTO v_week_id;
    END IF;

    -- Update lessons that do not have a week_id assigned
    UPDATE public.lessons 
    SET week_id = v_week_id 
    WHERE course_id = v_course_record.id AND week_id IS NULL;

    -- Update assignments that do not have a week_id assigned
    UPDATE public.assignments 
    SET week_id = v_week_id 
    WHERE course_id = v_course_record.id AND week_id IS NULL;
    
  END LOOP;
END $$;
