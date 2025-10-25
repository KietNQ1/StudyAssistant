import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import ChatSidebar from '../components/ChatSidebar';
import { authFetch } from '../utils/authFetch';

function ChatPage() {
    const { sessionId } = useParams();
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const chatContainerRef = useRef(null);

    // ===== Fetch messages =====
    useEffect(() => {
        if (!sessionId) return;
        fetchMessages();
    }, [sessionId]);

    const fetchMessages = async () => {
        setLoading(true);
        try {
            const data = await authFetch(`/api/ChatMessages/by-session/${sessionId}`);
            setMessages(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // ===== Send new message =====
    const handleSend = async () => {
        if (!inputMessage.trim()) return;

        const userMessage = {
            id: Date.now(),
            sender: 'User',
            content: inputMessage,
            createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, userMessage]);
        setInputMessage('');

        try {
            const aiResponse = await authFetch(`/api/ChatMessages`, {
                method: 'POST',
                body: JSON.stringify({
                    sessionId: parseInt(sessionId),
                    content: inputMessage,
                }),
            });
            // Append AI message
            setMessages((prev) => [...prev, aiResponse]);
        } catch (err) {
            console.error('Send failed:', err);
        }
    };

    // ===== Auto-scroll on message update =====
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="flex h-screen">
            {/* Sidebar */}
            <ChatSidebar
                isCollapsed={isCollapsed}
                onToggle={() => setIsCollapsed(!isCollapsed)}
            />

            {/* Main Chat Area */}
            <main className="flex-1 flex flex-col bg-[#f7f7f7] relative">
                {/* Messages */}
                <div
                    ref={chatContainerRef}
                    className="flex-1 overflow-y-auto p-6 md:p-12 flex flex-col items-center bg-[#f7f7f7]"
                >
                    {loading ? (
                        <p className="text-gray-500 mt-20">Loading messages...</p>
                    ) : error ? (
                        <p className="text-red-500 mt-20">Error: {error}</p>
                    ) : messages.length === 0 ? (
                        <p className="text-gray-500 mt-20">No messages yet</p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`w-full max-w-3xl mb-6 ${msg.sender === 'User' ? 'user-message' : 'ai-message'
                                    }`}
                            >
                                <div
                                    className={`flex flex-col ${msg.sender === 'User'
                                            ? 'items-end text-right'
                                            : 'items-start text-left'
                                        }`}
                                >
                                    <div className="text-sm text-gray-500 mb-1">
                                        <span className="font-semibold text-black">
                                            {msg.sender === 'User' ? 'Bạn' : 'Tuxedo'}
                                        </span>{' '}
                                        • {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>

                                    <div className="flex items-start">
                                        {msg.sender === 'AI' && (
                                            <div
                                                className="w-9 h-9 rounded-full bg-gray-300 mr-3"
                                                style={{
                                                    backgroundImage: "url('https://via.placeholder.com/35/cccccc/000?text=AI')",
                                                    backgroundSize: 'cover',
                                                    backgroundPosition: 'center',
                                                }}
                                            ></div>
                                        )}

                                        <div
                                            className={`px-4 py-3 rounded-2xl shadow-sm max-w-[80%] ${msg.sender === 'User'
                                                    ? 'bg-black text-white rounded-br-md'
                                                    : 'bg-gray-200 text-black rounded-tl-md'
                                                }`}
                                        >
                                            {msg.content}
                                        </div>

                                        {msg.sender === 'User' && (
                                            <div className="w-9 h-9 rounded-full bg-gray-400 ml-3 flex items-center justify-center text-white">
                                                <i className="fa-solid fa-user"></i>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Input */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                    <div className="max-w-3xl mx-auto flex items-center border border-gray-200 rounded-xl bg-white shadow-sm">
                        <input
                            type="text"
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            placeholder="Hỏi bất kỳ điều gì..."
                            className="flex-1 px-4 py-3 text-sm outline-none rounded-l-xl"
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        />
                        <button
                            onClick={handleSend}
                            className="p-3 text-gray-600 hover:text-[#fca311] transition"
                        >
                            <i className="fa-solid fa-paper-plane text-lg"></i>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}

export default ChatPage;
