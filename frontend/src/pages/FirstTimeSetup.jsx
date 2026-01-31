import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiLock, FiUser, FiShield, FiAlertCircle, FiEye, FiEyeOff, FiCheck } from 'react-icons/fi';

const FirstTimeSetup = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const { setupRequired, adminEmail, registerAdmin, loading } = useAuth();
    const navigate = useNavigate();

    // Redirect if setup is not required
    useEffect(() => {
        if (!loading && !setupRequired) {
            navigate('/login', { replace: true });
        }
    }, [loading, setupRequired, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!password) {
            setError('Please enter a password');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            const result = await registerAdmin(password, name || 'System Admin');
            if (result.success) {
                navigate('/dashboard', { replace: true });
            } else {
                setError(result.error);
            }
        } catch (err) {
            setError('An unexpected error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900">
                <div className="w-8 h-8 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-4 py-8">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md animate-fadeIn">
                {/* Welcome Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 text-center border border-white/20">
                    <div className="w-20 h-20 bg-gradient-to-br from-secondary-400 to-secondary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <FiShield className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Welcome to ITSA Accounts
                    </h1>
                    <p className="text-white/70 text-sm">
                        First-time setup - Create your admin account
                    </p>
                </div>

                {/* Setup Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    <div className="flex items-center justify-center space-x-2 mb-6">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                            <FiCheck className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-600">One-time setup</span>
                    </div>

                    {/* Admin Email Display */}
                    <div className="mb-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
                        <p className="text-xs text-primary-600 font-medium uppercase tracking-wide mb-1">Admin Email</p>
                        <p className="text-primary-800 font-semibold">{adminEmail || 'Loading...'}</p>
                        <p className="text-xs text-primary-500 mt-1">This email is configured in the system</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                            <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Admin Name <span className="text-gray-400">(optional)</span>
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="System Admin"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 
                                       focus:ring-primary-500 focus:border-primary-500 text-gray-800 
                                       placeholder-gray-400"
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    id="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 
                                       focus:ring-primary-500 focus:border-primary-500 text-gray-800 
                                       placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm Password <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter your password"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 
                                       focus:ring-primary-500 focus:border-primary-500 text-gray-800 
                                       placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showConfirmPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-2 py-3 px-4 
                                   bg-gradient-to-r from-primary-700 to-primary-800 text-white 
                                   font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 
                                   focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                        >
                            {isLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Creating Admin...</span>
                                </>
                            ) : (
                                <>
                                    <FiShield className="w-5 h-5" />
                                    <span>Create Admin Account</span>
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-6 text-center text-xs text-gray-500">
                        This setup can only be done once. After creating the admin account,
                        this page will be disabled.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default FirstTimeSetup;
