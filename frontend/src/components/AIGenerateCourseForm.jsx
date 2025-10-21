import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

function AIGenerateCourseForm({ onCourseGenerated }) {
  const [allCourses, setAllCourses] = useState([]);
  const [allDocuments, setAllDocuments] = useState([]);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [urls, setUrls] = useState('');
  const [mode, setMode] = useState('documents'); // 'documents', 'urls', or 'both'
  const [courseName, setCourseName] = useState('');
  const [userGoal, setUserGoal] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchAllDocuments();
  }, []);

  const fetchAllDocuments = async () => {
    setFetchingData(true);
    try {
      // Fetch all courses first
      const courses = await authFetch('/api/Courses');
      setAllCourses(courses);

      // Fetch documents for each course
      const docsPromises = courses.map(course => 
        authFetch(`/api/Courses/${course.id}`)
      );
      const coursesWithDocs = await Promise.all(docsPromises);
      
      // Flatten all documents from all courses
      const allDocs = coursesWithDocs
        .flatMap(course => 
          (course.documents || []).map(doc => ({
            ...doc,
            courseName: course.title,
            courseId: course.id
          }))
        )
        .filter(doc => doc.processingStatus === 'completed'); // Only show processed docs

      setAllDocuments(allDocs);
    } catch (err) {
      setError(`Failed to fetch documents: ${err.message}`);
    } finally {
      setFetchingData(false);
    }
  };

  const toggleDocumentSelection = (docId) => {
    setSelectedDocuments(prev => {
      if (prev.includes(docId)) {
        return prev.filter(id => id !== docId);
      } else {
        return [...prev, docId];
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate based on mode
    const urlList = urls.trim() ? urls.split('\n').map(u => u.trim()).filter(u => u) : [];
    
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
      
      // Add documentIds if applicable
      if ((mode === 'documents' || mode === 'both') && selectedDocuments.length > 0) {
        payload.documentIds = selectedDocuments;
      }
      
      // Add URLs if applicable
      if ((mode === 'urls' || mode === 'both') && urlList.length > 0) {
        payload.urls = urlList;
      }

      const newCourse = await authFetch('/api/Courses/GenerateFromDocuments', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      // Reset form
      setSelectedDocuments([]);
      setUrls('');
      setCourseName('');
      setUserGoal('');
      setShowForm(false);
      
      if (onCourseGenerated) {
        onCourseGenerated(newCourse);
      }
      
      alert('Course generated successfully! 🎉');
    } catch (err) {
      setError(err.message || 'Failed to generate course');
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return (
      <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg shadow-md mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">✨ AI Course Generator</h3>
            <p className="text-white/90">Let AI create a structured course from your documents</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-white text-purple-600 font-bold py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
          >
            Get Started
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8 border-2 border-purple-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-2xl font-bold text-purple-600">✨ Generate Course with AI</h3>
        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Mode Selection Tabs */}
        <div className="mb-6">
          <label className="block text-gray-700 font-bold mb-3">
            Content Source
          </label>
          <div className="flex gap-2 border-b">
            <button
              type="button"
              onClick={() => setMode('documents')}
              className={`px-4 py-2 font-semibold transition-colors ${
                mode === 'documents'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📄 From Documents
            </button>
            <button
              type="button"
              onClick={() => setMode('urls')}
              className={`px-4 py-2 font-semibold transition-colors ${
                mode === 'urls'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🌐 From URLs
            </button>
            <button
              type="button"
              onClick={() => setMode('both')}
              className={`px-4 py-2 font-semibold transition-colors ${
                mode === 'both'
                  ? 'text-purple-600 border-b-2 border-purple-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔀 Both
            </button>
          </div>
        </div>

        {/* Course Name (Optional) */}
        <div className="mb-4">
          <label htmlFor="course-name" className="block text-gray-700 font-bold mb-2">
            Course Name (Optional)
          </label>
          <input
            type="text"
            id="course-name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            placeholder="Leave empty to let AI suggest a name"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          <p className="text-sm text-gray-500 mt-1">
            If left empty, AI will suggest a course name based on the content
          </p>
        </div>

        {/* Learning Goal (Optional) */}
        <div className="mb-4">
          <label htmlFor="user-goal" className="block text-gray-700 font-bold mb-2">
            Your Learning Goal (Optional)
          </label>
          <textarea
            id="user-goal"
            value={userGoal}
            onChange={(e) => setUserGoal(e.target.value)}
            placeholder="E.g., I want to learn web development from scratch"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="3"
          />
          <p className="text-sm text-gray-500 mt-1">
            Help AI tailor the course structure to your needs
          </p>
        </div>

        {/* URLs Input */}
        {(mode === 'urls' || mode === 'both') && (
          <div className="mb-4">
            <label htmlFor="urls" className="block text-gray-700 font-bold mb-2">
              URLs (one per line, max 10)
            </label>
            <textarea
              id="urls"
              value={urls}
              onChange={(e) => setUrls(e.target.value)}
              placeholder={"https://example.com/article1\nhttps://example.com/article2"}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline font-mono text-sm"
              rows="5"
            />
            <p className="text-sm text-gray-500 mt-1">
              ✨ Enter web pages, blog posts, or articles. AI will extract and analyze the content.
            </p>
          </div>
        )}

        {/* Document Selection */}
        {(mode === 'documents' || mode === 'both') && (
          <div className="mb-4">
            <label className="block text-gray-700 font-bold mb-2">
              Select Documents ({selectedDocuments.length} selected)
            </label>
          
          {fetchingData ? (
            <p className="text-gray-500">Loading documents...</p>
          ) : allDocuments.length === 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
              <p className="text-yellow-800">
                No processed documents available. Please upload and process some documents first.
              </p>
            </div>
          ) : (
            <div className="border rounded p-4 max-h-96 overflow-y-auto">
              {allDocuments.map(doc => (
                <label
                  key={doc.id}
                  className={`flex items-start p-3 mb-2 rounded cursor-pointer transition-colors ${
                    selectedDocuments.includes(doc.id)
                      ? 'bg-purple-100 border-2 border-purple-400'
                      : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedDocuments.includes(doc.id)}
                    onChange={() => toggleDocumentSelection(doc.id)}
                    className="mt-1 mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{doc.title}</div>
                    <div className="text-sm text-gray-500">
                      Course: {doc.courseName}
                      {doc.extractedText && (
                        <span className="ml-2">
                          • {Math.min(doc.extractedText.length, 100)} chars
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex gap-4">
          <button
            type="submit"
            disabled={
              loading || 
              fetchingData || 
              (mode === 'documents' && selectedDocuments.length === 0) ||
              (mode === 'urls' && !urls.trim()) ||
              (mode === 'both' && selectedDocuments.length === 0 && !urls.trim())
            }
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded focus:outline-none focus:shadow-outline disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Generating Course with AI...
              </>
            ) : (
              <>
                ✨ Generate Course
              </>
            )}
          </button>
          
          <button
            type="button"
            onClick={() => setShowForm(false)}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded"
          >
            Cancel
          </button>
        </div>

        {loading && (
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
            <p className="text-blue-800">
              🤖 AI is analyzing your documents and creating a course structure...
              <br />
              This may take 30-60 seconds depending on the content size.
            </p>
          </div>
        )}
      </form>
    </div>
  );
}

export default AIGenerateCourseForm;
