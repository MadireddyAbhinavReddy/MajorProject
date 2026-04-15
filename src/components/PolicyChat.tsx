import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  sources?: string[];
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'What are the NAAQS annual limits for PM2.5 and NO₂?',
  'What are the GRAP Stage IV emergency restrictions in Delhi-NCR?',
  'What is the EC penalty formula for Red category industries under CPCB 2017?',
  'What consent timelines apply for Red vs Green category industries?',
  'What are Punjab\'s stubble burning prevention measures for 2026-27?',
  'What does the Environment Protection Act 1986 say about penalties for violations?',
  'What are the key obligations under E-Waste Management Rules 2022?',
  'How does climate change affect health and disease burden in India per NPCCHH?',
];

const PolicyChat: React.FC = () => {
  const [input, setInput]       = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = { id: Date.now(), role: 'user', text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: text }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.answer,
        sources: data.sources ?? [],
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: "Couldn't reach the backend. Once it's running on localhost:8000, I can answer questions grounded in official Indian environmental documents — covering core laws (EPA 1986, Air/Water Acts), NAAQS standards, GRAP Delhi restrictions, CPCB penalty formulas, consent procedures, waste management rules, and climate health data. Note: I explain what the law says, not real-time AQI readings or legal advice.",
        timestamp: new Date(),
      }]);
    }

    setLoading(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center">
            <Sparkles size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clarity.AI — Policy Assistant</h1>
            <p className="text-gray-500 text-sm">Grounded in official Indian environmental law — laws, standards, penalties, consent norms, waste rules, and climate data. Cites sources, never guesses.</p>
          </div>
        </div>
      </div>

      {/* Empty state — centered with input bar in the middle of the screen */}
      {messages.length === 0 && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
          <div className="w-full max-w-2xl text-center mb-6">
            <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Bot size={28} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-1">How can I help you?</h2>
            <p className="text-gray-500 text-sm max-w-md mx-auto">
              Ask about pollution standards, industry compliance, CPCB penalties, consent procedures, waste management rules, or climate health impacts — all grounded in official government documents.
            </p>
          </div>

          {/* Input bar — centered, prominent */}
          <div className="w-full max-w-2xl mb-5">
            <div className="flex gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="e.g. What is the penalty for EPR non-compliance? What does GRAP Stage IV restrict?"
                className="flex-1 text-sm focus:outline-none bg-transparent"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 text-white rounded-xl flex items-center gap-2 text-sm font-medium transition-colors shrink-0"
              >
                {loading ? <Loader size={15} className="animate-spin" /> : <Send size={15} />}
                Send
              </button>
            </div>
          </div>

          {/* Suggested questions */}
          <div className="grid grid-cols-2 gap-2 w-full max-w-2xl">
            {SUGGESTED_QUESTIONS.map(q => (
              <button
                key={q}
                onClick={() => sendMessage(q)}
                className="text-left px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages area — only shown once chat has started */}
      {messages.length > 0 && (
        <>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className="max-w-4xl mx-auto space-y-4">

              {messages.map(msg => (
                <div key={msg.id} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    msg.role === 'assistant' ? 'bg-blue-600' : 'bg-gray-200'
                  }`}>
                    {msg.role === 'assistant'
                      ? <Bot size={18} className="text-white" />
                      : <User size={18} className="text-gray-600" />}
                  </div>
                  <div className={`max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'assistant'
                        ? 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm shadow-sm'
                        : 'bg-blue-600 text-white rounded-tr-sm'
                    }`}>
                      {msg.text}
                    </div>
                    {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                      <div className="flex flex-wrap gap-1 px-1 mt-1">
                        {msg.sources.map(src => (
                          <span key={src} className="text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2 py-0.5">
                            📄 {src}
                          </span>
                        ))}
                      </div>
                    )}
                    <span className="text-xs text-gray-400 px-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="flex gap-4">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center">
                    <Bot size={18} className="text-white" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center h-5">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>

          {/* Input bar — sticky bottom once chat is active */}
          <div className="bg-white border-t border-gray-200 px-6 py-4">
            <div className="max-w-4xl mx-auto flex gap-3">
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="e.g. What is the penalty for EPR non-compliance? What does GRAP Stage IV restrict?"
                className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || loading}
                className="px-5 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-200 text-white rounded-xl flex items-center gap-2 text-sm font-medium transition-colors"
              >
                {loading ? <Loader size={16} className="animate-spin" /> : <Send size={16} />}
                Send
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PolicyChat;
