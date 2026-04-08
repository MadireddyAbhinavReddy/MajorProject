import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader, Sparkles } from 'lucide-react';

interface Message {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
}

const SUGGESTED_QUESTIONS = [
  'What is the current AQI trend in Hyderabad?',
  'Which station has the highest PM2.5 this month?',
  'What policies can reduce vehicular pollution?',
  'How did COVID lockdown affect air quality in 2020?',
  'What are the main pollution sources in Hyderabad?',
  'What PM2.5 level is safe for outdoor jogging?',
  'Compare pollution levels across all 7 stations',
  'What interventions are most effective for PM10 reduction?',
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
        body: JSON.stringify({
          message: text,
          history: messages.map(m => ({ role: m.role, content: m.text }))
        }),
      });

      if (!res.ok) throw new Error();
      const data = await res.json();

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: data.response || data.message,
        timestamp: new Date(),
      }]);
    } catch {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        role: 'assistant',
        text: "The AI backend isn't connected yet. Once you wire up the `/chat` endpoint, I'll answer questions about Hyderabad's air quality, pollution sources, and policy recommendations using real data.",
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
            <h1 className="text-2xl font-bold text-gray-900">Policy Assistant</h1>
            <p className="text-gray-500 text-sm">Ask anything about Hyderabad air quality, pollution sources, and policy recommendations</p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* Empty state */}
          {messages.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Bot size={32} className="text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">How can I help you?</h2>
              <p className="text-gray-500 mb-8 max-w-md mx-auto">
                Ask me about pollution trends, station data, policy effectiveness, or health recommendations.
              </p>
              <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
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

          {/* Messages */}
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

      {/* Input bar */}
      <div className="bg-white border-t border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about air quality, pollution sources, or policy recommendations..."
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
    </div>
  );
};

export default PolicyChat;
