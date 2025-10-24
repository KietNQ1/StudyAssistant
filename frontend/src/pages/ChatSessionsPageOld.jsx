import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { authFetch } from '../utils/authFetch';
import ChatSidebar from '../components/ChatSidebar';

function ChatSessionsPage() {
    // Sidebar states
    const [sessions, setSessions] = useState([]);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    
    // Chat states
    const [connection, setConnection] = useState(null);
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const chatContainerRef = useRef(null);

    // Fetch user's chat sessions
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        setLoading(true);
        try {
            const data = await authFetch('/api/ChatSessions/my-sessions');
            setSessions(data);
        } catch (err) {
            setError(`Failed to load sessions: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    // Create new session
    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!newSessionTitle.trim()) return;

        try {
            const newSession = await authFetch('/api/ChatSessions', {
                method: 'POST',
                body: JSON.stringify({
                    title: newSessionTitle,
                    courseId: null,
                    documentId: null
                })
            });
            
            setShowNewSessionModal(false);
            setNewSessionTitle('');
            
            // Navigate to the new chat session
            navigate(`/chat/${newSession.id}`);
        } catch (err) {
            setError(`Failed to create session: ${err.message}`);
        }
    };

    // Delete session
    const handleDeleteSession = async (sessionId) => {
        if (!confirm('Are you sure you want to delete this chat session?')) return;

        try {
            await authFetch(`/api/ChatSessions/${sessionId}`, {
                method: 'DELETE'
            });
            
            // Refresh sessions list
            fetchSessions();
        } catch (err) {
            setError(`Failed to delete session: ${err.message}`);
        }
    };

    // Rename session
    const handleRenameSession = async (sessionId) => {
        if (!editingTitle.trim()) return;

        try {
            await authFetch(`/api/ChatSessions/${sessionId}`, {
                method: 'PUT',
                body: JSON.stringify({
                    id: sessionId,
                    title: editingTitle
                })
            });
            
            setEditingSessionId(null);
            setEditingTitle('');
            fetchSessions();
        } catch (err) {
            setError(`Failed to rename session: ${err.message}`);
        }
    };

    // Open chat session
    const openSession = (sessionId) => {
        navigate(`/chat/${sessionId}`);
    };

    // Format date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString();
    };

    // Truncate text
    const truncateText = (text, maxLength = 80) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-screen">
            <div className="text-xl">Loading sessions...</div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-gray-800">My Chat Sessions</h1>
                    <p className="text-gray-600 mt-2">Manage your AI conversations</p>
                </div>
                <button
                    onClick={() => setShowNewSessionModal(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Chat
                </button>
            </div>

            {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
                    {error}
                </div>
            )}

            {/* Sessions List */}
            {sessions.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 rounded-lg">
                    <svg className="w-24 h-24 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                    <h3 className="text-xl font-semibold text-gray-700 mb-2">No chat sessions yet</h3>
                    <p className="text-gray-500 mb-6">Start a new conversation with AI</p>
                    <button
                        onClick={() => setShowNewSessionModal(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                    >
                        Create Your First Chat
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {sessions.map((session) => (
                        <div
                            key={session.id}
                            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex-1" onClick={() => openSession(session.id)}>
                                    {/* Session Title */}
                                    {editingSessionId === session.id ? (
                                        <div className="flex gap-2 mb-2" onClick={(e) => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={editingTitle}
                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                className="flex-1 border rounded px-2 py-1"
                                                autoFocus
                                            />
                                            <button
                                                onClick={() => handleRenameSession(session.id)}
                                                className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                                            >
                                                Save
                                            </button>
                                            <button
                                                onClick={() => setEditingSessionId(null)}
                                                className="bg-gray-300 text-gray-700 px-3 py-1 rounded hover:bg-gray-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <h3 className="text-xl font-semibold text-gray-800 mb-2">
                                            {session.title}
                                        </h3>
                                    )}

                                    {/* Last Message Preview */}
                                    {session.lastMessage && (
                                        <p className="text-gray-600 text-sm mb-3">
                                            <span className="font-medium">
                                                {session.lastMessage.role === 'user' ? 'You' : 'AI'}:
                                            </span>{' '}
                                            {truncateText(session.lastMessage.content)}
                                        </p>
                                    )}

                                    {/* Metadata */}
                                    <div className="flex gap-4 text-xs text-gray-500">
                                        <span>💬 {session.messageCount} messages</span>
                                        <span>🕒 {formatDate(session.lastMessageAt || session.createdAt)}</span>
                                        {session.courseName && (
                                            <span>📚 {session.courseName}</span>
                                        )}
                                        {session.documentName && (
                                            <span>📄 {session.documentName}</span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 ml-4" onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => {
                                            setEditingSessionId(session.id);
                                            setEditingTitle(session.title);
                                        }}
                                        className="text-blue-600 hover:text-blue-800 p-2"
                                        title="Rename"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteSession(session.id)}
                                        className="text-red-600 hover:text-red-800 p-2"
                                        title="Delete"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* New Session Modal */}
            {showNewSessionModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-8 max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Start New Chat</h2>
                        <form onSubmit={handleCreateSession}>
                            <label className="block mb-2 text-sm font-medium text-gray-700">
                                Chat Title
                            </label>
                            <input
                                type="text"
                                value={newSessionTitle}
                                onChange={(e) => setNewSessionTitle(e.target.value)}
                                placeholder="e.g., Help with React Hooks"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                autoFocus
                            />
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold"
                                >
                                    Create Chat
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowNewSessionModal(false);
                                        setNewSessionTitle('');
                                    }}
                                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 rounded-lg font-semibold"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ChatSessionsPage;
