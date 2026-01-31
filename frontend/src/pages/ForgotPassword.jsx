import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import { FiMail, FiLock, FiAlertCircle, FiEye, FiEyeOff, FiArrowLeft, FiCheck, FiSend } from 'react-icons/fi';

const ForgotPassword = () => {
    const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Reset Password
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [maskedEmail, setMaskedEmail] = useState('');

    const navigate = useNavigate();

    // Step 1: Request OTP
    const handleRequestOtp = async () => {
        setError('');
        setIsLoading(true);

        try {
            const response = await authAPI.forgotPassword();
            setMaskedEmail(response.data.data.email);
            setSuccess('OTP sent to your registered email');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setError('');

        if (!otp || otp.length !== 6) {
            setError('Please enter a valid 6-digit OTP');
            return;
        }

        setIsLoading(true);

        try {
            await authAPI.verifyOtp(otp);
            setSuccess('OTP verified successfully');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Step 3: Reset Password
    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');

        if (!newPassword) {
            setError('Please enter a new password');
            return;
        }

        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsLoading(true);

        try {
            await authAPI.resetPassword(newPassword);
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login', { replace: true });
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderStepIndicator = () => (
        <div className="flex items-center justify-center mb-8">
            {[1, 2, 3].map((s, i) => (
                <div key={s} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all
                        ${step >= s
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 text-gray-500'
                        }`}
                    >
                        {step > s ? <FiCheck className="w-4 h-4" /> : s}
                    </div>
                    {i < 2 && (
                        <div className={`w-12 h-1 mx-1 rounded transition-all
                            ${step > s ? 'bg-primary-600' : 'bg-gray-200'}`}
                        />
                    )}
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 px-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/10 rounded-full blur-3xl"></div>
            </div>

            <div className="relative w-full max-w-md animate-fadeIn">
                {/* Header Card */}
                <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-6 text-center border border-white/20">
                    <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiLock className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">
                        Reset Password
                    </h1>
                    <p className="text-white/70 text-sm">
                        {step === 1 && 'Request a password reset OTP'}
                        {step === 2 && 'Enter the OTP sent to your email'}
                        {step === 3 && 'Create a new password'}
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-2xl shadow-2xl p-8">
                    {renderStepIndicator()}

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                            <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}

                    {success && step !== 3 && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                            <FiCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-green-700">{success}</p>
                        </div>
                    )}

                    {/* Step 1: Request OTP */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center space-x-2 mb-2">
                                    <FiMail className="w-5 h-5 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-800">OTP will be sent to:</span>
                                </div>
                                <p className="text-blue-700 font-semibold">System Admin Email</p>
                                <p className="text-xs text-blue-500 mt-1">Configured in the system settings</p>
                            </div>

                            <button
                                onClick={handleRequestOtp}
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
                                        <span>Sending OTP...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiSend className="w-5 h-5" />
                                        <span>Send OTP</span>
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp} className="space-y-6">
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                                <p className="text-sm text-blue-700">
                                    OTP sent to <strong>{maskedEmail}</strong>
                                </p>
                            </div>

                            <div>
                                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                                    Enter 6-digit OTP
                                </label>
                                <input
                                    type="text"
                                    id="otp"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    maxLength={6}
                                    className="w-full text-center text-2xl tracking-[0.5em] py-4 border border-gray-300 rounded-lg 
                                           focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-800 
                                           placeholder-gray-300 font-mono"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading || otp.length !== 6}
                                className="w-full flex items-center justify-center space-x-2 py-3 px-4 
                                       bg-gradient-to-r from-primary-700 to-primary-800 text-white 
                                       font-medium rounded-lg hover:from-primary-600 hover:to-primary-700 
                                       focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 
                                       disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span>Verifying...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiCheck className="w-5 h-5" />
                                        <span>Verify OTP</span>
                                    </>
                                )}
                            </button>

                            <button
                                type="button"
                                onClick={handleRequestOtp}
                                disabled={isLoading}
                                className="w-full text-sm text-primary-600 hover:text-primary-700"
                            >
                                Didn't receive OTP? Resend
                            </button>
                        </form>
                    )}

                    {/* Step 3: Reset Password */}
                    {step === 3 && (
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            {success && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
                                    <FiCheck className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                    <p className="text-sm text-green-700">{success}</p>
                                </div>
                            )}

                            <div>
                                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    New Password
                                </label>
                                <div className="relative">
                                    <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="newPassword"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
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

                            <div>
                                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                    Confirm New Password
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
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    <>
                                        <FiLock className="w-5 h-5" />
                                        <span>Reset Password</span>
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="mt-6 text-center">
                        <Link
                            to="/login"
                            className="inline-flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                        >
                            <FiArrowLeft className="w-4 h-4" />
                            <span>Back to Login</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
