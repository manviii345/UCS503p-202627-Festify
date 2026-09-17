import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (role: 'landing' | 'admin' | 'user') => void;
}

export default function LoginModal({ isOpen, onClose, onSuccess }: LoginModalProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

      // Save token
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
              <h2 className="text-2xl font-black text-[#1A1A1A]">Welcome Back</h2>
              <p className="text-xs font-semibold text-[#1A1A1A]/70 uppercase tracking-widest mt-1">Authenticate to continue</p>
            </div>

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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
