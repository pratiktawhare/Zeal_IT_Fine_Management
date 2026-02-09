import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { studentManagementAPI, studentsAPI, authAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import {
    FiPlus,
    FiEdit2,
    FiTrash2,
    FiSearch,
    FiFilter,
    FiChevronLeft,
    FiChevronRight,
    FiX,
    FiAlertTriangle,
    FiArrowUp,
    FiArrowDown,
    FiUpload,
    FiUser,
    FiLock
} from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';

const StudentManagement = () => {
    const navigate = useNavigate();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [pagination, setPagination] = useState({});
    const [filterOptions, setFilterOptions] = useState({ years: [], divisions: [] });
    const [showFilters, setShowFilters] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const searchWrapperRef = useRef(null);

    const [bulkDeleteYear, setBulkDeleteYear] = useState('');
    const [bulkDeleteDivisions, setBulkDeleteDivisions] = useState([]);

    // Password verification state
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordVerifying, setPasswordVerifying] = useState(false);
    const [pendingDeleteAction, setPendingDeleteAction] = useState(null); // 'single' or 'bulk'

    const [filters, setFilters] = useState({
        year: '', division: '', search: '',
        sortBy: 'rollNo', sortOrder: 'asc', page: 1, limit: 20000
    });

    const [formData, setFormData] = useState({
        prn: '', name: '', year: '', division: '', email: '', phone: '',
        department: '', academicYear: '', semester: '', rollNo: ''
    });

    useEffect(() => {
        fetchStudents();
    }, [filters.page, filters.limit, filters.sortBy, filters.sortOrder]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            const params = {};
            Object.entries(filters).forEach(([key, value]) => {
                if (value) params[key] = value;
            });
            const response = await studentManagementAPI.getAll(params);
            setStudents(response.data.data.students);
            setPagination(response.data.data.pagination);
            setFilterOptions(response.data.data.filterOptions);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load students');
        } finally {
            setLoading(false);
        }
    };

    // Debounce search input
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.trim()) {
                fetchSuggestions(searchQuery);
            } else {
                setSuggestions([]);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (query) => {
        try {
            setIsSearching(true);
            const response = await studentsAPI.search(query);
            setSuggestions(response.data.data);
            if (response.data.data.length > 0) {
                setShowDropdown(true);
            }
        } catch (err) {
            console.error('Failed to fetch suggestions', err);
        } finally {
            setIsSearching(false);
        }
    };

    const handleSelectStudent = (student) => {
        setShowDropdown(false);
        navigate(`/student/${student.prn}`);
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        setFilters(prev => ({ ...prev, search: searchQuery, page: 1 }));
        setShowDropdown(false);
    };

    const clearSearch = () => {
        setSearchQuery('');
        setFilters(prev => ({ ...prev, search: '', page: 1 }));
        setSuggestions([]);
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value, page: 1 }));
    };

    const handleSort = (field) => {
        setFilters(prev => ({
            ...prev,
            sortBy: field,
            sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
        }));
    };



    const handleAddStudent = async (e) => {
        e.preventDefault();
        try {
            await studentManagementAPI.addStudent(formData);
            setSuccess('Student added successfully');
            setShowAddModal(false);
            setFormData({ prn: '', name: '', year: '', division: '', email: '', phone: '', department: '', academicYear: '', semester: '', rollNo: '' });
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add student');
        }
    };

    const handleEditStudent = async (e) => {
        e.preventDefault();
        try {
            await studentManagementAPI.updateStudent(selectedStudent.prn, formData);
            setSuccess('Student updated successfully');
            setShowEditModal(false);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update student');
        }
    };

    // Password verification handler
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
            setDeletePassword('');

            // Execute the pending delete action
            if (pendingDeleteAction === 'single') {
                await executeDeleteStudent();
            } else if (pendingDeleteAction === 'bulk') {
                await executeBulkDelete();
            }
            setPendingDeleteAction(null);
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Incorrect password. Please try again.');
        } finally {
            setPasswordVerifying(false);
        }
    };

    const handleDeleteStudent = () => {
        setPendingDeleteAction('single');
        setShowPasswordModal(true);
        setDeletePassword('');
        setPasswordError('');
    };

    const executeDeleteStudent = async () => {
        try {
            await studentManagementAPI.deleteStudent(selectedStudent.prn);
            setSuccess('Student deleted successfully');
            setShowDeleteModal(false);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete student');
        }
    };

    const handleBulkDelete = () => {
        if (!bulkDeleteYear || bulkDeleteDivisions.length === 0) {
            setError('Please select Year and at least one Division');
            return;
        }
        setPendingDeleteAction('bulk');
        setShowPasswordModal(true);
        setDeletePassword('');
        setPasswordError('');
    };

    const executeBulkDelete = async () => {
        try {
            const divisionsText = bulkDeleteDivisions.join(', ');
            for (const division of bulkDeleteDivisions) {
                await studentManagementAPI.deleteByClass(bulkDeleteYear, division);
            }
            setSuccess(`Students from ${bulkDeleteYear} Div ${divisionsText} deleted successfully`);
            setShowBulkDeleteModal(false);
            setBulkDeleteYear('');
            setBulkDeleteDivisions([]);
            fetchStudents();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to delete students');
        }
    };

    const openEditModal = (student) => {
        setSelectedStudent(student);
        setFormData({
            prn: student.prn, name: student.name, year: student.year || '',
            division: student.division || '', email: student.email || '', phone: student.phone || '',
            department: student.department || '', academicYear: student.academicYear || '',
            semester: student.semester || '', rollNo: student.rollNo || ''
        });
        setShowEditModal(true);
    };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                        <Link to="/dashboard" className="hover:text-primary-600">Dashboard</Link>
                        <span>/</span>
                        <span className="text-gray-700">Student Management</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Student Management</h1>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Link to="/upload"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700">
                        <FiUpload /> Upload CSV
                    </Link>
                    <button onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <FiFilter /> Filters
                    </button>
                    <button onClick={() => setShowBulkDeleteModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                        <FiTrash2 /> Delete Class Data
                    </button>
                    <button onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                        <FiPlus /> Add Student
                    </button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="mb-6 relative max-w-2xl" ref={searchWrapperRef}>
                <form onSubmit={handleSearchSubmit}>
                    <div className="relative">
                        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder="Search by Name, PRN, or Roll No..."
                            className="w-full pl-12 pr-10 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 shadow-sm"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <FiX />
                            </button>
                        )}
                    </div>
                </form>

                {/* Autocomplete Dropdown */}
                {showDropdown && searchQuery.trim() && (suggestions.length > 0 || isSearching) && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-80 overflow-y-auto z-50">
                        {isSearching ? (
                            <div className="p-4 text-center text-gray-500">Searching...</div>
                        ) : (
                            <ul>
                                {suggestions.map((s) => (
                                    <li
                                        key={s.prn}
                                        onClick={() => handleSelectStudent(s)}
                                        className="px-4 py-3 hover:bg-gray-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    >
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="font-medium text-gray-800">{s.name}</p>
                                                <p className="text-xs text-primary-600 font-mono">{s.prn}</p>
                                            </div>
                                            <div className="text-right text-xs text-gray-500">
                                                <p>{s.year} - {s.division}</p>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>

            {/* Messages */}
            {error && <ErrorMessage message={error} onClose={() => setError('')} />}
            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                    <span className="text-green-700">{success}</span>
                    <button onClick={() => setSuccess('')}><FiX /></button>
                </div>
            )}

            {/* Filters */}
            {showFilters && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Class</label>
                            <select name="year" value={filters.year} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All Classes</option>
                                {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-600 mb-1">Division</label>
                            <select name="division" value={filters.division} onChange={handleFilterChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">All Divisions</option>
                                {filterOptions.divisions.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>


                        <div className="flex items-end">
                            <button onClick={fetchStudents}
                                className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                Apply
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Table */}
            {loading ? (
                <div className="flex justify-center py-12"><Loading size="lg" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Sr. No.</th>
                                    <th onClick={() => handleSort('prn')}
                                        className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase cursor-pointer hover:bg-gray-100">
                                        <div className="flex items-center gap-1">
                                            PRN {filters.sortBy === 'prn' && (filters.sortOrder === 'asc' ? <FiArrowUp className="w-3 h-3" /> : <FiArrowDown className="w-3 h-3" />)}
                                        </div>
                                    </th>
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

                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.length === 0 ? (
                                    <tr><td colSpan="10" className="px-6 py-12 text-center text-gray-500">No students found</td></tr>
                                ) : (
                                    students.map((s, index) => (
                                        <tr key={s.prn} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {(pagination.currentPage - 1) * filters.limit + index + 1}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-primary-600">
                                                <Link to={`/student/${s.prn}`}>{s.prn}</Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{s.rollNo || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-700">{s.name}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{s.year || '-'}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{s.division || '-'}</td>

                                            <td className="px-6 py-4">
                                                <div className="flex justify-center gap-2">
                                                    <Link to={`/add-payment/${s.prn}`}
                                                        className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg font-medium text-sm transition-colors"
                                                        title="Add Payment">
                                                        <BiRupee className="text-lg" /> Pay
                                                    </Link>
                                                    <button onClick={() => openEditModal(s)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Edit Student">
                                                        <FiEdit2 />
                                                    </button>
                                                    <button onClick={() => { setSelectedStudent(s); setShowDeleteModal(true); }}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded">
                                                        <FiTrash2 />
                                                    </button>
                                                </div>
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

            {/* Add Student Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">Add New Student</h3>
                            <button onClick={() => setShowAddModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleAddStudent} className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">PRN *</label>
                                    <input type="text" required value={formData.prn}
                                        onChange={(e) => setFormData(prev => ({ ...prev, prn: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Roll No</label>
                                    <input type="text" value={formData.rollNo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, rollNo: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name *</label>
                                    <input type="text" required value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Year</label>
                                    <input type="text" value={formData.year}
                                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Division</label>
                                    <input type="text" value={formData.division}
                                        onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input type="email" value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input type="text" value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                Add Student
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Student Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center p-4 border-b">
                            <h3 className="text-lg font-semibold">Edit Student</h3>
                            <button onClick={() => setShowEditModal(false)}><FiX /></button>
                        </div>
                        <form onSubmit={handleEditStudent} className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">PRN</label>
                                    <input type="text" disabled value={formData.prn}
                                        className="w-full px-3 py-2 border rounded-lg bg-gray-100" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Roll No</label>
                                    <input type="text" value={formData.rollNo}
                                        onChange={(e) => setFormData(prev => ({ ...prev, rollNo: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Name *</label>
                                    <input type="text" required value={formData.name}
                                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Year</label>
                                    <input type="text" value={formData.year}
                                        onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Division</label>
                                    <input type="text" value={formData.division}
                                        onChange={(e) => setFormData(prev => ({ ...prev, division: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Email</label>
                                    <input type="email" value={formData.email}
                                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Phone</label>
                                    <input type="text" value={formData.phone}
                                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-3 py-2 border rounded-lg" />
                                </div>
                            </div>
                            <button type="submit" className="w-full py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                                Update Student
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full"><FiAlertTriangle className="text-red-600 text-xl" /></div>
                            <h3 className="text-lg font-semibold">Delete Student</h3>
                        </div>
                        <p className="text-gray-600 mb-6">Are you sure you want to delete <b>{selectedStudent?.name}</b> ({selectedStudent?.prn})? This action cannot be undone.</p>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDeleteStudent}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Delete</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Delete Modal */}
            {showBulkDeleteModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-red-100 rounded-full"><FiAlertTriangle className="text-red-600 text-xl" /></div>
                            <h3 className="text-lg font-semibold">Delete Class Data</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Select the Year and Division(s) to delete. <br />
                            <span className="text-red-600 font-semibold">Warning: This action cannot be undone.</span>
                        </p>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Year</label>
                                <select
                                    value={bulkDeleteYear}
                                    onChange={(e) => setBulkDeleteYear(e.target.value)}
                                    className="w-full px-3 py-2 border rounded-lg"
                                >
                                    <option value="">-- Select Year --</option>
                                    {filterOptions.years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Division(s)</label>
                                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-2">
                                    {filterOptions.divisions.map(d => (
                                        <label key={d} className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                                            <input
                                                type="checkbox"
                                                checked={bulkDeleteDivisions.includes(d)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setBulkDeleteDivisions([...bulkDeleteDivisions, d]);
                                                    } else {
                                                        setBulkDeleteDivisions(bulkDeleteDivisions.filter(div => div !== d));
                                                    }
                                                }}
                                                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
                                            />
                                            <span className="text-sm text-gray-700">Division {d}</span>
                                        </label>
                                    ))}
                                </div>
                                {bulkDeleteDivisions.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Selected: {bulkDeleteDivisions.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => { setShowBulkDeleteModal(false); setBulkDeleteYear(''); setBulkDeleteDivisions([]); }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                            <button onClick={handleBulkDelete} disabled={!bulkDeleteYear || bulkDeleteDivisions.length === 0}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                                Delete Class
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Password Verification Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-amber-100 rounded-full">
                                <FiLock className="text-amber-600 text-xl" />
                            </div>
                            <h3 className="text-lg font-semibold">Password Required</h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                            {pendingDeleteAction === 'single'
                                ? `Enter your password to delete student: ${selectedStudent?.name}`
                                : `Enter your password to delete all students from ${bulkDeleteYear} Division(s) ${bulkDeleteDivisions.join(', ')}`
                            }
                        </p>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <input
                                type="password"
                                value={deletePassword}
                                onChange={(e) => setDeletePassword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handlePasswordVerify()}
                                placeholder="Enter your password"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                autoFocus
                            />
                            {passwordError && (
                                <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowPasswordModal(false); setDeletePassword(''); setPasswordError(''); setPendingDeleteAction(null); }}
                                className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                disabled={passwordVerifying}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handlePasswordVerify}
                                disabled={passwordVerifying || !deletePassword.trim()}
                                className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {passwordVerifying ? 'Verifying...' : 'Confirm Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentManagement;
