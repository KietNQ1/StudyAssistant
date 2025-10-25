import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

function TopicSidebar({ topics, onTopicSelect, onTopicsUpdate, courseId }) {
  const [expandedTopics, setExpandedTopics] = useState(new Set());
  const [showAddForm, setShowAddForm] = useState(false);
  const { topicId: activeTopicId } = useParams();

  const toggleExpand = (topicId) => {
    const newExpanded = new Set(expandedTopics);
    if (newExpanded.has(topicId)) {
      newExpanded.delete(topicId);
    } else {
      newExpanded.add(topicId);
    }
    setExpandedTopics(newExpanded);
  };

  const renderTopic = (topic, level = 0) => {
    const hasChildren = topic.children && topic.children.length > 0;
    const isExpanded = expandedTopics.has(topic.id);
    const isActive = parseInt(activeTopicId) === topic.id;
    const indent = level * 16;

    return (
      <div key={topic.id}>
        <div
          className={`
            flex items-center px-3 py-2 cursor-pointer hover:bg-gray-100 transition-colors
            ${isActive ? 'bg-blue-50 border-r-4 border-blue-500' : ''}
          `}
          style={{ paddingLeft: `${indent + 12}px` }}
        >
          <div className="flex items-center flex-1" onClick={() => onTopicSelect(topic.id)}>
            {hasChildren && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpand(topic.id);
                }}
                className="mr-2 text-gray-500 hover:text-gray-700"
              >
                {isExpanded ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </button>
            )}
            {!hasChildren && (
              <span className="w-4 mr-2"></span>
            )}
            <div className="flex-1">
              <div className={`text-sm ${isActive ? 'font-semibold text-blue-700' : ''}`}>
                {topic.title}
              </div>
              {topic.estimatedTimeMinutes > 0 && (
                <div className="text-xs text-gray-500">
                  {topic.estimatedTimeMinutes} phút
                </div>
              )}
            </div>
            {topic.isCompleted && (
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>
        {hasChildren && isExpanded && (
          <div>
            {topic.children.map(child => renderTopic(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {topics.length > 0 ? (
          topics.map(topic => renderTopic(topic))
        ) : (
          <div className="p-4 text-center text-gray-500 text-sm">
            Chưa có nội dung
          </div>
        )}
      </div>
      
      {/* Quick Actions */}
      <div className="p-3 border-t">
        <button
          onClick={() => window.location.href = `/courses/${courseId}`}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
        >
          <span className="mr-2">⚙️</span>
          Quản lý Topics
        </button>
        <button
          onClick={() => window.location.href = `/courses/${courseId}`}
          className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded"
        >
          <span className="mr-2">📊</span>
          Tổng quan khóa học
        </button>
      </div>
    </div>
  );
}

export default TopicSidebar;