import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

function TopicForm({ courseId, existingTopics, topic, onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    parentTopicId: null,
    estimatedTimeMinutes: 30,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (topic) {
      setFormData({
        title: topic.title || '',
        description: topic.description || '',
        parentTopicId: topic.parentTopicId || null,
        estimatedTimeMinutes: topic.estimatedTimeMinutes || 30,
      });
    }
  }, [topic]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      if (topic) {
        // Update existing topic
        await authFetch(`/api/Topics/${topic.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData),
        });
      } else {
        // Create new topic
        await authFetch('/api/Topics', {
          method: 'POST',
          body: JSON.stringify({
            ...formData,
            courseId: courseId,
          }),
        });
      }
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'parentTopicId' || name === 'estimatedTimeMinutes' 
        ? (value === '' ? null : parseInt(value)) 
        : value
    }));
  };

  // Function to flatten topics tree for select options
  const flattenTopics = (topics, level = 0, parentId = null) => {
    let flattened = [];
    for (const t of topics) {
      // Don't show current topic and its children in parent selection
      if (topic && t.id === topic.id) continue;
      
      flattened.push({
        ...t,
        level,
        displayTitle: '—'.repeat(level) + ' ' + t.title
      });
      
      if (t.children && t.children.length > 0) {
        flattened = [...flattened, ...flattenTopics(t.children, level + 1, t.id)];
      }
    }
    return flattened;
  };

  const flattenedTopics = flattenTopics(existingTopics);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="title" className="block text-gray-700 font-bold mb-2">
          Tên Topic <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-gray-700 font-bold mb-2">
          Mô tả
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows="3"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>

      <div>
        <label htmlFor="parentTopicId" className="block text-gray-700 font-bold mb-2">
          Topic cha (nếu có)
        </label>
        <select
          id="parentTopicId"
          name="parentTopicId"
          value={formData.parentTopicId || ''}
          onChange={handleChange}
          className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        >
          <option value="">-- Không có topic cha --</option>
          {flattenedTopics.map(t => (
            <option key={t.id} value={t.id}>
              {t.displayTitle}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="estimatedTimeMinutes" className="block text-gray-700 font-bold mb-2">
          Thời gian ước tính (phút) <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="estimatedTimeMinutes"
          name="estimatedTimeMinutes"
          value={formData.estimatedTimeMinutes}
          onChange={handleChange}
          min="1"
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          required
        />
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400"
        >
          {submitting ? 'Đang xử lý...' : (topic ? 'Cập nhật' : 'Tạo Topic')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
        >
          Hủy
        </button>
      </div>
    </form>
  );
}

export default TopicForm;