import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentsAPI, categoryAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import {
    FiArrowLeft,
    FiFileText,
    FiCalendar,
    FiCheck,
    FiUser,
    FiTag
} from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';

const AddPayment = () => {
    const { prn } = useParams();
    const navigate = useNavigate();

    const [student, setStudent] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState({
        amount: '',
        reason: '',
        type: 'fine',
        category: '',
        customCategory: '',
        date: new Date().toLocaleString('sv').slice(0, 16).replace(' ', 'T') // Format: YYYY-MM-DDTHH:mm
    });

    useEffect(() => {
        fetchData();
    }, [prn]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [studentRes, categoriesRes] = await Promise.all([
                studentsAPI.getByPRN(prn),
                categoryAPI.getAll({ activeOnly: 'true' })
            ]);
            setStudent(studentRes.data.data);
            setCategories(categoriesRes.data.data?.categories || []);
        } catch (err) {
            setError('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        const selectedCategory = formData.category === 'Others'
            ? (formData.customCategory.trim() || 'Others')
            : formData.category;

        if (!selectedCategory) {
            setError('Please select a category');
            return;
        }

        setSubmitting(true);
        setError('');

        try {
            await studentsAPI.addFine(prn, {
                amount: parseFloat(formData.amount),
                reason: formData.reason.trim() || '',
                type: formData.type,
                category: selectedCategory,
                date: formData.date
            });

            setSuccess(true);

            // Reset form
            setFormData({
                amount: '',
                reason: '',
                type: 'fine',
                category: '',
                customCategory: '',
                date: new Date().toLocaleString('sv').slice(0, 16).replace(' ', 'T')
            });

            // Redirect after delay
            setTimeout(() => {
                navigate(`/student/${prn}`);
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add payment. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Filter categories based on selected type
    const filteredCategories = categories.filter(cat => cat.type === formData.type);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" text="Loading..." />
            </div>
        );
    }

    if (!student) {
        return (
            <div className="max-w-2xl mx-auto">
                <ErrorMessage message={error || 'Student not found'} />
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/search')}
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Back to Search</span>
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fadeIn max-w-2xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
            >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
            </button>

            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Add Payment</h1>
                <p className="text-gray-600 mt-1">Record a fine or fee payment for this student</p>
            </div>

            {/* Student Info */}
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-5 mb-6">
                <div className="flex items-center space-x-4">
                    <div className="w-14 h-14 bg-primary-700 rounded-full flex items-center justify-center">
                        <FiUser className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-sm text-primary-600">Adding payment to:</p>
                        <h3 className="text-lg font-semibold text-primary-800">{student.name}</h3>
                        <p className="text-sm text-primary-600">PRN: {student.prn} • {student.division || student.department}</p>
                    </div>
                </div>
            </div>

            {/* Success Message */}
            {success && (
                <div className="mb-6 p-5 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
                            <FiCheck className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-green-800">Payment Added Successfully!</h3>
                            <p className="text-sm text-green-700">Redirecting to student details...</p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6">
                    <ErrorMessage message={error} onClose={() => setError('')} />
                </div>
            )}

            {/* Payment Form */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Payment Type */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Payment Type <span className="text-red-500">*</span>
                        </label>
                        <div className="flex space-x-4">
                            <label className={`flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === 'fine'
                                ? 'border-red-500 bg-red-50 text-red-700'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="fine"
                                    checked={formData.type === 'fine'}
                                    onChange={handleChange}
                                    className="sr-only"
                                />
                                <div className="text-center">
                                    <BiRupee className={`w-6 h-6 mx-auto mb-1 ${formData.type === 'fine' ? 'text-red-600' : 'text-gray-400'}`} />
                                    <span className="font-medium">Fine</span>
                                    <p className="text-xs text-gray-500 mt-1">Penalty charges</p>
                                </div>
                            </label>
                            <label className={`flex-1 flex items-center justify-center p-4 border-2 rounded-lg cursor-pointer transition-all ${formData.type === 'fee'
                                ? 'border-blue-500 bg-blue-50 text-blue-700'
                                : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <input
                                    type="radio"
                                    name="type"
                                    value="fee"
                                    checked={formData.type === 'fee'}
                                    onChange={handleChange}
                                    className="sr-only"
                                />
                                <div className="text-center">
                                    <FiTag className={`w-6 h-6 mx-auto mb-1 ${formData.type === 'fee' ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span className="font-medium">Fee</span>
                                    <p className="text-xs text-gray-500 mt-1">Regular charges</p>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Category */}
                    <div>
                        <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                            Category <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-primary-500 focus:border-primary-500 text-gray-800"
                        >
                            <option value="">Select a category</option>
                            {filteredCategories.map((cat) => (
                                <option key={cat._id} value={cat.name}>{cat.name}</option>
                            ))}
                            <option value="Others">Others (specify below)</option>
                        </select>
                        {filteredCategories.length === 0 && (
                            <p className="mt-1 text-sm text-amber-600">
                                No categories found for this type. Select "Others" or create categories in Manage Categories.
                            </p>
                        )}
                    </div>

                    {/* Custom Category Input */}
                    {formData.category === 'Others' && (
                        <div>
                            <label htmlFor="customCategory" className="block text-sm font-medium text-gray-700 mb-2">
                                Specify Category
                            </label>
                            <input
                                type="text"
                                id="customCategory"
                                name="customCategory"
                                value={formData.customCategory}
                                onChange={handleChange}
                                placeholder="Enter custom category name"
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                                 focus:ring-primary-500 focus:border-primary-500 text-gray-800 
                                 placeholder-gray-400"
                            />
                        </div>
                    )}

                    {/* Amount */}
                    <div>
                        <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-medium">
                                ₹
                            </div>
                            <input
                                type="number"
                                id="amount"
                                name="amount"
                                value={formData.amount}
                                onChange={handleChange}
                                placeholder="Enter amount"
                                min="1"
                                step="1"
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-primary-500 focus:border-primary-500 text-gray-800 
                           placeholder-gray-400"
                            />
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                            Description / Reason <span className="text-gray-400 text-xs">(Optional)</span>
                        </label>
                        <div className="relative">
                            <FiFileText className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                            <textarea
                                id="reason"
                                name="reason"
                                value={formData.reason}
                                onChange={handleChange}
                                placeholder="Enter details about this payment"
                                rows="3"
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-primary-500 focus:border-primary-500 text-gray-800 
                           placeholder-gray-400 resize-none"
                            />
                        </div>
                    </div>

                    {/* Date */}
                    <div>
                        <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
                            Date
                        </label>
                        <div className="relative">
                            <FiCalendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="datetime-local"
                                id="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                max={new Date().toLocaleString('sv').slice(0, 16).replace(' ', 'T')}
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                           focus:ring-primary-500 focus:border-primary-500 text-gray-800"
                            />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">Defaults to current time if not specified</p>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end space-x-4 pt-4">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg 
                         hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || success}
                            className={`flex items-center space-x-2 px-6 py-3 font-medium rounded-lg 
                         disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg ${formData.type === 'fine'
                                    ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white shadow-red-200'
                                    : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-400 hover:to-blue-500 text-white shadow-blue-200'
                                }`}
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Adding Payment...</span>
                                </>
                            ) : (
                                <>
                                    <BiRupee className="w-5 h-5" />
                                    <span>Add {formData.type === 'fine' ? 'Fine' : 'Fee'}</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPayment;
