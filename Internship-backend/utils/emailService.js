/**
 * ===========================================
 * Email Utility
 * ===========================================
 * Handles sending emails using nodemailer
 */

const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });
};

/**
 * Generate HTML email template for payment receipt
 */
const generateReceiptEmailHTML = (student, payment) => {
    const formatDate = (date) => {
        return new Date(date).toLocaleString('en-IN', {
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

    const typeColor = payment.type === 'fee' ? '#1d4ed8' : '#dc2626';
    const typeBgColor = payment.type === 'fee' ? '#dbeafe' : '#fee2e2';
    const typeLabel = payment.type === 'fee' ? '💰 Fee' : '⚠️ Fine';

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt - ${payment.receiptNumber}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; -webkit-font-smoothing: antialiased;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
            <tr>
                <td style="padding: 40px 20px;">
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 480px; margin: 0 auto;">
                        
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 36px 32px; border-radius: 16px 16px 0 0; text-align: center;">
                                <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 16px; line-height: 56px;">
                                    <span style="font-size: 28px; color: white; font-weight: bold;">₹</span>
                                </div>
                                <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">ITSA Accounts</h1>
                                <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Official Payment Receipt</p>
                                <div style="display: inline-block; background: rgba(255,255,255,0.2); padding: 12px 28px; border-radius: 30px; margin-top: 20px;">
                                    <span style="color: white; font-size: 15px; font-weight: 600; letter-spacing: 0.5px;">${payment.receiptNumber || 'N/A'}</span>
                                </div>
                            </td>
                        </tr>
                        
                        <!-- Body -->
                        <tr>
                            <td style="background-color: #ffffff; border-left: 1px solid #e5e7eb; border-right: 1px solid #e5e7eb;">
                                
                                <!-- Student Info Section -->
                                <div style="padding: 28px 32px; border-bottom: 1px solid #f0f0f0;">
                                    <table width="100%" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td style="padding-bottom: 20px;">
                                                <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">Student Name</p>
                                                <p style="margin: 8px 0 0 0; font-size: 18px; color: #1f2937; font-weight: 600;">${student.name}</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td>
                                                <table width="100%" cellspacing="0" cellpadding="0">
                                                    <tr>
                                                        <td width="50%" style="vertical-align: top;">
                                                            <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">PRN Number</p>
                                                            <p style="margin: 8px 0 0 0; font-size: 15px; color: #374151; font-weight: 500;">${student.prn}</p>
                                                        </td>
                                                        <td width="50%" style="vertical-align: top;">
                                                            <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">Division</p>
                                                            <p style="margin: 8px 0 0 0; font-size: 15px; color: #374151; font-weight: 500;">${student.division || student.department || 'N/A'}</p>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <!-- Payment Details Section -->
                                <div style="padding: 28px 32px; border-bottom: 1px solid #f0f0f0;">
                                    <table width="100%" cellspacing="0" cellpadding="0">
                                        <tr>
                                            <td width="50%" style="padding-bottom: 24px; vertical-align: top;">
                                                <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">Payment Type</p>
                                                <div style="margin-top: 10px;">
                                                    <span style="display: inline-block; padding: 8px 18px; background: ${typeBgColor}; color: ${typeColor}; border-radius: 25px; font-size: 13px; font-weight: 600;">
                                                        ${typeLabel}
                                                    </span>
                                                </div>
                                            </td>
                                            <td width="50%" style="padding-bottom: 24px; vertical-align: top;">
                                                <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">Category</p>
                                                <p style="margin: 10px 0 0 0; font-size: 15px; color: #374151; font-weight: 500;">${payment.category || 'Others'}</p>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td width="50%" style="vertical-align: top;">
                                                <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">Payment Date & Time</p>
                                                <p style="margin: 10px 0 0 0; font-size: 15px; color: #374151; font-weight: 500;">${formatDate(payment.createdAt || payment.date)}</p>
                                            </td>
                                            <td width="50%" style="vertical-align: top;">
                                                <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">Status</p>
                                                <div style="margin-top: 10px;">
                                                    <span style="display: inline-block; padding: 8px 18px; background: #dcfce7; color: #16a34a; border-radius: 25px; font-size: 13px; font-weight: 600;">
                                                        ✓ Paid
                                                    </span>
                                                </div>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                
                                ${payment.reason ? `
                                <!-- Description Section -->
                                <div style="padding: 24px 32px; border-bottom: 1px solid #f0f0f0;">
                                    <p style="margin: 0; font-size: 10px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.2px; font-weight: 600;">Description</p>
                                    <p style="margin: 10px 0 0 0; font-size: 14px; color: #4b5563; line-height: 1.7;">${payment.reason}</p>
                                </div>
                                ` : ''}
                                
                                <!-- Amount Section -->
                                <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 36px 32px; text-align: center;">
                                    <p style="margin: 0; font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 600;">Amount Paid</p>
                                    <p style="margin: 12px 0 0 0; font-size: 44px; color: #1e40af; font-weight: 700; letter-spacing: -1px;">${formatCurrency(payment.amount)}</p>
                                </div>
                                
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #1f2937; padding: 24px 32px; border-radius: 0 0 16px 16px; text-align: center;">
                                <p style="margin: 0; color: rgba(255,255,255,0.75); font-size: 13px;">This is a computer generated receipt</p>
                                <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.5); font-size: 12px;">Thank you for your payment</p>
                                <p style="margin: 16px 0 0 0; color: rgba(255,255,255,0.4); font-size: 11px;">ITSA Department</p>
                            </td>
                        </tr>
                        
                        <!-- Email Disclaimer -->
                        <tr>
                            <td style="padding: 24px 16px; text-align: center;">
                                <p style="margin: 0; font-size: 11px; color: #9ca3af; line-height: 1.6;">
                                    This is an automated email. Please do not reply to this message.<br>
                                    If you have any questions, please contact the college administration.
                                </p>
                            </td>
                        </tr>
                        
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;
};

/**
 * Send payment receipt email to student
 */
const sendPaymentReceiptEmail = async (student, payment) => {
    // Check if email configuration exists
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.log('Email configuration not found. Skipping email...');
        return { success: false, message: 'Email not configured' };
    }

    // Check if student has an email
    if (!student.email) {
        console.log('Student email not found. Skipping email...');
        return { success: false, message: 'Student email not found' };
    }

    try {
        const transporter = createTransporter();

        const formatCurrency = (amount) => {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: 'INR',
                maximumFractionDigits: 0,
            }).format(amount || 0);
        };

        const mailOptions = {
            from: `"ITSA Accounts" <${process.env.EMAIL_USER}>`,
            to: student.email,
            subject: `✅ Payment Receipt - ${payment.receiptNumber} | ${formatCurrency(payment.amount)}`,
            html: generateReceiptEmailHTML(student, payment)
        };

        const result = await transporter.sendMail(mailOptions);
        console.log(`✓ Payment receipt email sent to ${student.email}`);
        return { success: true, messageId: result.messageId };
    } catch (error) {
        console.error('Failed to send email:', error.message);
        return { success: false, message: error.message };
    }
};

module.exports = {
    sendPaymentReceiptEmail
};
