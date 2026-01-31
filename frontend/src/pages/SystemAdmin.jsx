import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import {
    FiUser,
    FiMail,
    FiLock,
    FiSave,
    FiAlertCircle,
    FiCheck,
    FiEye,
    FiEyeOff,
    FiArrowLeft,
    FiSettings
} from 'react-icons/fi';

const SystemAdmin = () => {
    const { admin, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    // Profile state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // UI state
    const [isProfileLoading, setIsProfileLoading] = useState(false);
    const [isPasswordLoading, setIsPasswordLoading] = useState(false);
    const [profileError, setProfileError] = useState('');
    const [profileSuccess, setProfileSuccess] = useState('');
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    useEffect(() => {
        if (!isAuthenticated()) {
            navigate('/login', { replace: true });
            return;
        }

        // Load admin data
        if (admin) {
            setName(admin.name || '');
            setEmail(admin.email || '');
        }
    }, [admin, isAuthenticated, navigate]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setProfileError('');
        setProfileSuccess('');

        if (!name.trim()) {
            setProfileError('Please enter a name');
            return;
        }

        setIsProfileLoading(true);

        try {
            await authAPI.updateProfile({ name: name.trim() });
            setProfileSuccess('Profile updated successfully');
        } catch (err) {
            setProfileError(err.response?.data?.message || 'Failed to update profile');
        } finally {
            setIsProfileLoading(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (!currentPassword) {
            setPasswordError('Please enter your current password');
            return;
        }

        if (!newPassword) {
            setPasswordError('Please enter a new password');
            return;
        }

        if (newPassword.length < 6) {
            setPasswordError('New password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('Passwords do not match');
            return;
        }

        setIsPasswordLoading(true);

        try {
            const response = await authAPI.changePassword({
                currentPassword,
                newPassword
            });

            // Update token if returned
            if (response.data.data?.token) {
                localStorage.setItem('adminToken', response.data.data.token);
            }

            setPasswordSuccess('Password changed successfully');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to change password');
        } finally {
            setIsPasswordLoading(false);
        }
    };

    return (
        <div className="animate-fadeIn">
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center space-x-3">
                        <FiSettings className="w-8 h-8 text-primary-600" />
                        <span>System Admin</span>
                    </h1>
                    <p className="text-gray-600 mt-1">Manage your account settings</p>
                </div>
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-800 
                           bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                    <FiArrowLeft className="w-4 h-4" />
                    <span>Back to Dashboard</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Profile Settings */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                        <FiUser className="w-5 h-5 text-primary-600" />
                        <span>Profile Settings</span>
                    </h2>

                    {profileError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{profileError}</p>
                        </div>
                    )}

                    {profileSuccess && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
                            <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-green-700">{profileSuccess}</p>
                        </div>
                    )}

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                        {/* Email (Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Email Address
                            </label>
                            <div className="relative">
                                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={email}
                                    disabled
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg 
                                           bg-gray-50 text-gray-500 cursor-not-allowed"
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Email is configured in system settings</p>
                        </div>

                        {/* Name */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Display Name
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    id="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Enter your name"
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                                           text-gray-800 placeholder-gray-400"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isProfileLoading}
                            className="w-full flex items-center justify-center space-x-2 py-3 px-4 
                                   bg-primary-600 text-white font-medium rounded-lg 
                                   hover:bg-primary-700 focus:outline-none focus:ring-2 
                                   focus:ring-offset-2 focus:ring-primary-500 
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isProfileLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Saving...</span>
                                </>
                            ) : (
                                <>
                                    <FiSave className="w-5 h-5" />
                                    <span>Save Profile</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Change Password */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center space-x-2">
                        <FiLock className="w-5 h-5 text-primary-600" />
                        <span>Change Password</span>
                    </h2>

                    {passwordError && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                            <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                            <p className="text-sm text-red-700">{passwordError}</p>
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
                            <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                            <p className="text-sm text-green-700">{passwordSuccess}</p>
                        </div>
                    )}

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        {/* Current Password */}
                        <div>
                            <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Current Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    id="currentPassword"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                                           text-gray-800 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showCurrentPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* New Password */}
                        <div>
                            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                New Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    id="newPassword"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 6 characters"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                                           text-gray-800 placeholder-gray-400"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showNewPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Confirm New Password
                            </label>
                            <div className="relative">
                                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    id="confirmNewPassword"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 
                                           text-gray-800 placeholder-gray-400"
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
                            disabled={isPasswordLoading}
                            className="w-full flex items-center justify-center space-x-2 py-3 px-4 
                                   bg-primary-600 text-white font-medium rounded-lg 
                                   hover:bg-primary-700 focus:outline-none focus:ring-2 
                                   focus:ring-offset-2 focus:ring-primary-500 
                                   disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {isPasswordLoading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Changing...</span>
                                </>
                            ) : (
                                <>
                                    <FiLock className="w-5 h-5" />
                                    <span>Change Password</span>
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default SystemAdmin;
