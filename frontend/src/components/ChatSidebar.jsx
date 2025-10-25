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

    // ===== Fetch Chat Sessions =====
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

    // ===== Create new chat =====
    const handleNewChat = async () => {
        try {
            const newSession = await authFetch('/api/ChatSessions', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Chat',
                    courseId: null,
                    documentId: null,
                }),
            });

            navigate(`/chat-sessions/${newSession.id}`);
            fetchSessions();
        } catch (err) {
            console.error('Failed to create session:', err);
        }
    };

    // ===== Delete session =====
    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!confirm('Delete this chat?')) return;

        try {
            await authFetch(`/api/ChatSessions/${id}`, { method: 'DELETE' });

            if (id === currentSessionId) navigate('/chat-sessions');
            fetchSessions();
        } catch (err) {
            console.error('Failed to delete session:', err);
        }
    };

    // ===== Rename session =====
    const handleRename = async (id) => {
        if (!editTitle.trim()) return;

        try {
            await authFetch(`/api/ChatSessions/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ id, title: editTitle }),
            });

            setEditingId(null);
            setEditTitle('');
            fetchSessions();
        } catch (err) {
            console.error('Failed to rename session:', err);
        }
    };

    // ===== Time format =====
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

    // ===== Collapsed sidebar (icon only) =====
    if (isCollapsed) {
        return (
            <div className="w-16 bg-[#202123] text-white flex flex-col items-center py-4">
                <button
                    onClick={onToggle}
                    className="p-2 hover:bg-[#343541] rounded mb-4"
                    title="Expand sidebar"
                >
                    <i className="fa-solid fa-bars text-lg"></i>
                </button>
                <button
                    onClick={handleNewChat}
                    className="p-2 hover:bg-[#343541] rounded"
                    title="New chat"
                >
                    <i className="fa-solid fa-plus text-lg"></i>
                </button>
            </div>
        );
    }

    // ===== Expanded sidebar =====
    return (
        <aside className="w-72 bg-[#202123] text-[#d1d5db] flex flex-col h-screen shadow-lg">
            {/* === New Chat Button === */}
            <div className="p-4 border-b border-white/10">
                <button
                    onClick={handleNewChat}
                    className="w-full flex items-center justify-center gap-2 bg-transparent border border-white/20 rounded-md py-2 text-sm font-medium hover:bg-[#343541] transition"
                >
                    <i className="fa-solid fa-plus text-xs"></i> New Chat
                </button>
            </div>

            {/* === Chat List === */}
            <div className="flex-1 overflow-y-auto p-3">
                {loading ? (
                    <p className="text-center text-gray-400 mt-10 text-sm">Loading...</p>
                ) : sessions.length === 0 ? (
                    <p className="text-center text-gray-400 mt-10 text-sm">No chats yet</p>
                ) : (
                    <div>
                        <h3 className="uppercase text-xs text-white/40 font-semibold px-2 mb-2">
                            Today
                        </h3>
                        {sessions.map((session) => (
                            <div
                                key={session.id}
                                onClick={() => navigate(`/chat-sessions/${session.id}`)}
                                className={`flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm transition truncate ${session.id === currentSessionId
                                        ? 'bg-[#40414f] text-white'
                                        : 'hover:bg-[#343541]'
                                    }`}
                            >
                                {editingId === session.id ? (
                                    <div
                                        className="flex items-center gap-2 w-full"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={(e) => setEditTitle(e.target.value)}
                                            className="flex-1 bg-[#343541] text-white px-2 py-1 rounded text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
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
                                        <div className="flex items-center gap-2 min-w-0">
                                            <i className="fa-solid fa-message text-white/60 text-xs"></i>
                                            <span className="truncate">{session.title}</span>
                                        </div>

                                        {/* Hover actions */}
                                        <div
                                            className="hidden group-hover:flex gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingId(session.id);
                                                    setEditTitle(session.title);
                                                }}
                                                title="Rename"
                                                className="text-white/60 hover:text-white"
                                            >
                                                <i className="fa-solid fa-pen text-xs"></i>
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(session.id, e)}
                                                title="Delete"
                                                className="text-red-400 hover:text-red-300"
                                            >
                                                <i className="fa-solid fa-trash text-xs"></i>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* === Footer === */}
            <div className="p-4 border-t border-white/10">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#4b5563] rounded-full flex items-center justify-center font-semibold text-white">
                        {localStorage.getItem('user_email')?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="text-sm truncate">
                        {localStorage.getItem('user_email') || 'User'}
                    </div>
                </div>
            </div>
        </aside>
    );
}

export default ChatSidebar;