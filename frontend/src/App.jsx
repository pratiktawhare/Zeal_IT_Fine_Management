import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Components
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Loading from './components/Loading';

// Pages
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import UploadCSV from './pages/UploadCSV';
import SearchStudent from './pages/SearchStudent';
import StudentDetails from './pages/StudentDetails';
import AddPayment from './pages/AddPayment';
import AddExpenditure from './pages/AddExpenditure';
import ManageCategories from './pages/ManageCategories';
import About from './pages/About';

// New Report Pages
import StudentManagement from './pages/StudentManagement';
import TransactionReport from './pages/TransactionReport';
import StudentFeesLedger from './pages/StudentFeesLedger';

// Auth Pages
import FirstTimeSetup from './pages/FirstTimeSetup';
import ForgotPassword from './pages/ForgotPassword';
import SystemAdmin from './pages/SystemAdmin';

// Layout wrapper for authenticated pages
const AuthenticatedLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};

function App() {
    const { loading, setupRequired } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading size="lg" text="Loading..." />
            </div>
        );
    }

    return (
        <Routes>
            {/* First-Time Setup Route */}
            <Route
                path="/setup"
                element={
                    setupRequired ? <FirstTimeSetup /> : <Navigate to="/login" replace />
                }
            />

            {/* Forgot Password Route */}
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Public Route - Redirect to setup if needed */}
            <Route
                path="/login"
                element={
                    setupRequired ? <Navigate to="/setup" replace /> : <LoginPage />
                }
            />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <Dashboard />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/upload"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <UploadCSV />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/search"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <SearchStudent />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/student/:prn"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <StudentDetails />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/add-payment/:prn"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <AddPayment />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/expenditure"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <AddExpenditure />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/categories"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <ManageCategories />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/about"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <About />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            {/* Admin Routes */}
            <Route
                path="/admin/students"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <StudentManagement />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/transactions"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <TransactionReport />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/settings"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <SystemAdmin />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/fees-ledger"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <StudentFeesLedger />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            {/* Default redirect */}
            <Route
                path="/"
                element={
                    setupRequired ? <Navigate to="/setup" replace /> : <Navigate to="/dashboard" replace />
                }
            />

            {/* 404 - Redirect to dashboard or setup */}
            <Route
                path="*"
                element={
                    setupRequired ? <Navigate to="/setup" replace /> : <Navigate to="/dashboard" replace />
                }
            />
        </Routes>
    );
}

export default App;

