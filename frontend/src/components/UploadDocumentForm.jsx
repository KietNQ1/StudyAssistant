import React, { useState } from 'react';
import { Upload, FileText, X, Sparkles } from 'lucide-react';
import { authUploadFetch } from '../utils/authFetch';

function UploadDocumentForm({ courseId, onDocumentUploaded }) {
    const [file, setFile] = useState(null);
    const [title, setTitle] = useState('');
    const [error, setError] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);

        // Auto-fill title from filename if title is empty
        if (selectedFile && !title) {
            const fileName = selectedFile.name.replace(/\.[^/.]+$/, ''); // Remove extension
            setTitle(fileName);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !title) {
            setError('Vui lòng cung cấp tiêu đề và chọn file.');
            return;
        }

        setSubmitting(true);
        setError(null);

        const formData = new FormData();
        formData.append('courseId', courseId);
        formData.append('title', title);
        formData.append('file', file);

        try {
            const newDocument = await authUploadFetch('/api/Documents', {
                method: 'POST',
                body: formData,
            });
            onDocumentUploaded(newDocument);
            setTitle('');
            setFile(null);
            // Clear the file input visually
            e.target.reset();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        // Reset file input
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div>
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Document Title */}
                <div>
                    <label
                        htmlFor="doc-title"
                        className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-2"
                    >
                        <FileText className="w-4 h-4" />
                        Tiêu đề tài liệu <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        id="doc-title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Nhập tên tài liệu..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent text-gray-900 placeholder-gray-400"
                        required
                    />
                </div>

                {/* File Upload */}
                <div>
                    <label
                        htmlFor="file-upload"
                        className="flex items-center gap-2 text-base font-semibold text-gray-900 mb-2"
                    >
                        <Upload className="w-4 h-4" />
                        Chọn file <span className="text-red-500">*</span>
                    </label>

                    {!file ? (
                        <label
                            htmlFor="file-upload"
                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <Upload className="w-10 h-10 text-gray-400 mb-3" />
                                <p className="mb-2 text-sm text-gray-600">
                                    <span className="font-semibold">Click để chọn file</span> hoặc kéo thả
                                </p>
                                <p className="text-xs text-gray-500">
                                    PDF, DOCX, TXT, PPT (MAX. 10MB)
                                </p>
                            </div>
                            <input
                                id="file-upload"
                                type="file"
                                className="hidden"
                                onChange={handleFileChange}
                                required
                            />
                        </label>
                    ) : (
                        <div className="flex items-center justify-between p-4 border-2 border-gray-900 rounded-lg bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900">{file.name}</p>
                                    <p className="text-sm text-gray-500">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={removeFile}
                                className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {/* Submit Button */}
                <div className="flex gap-4 pt-2">
                    <button
                        type="submit"
                        disabled={submitting || !file || !title}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        <Sparkles className="w-5 h-5" />
                        {submitting ? 'Đang tải lên...' : 'Upload Document'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default UploadDocumentForm;
