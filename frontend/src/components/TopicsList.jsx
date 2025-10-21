import React, { useState, useEffect } from 'react';
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
    const indent = level * 24;

    return (
      <div key={topic.id} className="mb-2">
        <div
          className={`bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow`}
          style={{ marginLeft: `${indent}px` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              {hasChildren && (
                <button
                  onClick={() => toggleExpand(topic.id)}
                  className="mr-2 text-gray-500 hover:text-gray-700"
                >
                  {isExpanded ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              )}
              <div>
                <h4 className="text-lg font-semibold">{topic.title}</h4>
                {topic.description && (
                  <p className="text-sm text-gray-600 mt-1">{topic.description}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Thời gian ước tính: {topic.estimatedTimeMinutes} phút
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingTopic(topic)}
                className="text-blue-500 hover:text-blue-700 px-3 py-1 rounded"
              >
                Sửa
              </button>
              <button
                onClick={() => handleDeleteTopic(topic.id, topic.title)}
                className="text-red-500 hover:text-red-700 px-3 py-1 rounded"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div className="mt-2">
            {topic.children.map(child => renderTopic(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  if (loading) return <p>Đang tải topics...</p>;
  if (error) return <p className="text-red-500">Lỗi: {error}</p>;

  return (
    <div className="mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Topics của khóa học</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
        >
          {showAddForm ? 'Hủy' : 'Thêm Topic'}
        </button>
      </div>

      {showAddForm && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Tạo Topic mới</h3>
          <TopicForm
            courseId={courseId}
            existingTopics={topics}
            onSuccess={handleTopicAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {editingTopic && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-3">Chỉnh sửa Topic</h3>
          <TopicForm
            courseId={courseId}
            existingTopics={topics}
            topic={editingTopic}
            onSuccess={handleTopicUpdated}
            onCancel={() => setEditingTopic(null)}
          />
        </div>
      )}

      <div className="space-y-2">
        {topics.length > 0 ? (
          topics.map(topic => renderTopic(topic))
        ) : (
          <p className="text-gray-500">Chưa có topic nào. Hãy tạo topic đầu tiên!</p>
        )}
      </div>
    </div>
  );
}

export default TopicsList;