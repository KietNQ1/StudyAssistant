import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

function AIGenerateCourseForm({ onCourseGenerated }) {
    const [allCourses, setAllCourses] = useState([]);
    const [allDocuments, setAllDocuments] = useState([]);
    const [selectedDocuments, setSelectedDocuments] = useState([]);
    const [urls, setUrls] = useState('');
    const [mode, setMode] = useState('documents');
    const [courseName, setCourseName] = useState('');
    const [userGoal, setUserGoal] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [fetchingData, setFetchingData] = useState(true);
    const [showForm, setShowForm] = useState(false);

    // Fetch all documents
    useEffect(() => {
        fetchAllDocuments();
    }, []);

    const fetchAllDocuments = async () => {
        setFetchingData(true);
        try {
            const courses = await authFetch('/api/Courses');
            setAllCourses(courses);

            const docsPromises = courses.map((c) => authFetch(`/api/Courses/${c.id}`));
            const courseDetails = await Promise.all(docsPromises);

            const allDocs = courseDetails
                .flatMap((course) =>
                    (course.documents || []).map((doc) => ({
                        ...doc,
                        courseName: course.title,
                        courseId: course.id,
                    }))
                )
                .filter((d) => d.processingStatus === 'completed');

            setAllDocuments(allDocs);
        } catch (err) {
            setError(`Failed to fetch documents: ${err.message}`);
        } finally {
            setFetchingData(false);
        }
    };

    const toggleDocumentSelection = (docId) => {
        setSelectedDocuments((prev) =>
            prev.includes(docId) ? prev.filter((id) => id !== docId) : [...prev, docId]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const urlList = urls
            .trim()
            .split('\n')
            .map((u) => u.trim())
            .filter((u) => u);

        if (mode === 'documents' && selectedDocuments.length === 0) {
            setError('Please select at least one document');
            return;
        }
        if (mode === 'urls' && urlList.length === 0) {
            setError('Please enter at least one URL');
            return;
        }
        if (mode === 'both' && selectedDocuments.length === 0 && urlList.length === 0) {
            setError('Please select documents or enter URLs');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                courseName: courseName || null,
                userGoal: userGoal || null,
            };
            if ((mode === 'documents' || mode === 'both') && selectedDocuments.length > 0)
                payload.documentIds = selectedDocuments;
            if ((mode === 'urls' || mode === 'both') && urlList.length > 0)
                payload.urls = urlList;

            const newCourse = await authFetch('/api/Courses/GenerateFromDocuments', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            setSelectedDocuments([]);
            setUrls('');
            setCourseName('');
            setUserGoal('');
            setShowForm(false);

            if (onCourseGenerated) onCourseGenerated(newCourse);
            alert('Course generated successfully! 🎉');
        } catch (err) {
            setError(err.message || 'Failed to generate course');
        } finally {
            setLoading(false);
        }
    };

    // 🔹 Initial collapsed card
    if (!showForm) {
        return (
            <div className="p-8 bg-white border border-gray-200 rounded-3xl shadow-[0_8px_40px_rgba(0,0,0,0.05)] mb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                            <span>✨</span> <span>AI Course Generator</span>
                        </h2>
                        <p className="text-gray-500 mt-1 text-sm">
                            Create structured courses from your own materials.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-black text-white rounded-xl font-semibold px-6 py-2 text-sm hover:bg-gray-800 hover:scale-[1.02] transition-all duration-300 shadow-md"
                    >
                        Get Started
                    </button>
                </div>
            </div>
        );
    }

    // 🔹 Main Form
    return (
        <div
            className="max-w-3xl bg-white border border-gray-200 shadow-[0_8px_40px_rgba(0,0,0,0.05)] rounded-3xl p-10 transition-all duration-500 ease-out animate-fadeIn"
        >
            {/* Header */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h2 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
                        <span>✨</span> <span>AI Course Generator</span>
                    </h2>
                    <p className="text-gray-500 mt-1 text-sm">
                        Create structured courses from your own materials.
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(false)}
                    className="text-gray-500 hover:text-black text-xl font-light transition"
                >
                    ✕
                </button>
            </div>

            <form onSubmit={handleSubmit}>
                {/* Mode selection */}
                <div className="mb-10">
                    <label className="block text-gray-800 font-semibold mb-4 text-lg">
                        Content Source
                    </label>
                    <div className="flex gap-4">
                        {['documents', 'urls', 'both'].map((m) => (
                            <button
                                key={m}
                                type="button"
                                onClick={() => setMode(m)}
                                className={`mode-btn px-5 py-2 rounded-full text-sm font-medium border transition-all duration-300 shadow-sm ${mode === m
                                        ? 'bg-black text-white border-black scale-105 shadow-md'
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                {m === 'documents'
                                    ? '📄 Documents'
                                    : m === 'urls'
                                        ? '🌐 URLs'
                                        : '🔀 Both'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Course name */}
                <div className="mb-8">
                    <label className="block text-gray-800 font-semibold mb-2">
                        Course Name
                    </label>
                    <input
                        type="text"
                        placeholder="Let AI name it for you"
                        value={courseName}
                        onChange={(e) => setCourseName(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base bg-white focus:ring-2 focus:ring-black outline-none shadow-sm focus:shadow-md transition"
                    />
                </div>

                {/* Learning Goal */}
                <div className="mb-8">
                    <label className="block text-gray-800 font-semibold mb-2">
                        Learning Goal
                    </label>
                    <textarea
                        placeholder="E.g., I want to master backend development fundamentals"
                        value={userGoal}
                        onChange={(e) => setUserGoal(e.target.value)}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 h-28 text-base bg-white focus:ring-2 focus:ring-black outline-none shadow-sm focus:shadow-md transition"
                    ></textarea>
                </div>

                {/* URLs section */}
                {(mode === 'urls' || mode === 'both') && (
                    <div
                        className="transition-all duration-700 ease-in-out mb-8 opacity-100 translate-y-0"
                    >
                        <label className="block text-gray-800 font-semibold mb-2">
                            URLs (one per line)
                        </label>
                        <textarea
                            placeholder="https://example.com/article1"
                            value={urls}
                            onChange={(e) => setUrls(e.target.value)}
                            className="w-full border border-gray-200 rounded-xl px-4 py-3 h-28 font-mono text-sm bg-white focus:ring-2 focus:ring-black outline-none shadow-sm focus:shadow-md transition"
                        ></textarea>
                    </div>
                )}

                {/* Documents section */}
                {(mode === 'documents' || mode === 'both') && (
                    <div className="transition-all duration-700 ease-in-out opacity-100 translate-y-0">
                        <label className="block text-gray-800 font-semibold mb-3">
                            Select Documents
                        </label>

                        {fetchingData ? (
                            <p className="text-gray-500">Loading documents...</p>
                        ) : allDocuments.length === 0 ? (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                                <p className="text-yellow-800">
                                    No processed documents available. Please upload and process some documents first.
                                </p>
                            </div>
                        ) : (
                            <div className="border border-gray-200 rounded-2xl p-4 max-h-64 overflow-y-auto space-y-3 bg-white shadow-inner">
                                {allDocuments.map((doc) => (
                                    <label
                                        key={doc.id}
                                        className={`flex items-start p-4 rounded-xl cursor-pointer border transition ${selectedDocuments.includes(doc.id)
                                                ? 'bg-gray-100 border-gray-400'
                                                : 'bg-white hover:bg-gray-50 border-gray-200'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedDocuments.includes(doc.id)}
                                            onChange={() => toggleDocumentSelection(doc.id)}
                                            className="mt-1 mr-3 accent-black"
                                        />
                                        <div>
                                            <div className="font-medium">{doc.title}</div>
                                            <div className="text-sm text-gray-500">
                                                Course: {doc.courseName}
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-6">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {/* Buttons */}
                <div className="flex gap-4 mt-10">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-black text-white rounded-xl font-semibold text-base hover:bg-gray-800 hover:scale-[1.02] transition-all duration-300 shadow-md disabled:opacity-50 flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Generating...
                            </>
                        ) : (
                            '✨ Generate'
                        )}
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="px-6 py-3 rounded-xl font-semibold border border-gray-300 hover:bg-gray-100 transition-all duration-300 shadow-sm"
                    >
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
}

export default AIGenerateCourseForm;