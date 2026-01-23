import { useRef } from 'react';
import { FiX, FiDownload, FiPrinter, FiCheck, FiMail } from 'react-icons/fi';
import html2pdf from 'html2pdf.js';

const ReceiptModal = ({ isOpen, onClose, payment, student }) => {
    const receiptRef = useRef(null);

    if (!isOpen || !payment || !student) return null;

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

    // Generate HTML content for PDF
    const getPDFContent = () => {
        return `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; width: 100%; max-width: 400px; margin: 0 auto;">
                <!-- Header Banner -->
                <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 32px 24px; text-align: center; border-radius: 12px 12px 0 0;">
                    <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center;">
                        <span style="font-size: 28px; color: white; font-weight: bold;">₹</span>
                    </div>
                    <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">ITSA Accounts</h1>
                    <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.85); font-size: 13px;">Official Payment Receipt</p>
                    <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 10px 24px; border-radius: 25px; margin-top: 16px;">
                        <span style="color: white; font-size: 14px; font-weight: 600; letter-spacing: 0.5px;">${payment.receiptNumber || 'N/A'}</span>
                    </div>
                </div>
                
                <!-- Body -->
                <div style="background: #ffffff; border: 1px solid #e5e7eb; border-top: none;">
                    
                    <!-- Student Info -->
                    <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
                        <table width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td style="padding-bottom: 16px;">
                                    <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Student Name</p>
                                    <p style="margin: 6px 0 0 0; font-size: 16px; color: #1f2937; font-weight: 600;">${student.name}</p>
                                </td>
                            </tr>
                            <tr>
                                <td>
                                    <table width="100%" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td width="50%">
                                                <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">PRN Number</p>
                                                <p style="margin: 6px 0 0 0; font-size: 14px; color: #374151; font-weight: 500;">${student.prn}</p>
                                            </td>
                                            <td width="50%">
                                                <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Division</p>
                                                <p style="margin: 6px 0 0 0; font-size: 14px; color: #374151; font-weight: 500;">${student.division || student.department || 'N/A'}</p>
                                            </td>
                                        </tr>
                                    </table>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    <!-- Payment Details Grid -->
                    <div style="padding: 24px; border-bottom: 1px solid #f0f0f0;">
                        <table width="100%" cellspacing="0" cellpadding="0">
                            <tr>
                                <td width="50%" style="padding-bottom: 20px; vertical-align: top;">
                                    <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Payment Type</p>
                                    <div style="margin-top: 8px;">
                                        <span style="display: inline-block; padding: 6px 14px; border-radius: 20px; font-size: 12px; font-weight: 600; ${payment.type === 'fee' ? 'background: #dbeafe; color: #1d4ed8;' : 'background: #fee2e2; color: #dc2626;'}">
                                            ${payment.type === 'fee' ? '💰 Fee' : '⚠️ Fine'}
                                        </span>
                                    </div>
                                </td>
                                <td width="50%" style="padding-bottom: 20px; vertical-align: top;">
                                    <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Category</p>
                                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151; font-weight: 500;">${payment.category || 'Others'}</p>
                                </td>
                            </tr>
                            <tr>
                                <td width="50%" style="vertical-align: top;">
                                    <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Payment Date & Time</p>
                                    <p style="margin: 8px 0 0 0; font-size: 14px; color: #374151; font-weight: 500;">${formatDate(payment.createdAt || payment.date)}</p>
                                </td>
                                <td width="50%" style="vertical-align: top;">
                                    <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Status</p>
                                    <div style="margin-top: 8px;">
                                        <span style="display: inline-block; padding: 6px 14px; background: #dcfce7; color: #16a34a; border-radius: 20px; font-size: 12px; font-weight: 600;">
                                            ✓ Paid
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        </table>
                    </div>
                    
                    ${payment.reason ? `
                    <!-- Description -->
                    <div style="padding: 20px 24px; border-bottom: 1px solid #f0f0f0;">
                        <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Description</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px; color: #4b5563; line-height: 1.6;">${payment.reason}</p>
                    </div>
                    ` : ''}
                    
                    <!-- Amount Section -->
                    <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 32px 24px; text-align: center;">
                        <p style="margin: 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Amount Paid</p>
                        <p style="margin: 10px 0 0 0; font-size: 42px; color: #1e40af; font-weight: 700;">${formatCurrency(payment.amount)}</p>
                    </div>
                    
                </div>
                
                <!-- Footer -->
                <div style="background: #1f2937; padding: 20px 24px; text-align: center; border-radius: 0 0 12px 12px;">
                    <p style="margin: 0; color: rgba(255,255,255,0.7); font-size: 12px;">This is a computer generated receipt</p>
                    <p style="margin: 6px 0 0 0; color: rgba(255,255,255,0.5); font-size: 11px;">Thank you for your payment • ITSA Department</p>
                </div>
            </div>
        `;
    };

    const handleDownload = () => {
        const element = document.createElement('div');
        element.innerHTML = getPDFContent();
        element.style.padding = '20px';
        element.style.background = '#f3f4f6';
        document.body.appendChild(element);

        const opt = {
            margin: 10,
            filename: `Receipt-${payment.receiptNumber || 'payment'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        html2pdf().set(opt).from(element).save().then(() => {
            document.body.removeChild(element);
        });
    };

    const handlePrint = () => {
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${payment.receiptNumber || 'N/A'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f3f4f6; padding: 20px; }
                    @media print { 
                        body { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; } 
                    }
                </style>
            </head>
            <body>
                ${getPDFContent()}
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gray-100 rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-fadeIn">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-4 bg-white rounded-t-2xl border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-800">Payment Receipt</h2>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={handlePrint}
                            className="p-2 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Print Receipt"
                        >
                            <FiPrinter className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleDownload}
                            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Download PDF"
                        >
                            <FiDownload className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <FiX className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Receipt Preview */}
                <div className="p-4">
                    <div ref={receiptRef} className="bg-white rounded-2xl overflow-hidden shadow-lg">
                        {/* Header */}
                        <div className="bg-gradient-to-br from-primary-700 via-primary-600 to-blue-500 text-white p-7 text-center">
                            <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-full mb-3">
                                <span className="text-2xl font-bold">₹</span>
                            </div>
                            <h1 className="text-xl font-bold">ITSA Accounts</h1>
                            <p className="text-white/80 text-sm mt-1">Official Payment Receipt</p>
                            <div className="inline-block bg-white/20 backdrop-blur px-5 py-2.5 rounded-full mt-4">
                                <span className="text-sm font-semibold tracking-wide">
                                    {payment.receiptNumber || 'N/A'}
                                </span>
                            </div>
                        </div>

                        {/* Student Info */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Student Name</p>
                                    <p className="text-base font-semibold text-gray-800 mt-1">{student.name}</p>
                                </div>
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">PRN</p>
                                        <p className="text-sm font-medium text-gray-700 mt-1">{student.prn}</p>
                                    </div>
                                    {student.email && (
                                        <div className="flex-1">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Email</p>
                                            <p className="text-sm font-medium text-gray-700 mt-1 flex items-center">
                                                <FiMail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                                                <span className="truncate">{student.email}</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Payment Type</p>
                                    <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${payment.type === 'fee' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'
                                        }`}>
                                        {payment.type === 'fee' ? '💰 Fee' : '⚠️ Fine'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Category</p>
                                    <p className="text-sm font-medium text-gray-700 mt-2">{payment.category || 'Others'}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Payment Date & Time</p>
                                    <p className="text-sm font-medium text-gray-700 mt-2">{formatDate(payment.createdAt || payment.date)}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Status</p>
                                    <span className="inline-flex items-center mt-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                        <FiCheck className="w-3 h-3 mr-1" />
                                        Paid
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        {payment.reason && (
                            <div className="px-6 py-4 border-b border-gray-100">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Description</p>
                                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{payment.reason}</p>
                            </div>
                        )}

                        {/* Amount */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 text-center">
                            <p className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Amount Paid</p>
                            <p className="text-4xl font-bold text-primary-700 mt-2">{formatCurrency(payment.amount)}</p>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-800 p-5 text-center">
                            <p className="text-gray-400 text-xs">This is a computer generated receipt</p>
                            <p className="text-gray-500 text-[10px] mt-1">Thank you for your payment • ITSA Department</p>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-white rounded-b-2xl border-t border-gray-200 flex justify-between items-center">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition-colors"
                    >
                        Close
                    </button>
                    <div className="flex space-x-2">
                        <button
                            onClick={handlePrint}
                            className="flex items-center space-x-2 px-4 py-2.5 border border-gray-300 text-gray-700 
                             rounded-xl hover:bg-gray-50 transition-all"
                        >
                            <FiPrinter className="w-4 h-4" />
                            <span className="font-medium">Print</span>
                        </button>
                        <button
                            onClick={handleDownload}
                            className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-green-500 to-green-600 
                             text-white rounded-xl hover:from-green-400 hover:to-green-500 transition-all shadow-lg shadow-green-200"
                        >
                            <FiDownload className="w-4 h-4" />
                            <span className="font-medium">Download PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ReceiptModal;
