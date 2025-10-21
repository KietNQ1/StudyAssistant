import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

function TopicContentPage() {
  const [topic, setTopic] = useState(null);
  const [editing, setEditing] = useState(false);
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { courseId, topicId } = useParams();
  const navigate = useNavigate();
  const { course, topics, refreshTopics } = useOutletContext();

  useEffect(() => {
    fetchTopicDetails();
  }, [topicId]);

  const fetchTopicDetails = async () => {
    setLoading(true);
    try {
      const data = await authFetch(`/api/Topics/${topicId}`);
      setTopic(data);
      setContent(data.content || '');
    } catch (error) {
      console.error('Error fetching topic:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveContent = async () => {
    setSaving(true);
    try {
      await authFetch(`/api/Topics/${topicId}/content`, {
        method: 'PUT',
        body: JSON.stringify({ content }),
      });
      setTopic({ ...topic, content });
      setEditing(false);
    } catch (error) {
      alert('Lỗi khi lưu nội dung: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMarkComplete = async () => {
    try {
      await authFetch(`/api/Topics/${topicId}/complete`, {
        method: 'POST',
      });
      setTopic({ ...topic, isCompleted: true });
      refreshTopics();
    } catch (error) {
      alert('Lỗi khi đánh dấu hoàn thành: ' + error.message);
    }
  };

  // Find next topic
  const findNextTopic = () => {
    const flattenTopics = (topics, result = []) => {
      topics.forEach(t => {
        result.push(t);
        if (t.children) {
          flattenTopics(t.children, result);
        }
      });
      return result;
    };

    const allTopics = flattenTopics(topics);
    const currentIndex = allTopics.findIndex(t => t.id === parseInt(topicId));
    if (currentIndex !== -1 && currentIndex < allTopics.length - 1) {
      return allTopics[currentIndex + 1];
    }
    return null;
  };

  const nextTopic = findNextTopic();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>Đang tải nội dung...</div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>Không tìm thấy topic</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">{topic.title}</h1>
            {topic.description && (
              <p className="text-gray-600 mt-1">{topic.description}</p>
            )}
            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
              <span>⏱ {topic.estimatedTimeMinutes} phút</span>
              {topic.isCompleted && (
                <span className="text-green-600 font-semibold">✓ Đã hoàn thành</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {!editing ? (
              <>
                <button
                  onClick={() => setEditing(true)}
                  className="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  Chỉnh sửa nội dung
                </button>
                {!topic.isCompleted && (
                  <button
                    onClick={handleMarkComplete}
                    className="px-4 py-2 bg-green-500 text-white hover:bg-green-600 rounded-lg"
                  >
                    Đánh dấu hoàn thành
                  </button>
                )}
              </>
            ) : (
              <>
                <button
                  onClick={handleSaveContent}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg disabled:bg-gray-400"
                >
                  {saving ? 'Đang lưu...' : 'Lưu nội dung'}
                </button>
                <button
                  onClick={() => {
                    setContent(topic.content || '');
                    setEditing(false);
                  }}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  Hủy
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-auto p-6 bg-gray-50">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-sm p-8">
          {editing ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full h-96 p-4 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Nhập nội dung bài học ở đây. Bạn có thể sử dụng Markdown để định dạng..."
            />
          ) : (
            <div className="prose max-w-none">
              {topic.content ? (
                <div 
                  dangerouslySetInnerHTML={{ __html: renderContent(topic.content) }}
                />
              ) : (
                <div className="text-gray-500 text-center py-12">
                  <p className="text-lg mb-4">Chưa có nội dung cho topic này</p>
                  <button
                    onClick={() => setEditing(true)}
                    className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg"
                  >
                    Thêm nội dung
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        {!editing && (
          <div className="max-w-4xl mx-auto mt-8 flex justify-between">
            <div>
              {/* Previous topic button could go here */}
            </div>
            {nextTopic && !topic.isCompleted && (
              <button
                onClick={() => navigate(`/course/${courseId}/topic/${nextTopic.id}`)}
                className="px-6 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-lg flex items-center gap-2"
              >
                Bài tiếp theo: {nextTopic.title}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Simple markdown-like renderer (you can replace with a proper markdown library)
function renderContent(text) {
  return text
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');
}

export default TopicContentPage;