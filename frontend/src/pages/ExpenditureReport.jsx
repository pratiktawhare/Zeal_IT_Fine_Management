import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { expenditureAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import * as XLSX from 'xlsx-js-style';
import html2pdf from 'html2pdf.js';
import {
    FiDownload,
    FiFilter,
    FiX,
    FiChevronLeft,
    FiChevronRight,
    FiArrowUp,
    FiArrowDown
} from 'react-icons/fi';

const ExpenditureReport = () => {
    const [expenditures, setExpenditures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState({ totalAmount: 0, totalRecords: 0 });
    const [categoryBreakdown, setCategoryBreakdown] = useState([]);
    const [pagination, setPagination] = useState({});
    const [showFilters, setShowFilters] = useState(false);

    // Filter states
    const [filters, setFilters] = useState({
        year: '',
        month: '',
        fromDate: '',
        toDate: '',
        category: '',
        minAmount: '',
        maxAmount: '',
        sortBy: 'date',
        sortOrder: 'desc',
        page: 1,
        limit: 10
    });

    const categories = ['infrastructure', 'equipment', 'stationery', 'events', 'maintenance', 'other'];
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
    const months = [
        { value: 1, label: 'January' }, { value: 2, label: 'February' },
        { value: 3, label: 'March' }, { value: 4, label: 'April' },
        { value: 5, label: 'May' }, { value: 6, label: 'June' },
        { value: 7, label: 'July' }, { value: 8, label: 'August' },
        { value: 9, label: 'September' }, { value: 10, label: 'October' },
        { value: 11, label: 'November' }, { value: 12, label: 'December' }
    ];

    useEffect(() => {
        fetchExpenditures();
    }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

    const fetchExpenditures = async () => {
        try {
            setLoading(true);
            setError('');
            const params = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    params[key] = value;
                }
            });
            const response = await expenditureAPI.getReport(params);
            setExpenditures(response.data.data.expenditures);
            setSummary(response.data.data.summary);
            setCategoryBreakdown(response.data.data.categoryBreakdown || []);
            setPagination(response.data.data.pagination);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load expenditure report');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const applyFilters = () => {
        fetchExpenditures();
    };

    const clearFilters = () => {
        setFilters({
            year: '', month: '', fromDate: '', toDate: '', category: '',
            minAmount: '', maxAmount: '', sortBy: 'date', sortOrder: 'desc',
            page: 1, limit: 10
        });
        setTimeout(() => fetchExpenditures(), 100);
    };

    const handleSort = (field) => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
        }));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('en-IN', {
            day: '2-digit', month: 'short', year: 'numeric'
        });
    };

    const getReportPeriod = () => {
        if (filters.fromDate && filters.toDate) {
            return `${formatDate(filters.fromDate)} to ${formatDate(filters.toDate)}`;
        } else if (filters.year && filters.month) {
            return `${months.find(m => m.value == filters.month)?.label} ${filters.year}`;
        } else if (filters.year) {
            return `Year ${filters.year}`;
        }
        return 'All Time';
    };

    const getActiveFiltersText = () => {
        const active = [];
        if (filters.category) active.push(`Category: ${filters.category}`);
        if (filters.minAmount) active.push(`Min: ₹${filters.minAmount}`);
        if (filters.maxAmount) active.push(`Max: ₹${filters.maxAmount}`);
        return active.length > 0 ? active.join(' | ') : 'No filters applied';
    };

    // Export to Excel - Professional Format
    const exportToExcel = async () => {
        try {
            const params = { limit: 10000, page: 1 };
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    params[key] = value;
                }
            });
            const response = await expenditureAPI.getReport(params);
            const allData = response.data.data.expenditures;
            const reportSummary = response.data.data.summary;
            const catBreakdown = response.data.data.categoryBreakdown || [];

            // Styles
            const headerStyle = {
                font: { bold: true, sz: 12 },
                fill: { fgColor: { rgb: "DCE6F1" } }, // Light Blue
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" }
                },
                alignment: { horizontal: "center" }
            };

            const cellStyle = {
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" }
                }
            };

            const totalStyle = {
                font: { bold: true },
                fill: { fgColor: { rgb: "F2F2F2" } }, // Light Gray
                border: {
                    top: { style: "thin" },
                    bottom: { style: "thin" },
                    left: { style: "thin" },
                    right: { style: "thin" }
                }
            };

            const wsData = [
                [{ v: "INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)", s: { font: { bold: true, sz: 14 } } }],
                [{ v: "EXPENDITURE REPORT", s: { font: { bold: true, sz: 12 } } }],
                [],
                [{ v: "Report Period: " + getReportPeriod(), s: { font: { bold: true } } }],
                [{ v: "Generated On: " + new Date().toLocaleString('en-IN'), s: { font: { italic: true } } }],
                [{ v: "Filters Applied: " + getActiveFiltersText(), s: { font: { italic: true } } }],
                []
            ];

            // Summary Section
            wsData.push([{ v: "SUMMARY", s: { font: { bold: true, underscore: true } } }]);
            wsData.push([{ v: "Total Expenditure:", s: { font: { bold: true } } }, { v: reportSummary.totalAmount, t: 'n', s: { numFmt: "₹#,##0" } }]);
            wsData.push([{ v: "Total Records:", s: { font: { bold: true } } }, { v: reportSummary.totalRecords, t: 'n' }]);
            wsData.push([]);

            // Breakdown Section
            if (catBreakdown.length > 0) {
                wsData.push([{ v: "CATEGORY BREAKDOWN", s: { font: { bold: true, underscore: true } } }]);
                catBreakdown.forEach(cat => {
                    wsData.push([
                        { v: cat._id ? cat._id.charAt(0).toUpperCase() + cat._id.slice(1) : 'Other', s: cellStyle },
                        { v: cat.amount, t: 'n', s: { ...cellStyle, numFmt: "₹#,##0" } }
                    ]);
                });
                wsData.push([]);
            }

            // Detailed Transactions Header
            wsData.push([{ v: "DETAILED TRANSACTIONS", s: { font: { bold: true, sz: 11 } } }]);
            wsData.push([
                { v: "Date", s: headerStyle },
                { v: "Category", s: headerStyle },
                { v: "Description", s: headerStyle },
                { v: "Amount (₹)", s: headerStyle },
                { v: "Added By", s: headerStyle }
            ]);

            // Detailed Transactions Data
            allData.forEach(exp => {
                wsData.push([
                    { v: formatDate(exp.createdAt || exp.date), s: cellStyle },
                    { v: exp.category?.charAt(0).toUpperCase() + exp.category?.slice(1), s: cellStyle },
                    { v: exp.description, s: cellStyle },
                    { v: exp.amount, t: 'n', s: { ...cellStyle, font: { color: { rgb: "FF0000" } } } },
                    { v: exp.addedBy, s: cellStyle }
                ]);
            });

            // Footer
            wsData.push([]);
            wsData.push([
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "TOTAL EXPENDITURE:", s: { ...totalStyle, alignment: { horizontal: "right" } } },
                { v: reportSummary.totalAmount, t: 'n', s: { ...totalStyle, font: { bold: true, color: { rgb: "FF0000" } } } },
                { v: "", s: totalStyle }
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet([]);
            XLSX.utils.sheet_add_aoa(worksheet, wsData, { origin: "A1" });

            worksheet['!cols'] = [
                { wch: 15 }, // Date
                { wch: 20 }, // Category
                { wch: 40 }, // Description
                { wch: 15 }, // Amount
                { wch: 20 }  // Added By
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenditure Report');
            XLSX.writeFile(workbook, `Expenditure_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            setError('Failed to export to Excel');
        }
    };

    // Export to PDF - Professional Format
    const exportToPDF = async () => {
        try {
            // Fetch all data for export
            const params = { limit: 10000, page: 1 };
            Object.entries(filters).forEach(([key, value]) => {
                if (value !== '' && value !== null && value !== undefined) {
                    params[key] = value;
                }
            });
            const response = await expenditureAPI.getReport(params);
            const allData = response.data.data.expenditures;
            const reportSummary = response.data.data.summary;
            const catBreakdown = response.data.data.categoryBreakdown || [];

            // Create professional PDF content
            const pdfContent = document.createElement('div');
            pdfContent.style.fontFamily = 'Arial, sans-serif';
            pdfContent.style.padding = '20px';
            pdfContent.style.color = '#333';
            pdfContent.style.width = '190mm'; // Force A4 portrait width (210mm - margins)

            pdfContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; color: #1a365d; font-size: 24px;">INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)</h1>
                    <h2 style="margin: 10px 0; color: #2d3748; font-size: 18px;">EXPENDITURE REPORT</h2>
                    <p style="margin: 5px 0; color: #718096; font-size: 12px;">Period: ${getReportPeriod()}</p>
                    <p style="margin: 5px 0; color: #718096; font-size: 11px;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f7fafc; padding: 15px; border-radius: 8px;">
                    <div style="text-align: center; flex: 1;">
                        <p style="margin: 0; color: #718096; font-size: 12px;">Total Expenditure</p>
                        <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #e53e3e;">${formatCurrency(reportSummary.totalAmount)}</p>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <p style="margin: 0; color: #718096; font-size: 12px;">Total Transactions</p>
                        <p style="margin: 5px 0; font-size: 20px; font-weight: bold; color: #2d3748;">${reportSummary.totalRecords}</p>
                    </div>
                </div>

                ${catBreakdown.length > 0 ? `
                <div style="margin-bottom: 20px;">
                    <h3 style="color: #2d3748; font-size: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Category Breakdown</h3>
                    <table style="width: 50%; border-collapse: collapse; font-size: 12px;">
                        ${catBreakdown.map(cat => `
                            <tr>
                                <td style="padding: 5px 10px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${cat._id || 'Other'}</td>
                                <td style="padding: 5px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500;">${formatCurrency(cat.amount)}</td>
                            </tr>
                        `).join('')}
                    </table>
                </div>
                ` : ''}

                <h3 style="color: #2d3748; font-size: 14px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px;">Transaction Details</h3>
                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #edf2f7;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">Date</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">Category</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">Description</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e0;">Amount</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">Added By</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allData.map(exp => `
                            <tr>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${formatDate(exp.createdAt || exp.date)}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${exp.category}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${exp.description}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #e53e3e; font-weight: 500;">${formatCurrency(exp.amount)}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${exp.addedBy}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f7fafc; font-weight: bold;">
                            <td colspan="3" style="padding: 10px; text-align: right;">TOTAL:</td>
                            <td style="padding: 10px; text-align: right; color: #e53e3e;">${formatCurrency(reportSummary.totalAmount)}</td>
                            <td></td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #a0aec0; text-align: center;">
                    <p>This is a computer-generated report. No signature required.</p>
                    <p>Zeal Institute of Technology - Accounts Department</p>
                </div>
            `;

            const opt = {
                margin: [10, 10, 10, 10],
                filename: `Expenditure_Report_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };

            html2pdf().set(opt).from(pdfContent).save();
        } catch (err) {
            setError('Failed to export to PDF');
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
                        <span className="text-gray-700">Expenditure Report</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Expenditure Report</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300
                            rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <FiFilter className="w-4 h-4" />
                        Filters
                    </button>
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white
                            rounded-lg hover:bg-green-700 transition-colors"
                    >
                        <FiDownload className="w-4 h-4" />
                        Excel
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white
                            rounded-lg hover:bg-red-700 transition-colors"
                    >
                        <FiDownload className="w-4 h-4" />
                        PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Expenditure</p>
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(summary.totalAmount)}</p>
                    <p className="text-xs text-gray-400 mt-1">Period: {getReportPeriod()}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Records</p>
                    <p className="text-2xl font-bold text-gray-800">{summary.totalRecords || pagination.totalRecords}</p>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700">Filters</h3>
                        <button onClick={clearFilters} className="text-sm text-red-600 hover:text-red-700">
                            Clear All
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
                            <select name="year" value={filters.year} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                <option value="">All Years</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
                            <select name="month" value={filters.month} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                <option value="">All Months</option>
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">From Date</label>
                            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">To Date</label>
                            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                            <select name="category" value={filters.category} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500">
                                <option value="">All Categories</option>
                                {categories.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Min Amount</label>
                            <input type="number" name="minAmount" value={filters.minAmount} onChange={handleFilterChange}
                                placeholder="₹0" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Max Amount</label>
                            <input type="number" name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange}
                                placeholder="₹100000" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500" />
                        </div>
                        <div className="flex items-end">
                            <button onClick={applyFilters}
                                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                Apply Filters
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && <ErrorMessage message={error} onClose={() => setError('')} />}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12"><Loading size="lg" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto" id="expenditure-table">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                        onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">
                                            Date
                                            {filters.sortBy === 'date' && (filters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                        onClick={() => handleSort('amount')}>
                                        <div className="flex items-center gap-1">
                                            Amount
                                            {filters.sortBy === 'amount' && (filters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Added By</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {expenditures.length === 0 ? (
                                    <tr><td colSpan="5" className="px-6 py-12 text-center text-gray-500">No expenditures found</td></tr>
                                ) : (
                                    expenditures.map((exp) => (
                                        <tr key={exp._id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-700">{formatDate(exp.createdAt || exp.date)}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 capitalize">
                                                    {exp.category}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{exp.description}</td>
                                            <td className="px-6 py-4 text-sm font-semibold text-red-600">{formatCurrency(exp.amount)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{exp.addedBy}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Rows per page:</span>
                            <select value={filters.limit} onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value, page: 1 }))}
                                className="px-2 py-1 border border-gray-300 rounded text-sm">
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">
                                Page {pagination.currentPage} of {pagination.totalPages}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={!pagination.hasPrevPage}
                                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                    <FiChevronLeft />
                                </button>
                                <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={!pagination.hasNextPage}
                                    className="p-2 rounded border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">
                                    <FiChevronRight />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenditureReport;
