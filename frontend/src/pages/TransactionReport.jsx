import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { reportsAPI, studentsAPI, expenditureAPI, authAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ReceiptModal from '../components/ReceiptModal';
import ExpenseReceiptModal from '../components/ExpenseReceiptModal';
import * as XLSX from 'xlsx-js-style';
import html2pdf from 'html2pdf.js';
import {
    FiDownload,
    FiFilter,
    FiChevronDown,
    FiChevronUp,
    FiArrowUp,
    FiArrowDown,
    FiTrendingUp,
    FiTrendingDown,
    FiSearch,
    FiX,
    FiFileText,
    FiMinusCircle,
    FiTrash2,
    FiLock,
    FiCheckSquare,
    FiSquare
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

const TransactionReport = () => {
    // Active section tab
    const [activeTab, setActiveTab] = useState('income');

    // Income state
    const [incomeTransactions, setIncomeTransactions] = useState([]);
    const [incomeLoading, setIncomeLoading] = useState(true);
    const [incomeSummary, setIncomeSummary] = useState({});
    const [incomeFilterOptions, setIncomeFilterOptions] = useState({ divisions: [], years: [] });

    // Expenditure state
    const [expenditures, setExpenditures] = useState([]);
    const [expenditureLoading, setExpenditureLoading] = useState(true);
    const [expenditureSummary, setExpenditureSummary] = useState({});

    // Delete mode state
    const [deleteMode, setDeleteMode] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordVerifying, setPasswordVerifying] = useState(false);
    const [selectedDeleteIds, setSelectedDeleteIds] = useState([]);
    const [deleteSuccess, setDeleteSuccess] = useState('');
    const [deleting, setDeleting] = useState(false);

    const [error, setError] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedReceipt, setSelectedReceipt] = useState(null);
    const [selectedExpense, setSelectedExpense] = useState(null);

    // Income filters
    const [incomeFilters, setIncomeFilters] = useState({
        paymentType: '', category: '', year: '', month: '', division: '', studentClass: '',
        fromDate: '', toDate: '', minAmount: '', maxAmount: '', search: '',
        sortBy: 'date', sortOrder: 'desc', page: 1, limit: 100000
    });

    // Expenditure filters
    const [expenditureFilters, setExpenditureFilters] = useState({
        category: '', year: '', month: '', fromDate: '', toDate: '', minAmount: '', maxAmount: '',
        sortBy: 'date', sortOrder: 'desc', page: 1, limit: 100000
    });

    // Search state with debounce
    const [searchInput, setSearchInput] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [searchSuggestions, setSearchSuggestions] = useState([]);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchInput);
            if (searchInput.trim().length >= 2) {
                fetchSearchSuggestions(searchInput);
            } else {
                setSearchSuggestions([]);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const fetchSearchSuggestions = async (query) => {
        try {
            const response = await studentsAPI.search(query);
            setSearchSuggestions(response.data.data);
            setShowSearchDropdown(true);
        } catch (err) {
            console.error('Failed to fetch suggestions', err);
        }
    };

    const handleSearchSelect = (student) => {
        setSearchInput(student.prn);
        setSearchSuggestions([]);
        setShowSearchDropdown(false);
    };

    // Trigger fetch when debounced search changes
    useEffect(() => {
        setIncomeFilters(prev => ({ ...prev, search: debouncedSearch, page: 1 }));
    }, [debouncedSearch]);

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

    // Dynamic expenditure categories - computed from data
    const expenditureCategories = [...new Set(expenditures.map(e => e.category).filter(Boolean))];

    useEffect(() => {
        fetchIncomeTransactions();
    }, [incomeFilters]);

    useEffect(() => {
        fetchExpenditures();
    }, [expenditureFilters]);

    const fetchIncomeTransactions = async () => {
        try {
            setIncomeLoading(true);
            const params = { type: 'income' };
            Object.entries(incomeFilters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await reportsAPI.getTransactions(params);
            setIncomeTransactions(response.data.data.transactions);
            setIncomeSummary(response.data.data.summary);
            if (response.data.data.filterOptions) {
                setIncomeFilterOptions(response.data.data.filterOptions);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load income transactions');
        } finally {
            setIncomeLoading(false);
        }
    };

    const fetchExpenditures = async () => {
        try {
            setExpenditureLoading(true);
            const params = {};
            Object.entries(expenditureFilters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await expenditureAPI.getAll(params);
            setExpenditures(response.data.data?.expenditures || []);
            // Calculate summary
            const total = (response.data.data?.expenditures || []).reduce((sum, e) => sum + e.amount, 0);
            setExpenditureSummary({ totalAmount: total, count: response.data.data?.expenditures?.length || 0 });
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load expenditures');
        } finally {
            setExpenditureLoading(false);
        }
    };

    const handleIncomeFilterChange = (e) => {
        setIncomeFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
    };

    const handleExpenditureFilterChange = (e) => {
        setExpenditureFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
    };

    const handleIncomeSort = (field) => {
        setIncomeFilters(prev => ({
            ...prev, sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'desc' ? 'asc' : 'desc'
        }));
    };

    const handleExpenditureSort = (field) => {
        setExpenditureFilters(prev => ({
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

    const clearIncomeFilters = () => {
        setSearchInput('');
        setIncomeFilters({
            paymentType: '', category: '', year: '', month: '', division: '', studentClass: '',
            fromDate: '', toDate: '', minAmount: '', maxAmount: '', search: '',
            sortBy: 'date', sortOrder: 'desc', page: 1, limit: 100000
        });
    };

    const clearExpenditureFilters = () => {
        setExpenditureFilters({
            category: '', year: '', month: '', fromDate: '', toDate: '', minAmount: '', maxAmount: '',
            sortBy: 'date', sortOrder: 'desc', page: 1, limit: 100000
        });
    };

    // Delete mode functions
    const handleDeleteButtonClick = () => {
        setShowPasswordModal(true);
        setDeletePassword('');
        setPasswordError('');
    };

    const handlePasswordVerify = async () => {
        if (!deletePassword.trim()) {
            setPasswordError('Please enter your password');
            return;
        }

        try {
            setPasswordVerifying(true);
            setPasswordError('');
            await authAPI.verifyPassword(deletePassword);
            setShowPasswordModal(false);
            setDeleteMode(true);
            setSelectedDeleteIds([]);
            setDeletePassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Incorrect password. Please try again.');
        } finally {
            setPasswordVerifying(false);
        }
    };

    const handleCancelDelete = () => {
        setDeleteMode(false);
        setSelectedDeleteIds([]);
        setDeleteSuccess('');
    };

    const toggleSelectExpenditure = (id) => {
        setSelectedDeleteIds(prev =>
            prev.includes(id)
                ? prev.filter(x => x !== id)
                : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        if (selectedDeleteIds.length === expenditures.length) {
            setSelectedDeleteIds([]);
        } else {
            setSelectedDeleteIds(expenditures.map(e => e._id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedDeleteIds.length === 0) {
            setError('Please select at least one expenditure to delete');
            return;
        }

        try {
            setDeleting(true);
            const response = await expenditureAPI.bulkDelete(selectedDeleteIds);
            setDeleteSuccess(`Successfully deleted ${response.data.data.deletedCount} expenditure(s)`);
            setSelectedDeleteIds([]);
            setDeleteMode(false);
            // Refresh expenditures
            fetchExpenditures();
            // Clear success message after 3 seconds
            setTimeout(() => setDeleteSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete expenditures');
        } finally {
            setDeleting(false);
        }
    };

    const getIncomeReportPeriod = () => {
        if (incomeFilters.fromDate && incomeFilters.toDate) {
            return `${formatDate(incomeFilters.fromDate)} to ${formatDate(incomeFilters.toDate)}`;
        } else if (incomeFilters.year && incomeFilters.month) {
            return `${months.find(m => m.value == incomeFilters.month)?.label} ${incomeFilters.year}`;
        } else if (incomeFilters.year) {
            return `Year ${incomeFilters.year}`;
        }
        return 'All Time';
    };

    const getExpenditureReportPeriod = () => {
        if (expenditureFilters.fromDate && expenditureFilters.toDate) {
            return `${formatDate(expenditureFilters.fromDate)} to ${formatDate(expenditureFilters.toDate)}`;
        } else if (expenditureFilters.year && expenditureFilters.month) {
            return `${months.find(m => m.value == expenditureFilters.month)?.label} ${expenditureFilters.year}`;
        } else if (expenditureFilters.year) {
            return `Year ${expenditureFilters.year}`;
        }
        return 'All Time';
    };

    // Export Income to Excel
    const exportIncomeToExcel = async () => {
        try {
            const allData = incomeTransactions;
            const totals = incomeSummary;

            const headerStyle = {
                font: { bold: true, sz: 12 },
                fill: { fgColor: { rgb: "DCE6F1" } },
                border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
                alignment: { horizontal: "center" }
            };

            const cellStyle = {
                border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
            };

            const totalStyle = {
                font: { bold: true },
                fill: { fgColor: { rgb: "F2F2F2" } },
                border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
            };

            const wsData = [
                [{ v: "INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)", s: { font: { bold: true, sz: 14 } } }],
                [{ v: "INCOME REPORT", s: { font: { bold: true, sz: 12 } } }],
                [],
                [{ v: "Report Period: " + getIncomeReportPeriod(), s: { font: { bold: true } } }],
                [{ v: "Generated On: " + new Date().toLocaleString('en-IN'), s: { font: { italic: true } } }],
                [],
                [{ v: "TOTAL INCOME: " + formatCurrency(totals.totalIncome), s: { font: { bold: true, sz: 12 } } }],
                [],
                [
                    { v: "Date & Time", s: headerStyle },
                    { v: "Receipt No", s: headerStyle },
                    { v: "Roll No", s: headerStyle },
                    { v: "PRN", s: headerStyle },
                    { v: "Name", s: headerStyle },
                    { v: "Class", s: headerStyle },
                    { v: "Div", s: headerStyle },
                    { v: "Category", s: headerStyle },
                    { v: "Description", s: headerStyle },
                    { v: "Amount (₹)", s: headerStyle },
                    { v: "Mode", s: headerStyle }
                ]
            ];

            allData.forEach(t => {
                wsData.push([
                    { v: formatDate(t.createdAt || t.date), s: cellStyle },
                    { v: t.receiptNumber || '-', s: cellStyle },
                    { v: t.studentRollNo || '-', s: cellStyle },
                    { v: t.studentPRN || '-', s: cellStyle },
                    { v: t.studentName || '-', s: cellStyle },
                    { v: t.studentClass || '-', s: cellStyle },
                    { v: t.studentDivision || '-', s: cellStyle },
                    { v: t.category, s: cellStyle },
                    { v: t.description, s: cellStyle },
                    { v: t.amount, t: 'n', s: cellStyle },
                    { v: t.paymentMode || t.paymentType || '-', s: cellStyle }
                ]);
            });

            wsData.push([]);
            wsData.push([
                { v: "", s: totalStyle }, { v: "", s: totalStyle }, { v: "", s: totalStyle },
                { v: "", s: totalStyle }, { v: "", s: totalStyle }, { v: "", s: totalStyle },
                { v: "", s: totalStyle }, { v: "", s: totalStyle },
                { v: "TOTAL:", s: { ...totalStyle, alignment: { horizontal: "right" } } },
                { v: totals.totalIncome, t: 'n', s: totalStyle },
                { v: "", s: totalStyle }
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet([]);
            XLSX.utils.sheet_add_aoa(worksheet, wsData, { origin: "A1" });
            worksheet['!cols'] = [
                { wch: 22 }, { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 25 },
                { wch: 10 }, { wch: 8 }, { wch: 15 }, { wch: 30 }, { wch: 15 }, { wch: 12 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Income');
            XLSX.writeFile(workbook, `Income_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            setError('Failed to export income');
        }
    };

    // Export Income to PDF
    const exportIncomeToPDF = async () => {
        try {
            const allData = incomeTransactions;
            const totals = incomeSummary;

            const pdfContent = document.createElement('div');
            pdfContent.style.fontFamily = "'Segoe UI', Arial, sans-serif";
            pdfContent.style.padding = '15px';
            pdfContent.style.color = '#333';
            pdfContent.style.width = '190mm';

            pdfContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="margin: 0; color: #1a365d; font-size: 20px; font-weight: bold;">INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)</h1>
                    <h2 style="margin: 5px 0; color: #2d3748; font-size: 16px;">INCOME REPORT</h2>
                    <p style="margin: 5px 0; color: #718096; font-size: 11px;">Period: ${getIncomeReportPeriod()}</p>
                    <p style="margin: 2px 0; color: #718096; font-size: 10px;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
                </div>

                <div style="margin-bottom: 15px; background: #f0fdf4; padding: 10px; border-radius: 6px; border: 1px solid #bbf7d0; text-align: center;">
                    <p style="margin: 0; color: #166534; font-size: 10px; text-transform: uppercase;">Total Income</p>
                    <p style="margin: 2px 0; font-size: 18px; font-weight: bold; color: #047857;">${formatCurrency(totals.totalIncome)}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
                    <thead>
                        <tr style="background: #f1f5f9;">
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #cbd5e0;">Date</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #cbd5e0;">Receipt</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #cbd5e0;">Roll</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #cbd5e0;">PRN</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #cbd5e0;">Name</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #cbd5e0;">Category</th>
                            <th style="padding: 6px 4px; text-align: right; border-bottom: 1px solid #cbd5e0;">Amount</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #cbd5e0;">Mode</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allData.map((t, idx) => `
                            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f8fafc'}; page-break-inside: avoid;">
                                <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; white-space: nowrap;">${formatDate(t.createdAt || t.date)}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #e2e8f0;">${t.receiptNumber || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #e2e8f0;">${t.studentRollNo || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; font-family: monospace;">${t.studentPRN || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${t.studentName || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #e2e8f0;">${t.category || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600; color: #059669;">+${formatCurrency(t.amount)}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #e2e8f0; text-transform: capitalize;">${t.paymentMode || t.paymentType || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top: 20px; border-top: 1px solid #cbd5e0; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8px; color: #718096;">
                    <span>Zeal Institute of Technology - Accounts Department</span>
                    <span>Income Report</span>
                </div>
            `;

            html2pdf().set({
                margin: 10,
                filename: `Income_Report_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(pdfContent).save();
        } catch (err) {
            console.error(err);
            setError('Failed to export income to PDF');
        }
    };

    // Export Expenditure to Excel
    const exportExpenditureToExcel = async () => {
        try {
            const allData = expenditures;
            const totals = expenditureSummary;

            const headerStyle = {
                font: { bold: true, sz: 12 },
                fill: { fgColor: { rgb: "FEE2E2" } },
                border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } },
                alignment: { horizontal: "center" }
            };

            const cellStyle = {
                border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
            };

            const totalStyle = {
                font: { bold: true },
                fill: { fgColor: { rgb: "F2F2F2" } },
                border: { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } }
            };

            const wsData = [
                [{ v: "INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)", s: { font: { bold: true, sz: 14 } } }],
                [{ v: "EXPENDITURE REPORT", s: { font: { bold: true, sz: 12 } } }],
                [],
                [{ v: "Report Period: " + getExpenditureReportPeriod(), s: { font: { bold: true } } }],
                [{ v: "Generated On: " + new Date().toLocaleString('en-IN'), s: { font: { italic: true } } }],
                [],
                [{ v: "TOTAL EXPENDITURE: " + formatCurrency(totals.totalAmount), s: { font: { bold: true, sz: 12 } } }],
                [],
                [
                    { v: "Date & Time", s: headerStyle },
                    { v: "Receipt No", s: headerStyle },
                    { v: "Category", s: headerStyle },
                    { v: "Description", s: headerStyle },
                    { v: "Sender", s: headerStyle },
                    { v: "Receiver", s: headerStyle },
                    { v: "Amount (₹)", s: headerStyle },
                    { v: "Notes", s: headerStyle }
                ]
            ];

            allData.forEach(e => {
                wsData.push([
                    { v: formatDate(e.date || e.createdAt), s: cellStyle },
                    { v: e.receiptNumber || '-', s: cellStyle },
                    { v: e.category || '-', s: cellStyle },
                    { v: e.description, s: cellStyle },
                    { v: e.senderName || '-', s: cellStyle },
                    { v: e.receiverName || '-', s: cellStyle },
                    { v: e.amount, t: 'n', s: cellStyle },
                    { v: e.notes || '-', s: cellStyle }
                ]);
            });

            wsData.push([]);
            wsData.push([
                { v: "", s: totalStyle }, { v: "", s: totalStyle }, { v: "", s: totalStyle },
                { v: "", s: totalStyle }, { v: "", s: totalStyle },
                { v: "TOTAL:", s: { ...totalStyle, alignment: { horizontal: "right" } } },
                { v: totals.totalAmount, t: 'n', s: totalStyle },
                { v: "", s: totalStyle }
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet([]);
            XLSX.utils.sheet_add_aoa(worksheet, wsData, { origin: "A1" });
            worksheet['!cols'] = [
                { wch: 22 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
                { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Expenditure');
            XLSX.writeFile(workbook, `Expenditure_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            setError('Failed to export expenditure');
        }
    };

    // Export Expenditure to PDF
    const exportExpenditureToPDF = async () => {
        try {
            const allData = expenditures;
            const totals = expenditureSummary;

            const pdfContent = document.createElement('div');
            pdfContent.style.fontFamily = "'Segoe UI', Arial, sans-serif";
            pdfContent.style.padding = '15px';
            pdfContent.style.color = '#333';
            pdfContent.style.width = '190mm';

            pdfContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="margin: 0; color: #1a365d; font-size: 20px; font-weight: bold;">INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)</h1>
                    <h2 style="margin: 5px 0; color: #2d3748; font-size: 16px;">EXPENDITURE REPORT</h2>
                    <p style="margin: 5px 0; color: #718096; font-size: 11px;">Period: ${getExpenditureReportPeriod()}</p>
                    <p style="margin: 2px 0; color: #718096; font-size: 10px;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
                </div>

                <div style="margin-bottom: 15px; background: #fef2f2; padding: 10px; border-radius: 6px; border: 1px solid #fecaca; text-align: center;">
                    <p style="margin: 0; color: #991b1b; font-size: 10px; text-transform: uppercase;">Total Expenditure</p>
                    <p style="margin: 2px 0; font-size: 18px; font-weight: bold; color: #dc2626;">${formatCurrency(totals.totalAmount)}</p>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 8px;">
                    <thead>
                        <tr style="background: #fef2f2;">
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #fca5a5;">Date</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #fca5a5;">Receipt</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #fca5a5;">Category</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #fca5a5;">Description</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #fca5a5;">Sender</th>
                            <th style="padding: 6px 4px; text-align: left; border-bottom: 1px solid #fca5a5;">Receiver</th>
                            <th style="padding: 6px 4px; text-align: right; border-bottom: 1px solid #fca5a5;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allData.map((e, idx) => `
                            <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#fffbfb'}; page-break-inside: avoid;">
                                <td style="padding: 4px; border-bottom: 1px solid #fee2e2; white-space: nowrap;">${formatDate(e.date || e.createdAt)}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #fee2e2;">${e.receiptNumber || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #fee2e2; text-transform: capitalize;">${e.category || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #fee2e2; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${e.description}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #fee2e2;">${e.senderName || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #fee2e2;">${e.receiverName || '-'}</td>
                                <td style="padding: 4px; border-bottom: 1px solid #fee2e2; text-align: right; font-weight: 600; color: #dc2626;">-${formatCurrency(e.amount)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div style="margin-top: 20px; border-top: 1px solid #fca5a5; padding-top: 10px; display: flex; justify-content: space-between; font-size: 8px; color: #718096;">
                    <span>Zeal Institute of Technology - Accounts Department</span>
                    <span>Expenditure Report</span>
                </div>
            `;

            html2pdf().set({
                margin: 10,
                filename: `Expenditure_Report_${new Date().toISOString().split('T')[0]}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            }).from(pdfContent).save();
        } catch (err) {
            console.error(err);
            setError('Failed to export expenditure to PDF');
        }
    };

    const handleViewReceipt = (transaction) => {
        setSelectedReceipt({
            payment: {
                ...transaction,
                type: transaction.type || 'fee',
                date: transaction.createdAt || transaction.date
            },
            student: {
                name: transaction.studentName,
                prn: transaction.studentPRN,
                division: transaction.studentDivision,
                rollNo: transaction.studentRollNo,
                department: transaction.studentDepartment
            }
        });
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
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg"><FiTrendingUp className="text-green-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Total Income</p>
                            <p className="text-xl font-bold text-green-600">{formatCurrency(incomeSummary.totalIncome)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg"><FiTrendingDown className="text-red-600" /></div>
                        <div>
                            <p className="text-sm text-gray-500">Total Expenditure</p>
                            <p className="text-xl font-bold text-red-600">{formatCurrency(expenditureSummary.totalAmount)}</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${(incomeSummary.totalIncome || 0) - (expenditureSummary.totalAmount || 0) >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                            {(incomeSummary.totalIncome || 0) - (expenditureSummary.totalAmount || 0) >= 0
                                ? <FiTrendingUp className="text-blue-600" />
                                : <FiTrendingDown className="text-orange-600" />}
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Net Balance</p>
                            <p className={`text-xl font-bold ${(incomeSummary.totalIncome || 0) - (expenditureSummary.totalAmount || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                {formatCurrency((incomeSummary.totalIncome || 0) - (expenditureSummary.totalAmount || 0))}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {error && <ErrorMessage message={error} onClose={() => setError('')} />}

            {/* Tab Navigation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6">
                <div className="flex border-b border-gray-100">
                    <button
                        onClick={() => setActiveTab('income')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${activeTab === 'income'
                                ? 'text-green-600 border-b-2 border-green-600 bg-green-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FaRupeeSign className="w-5 h-5" />
                        <span>Income</span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            {incomeTransactions.length}
                        </span>
                    </button>
                    <button
                        onClick={() => setActiveTab('expenditure')}
                        className={`flex-1 flex items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${activeTab === 'expenditure'
                                ? 'text-red-600 border-b-2 border-red-600 bg-red-50/50'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <FiMinusCircle className="w-5 h-5" />
                        <span>Expenditure</span>
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700">
                            {expenditures.length}
                        </span>
                    </button>
                </div>
            </div>

            {/* ==================== INCOME SECTION ==================== */}
            {activeTab === 'income' && (
                <div className="space-y-6">
                    {/* Income Header & Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FiTrendingUp className="text-green-600" />
                            Income Transactions
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                <FiFilter /> Filters {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                            </button>
                            <button onClick={exportIncomeToExcel}
                                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                <FiDownload /> Excel
                            </button>
                            <button onClick={exportIncomeToPDF}
                                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                <FiDownload /> PDF
                            </button>
                        </div>
                    </div>

                    {/* Income Search Bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                        <div className="flex flex-col md:flex-row gap-4">
                            <div className="flex-1 relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search by PRN, Roll No, Name or Receipt No..."
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    onFocus={() => {
                                        if (searchInput.trim().length >= 2) setShowSearchDropdown(true);
                                    }}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                                />
                                {showSearchDropdown && searchSuggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                                        <ul>
                                            {searchSuggestions.map((s) => (
                                                <li
                                                    key={s.prn}
                                                    onClick={() => handleSearchSelect(s)}
                                                    className="px-4 py-2 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                                >
                                                    <div className="flex justify-between items-center">
                                                        <div>
                                                            <p className="text-sm font-medium text-gray-800">{s.name}</p>
                                                            <p className="text-xs text-primary-600 font-mono">{s.prn}</p>
                                                        </div>
                                                        <div className="text-right text-xs text-gray-500">
                                                            <p className="font-mono">{s.rollNo || '-'}</p>
                                                        </div>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                            {(searchInput || incomeFilters.paymentType || incomeFilters.category) && (
                                <button onClick={clearIncomeFilters}
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg">
                                    <FiX /> Clear
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Income Filters */}
                    {showFilters && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Income Filters</h3>
                                <button onClick={clearIncomeFilters} className="text-sm text-red-600">Clear All</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Payment Type</label>
                                    <select name="paymentType" value={incomeFilters.paymentType} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">All</option>
                                        <option value="fee">Fee</option>
                                        <option value="fine">Fine</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Calendar Year</label>
                                    <select name="year" value={incomeFilters.year} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">All</option>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
                                    <select name="month" value={incomeFilters.month} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">All</option>
                                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
                                    <select name="studentClass" value={incomeFilters.studentClass} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">All</option>
                                        {incomeFilterOptions.years?.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Division</label>
                                    <select name="division" value={incomeFilters.division} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">All</option>
                                        {incomeFilterOptions.divisions.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">From Date</label>
                                    <input type="date" name="fromDate" value={incomeFilters.fromDate} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">To Date</label>
                                    <input type="date" name="toDate" value={incomeFilters.toDate} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Min Amount</label>
                                    <input type="number" name="minAmount" value={incomeFilters.minAmount} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Max Amount</label>
                                    <input type="number" name="maxAmount" value={incomeFilters.maxAmount} onChange={handleIncomeFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div className="flex items-end">
                                    <button onClick={fetchIncomeTransactions}
                                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Income Table */}
                    {incomeLoading ? (
                        <div className="flex justify-center py-12"><Loading size="lg" /></div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-green-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                                onClick={() => handleIncomeSort('date')}>
                                                <div className="flex items-center gap-1">
                                                    Date & Time {incomeFilters.sortBy === 'date' && (incomeFilters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                                onClick={() => handleIncomeSort('rollNo')}>
                                                <div className="flex items-center gap-1">
                                                    Roll No {incomeFilters.sortBy === 'rollNo' && (incomeFilters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Receipt No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PRN</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Name</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                                onClick={() => handleIncomeSort('amount')}>
                                                <div className="flex items-center justify-end gap-1">
                                                    Amount {incomeFilters.sortBy === 'amount' && (incomeFilters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Mode</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {incomeTransactions.length === 0 ? (
                                            <tr><td colSpan="9" className="px-4 py-12 text-center text-gray-500">No income transactions found</td></tr>
                                        ) : (
                                            incomeTransactions.map((t, idx) => (
                                                <tr key={idx} className="hover:bg-green-50/30">
                                                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(t.createdAt || t.date)}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-700">{t.studentRollNo || '-'}</td>
                                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                                        {t.receiptNumber ? (
                                                            <span className="bg-green-100 text-green-700 px-2 py-1 rounded border border-green-200">
                                                                {t.receiptNumber}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm">
                                                        {t.studentPRN ? (
                                                            <Link to={`/student/${t.studentPRN}`} className="text-primary-600 hover:underline">{t.studentPRN}</Link>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 font-medium">{t.studentName || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.category || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-green-600">
                                                        +{formatCurrency(t.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{t.paymentMode || t.paymentType || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-center">
                                                        {t.receiptNumber && (
                                                            <button onClick={() => handleViewReceipt(t)} title="View Receipt"
                                                                className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-full transition-colors">
                                                                <FiFileText size={18} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== EXPENDITURE SECTION ==================== */}
            {activeTab === 'expenditure' && (
                <div className="space-y-6">
                    {/* Delete Success Message */}
                    {deleteSuccess && (
                        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex items-center justify-between">
                            <span>{deleteSuccess}</span>
                            <button onClick={() => setDeleteSuccess('')} className="text-green-700 hover:text-green-900">
                                <FiX className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Expenditure Header & Actions */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <FiTrendingDown className="text-red-600" />
                            Expenditure Transactions
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                            {deleteMode ? (
                                <>
                                    <span className="flex items-center gap-2 px-4 py-2 text-gray-600">
                                        {selectedDeleteIds.length} selected
                                    </span>
                                    <button onClick={handleBulkDelete}
                                        disabled={selectedDeleteIds.length === 0 || deleting}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed">
                                        {deleting ? 'Deleting...' : 'Confirm Delete'}
                                    </button>
                                    <button onClick={handleCancelDelete}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600">
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setShowFilters(!showFilters)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                        <FiFilter /> Filters {showFilters ? <FiChevronUp /> : <FiChevronDown />}
                                    </button>
                                    <button onClick={exportExpenditureToExcel}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                        <FiDownload /> Excel
                                    </button>
                                    <button onClick={exportExpenditureToPDF}
                                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                                        <FiDownload /> PDF
                                    </button>
                                    <Link to="/expenditure"
                                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                        Add Expense
                                    </Link>
                                    <button onClick={handleDeleteButtonClick}
                                        className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700">
                                        <FiTrash2 /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Expenditure Filters */}
                    {showFilters && !deleteMode && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold">Expenditure Filters</h3>
                                <button onClick={clearExpenditureFilters} className="text-sm text-red-600">Clear All</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Category</label>
                                    <select name="category" value={expenditureFilters.category} onChange={handleExpenditureFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">All</option>
                                        {expenditureCategories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Year</label>
                                    <select name="year" value={expenditureFilters.year} onChange={handleExpenditureFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">All</option>
                                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Month</label>
                                    <select name="month" value={expenditureFilters.month} onChange={handleExpenditureFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                        <option value="">All</option>
                                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">From Date</label>
                                    <input type="date" name="fromDate" value={expenditureFilters.fromDate} onChange={handleExpenditureFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">To Date</label>
                                    <input type="date" name="toDate" value={expenditureFilters.toDate} onChange={handleExpenditureFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Min Amount</label>
                                    <input type="number" name="minAmount" value={expenditureFilters.minAmount} onChange={handleExpenditureFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Max Amount</label>
                                    <input type="number" name="maxAmount" value={expenditureFilters.maxAmount} onChange={handleExpenditureFilterChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                                </div>
                                <div className="flex items-end">
                                    <button onClick={fetchExpenditures}
                                        className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                        Apply
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Expenditure Table */}
                    {expenditureLoading ? (
                        <div className="flex justify-center py-12"><Loading size="lg" /></div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-teal-50">
                                        <tr>
                                            {deleteMode && (
                                                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase w-12">
                                                    <button onClick={toggleSelectAll} className="p-1 hover:bg-teal-100 rounded">
                                                        {selectedDeleteIds.length === expenditures.length && expenditures.length > 0 ? (
                                                            <FiCheckSquare className="w-5 h-5 text-teal-600" />
                                                        ) : (
                                                            <FiSquare className="w-5 h-5 text-gray-400" />
                                                        )}
                                                    </button>
                                                </th>
                                            )}
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                                onClick={() => handleExpenditureSort('date')}>
                                                <div className="flex items-center gap-1">
                                                    Date & Time {expenditureFilters.sortBy === 'date' && (expenditureFilters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Receipt No</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Category</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Description</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sender</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Receiver</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer"
                                                onClick={() => handleExpenditureSort('amount')}>
                                                <div className="flex items-center justify-end gap-1">
                                                    Amount {expenditureFilters.sortBy === 'amount' && (expenditureFilters.sortOrder === 'desc' ? <FiArrowDown /> : <FiArrowUp />)}
                                                </div>
                                            </th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Notes</th>
                                            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Receipt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {expenditures.length === 0 ? (
                                            <tr><td colSpan={deleteMode ? "10" : "9"} className="px-4 py-12 text-center text-gray-500">No expenditures found</td></tr>
                                        ) : (
                                            expenditures.map((e, idx) => (
                                                <tr key={e._id || idx} className={`hover:bg-teal-50/30 ${selectedDeleteIds.includes(e._id) ? 'bg-red-50' : ''}`}>
                                                    {deleteMode && (
                                                        <td className="px-4 py-3 text-center">
                                                            <button onClick={() => toggleSelectExpenditure(e._id)} className="p-1 hover:bg-teal-100 rounded">
                                                                {selectedDeleteIds.includes(e._id) ? (
                                                                    <FiCheckSquare className="w-5 h-5 text-red-600" />
                                                                ) : (
                                                                    <FiSquare className="w-5 h-5 text-gray-400" />
                                                                )}
                                                            </button>
                                                        </td>
                                                    )}
                                                    <td className="px-4 py-3 text-sm text-gray-700">{formatDate(e.date || e.createdAt)}</td>
                                                    <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                                                        {e.receiptNumber ? (
                                                            <span className="bg-teal-100 text-teal-700 px-2 py-1 rounded border border-teal-200">
                                                                {e.receiptNumber}
                                                            </span>
                                                        ) : '-'}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-600 capitalize">{e.category || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-800 font-medium max-w-xs truncate">{e.description}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{e.senderName || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-gray-600">{e.receiverName || '-'}</td>
                                                    <td className="px-4 py-3 text-sm text-right font-semibold text-teal-600">
                                                        -{formatCurrency(e.amount)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 max-w-xs truncate">{e.notes || '-'}</td>
                                                    <td className="px-4 py-3 text-center">
                                                        <button
                                                            onClick={() => setSelectedExpense(e)}
                                                            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-teal-600 bg-teal-50 hover:bg-teal-100 rounded-lg transition-colors border border-teal-200"
                                                            title="View/Download Receipt"
                                                        >
                                                            <FiFileText className="w-3.5 h-3.5" />
                                                            Receipt
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Receipt Modal */}
            {selectedReceipt && (
                <ReceiptModal
                    isOpen={!!selectedReceipt}
                    onClose={() => setSelectedReceipt(null)}
                    payment={selectedReceipt.payment}
                    student={selectedReceipt.student}
                />
            )}

            {/* Expense Receipt Modal */}
            {selectedExpense && (
                <ExpenseReceiptModal
                    isOpen={!!selectedExpense}
                    onClose={() => setSelectedExpense(null)}
                    expense={selectedExpense}
                />
            )}

            {/* Password Verification Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-slideUp">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center">
                                    <FiLock className="w-6 h-6 text-rose-600" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">Security Verification</h2>
                                    <p className="text-sm text-gray-500">Enter your password to proceed</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowPasswordModal(false);
                                    setDeletePassword('');
                                    setPasswordError('');
                                }}
                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Account Password
                                </label>
                                <input
                                    type="password"
                                    value={deletePassword}
                                    onChange={(e) => {
                                        setDeletePassword(e.target.value);
                                        setPasswordError('');
                                    }}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePasswordVerify()}
                                    placeholder="Enter your login password"
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${passwordError ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                        }`}
                                    autoFocus
                                />
                                {passwordError && (
                                    <p className="mt-2 text-sm text-red-600">{passwordError}</p>
                                )}
                            </div>

                            <p className="text-sm text-gray-500 bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <strong>Note:</strong> This verification ensures only authorized users can delete expenditure records.
                                Deleted records cannot be recovered.
                            </p>

                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => {
                                        setShowPasswordModal(false);
                                        setDeletePassword('');
                                        setPasswordError('');
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handlePasswordVerify}
                                    disabled={passwordVerifying || !deletePassword.trim()}
                                    className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-lg hover:bg-rose-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {passwordVerifying ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            Verifying...
                                        </>
                                    ) : (
                                        'Verify & Continue'
                                    )}
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
