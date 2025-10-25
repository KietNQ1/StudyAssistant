import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Brain,
    CheckCircle2,
    Circle,
    Trophy,
    ArrowLeft,
    Clock,
    Award,
    Target,
    Sparkles,
    Star,
    TrendingUp
} from 'lucide-react';
import { authFetch } from '../utils/authFetch';

function QuizPage() {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [result, setResult] = useState(null);
    const { id } = useParams();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchQuiz = async () => {
            setLoading(true);
            try {
                const data = await authFetch(`/api/Quizzes/${id}`);
                setQuiz(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [id]);

    const handleOptionChange = (questionId, optionId) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: optionId,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        try {
            const attemptData = await authFetch('/api/QuizAttempts', {
                method: 'POST',
                body: JSON.stringify({ quizId: quiz.id, userId: 1 }),
            });

            const formattedAnswers = Object.keys(answers).map(questionId => ({
                questionId: parseInt(questionId),
                selectedOptionId: answers[questionId],
            }));

            const resultData = await authFetch(`/api/QuizAttempts/${attemptData.id}/Submit`, {
                method: 'POST',
                body: JSON.stringify(formattedAnswers),
            });

            setResult(resultData);

        } catch (err) {
            setError(`Failed to submit quiz: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const totalQuestions = quiz?.quizQuestions?.length || 0;
    const answeredQuestions = Object.keys(answers).length;
    const progressPercentage = totalQuestions > 0 ? (answeredQuestions / totalQuestions) * 100 : 0;

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
                    <p className="text-gray-600">Đang tải quiz...</p>
                </div>
            </div>
        );
    }

    if (error && !quiz) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                    <p className="text-red-600">Lỗi: {error}</p>
                </div>
            </div>
        );
    }

    if (!quiz) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-8">
                <p className="text-gray-600">Không tìm thấy quiz.</p>
            </div>
        );
    }

    if (result) {
        const isPerfectScore = result.percentage === 100;
        const isGoodScore = result.percentage >= 70;
        const isPassingScore = result.percentage >= 50;

        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-900 overflow-hidden">
                        {/* Header stripe */}
                        <div className="h-2 bg-gray-900"></div>

                        <div className="p-8">
                            {/* Icon and stars decoration */}
                            <div className="relative mb-6">
                                {isPerfectScore && (
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Star className="w-6 h-6 text-gray-300 absolute -top-2 -left-6 animate-pulse" />
                                        <Star className="w-5 h-5 text-gray-300 absolute -top-4 right-2 animate-pulse delay-100" />
                                        <Star className="w-5 h-5 text-gray-300 absolute -bottom-1 -left-2 animate-pulse delay-200" />
                                        <Star className="w-4 h-4 text-gray-300 absolute -bottom-2 right-6 animate-pulse delay-300" />
                                    </div>
                                )}

                                <div className="w-24 h-24 mx-auto rounded-full bg-gray-900 flex items-center justify-center relative z-10 shadow-lg">
                                    {isPerfectScore ? (
                                        <Trophy className="w-12 h-12 text-white" />
                                    ) : isGoodScore ? (
                                        <Award className="w-12 h-12 text-white" />
                                    ) : isPassingScore ? (
                                        <TrendingUp className="w-12 h-12 text-white" />
                                    ) : (
                                        <Target className="w-12 h-12 text-white" />
                                    )}
                                </div>
                            </div>

                            {/* Title */}
                            <div className="text-center mb-6">
                                <h1 className="text-4xl font-bold mb-2 text-gray-900">
                                    {isPerfectScore ? 'Hoàn hảo!' : isGoodScore ? 'Xuất sắc!' : isPassingScore ? 'Tốt lắm!' : 'Hoàn thành!'}
                                </h1>
                                <p className="text-gray-600">
                                    {isPerfectScore
                                        ? 'Bạn đã đạt điểm tuyệt đối'
                                        : isGoodScore
                                            ? 'Kết quả ấn tượng của bạn'
                                            : isPassingScore
                                                ? 'Bạn đã vượt qua bài kiểm tra'
                                                : 'Kết quả bài kiểm tra của bạn'}
                                </p>
                            </div>

                            {/* Score Display */}
                            <div className="bg-gray-50 rounded-xl p-6 mb-6 border-2 border-gray-200">
                                <div className="text-center mb-4">
                                    <div className="text-7xl font-bold text-gray-900 mb-1">
                                        {result.percentage.toFixed(0)}%
                                    </div>
                                    <div className="flex items-center justify-center gap-2 text-xl text-gray-700">
                                        <span className="font-semibold">{result.score}</span>
                                        <span className="text-gray-400">/</span>
                                        <span>{result.totalPoints}</span>
                                        <span className="text-gray-500 text-base ml-1">điểm</span>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-gray-900 h-2.5 rounded-full transition-all duration-1000 ease-out"
                                        style={{ width: `${result.percentage}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Message */}
                            <div className="bg-gray-900 text-white rounded-xl p-4 mb-6 text-center">
                                <div className="flex items-center justify-center gap-2 mb-1">
                                    <Sparkles className="w-4 h-4" />
                                    <p className="font-semibold">
                                        {isPerfectScore
                                            ? 'Thành tích đáng kinh ngạc!'
                                            : isGoodScore
                                                ? 'Làm rất tốt!'
                                                : isPassingScore
                                                    ? 'Tiếp tục phát huy!'
                                                    : 'Đừng bỏ cuộc!'}
                                    </p>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    {isPerfectScore
                                        ? 'Bạn đã trả lời chính xác tất cả các câu hỏi!'
                                        : isGoodScore
                                            ? 'Bạn đã nắm vững kiến thức. Hãy tiếp tục duy trì!'
                                            : isPassingScore
                                                ? 'Hãy luyện tập thêm để tiến bộ hơn!'
                                                : 'Hãy xem lại kiến thức và thử lại nhé!'}
                                </p>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <button
                                    onClick={() => window.location.reload()}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-white border-2 border-gray-900 text-gray-900 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                                >
                                    <Target className="w-5 h-5" />
                                    Làm lại
                                </button>
                                <button
                                    onClick={() => navigate('/courses')}
                                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-colors"
                                >
                                    <ArrowLeft className="w-5 h-5" />
                                    Về khóa học
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => navigate(-1)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-600" />
                            </button>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Brain className="w-5 h-5 text-gray-900" />
                                    <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-4 h-4" />
                                        {totalQuestions * 2} phút
                                    </span>
                                    <span>•</span>
                                    <span>{totalQuestions} câu hỏi</span>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={submitting || answeredQuestions < totalQuestions}
                            className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            <Sparkles className="w-5 h-5" />
                            {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
                        </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Tiến độ</span>
                            <span className="font-medium text-gray-900">
                                {answeredQuestions}/{totalQuestions} câu
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-gray-900 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${progressPercentage}%` }}
                            />
                        </div>
                        {answeredQuestions < totalQuestions && (
                            <p className="text-xs text-amber-600">
                                Vui lòng trả lời tất cả câu hỏi trước khi nộp bài
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Questions Grid */}
            <div className="max-w-7xl mx-auto px-8 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    {/* Question Navigator */}
                    <div className="lg:col-span-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-4 sticky top-44">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Danh sách câu hỏi</h3>
                            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
                                {quiz.quizQuestions.map((quizQuestion, index) => {
                                    const questionId = quizQuestion.question.id;
                                    const isAnswered = answers.hasOwnProperty(questionId);

                                    return (
                                        <button
                                            key={quizQuestion.id}
                                            type="button"
                                            onClick={() => {
                                                const element = document.getElementById(`question-${questionId}`);
                                                element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                            }}
                                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all ${isAnswered
                                                    ? 'bg-gray-900 text-white'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {isAnswered && <CheckCircle2 className="w-4 h-4" />}
                                            {!isAnswered && (index + 1)}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className="lg:col-span-3 space-y-6">
                        {quiz.quizQuestions.map((quizQuestion, index) => {
                            const questionId = quizQuestion.question.id;
                            const isAnswered = answers.hasOwnProperty(questionId);

                            return (
                                <div
                                    key={quizQuestion.id}
                                    id={`question-${questionId}`}
                                    className={`bg-white border-2 rounded-lg p-6 transition-all ${isAnswered
                                            ? 'border-gray-900 shadow-md'
                                            : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-semibold ${isAnswered
                                                ? 'bg-gray-900 text-white'
                                                : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <h3 className="text-base font-semibold text-gray-900 leading-tight">
                                            {quizQuestion.question.questionText}
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        {quizQuestion.question.questionOptions.map(option => {
                                            const isSelected = answers[questionId] === option.id;

                                            return (
                                                <label
                                                    key={option.id}
                                                    className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all ${isSelected
                                                            ? 'border-gray-900 bg-gray-50'
                                                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name={`question-${questionId}`}
                                                        value={option.id}
                                                        checked={isSelected}
                                                        onChange={() => handleOptionChange(questionId, option.id)}
                                                        className="hidden"
                                                    />
                                                    <div className="flex items-center gap-3 flex-1">
                                                        {isSelected ? (
                                                            <CheckCircle2 className="w-5 h-5 text-gray-900 flex-shrink-0" />
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                                        )}
                                                        <span className={`text-sm ${isSelected ? 'font-medium text-gray-900' : 'text-gray-700'
                                                            }`}>
                                                            {option.optionText}
                                                        </span>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default QuizPage;