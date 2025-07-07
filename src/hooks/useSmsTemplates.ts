
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';

interface SmsTemplate {
  id: string;
  user_id: string;
  template_name: string;
  message_content: string;
  phone_number: string | null;
  created_at: string;
  updated_at: string;
}

export const useSmsTemplates = () => {
  const { user } = useAuth();
  const [template, setTemplate] = useState<SmsTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load template on mount
  useEffect(() => {
    if (user?.id) {
      loadTemplate();
    }
  }, [user?.id]);

  const loadTemplate = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('sms_templates')
        .select('id, user_id, template_name, message_content, phone_number, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('template_name', 'review_request')
        .maybeSingle();

      if (error) {
        console.error('Error loading SMS template:', error);
        toast({
          title: "Error",
          description: "Failed to load saved message template",
          variant: "destructive",
        });
        return;
      }

      setTemplate(data);
    } catch (error) {
      console.error('Error loading SMS template:', error);
      toast({
        title: "Error",
        description: "Failed to load saved message template",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveTemplate = async (messageContent: string, phoneNumber: string) => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      if (template) {
        // Update existing template
        const { data, error } = await supabase
          .from('sms_templates')
          .update({ 
            message_content: messageContent,
            phone_number: phoneNumber,
            updated_at: new Date().toISOString()
          })
          .eq('id', template.id)
          .select('id, user_id, template_name, message_content, phone_number, created_at, updated_at')
          .single();

        if (error) throw error;
        setTemplate(data);
        
        toast({
          title: "Success",
          description: "Message template updated successfully",
        });
      } else {
        // Create new template
        const { data, error } = await supabase
          .from('sms_templates')
          .insert({
            user_id: user.id,
            template_name: 'review_request',
            message_content: messageContent,
            phone_number: phoneNumber
          })
          .select('id, user_id, template_name, message_content, phone_number, created_at, updated_at')
          .single();

        if (error) throw error;
        setTemplate(data);
        
        toast({
          title: "Success",
          description: "Message template saved successfully",
        });
      }
    } catch (error) {
      console.error('Error saving SMS template:', error);
      toast({
        title: "Error",
        description: "Failed to save message template",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    template,
    isLoading,
    isSaving,
    saveTemplate,
    loadTemplate
  };
};
