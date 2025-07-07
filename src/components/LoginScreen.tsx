import React, { useState, useEffect } from 'react';
import { User, Lock, AlertCircle, Building2, Database, Download, Filter, Star, Mail, BarChart3, Shield, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { activateDemoMode, isDemoMode } from '@/lib/demoConfig';
interface RateLimitData {
  attempts: number;
  lockedUntil: number | null;
}
const LoginScreen = () => {
  const [selectedUser, setSelectedUser] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const {
    signIn
  } = useAuth();
  const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes in milliseconds
  const MAX_ATTEMPTS = 3;
  const userOptions = [{
    value: 'jamie',
    email: 'jamie@ostleelectrical.co.nz',
    label: 'Jamie (Developer)',
    role: 'Developer'
  }, {
    value: 'kyron',
    email: 'kyron@ostleelectrical.co.nz',
    label: 'Kyron (User)',
    role: 'User'
  }];

  // Rate limiting functions
  const getRateLimitKey = (email: string) => `rate_limit_${email}`;
  const getRateLimitData = (email: string): RateLimitData => {
    const key = getRateLimitKey(email);
    const stored = localStorage.getItem(key);
    if (!stored) {
      return {
        attempts: 0,
        lockedUntil: null
      };
    }
    try {
      const data = JSON.parse(stored);
      // Check if lockout has expired
      if (data.lockedUntil && Date.now() > data.lockedUntil) {
        // Lockout expired, reset data
        localStorage.removeItem(key);
        return {
          attempts: 0,
          lockedUntil: null
        };
      }
      return data;
    } catch {
      localStorage.removeItem(key);
      return {
        attempts: 0,
        lockedUntil: null
      };
    }
  };
  const setRateLimitData = (email: string, data: RateLimitData) => {
    const key = getRateLimitKey(email);
    localStorage.setItem(key, JSON.stringify(data));
  };
  const clearRateLimitData = (email: string) => {
    const key = getRateLimitKey(email);
    localStorage.removeItem(key);
  };
  const checkRateLimit = (email: string) => {
    if (!email) return {
      isLocked: false,
      timeRemaining: 0
    };
    const data = getRateLimitData(email);
    if (data.lockedUntil && Date.now() < data.lockedUntil) {
      const timeRemaining = Math.ceil((data.lockedUntil - Date.now()) / 1000);
      return {
        isLocked: true,
        timeRemaining
      };
    }
    return {
      isLocked: false,
      timeRemaining: 0
    };
  };
  const recordFailedAttempt = (email: string) => {
    if (!email) return;
    const data = getRateLimitData(email);
    const newAttempts = data.attempts + 1;
    if (newAttempts >= MAX_ATTEMPTS) {
      // Lock the account
      const lockedUntil = Date.now() + LOCKOUT_DURATION;
      setRateLimitData(email, {
        attempts: newAttempts,
        lockedUntil
      });
      return {
        isLocked: true,
        timeRemaining: Math.ceil(LOCKOUT_DURATION / 1000)
      };
    } else {
      // Just increment attempts
      setRateLimitData(email, {
        attempts: newAttempts,
        lockedUntil: null
      });
      return {
        isLocked: false,
        timeRemaining: 0
      };
    }
  };

  // Check rate limit when email changes
  useEffect(() => {
    if (email) {
      const {
        isLocked: locked,
        timeRemaining
      } = checkRateLimit(email);
      setIsLocked(locked);
      setCountdown(timeRemaining);
      if (locked) {
        setError(`Account temporarily locked due to too many failed attempts. Try again in ${Math.ceil(timeRemaining / 60)} minutes.`);
      } else {
        setError('');
      }
    } else {
      setIsLocked(false);
      setCountdown(0);
      setError('');
    }
  }, [email]);

  // Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isLocked && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => {
          const newCountdown = prev - 1;
          if (newCountdown <= 0) {
            setIsLocked(false);
            setError('');
            return 0;
          }
          const minutes = Math.ceil(newCountdown / 60);
          setError(`Account temporarily locked due to too many failed attempts. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
          return newCountdown;
        });
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isLocked, countdown]);
  const handleUserSelect = (value: string) => {
    const user = userOptions.find(u => u.value === value);
    if (user) {
      setSelectedUser(value);
      setEmail(user.email);
      setPassword('');
      setError('');
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[LoginScreen] Login attempt:', {
      email,
      selectedUser
    });
    if (!email || !password) {
      setError('Please select a user and enter password');
      return;
    }

    // Double check we're not in demo mode before allowing login
    if (isDemoMode()) {
      setError('Cannot sign in while in demo mode. Please exit demo mode first.');
      return;
    }

    // Check rate limit before attempting login
    const {
      isLocked: locked
    } = checkRateLimit(email);
    if (locked) {
      return; // Error message already set by useEffect
    }
    setIsLoading(true);
    setError('');
    try {
      console.log('[LoginScreen] Attempting sign in for:', email);
      await signIn(email, password);
      console.log('[LoginScreen] Sign in successful');

      // Clear rate limit data on successful login
      clearRateLimitData(email);
      setIsLocked(false);
      setCountdown(0);
    } catch (err) {
      console.error('[LoginScreen] Sign in failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      console.log('[LoginScreen] Error message:', errorMessage);

      // Record failed attempt and check if account should be locked
      const {
        isLocked: nowLocked,
        timeRemaining
      } = recordFailedAttempt(email);
      if (nowLocked) {
        setIsLocked(true);
        setCountdown(timeRemaining);
        const minutes = Math.ceil(timeRemaining / 60);
        setError(`Too many failed attempts. Account locked for ${minutes} minute${minutes !== 1 ? 's' : ''}.`);
      } else {
        const data = getRateLimitData(email);
        const remainingAttempts = MAX_ATTEMPTS - data.attempts;
        if (remainingAttempts > 0) {
          setError(`${errorMessage}. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.`);
        } else {
          setError(errorMessage);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };
  const handleDemoMode = () => {
    console.log('[LoginScreen] Activating demo mode');
    activateDemoMode();
  };
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleLogin(e as any);
    }
  };
  const featureBadges = [{
    icon: Database,
    title: 'Auto-Import from Xero',
    description: 'Instantly sync customer and invoice data into the CRM.'
  }, {
    icon: Filter,
    title: 'One-Click Customer Filters',
    description: 'Filter by top spenders, job value, invoice count. Gold/Silver/Bronze badges.'
  }, {
    icon: Star,
    title: 'One-Tap Google Review Requests',
    description: 'Instantly send review requests via SMS with a single click.'
  }, {
    icon: Download,
    title: 'AI-Powered Keyword Detection',
    description: 'AI scans job history to extract service keywords for smart tagging.'
  }, {
    icon: Mail,
    title: 'Smart Campaign Messaging',
    description: 'Auto-generate SMS/email campaigns based on AI-detected keywords.'
  }, {
    icon: BarChart3,
    title: 'Analytics Dashboard',
    description: 'Visual graphs for revenue, job types, customer ranking, and reviews.'
  }];
  return <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900 flex relative overflow-hidden">
      {/* Hero Background Image */}
      <div className="absolute inset-0 bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: `url('/lovable-uploads/662ee6c2-fdc7-46e0-9b21-d87961728ee4.png')`
    }} />
      
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-800/80 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/40 via-transparent to-slate-900/20" />

      {/* Left Side - Hero Content with Feature Badges */}
      <div className="flex-1 flex flex-col justify-center px-8 lg:px-16 py-12 relative z-10">
        <div className="max-w-2xl">
          {/* Logo and Brand */}
          <div className="flex items-center mb-12">
            <div className="flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary via-emerald-500 to-green-600 rounded-3xl shadow-2xl mr-6 ring-4 ring-primary/30 backdrop-blur-sm">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-emerald-200 to-green-300 bg-clip-text text-transparent">
                ToolBox CRM
              </h1>
              <p className="text-emerald-200 text-xl font-medium">Customer Data & Engagement</p>
            </div>
          </div>

          {/* Main Heading */}
          <h2 className="text-5xl font-bold text-white mb-8 leading-tight">
            Customer Data at Your Fingertips —
            <span className="text-transparent bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text block">
              Instantly Sorted, Always Actionable.
            </span>
            
          </h2>

          <p className="text-xl text-emerald-100 mb-12 leading-relaxed font-medium">ToolBox CRM handles your customer data, follow-ups, and marketing — so you can stay on the tools.</p>

          {/* Feature Badges Grid */}
          <div className="grid grid-cols-2 gap-4 mb-8">
            {featureBadges.map((feature, index) => <div key={feature.title} className="group p-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 hover:bg-white/15 transition-all duration-300 transform hover:scale-105" style={{
            animationDelay: `${index * 100}ms`
          }}>
                <div className="flex items-start space-x-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-emerald-400/20 to-green-500/20 rounded-xl group-hover:from-emerald-400/30 group-hover:to-green-500/30 transition-all duration-300">
                    <feature.icon className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white mb-1 group-hover:text-emerald-200 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xs text-emerald-200/80 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>)}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-8 py-12 relative z-10">
        <div className="w-full max-w-md">
          <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-2xl ring-1 ring-white/20">
            <CardHeader className="text-center pb-8">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary via-emerald-600 to-green-700 rounded-2xl mx-auto mb-6 shadow-xl ring-4 ring-primary/20">
                <User className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 mb-2">Welcome Back</CardTitle>
              <CardDescription className="text-slate-600">
                Access your trades management dashboard
              </CardDescription>
              
              {/* Rate Limiting Indicator */}
              {isLocked && <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-orange-700">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Account Temporarily Locked</span>
                  </div>
                </div>}
            </CardHeader>
            
            <CardContent className="space-y-6">
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">Select Account</label>
                  <Select value={selectedUser} onValueChange={handleUserSelect} disabled={isLocked}>
                    <SelectTrigger className="w-full h-11 border-slate-300 focus:border-primary focus:ring-primary bg-white transition-all duration-200">
                      <SelectValue placeholder="Choose your account" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-slate-200 shadow-xl">
                      {userOptions.map(user => <SelectItem key={user.value} value={user.value} className="hover:bg-slate-50">
                          {user.label}
                        </SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">Email Address</label>
                  <Input type="email" value={email} readOnly placeholder="Select account above" className="bg-slate-50 border-slate-300 h-11" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-800">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <Input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyPress={handleKeyPress} placeholder="Enter password" className="pl-10 h-11 border-slate-300 focus:border-primary focus:ring-primary bg-white transition-all duration-200" disabled={isLocked} />
                  </div>
                </div>

                {error && <Alert variant={isLocked ? "default" : "destructive"} className={isLocked ? "border-orange-300 bg-orange-50" : "border-red-300 bg-red-50"}>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className={isLocked ? "text-orange-800" : "text-red-800"}>
                      {error}
                    </AlertDescription>
                  </Alert>}

                <Button type="submit" className="w-full h-11 bg-gradient-to-r from-primary via-emerald-600 to-green-700 hover:from-primary/90 hover:via-emerald-600/90 hover:to-green-700/90 text-white font-semibold shadow-lg transition-all duration-300 transform hover:scale-[1.02]" disabled={isLoading || !selectedUser || !password || isLocked}>
                  {isLoading ? <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Signing in...</span>
                    </div> : isLocked ? 'Account Locked' : 'Access Dashboard'}
                </Button>
              </form>

              {/* Demo Mode Button */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-500">Or</span>
                </div>
              </div>

              <Button onClick={handleDemoMode} className="w-full h-12 bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 hover:from-green-600 hover:via-green-700 hover:to-emerald-700 text-white font-bold text-lg transition-all duration-3000 transform hover:scale-[1.02] animate-pulse shadow-2xl ring-2 ring-green-400/50">
                <Play className="h-5 w-5 mr-3" />
                <span className="relative">
                  Click Me - Try Demo!
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></span>
                </span>
              </Button>

              <p className="text-xs text-center text-slate-500">
                Demo mode lets you explore ToolBox CRM with sample data
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>;
};
export default LoginScreen;