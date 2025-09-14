-- Update profiles table to include username
ALTER TABLE public.profiles 
ADD COLUMN username TEXT UNIQUE;

-- Create reminders table for water, walk, eye breaks
CREATE TABLE public.wellness_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('water', 'walk', 'eye_break', 'stretch', 'posture')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  frequency_minutes INTEGER NOT NULL,
  last_triggered_at TIMESTAMP WITH TIME ZONE,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wellness_reminders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own reminders" 
ON public.wellness_reminders 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reminders" 
ON public.wellness_reminders 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reminders" 
ON public.wellness_reminders 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reminders" 
ON public.wellness_reminders 
FOR DELETE 
USING (auth.uid() = user_id);

-- Update the handle_new_user function to include username
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  
  RETURN new;
END;
$$;

-- Add trigger for updating timestamps
CREATE TRIGGER update_wellness_reminders_updated_at
BEFORE UPDATE ON public.wellness_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();