import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Logo } from '@/components/Logo';
import { Separator } from '@/components/ui/separator';
import { Eye, EyeOff, CheckCircle, Zap, BarChart3 } from 'lucide-react';
import stackitLogo from '@/assets/stackit-logo.png';
import authHeroBg from '@/assets/auth-hero-bg.png';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, resetPassword } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [signInData, setSignInData] = useState({ email: '', password: '' });
  const [signUpData, setSignUpData] = useState({ email: '', password: '', fullName: '', creatorCode: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [linkExpired, setLinkExpired] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteTeamName, setInviteTeamName] = useState('');
  const [inviteMode, setInviteMode] = useState(false);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Check URL params immediately to set initial tab
  const urlParams = new URLSearchParams(location.search);
  const hasInvite = urlParams.get('invite');
  const hasCreator = urlParams.get('creator');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(hasInvite || hasCreator ? 'signup' : 'signin');
  const [isCreatorUpgrade, setIsCreatorUpgrade] = useState(false);
  const [creatorCode, setCreatorCode] = useState('');

  useEffect(() => {
    const checkAuthAndInvite = async () => {
      const params = new URLSearchParams(location.search);
      const token = params.get('invite');
      const creatorParam = params.get('creator');
      
      if (import.meta.env.DEV) {
        console.log('=== AUTH PAGE LOADED ===');
        console.log('Full URL:', window.location.href);
        console.log('Invite token:', token);
      }
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      // Handle creator upgrade
      if (creatorParam === 'true') {
        if (session?.user) {
          setSignUpData({ email: session.user.email || '', password: '', fullName: '', creatorCode: '' });
          setIsCreatorUpgrade(true);
          setActiveTab('signup');
        }
        return;
      }
      
      // If user is logged in and NO invite token, redirect to dashboard
      if (session?.user && !token) {
        if (import.meta.env.DEV) {
          console.log('Logged in user without invite, redirecting to dashboard');
        }
        navigate('/dashboard');
        return;
      }
      
      // If there's an invite token
      if (token) {
        // User is logged in with invite token - auto accept
        if (session?.user) {
          if (import.meta.env.DEV) {
            console.log('Logged in user with invite, auto-accepting...');
          }
          
          try {
            const { data: invitation, error: inviteError } = await supabase
              .from('team_invitations')
              .select('team_id, role, id, email, expires_at')
              .eq('token', token)
              .is('accepted_at', null)
              .maybeSingle();

            if (inviteError || !invitation) {
              if (import.meta.env.DEV) {
                console.error('Invitation error:', inviteError);
              }
              toast({
                title: 'Invalid invitation',
                description: 'This invitation link is not valid or has already been used.',
                variant: 'destructive',
              });
              navigate('/dashboard');
              return;
            }

            // Check expiration
            if (new Date(invitation.expires_at) < new Date()) {
              toast({
                title: 'Invitation expired',
                description: 'This invitation link has expired.',
                variant: 'destructive',
              });
              navigate('/dashboard');
              return;
            }

            // Check if already a team member
            const { data: existingMember } = await supabase
              .from('team_members')
              .select('id')
              .eq('team_id', invitation.team_id)
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!existingMember) {
              // Add to team
              const { error: memberError } = await supabase
                .from('team_members')
                .insert({
                  team_id: invitation.team_id,
                  user_id: session.user.id,
                  role: invitation.role,
                });

              if (memberError) {
                if (import.meta.env.DEV) {
                  console.error('Error adding team member:', memberError);
                }
                throw memberError;
              }

              // Mark as accepted
              await supabase
                .from('team_invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invitation.id);

              toast({
                title: '🎉 Welcome to the team!',
                description: 'Taking you to your team dashboard...',
              });
            } else {
              toast({
                title: 'Already a member',
                description: 'You are already a member of this team.',
              });
            }

            setTimeout(() => {
              navigate(`/team/${invitation.team_id}`);
            }, 1000);
            
          } catch (err) {
            if (import.meta.env.DEV) {
              console.error('Error processing invitation:', err);
            }
            toast({
              title: 'Error',
              description: 'Could not process invitation. Please try again.',
              variant: 'destructive',
            });
            navigate('/dashboard');
          }
          return;
        }

        // User NOT logged in with invite - show signup form
        if (import.meta.env.DEV) {
          console.log('Not logged in, showing invite signup form');
        }
        setInviteMode(true);
        setInviteToken(token);
        setInviteLoading(true);
        setActiveTab('signup');
        
        const { data, error } = await supabase
          .from('team_invitations')
          .select('*, teams(name)')
          .eq('token', token)
          .is('accepted_at', null)
          .maybeSingle();
        
        if (error || !data) {
          toast({
            title: 'Invalid invitation',
            description: 'This invitation link is not valid or has already been used.',
            variant: 'destructive',
          });
          setInviteMode(false);
          setInviteToken(null);
          setInviteLoading(false);
          return;
        }

        if (new Date(data.expires_at) < new Date()) {
          toast({
            title: 'Invitation expired',
            description: 'This invitation link has expired.',
            variant: 'destructive',
          });
          setInviteMode(false);
          setInviteToken(null);
          setInviteLoading(false);
          return;
        }

        setInviteEmail(data.email);
        setInviteTeamName((data.teams as any)?.name || 'the team');
        setSignUpData({ email: data.email, password: '', fullName: '', creatorCode: '' });
        setInviteLoading(false);
        
        toast({
          title: 'Welcome!',
          description: `You've been invited to join ${(data.teams as any)?.name}`,
        });
        return;
      }
    };

    checkAuthAndInvite();

    // Set up auth state listener for password recovery
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsResettingPassword(true);
        setUserEmail(session?.user?.email || '');
        setNewPassword('');
        setConfirmPassword('');
      }
    });

    // Check for password recovery in hash
    const checkCurrentState = async () => {
      const hash = window.location.hash;
      
      if (hash.includes('type=recovery')) {
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session?.user?.email) {
            setIsResettingPassword(true);
            setUserEmail(session.user.email);
          }
        }, 1000);
      }
      
      if (hash.includes('error=access_denied')) {
        setShowResetForm(true);
        toast({
          title: 'Link expired',
          description: 'Please request a new password reset link.',
          variant: 'destructive',
        });
        window.history.replaceState({}, '', '/auth');
      }
    };
    
    checkCurrentState();

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, location, navigate]);

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      
      if (error) {
        toast({
          title: 'Error signing in with Google',
          description: error.message,
          variant: 'destructive',
        });
      }
    } catch (err: any) {
      toast({
        title: 'Error signing in with Google',
        description: err.message || 'An unexpected error occurred',
        variant: 'destructive',
      });
    }
    setLoading(false);
  };


  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signIn(signInData.email, signInData.password);
    
    if (error) {
      toast({
        title: 'Error signing in',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // Check if this user has a pending invitation
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user && inviteToken) {
      try {
        const { data: invitation } = await supabase
          .from('team_invitations')
          .select('team_id, role, id')
          .eq('token', inviteToken)
          .eq('email', session.user.email?.toLowerCase())
          .is('accepted_at', null)
          .maybeSingle();

        if (invitation) {
          // Add user to team
          await supabase.from('team_members').insert({
            team_id: invitation.team_id,
            user_id: session.user.id,
            role: invitation.role,
          });

          // Mark invitation as accepted
          await supabase
            .from('team_invitations')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invitation.id);

          toast({
            title: '🎉 Welcome to the team!',
            description: 'Taking you to your dashboard...',
          });

          setTimeout(() => {
            navigate(`/team/${invitation.team_id}`);
          }, 1000);
          return;
        }
      } catch (err) {
        console.error('Error processing invitation on sign in:', err);
      }
    }

    toast({
      title: 'Welcome back!',
      description: 'Successfully signed in',
    });
    navigate('/dashboard');
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSignUp called, inviteToken:', inviteToken);
    setLoading(true);
    
    // Handle creator upgrade
    if (isCreatorUpgrade) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ account_type: 'creator' })
          .eq('id', user.id);

        if (updateError) {
          toast({
            title: 'Error upgrading account',
            description: updateError.message,
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        toast({
          title: 'Success!',
          description: 'You are now a creator. You can create teams.',
        });
        navigate('/dashboard');
        setLoading(false);
        return;
      }
    }
    
    // Show initial feedback
    if (inviteToken) {
      toast({
        title: 'Creating your account...',
        description: 'Please wait while we set up your profile.',
      });
    }
    
    // Validate creator code if provided
    let hasCreatorCode = false;
    if (signUpData.creatorCode && signUpData.creatorCode.trim()) {
      const { data: validCode, error: codeError } = await supabase
        .from('creator_codes')
        .select('id, uses_count')
        .eq('code', signUpData.creatorCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (codeError || !validCode) {
        toast({
          title: 'Invalid creator code',
          description: 'The creator code you entered is not valid.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      hasCreatorCode = true;
      
      // Increment uses count
      await supabase
        .from('creator_codes')
        .update({ uses_count: validCode.uses_count + 1 })
        .eq('id', validCode.id);
    }
    
    const { data: signUpResult, error } = await signUp(signUpData.email, signUpData.password, signUpData.fullName, signUpData.creatorCode || undefined);
    
    console.log('signUp result:', { signUpResult, error });
    
    if (error) {
      // If user already exists and has an invitation, sign them in instead
      if (error.message?.includes('already registered') && inviteToken) {
        const { error: signInError } = await signIn(signUpData.email, signUpData.password);
        
        if (signInError) {
          toast({
            title: 'Error signing in',
            description: 'Account exists but password is incorrect. Please reset your password or contact support.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          toast({
            title: 'Error',
            description: 'Could not get user session. Please try again.',
            variant: 'destructive',
          });
          setLoading(false);
          return;
        }

        // Process invitation for existing user
        try {
          const { data: invitation } = await supabase
            .from('team_invitations')
            .select('team_id, role, id')
            .eq('token', inviteToken)
            .maybeSingle();

          if (invitation) {
            // Check if user is already a team member
            const { data: existingMember } = await supabase
              .from('team_members')
              .select('id')
              .eq('team_id', invitation.team_id)
              .eq('user_id', session.user.id)
              .maybeSingle();

            if (!existingMember) {
              // Insert team member
              const { error: insertError } = await supabase.from('team_members').insert({
                team_id: invitation.team_id,
                user_id: session.user.id,
                role: invitation.role,
              });

              if (insertError) {
                console.error('Error inserting team member:', insertError);
                throw insertError;
              }

              // Mark invitation as accepted
              await supabase
                .from('team_invitations')
                .update({ accepted_at: new Date().toISOString() })
                .eq('id', invitation.id);
            }

            toast({
              title: 'Welcome to the team!',
              description: 'You have been added to the team successfully.',
            });
            
            setTimeout(() => {
              navigate(`/team/${invitation.team_id}`);
            }, 500);
          }
        } catch (err) {
          console.error('Error processing invitation:', err);
          toast({
            title: 'Error joining team',
            description: 'There was a problem adding you to the team. Please contact support.',
            variant: 'destructive',
          });
        }
        
        setLoading(false);
        return;
      }

      toast({
        title: 'Error signing up',
        description: error.message,
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }

    // If user signed up with an invitation, process it immediately
    if (inviteToken && signUpResult?.user) {
      console.log('Account created for invited user:', signUpResult.user.id);
      
      // Set account_type to 'invited' for users signing up with invitation
      await supabase
        .from('profiles')
        .update({ account_type: 'invited' })
        .eq('id', signUpResult.user.id);
      
      // Process invitation for new user (they're already logged in)
      try {
        const { data: invitation } = await supabase
          .from('team_invitations')
          .select('team_id, role, id')
          .eq('token', inviteToken)
          .maybeSingle();

        if (invitation) {
          // Add user to team
          const { error: insertError } = await supabase.from('team_members').insert({
            team_id: invitation.team_id,
            user_id: signUpResult.user.id,
            role: invitation.role,
          });

          if (insertError) {
            console.error('Error inserting team member:', insertError);
            throw insertError;
          }

          // Mark invitation as accepted
          await supabase
            .from('team_invitations')
            .update({ accepted_at: new Date().toISOString() })
            .eq('id', invitation.id);

          toast({
            title: '🎉 Welcome to the team!',
            description: `You're all set! Taking you to your dashboard...`,
          });

          setTimeout(() => {
            navigate(`/team/${invitation.team_id}`);
          }, 1000);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error processing invitation:', err);
        toast({
          title: 'Error joining team',
          description: 'There was a problem adding you to the team. Please contact support.',
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }
    } else {
      // Set account_type to 'creator' for regular signups with code
      if (signUpResult?.user) {
        await supabase
          .from('profiles')
          .update({ account_type: 'creator' })
          .eq('id', signUpResult.user.id);
      }
      
      toast({
        title: 'Check your email!',
        description: 'We sent you a confirmation link. Please verify your email to continue.',
      });
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      toast({
        title: 'Error sending reset email',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Check your email!',
        description: 'We sent you a password reset link.',
      });
      setShowResetForm(false);
      setResetEmail('');
    }
    
    setLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are identical.',
        variant: 'destructive',
      });
      return;
    }
    
    if (newPassword.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      toast({
        title: 'Error updating password',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Password updated!',
        description: 'Your password has been successfully updated.',
      });
      setIsResettingPassword(false);
      setNewPassword('');
      setConfirmPassword('');
      navigate('/dashboard');
    }
    
    setLoading(false);
  };

  // Render sign in form
  const renderSignInForm = () => (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="signin-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="signin-email"
          type="email"
          placeholder="you@company.com"
          value={signInData.email}
          onChange={(e) => setSignInData({ ...signInData, email: e.target.value })}
          required
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="signin-password">
          Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={signInData.password}
            onChange={(e) => setSignInData({ ...signInData, password: e.target.value })}
            required
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setShowResetForm(true)}
          className="text-sm text-primary hover:underline"
        >
          Forgot password?
        </button>
      </div>
      
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  );

  // Render sign up form
  const renderSignUpForm = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      {!inviteToken && (
        <div className="space-y-2">
          <Label htmlFor="creator-code">Creator Code (Optional)</Label>
          <Input
            id="creator-code"
            type="text"
            placeholder="Enter creator code to create teams"
            value={signUpData.creatorCode}
            onChange={(e) => setSignUpData({ ...signUpData, creatorCode: e.target.value })}
            className="h-11"
          />
        </div>
      )}
      
      <div className="space-y-2">
        <Label htmlFor="signup-name">
          Full Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="John Doe"
          value={signUpData.fullName}
          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
          required
          className="h-11"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-email">
          Email <span className="text-destructive">*</span>
        </Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@company.com"
          value={signUpData.email}
          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
          required
          className="h-11"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="signup-password">
          Password <span className="text-destructive">*</span>
        </Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 6 characters"
            value={signUpData.password}
            onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
            required
            minLength={6}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Creating account...' : 'Create account'}
      </Button>
    </form>
  );

  // Render reset password form
  const renderResetForm = () => (
    <form onSubmit={handleResetPassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          placeholder="Enter your email"
          required
          className="h-11"
        />
      </div>
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Sending...' : 'Send Reset Link'}
      </Button>
      <button
        type="button"
        onClick={() => setShowResetForm(false)}
        className="text-sm text-primary hover:underline w-full text-center"
      >
        Back to Sign In
      </button>
    </form>
  );

  // Render update password form (for password recovery)
  const renderUpdatePasswordForm = () => (
    <form onSubmit={handleUpdatePassword} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email-display">Email</Label>
        <Input
          id="reset-email-display"
          type="email"
          value={userEmail}
          disabled
          className="bg-muted h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Enter new password"
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          placeholder="Confirm new password"
          className="h-11"
        />
      </div>
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );

  // Render invite mode form
  const renderInviteForm = () => (
    <form onSubmit={handleSignUp} className="space-y-4">
      <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 space-y-3">
        <h3 className="font-semibold text-lg">Welcome to {inviteTeamName}! 🎉</h3>
        <div className="space-y-1 text-sm">
          <p className="flex items-center gap-2">
            <span className="font-semibold">📧 Email:</span>
            <span className="text-muted-foreground">{inviteEmail}</span>
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          Create your account to get started with the team
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="invite-fullname">Your Full Name</Label>
        <Input
          id="invite-fullname"
          type="text"
          placeholder="John Doe"
          value={signUpData.fullName}
          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
          required
          autoFocus
          className="h-11"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="invite-password">Choose Your Password</Label>
        <div className="relative">
          <Input
            id="invite-password"
            type={showPassword ? "text" : "password"}
            placeholder="Minimum 6 characters"
            value={signUpData.password}
            onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
            required
            minLength={6}
            className="h-11 pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <Button type="submit" className="w-full h-11" disabled={loading}>
        {loading ? 'Creating your account...' : 'Create Account & Join Team'}
      </Button>
      
      <div className="text-center pt-2 border-t">
        <p className="text-sm text-muted-foreground">
          Already have an account?{' '}
          <button
            type="button"
            onClick={() => {
              setInviteMode(false);
              setActiveTab('signin');
              setSignInData({ email: inviteEmail, password: '' });
            }}
            className="text-primary hover:underline font-medium"
          >
            Sign in here
          </button>
        </p>
      </div>
    </form>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-8 md:px-16 lg:px-20 xl:px-24 py-8 md:py-12 bg-background">
        <div className="w-full max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-8">
            <Logo size="medium" showText />
          </div>
          
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              {isResettingPassword 
                ? 'Reset Password' 
                : inviteMode 
                ? '🎉 Welcome!' 
                : activeTab === 'signin' 
                ? 'Welcome back' 
                : 'Create account'}
            </h1>
            <p className="text-muted-foreground">
              {isResettingPassword 
                ? 'Enter your new password below'
                : inviteMode 
                ? `Join ${inviteTeamName} on Stackit`
                : activeTab === 'signin'
                ? 'Sign in to your account to continue'
                : 'Get started with Stackit today'}
            </p>
          </div>
          
          {inviteLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin text-4xl">⏳</div>
            </div>
          ) : inviteMode ? (
            renderInviteForm()
          ) : isResettingPassword ? (
            renderUpdatePasswordForm()
          ) : (
            <>
              {/* Social Buttons - Only show for sign in */}
              {activeTab === 'signin' && !showResetForm && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <Button 
                      variant="outline" 
                      className="h-11"
                      onClick={handleGoogleSignIn}
                      disabled={loading}
                    >
                      <img src="/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
                      Google
                    </Button>
                    <Button 
                      variant="outline" 
                      className="h-11"
                      disabled
                    >
                      <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23" fill="none">
                        <path fill="#f35325" d="M1 1h10v10H1z"/>
                        <path fill="#81bc06" d="M12 1h10v10H12z"/>
                        <path fill="#05a6f0" d="M1 12h10v10H1z"/>
                        <path fill="#ffba08" d="M12 12h10v10H12z"/>
                      </svg>
                      Outlook
                    </Button>
                  </div>
                  
                  {/* Divider */}
                  <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">
                        or continue with email
                      </span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Form */}
              {showResetForm ? renderResetForm() : activeTab === 'signin' ? renderSignInForm() : renderSignUpForm()}
              
              {/* Switch between sign in/up */}
              {!showResetForm && (
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  {activeTab === 'signin' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('signup')}
                        className="text-primary hover:underline font-medium"
                      >
                        Create an account
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => setActiveTab('signin')}
                        className="text-primary hover:underline font-medium"
                      >
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              )}
            </>
          )}
        </div>
      </div>
      
      {/* Right Side - Hero (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden items-center justify-center p-12 bg-slate-950">
        {/* Animated Background Image */}
        <img 
          src={authHeroBg}
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-45 animate-float-bg"
        />
        
        {/* Subtle overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/40 via-transparent to-slate-950/40" />
        
        {/* Center Content - Logo & Headline at top, Card below */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Copy - Now at TOP */}
          <div className="text-center max-w-md mb-8">
            <img src={stackitLogo} alt="Stackit" className="w-16 h-16 mx-auto mb-1" />
            <span className="text-white font-bold text-xl tracking-tight mb-6 block">Stackit</span>
            <h2 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">
              The Operating System for Scaling Digital Offers.
            </h2>
            <p className="text-slate-300 text-sm drop-shadow-md">
              Build funnels, get leads, book calls, manage deals, and automate follow-ups — all inside Stackit.
            </p>
          </div>
          
          {/* Feature Card - Now BELOW */}
          <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 w-[340px] shadow-2xl">
            <CardContent className="p-6">
              {/* Stats Row - Matching actual system metrics */}
              <div className="grid grid-cols-3 gap-3 mb-6">
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-emerald-400">$48K</p>
                  <p className="text-xs text-slate-400">Revenue</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-blue-400">$12K</p>
                  <p className="text-xs text-slate-400">MRR</p>
                </div>
                <div className="bg-slate-800/50 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-violet-400">32%</p>
                  <p className="text-xs text-slate-400">Close Rate</p>
                </div>
              </div>
              
              {/* Feature Items - Matching actual system modules */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Funnels & Lead Capture</p>
                    <p className="text-xs text-slate-400">Build & publish in minutes</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">CRM & Pipeline</p>
                    <p className="text-xs text-slate-400">Manage deals & contacts</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-violet-500/20 flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-violet-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-white">Automations</p>
                    <p className="text-xs text-slate-400">Follow-ups on autopilot</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
