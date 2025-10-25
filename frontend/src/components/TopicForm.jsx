import React, { useState, useEffect } from 'react';
import { Sparkles, X, FolderTree, Clock, FileText } from 'lucide-react';
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
        setFormData((prev) => ({
            ...prev,
            [name]:
                name === 'parentTopicId' || name === 'estimatedTimeMinutes'
                    ? value === '' ? null : parseInt(value)
                    : value,
        }));
    };

    // Flatten topic tree for dropdown
    const flattenTopics = (topics, level = 0) => {
        let flattened = [];
        for (const t of topics) {
            // Skip current topic and its children to prevent circular reference
            if (topic && t.id === topic.id) continue;

            flattened.push({
                ...t,
                level,
                displayTitle: '—'.repeat(level) + ' ' + t.title,
            });

            if (t.children && t.children.length > 0) {
                flattened = [...flattened, ...flattenTopics(t.children, level + 1)];
            }
        }
        return flattened;
    };

    const flattenedTopics = flattenTopics(existingTopics);

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-gray-900" />
                    <h2 className="text-xl font-semibold text-gray-900">
                        {topic ? 'Update Topic' : 'Create New Topic'}
                    </h2>
                </div>
                <button
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Title */}
                <div>
                    <label
                        htmlFor="title"
                        className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-2"
                    >
                        <FileText className="w-4 h-4" />
                        Topic Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter topic title..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label
                        htmlFor="description"
                        className="block text-base font-semibold text-gray-900 mb-2"
                    >
                        Description
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="4"
                        placeholder="Provide more details about this topic..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                    />
                </div>

                {/* Parent Topic */}
                <div>
                    <label
                        htmlFor="parentTopicId"
                        className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-2"
                    >
                        <FolderTree className="w-4 h-4" />
                        Parent Topic (optional)
                    </label>
                    <select
                        id="parentTopicId"
                        name="parentTopicId"
                        value={formData.parentTopicId || ''}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 bg-white"
                    >
                        <option value="">-- No parent topic --</option>
                        {flattenedTopics.map((t) => (
                            <option key={t.id} value={t.id}>
                                {t.displayTitle}
                            </option>
                        ))}
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                        Select a parent topic if you want to create a sub-topic.
                    </p>
                </div>

                {/* Estimated Time */}
                <div>
                    <label
                        htmlFor="estimatedTimeMinutes"
                        className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-2"
                    >
                        <Clock className="w-4 h-4" />
                        Estimated Time (minutes) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="number"
                        id="estimatedTimeMinutes"
                        name="estimatedTimeMinutes"
                        value={formData.estimatedTimeMinutes}
                        onChange={handleChange}
                        min="1"
                        placeholder="30"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
                        required
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-5 h-5" />
                        {submitting
                            ? 'Processing...'
                            : topic
                                ? 'Update Topic'
                                : 'Create Topic'}
                    </button>

                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default TopicForm;