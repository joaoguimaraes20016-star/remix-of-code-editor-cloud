-- Create trigger to auto-create confirmation tasks when appointments are inserted
CREATE TRIGGER trigger_auto_create_confirmation_task
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_confirmation_task();