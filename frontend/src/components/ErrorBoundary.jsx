import React from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can also log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
        window.location.reload();
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                    <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-gray-100 p-8 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FiAlertTriangle className="w-8 h-8 text-red-600" />
                        </div>

                        <h2 className="text-2xl font-bold text-gray-800 mb-2">Something went wrong</h2>

                        <p className="text-gray-600 mb-6">
                            We're sorry, but an unexpected error occurred. Please try refreshing the page.
                        </p>

                        {process.env.NODE_ENV === 'development' && this.state.error && (
                            <div className="mb-6 bg-gray-100 p-4 rounded-lg text-left overflow-auto max-h-48">
                                <p className="text-sm font-mono text-red-600 whitespace-pre-wrap">
                                    {this.state.error.toString()}
                                </p>
                            </div>
                        )}

                        <div className="flex space-x-3 justify-center">
                            <button
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg 
                                         hover:bg-gray-200 transition-colors"
                            >
                                Go Home
                            </button>

                            <button
                                onClick={this.handleReset}
                                className="px-6 py-2 bg-primary-600 text-white font-medium rounded-lg 
                                         hover:bg-primary-700 transition-colors flex items-center space-x-2"
                            >
                                <FiRefreshCw className="w-4 h-4" />
                                <span>Refresh Page</span>
                            </button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
