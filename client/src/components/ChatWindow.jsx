import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, FileText, Code, Sparkles, Loader2 } from 'lucide-react';
import { chatService } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ChatWindow = ({ selectedRepo, onViewSource, activeSourceId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef();

  useEffect(() => {
    if (selectedRepo) {
      loadHistory();
    }
  }, [selectedRepo]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const loadHistory = async () => {
    try {
      const res = await chatService.getHistory(selectedRepo.repoId);
      setMessages(res.data.messages || []);
    } catch (err) {
      console.error('History load failed');
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !selectedRepo) return;

    const userMsg = { role: 'user', content: input };
    setMessages([...messages, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await chatService.ask(selectedRepo.repoId, input);
      setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: res.data.answer,
          sources: res.data.sources 
      }]);
    } catch (err) {
      setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: 'Error: Failed to get response. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedRepo) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-surface/10">
        <Sparkles className="w-16 h-16 text-primary/40 mb-6 animate-pulse" />
        <h2 className="text-3xl font-bold mb-2">Ready to explore?</h2>
        <p className="text-gray-500 max-w-md">Select a repository from the sidebar or add a new one to start chatting with your code.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative">
      <div className="p-6 border-b border-white/10 flex items-center justify-between bg-surface/20 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                <Bot className="w-5 h-5" />
            </div>
            <div>
                <h3 className="font-bold">{selectedRepo.name} AI Assistant</h3>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-black">Semantic Search Enabled</p>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center ${
                msg.role === 'user' ? 'bg-secondary/20 text-secondary' : 'bg-primary/20 text-primary'
              }`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`max-w-[80%] space-y-3 ${msg.role === 'user' ? 'items-end flex flex-col' : ''}`}>
                <div className={`p-4 rounded-2xl ${
                  msg.role === 'user' 
                  ? 'bg-secondary/10 border border-secondary/20 text-white rounded-tr-none' 
                  : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none leading-relaxed'
                }`}>
                  <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                </div>

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {msg.sources.map((src, idx) => (
                      <button
                        key={idx}
                        onClick={() => onViewSource(src)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium border transition-all ${
                          activeSourceId === src.file_path 
                          ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20 scale-105' 
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                        }`}
                      >
                        <FileText className="w-3 h-3" />
                        {src.file_path.split('/').pop()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {loading && (
          <div className="flex gap-4">
            <div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none">
               <Loader2 className="w-4 h-4 animate-spin text-primary" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      <div className="p-6 bg-gradient-to-t from-background via-background to-transparent">
        <form 
          onSubmit={handleSend}
          className="relative max-w-4xl mx-auto group"
        >
          <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-secondary/50 rounded-2xl blur opacity-20 group-focus-within:opacity-50 transition-opacity" />
          <div className="relative glass rounded-2xl p-2 flex gap-2">
              <input
                type="text"
                placeholder="Ask about authentication, payment logic, or explain a function..."
                className="flex-1 bg-transparent border-none focus:ring-0 px-4 text-sm"
                value={input}
                onChange={e => setInput(e.target.value)}
              />
              <button 
                type="submit" 
                disabled={loading || !input.trim()}
                className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center hover:scale-[1.05] active:scale-[0.95] transition-all"
              >
                <Send className="w-4 h-4" />
              </button>
          </div>
        </form>
        <p className="text-[10px] text-center text-gray-500 mt-4 uppercase tracking-[0.2em] font-black">Powered by Gemini 1.5 Flash & ChromaDB</p>
      </div>
    </div>
  );
};

export default ChatWindow;
