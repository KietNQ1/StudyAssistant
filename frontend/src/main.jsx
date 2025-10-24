import React from 'react'
import ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.jsx'
import HomePage from './pages/HomePage.jsx';
import CoursesPage from './pages/CoursesPage.jsx';
import CourseDetailPage from './pages/CourseDetailPage.jsx';
import CourseLayout from './layouts/CourseLayout.jsx';
import TopicContentPage from './pages/TopicContentPage.jsx';
import ChatPage from './pages/ChatPage.jsx';
import ChatSessionsPage from './pages/ChatSessionsPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import QuizPage from './pages/QuizPage.jsx';
import './index.css'

const GOOGLE_CLIENT_ID = "264224102507-jd0sl8ig5fq2seuo05keav8n7vanq8uu.apps.googleusercontent.com";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <HomePage />,
      },
      {
        path: "courses",
        element: <CoursesPage />,
      },
      {
        path: "courses/:id",
        element: <CourseDetailPage />,
      },
      {
        path: "course/:courseId",
        element: <CourseLayout />,
        children: [
          {
            path: "",
            element: <TopicContentPage />,
          },
          {
            path: "topic/:topicId",
            element: <TopicContentPage />,
          },
        ],
      },
      {
        path: "chat-sessions",
        element: <ChatSessionsPage />,
      },
      {
        path: "chat-sessions/:sessionId",
        element: <ChatSessionsPage />,
      },
      {
        path: "quiz/:id",
        element: <QuizPage />,
      }
    ],
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/chat/:sessionId",
    element: <ChatPage />,
  }
]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <RouterProvider router={router} />
    </GoogleOAuthProvider>
  </React.StrictMode>,
)
