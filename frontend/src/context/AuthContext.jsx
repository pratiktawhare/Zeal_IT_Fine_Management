import { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [setupRequired, setSetupRequired] = useState(false);
    const [adminEmail, setAdminEmail] = useState('');

    // Check setup status and existing token on mount
    useEffect(() => {
        checkInitialState();
    }, []);

    // Check if setup is needed and validate existing token
    const checkInitialState = async () => {
        try {
            // First check setup status
            const setupResponse = await authAPI.checkSetupStatus();
            const { setupRequired: needsSetup, adminEmail: email } = setupResponse.data.data;

            setSetupRequired(needsSetup);
            setAdminEmail(email || '');

            // If setup is not required, validate existing token
            if (!needsSetup) {
                const token = localStorage.getItem('adminToken');
                if (token) {
                    await validateToken();
                }
            }
        } catch (err) {
            console.error('Failed to check setup status:', err);
        } finally {
            setLoading(false);
        }
    };

    // Check setup status (can be called manually)
    const checkSetupStatus = async () => {
        try {
            const response = await authAPI.checkSetupStatus();
            const { setupRequired: needsSetup, adminEmail: email } = response.data.data;
            setSetupRequired(needsSetup);
            setAdminEmail(email || '');
            return { setupRequired: needsSetup, adminEmail: email };
        } catch (err) {
            console.error('Failed to check setup status:', err);
            return { setupRequired: false, adminEmail: '' };
        }
    };

    // Validate existing token
    const validateToken = async () => {
        try {
            const response = await authAPI.getProfile();
            setAdmin(response.data.data);
        } catch (err) {
            localStorage.removeItem('adminToken');
            setAdmin(null);
        }
    };

    // Login function
    const login = async (email, password) => {
        try {
            setError(null);
            const response = await authAPI.login({ email, password });
            // API returns: { success, message, data: { id, email, name, lastLogin, token } }
            const { token, id, email: adminEmail, name, lastLogin } = response.data.data;

            localStorage.setItem('adminToken', token);
            setAdmin({ id, email: adminEmail, name, lastLogin });

            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Login failed. Please try again.';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Register first admin function
    const registerAdmin = async (password, name) => {
        try {
            setError(null);
            const response = await authAPI.register({ password, name });
            const { token, id, email, name: adminName } = response.data.data;

            localStorage.setItem('adminToken', token);
            setAdmin({ id, email, name: adminName });
            setSetupRequired(false);

            return { success: true };
        } catch (err) {
            const message = err.response?.data?.message || 'Registration failed. Please try again.';
            setError(message);
            return { success: false, error: message };
        }
    };

    // Logout function
    const logout = () => {
        localStorage.removeItem('adminToken');
        setAdmin(null);
    };

    // Check if user is authenticated
    const isAuthenticated = () => {
        return !!admin && !!localStorage.getItem('adminToken');
    };

    const value = {
        admin,
        loading,
        error,
        setupRequired,
        adminEmail,
        login,
        logout,
        isAuthenticated,
        setError,
        checkSetupStatus,
        registerAdmin,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;

