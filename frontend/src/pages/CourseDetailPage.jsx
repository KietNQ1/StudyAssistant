import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
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

  if (loading) return <p>Loading course details...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;
  if (!course) return <p>Course not found.</p>;

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
          <p className="text-lg text-gray-600">{course.description}</p>
        </div>
        <Link 
          to={`/course/${course.id}`}
          className="px-6 py-3 bg-blue-500 text-white hover:bg-blue-600 rounded-lg flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          Vào học ngay
        </Link>
      </div>
      
      {/* Topics Section */}
      <TopicsList courseId={course.id} />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8">
        <div>
          <UploadDocumentForm courseId={course.id} onDocumentUploaded={handleDocumentUploaded} />
          <div className="mt-8">
            <h2 className="text-3xl font-bold mb-4">Documents</h2>
            {course.documents && course.documents.length > 0 ? (
              <ul className="space-y-4">
                {course.documents.map(doc => (
                  <li key={doc.id} className="bg-white p-4 rounded-lg shadow-md">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-semibold text-lg">{doc.title}</p>
                        <p className="text-sm text-gray-500">{doc.fileType}</p>
                        {doc.processingStatus && (
                          <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
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
                      
                      <button
                        onClick={() => handleChatWithDocument(doc)}
                        disabled={creatingChat === doc.id || doc.processingStatus !== 'completed'}
                        className={`ml-4 px-4 py-2 rounded-lg flex items-center gap-2 transition ${
                          doc.processingStatus === 'completed' && creatingChat !== doc.id
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                        title={doc.processingStatus === 'completed' ? 'Chat with this document using AI' : 'Document must be processed first'}
                      >
                        {creatingChat === doc.id ? (
                          <>
                            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Creating...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                            </svg>
                            Chat với tài liệu
                          </>
                        )}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No documents found. Upload one to get started!</p>
            )}
          </div>
        </div>
        <div>
          <GenerateQuizForm course={course} onQuizGenerated={handleQuizGenerated} />
          <div className="mt-8">
            <h2 className="text-3xl font-bold mb-4">Quizzes</h2>
            {course.quizzes && course.quizzes.length > 0 ? (
              <ul className="space-y-4">
                {course.quizzes.map(quiz => (
                  <li key={quiz.id} className="bg-white p-4 rounded-lg shadow-md flex justify-between items-center">
                    <p className="font-semibold">{quiz.title}</p>
                    <Link to={`/quiz/${quiz.id}`} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                      Start Quiz
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No quizzes found. Generate one from a document!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CourseDetailPage;
