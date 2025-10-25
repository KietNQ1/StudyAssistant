import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Brain, Play, Upload, Plus, ChevronRight, Award, Clock, MessageCircle, Loader2 } from 'lucide-react';
import UploadDocumentForm from '../components/UploadDocumentForm';
import GenerateQuizForm from '../components/GenerateQuizForm';
import TopicsList from '../components/TopicsList';
import { authFetch } from '../utils/authFetch';

function CourseDetailPage() {
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [creatingChat, setCreatingChat] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    const fetchCourseDetails = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await authFetch(`/api/Courses/${id}`);
            setCourse(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCourseDetails();
    }, [id]);

    const handleDocumentUploaded = (newDocument) => {
        setCourse(prevCourse => ({
            ...prevCourse,
            documents: [...prevCourse.documents, newDocument],
        }));
    };

    const handleQuizGenerated = (newQuiz) => {
        setCourse(prevCourse => ({
            ...prevCourse,
            quizzes: [...prevCourse.quizzes, newQuiz],
        }));
    };

    // Create chat session with document (RAG-enabled)
    const handleChatWithDocument = async (document) => {
        setCreatingChat(document.id);
        try {
            const newSession = await authFetch('/api/ChatSessions', {
                method: 'POST',
                body: JSON.stringify({
                    title: `Chat về: ${document.title}`,
                    courseId: course.id,
                    documentId: document.id
                })
            });
            
            navigate(`/chat-sessions/${newSession.id}`);
        } catch (err) {
            alert(`Failed to create chat: ${err.message}`);
        } finally {
            setCreatingChat(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading course details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-600">Error: {error}</p>
                </div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <p className="text-gray-600">Course not found.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Hero Header Section */}
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
                <div className="max-w-7xl mx-auto px-8 py-12">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                                <BookOpen className="w-6 h-6" />
                                <span className="text-sm font-medium text-gray-300">Course</span>
                            </div>
                            <h1 className="text-4xl font-bold mb-4">{course.title}</h1>
                            <p className="text-lg text-gray-300 max-w-3xl">{course.description}</p>

                            {/* Stats */}
                            <div className="flex gap-6 mt-6">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm">
                                        {course.documents?.length || 0} Documents
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm">
                                        {course.quizzes?.length || 0} Quizzes
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-gray-400" />
                                    <span className="text-sm">Self-paced</span>
                                </div>
                            </div>
                        </div>

                        <Link
                            to={`/course/${course.id}`}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                        >
                            <Play className="w-5 h-5" />
                            Vào học ngay
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                {/* Topics Section */}
                <div className="mb-8">
                    <TopicsList courseId={course.id} />
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Documents Section */}
                    <div className="space-y-6">
                        {/* Upload Form */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Upload className="w-6 h-6 text-gray-900" />
                                <h2 className="text-xl font-semibold text-gray-900">Upload Document</h2>
                            </div>
                            <UploadDocumentForm
                                courseId={course.id}
                                onDocumentUploaded={handleDocumentUploaded}
                            />
                        </div>

                        {/* Documents List */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-6 h-6 text-gray-900" />
                                    <h2 className="text-xl font-semibold text-gray-900">Documents</h2>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {course.documents?.length || 0} items
                                </span>
                            </div>

                            {course.documents && course.documents.length > 0 ? (
                                <div className="space-y-3">
                                    {course.documents.map(doc => (
                                        <div
                                            key={doc.id}
                                            className="group p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <FileText className="w-5 h-5 text-gray-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900">{doc.title}</p>
                                                        <p className="text-sm text-gray-500">{doc.fileType}</p>
                                                        
                                                        {/* Processing Status Badge */}
                                                        {doc.processingStatus && (
                                                            <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded mt-2 ${
                                                                doc.processingStatus === 'completed' ? 'bg-green-100 text-green-700' :
                                                                doc.processingStatus === 'failed' ? 'bg-red-100 text-red-700' :
                                                                'bg-yellow-100 text-yellow-700'
                                                            }`}>
                                                                {doc.processingStatus === 'completed' ? '✅ Ready for RAG' :
                                                                 doc.processingStatus === 'failed' ? '❌ Processing Failed' :
                                                                 '⏳ Processing...'}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Chat Button */}
                                                <button
                                                    onClick={() => handleChatWithDocument(doc)}
                                                    disabled={creatingChat === doc.id || doc.processingStatus !== 'completed'}
                                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                                                        doc.processingStatus === 'completed' && creatingChat !== doc.id
                                                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                                    }`}
                                                    title={doc.processingStatus === 'completed' ? 'Chat with this document using AI' : 'Document must be processed first'}
                                                >
                                                    {creatingChat === doc.id ? (
                                                        <>
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                            Creating...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MessageCircle className="w-4 h-4" />
                                                            Chat với tài liệu
                                                        </>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No documents found</p>
                                    <p className="text-sm text-gray-400 mt-1">Upload one to get started!</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Quizzes Section */}
                    <div className="space-y-6">
                        {/* Generate Quiz Form */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Brain className="w-6 h-6 text-gray-900" />
                                <h2 className="text-xl font-semibold text-gray-900">Generate Quiz</h2>
                            </div>
                            <GenerateQuizForm
                                course={course}
                                onQuizGenerated={handleQuizGenerated}
                            />
                        </div>

                        {/* Quizzes List */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <Award className="w-6 h-6 text-gray-900" />
                                    <h2 className="text-xl font-semibold text-gray-900">Quizzes</h2>
                                </div>
                                <span className="text-sm text-gray-500">
                                    {course.quizzes?.length || 0} items
                                </span>
                            </div>

                            {course.quizzes && course.quizzes.length > 0 ? (
                                <div className="space-y-3">
                                    {course.quizzes.map(quiz => (
                                        <div
                                            key={quiz.id}
                                            className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-900 hover:shadow-md transition-all"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                    <Brain className="w-5 h-5 text-gray-600" />
                                                </div>
                                                <p className="font-medium text-gray-900">{quiz.title}</p>
                                            </div>
                                            <Link
                                                to={`/quiz/${quiz.id}`}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors"
                                            >
                                                <Play className="w-4 h-4" />
                                                Start Quiz
                                            </Link>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">No quizzes found</p>
                                    <p className="text-sm text-gray-400 mt-1">Generate one from a document!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CourseDetailPage;
