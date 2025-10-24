import React, { useState, useEffect } from 'react';
import { X, Sparkles, FileText, Globe, CheckSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { authFetch } from '../utils/authFetch';

export default function CoursesPage() {
    const [contentSource, setContentSource] = useState('urls');
    const [courseName, setCourseName] = useState('');
    const [learningGoal, setLearningGoal] = useState('');
    const [urls, setUrls] = useState('');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch existing courses
    const fetchCourses = async () => {
        setLoading(true);
        try {
            const data = await authFetch('/api/Courses');
            setCourses(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourses();
    }, []);

    // Handle AI-generated course creation (mock flow)
    const handleGenerateCourse = async () => {
        const newCourse = {
            id: Date.now(),
            title: courseName || 'AI Generated Course',
            description:
                learningGoal || 'AI generated course based on provided URLs or documents.',
        };
        // In real use: await authFetch('/api/Courses', { method: 'POST', body: JSON.stringify(newCourse) });
        setCourses((prev) => [newCourse, ...prev]);
        setCourseName('');
        setLearningGoal('');
        setUrls('');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-8">
            <div className="max-w-5xl mx-auto">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-10">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-6 h-6 text-gray-900" />
                            <h1 className="text-2xl font-semibold text-gray-900">
                                Generate Course with AI
                            </h1>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Content Source */}
                    <div className="mb-8">
                        <h2 className="text-base font-semibold text-gray-900 mb-4">
                            Content Source
                        </h2>
                        <div className="flex gap-4">
                            <button
                                onClick={() => setContentSource('documents')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${contentSource === 'documents'
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <FileText className="w-5 h-5" />
                                <span className="font-medium">From Documents</span>
                            </button>
                            <button
                                onClick={() => setContentSource('urls')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${contentSource === 'urls'
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <Globe className="w-5 h-5" />
                                <span className="font-medium">From URLs</span>
                            </button>
                            <button
                                onClick={() => setContentSource('both')}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg border-2 transition-all ${contentSource === 'both'
                                        ? 'border-gray-900 bg-gray-900 text-white'
                                        : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                                    }`}
                            >
                                <CheckSquare className="w-5 h-5" />
                                <span className="font-medium">Both</span>
                            </button>
                        </div>
                    </div>

                    {/* Course Name */}
                    <div className="mb-8">
                        <label className="block text-base font-semibold text-gray-900 mb-2">
                            Course Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={courseName}
                            onChange={(e) => setCourseName(e.target.value)}
                            placeholder="Leave empty to let AI suggest a name"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 text-gray-900"
                        />
                    </div>

                    {/* Learning Goal */}
                    <div className="mb-8">
                        <label className="block text-base font-semibold text-gray-900 mb-2">
                            Your Learning Goal (Optional)
                        </label>
                        <textarea
                            value={learningGoal}
                            onChange={(e) => setLearningGoal(e.target.value)}
                            placeholder="E.g., I want to learn web development from scratch"
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 text-gray-900 resize-none"
                        />
                    </div>

                    {/* URLs */}
                    {(contentSource === 'urls' || contentSource === 'both') && (
                        <div className="mb-8">
                            <label className="block text-base font-semibold text-gray-900 mb-2">
                                URLs (one per line, max 10)
                            </label>
                            <textarea
                                value={urls}
                                onChange={(e) => setUrls(e.target.value)}
                                placeholder="https://example.com/article1\nhttps://example.com/article2"
                                rows={6}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 text-gray-900 font-mono text-sm resize-none"
                            />
                            <div className="flex items-start gap-2 mt-2">
                                <Sparkles className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                                <p className="text-sm text-gray-600">
                                    Enter web pages, blog posts, or articles. AI will extract and analyze the content.
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={handleGenerateCourse}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            <Sparkles className="w-5 h-5" />
                            Generate Course
                        </button>
                        <button
                            onClick={() => {
                                setCourseName('');
                                setLearningGoal('');
                                setUrls('');
                            }}
                            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>

                {/* List of existing courses */}
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Your Courses</h2>
                {loading && <p>Loading courses...</p>}
                {error && <p className="text-red-500">Error: {error}</p>}

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course) => (
                        <Link
                            to={`/courses/${course.id}`}
                            key={course.id}
                            className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                        >
                            <h2 className="text-xl font-semibold mb-2">{course.title}</h2>
                            <p className="text-gray-700 line-clamp-3">{course.description}</p>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}