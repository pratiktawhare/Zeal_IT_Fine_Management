import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI, backupAPI } from '../services/api';
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
    FiSettings,
    FiTrash2,
    FiAlertTriangle,
    FiDatabase,
    FiX,
    FiUploadCloud,
    FiFolder,
    FiCalendar,
    FiExternalLink,
    FiFileText,
    FiFile,
    FiDownload,
    FiArrowRight
} from 'react-icons/fi';

const SystemAdmin = () => {
    const { admin, isAuthenticated, updateAdmin } = useAuth();
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

    // Database reset state
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetStep, setResetStep] = useState(0);
    // Step 0: Warning/Download Recommendation
    // Step 1: Academic Year Input
    // Step 2: Warning
    // Step 3: Password Verification
    // Step 4: Confirmation Phrase
    // Step 5: Success
    const [resetPassword, setResetPassword] = useState('');
    const [confirmationPhrase, setConfirmationPhrase] = useState('');
    const [isResetting, setIsResetting] = useState(false);
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(null);
    const [showResetPassword, setShowResetPassword] = useState(false);

    // Backup state (Local only now)


    // Download state
    const [showDownloadModal, setShowDownloadModal] = useState(false);
    const [downloadTitle, setDownloadTitle] = useState('');
    const [downloadYear, setDownloadYear] = useState('');
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState('');
    const [downloadSuccess, setDownloadSuccess] = useState('');

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
            const response = await authAPI.updateProfile({ name: name.trim() });
            // Update the admin context with the new name
            updateAdmin({ name: response.data.data.name });
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

    // Database reset handlers
    const openResetModal = () => {
        // Start with Step 0: Pre-check
        setShowResetModal(true);
        setResetStep(0); // 0 = Warning/Download Recommendation
        setResetPassword('');
        setConfirmationPhrase('');
        setResetError('');
        setResetSuccess(null);
        setShowResetPassword(false);
    };

    const closeResetModal = () => {
        if (isResetting) return; // Don't close during operations
        setShowResetModal(false);
        setResetStep(0);
        setResetPassword('');
        setConfirmationPhrase('');
        setResetError('');
        setShowResetPassword(false);
    };

    const handleDatabaseReset = async () => {
        // Step 0: Pre-reset check -> Go to Password (Step 1)
        if (resetStep === 0) {
            setResetStep(1);
            return;
        }

        // Step 1: Password verification
        if (resetStep === 1) {
            if (!resetPassword) {
                setResetError('Please enter your password');
                return;
            }

            setIsResetting(true);
            setResetError('');

            try {
                await authAPI.verifyPassword(resetPassword);
                setResetStep(2);
            } catch (err) {
                setResetError(err.response?.data?.message || 'Password verification failed');
            } finally {
                setIsResetting(false);
            }
            return;
        }

        // Step 2: Confirmation phrase + execute
        if (resetStep === 2) {
            if (confirmationPhrase !== 'DELETE EVERYTHING') {
                setResetError('Please type "DELETE EVERYTHING" exactly as shown');
                return;
            }

            setResetError('');
            setIsResetting(true);

            try {
                const response = await authAPI.resetDatabase({
                    password: resetPassword,
                    confirmationPhrase: confirmationPhrase,
                });

                setResetSuccess(response.data.data);
                setResetStep(3);
            } catch (err) {
                setResetError(err.response?.data?.message || 'Failed to reset database');
            } finally {
                setIsResetting(false);
            }
        }
    };



    // Download handlers
    const openDownloadModal = () => {
        setShowDownloadModal(true);
        setDownloadTitle('');
        setDownloadYear('');
        setDownloadError('');
        setDownloadSuccess('');
    };

    const closeDownloadModal = () => {
        if (isDownloading) return;
        setShowDownloadModal(false);
        setDownloadTitle('');
        setDownloadYear('');
        setDownloadError('');
    };

    const handleDownload = async (e) => {
        e.preventDefault();
        setDownloadError('');
        setDownloadSuccess('');

        if (!downloadTitle.trim()) {
            setDownloadError('Please enter a title');
            return;
        }
        if (!downloadYear.trim()) {
            setDownloadError('Please enter the academic year');
            return;
        }

        setIsDownloading(true);

        try {
            const response = await backupAPI.downloadLocalBackup({
                title: downloadTitle.trim(),
                academicYear: downloadYear.trim()
            });

            // Create blob link to download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;

            // Clean filename
            const filename = `${downloadTitle.replace(/[^a-z0-9]/gi, '_')}_${downloadYear.replace(/[^a-z0-9]/gi, '_')}.zip`;
            link.setAttribute('download', filename);

            document.body.appendChild(link);
            link.click();
            link.remove();

            setDownloadSuccess('Download started successfully!');
            setTimeout(() => {
                closeDownloadModal();
            }, 2000);
        } catch (err) {
            console.error(err);
            setDownloadError('Failed to download backup. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    // Navigate from Reset to Download
    const navigateToDownload = () => {
        closeResetModal();
        openDownloadModal();
    };

    // Get step header info
    const getStepHeader = () => {
        switch (resetStep) {
            case 0: return { icon: <FiDownload className="w-5 h-5" />, title: 'Backup Recommendation', color: 'bg-indigo-600' };
            case 1: return { icon: <FiLock className="w-5 h-5" />, title: 'Verify Your Identity', color: 'bg-red-600' };
            case 2: return { icon: <FiAlertTriangle className="w-5 h-5" />, title: 'Final Confirmation', color: 'bg-red-700' };
            case 3: return { icon: <FiCheck className="w-5 h-5" />, title: 'Operation Complete', color: 'bg-green-600' };
            default: return { icon: <FiDatabase className="w-5 h-5" />, title: 'Reset Database', color: 'bg-red-600' };
        }
    };

    const stepHeader = getStepHeader();

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

            {/* Data Export Section */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center space-x-2">
                    <FiDatabase className="w-5 h-5 text-indigo-600" />
                    <span>Data Management</span>
                </h2>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-medium text-indigo-800 flex items-center space-x-2">
                                <FiDownload className="w-4 h-4" />
                                <span>Bulk Download Data</span>
                            </h3>
                            <p className="text-sm text-indigo-600 mt-1">
                                Download a complete zip archive containing PDF and Excel files for all
                                student records, transactions, and ledgers. Organized by folders.
                            </p>
                        </div>
                        <button
                            onClick={openDownloadModal}
                            className="ml-4 flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white 
                                   font-medium rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 
                                   focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                        >
                            <FiDownload className="w-4 h-4" />
                            <span>Download Bulk</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border-2 border-red-200 p-6">
                <h2 className="text-lg font-semibold text-red-700 mb-4 flex items-center space-x-2">
                    <FiAlertTriangle className="w-5 h-5" />
                    <span>Danger Zone</span>
                </h2>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h3 className="font-medium text-red-800 flex items-center space-x-2">
                                <FiDatabase className="w-4 h-4" />
                                <span>Reset Database for New Year</span>
                            </h3>
                            <p className="text-sm text-red-600 mt-1">
                                This will permanently delete <strong>all students, transactions, expenditures,
                                    fee ledger entries, and payment categories</strong>. Please ensure you have
                                downloaded a local backup before proceeding.
                            </p>
                        </div>
                        <button
                            onClick={openResetModal}
                            className="ml-4 flex items-center space-x-2 px-4 py-2 bg-red-600 text-white 
                                   font-medium rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 
                                   focus:ring-offset-2 focus:ring-red-500 transition-all"
                        >
                            <FiTrash2 className="w-4 h-4" />
                            <span>Reset Database</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Reset Database Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-fadeIn">
                        {/* Modal Header */}
                        <div className={`px-6 py-4 flex items-center justify-between ${stepHeader.color}`}>
                            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                {stepHeader.icon}
                                <span>{stepHeader.title}</span>
                            </h3>
                            <div className="flex items-center space-x-3">
                                {/* Step indicator */}
                                {resetStep > 0 && (
                                    <div className="flex items-center space-x-1">
                                        {[1, 2, 3].map((s) => (
                                            <div
                                                key={s}
                                                className={`w-2 h-2 rounded-full transition-all ${resetStep >= s ? 'bg-white' : 'bg-white/30'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                )}
                                <button
                                    onClick={closeResetModal}
                                    disabled={isResetting}
                                    className="text-white/80 hover:text-white transition-colors disabled:opacity-50"
                                >
                                    <FiX className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="p-6">
                            {resetError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{resetError}</p>
                                </div>
                            )}

                            {/* Step 0: Pre-check */}
                            {resetStep === 0 && (
                                <div className="space-y-6">
                                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-5">
                                        <div className="flex items-start space-x-3">
                                            <div className="bg-indigo-100 p-2 rounded-full">
                                                <FiDownload className="w-6 h-6 text-indigo-600" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-indigo-900 text-lg">Download Bulk Data?</h4>
                                                <p className="text-indigo-700 mt-1">
                                                    Before you reset the database, we strongly recommend downloading a
                                                    local copy of all data (Transactions, Ledgers, Students).
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col space-y-3">
                                        <button
                                            onClick={navigateToDownload}
                                            className="w-full flex items-center justify-center space-x-2 py-4 px-4 
                                                   bg-indigo-600 text-white font-bold rounded-xl
                                                   hover:bg-indigo-700 focus:outline-none focus:ring-2 
                                                   focus:ring-offset-2 focus:ring-indigo-500 transition-all shadow-lg shadow-indigo-200"
                                        >
                                            <FiDownload className="w-5 h-5" />
                                            <span>Yes, Download Bulk Data First</span>
                                        </button>

                                        <button
                                            onClick={() => setResetStep(1)}
                                            className="w-full py-3 px-4 text-gray-500 font-medium rounded-lg 
                                                   hover:text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            No, I have already downloaded it
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 1: Password Verification (Was Step 3) */}
                            {resetStep === 1 && (
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        Enter your admin password to continue:
                                    </p>
                                    <div className="relative">
                                        <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input
                                            type={showResetPassword ? "text" : "password"}
                                            value={resetPassword}
                                            onChange={(e) => setResetPassword(e.target.value)}
                                            placeholder="Enter your password"
                                            className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg 
                                                   focus:ring-2 focus:ring-red-500 focus:border-red-500 
                                                   text-gray-800 placeholder-gray-400"
                                            autoFocus
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowResetPassword(!showResetPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showResetPassword ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Step 2: Confirmation Phrase (Was Step 4) */}
                            {resetStep === 2 && (
                                <div className="space-y-4">
                                    <p className="text-gray-600">
                                        To confirm, type <span className="font-mono font-bold text-red-600 bg-red-50 px-2 py-1 rounded">DELETE EVERYTHING</span> below:
                                    </p>
                                    <input
                                        type="text"
                                        value={confirmationPhrase}
                                        onChange={(e) => setConfirmationPhrase(e.target.value)}
                                        placeholder="Type confirmation phrase"
                                        className={`w-full px-4 py-3 border rounded-lg text-gray-800 placeholder-gray-400
                                               focus:ring-2 focus:border-transparent transition-all ${confirmationPhrase === 'DELETE EVERYTHING'
                                                ? 'border-green-500 focus:ring-green-500'
                                                : 'border-gray-300 focus:ring-red-500'
                                            }`}
                                        autoFocus
                                    />
                                    {confirmationPhrase && confirmationPhrase !== 'DELETE EVERYTHING' && (
                                        <p className="text-xs text-red-500">
                                            Type exactly as shown: DELETE EVERYTHING
                                        </p>
                                    )}
                                    {resetStep === 2 && (
                                        <button
                                            onClick={handleDatabaseReset}
                                            disabled={confirmationPhrase !== 'DELETE EVERYTHING' || isResetting}
                                            className="w-full flex items-center justify-center space-x-2 py-3 px-4 
                                                   bg-red-600 text-white font-medium rounded-lg 
                                                   hover:bg-red-700 focus:outline-none focus:ring-2 
                                                   focus:ring-offset-2 focus:ring-red-500 
                                                   disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                                        >
                                            {isResetting ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Resetting...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <FiTrash2 className="w-5 h-5" />
                                                    <span>Permanently Reset Database</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Step 3: Success (Was Step 5) */}
                            {resetStep === 3 && (
                                <div className="text-center py-6 animate-fadeIn">
                                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FiCheck className="w-8 h-8 text-green-600" />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-800 mb-2">Database Reset Complete</h4>
                                    <p className="text-gray-600 mb-6">
                                        The system has been successfully reset.
                                        All previous data has been cleared.
                                    </p>
                                    <button
                                        onClick={closeResetModal}
                                        className="w-full py-3 px-4 bg-green-600 text-white font-medium rounded-lg 
                                               hover:bg-green-700 focus:outline-none focus:ring-2 
                                               focus:ring-offset-2 focus:ring-green-500 transition-all"
                                    >
                                        Close
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                            {resetStep === 3 ? (
                                <button
                                    onClick={() => {
                                        closeResetModal();
                                        navigate('/dashboard');
                                    }}
                                    className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg 
                                           hover:bg-primary-700 transition-colors"
                                >
                                    Go to Dashboard
                                </button>
                            ) : resetStep === 2 ? (
                                // No footer buttons for confirmation step, handled in content
                                null
                            ) : (
                                <>
                                    <button
                                        onClick={closeResetModal}
                                        disabled={isResetting}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-800 
                                               bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors
                                               disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    {resetStep !== 0 && (
                                        <button
                                            onClick={handleDatabaseReset}
                                            disabled={isResetting}
                                            className={`px-6 py-2 font-medium rounded-lg transition-all flex items-center space-x-2
                                                   disabled:opacity-50 disabled:cursor-not-allowed ${resetStep === 1
                                                    ? 'bg-red-600 text-white hover:bg-red-700'
                                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                                                }`}
                                        >
                                            {isResetting ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                    <span>Verifying...</span>
                                                </>
                                            ) : (
                                                <>
                                                    {resetStep === 1 && <span>Verify Password</span>}
                                                </>
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Bulk Download Modal */}
            {showDownloadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
                        <div className="px-6 py-4 bg-indigo-600 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
                                <FiDownload className="w-5 h-5" />
                                <span>Bulk Download</span>
                            </h3>
                            <button
                                onClick={closeDownloadModal}
                                disabled={isDownloading}
                                className="text-white/80 hover:text-white transition-colors"
                            >
                                <FiX className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6">
                            {downloadError && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
                                    <FiAlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                    <p className="text-sm text-red-700">{downloadError}</p>
                                </div>
                            )}

                            {downloadSuccess && (
                                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
                                    <FiCheck className="w-5 h-5 text-green-500 flex-shrink-0" />
                                    <p className="text-sm text-green-700">{downloadSuccess}</p>
                                </div>
                            )}

                            <form onSubmit={handleDownload} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        File Title <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={downloadTitle}
                                        onChange={(e) => setDownloadTitle(e.target.value)}
                                        placeholder="e.g., ITSA_Final_Backup"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Academic Year <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={downloadYear}
                                        onChange={(e) => setDownloadYear(e.target.value)}
                                        placeholder="e.g., 2025-26"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg 
                                               focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isDownloading}
                                    className="w-full flex items-center justify-center space-x-2 py-3 px-4 
                                           bg-indigo-600 text-white font-medium rounded-lg 
                                           hover:bg-indigo-700 focus:outline-none focus:ring-2 
                                           focus:ring-offset-2 focus:ring-indigo-500 
                                           disabled:opacity-50 disabled:cursor-not-allowed transition-all mt-4"
                                >
                                    {isDownloading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Generating Zip...</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiDownload className="w-5 h-5" />
                                            <span>Download Zip</span>
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemAdmin;
