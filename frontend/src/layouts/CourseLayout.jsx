import React, { useState, useEffect } from 'react';
import { Outlet, useParams, useNavigate } from 'react-router-dom';
import TopicSidebar from '../components/TopicSidebar';
import { authFetch } from '../utils/authFetch';

function CourseLayout() {
  const [course, setCourse] = useState(null);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { courseId } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCourseAndTopics();
  }, [courseId]);

  const fetchCourseAndTopics = async () => {
    setLoading(true);
    try {
      // Fetch course details
      const courseData = await authFetch(`/api/Courses/${courseId}`);
      setCourse(courseData);
      
      // Fetch topics tree
      const topicsData = await authFetch(`/api/Topics/course/${courseId}/tree`);
      setTopics(topicsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTopicSelect = (topicId) => {
    navigate(`/course/${courseId}/topic/${topicId}`);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-xl">Đang tải khóa học...</div>
    </div>
  );

  if (error) return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-red-500">Lỗi: {error}</div>
    </div>
  );

  if (!course) return (
    <div className="flex items-center justify-center h-screen">
      <div>Không tìm thấy khóa học</div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} transition-all duration-300 bg-white shadow-lg`}>
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div>
                <h2 className="text-lg font-bold truncate">{course.title}</h2>
                <p className="text-sm text-gray-600">Nội dung khóa học</p>
              </div>
            )}
            <button
              onClick={toggleSidebar}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              {sidebarCollapsed ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {!sidebarCollapsed && (
          <TopicSidebar 
            topics={topics}
            onTopicSelect={handleTopicSelect}
            onTopicsUpdate={fetchCourseAndTopics}
            courseId={courseId}
          />
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto">
        <Outlet context={{ course, topics, refreshTopics: fetchCourseAndTopics }} />
      </div>
    </div>
  );
}

export default CourseLayout;