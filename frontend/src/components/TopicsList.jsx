import React, { useState, useEffect } from 'react';
import {
    FolderTree,
    Plus,
    ChevronDown,
    ChevronRight,
    Edit2,
    Trash2,
    Clock,
    List,
    X
} from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import TopicForm from './TopicForm';

function TopicsList({ courseId }) {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [editingTopic, setEditingTopic] = useState(null);
    const [expandedTopics, setExpandedTopics] = useState(new Set());

    const fetchTopics = async () => {
        setLoading(true);
        try {
            const data = await authFetch(`/api/Topics/course/${courseId}/tree`);
            setTopics(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (courseId) {
            fetchTopics();
        }
    }, [courseId]);

    const handleTopicAdded = () => {
        setShowAddForm(false);
        fetchTopics();
    };

    const handleTopicUpdated = () => {
        setEditingTopic(null);
        fetchTopics();
    };

    const handleDeleteTopic = async (topicId, topicTitle) => {
        if (!window.confirm(`Bạn có chắc chắn muốn xóa topic "${topicTitle}"?`)) {
            return;
        }

        try {
            await authFetch(`/api/Topics/${topicId}`, {
                method: 'DELETE',
            });
            fetchTopics();
        } catch (err) {
            alert(`Lỗi khi xóa topic: ${err.message}`);
        }
    };

    const toggleExpand = (topicId) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(topicId)) {
            newExpanded.delete(topicId);
        } else {
            newExpanded.add(topicId);
        }
        setExpandedTopics(newExpanded);
    };

    const renderTopic = (topic, level = 0) => {
        const hasChildren = topic.children && topic.children.length > 0;
        const isExpanded = expandedTopics.has(topic.id);
        const indent = level * 32;

        return (
            <div key={topic.id} className="mb-3">
                <div
                    className="group bg-white border border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-md transition-all"
                    style={{ marginLeft: `${indent}px` }}
                >
                    <div className="p-4">
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-3 flex-1">
                                {/* Expand/Collapse Button */}
                                {hasChildren ? (
                                    <button
                                        onClick={() => toggleExpand(topic.id)}
                                        className="mt-1 p-1 hover:bg-gray-100 rounded transition-colors"
                                    >
                                        {isExpanded ? (
                                            <ChevronDown className="w-5 h-5 text-gray-600" />
                                        ) : (
                                            <ChevronRight className="w-5 h-5 text-gray-600" />
                                        )}
                                    </button>
                                ) : (
                                    <div className="w-7" />
                                )}

                                {/* Topic Icon */}
                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <FolderTree className="w-5 h-5 text-gray-600" />
                                </div>

                                {/* Topic Content */}
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-base font-semibold text-gray-900 mb-1">
                                        {topic.title}
                                    </h4>
                                    {topic.description && (
                                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                            {topic.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <Clock className="w-4 h-4" />
                                        <span>{topic.estimatedTimeMinutes} phút</span>
                                        {hasChildren && (
                                            <>
                                                <span className="text-gray-300">•</span>
                                                <List className="w-4 h-4" />
                                                <span>{topic.children.length} topic con</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingTopic(topic)}
                                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                    title="Sửa topic"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDeleteTopic(topic.id, topic.title)}
                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Xóa topic"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Children Topics */}
                {hasChildren && isExpanded && (
                    <div className="mt-3">
                        {topic.children.map(child => renderTopic(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mr-3"></div>
                    <p className="text-gray-600">Đang tải topics...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-600">Lỗi: {error}</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FolderTree className="w-6 h-6 text-gray-900" />
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Topics của khóa học
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Quản lý và tổ chức nội dung khóa học
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            setShowAddForm(!showAddForm);
                            setEditingTopic(null);
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-colors ${showAddForm
                                ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                : 'bg-gray-900 text-white hover:bg-gray-800'
                            }`}
                    >
                        {showAddForm ? (
                            <>
                                <X className="w-5 h-5" />
                                Hủy
                            </>
                        ) : (
                            <>
                                <Plus className="w-5 h-5" />
                                Thêm Topic
                            </>
                        )}
                    </button>
                </div>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="animate-fadeIn">
                    <TopicForm
                        courseId={courseId}
                        existingTopics={topics}
                        onSuccess={handleTopicAdded}
                        onCancel={() => setShowAddForm(false)}
                    />
                </div>
            )}

            {/* Edit Form */}
            {editingTopic && (
                <div className="animate-fadeIn">
                    <TopicForm
                        courseId={courseId}
                        existingTopics={topics}
                        topic={editingTopic}
                        onSuccess={handleTopicUpdated}
                        onCancel={() => setEditingTopic(null)}
                    />
                </div>
            )}

            {/* Topics List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center gap-2 mb-4">
                    <List className="w-5 h-5 text-gray-600" />
                    <h3 className="text-base font-semibold text-gray-900">
                        Danh sách Topics ({topics.length})
                    </h3>
                </div>

                {topics.length > 0 ? (
                    <div className="space-y-3">
                        {topics.map(topic => renderTopic(topic))}
                    </div>
                ) : (
                    <div className="text-center py-12">
                        <FolderTree className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium mb-1">Chưa có topic nào</p>
                        <p className="text-sm text-gray-500">
                            Hãy tạo topic đầu tiên cho khóa học!
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default TopicsList;