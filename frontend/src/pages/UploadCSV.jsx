import { useState, useRef } from 'react';
import { studentsAPI } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import {
    FiUpload,
    FiFile,
    FiCheck,
    FiX,
    FiDownload,
    FiAlertCircle,
    FiLoader
} from 'react-icons/fi';

const UploadCSV = () => {
    const [files, setFiles] = useState([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResults, setUploadResults] = useState([]);
    const [error, setError] = useState('');
    const fileInputRef = useRef(null);

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFiles = Array.from(e.dataTransfer.files);
        validateAndAddFiles(droppedFiles);
    };

    const handleFileSelect = (e) => {
        const selectedFiles = Array.from(e.target.files);
        validateAndAddFiles(selectedFiles);
    };

    const validateAndAddFiles = (selectedFiles) => {
        setError('');
        setUploadResults([]);

        const validFiles = [];
        const invalidFiles = [];

        selectedFiles.forEach(file => {
            // Check file type
            if (!file.name.toLowerCase().endsWith('.csv')) {
                invalidFiles.push(`${file.name} (Not a CSV)`);
                return;
            }

            // Check file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                invalidFiles.push(`${file.name} (Too large > 5MB)`);
                return;
            }

            // check for duplicates
            if (files.some(f => f.name === file.name && f.size === file.size)) {
                invalidFiles.push(`${file.name} (Already selected)`);
                return;
            }

            validFiles.push(file);
        });

        if (invalidFiles.length > 0) {
            setError(`Skipped invalid files: ${invalidFiles.join(', ')}`);
        }

        setFiles(prev => [...prev, ...validFiles]);
    };

    const handleUpload = async () => {
        if (files.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadResults([]);

        const results = [];

        for (const file of files) {
            try {
                const formData = new FormData();
                formData.append('file', file);

                const response = await studentsAPI.uploadCSV(formData);
                results.push({
                    fileName: file.name,
                    success: true,
                    data: response.data
                });
            } catch (err) {
                results.push({
                    fileName: file.name,
                    success: false,
                    error: err.response?.data?.message || err.message || 'Failed to upload'
                });
            }
        }

        setUploadResults(results);
        setFiles([]); // Clear queue after processing
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
        setIsUploading(false);
    };

    const removeFile = (indexToRemove) => {
        setFiles(prev => prev.filter((_, index) => index !== indexToRemove));
        setError('');
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="animate-fadeIn max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-4">
                <h1 className="text-2xl font-bold text-gray-800">Upload Student Data</h1>
                <p className="text-gray-600 text-sm">Import students from CSV files</p>
            </div>

            {/* CSV Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-2" />
                    CSV Format Requirements
                </h3>
                <p className="text-sm text-blue-700 mb-2">
                    Your CSV file should have the following columns:
                </p>
                <div className="bg-white rounded-lg p-3 font-mono text-xs text-gray-700 overflow-x-auto mb-3">
                    <p className="text-blue-600 font-semibold">Sr No., Academic Year, Semester, Year, Division, Roll No, PRN Number, Student Name, Mobile Number, Email Id</p>
                    <p className="text-gray-500 mt-1">1, 2024-25, VI, TE, A, 101, PRN2024001, Rahul Sharma, 9876543210, rahul.sharma@college.edu</p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-blue-200">
                    <p className="text-sm text-blue-700">Need a sample file?</p>
                    <button
                        onClick={() => {
                            const csvContent = "Student Guardian List\nSr No.,Academic Year,Semester,Year,Division,Roll No,PRN Number,Student Name,Mobile Number,Email Id\n1,2024-25,VI,TE,A,101,PRN2024001,Rahul Sharma,9876543210,rahul.sharma@college.edu\n2,2024-25,VI,TE,A,102,PRN2024002,Priya Patel,9876543211,priya.patel@college.edu\n3,2024-25,VI,TE,B,103,PRN2024003,Amit Kumar,9876543212,amit.kumar@college.edu\n4,2024-25,VI,TE,B,104,PRN2024004,Sneha Gupta,9876543213,sneha.gupta@college.edu\n5,2024-25,IV,SE,A,201,PRN2024005,Vikram Singh,9876543214,vikram.singh@college.edu\n6,2024-25,IV,SE,A,202,PRN2024006,Neha Verma,9876543215,neha.verma@college.edu\n7,2024-25,IV,SE,B,203,PRN2024007,Rohan Deshmukh,9876543216,rohan.deshmukh@college.edu\n8,2024-25,II,FE,A,301,PRN2024008,Ananya Iyer,9876543217,ananya.iyer@college.edu\n9,2024-25,II,FE,A,302,PRN2024009,Karan Mehta,9876543218,karan.mehta@college.edu\n10,2024-25,II,FE,B,303,PRN2024010,Pooja Joshi,9876543219,pooja.joshi@college.edu";
                            const blob = new Blob([csvContent], { type: 'text/csv' });
                            const url = window.URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'sample_students.csv';
                            a.click();
                            window.URL.revokeObjectURL(url);
                        }}
                        className="inline-flex items-center space-x-2 text-blue-700 hover:text-blue-800 
                         font-medium text-sm bg-white px-3 py-1.5 rounded-lg border border-blue-300 hover:bg-blue-100 transition-colors"
                    >
                        <FiDownload className="w-4 h-4" />
                        <span>Download Sample CSV</span>
                    </button>
                </div>
            </div>

            {error && (
                <div className="mb-4">
                    <ErrorMessage message={error} onClose={() => setError('')} />
                </div>
            )}

            {/* Upload Results */}
            {uploadResults.length > 0 && (
                <div className="space-y-3 mb-6">
                    {uploadResults.map((result, index) => (
                        <div key={index} className={`p-4 border rounded-xl ${result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                            }`}>
                            <div className="flex items-start space-x-3">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${result.success ? 'bg-green-500' : 'bg-red-500'
                                    }`}>
                                    {result.success ? (
                                        <FiCheck className="w-4 h-4 text-white" />
                                    ) : (
                                        <FiX className="w-4 h-4 text-white" />
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-semibold ${result.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {result.fileName}
                                    </h3>
                                    {result.success ? (
                                        <div className="mt-1 text-sm text-green-700">
                                            {result.data.data ? (
                                                <div className="space-y-1">
                                                    <p>✓ Processed: {result.data.data.totalRecords} records</p>
                                                    <p>✓ Added: {result.data.data.newStudents} new students</p>
                                                    <p>✓ Updated: {result.data.data.updatedStudents} distinct students</p>
                                                    {result.data.data.errors > 0 && (
                                                        <p className="text-amber-600">⚠ {result.data.data.errors} row errors</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <p>{result.data.message}</p>
                                            )}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-red-700 mt-1">{result.error}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer 
                    transition-all duration-200 ${isDragging
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
                    }`}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept=".csv"
                    className="hidden"
                    multiple
                />

                <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 
                          ${isDragging ? 'bg-primary-100' : 'bg-gray-100'}`}>
                        <FiUpload className={`w-6 h-6 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-base font-medium text-gray-700 mb-1">
                        {isDragging ? 'Drop your files here' : 'Drag & drop multiple CSV files'}
                    </p>
                    <p className="text-sm text-gray-500">
                        or <span className="text-primary-600 font-medium">browse</span> to choose files
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Maximum file size: 5MB each</p>
                </div>
            </div>

            {/* Selected Files List */}
            {files.length > 0 && (
                <div className="mt-4 space-y-2">
                    {files.map((file, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-3 animate-fadeIn">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                                        <FiFile className="w-5 h-5 text-primary-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-800">{file.name}</p>
                                        <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                                    </div>
                                </div>
                                {!isUploading && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeFile(index);
                                        }}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <FiX className="w-5 h-5" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleUpload}
                    disabled={files.length === 0 || isUploading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-700 
                     to-primary-800 text-white font-medium rounded-lg hover:from-primary-600 
                     hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-all duration-200 shadow-lg shadow-primary-200"
                >
                    {isUploading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Uploading {files.length} file{files.length !== 1 ? 's' : ''}...</span>
                        </>
                    ) : (
                        <>
                            <FiUpload className="w-5 h-5" />
                            <span>Upload {files.length > 0 ? `${files.length} Files` : 'Files'}</span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

export default UploadCSV;
