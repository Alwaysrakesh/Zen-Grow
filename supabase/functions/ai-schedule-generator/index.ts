import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.2';

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the user from the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Invalid user token');
    }

    const { prompt, action } = await req.json();

    if (action === 'generate_schedule') {
      console.log('Generating schedule for prompt:', prompt);
      
      // Call OpenAI to generate a schedule
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { 
                role: 'system', 
                content: `You are an expert productivity and time management assistant. Create a comprehensive daily schedule based on the user's request.
              
              IMPORTANT INSTRUCTIONS:
              1. Generate a COMPLETE daily schedule from morning to evening (typically 6:00 AM to 10:00 PM)
              2. Include all essential activities: work/study blocks, meals, breaks, exercise, personal time
              3. Add wellness reminders at strategic intervals (water every 30-45 min, eye breaks every 20-30 min, walks every 2 hours)
              4. Make the schedule realistic and sustainable with proper time buffers
              5. If user doesn't specify exact activities, create a balanced productive day based on their general request
              
              Return ONLY a valid JSON object (no markdown, no extra text) with this exact structure:
              {
                "title": "Descriptive schedule title based on user's goal",
                "description": "Brief 1-2 sentence description of the schedule's focus",
                "items": [
                  {
                    "time": "HH:MM",
                    "endTime": "HH:MM",
                    "activity": "Specific activity name",
                    "type": "work|break|meal|exercise|meeting|personal|study|leisure",
                    "priority": "high|medium|low",
                    "reminder": true/false,
                    "details": "Optional additional details about the activity"
                  }
                ],
                "reminders": [
                  {
                    "time": "HH:MM",
                    "type": "water|eye_break|walk|stretch|posture",
                    "message": "Friendly reminder message"
                  }
                ]
              }
              
              Example user requests and how to interpret them:
              - "productive work day" -> Full 9-5 work schedule with breaks
              - "study for exams" -> Study blocks with pomodoro breaks
              - "balanced day" -> Mix of work, exercise, leisure
              - "remote work schedule" -> Work blocks with home-friendly breaks
              `
              },
              { role: 'user', content: `Create a detailed daily schedule for: ${prompt}. Include specific time blocks from morning to evening.` }
            ],
            temperature: 0.7,
            max_tokens: 2000,
          }),
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      const aiResponse = data.choices[0].message.content;
      
      // Parse the JSON response
      let scheduleData;
      try {
        // Extract JSON from the response if it's wrapped in markdown
        const jsonMatch = aiResponse.match(/```json\n?([\s\S]*?)\n?```/) || aiResponse.match(/({[\s\S]*})/);
        const jsonString = jsonMatch ? jsonMatch[1] : aiResponse;
        scheduleData = JSON.parse(jsonString);
      } catch (parseError) {
        console.error('Error parsing AI response:', parseError);
        // Fallback to a basic schedule structure
        scheduleData = {
          title: "Daily Schedule",
          description: "AI-generated schedule",
          items: [],
          reminders: []
        };
      }

      // Save the schedule to the database
      const { data: savedSchedule, error: saveError } = await supabase
        .from('ai_schedules')
        .insert({
          user_id: user.id,
          prompt: prompt,
          schedule_data: scheduleData,
          is_active: false
        })
        .select()
        .single();

      if (saveError) {
        console.error('Error saving schedule:', saveError);
        throw saveError;
      }

      // Save chat messages
      await supabase.from('ai_chat_history').insert([
        {
          user_id: user.id,
          message: prompt,
          role: 'user',
          schedule_id: savedSchedule.id
        },
        {
          user_id: user.id,
          message: `I've created a schedule for you: "${scheduleData.title}". ${scheduleData.description}`,
          role: 'assistant',
          schedule_id: savedSchedule.id
        }
      ]);

      return new Response(
        JSON.stringify({ 
          schedule: scheduleData,
          scheduleId: savedSchedule.id,
          message: `I've created a schedule for you: "${scheduleData.title}". Would you like to activate it?`
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else if (action === 'chat') {
      // Regular chat functionality
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { 
              role: 'system', 
              content: 'You are a helpful productivity assistant focused on time management, scheduling, and wellness. Help users create effective schedules and maintain healthy work habits.'
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      const aiResponse = data.choices[0].message.content;

      // Save chat messages
      await supabase.from('ai_chat_history').insert([
        {
          user_id: user.id,
          message: prompt,
          role: 'user'
        },
        {
          user_id: user.id,
          message: aiResponse,
          role: 'assistant'
        }
      ]);

      return new Response(
        JSON.stringify({ message: aiResponse }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error: any) {
    console.error('Error in AI schedule generator:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});