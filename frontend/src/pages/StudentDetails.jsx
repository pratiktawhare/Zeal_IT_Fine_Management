import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { studentsAPI } from '../services/api';
import Loading from '../components/Loading';
import ErrorMessage from '../components/ErrorMessage';
import ReceiptModal from '../components/ReceiptModal';
import {
    FiUser,
    FiMail,
    FiPhone,
    FiBook,
    FiArrowLeft,
    FiPlus,
    FiCheck,
    FiClock,
    FiCalendar,
    FiTrash2,
    FiFileText
} from 'react-icons/fi';
import { BiRupee } from 'react-icons/bi';

const StudentDetails = () => {
    const { prn } = useParams();
    const navigate = useNavigate();
    const [student, setStudent] = useState(null);
    const [fines, setFines] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [markingPaid, setMarkingPaid] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState(null);

    useEffect(() => {
        fetchStudentData();
    }, [prn]);

    const fetchStudentData = async () => {
        try {
            setLoading(true);
            setError('');

            const [studentRes, finesRes] = await Promise.all([
                studentsAPI.getByPRN(prn),
                studentsAPI.getFines(prn)
            ]);

            setStudent(studentRes.data.data);
            // API returns: { data: { student, fines, summary } }
            setFines(finesRes.data.data?.fines || []);
        } catch (err) {
            if (err.response?.status === 404) {
                setError('Student not found');
            } else {
                setError(err.response?.data?.message || 'Failed to load student details');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleMarkPaid = async (fineId) => {
        try {
            setMarkingPaid(fineId);
            await studentsAPI.markFinePaid(prn, fineId);
            // Refresh data
            await fetchStudentData();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to mark fine as paid');
        } finally {
            setMarkingPaid(null);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(amount || 0);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loading size="lg" text="Loading student details..." />
            </div>
        );
    }

    if (error && !student) {
        return (
            <div className="max-w-3xl mx-auto">
                <ErrorMessage message={error} />
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/search')}
                        className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 font-medium"
                    >
                        <FiArrowLeft className="w-5 h-5" />
                        <span>Back to Search</span>
                    </button>
                </div>
            </div>
        );
    }

    const totalFines = fines.reduce((sum, fine) => sum + (fine.amount || 0), 0);
    const paidFines = fines.filter(fine => fine.isPaid).reduce((sum, fine) => sum + (fine.amount || 0), 0);
    const pendingFines = totalFines - paidFines;

    return (
        <div className="animate-fadeIn max-w-4xl mx-auto">
            {/* Back Button */}
            <button
                onClick={() => navigate(-1)}
                className="inline-flex items-center space-x-2 text-gray-600 hover:text-gray-800 mb-6"
            >
                <FiArrowLeft className="w-5 h-5" />
                <span>Back</span>
            </button>

            {error && (
                <div className="mb-6">
                    <ErrorMessage message={error} onClose={() => setError('')} />
                </div>
            )}

            {/* Student Info Card */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-primary-700 to-primary-800 text-white p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                                <FiUser className="w-10 h-10" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">{student?.name}</h1>
                                <p className="text-white/80 mt-1">PRN: {student?.prn}</p>
                            </div>
                        </div>
                        <Link
                            to={`/add-payment/${prn}`}
                            state={{ source: 'details' }}
                            className="inline-flex items-center justify-center space-x-2 px-6 py-3 
                         bg-amber-500 text-white font-medium rounded-lg 
                         hover:bg-amber-400 transition-colors"
                        >
                            <FiPlus className="w-5 h-5" />
                            <span>Add Payment</span>
                        </Link>
                    </div>
                </div>

                <div className="p-6">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Academic Year</p>
                            <p className="text-sm font-medium text-gray-800">{student?.academicYear || 'N/A'}</p>
                        </div>

                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Year</p>
                            <p className="text-sm font-medium text-gray-800">{student?.year || 'N/A'}</p>
                        </div>

                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Semester</p>
                            <p className="text-sm font-medium text-gray-800">{student?.semester || 'N/A'}</p>
                        </div>

                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Division</p>
                            <p className="text-sm font-medium text-gray-800">{student?.division || 'N/A'}</p>
                        </div>

                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Roll No</p>
                            <p className="text-sm font-medium text-gray-800">{student?.rollNo || 'N/A'}</p>
                        </div>

                        <div className="flex flex-col p-3 bg-gray-50 rounded-lg">
                            <p className="text-xs text-gray-500 uppercase tracking-wide">Department</p>
                            <p className="text-sm font-medium text-gray-800">{'IT'}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Fine Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Total Fees</p>
                            <p className="text-2xl font-bold text-gray-800">{formatCurrency(totalFines)}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                            <BiRupee className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500">Paid</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(paidFines)}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                            <FiCheck className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>


            </div>

            {/* Fine History */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-800">Fine History</h2>
                </div>

                {fines.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BiRupee className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="text-gray-500">No fines recorded for this student</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Date
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Category
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Reason
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Amount
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                        Receipt
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {fines.map((fine) => (
                                    <tr key={fine._id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <FiCalendar className="w-4 h-4 text-gray-400" />
                                                <span className="text-sm text-gray-800">{formatDate(fine.createdAt || fine.date)}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${fine.type === 'fee'
                                                ? 'bg-blue-100 text-blue-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {fine.type === 'fee' ? 'Fee' : 'Fine'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm text-gray-600">{fine.category || 'Others'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-800">{fine.reason}</p>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-sm font-semibold text-gray-800">
                                                {formatCurrency(fine.amount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="badge badge-success">
                                                <FiCheck className="w-3 h-3 mr-1" />
                                                Paid
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => setSelectedPayment(fine)}
                                                className="inline-flex items-center space-x-1 px-3 py-1.5 text-primary-600 
                                                 hover:bg-primary-50 rounded-lg transition-colors text-sm font-medium"
                                            >
                                                <FiFileText className="w-4 h-4" />
                                                <span>View</span>
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Receipt Modal */}
            <ReceiptModal
                isOpen={!!selectedPayment}
                onClose={() => setSelectedPayment(null)}
                payment={selectedPayment}
                student={student}
            />
        </div >
    );
};

export default StudentDetails;
