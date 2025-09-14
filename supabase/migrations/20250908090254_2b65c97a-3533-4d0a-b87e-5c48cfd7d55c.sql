-- Create table for scheduled alarms
CREATE TABLE public.scheduled_alarms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('water', 'eye_break', 'walk', 'stretch', 'posture', 'custom')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  scheduled_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  days_of_week INTEGER[] DEFAULT ARRAY[0,1,2,3,4,5,6], -- 0=Sunday, 6=Saturday
  sound_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for AI generated schedules
CREATE TABLE public.ai_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  schedule_data JSONB NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat history
CREATE TABLE public.ai_chat_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  schedule_id UUID REFERENCES public.ai_schedules(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.scheduled_alarms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_chat_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scheduled_alarms
CREATE POLICY "Users can view their own alarms" 
ON public.scheduled_alarms 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own alarms" 
ON public.scheduled_alarms 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own alarms" 
ON public.scheduled_alarms 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own alarms" 
ON public.scheduled_alarms 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for ai_schedules
CREATE POLICY "Users can view their own schedules" 
ON public.ai_schedules 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own schedules" 
ON public.ai_schedules 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own schedules" 
ON public.ai_schedules 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own schedules" 
ON public.ai_schedules 
FOR DELETE 
USING (auth.uid() = user_id);

-- RLS Policies for ai_chat_history
CREATE POLICY "Users can view their own chat history" 
ON public.ai_chat_history 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own chat messages" 
ON public.ai_chat_history 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_scheduled_alarms_updated_at
BEFORE UPDATE ON public.scheduled_alarms
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create default alarms for new users (update the handle_new_user function)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'username'
  );
  
  -- Create default wellness reminders for new users
  INSERT INTO public.wellness_reminders (user_id, type, title, message, frequency_minutes) VALUES
    (new.id, 'water', 'Hydration Break', 'Time to drink some water! Stay hydrated 💧', 30),
    (new.id, 'eye_break', 'Eye Rest', 'Look away from your screen for 20 seconds', 20),
    (new.id, 'walk', 'Movement Break', 'Take a short walk to stretch your legs', 60),
    (new.id, 'stretch', 'Stretch Break', 'Time for a quick stretch session', 45),
    (new.id, 'posture', 'Posture Check', 'Check and correct your posture', 40);
  
  -- Create default scheduled alarms
  INSERT INTO public.scheduled_alarms (user_id, type, title, message, scheduled_time, days_of_week) VALUES
    (new.id, 'water', 'Morning Hydration', 'Start your day with a glass of water! 💧', '08:00:00', ARRAY[1,2,3,4,5]),
    (new.id, 'water', 'Lunch Hydration', 'Hydrate before lunch! 💧', '12:00:00', ARRAY[1,2,3,4,5]),
    (new.id, 'water', 'Afternoon Hydration', 'Stay hydrated in the afternoon! 💧', '15:00:00', ARRAY[1,2,3,4,5]),
    (new.id, 'eye_break', 'Morning Eye Break', 'Give your eyes a rest 👁️', '10:00:00', ARRAY[1,2,3,4,5]),
    (new.id, 'eye_break', 'Afternoon Eye Break', 'Time for an eye break 👁️', '14:00:00', ARRAY[1,2,3,4,5]),
    (new.id, 'walk', 'Mid-morning Walk', 'Take a short walk to energize! 🚶', '10:30:00', ARRAY[1,2,3,4,5]),
    (new.id, 'walk', 'Post-lunch Walk', 'Walk off that lunch! 🚶', '13:30:00', ARRAY[1,2,3,4,5]);
  
  RETURN new;
END;
$function$;