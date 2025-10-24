import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

function AddCourseForm({ onCourseAdded, onClose }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        // Hardcoding UserId for now. This should come from auth context later.
        const userId = 1;

        try {
            const newCourse = await authFetch('/api/Courses', {
                method: 'POST',
                body: JSON.stringify({
                    userId,
                    title,
                    description,
                }),
            });

            onCourseAdded(newCourse);
            setTitle('');
            setDescription('');

            // Close modal if onClose is provided
            if (onClose) {
                onClose();
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-2xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                    <Sparkles className="w-6 h-6 text-gray-900" />
                    <h2 className="text-2xl font-semibold text-gray-900">
                        Create a New Course
                    </h2>
                </div>
                {onClose && (
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            <form onSubmit={handleSubmit}>
                {/* Title Input */}
                <div className="mb-6">
                    <label
                        htmlFor="title"
                        className="block text-base font-semibold text-gray-900 mb-2"
                    >
                        Course Title
                    </label>
                    <input
                        type="text"
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="E.g., Introduction to Web Development"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
                        required
                    />
                </div>

                {/* Description Textarea */}
                <div className="mb-8">
                    <label
                        htmlFor="description"
                        className="block text-base font-semibold text-gray-900 mb-2"
                    >
                        Course Description
                    </label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Describe what students will learn in this course..."
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400 resize-none"
                    />
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-5 h-5" />
                        {submitting ? 'Creating...' : 'Create Course'}
                    </button>

                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

export default AddCourseForm;