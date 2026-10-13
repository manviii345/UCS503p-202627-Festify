import { useState, useRef, useEffect } from 'react';

interface AssistantPanelProps {
  role: 'STUDENT' | 'ADMIN';
  onClose?: () => void;
}

export default function AssistantPanel({ role, onClose }: AssistantPanelProps) {
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'assistant'; text: string; tools?: string[] }>>([
    {
      sender: 'assistant',
      text:
        role === 'ADMIN'
          ? '👋 Hello Organizer! I am your Festify Copilot. Ask me to analyze event attendance, inspect attendee lists, draft polished descriptions, or generate push alerts.'
          : '👋 Hi! I am your Festify Campus Guide. Ask me to plan your day, locate stages, search events, or check your passes!',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastUsage, setLastUsage] = useState<{ inputTokens: number; outputTokens: number; approxCostUsd: number } | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const studentChips = [
    '🗓️ Plan my festival day',
    '🎟️ Check my registered passes',
    '📍 Where is the Auditorium?',
    '🚀 Show upcoming tech workshops',
  ];

  const adminChips = [
    '📊 Overview of my event stats',
    '👥 Who registered for my events?',
    '📢 Draft a reminder announcement',
    '💡 Draft event for a 24hr Hackathon',
  ];

  const chips = role === 'ADMIN' ? adminChips : studentChips;

  const sendMessage = async (promptText: string) => {
    if (!promptText.trim() || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { sender: 'user', text: promptText }]);
    setLoading(true);

    const token = localStorage.getItem('festify_token');

    try {
      const res = await fetch('/api/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ message: promptText }),
      });

      if (res.ok) {
        const data = await res.json();
        setMessages((prev) => [
          ...prev,
          {
            sender: 'assistant',
            text: data.reply || data.response || 'Operation completed.',
            tools: data.toolCallsMade || [],
          },
        ]);
        if (data.usage) {
          setLastUsage(data.usage);
        }
      } else {
        const err = await res.json();
        setMessages((prev) => [
          ...prev,
          { sender: 'assistant', text: `⚠️ ${err.error || 'Failed to communicate with assistant.'}` },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: 'assistant', text: '⚠️ Assistant server unavailable or connection timed out.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="bg-[#EFE8D8] border-2 border-[#1A1A1A] rounded-2xl p-5 shadow-[4px_4px_0px_#1A1A1A] font-fredoka flex flex-col h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b-2 border-[#1A1A1A]/10">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h3 className="text-lg font-black text-[#1A1A1A]">Festify AI Assistant</h3>
            <p className="text-[11px] text-[#1A1A1A]/60 font-semibold uppercase tracking-wider">
              {role === 'ADMIN' ? 'Organizer Copilot · Role-Scoped Tools' : 'Student Guide · Live Festival Helper'}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white border border-[#1A1A1A] flex items-center justify-center font-bold text-sm hover:bg-[#EC6484] hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Quick Action Starter Chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {chips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(chip.replace(/^[^\s]+\s/, ''))}
            disabled={loading}
            className="text-[11px] font-bold px-2.5 py-1 bg-white hover:bg-[#F4C430] border border-[#1A1A1A] rounded-lg transition-all shadow-[1px_1px_0px_#1A1A1A] active:translate-y-0.5"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-3 p-3.5 bg-[#F7F2E7] border-2 border-[#1A1A1A] rounded-xl">
        {messages.map((m, idx) => (
          <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] p-3 rounded-xl border border-[#1A1A1A] text-xs font-semibold leading-relaxed shadow-sm whitespace-pre-line ${
                m.sender === 'user' ? 'bg-[#EC6484] text-[#1A1A1A]' : 'bg-white text-[#1A1A1A]'
              }`}
            >
              {m.text}
              {m.tools && m.tools.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200 text-[10px] text-gray-500 font-mono">
                  ⚡ Tools: {m.tools.join(', ')}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-xl border border-[#1A1A1A] text-xs font-bold text-gray-600 animate-pulse flex items-center gap-2">
              <span className="animate-spin">⏳</span> AI is analyzing and calling tools...
            </div>
          </div>
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Token Usage Badge */}
      {lastUsage && (
        <div className="text-[10px] text-[#1A1A1A]/50 font-mono mb-2 flex justify-between px-1">
          <span>Tokens: {lastUsage.inputTokens + lastUsage.outputTokens}</span>
          <span>Cost: ~${lastUsage.approxCostUsd.toFixed(5)}</span>
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={
            role === 'ADMIN'
              ? 'Ask for event stats or draft an announcement...'
              : 'Ask "where is stage 1" or "plan my day"...'
          }
          className="flex-1 px-3.5 py-2.5 bg-white border-2 border-[#1A1A1A] rounded-xl text-xs font-semibold focus:outline-none focus:border-[#F06E38]"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2.5 bg-[#F4C430] text-[#1A1A1A] font-bold text-xs rounded-xl border-2 border-[#1A1A1A] shadow-[2px_2px_0px_#1A1A1A] hover:bg-[#F06E38] hover:text-white transition-colors disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
