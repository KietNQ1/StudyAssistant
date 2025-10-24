import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

function ChatSidebar({ isCollapsed, onToggle }) {
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editTitle, setEditTitle] = useState('');
    
    const navigate = useNavigate();
    const { sessionId } = useParams();
    const currentSessionId = parseInt(sessionId);

    // Fetch sessions
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const data = await authFetch('/api/ChatSessions/my-sessions');
            setSessions(data);
        } catch (err) {
            console.error('Failed to load sessions:', err);
        } finally {
            setLoading(false);
        }
    };

    // Create new session
    const handleNewChat = async () => {
        try {
            const newSession = await authFetch('/api/ChatSessions', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Chat',
                    courseId: null,
                    documentId: null
                })
            });
            
            navigate(`/chat-sessions/${newSession.id}`);
            fetchSessions(); // Refresh list
        } catch (err) {
            console.error('Failed to create session:', err);
        }
    };

    // Delete session
    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this chat?')) return;

        try {
            await authFetch(`/api/ChatSessions/${id}`, {
                method: 'DELETE'
            });
            
            // If deleting current session, navigate to sessions page
            if (id === currentSessionId) {
                navigate('/chat-sessions');
            }
            
            fetchSessions();
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    // Rename session
    const handleRename = async (id) => {
        if (!editTitle.trim()) return;

        try {
            await authFetch(`/api/ChatSessions/${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    id: id,
                    title: editTitle
                })
            });
            
            setEditingId(null);
            setEditTitle('');
            fetchSessions();
        } catch (err) {
            console.error('Failed to rename session:', err);
        }
    };

    // Format time
    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    if (isCollapsed) {
        return (
            <div className="w-16 bg-gray-900 text-white flex flex-col items-center py-4">
                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-gray-800 rounded-lg mb-4"
                    title="Expand sidebar"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
                <button
                    onClick={handleNewChat}
                    className="p-2 hover:bg-gray-800 rounded-lg"
                    title="New chat"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>
        );
    }

    return (
        <div className="w-80 bg-gray-900 text-white flex flex-col h-screen">
            {/* Header */}
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-gray-800 rounded-lg"
                    title="Collapse sidebar"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>
                <button
                    onClick={handleNewChat}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    New Chat
                </button>
            </div>

            {/* Sessions List */}
            <div className="flex-1 overflow-y-auto p-2">
                {loading ? (
                    <div className="text-center text-gray-400 py-8">Loading...</div>
                ) : sessions.length === 0 ? (
                    <div className="text-center text-gray-400 py-8 px-4">
                        <p className="text-sm">No chats yet</p>
                        <p className="text-xs mt-2">Start a new conversation</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                className={`group relative rounded-lg px-3 py-3 cursor-pointer transition ${
                                    session.id === currentSessionId
                                        ? 'bg-gray-800'
                                        : 'hover:bg-gray-800'
                                }`}
                                onClick={() => navigate(`/chat-sessions/${session.id}`)}
                            >
                                {editingId === session.id ? (
                                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="flex-1 bg-gray-700 text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRename(session.id);
                                                if (e.key === 'Escape') setEditingId(null);
                                            }}
                                        />
                                        <button
                                            onClick={() => handleRename(session.id)}
                                            className="text-green-400 hover:text-green-300"
                                        >
                                            ✓
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="text-red-400 hover:text-red-300"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                                                    </svg>
                                                    <h3 className="text-sm font-medium truncate">
                                                        {session.title}
                                                    </h3>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs text-gray-400">
                                                        {formatTime(session.lastMessageAt || session.createdAt)}
                                                    </span>
                                                    {session.messageCount > 0 && (
                                                        <span className="text-xs text-gray-500">
                                                            • {session.messageCount} msg{session.messageCount !== 1 ? 's' : ''}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            
                                            {/* Actions - show on hover */}
                                            <div className="hidden group-hover:flex gap-1" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setEditingId(session.id);
                                                        setEditTitle(session.title);
                                                    }}
                                                    className="p-1 hover:bg-gray-700 rounded"
                                                    title="Rename"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDelete(session.id, e)}
                                                    className="p-1 hover:bg-gray-700 rounded text-red-400"
                                                    title="Delete"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-700">
                <div className="text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {localStorage.getItem('user_email')?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-white truncate">
                                {localStorage.getItem('user_email') || 'User'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ChatSidebar;
