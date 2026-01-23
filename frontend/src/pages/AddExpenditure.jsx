import { useState, useEffect } from 'react';
import { expenditureAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import {
    FiDollarSign,
    FiFileText,
    FiCalendar,
    FiCheck,
    FiPlus,
    FiTag,
    FiBook,
    FiHash,
    FiEdit3,
    FiTrash2
} from 'react-icons/fi';

const AddExpenditure = () => {
    const [expenditures, setExpenditures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        category: 'other',
        department: '',
        date: new Date().toLocaleString('sv').slice(0, 16).replace(' ', 'T'),
        receiptNumber: '',
        notes: ''
    });

    const categories = [
        { value: 'infrastructure', label: 'Infrastructure' },
        { value: 'equipment', label: 'Equipment' },
        { value: 'stationery', label: 'Stationery' },
        { value: 'events', label: 'Events' },
        { value: 'maintenance', label: 'Maintenance' },
        { value: 'other', label: 'Other' }
    ];

    useEffect(() => {
        fetchExpenditures();
    }, []);

    const fetchExpenditures = async () => {
        try {
            setLoading(true);
            const response = await expenditureAPI.getAll({ limit: 10 });
            // API returns: { data: { expenditures, pagination } }
            setExpenditures(response.data.data?.expenditures || []);
        } catch (err) {
            console.error('Failed to load expenditures:', err);
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
        setSuccess('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        if (!formData.description.trim()) {
            setError('Please enter a description');
            return;
        }

        setSubmitting(true);
        setError('');
        setSuccess('');

        try {
            await expenditureAPI.add({
                amount: parseFloat(formData.amount),
                description: formData.description.trim(),
                category: formData.category,
                department: formData.department.trim() || undefined,
                date: formData.date,
                receiptNumber: formData.receiptNumber.trim() || undefined,
                notes: formData.notes.trim() || undefined
            });

            setSuccess('Expenditure added successfully!');

            // Reset form
            setFormData({
                amount: '',
                description: '',
                category: 'other',
                department: '',
                date: new Date().toLocaleString('sv').slice(0, 16).replace(' ', 'T'),
                receiptNumber: '',
                notes: ''
            });

            // Refresh list
            fetchExpenditures();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add expenditure. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getCategoryColor = (category) => {
        const colors = {
            infrastructure: 'bg-blue-100 text-blue-700',
            equipment: 'bg-purple-100 text-purple-700',
            stationery: 'bg-green-100 text-green-700',
            events: 'bg-pink-100 text-pink-700',
            maintenance: 'bg-orange-100 text-orange-700',
            other: 'bg-gray-100 text-gray-700'
        };
        return colors[category] || colors.other;
    };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Expenditure Management</h1>
                <p className="text-gray-600 mt-1">Add and manage department expenditures</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Add Expenditure Form */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                        <FiPlus className="w-5 h-5 mr-2 text-primary-600" />
                        Add New Expenditure
                    </h2>

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-3">
                            <FiCheck className="w-5 h-5 text-green-500" />
                            <span className="text-sm text-green-700">{success}</span>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6">
                            <ErrorMessage message={error} onClose={() => setError('')} />
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
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
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-primary-500 focus:border-primary-500 text-gray-800"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                Description <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FiFileText className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="description"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    placeholder="e.g., New lab equipment"
                                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-primary-500 focus:border-primary-500 text-gray-800"
                                />
                            </div>
                        </div>

                        {/* Category & Department Row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                                    Category
                                </label>
                                <div className="relative">
                                    <FiTag className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <select
                                        id="category"
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                               focus:ring-primary-500 focus:border-primary-500 text-gray-800 appearance-none
                               bg-white"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat.value} value={cat.value}>{cat.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-2">
                                    Department
                                </label>
                                <div className="relative">
                                    <FiBook className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="department"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                        placeholder="e.g., Computer Science"
                                        className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                               focus:ring-primary-500 focus:border-primary-500 text-gray-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Date & Receipt Row */}
                        <div className="grid grid-cols-2 gap-4">
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
                                        className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                               focus:ring-primary-500 focus:border-primary-500 text-gray-800"
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="receiptNumber" className="block text-sm font-medium text-gray-700 mb-2">
                                    Receipt Number
                                </label>
                                <div className="relative">
                                    <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        id="receiptNumber"
                                        name="receiptNumber"
                                        value={formData.receiptNumber}
                                        onChange={handleChange}
                                        placeholder="e.g., REC-001"
                                        className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                               focus:ring-primary-500 focus:border-primary-500 text-gray-800"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Notes */}
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Notes
                            </label>
                            <div className="relative">
                                <FiEdit3 className="absolute left-4 top-3 w-5 h-5 text-gray-400" />
                                <textarea
                                    id="notes"
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Additional notes (optional)"
                                    rows="2"
                                    className="w-full pl-12 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 
                             focus:ring-primary-500 focus:border-primary-500 text-gray-800 resize-none"
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full flex items-center justify-center space-x-2 py-3 bg-gradient-to-r 
                         from-primary-700 to-primary-800 text-white font-medium rounded-lg 
                         hover:from-primary-600 hover:to-primary-700 disabled:opacity-50 
                         disabled:cursor-not-allowed transition-all shadow-lg shadow-primary-200"
                        >
                            {submitting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Adding...</span>
                                </>
                            ) : (
                                <>
                                    <FiPlus className="w-5 h-5" />
                                    <span>Add Expenditure</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Recent Expenditures */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="text-lg font-semibold text-gray-800">Recent Expenditures</h2>
                    </div>

                    {loading ? (
                        <div className="p-8">
                            <Loading size="md" text="Loading expenditures..." />
                        </div>
                    ) : expenditures.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <FiDollarSign className="w-8 h-8 text-gray-400" />
                            </div>
                            <p className="text-gray-500">No expenditures recorded yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                            {expenditures.map((exp) => (
                                <div key={exp._id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-1">
                                                <span className={`badge ${getCategoryColor(exp.category)}`}>
                                                    {exp.category}
                                                </span>
                                                {exp.department && (
                                                    <span className="text-xs text-gray-500">{exp.department}</span>
                                                )}
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {exp.description}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDate(exp.date)}
                                                {exp.receiptNumber && ` • ${exp.receiptNumber}`}
                                            </p>
                                        </div>
                                        <div className="ml-4 text-right">
                                            <p className="text-lg font-bold text-gray-800">
                                                {formatCurrency(exp.amount)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AddExpenditure;
