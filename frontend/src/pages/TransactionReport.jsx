import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import * as XLSX from 'xlsx-js-style';
import html2pdf from 'html2pdf.js';
import {
    FiDownload,
    FiFilter,
    FiChevronLeft,
    FiChevronRight,
    FiArrowUp,
    FiArrowDown,
    FiTrendingUp,
    FiTrendingDown
} from 'react-icons/fi';

const TransactionReport = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [summary, setSummary] = useState({});
    const [pagination, setPagination] = useState({});
    const [filterOptions, setFilterOptions] = useState({ divisions: [], years: [] });
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        type: '', paymentType: '', category: '', year: '', month: '', division: '', studentClass: '',
        fromDate: '', toDate: '', minAmount: '', maxAmount: '',
        sortBy: 'date', sortOrder: 'desc', page: 1, limit: 10
    });

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
        fetchTransactions();
    }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

    const fetchTransactions = async () => {
        try {
            setLoading(true);
            const params = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await reportsAPI.getTransactions(params);
            setTransactions(response.data.data.transactions);
            setSummary(response.data.data.summary);
            setPagination(response.data.data.pagination);
            if (response.data.data.filterOptions) {
                setFilterOptions(response.data.data.filterOptions);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load transactions');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
    };

    const handleSort = (field) => {
        setFilters(prev => ({
            ...prev, sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
        }));
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('en-IN', {
        style: 'currency', currency: 'INR', maximumFractionDigits: 0
    }).format(amount || 0);

    const formatDate = (date) => new Date(date).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });

    const clearFilters = () => {
        setFilters({
            type: '', paymentType: '', category: '', year: '', month: '', division: '', studentClass: '',
            fromDate: '', toDate: '', minAmount: '', maxAmount: '',
            sortBy: 'date', sortOrder: 'desc', page: 1, limit: 10
        });
        setTimeout(fetchTransactions, 100);
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

    const getActiveFilters = () => {
        const active = [];
        if (filters.type) active.push(filters.type === 'income' ? 'Income Only' : 'Expenditure Only');
        if (filters.paymentType) active.push(filters.paymentType === 'fee' ? 'Fees' : 'Fines');
        if (filters.category) active.push(`Category: ${filters.category}`);
        return active.length > 0 ? active.join(' | ') : 'All Transactions';
    };

    const exportToExcel = async () => {
        try {
            const params = { limit: 10000, page: 1 };
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await reportsAPI.getTransactions(params);
            const allData = response.data.data.transactions;
            const totals = response.data.data.summary;

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

            // Header Data
            const wsData = [
                [{ v: "INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)", s: { font: { bold: true, sz: 14 } } }],
                [{ v: "TRANSACTION REPORT", s: { font: { bold: true, sz: 12 } } }],
                [],
                [{ v: "Report Period: " + getReportPeriod(), s: { font: { bold: true } } }],
                [{ v: "Generated On: " + new Date().toLocaleString('en-IN'), s: { font: { italic: true } } }],
                [{ v: "Filters: " + getActiveFilters(), s: { font: { italic: true } } }],
                [],
                [{ v: "FINANCIAL SUMMARY", s: { font: { bold: true, underscore: true } } }],
                [{ v: "Total Income:", s: { font: { bold: true } } }, { v: totals.totalIncome, t: 'n', s: { numFmt: "₹#,##0" } }],
                [{ v: "Total Expenditure:", s: { font: { bold: true } } }, { v: totals.totalExpenditure, t: 'n', s: { numFmt: "₹#,##0" } }],
                [{ v: "Net Balance:", s: { font: { bold: true } } }, { v: totals.netBalance, t: 'n', s: { numFmt: "₹#,##0", font: { color: { rgb: totals.netBalance >= 0 ? "006400" : "FF0000" } } } }],
                [],
                [{ v: "TRANSACTION DETAILS", s: { font: { bold: true, sz: 11 } } }],
                [
                    { v: "Date & Time", s: headerStyle },
                    { v: "Type", s: headerStyle },
                    { v: "PRN", s: headerStyle },
                    { v: "Class", s: headerStyle },
                    { v: "Div", s: headerStyle },
                    { v: "Category", s: headerStyle },
                    { v: "Description", s: headerStyle },
                    { v: "Amount (₹)", s: headerStyle },
                    { v: "Ref", s: headerStyle }
                ]
            ];

            // Transaction Data
            allData.forEach(t => {
                wsData.push([
                    { v: formatDate(t.createdAt || t.date), s: cellStyle },
                    { v: t.transactionType === 'income' ? 'Income' : 'Expenditure', s: { ...cellStyle, font: { color: { rgb: t.transactionType === 'income' ? "006400" : "FF0000" } } } },
                    { v: t.studentPRN || '-', s: cellStyle },
                    { v: t.studentClass || '-', s: cellStyle },
                    { v: t.studentDivision || '-', s: cellStyle },
                    { v: t.category, s: cellStyle },
                    { v: t.description, s: cellStyle },
                    { v: t.amount, t: 'n', s: cellStyle },
                    { v: t.paymentType ? t.paymentType.charAt(0).toUpperCase() + t.paymentType.slice(1) : '-', s: cellStyle }
                ]);
            });

            // Totals
            wsData.push([]);
            wsData.push([
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "TOTAL INCOME:", s: { ...totalStyle, alignment: { horizontal: "right" } } },
                { v: totals.totalIncome, t: 'n', s: totalStyle },
                { v: "", s: totalStyle }
            ]);
            wsData.push([
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "TOTAL EXPENDITURE:", s: { ...totalStyle, alignment: { horizontal: "right" } } },
                { v: totals.totalExpenditure, t: 'n', s: totalStyle },
                { v: "", s: totalStyle }
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet([]);
            XLSX.utils.sheet_add_aoa(worksheet, wsData, { origin: "A1" });

            worksheet['!cols'] = [
                { wch: 22 }, // Date & Time
                { wch: 12 }, // Type
                { wch: 15 }, // PRN
                { wch: 10 }, // Class
                { wch: 10 }, // Div
                { wch: 15 }, // Category
                { wch: 35 }, // Description
                { wch: 15 }, // Amount
                { wch: 12 }  // Ref/Payment Type
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Transactions');
            XLSX.writeFile(workbook, `Transaction_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            setError('Failed to export');
        }
    };

    const exportToPDF = async () => {
        try {
            const params = { limit: 10000, page: 1 };
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await reportsAPI.getTransactions(params);
            const allData = response.data.data.transactions;
            const totals = response.data.data.summary;

            const pdfContent = document.createElement('div');
            pdfContent.style.fontFamily = 'Arial, sans-serif';
            pdfContent.style.padding = '20px';
            pdfContent.style.color = '#333';
            pdfContent.style.width = '190mm'; // Force A4 portrait width (210mm - margins)

            pdfContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; color: #1a365d; font-size: 24px;">INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)</h1>
                    <h2 style="margin: 10px 0; color: #2d3748; font-size: 18px;">TRANSACTION REPORT</h2>
                    <p style="margin: 5px 0; color: #718096; font-size: 12px;">Period: ${getReportPeriod()}</p>
                    <p style="margin: 5px 0; color: #718096; font-size: 11px;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f7fafc; padding: 15px; border-radius: 8px;">
                    <div style="text-align: center; flex: 1;">
                        <p style="margin: 0; color: #718096; font-size: 12px;">Total Income</p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #38a169;">${formatCurrency(totals.totalIncome)}</p>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <p style="margin: 0; color: #718096; font-size: 12px;">Total Expenditure</p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #e53e3e;">${formatCurrency(totals.totalExpenditure)}</p>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <p style="margin: 0; color: #718096; font-size: 12px;">Net Balance</p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: ${totals.netBalance >= 0 ? '#3182ce' : '#dd6b20'};">${formatCurrency(totals.netBalance)}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
                    <thead>
                        <tr style="background: #edf2f7;">
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e0;">Date & Time</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e0;">Type</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e0;">PRN</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e0;">Class</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e0;">Division</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e0;">Category</th>
                            <th style="padding: 8px; text-align: left; border-bottom: 2px solid #cbd5e0;">Description</th>
                            <th style="padding: 8px; text-align: right; border-bottom: 2px solid #cbd5e0;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allData.map(t => `
                            <tr>
                                <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${formatDate(t.createdAt || t.date)}</td>
                                <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">
                                    <span style="display: inline-block; white-space: nowrap; padding: 2px 6px; border-radius: 4px; font-size: 9px; background: ${t.transactionType === 'income' ? '#c6f6d5' : '#fed7d7'}; color: ${t.transactionType === 'income' ? '#22543d' : '#742a2a'};">
                                        ${t.transactionType === 'income' ? 'Income' : 'Expense'}
                                    </span>
                                </td>
                                <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${t.studentPRN || '-'}</td>
                                <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${t.studentClass || '-'}</td>
                                <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${t.studentDivision || '-'}</td>
                                <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${t.category || '-'}</td>
                                <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0;">${t.description || '-'}</td>
                                <td style="padding: 6px 8px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500; color: ${t.transactionType === 'income' ? '#38a169' : '#e53e3e'};">
                                    ${t.transactionType === 'income' ? '+' : '-'}${formatCurrency(t.amount)}
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top: 20px; background: #f7fafc; padding: 15px; border-radius: 8px;">
                    <table style="width: 100%; font-size: 12px;">
                        <tr>
                            <td style="font-weight: bold;">Summary</td>
                            <td style="text-align: right; color: #38a169; font-weight: bold;">Income: ${formatCurrency(totals.totalIncome)}</td>
                            <td style="text-align: right; color: #e53e3e; font-weight: bold;">Expenditure: ${formatCurrency(totals.totalExpenditure)}</td>
                            <td style="text-align: right; color: ${totals.netBalance >= 0 ? '#3182ce' : '#dd6b20'}; font-weight: bold;">Balance: ${formatCurrency(totals.netBalance)}</td>
                        </tr>
                    </table>
                </div>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #a0aec0; text-align: center;">
                    <p>This is a computer-generated report. No signature required.</p>
                    <p>Zeal Institute of Technology - Accounts Department</p>
                </div>
            `;

            html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: `Transaction_Report_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(pdfContent).save();
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
                        <span className="text-gray-700">Transaction Report</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Transaction Report</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <FiFilter /> Filters
                    </button>
                    <button onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <FiDownload /> Excel
                    </button>
                    <button onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <FiDownload /> PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><FiTrendingUp className="text-green-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Total Income</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(summary.totalIncome)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg"><FiTrendingDown className="text-red-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Total Expenditure</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(summary.totalExpenditure)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${summary.netBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            {summary.netBalance >= 0 ? <FiTrendingUp className="text-blue-600" /> : <FiTrendingDown className="text-orange-600" />}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Net Balance</p>
                            <p className={`text-xl font-bold ${summary.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {formatCurrency(summary.netBalance)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold">Filters</h3>
                        <button onClick={clearFilters} className="text-sm text-red-600">Clear All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Transaction Type</label>
                            <select name="type" value={filters.type} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All</option>
                                <option value="income">Income</option>
                                <option value="expenditure">Expenditure</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Payment Type</label>
                            <select name="paymentType" value={filters.paymentType} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All</option>
                                <option value="fee">Fee</option>
                                <option value="fine">Fine</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Calendar Year</label>
                            <select name="year" value={filters.year} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All</option>
                                {years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
                            <select name="month" value={filters.month} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All</option>
                                {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
                            <select name="studentClass" value={filters.studentClass} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All</option>
                                {filterOptions.years?.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Division</label>
                            <select name="division" value={filters.division} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All</option>
                                {filterOptions.divisions.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                            <select name="category" value={filters.category} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All</option>
                                {(filters.type === 'income'
                                    ? filterOptions.incomeCategories
                                    : filters.type === 'expenditure'
                                        ? filterOptions.expenditureCategories
                                        : filterOptions.categories
                                )?.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">From Date</label>
                            <input type="date" name="fromDate" value={filters.fromDate} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">To Date</label>
                            <input type="date" name="toDate" value={filters.toDate} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Min Amount</label>
                            <input type="number" name="minAmount" value={filters.minAmount} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Max Amount</label>
                            <input type="number" name="maxAmount" value={filters.maxAmount} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                        </div>
                        <div className="flex items-end">
                            <button onClick={fetchTransactions}
                                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {error && <ErrorMessage message={error} onClose={() => setError('')} />}

            {loading ? (
                <div className="flex justify-center py-12"><Loading size="lg" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto" id="transactions-table">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                        onClick={() => handleSort('date')}>
                                        <div className="flex items-center gap-1">
                                            Date & Time {filters.sortBy === 'date' && (filters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Type</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Student PRN</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Class</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Division</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                        onClick={() => handleSort('amount')}>
                                        <div className="flex items-center justify-end gap-1">
                                            Amount {filters.sortBy === 'amount' && (filters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {transactions.length === 0 ? (
                                    <tr><td colSpan="7" className="px-4 py-12 text-center text-gray-500">No transactions found</td></tr>
                                ) : (
                                    transactions.map((t, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 text-sm text-gray-700">{formatDate(t.createdAt || t.date)}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${t.transactionType === 'income' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                    {t.transactionType === 'income' ? 'Income' : 'Expenditure'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                {t.studentPRN ? (
                                                    <Link to={`/student/${t.studentPRN}`} className="text-primary-600 hover:underline">{t.studentPRN}</Link>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{t.studentClass || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{t.studentDivision || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.category || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{t.description || '-'}</td>
                                            <td className={`px-4 py-3 text-sm text-right font-semibold ${t.transactionType === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                {t.transactionType === 'income' ? '+' : '-'}{formatCurrency(t.amount)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.paymentType || '-'}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-4 border-t border-gray-100">
                        <select value={filters.limit} onChange={(e) => setFilters(prev => ({ ...prev, limit: e.target.value, page: 1 }))}
                            className="px-2 py-1 border rounded text-sm">
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={!pagination.hasPrevPage} className="p-2 rounded border disabled:opacity-50">
                                    <FiChevronLeft />
                                </button>
                                <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={!pagination.hasNextPage} className="p-2 rounded border disabled:opacity-50">
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

export default TransactionReport;
