import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

function App() {
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState('');
  const [question, setQuestion] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { 
    scrollToBottom(); 
  }, [chatHistory, loading]);

  const handleUpload = async () => {
    if (!file) {
      setStatus('⚠️ Please select a file first');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);

    try {
      setStatus('⏳ Processing document...');
      const res = await axios.post('http://localhost:8000/upload/pdf', formData);
      setStatus('✅ ' + res.data.message);
    } catch (err) {
      setStatus('❌ ' + (err.response?.data?.detail || "Upload failed"));
    }
  };

  const handleChat = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;
    
    setLoading(true);
    const userMsg = question;
    setQuestion('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      const res = await axios.post('http://localhost:8000/chat', { question: userMsg });
      setChatHistory(prev => [...prev, { role: 'ai', content: res.data.answer }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'ai', content: '❌ Error: ' + (err.response?.data?.detail || "Connection failed") }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans selection:bg-blue-200">
      
      {/* SIDEBAR: Document Management */}
      <div className="w-80 bg-slate-900 text-white flex flex-col shadow-2xl z-10">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-blue-500 p-2 rounded-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-wide">DocuBrain AI</h1>
        </div>

        <div className="p-6 flex-1">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Knowledge Base</h2>
          
          <div className="relative group cursor-pointer">
            <input 
              type="file" 
              onChange={(e) => {
                setFile(e.target.files[0]);
                setStatus('');
              }}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
              accept=".pdf"
            />
            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 flex flex-col items-center gap-2 ${file ? 'border-blue-400 bg-blue-500/10' : 'border-slate-700 bg-slate-800/50 group-hover:border-slate-500 group-hover:bg-slate-800'}`}>
              <svg className={`w-8 h-8 ${file ? 'text-blue-400' : 'text-slate-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
              <span className="text-sm font-medium text-slate-300">
                {file ? file.name : "Click or drag PDF here"}
              </span>
            </div>
          </div>

          <button 
            onClick={handleUpload}
            disabled={!file}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold py-3 px-4 rounded-xl transition-colors shadow-lg shadow-blue-900/20 active:scale-[0.98]"
          >
            Process Document
          </button>

          {status && (
            <div className={`mt-4 p-3 rounded-lg text-sm text-center border ${status.includes('❌') ? 'bg-red-500/10 border-red-500/20 text-red-400' : status.includes('✅') ? 'bg-green-500/10 border-green-500/20 text-green-400' : 'bg-blue-500/10 border-blue-500/20 text-blue-400'}`}>
              {status}
            </div>
          )}
        </div>
      </div>

      {/* MAIN CHAT AREA */}
      <div className="flex-1 flex flex-col relative">
        {/* Top Header */}
        <div className="h-16 bg-white border-b border-gray-200 flex items-center px-8 shadow-sm z-10">
          <h2 className="text-gray-700 font-medium text-lg">Document Chat</h2>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 bg-slate-50 scroll-smooth">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
              <div className="bg-gray-200 p-4 rounded-full mb-4">
                <svg className="w-12 h-12 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-700">No messages yet</h3>
              <p className="text-gray-500 mt-2 max-w-sm">Upload a PDF document on the left, then ask me anything about its contents.</p>
            </div>
          ) : (
            chatHistory.map((chat, i) => (
              <div key={i} className={`flex ${chat.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex gap-3 max-w-[85%] ${chat.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  
                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${chat.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white'}`}>
                    {chat.role === 'user' ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                    ) : (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                    chat.role === 'user' 
                      ? 'bg-blue-600 text-white rounded-tr-sm' 
                      : 'bg-white border border-gray-100 text-gray-800 rounded-tl-sm shadow-sm'
                  }`}>
                    {chat.role === 'ai' ? (
                      /* FIXED: className is on a wrapper div, not ReactMarkdown itself */
                      <div className="prose prose-sm max-w-none prose-slate text-inherit">
                        <ReactMarkdown>
                          {chat.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{chat.content}</p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Loading Animation */}
          {loading && (
            <div className="flex justify-start">
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                </div>
                <div className="bg-white border border-gray-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-200">
          <form onSubmit={handleChat} className="max-w-4xl mx-auto relative flex items-center">
            <input 
              type="text" 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ask a question about your document..."
              className="w-full pl-6 pr-16 py-4 bg-gray-50 border border-gray-200 rounded-full focus:ring-2 focus:ring-blue-500 focus:bg-white focus:outline-none transition-all shadow-inner text-gray-700"
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !question.trim()}
              className="absolute right-2 p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all shadow-md active:scale-95"
            >
              <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </form>
          <div className="text-center mt-2">
            <span className="text-xs text-gray-400">AI can make mistakes. Verify important information from the source document.</span>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;