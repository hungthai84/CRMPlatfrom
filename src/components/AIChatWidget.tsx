import { useState } from 'react';
import { Send, X, Bot, Sparkles, User as UserIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import ReactMarkdown from 'react-markdown';

export function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'assistant', content: string}[]>([
    { role: 'assistant', content: 'Xin chào! Tôi có thể giúp gì cho bạn hôm nay? Bạn có thể hỏi tôi bất cứ điều gì về CRM, phân tích dữ liệu khách hàng hoặc các tác vụ khác.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt: userMessage,
          context: 'Tóm tắt các mô-đun: Dashboard, Khách hàng 360, Bán hàng, Support, Marketing AI.'
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.text }]);
    } catch (e: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Đã có lỗi xảy ra. Hãy chắc chắn bạn đã cấu hình API Key trong Settings > Secrets. Chi tiết: ' + e.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all outline-none z-50",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
      >
        <Sparkles size={24} className="text-blue-400" />
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 sm:w-96 h-[500px] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200 z-50">
          <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600/20 p-2 rounded-full">
                <Bot size={20} className="text-blue-400" />
              </div>
              <div>
                <h3 className="font-bold text-sm">CRM Copilot</h3>
                <p className="text-[10px] text-slate-400">Powered by Gemini 3.5 Flash</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex gap-3", msg.role === 'user' ? "flex-row-reverse" : "")}>
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", msg.role === 'user' ? "bg-slate-200 text-slate-700" : "bg-blue-100 text-blue-600")}>
                  {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                </div>
                <div className={cn(
                  "p-3 rounded-2xl text-sm max-w-[75%]",
                  msg.role === 'user' ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-700 rounded-tl-sm shadow-sm"
                )}>
                  {msg.role === 'assistant' ? (
                    <div className="markdown-body text-xs prose prose-slate">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                  <Bot size={14} />
                 </div>
                 <div className="p-3 bg-white border border-slate-200 rounded-2xl rounded-tl-sm shadow-sm flex gap-1 items-center max-w-[75%] h-10 w-16 px-4">
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                   <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                 </div>
              </div>
            )}
          </div>

          <div className="p-4 bg-white border-t border-slate-100 pb-5 shrink-0">
            <div className="flex items-center bg-slate-100 rounded-full px-4 h-12 border border-transparent focus-within:border-blue-500 focus-within:bg-white transition-all shadow-sm">
              <input 
                type="text" 
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSend()}
                placeholder="Ask Copilot..."
                className="flex-1 bg-transparent border-none outline-none text-sm text-slate-800 placeholder:text-slate-400 placeholder:font-medium font-medium"
              />
              <button 
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed transition-colors shrink-0 outline-none"
              >
                <Send size={14} className="ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
