import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AddCourseForm from '../components/AddCourseForm';
import AIGenerateCourseForm from '../components/AIGenerateCourseForm';
import { authFetch } from '../utils/authFetch';

function CoursesPage() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

    const handleCourseAdded = (newCourse) => {
        setCourses((prevCourses) => [newCourse, ...prevCourses]);
    };

    return (
        <div className="min-h-screen bg-white text-gray-900 font-inter p-10">
                {/* 2-COLUMN LAYOUT */}
            <div className="max-w-6xl mx-auto grid lg:grid-cols-[2fr_1fr] gap-10 items-start">
                {/* LEFT COLUMN - CREATE COURSE */}
                <div>
                    <h3 className="text-2xl font-bold mb-6">Create a New Course</h3>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8 mb-8">
                        <AIGenerateCourseForm onCourseGenerated={handleCourseAdded} />
                    </div>

                    <div className="bg-gray-50 border border-gray-200 rounded-2xl shadow-sm p-8">
                        <AddCourseForm onCourseAdded={handleCourseAdded} />
                    </div>
                </div>

                {/* RIGHT COLUMN - YOUR COURSES */}
                <div>
                    <h3 className="text-2xl font-bold mb-6">Your Courses</h3>

                    {loading && <p>Loading courses...</p>}
                    {error && <p className="text-red-500">Error: {error}</p>}

                    <div className="space-y-5">
                        {courses.map((course) => (
                            <Link
                                to={`/courses/${course.id}`}
                                key={course.id}
                                className="block bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition p-5"
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-black text-white p-2 rounded-full text-lg">
                                        📘
                                    </div>
                                    <h4 className="font-semibold text-lg">{course.title}</h4>
                                </div>
                                <p className="text-gray-600 text-sm leading-relaxed mb-2">
                                    {course.description || 'No description provided.'}
                                </p>
                                <span className="text-black text-sm font-medium hover:underline">
                                    Continue →
                                </span>
                            </Link>
                        ))}

                        {!loading && courses.length === 0 && (
                            <p className="text-gray-500 text-sm">
                                No courses yet. Create one on the left!
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="border-t border-gray-100 mt-20 py-8 text-center text-gray-500 text-sm">
                © 2025 Study Assistant — Designed for learners, powered by AI.
            </footer>
        </div>
    );
}

export default CoursesPage;