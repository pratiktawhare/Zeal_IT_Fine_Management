import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { feeLedgerAPI, categoryAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import * as XLSX from 'xlsx-js-style';
import {
    FiSearch,
    FiFilter,
    FiDownload,
    FiChevronLeft,
    FiChevronRight,
    FiUsers,
    FiCheckCircle,
    FiAlertCircle,
    FiClock,
    FiRefreshCw,
    FiTrash2,
    FiPlus,
    FiX
} from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';

const StudentFeesLedger = () => {
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState({});
    const [classSummary, setClassSummary] = useState([]);
    const [pagination, setPagination] = useState({});
    const [filterOptions, setFilterOptions] = useState({ classes: [], divisions: [], categories: [], ledgers: [] });
    const [showFilters, setShowFilters] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [selectedEntry, setSelectedEntry] = useState(null);

    // Search and filters
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState({
        studentClass: '',
        academicYear: '',
        division: '',
        category: '',
        status: '',
        pendingOnly: false,
        page: 1,
        limit: 20000,
        sortBy: 'studentRollNo',
        sortOrder: 'asc'
    });

    // Payment form
    const [paymentForm, setPaymentForm] = useState({
        amount: '',
        paymentMode: 'cash',
        remarks: '',
        sendEmail: true
    });
    const [paymentLoading, setPaymentLoading] = useState(false);

    // Generate form
    const [generateForm, setGenerateForm] = useState({
        categoryId: '',
        classes: [],
        academicYear: '',
        amount: ''
    });
    const [generateLoading, setGenerateLoading] = useState(false);

    // Handle category change - auto-fill amount
    const handleCategoryChange = (categoryId) => {
        const selectedCategory = filterOptions.categories.find(c => c._id === categoryId);
        setGenerateForm(prev => ({
            ...prev,
            categoryId,
            amount: selectedCategory?.amount || ''
        }));
    };

    // Debounced search
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchEntries();
    }, [filters, debouncedSearch]);

    useEffect(() => {
        fetchClassSummary();
    }, []);

    const fetchEntries = async () => {
        try {
            setLoading(true);
            const params = { ...filters, search: debouncedSearch };
            Object.keys(params).forEach(key => {
                if (!params[key] && params[key] !== 0) delete params[key];
            });

            const response = await feeLedgerAPI.getEntries(params);
            setEntries(response.data.data.entries);
            setSummary(response.data.data.summary);
            setPagination(response.data.data.pagination);
            setFilterOptions(response.data.data.filterOptions);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load fee ledger');
        } finally {
            setLoading(false);
        }
    };

    const fetchClassSummary = async () => {
        try {
            const response = await feeLedgerAPI.getClassSummary({});
            setClassSummary(response.data.data.classSummary);
        } catch (err) {
            console.error('Failed to load class summary:', err);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
            page: 1
        }));
    };

    const clearFilters = () => {
        setSearch('');
        setFilters({
            studentClass: '',
            division: '',
            category: '',
            academicYear: '',
            status: '',
            pendingOnly: false,
            page: 1,
            limit: 20000,
            sortBy: 'studentName',
            sortOrder: 'asc'
        });
    };

    const handleLedgerSelect = (e) => {
        const val = e.target.value;
        if (!val) {
            setFilters(prev => ({
                ...prev,
                category: '',
                studentClass: '',
                academicYear: ''
            }));
            return;
        }

        try {
            const ledger = JSON.parse(val);
            setFilters(prev => ({
                ...prev,
                category: ledger.category,
                studentClass: ledger.class,
                academicYear: ledger.year
            }));
        } catch (err) {
            console.error('Invalid ledger value', err);
        }
    };

    // Handle sort
    const handleSort = (field) => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
    };

    // Sort icon helper
    const SortIcon = ({ field }) => {
        if (filters.sortBy !== field) return null;
        return filters.sortOrder === 'asc' ? ' ↑' : ' ↓';
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount || 0);

    const getStatusBadge = (status) => {
        const styles = {
            paid: 'bg-green-100 text-green-700',
            partial: 'bg-yellow-100 text-yellow-700',
            unpaid: 'bg-red-100 text-red-700'
        };
        const labels = { paid: 'Paid', partial: 'Partial', unpaid: 'Unpaid' };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
                {labels[status]}
            </span>
        );
    };

    // Payment Modal
    const openPaymentModal = (entry) => {
        setSelectedEntry(entry);
        setPaymentForm({
            amount: entry.totalAmount - entry.paidAmount,
            paymentMode: 'cash',
            remarks: '',
            sendEmail: true
        });
        setShowPaymentModal(true);
    };

    const handlePayment = async (e) => {
        e.preventDefault();
        if (!paymentForm.amount || paymentForm.amount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setPaymentLoading(true);
        try {
            await feeLedgerAPI.addPayment(selectedEntry._id, paymentForm);
            setShowPaymentModal(false);
            fetchEntries();
            fetchClassSummary();
        } catch (err) {
            setError(err.response?.data?.message || 'Payment failed');
        } finally {
            setPaymentLoading(false);
        }
    };

    // Generate Ledger Modal
    const handleGenerate = async (e) => {
        e.preventDefault();
        if (!generateForm.categoryId) {
            setError('Please select a category');
            return;
        }

        setGenerateLoading(true);
        try {
            const response = await feeLedgerAPI.generate(generateForm);
            setShowGenerateModal(false);
            setError(''); // Clear any errors
            alert(`Generated ${response.data.data.entriesCreated} ledger entries`);
            fetchEntries();
            fetchClassSummary();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate ledger entries');
        } finally {
            setGenerateLoading(false);
        }
    };

    // Delete Ledger Entry
    const handleDelete = async (entry) => {
        if (entry.paidAmount > 0) {
            setError('Cannot delete ledger entry with existing payments');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the ledger entry for ${entry.studentName}?`)) {
            return;
        }

        try {
            await feeLedgerAPI.delete(entry._id);
            fetchEntries();
            fetchClassSummary();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete ledger entry');
        }
    };

    // Bulk Delete Handler
    const [bulkDeleteClasses, setBulkDeleteClasses] = useState([]);
    const [bulkDeleteCategory, setBulkDeleteCategory] = useState('');
    const [bulkDeleteLoading, setBulkDeleteLoading] = useState(false);
    const [deletableOptions, setDeletableOptions] = useState({ classes: [], categories: [] });
    const [deletableOptionsLoading, setDeletableOptionsLoading] = useState(false);

    // Fetch deletable options when modal opens
    const openBulkDeleteModal = async () => {
        setShowBulkDeleteModal(true);
        setDeletableOptionsLoading(true);
        try {
            const response = await feeLedgerAPI.getDeletableOptions();
            setDeletableOptions(response.data.data);
        } catch (err) {
            setError('Failed to load deletable options');
        } finally {
            setDeletableOptionsLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (!bulkDeleteCategory) {
            setError('Please select a ledger category to delete');
            return;
        }
        if (bulkDeleteClasses.length === 0) {
            setError('Please select at least one class to delete');
            return;
        }

        const categoryName = deletableOptions.categories.find(c => c._id === bulkDeleteCategory)?.name || 'selected category';
        const classesText = bulkDeleteClasses.join(', ');

        if (!window.confirm(`⚠️ DANGER: Are you sure you want to delete ALL "${categoryName}" fee records for ${classesText}? \n\nThis will permanently delete:\n- All unpaid entries\n- All PAID entries\n- All associated payment history\n\nThis action cannot be undone.`)) {
            return;
        }

        setBulkDeleteLoading(true);
        try {
            let totalDeleted = 0;
            let totalFinesRemoved = 0;

            // Delete for each selected class
            for (const studentClass of bulkDeleteClasses) {
                const response = await feeLedgerAPI.bulkDelete({
                    studentClass: studentClass,
                    category: bulkDeleteCategory,
                    includeWithPayments: true
                });
                totalDeleted += response.data.data.deletedCount || 0;
                totalFinesRemoved += response.data.data.finesRemoved || 0;
            }

            setShowBulkDeleteModal(false);
            setBulkDeleteClasses([]);
            setBulkDeleteCategory('');

            let message = `Deleted ${totalDeleted} ledger entries`;
            if (totalFinesRemoved > 0) message += ` and ${totalFinesRemoved} payment records`;

            alert(message);
            fetchEntries();
            fetchClassSummary();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete ledger entries');
        } finally {
            setBulkDeleteLoading(false);
        }
    };

    const exportToExcel = async () => {
        try {
            const params = { ...filters, search: debouncedSearch, limit: 20000, page: 1 };
            const response = await feeLedgerAPI.getEntries(params);
            const allData = response.data.data.entries;

            const wsData = [
                ['COMMON FEES'],
                [`Generated: ${new Date().toLocaleString('en-IN')}`],
                [],
                ['Roll No', 'PRN', 'Name', 'Class', 'Division', 'Category', 'Total', 'Paid', 'Remaining', 'Status']
            ];

            allData.forEach(e => {
                wsData.push([
                    e.studentRollNo || '-',
                    e.studentPRN,
                    e.studentName,
                    e.studentClass || '-',
                    e.studentDivision || '-',
                    e.categoryName,
                    e.totalAmount,
                    e.paidAmount,
                    e.totalAmount - e.paidAmount,
                    e.status.toUpperCase()
                ]);
            });

            const worksheet = XLSX.utils.aoa_to_sheet(wsData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Fees Ledger');
            XLSX.writeFile(workbook, `Fees_Ledger_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            setError('Failed to export');
        }
    };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
                        <span>/</span>
                        <span className="text-gray-700">Common Fees</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Common Fees</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowGenerateModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        <FiPlus /> Generate Ledger
                    </button>
                    <button onClick={openBulkDeleteModal}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <FiTrash2 /> Delete Ledger
                    </button>
                    <button onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <FiDownload /> Export
                    </button>
                </div>
            </div>

            {/* Class Summary Cards Removed */}

            {/* Summary Stats */}
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg"><FiUsers className="text-blue-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Total Students</p>
                            <p className="text-xl font-bold text-gray-800">{summary.totalStudents || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><FiCheckCircle className="text-green-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Fully Paid</p>
                            <p className="text-xl font-bold text-green-600">{summary.fullyPaid || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 rounded-lg"><FiClock className="text-yellow-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Partial</p>
                            <p className="text-xl font-bold text-yellow-600">{summary.partiallyPaid || 0}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-emerald-100 rounded-lg"><BiRupee className="text-emerald-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Total Received</p>
                            <p className="text-xl font-bold text-emerald-600">{formatCurrency(summary.totalCollected)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg"><BiRupee className="text-orange-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Total Pending</p>
                            <p className="text-xl font-bold text-orange-600">{formatCurrency(summary.totalPending)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search Bar */}
                    <div className="flex-1 relative">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by PRN, Roll No, or Name..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        />
                    </div>

                    {/* Quick Filters */}
                    <div className="flex gap-2 flex-wrap">
                        <label className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer">
                            <input
                                type="checkbox"
                                name="pendingOnly"
                                checked={filters.pendingOnly}
                                onChange={handleFilterChange}
                                className="rounded text-primary-600"
                            />
                            <span className="text-sm">Pending Only</span>
                        </label>
                        <button onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <FiFilter /> Filters
                        </button>
                        <button onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                            <FiX /> Clear
                        </button>
                    </div>
                </div>

                {/* Advanced Filters */}
                {showFilters && (
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
                        <select
                            onChange={handleLedgerSelect}
                            className="px-3 py-2 border border-gray-300 rounded-lg"
                        >
                            <option value="">Select Particular Ledger</option>
                            {filterOptions.ledgers?.map((ledger, idx) => (
                                <option key={idx} value={JSON.stringify(ledger)}>
                                    {ledger.categoryName} - {ledger.class} ({ledger.year || 'N/A'})
                                </option>
                            ))}
                        </select>
                        <select name="studentClass" value={filters.studentClass} onChange={handleFilterChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Classes</option>
                            {filterOptions.classes.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                        <select name="division" value={filters.division} onChange={handleFilterChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Divisions</option>
                            {filterOptions.divisions.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <select name="category" value={filters.category} onChange={handleFilterChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Categories</option>
                            {filterOptions.categories
                                .filter(c => c.type === 'fee')
                                .map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                        </select>
                        <select name="status" value={filters.status} onChange={handleFilterChange}
                            className="px-3 py-2 border border-gray-300 rounded-lg">
                            <option value="">All Status</option>
                            <option value="unpaid">Unpaid</option>
                            <option value="partial">Partial</option>
                            <option value="paid">Paid</option>
                        </select>
                    </div>
                )}
            </div>

            {error && <ErrorMessage message={error} onClose={() => setError('')} />}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12"><Loading size="lg" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('studentRollNo')}>
                                        Roll No<SortIcon field="studentRollNo" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('studentPRN')}>
                                        PRN<SortIcon field="studentPRN" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('studentName')}>
                                        Name<SortIcon field="studentName" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('studentClass')}>
                                        Class<SortIcon field="studentClass" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('totalAmount')}>
                                        Total<SortIcon field="totalAmount" />
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('paidAmount')}>
                                        Paid<SortIcon field="paidAmount" />
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Remaining</th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100"
                                        onClick={() => handleSort('status')}>
                                        Status<SortIcon field="status" />
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {entries.length === 0 ? (
                                    <tr><td colSpan="10" className="px-4 py-12 text-center text-gray-500">No ledger entries found</td></tr>
                                ) : (
                                    entries.map(entry => (
                                        <tr key={entry._id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">{entry.studentRollNo || '-'}</td>
                                            <td className="px-4 py-3 text-sm">
                                                <Link to={`/student/${entry.studentPRN}`} className="text-primary-600 hover:underline">
                                                    {entry.studentPRN}
                                                </Link>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-800 font-medium">{entry.studentName}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{entry.studentClass} {entry.studentDivision}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600">{entry.categoryName}</td>
                                            <td className="px-4 py-3 text-sm text-right font-medium">{formatCurrency(entry.totalAmount)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">{formatCurrency(entry.paidAmount)}</td>
                                            <td className="px-4 py-3 text-sm text-right text-orange-600 font-medium">
                                                {formatCurrency(entry.totalAmount - entry.paidAmount)}
                                            </td>
                                            <td className="px-4 py-3 text-center">{getStatusBadge(entry.status)}</td>
                                            <td className="px-4 py-3 text-center">
                                                {entry.status !== 'paid' && (
                                                    <button
                                                        onClick={() => openPaymentModal(entry)}
                                                        className="px-3 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                                                    >
                                                        Pay
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Removed */}
                </div>
            )}

            {/* Payment Modal */}
            {showPaymentModal && selectedEntry && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4">Record Payment</h3>
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm"><strong>{selectedEntry.studentName}</strong> ({selectedEntry.studentPRN})</p>
                            <p className="text-sm text-gray-600">{selectedEntry.categoryName}</p>
                            <p className="text-sm">Remaining: <span className="font-semibold text-orange-600">
                                {formatCurrency(selectedEntry.totalAmount - selectedEntry.paidAmount)}
                            </span></p>
                        </div>
                        <form onSubmit={handlePayment} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                <input
                                    type="number"
                                    value={paymentForm.amount}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                                    max={selectedEntry.totalAmount - selectedEntry.paidAmount}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                                <select
                                    value={paymentForm.paymentMode}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, paymentMode: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI</option>
                                    <option value="card">Card</option>
                                    <option value="bank">Bank Transfer</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks (Optional)</label>
                                <input
                                    type="text"
                                    value={paymentForm.remarks}
                                    onChange={(e) => setPaymentForm(prev => ({ ...prev, remarks: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={paymentForm.sendEmail}
                                        onChange={(e) => setPaymentForm(prev => ({ ...prev, sendEmail: e.target.checked }))}
                                        className="w-4 h-4 text-primary-600 border-gray-300 rounded"
                                    />
                                    <span className="text-sm text-gray-700">Send email receipt to student</span>
                                </label>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowPaymentModal(false)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={paymentLoading}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                                    {paymentLoading ? 'Processing...' : 'Confirm Payment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Generate Modal */}
            {showGenerateModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-lg font-semibold mb-4">Generate Ledger Entries</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            This will create fee ledger entries for all students in the selected classes.
                        </p>
                        <form onSubmit={handleGenerate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Category</label>
                                <select
                                    value={generateForm.categoryId}
                                    onChange={(e) => handleCategoryChange(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                >
                                    <option value="">Select Category</option>
                                    {filterOptions.categories
                                        .filter(c => c.type === 'fee')
                                        .map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Classes</label>
                                <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-200 rounded-lg">
                                    {filterOptions.classes.length > 0 ? (
                                        filterOptions.classes.map(cls => (
                                            <label key={cls} className="flex items-center gap-2 cursor-pointer p-1 hover:bg-gray-50 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={generateForm.classes.includes(cls)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setGenerateForm(prev => ({ ...prev, classes: [...prev.classes, cls] }));
                                                        } else {
                                                            setGenerateForm(prev => ({ ...prev, classes: prev.classes.filter(c => c !== cls) }));
                                                        }
                                                    }}
                                                    className="rounded text-primary-600"
                                                />
                                                <span className="text-sm">{cls}</span>
                                            </label>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 col-span-2">No classes available</p>
                                    )}
                                </div>
                                {generateForm.classes.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">Selected: {generateForm.classes.join(', ')}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fee Amount (₹)</label>
                                <input
                                    type="number"
                                    value={generateForm.amount}
                                    onChange={(e) => setGenerateForm(prev => ({ ...prev, amount: e.target.value }))}
                                    placeholder="Enter fee amount"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                    min="1"
                                />
                                <p className="text-xs text-gray-500 mt-1">This amount will be applied to all selected students</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                                <input
                                    type="text"
                                    value={generateForm.academicYear}
                                    onChange={(e) => setGenerateForm(prev => ({ ...prev, academicYear: e.target.value }))}
                                    placeholder="e.g., 2024-25"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => { setShowGenerateModal(false); setGenerateForm({ categoryId: '', classes: [], academicYear: '', amount: '' }); }}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                    Cancel
                                </button>
                                <button type="submit" disabled={generateLoading || generateForm.classes.length === 0 || !generateForm.amount}
                                    className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50">
                                    {generateLoading ? 'Generating...' : 'Generate'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6">
                        <h3 className="text-lg font-semibold mb-4 text-red-600">Delete Ledger Entries</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            This will delete <strong>ALL</strong> ledger entries for the selected class(es).
                        </p>
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-700">
                                <strong>⚠️ Warning:</strong> This action cannot be undone!
                            </p>
                        </div>
                        {deletableOptionsLoading ? (
                            <div className="text-center py-4 text-gray-500">Loading available options...</div>
                        ) : deletableOptions.classes.length === 0 && deletableOptions.categories.length === 0 ? (
                            <div className="text-center py-4 text-gray-500">
                                No unpaid ledger entries available to delete.
                            </div>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Ledger Category</label>
                                    <select
                                        value={bulkDeleteCategory}
                                        onChange={(e) => setBulkDeleteCategory(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                    >
                                        <option value="">Select Category</option>
                                        {deletableOptions.categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Class(es)</label>
                                    <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                        {deletableOptions.classes.map(cls => (
                                            <label key={cls} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                                <input
                                                    type="checkbox"
                                                    checked={bulkDeleteClasses.includes(cls)}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setBulkDeleteClasses([...bulkDeleteClasses, cls]);
                                                        } else {
                                                            setBulkDeleteClasses(bulkDeleteClasses.filter(c => c !== cls));
                                                        }
                                                    }}
                                                    className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                                />
                                                <span className="text-sm text-gray-700">{cls}</span>
                                            </label>
                                        ))}
                                    </div>
                                    {bulkDeleteClasses.length > 0 && (
                                        <p className="text-xs text-gray-500 mt-1">
                                            Selected: {bulkDeleteClasses.join(', ')}
                                        </p>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => { setShowBulkDeleteModal(false); setBulkDeleteClasses([]); setBulkDeleteCategory(''); }}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkDelete}
                                disabled={bulkDeleteLoading || bulkDeleteClasses.length === 0 || !bulkDeleteCategory}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {bulkDeleteLoading ? 'Deleting...' : 'Delete All'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentFeesLedger;
