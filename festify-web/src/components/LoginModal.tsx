import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'landing' | 'admin' | 'user') => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setUsername('');
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchMode = (newMode: 'login' | 'signup') => {
    resetForm();
    setMode(newMode);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Save token — canonical key is 'festify_token'
      localStorage.setItem('festify_token', data.token);
      localStorage.setItem('festify_role', data.role);

      // Trigger navigation
      if (data.role === 'ADMIN') {
        onSuccess('admin');
      } else {
        onSuccess('user');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role: 'STUDENT' })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Signup failed');
      }

      // Save token — canonical key is 'festify_token'
      localStorage.setItem('festify_token', data.token);
      localStorage.setItem('festify_role', data.role);

      onSuccess('user');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-fredoka">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-2xl p-8 max-w-sm w-full shadow-[6px_6px_0px_#1A1A1A] relative"
          >
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 rounded-full border-2 border-[#1A1A1A] flex items-center justify-center font-bold hover:bg-[#EC6484] hover:text-white transition-colors"
            >
              ✕
            </button>
            
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#F4C430] border-[3px] border-dashed border-[#1A1A1A] text-[#1A1A1A] flex items-center justify-center text-2xl mx-auto mb-4 font-groovy shadow-[3px_3px_0px_#1A1A1A]">
                F
              </div>
              <h2 className="text-2xl font-black text-[#1A1A1A]">
                {mode === 'login' ? 'Welcome Back' : 'Join Festify'}
              </h2>
              <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-widest mt-1">
                {mode === 'login' ? 'Authenticate to continue' : 'Create your student account'}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex rounded-xl border-2 border-[#1A1A1A] overflow-hidden mb-5">
              <button
                type="button"
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                  mode === 'login'
                    ? 'bg-[#F06E38] text-white'
                    : 'bg-[#EFE8D8] text-[#1A1A1A]/70 hover:bg-[#E8E0CC]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider transition-colors border-l-2 border-[#1A1A1A] ${
                  mode === 'signup'
                    ? 'bg-[#F06E38] text-white'
                    : 'bg-[#EFE8D8] text-[#1A1A1A]/70 hover:bg-[#E8E0CC]'
                }`}
              >
                Sign Up
              </button>
            </div>

            {mode === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-3 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#EC6484]"
                    placeholder="admin or student"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-3 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#EC6484]"
                    placeholder="••••••••"
                  />
                </div>

                {error && (
                  <div className="p-3 bg-[#EC6484]/20 border border-[#EC6484] rounded-xl text-xs font-bold text-[#D94E28] text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-[#F06E38] text-white font-bold text-sm rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:bg-[#1A1A1A] transition-colors disabled:opacity-70 uppercase tracking-wider"
                >
                  {loading ? 'Authenticating...' : 'Sign In ➔'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Username</label>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    className="w-full p-3 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#EC6484]"
                    placeholder="Choose a username (min 3 chars)"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full p-3 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#EC6484]"
                    placeholder="Min 8 characters"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/70 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full p-3 bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#EC6484]"
                    placeholder="••••••••"
                  />
                </div>

                <p className="text-[10px] text-[#1A1A1A]/50 font-semibold text-center">
                  Accounts are created as <span className="text-[#F06E38]">STUDENT</span> role only.
                </p>

                {error && (
                  <div className="p-3 bg-[#EC6484]/20 border border-[#EC6484] rounded-xl text-xs font-bold text-[#D94E28] text-center">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 mt-2 bg-[#F06E38] text-white font-bold text-sm rounded-xl border-2 border-[#1A1A1A] shadow-[3px_3px_0px_#1A1A1A] hover:bg-[#1A1A1A] transition-colors disabled:opacity-70 uppercase tracking-wider"
                >
                  {loading ? 'Creating Account...' : 'Create Account ➔'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
