import { useState } from 'react';

interface AssistantPanelProps {
  role: 'STUDENT' | 'ADMIN';
}

export default function AssistantPanel({ role }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string }>>([
    {
      sender: 'assistant',
      text: role === 'ADMIN'
        ? '👋 Hello Organizer! I am your Festify AI Copilot. Ask me to check event stats, draft descriptions, list registrations, or compose announcements.'
        : '👋 Hi there! I am your Festify AI Guide. Ask me about upcoming events, free sessions after 6pm, your passes, or stage locations!'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setLoading(true);

    const token = localStorage.getItem('festify_token');

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ message: userMsg })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: data.reply || data.response || 'Done!' }]);
      } else {
        const err = await res.json();
        setMessages(prev => [...prev, { sender: 'assistant', text: `⚠️ ${err.error || 'Failed to communicate with assistant.'}` }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { sender: 'assistant', text: '⚠️ Assistant server unavailable.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-2xl p-6 shadow-[4px_4px_0px_#1A1A1A] font-fredoka">
      <div className="flex items-center gap-3 pb-4 mb-4 border-b-2 border-[#1A1A1A]/10">
        <span className="text-3xl">🤖</span>
        <div>
          <h3 className="text-xl font-black text-[#1A1A1A]">Festify AI Assistant</h3>
          <p className="text-xs text-[#1A1A1A]/60 font-semibold uppercase tracking-wider">
            {role === 'ADMIN' ? 'Organizer Copilot · Role-Scoped Tools' : 'Student Guide · Event & Pass Helper'}
          </p>
        </div>
      </div>

      <div className="h-80 overflow-y-auto space-y-3 mb-4 p-4 bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-xl">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-md p-3 rounded-xl border border-[#1A1A1A] text-xs font-semibold leading-relaxed shadow-sm ${
                m.sender === 'user'
                  ? 'bg-[#EC6484] text-[#1A1A1A]'
                  : 'bg-white text-[#1A1A1A]'
              }`}
            >
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-xl border border-[#1A1A1A] text-xs font-bold text-gray-500 animate-pulse">
              🤖 Thinking & executing tool calls...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={role === 'ADMIN' ? 'Ask to check stats or draft announcement...' : 'Ask e.g. "free chill events after 6pm"...'}
          className="flex-1 px-4 py-2.5 bg-white border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 bg-[#F4C430] text-[#1A1A1A] font-bold text-xs rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F06E38] hover:text-white transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
