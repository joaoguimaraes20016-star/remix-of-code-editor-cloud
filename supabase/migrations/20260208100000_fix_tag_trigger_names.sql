-- ==============================
-- Migration: Fix Tag Trigger Event Names
-- Changes tag_added/tag_removed to lead_tag_added/lead_tag_removed
-- to match TriggerType definitions in types.ts
-- ==============================

CREATE OR REPLACE FUNCTION public.trigger_automation_on_contact_tag_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_added_tags TEXT[];
  v_removed_tags TEXT[];
BEGIN
  -- Calculate added and removed tags
  v_added_tags := ARRAY(SELECT unnest(COALESCE(NEW.tags, '{}')) EXCEPT SELECT unnest(COALESCE(OLD.tags, '{}')));
  v_removed_tags := ARRAY(SELECT unnest(COALESCE(OLD.tags, '{}')) EXCEPT SELECT unnest(COALESCE(NEW.tags, '{}')));
  
  -- Fire lead_tag_added event for each new tag
  IF array_length(v_added_tags, 1) > 0 THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'lead_tag_added',
      jsonb_build_object(
        'contactId', NEW.id,
        'addedTags', to_jsonb(v_added_tags),
        'allTags', to_jsonb(NEW.tags),
        'meta', jsonb_build_object(
          'tag', v_added_tags[1],  -- First added tag for constraint matching
          'tagName', v_added_tags[1]
        ),
        'lead', jsonb_build_object(
          'id', NEW.id,
          'name', NEW.name,
          'email', NEW.email,
          'phone', NEW.phone,
          'tags', to_jsonb(NEW.tags)
        )
      ),
      'lead_tag_added:' || NEW.id || ':' || array_to_string(v_added_tags, ',')
    );
  END IF;
  
  -- Fire lead_tag_removed event for each removed tag
  IF array_length(v_removed_tags, 1) > 0 THEN
    PERFORM fire_automation_event(
      NEW.team_id,
      'lead_tag_removed',
      jsonb_build_object(
        'contactId', NEW.id,
        'removedTags', to_jsonb(v_removed_tags),
        'allTags', to_jsonb(NEW.tags),
        'meta', jsonb_build_object(
          'tag', v_removed_tags[1],  -- First removed tag for constraint matching
          'tagName', v_removed_tags[1]
        ),
        'lead', jsonb_build_object(
          'id', NEW.id,
          'name', NEW.name,
          'email', NEW.email,
          'phone', NEW.phone,
          'tags', to_jsonb(NEW.tags)
        )
      ),
      'lead_tag_removed:' || NEW.id || ':' || array_to_string(v_removed_tags, ',')
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Also update any automations that were configured with old trigger names
UPDATE automations SET trigger_type = 'lead_tag_added' WHERE trigger_type = 'tag_added';
UPDATE automations SET trigger_type = 'lead_tag_removed' WHERE trigger_type = 'tag_removed';
