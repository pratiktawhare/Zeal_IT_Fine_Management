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

// New Report Pages
import ExpenditureReport from './pages/ExpenditureReport';
import StudentPayments from './pages/StudentPayments';
import StudentManagement from './pages/StudentManagement';
import TransactionReport from './pages/TransactionReport';

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
    const { loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <Loading size="lg" text="Loading..." />
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Route */}
            <Route path="/login" element={<LoginPage />} />

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

            {/* New Report Routes */}
            <Route
                path="/admin/expenditures"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <ExpenditureReport />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

            <Route
                path="/admin/student-payments"
                element={
                    <ProtectedRoute>
                        <AuthenticatedLayout>
                            <StudentPayments />
                        </AuthenticatedLayout>
                    </ProtectedRoute>
                }
            />

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

            {/* Default redirect */}
            <Route path="/" element={<Navigate to="/dashboard" replace />}
            />

            {/* 404 - Redirect to dashboard */}
            <Route path="*" element={<Navigate to="/dashboard" replace />}
            />
        </Routes>
    );
}

export default App;
