import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { authFetch } from '../utils/authFetch';
import ChatSidebar from '../components/ChatSidebar';

function ChatPage() {
    const [connection, setConnection] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sessionInfo, setSessionInfo] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    const { sessionId } = useParams();
    const navigate = useNavigate();
    const chatContainerRef = useRef(null); // Ref for the message container div

    // Fetch initial chat history
    useEffect(() => {
        const fetchChatHistory = async () => {
            if (!sessionId) return;
            setLoading(true);
            try {
                const sessionData = await authFetch(`/api/ChatSessions/${sessionId}`);
                setMessages(sessionData.chatMessages || []);
            } catch (err) {
                setError(`Failed to load chat history: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };
        fetchChatHistory();
    }, [sessionId]);

    // Set up and manage SignalR connection
    useEffect(() => {
        const token = localStorage.getItem('jwt_token');
        if (!token) {
            window.location.href = '/login';
            return;
        }

        const newConnection = new HubConnectionBuilder()
            .withUrl("/chathub", { accessTokenFactory: () => token })
            .withAutomaticReconnect()
            .build();

        setConnection(newConnection);

        return () => {
            newConnection.stop();
        };
    }, []);

    useEffect(() => {
        if (connection) {
            connection.start()
                .then(() => {
                    console.log('Connected to Chat Hub!');
                    connection.invoke("JoinChatSession", sessionId.toString());

                    connection.on("ReceiveMessage", (message) => {
                        setMessages(prevMessages => [...prevMessages, message]);
                    });
                })
                .catch(e => {
                    console.log('Connection failed: ', e);
                    setError('Real-time connection to the server failed.');
                });
        }
    }, [connection, sessionId]);
    
    // Auto-scroll to bottom when new messages are added
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (inputMessage.trim() && connection) {
            // 1. Optimistic UI Update: Add user's message immediately
            const userMessage = {
                sessionId: parseInt(sessionId),
                content: inputMessage.trim(),
                role: "user",
                createdAt: new Date().toISOString(), // Temporary timestamp
            };
            setMessages(prevMessages => [...prevMessages, userMessage]);
            setInputMessage('');

            // 2. Send to backend without waiting for the full response
            try {
                await authFetch('/api/ChatMessages', {
                    method: 'POST',
                    body: JSON.stringify({
                        sessionId: parseInt(sessionId),
                        content: userMessage.content,
                        role: "user"
                    }),
                });
                // AI response will be pushed by SignalR, no need to handle it here
            } catch (err) {
                console.error('Failed to send message:', err);
                setError(`Failed to send message: ${err.message}`);
                // Optional: Remove the optimistic message or show an error indicator
            }
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* Sidebar */}
            <ChatSidebar 
                isCollapsed={sidebarCollapsed} 
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} 
            />
            
            {/* Main Chat Area */}
            <div className="flex-1 flex flex-col">
                {/* Chat Messages */}
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-gray-500">Loading chat...</div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto px-4 py-8">
                            {error && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                                    {error}
                                </div>
                            )}
                            
                            {messages.length === 0 ? (
                                <div className="text-center text-gray-400 py-16">
                                    <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                    </svg>
                                    <p className="text-lg">No messages yet</p>
                                    <p className="text-sm mt-2">Start the conversation below</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => (
                                    <div key={index} className={`flex gap-4 mb-6 ${
                                        msg.role === 'user' ? 'justify-end' : 'justify-start'
                                    }`}>
                                        {msg.role === 'assistant' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                AI
                                            </div>
                                        )}
                                        
                                        <div className={`max-w-2xl ${
                                            msg.role === 'user' 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-white border border-gray-200'
                                        } rounded-2xl px-4 py-3 shadow-sm`}>
                                            <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                            <span className={`text-xs block text-right mt-2 ${
                                                msg.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                                            }`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        
                                        {msg.role === 'user' && (
                                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold flex-shrink-0">
                                                {localStorage.getItem('user_email')?.charAt(0).toUpperCase() || 'U'}
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="border-t border-gray-200 bg-white">
                    <div className="max-w-3xl mx-auto px-4 py-4">
                        <form onSubmit={sendMessage} className="relative">
                            <textarea
                                value={inputMessage}
                                onChange={e => setInputMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        sendMessage(e);
                                    }
                                }}
                                className="w-full border border-gray-300 rounded-xl px-4 py-3 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                placeholder="Message AI..."
                                rows="1"
                                style={{ minHeight: '52px', maxHeight: '200px' }}
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim()}
                                className="absolute right-2 bottom-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white p-2 rounded-lg transition"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </form>
                        <p className="text-xs text-gray-400 text-center mt-2">
                            Press Enter to send, Shift+Enter for new line
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatPage;
