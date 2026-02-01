import { useState, useRef } from 'react';
import { studentsAPI } from '../services/api';
import ErrorMessage from '../components/ErrorMessage';
import {
    FiUpload,
    FiFile,
    FiCheck,
    FiX,
    FiDownload,
    FiAlertCircle
} from 'react-icons/fi';

const UploadCSV = () => {
    const [file, setFile] = useState(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadResult, setUploadResult] = useState(null);
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
        const droppedFile = e.dataTransfer.files[0];
        validateAndSetFile(droppedFile);
    };

    const handleFileSelect = (e) => {
        const selectedFile = e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        setError('');
        setUploadResult(null);

        if (!selectedFile) return;

        // Check file type
        if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
            setError('Please upload a CSV file only');
            return;
        }

        // Check file size (max 5MB)
        if (selectedFile.size > 5 * 1024 * 1024) {
            setError('File size should be less than 5MB');
            return;
        }

        setFile(selectedFile);
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Please select a file first');
            return;
        }

        setIsUploading(true);
        setError('');
        setUploadResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const response = await studentsAPI.uploadCSV(formData);
            setUploadResult(response.data);
            setFile(null);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload file. Please try again.');
        } finally {
            setIsUploading(false);
        }
    };

    const removeFile = () => {
        setFile(null);
        setError('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
        <div className="animate-fadeIn max-w-3xl mx-auto">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Upload Student Data</h1>
                <p className="text-gray-600 mt-1">Import students from a CSV file</p>
            </div>

            {/* CSV Format Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
                <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                    <FiAlertCircle className="w-4 h-4 mr-2" />
                    CSV Format Requirements
                </h3>
                <p className="text-sm text-blue-700 mb-3">
                    Your CSV file should have the following columns:
                </p>
                <div className="bg-white rounded-lg p-4 font-mono text-xs text-gray-700 overflow-x-auto">
                    <p className="text-blue-600 font-semibold">Sr No., Academic Year, Semester, Year, Division, Roll No, PRN Number, Student Name, Mobile Number, Email Id</p>
                    <p className="text-gray-500 mt-1">1, 2024-25, VI, TE, A, 101, PRN2024001, Rahul Sharma, 9876543210, rahul.sharma@college.edu</p>
                </div>
            </div>

            {error && (
                <div className="mb-6">
                    <ErrorMessage message={error} onClose={() => setError('')} />
                </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
                <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <FiCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-800">Upload Successful!</h3>
                            <p className="text-sm text-green-700 mt-1">
                                {uploadResult.message || 'Students have been imported successfully.'}
                            </p>
                            {uploadResult.data && (
                                <div className="mt-3 space-y-1 text-sm text-green-700">
                                    {uploadResult.data.totalRecords !== undefined && (
                                        <p>📊 Total records processed: <strong>{uploadResult.data.totalRecords}</strong></p>
                                    )}
                                    {uploadResult.data.newStudents !== undefined && (
                                        <p>✓ New students added: <strong>{uploadResult.data.newStudents}</strong></p>
                                    )}
                                    {uploadResult.data.updatedStudents !== undefined && (
                                        <p>✓ Students updated: <strong>{uploadResult.data.updatedStudents}</strong></p>
                                    )}
                                    {uploadResult.data.errors !== undefined && uploadResult.data.errors > 0 && (
                                        <p className="text-amber-600">⚠ Errors: <strong>{uploadResult.data.errors}</strong></p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Drop Zone */}
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer 
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
                />

                <div className="flex flex-col items-center">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 
                          ${isDragging ? 'bg-primary-100' : 'bg-gray-100'}`}>
                        <FiUpload className={`w-8 h-8 ${isDragging ? 'text-primary-600' : 'text-gray-400'}`} />
                    </div>
                    <p className="text-lg font-medium text-gray-700 mb-1">
                        {isDragging ? 'Drop your file here' : 'Drag & drop your CSV file'}
                    </p>
                    <p className="text-sm text-gray-500">
                        or <span className="text-primary-600 font-medium">browse</span> to choose a file
                    </p>
                    <p className="text-xs text-gray-400 mt-2">Maximum file size: 5MB</p>
                </div>
            </div>

            {/* Selected File */}
            {file && (
                <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                                <FiFile className="w-6 h-6 text-primary-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-800">{file.name}</p>
                                <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                            </div>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeFile();
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Upload Button */}
            <div className="mt-6 flex justify-end">
                <button
                    onClick={handleUpload}
                    disabled={!file || isUploading}
                    className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-primary-700 
                     to-primary-800 text-white font-medium rounded-lg hover:from-primary-600 
                     hover:to-primary-700 disabled:opacity-50 disabled:cursor-not-allowed 
                     transition-all duration-200 shadow-lg shadow-primary-200"
                >
                    {isUploading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            <span>Uploading...</span>
                        </>
                    ) : (
                        <>
                            <FiUpload className="w-5 h-5" />
                            <span>Upload Students</span>
                        </>
                    )}
                </button>
            </div>

            {/* Sample Download */}
            <div className="mt-8 text-center">
                <p className="text-sm text-gray-500 mb-2">Need a sample file?</p>
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
                    className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 
                     font-medium text-sm"
                >
                    <FiDownload className="w-4 h-4" />
                    <span>Download Sample CSV</span>
                </button>
            </div>
        </div>
    );
};

export default UploadCSV;
