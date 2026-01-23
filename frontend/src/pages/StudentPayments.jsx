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
    FiSearch,
    FiArrowUp,
    FiArrowDown
} from 'react-icons/fi';

const StudentPayments = () => {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [grandTotals, setGrandTotals] = useState({});
    const [pagination, setPagination] = useState({});
    const [showFilters, setShowFilters] = useState(false);

    const [filters, setFilters] = useState({
        type: '',
        year: '',
        division: '',
        search: '',
        sortBy: 'rollNo',
        sortOrder: 'asc',
        page: 1,
        limit: 10
    });

    const [filterOptions, setFilterOptions] = useState({ years: [], divisions: [] });

    useEffect(() => {
        fetchStudentPayments();
    }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

    const handleSort = (field) => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
    };

    const fetchStudentPayments = async () => {
        try {
            setLoading(true);
            setError('');
            const params = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await reportsAPI.getStudentPayments(params);
            setStudents(response.data.data.students);
            setGrandTotals(response.data.data.grandTotals);
            setPagination(response.data.data.pagination);
            if (response.data.data.filterOptions) {
                setFilterOptions(response.data.data.filterOptions);
            }


        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load student payments');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value, page: 1 }));
    };

    const applyFilters = () => {
        fetchStudentPayments();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    const getReportPeriod = () => {
        const activeFilters = [];
        if (filters.year) activeFilters.push(`Year: ${filters.year}`);
        if (filters.division) activeFilters.push(`Division: ${filters.division}`);
        if (filters.type) activeFilters.push(`Type: ${filters.type === 'fee' ? 'Fees Only' : 'Fines Only'}`);
        return activeFilters.length > 0 ? activeFilters.join(' | ') : 'All Students with Payments';
    };



    const exportToExcel = async () => {
        try {
            const params = { limit: 10000, page: 1 };
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await reportsAPI.getStudentPayments(params);
            const allData = response.data.data.students;
            const totals = response.data.data.grandTotals;

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
                [{ v: "STUDENT PAYMENTS REPORT", s: { font: { bold: true, sz: 12 } } }],
                [],
                [{ v: "Report Filter: " + getReportPeriod(), s: { font: { bold: true } } }],
                [{ v: "Generated On: " + new Date().toLocaleString('en-IN'), s: { font: { italic: true } } }],
                [{ v: "Total Students: " + allData.length, s: { font: { bold: true } } }],
                [],
                [{ v: "SUMMARY", s: { font: { bold: true, underscore: true } } }],
                [{ v: "Total Fees Collected:", s: { font: { bold: true } } }, { v: totals.totalFees, t: 'n', s: { numFmt: "₹#,##0" } }],
                [{ v: "Total Fines Collected:", s: { font: { bold: true } } }, { v: totals.totalFines, t: 'n', s: { numFmt: "₹#,##0" } }],
                [{ v: "Grand Total:", s: { font: { bold: true } } }, { v: totals.totalAmount, t: 'n', s: { numFmt: "₹#,##0" } }],
                [],
                [{ v: "STUDENT DETAILS", s: { font: { bold: true, sz: 11 } } }],
                [
                    { v: "PRN", s: headerStyle },
                    { v: "Roll No", s: headerStyle },
                    { v: "Name", s: headerStyle },
                    { v: "Year", s: headerStyle },
                    { v: "Division", s: headerStyle },
                    { v: "Fees Paid (₹)", s: headerStyle },
                    { v: "Fine Paid (₹)", s: headerStyle },
                    { v: "Total (₹)", s: headerStyle }
                ]
            ];

            // Student Data
            allData.forEach(s => {
                wsData.push([
                    { v: s.prn, s: cellStyle },
                    { v: s.rollNo || '-', s: cellStyle },
                    { v: s.name, s: cellStyle },
                    { v: s.year || '-', s: cellStyle },
                    { v: s.division || '-', s: cellStyle },
                    { v: s.totalFeesPaid, t: 'n', s: cellStyle },
                    { v: s.totalFinePaid, t: 'n', s: cellStyle },
                    { v: s.totalAmount, t: 'n', s: { ...cellStyle, font: { bold: true } } }
                ]);
            });

            // Footer / Grand Total
            wsData.push([]);
            wsData.push([
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "", s: totalStyle },
                { v: "GRAND TOTAL:", s: { ...totalStyle, alignment: { horizontal: "right" } } },
                { v: totals.totalFees, t: 'n', s: totalStyle },
                { v: totals.totalFines, t: 'n', s: totalStyle },
                { v: totals.totalAmount, t: 'n', s: totalStyle }
            ]);

            const worksheet = XLSX.utils.aoa_to_sheet([]);
            // Use aoa_to_sheet does not support direct cell object with style in older versions, 
            // but xlsx-js-style expects us to construct ranges or just use the objects directly if we manual populate.
            // Actually xlsx-js-style is a fork that supports the 's' property in cell objects.

            // To make it simple with style objects, we'll manually add cells
            XLSX.utils.sheet_add_aoa(worksheet, wsData, { origin: "A1" });

            worksheet['!cols'] = [
                { wch: 15 }, { wch: 10 }, { wch: 30 }, { wch: 10 }, { wch: 10 },
                { wch: 15 }, { wch: 15 }, { wch: 15 }
            ];

            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Student Payments');
            XLSX.writeFile(workbook, `Student_Payments_${new Date().toISOString().split('T')[0]}.xlsx`);
        } catch (err) {
            console.error(err);
            setError('Failed to export to Excel');
        }
    };

    const exportToPDF = async () => {
        try {
            const params = { limit: 10000, page: 1 };
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await reportsAPI.getStudentPayments(params);
            const allData = response.data.data.students;
            const totals = response.data.data.grandTotals;

            const pdfContent = document.createElement('div');
            pdfContent.style.fontFamily = 'Arial, sans-serif';
            pdfContent.style.padding = '20px';
            pdfContent.style.color = '#333';
            pdfContent.style.width = '190mm'; // Force A4 portrait width (210mm - margins)

            pdfContent.innerHTML = `
                <div style="text-align: center; margin-bottom: 30px;">
                    <h1 style="margin: 0; color: #1a365d; font-size: 24px;">INFORMATION TECHNOLOGY STUDENT ASSOCIATION (ITSA)</h1>
                    <h2 style="margin: 10px 0; color: #2d3748; font-size: 18px;">STUDENT PAYMENTS REPORT</h2>
                    <p style="margin: 5px 0; color: #718096; font-size: 12px;">Filter: ${getReportPeriod()}</p>
                    <p style="margin: 5px 0; color: #718096; font-size: 11px;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
                </div>

                <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f7fafc; padding: 15px; border-radius: 8px;">
                    <div style="text-align: center; flex: 1;">
                        <p style="margin: 0; color: #718096; font-size: 12px;">Total Fees</p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #38a169;">${formatCurrency(totals.totalFees)}</p>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <p style="margin: 0; color: #718096; font-size: 12px;">Total Fines</p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #dd6b20;">${formatCurrency(totals.totalFines)}</p>
                    </div>
                    <div style="text-align: center; flex: 1;">
                        <p style="margin: 0; color: #718096; font-size: 12px;">Grand Total</p>
                        <p style="margin: 5px 0; font-size: 18px; font-weight: bold; color: #3182ce;">${formatCurrency(totals.totalAmount)}</p>
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; font-size: 11px;">
                    <thead>
                        <tr style="background: #edf2f7;">
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">PRN</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">Roll No</th>
                            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #cbd5e0;">Name</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e0;">Year</th>
                            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #cbd5e0;">Div</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e0;">Fees Paid</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e0;">Fine Paid</th>
                            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #cbd5e0;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${allData.map(s => `
                            <tr>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${s.prn}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${s.rollNo || '-'}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0;">${s.name}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.year || '-'}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: center;">${s.division || '-'}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #38a169;">${formatCurrency(s.totalFeesPaid)}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #dd6b20;">${formatCurrency(s.totalFinePaid)}</td>
                                <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 600;">${formatCurrency(s.totalAmount)}</td>
                            </tr>
                        `).join('')}
                        <tr style="background: #f7fafc; font-weight: bold;">
                            <td colspan="4" style="padding: 10px; text-align: right;">GRAND TOTAL:</td>
                            <td style="padding: 10px; text-align: right; color: #38a169;">${formatCurrency(totals.totalFees)}</td>
                            <td style="padding: 10px; text-align: right; color: #dd6b20;">${formatCurrency(totals.totalFines)}</td>
                            <td style="padding: 10px; text-align: right; color: #3182ce;">${formatCurrency(totals.totalAmount)}</td>
                        </tr>
                    </tbody>
                </table>

                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #a0aec0; text-align: center;">
                    <p>This is a computer-generated report. No signature required.</p>
                    <p>Zeal Institute of Technology - Accounts Department</p>
                </div>
            `;

            html2pdf().set({
                margin: [10, 10, 10, 10],
                filename: `Student_Payments_${new Date().toISOString().split('T')[0]}.pdf`,
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
                        <span className="text-gray-700">Student Payments</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Students With Payments</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <FiFilter className="w-4 h-4" /> Filters
                    </button>
                    <button onClick={exportToExcel}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <FiDownload className="w-4 h-4" /> Excel
                    </button>
                    <button onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <FiDownload className="w-4 h-4" /> PDF
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Fees Collected</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(grandTotals.totalFees)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Total Fines Collected</p>
                    <p className="text-2xl font-bold text-orange-600">{formatCurrency(grandTotals.totalFines)}</p>
                </div>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <p className="text-sm text-gray-500">Grand Total</p>
                    <p className="text-2xl font-bold text-primary-600">{formatCurrency(grandTotals.totalAmount)}</p>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-semibold text-gray-700">Filters</h3>
                        <button onClick={() => {
                            setFilters({ type: '', year: '', division: '', search: '', page: 1, limit: 10 });
                            setTimeout(fetchStudentPayments, 100);
                        }} className="text-sm text-red-600 hover:text-red-700">Clear All</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
                            <select name="year" value={filters.year} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All Classes</option>
                                <option value="FE">FE</option>
                                <option value="SE">SE</option>
                                <option value="TE">TE</option>
                                <option value="BE">BE</option>
                                {filterOptions.years.filter(y => !['FE', 'SE', 'TE', 'BE'].includes(y)).map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Division</label>
                            <select name="division" value={filters.division} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All Divisions</option>
                                {filterOptions.divisions.map(d => (
                                    <option key={d} value={d}>{d}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Payment Type</label>
                            <select name="type" value={filters.type} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">Both (Fee & Fine)</option>
                                <option value="fee">Fees Only</option>
                                <option value="fine">Fines Only</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Search</label>
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="text" name="search" value={filters.search} onChange={handleFilterChange}
                                    placeholder="PRN or Name..."
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg" />
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button onClick={applyFilters}
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
                    <div className="overflow-x-auto" id="payments-table">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">PRN</th>
                                    <th onClick={() => handleSort('rollNo')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                                        <div className="flex items-center gap-1">
                                            Roll No {filters.sortBy === 'rollNo' && (filters.sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />)}
                                        </div>
                                    </th>
                                    <th onClick={() => handleSort('name')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                                        <div className="flex items-center gap-1">
                                            Name {filters.sortBy === 'name' && (filters.sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />)}
                                        </div>
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Year</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Division</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Fees Paid</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Fine Paid</th>
                                    <th onClick={() => handleSort('totalAmount')}
                                        className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                                        <div className="flex items-center justify-end gap-1">
                                            Total {filters.sortBy === 'totalAmount' && (filters.sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />)}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.length === 0 ? (
                                    <tr><td colSpan="8" className="px-6 py-12 text-center text-gray-500">No students found</td></tr>
                                ) : (
                                    students.map((s) => (
                                        <tr key={s.prn} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm font-medium text-primary-600">
                                                <Link to={`/student/${s.prn}`}>{s.prn}</Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{s.rollNo || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{s.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{s.year || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{s.division || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-right text-green-600 font-medium">{formatCurrency(s.totalFeesPaid)}</td>
                                            <td className="px-6 py-4 text-sm text-right text-orange-600 font-medium">{formatCurrency(s.totalFinePaid)}</td>
                                            <td className="px-6 py-4 text-sm text-right font-bold text-gray-800">{formatCurrency(s.totalAmount)}</td>
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
                            <span className="text-sm text-gray-600">Page {pagination.currentPage} of {pagination.totalPages}</span>
                            <div className="flex gap-2">
                                <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
                                    disabled={!pagination.hasPrevPage}
                                    className="p-2 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
                                    <FiChevronLeft />
                                </button>
                                <button onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
                                    disabled={!pagination.hasNextPage}
                                    className="p-2 rounded border border-gray-300 disabled:opacity-50 hover:bg-gray-50">
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

export default StudentPayments;
