import React, { useState } from 'react';
import { Brain, FileText, Hash, Sparkles, AlertCircle } from 'lucide-react';
import { authFetch } from '../utils/authFetch';

function GenerateQuizForm({ course, onQuizGenerated }) {
    const [documentId, setDocumentId] = useState('');
    const [title, setTitle] = useState('');
    const [numberOfQuestions, setNumberOfQuestions] = useState(5);
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!documentId || !title) {
            setError('Please select a document and enter a quiz title.');
            return;
        }

        setSubmitting(true);
        setError(null);

        // Temporary: In a real app, you'd get the current user ID from auth context
        const currentUserId = 1;

        try {
            const newQuiz = await authFetch('/api/Quizzes/Generate', {
                method: 'POST',
                body: JSON.stringify({
                    courseId: course.id,
                    documentId: parseInt(documentId),
                    title,
                    createdByUserId: currentUserId,
                    numberOfQuestions,
                }),
            });

            onQuizGenerated(newQuiz);
            setTitle('');
            setDocumentId('');
            setNumberOfQuestions(5);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const hasDocuments = course.documents && course.documents.length > 0;

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Quiz Title */}
                <div>
                    <label
                        htmlFor="quiz-title"
                        className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-2"
                    >
                        <Brain className="w-4 h-4" />
                        Quiz Title <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="quiz-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter quiz title..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
                        required
                        disabled={!hasDocuments}
                    />
                </div>

                {/* Document Selection */}
                <div>
                    <label
                        htmlFor="document-select"
                        className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-2"
                    >
                        <FileText className="w-4 h-4" />
                        Generate from Document <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="document-select"
                        value={documentId}
                        onChange={(e) => setDocumentId(e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        disabled={!hasDocuments}
                    >
                        <option value="">-- Select a document --</option>
                        {hasDocuments &&
                            course.documents.map((doc) => (
                                <option key={doc.id} value={doc.id}>
                                    {doc.title}
                                </option>
                            ))}
                    </select>
                    {hasDocuments && (
                        <p className="text-sm text-gray-500 mt-2">
                            The AI will analyze the selected document and generate questions automatically.
                        </p>
                    )}
                </div>

                {/* Number of Questions */}
                <div>
                    <label
                        htmlFor="number-questions"
                        className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-2"
                    >
                        <Hash className="w-4 h-4" />
                        Number of Questions <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="number-questions"
                        value={numberOfQuestions}
                        onChange={(e) => setNumberOfQuestions(parseInt(e.target.value))}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 bg-white disabled:bg-gray-100 disabled:cursor-not-allowed"
                        required
                        disabled={!hasDocuments}
                    >
                        <option value="5">5 questions</option>
                        <option value="10">10 questions</option>
                        <option value="15">15 questions</option>
                        <option value="20">20 questions</option>
                        <option value="25">25 questions</option>
                        <option value="30">30 questions</option>
                    </select>
                    <p className="text-sm text-gray-500 mt-2">
                        Estimated time: ~{numberOfQuestions * 2} minutes
                    </p>
                </div>

                {/* No Documents Warning */}
                {!hasDocuments && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-amber-800">
                                No documents available
                            </p>
                            <p className="text-sm text-amber-700 mt-1">
                                Please upload at least one document before generating a quiz.
                            </p>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}
                {/* Submit Button */}
                <div className="flex gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={submitting || !hasDocuments}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-5 h-5" />
                        {submitting ? 'Generating quiz...' : 'Generate Quiz'}
                    </button>
                </div>

                {/* Info Box */}
                {hasDocuments && !submitting && (
                    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <Brain className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-blue-800">
                                The AI will automatically generate the quiz
                            </p>
                            <p className="text-sm text-blue-700 mt-1">
                                The questions are created based on the document content, including various types such as multiple choice and short answers.
                            </p>
                        </div>
                    </div>
                )}
            </form>
        </div>
    );
}

export default GenerateQuizForm;