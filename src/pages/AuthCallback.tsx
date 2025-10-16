import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get('token_hash');
      const type = params.get('type');
      const next = params.get('next') || '/auth';
      
      console.log('Auth callback params:', { tokenHash, type, next });
      
      if (type === 'recovery' && tokenHash) {
        // Exchange the token_hash for a session
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: 'recovery',
        });
        
        console.log('Verify OTP result:', { data, error });
        
        if (error) {
          console.error('Error verifying recovery token:', error);
          navigate('/auth#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired');
        } else {
          // Redirect to password reset form with session established
          navigate('/auth#type=recovery&access_token=verified');
        }
      } else {
        // Redirect to the next URL or default to auth page
        navigate(next);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <p className="text-lg">Processing authentication...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
