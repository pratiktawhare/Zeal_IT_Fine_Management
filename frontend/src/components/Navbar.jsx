import { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    FiHome,
    FiUpload,
    FiSearch,
    FiDollarSign,
    FiLogOut,
    FiMenu,
    FiX,
    FiUser,
    FiTag,
    FiFileText,
    FiChevronDown
} from 'react-icons/fi';
import { FaRupeeSign } from 'react-icons/fa';

const Navbar = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [showReports, setShowReports] = useState(false);
    const dropdownRef = useRef(null);
    const { admin, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: FiHome },
        { path: '/upload', label: 'Upload CSV', icon: FiUpload },
        { path: '/search', label: 'Search Student', icon: FiSearch },
        { path: '/expenditure', label: 'Add Expense', icon: FaRupeeSign },
        { path: '/categories', label: 'Categories', icon: FiTag },
    ];

    const reportLinks = [
        { path: '/admin/expenditures', label: 'Expenditure Report' },
        { path: '/admin/student-payments', label: 'Student Payments' },
        { path: '/admin/students', label: 'Student Management' },
        { path: '/admin/transactions', label: 'Transactions' },
    ];

    const isActive = (path) => location.pathname === path;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setShowReports(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <nav className="bg-gradient-to-r from-primary-700 to-primary-800 text-white shadow-lg sticky top-0 z-50">
            <div className="w-full px-2 sm:px-4 lg:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo */}
                    <Link to="/dashboard" className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center backdrop-blur-sm">
                            <span className="text-xl font-bold text-white">₹</span>
                        </div>
                        <span className="font-semibold text-lg hidden sm:block">
                            ITSA Accounts
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${isActive(link.path)
                                        ? 'bg-white/20 text-white'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    <span className="text-sm font-medium">{link.label}</span>
                                </Link>
                            );
                        })}

                        {/* Reports Dropdown */}
                        <div className="relative" ref={dropdownRef}>
                            <button
                                onClick={() => setShowReports(!showReports)}
                                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all duration-200 ${reportLinks.some(l => isActive(l.path)) || showReports
                                    ? 'bg-white/20 text-white'
                                    : 'text-white/80 hover:bg-white/10 hover:text-white'
                                    }`}
                            >
                                <FiFileText className="w-4 h-4" />
                                <span className="text-sm font-medium">Reports</span>
                                <FiChevronDown className={`w-3 h-3 transition-transform ${showReports ? 'rotate-180' : ''}`} />
                            </button>

                            {showReports && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden z-50 ring-1 ring-black ring-opacity-5">
                                    {reportLinks.map((link) => (
                                        <Link
                                            key={link.path}
                                            to={link.path}
                                            onClick={() => setShowReports(false)}
                                            className={`block px-4 py-3 text-sm transition-colors border-b border-gray-100 last:border-0 ${isActive(link.path)
                                                ? 'bg-primary-50 text-primary-700 font-bold'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            {link.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* User Menu */}
                    <div className="hidden md:flex items-center space-x-4">
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-white/10 rounded-lg">
                            <FiUser className="w-4 h-4" />
                            <span className="text-sm font-medium">{admin?.name || 'Admin'}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-500/80 hover:bg-red-500 
                         rounded-lg transition-colors duration-200"
                        >
                            <FiLogOut className="w-4 h-4" />
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                        {isOpen ? <FiX className="w-6 h-6" /> : <FiMenu className="w-6 h-6" />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden bg-primary-800/95 backdrop-blur-sm border-t border-white/10">
                    <div className="px-4 py-3 space-y-1">
                        {navLinks.map((link) => {
                            const Icon = link.icon;
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(link.path)
                                        ? 'bg-white/20 text-white'
                                        : 'text-white/80 hover:bg-white/10'
                                        }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            );
                        })}

                        {/* Report Links */}
                        <div className="pt-2 border-t border-white/10 mt-2">
                            <p className="px-4 py-2 text-xs text-white/50 uppercase font-semibold">Reports</p>
                            {reportLinks.map((link) => (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive(link.path)
                                        ? 'bg-white/20 text-white'
                                        : 'text-white/80 hover:bg-white/10'
                                        }`}
                                >
                                    <FiFileText className="w-5 h-5" />
                                    <span className="font-medium">{link.label}</span>
                                </Link>
                            ))}
                        </div>
                        <hr className="border-white/20 my-2" />
                        <div className="flex items-center justify-between px-4 py-3">
                            <div className="flex items-center space-x-2">
                                <FiUser className="w-5 h-5" />
                                <span className="font-medium">{admin?.name || 'Admin'}</span>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="flex items-center space-x-2 px-3 py-2 bg-red-500/80 hover:bg-red-500 
                           rounded-lg transition-colors"
                            >
                                <FiLogOut className="w-4 h-4" />
                                <span className="text-sm">Logout</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default Navbar;
