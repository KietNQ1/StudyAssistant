import React, { useState, useEffect } from 'react';
import { authFetch } from '../utils/authFetch';

function ChatDocumentManager({ sessionId, courseId }) {
  const [attachedDocs, setAttachedDocs] = useState([]);
  const [availableDocs, setAvailableDocs] = useState([]);
  const [showSelector, setShowSelector] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAttachedDocuments();
    if (courseId) {
      fetchAvailableDocuments();
    }
  }, [sessionId, courseId]);

  const fetchAttachedDocuments = async () => {
    try {
      const docs = await authFetch(`/api/ChatSessionDocuments/session/${sessionId}`);
      setAttachedDocs(docs);
    } catch (err) {
      console.error('Failed to fetch attached documents:', err);
    }
  };

  const fetchAvailableDocuments = async () => {
    try {
      const course = await authFetch(`/api/Courses/${courseId}`);
      setAvailableDocs(course.documents || []);
    } catch (err) {
      console.error('Failed to fetch available documents:', err);
    }
  };

  const handleAddDocument = async (documentId) => {
    setLoading(true);
    try {
      await authFetch('/api/ChatSessionDocuments', {
        method: 'POST',
        body: JSON.stringify({
          chatSessionId: sessionId,
          documentId: documentId
        })
      });
      
      await fetchAttachedDocuments();
      setShowSelector(false);
    } catch (err) {
      alert(`Failed to add document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDocument = async (attachmentId) => {
    if (!confirm('Remove this document from chat?')) return;
    
    setLoading(true);
    try {
      await authFetch(`/api/ChatSessionDocuments/${attachmentId}`, {
        method: 'DELETE'
      });
      
      await fetchAttachedDocuments();
    } catch (err) {
      alert(`Failed to remove document: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filter out already attached documents
  const unattachedDocs = availableDocs.filter(
    doc => !attachedDocs.some(attached => attached.documentId === doc.id)
  );

  return (
    <div className="bg-gray-50 border-b p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Documents in this chat ({attachedDocs.length})
        </h3>
        
        {courseId && (
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="text-sm bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded flex items-center gap-1"
            disabled={loading}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Documents
          </button>
        )}
      </div>

      {/* Attached Documents List */}
      {attachedDocs.length > 0 ? (
        <div className="space-y-2">
          {attachedDocs.map((attached) => (
            <div
              key={attached.id}
              className="bg-white rounded-lg p-3 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-3 flex-1">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {attached.document.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {attached.document.fileType}
                  </p>
                </div>

                {attached.document.processingStatus && (
                  <span className={`text-xs px-2 py-1 rounded ${
                    attached.document.processingStatus === 'completed' ? 'bg-green-100 text-green-700' :
                    attached.document.processingStatus === 'failed' ? 'bg-red-100 text-red-700' :
                    'bg-yellow-100 text-yellow-700'
                  }`}>
                    {attached.document.processingStatus === 'completed' ? '✅' :
                     attached.document.processingStatus === 'failed' ? '❌' : '⏳'}
                  </span>
                )}
              </div>

              <button
                onClick={() => handleRemoveDocument(attached.id)}
                className="ml-2 text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50"
                disabled={loading}
                title="Remove document"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500 text-sm bg-white rounded-lg border-2 border-dashed">
          <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p>No documents attached</p>
          <p className="text-xs mt-1">Click "Add Documents" to get started</p>
        </div>
      )}

      {/* Document Selector Modal */}
      {showSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add Documents to Chat</h3>
              <button
                onClick={() => setShowSelector(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {unattachedDocs.length > 0 ? (
              <div className="space-y-2">
                {unattachedDocs.map((doc) => (
                  <div
                    key={doc.id}
                    className="border rounded-lg p-3 hover:bg-gray-50 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{doc.title}</p>
                      <p className="text-sm text-gray-500">{doc.fileType}</p>
                      {doc.processingStatus && (
                        <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                          doc.processingStatus === 'completed' ? 'bg-green-100 text-green-700' :
                          doc.processingStatus === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {doc.processingStatus === 'completed' ? '✅ Ready' :
                           doc.processingStatus === 'failed' ? '❌ Failed' :
                           '⏳ Processing'}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddDocument(doc.id)}
                      disabled={loading || doc.processingStatus !== 'completed'}
                      className={`ml-4 px-4 py-2 rounded ${
                        doc.processingStatus === 'completed'
                          ? 'bg-blue-500 hover:bg-blue-600 text-white'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {loading ? 'Adding...' : 'Add'}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">
                All available documents are already attached to this chat.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ChatDocumentManager;
