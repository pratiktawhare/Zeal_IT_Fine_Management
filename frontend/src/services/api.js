import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired or invalid
            localStorage.removeItem('adminToken');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// ============================================
// Authentication API
// ============================================

export const authAPI = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (data) => api.post('/auth/register', data),
    getProfile: () => api.get('/auth/profile'),
    changePassword: (data) => api.put('/auth/change-password', data),
};

// ============================================
// Students API
// ============================================

export const studentsAPI = {
    uploadCSV: (formData) => api.post('/students/upload-csv', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    }),
    getAll: (params) => api.get('/students', { params }),
    searchByPRN: (prn) => api.get(`/students/search/${prn}`),
    getByPRN: (prn) => api.get(`/students/${prn}`),
    addFine: (prn, fineData) => api.post(`/students/add-fine/${prn}`, fineData),
    getFines: (prn) => api.get(`/students/${prn}/fines`),
    markFinePaid: (prn, fineId) => api.put(`/students/${prn}/fines/${fineId}/pay`),
    delete: (prn) => api.delete(`/students/${prn}`),
};

// ============================================
// Expenditure API
// ============================================

export const expenditureAPI = {
    add: (data) => api.post('/expenditure/add', data),
    getSummary: () => api.get('/expenditure/summary'),
    getAll: (params) => api.get('/expenditure', { params }),
    getById: (id) => api.get(`/expenditure/${id}`),
    update: (id, data) => api.put(`/expenditure/${id}`, data),
    delete: (id) => api.delete(`/expenditure/${id}`),
    getMonthlyReport: (year) => api.get('/expenditure/report/monthly', { params: { year } }),
    getReport: (params) => api.get('/expenditure/report', { params }),
};

// ============================================
// Category API
// ============================================

export const categoryAPI = {
    getAll: (params) => api.get('/categories', { params }),
    create: (data) => api.post('/categories', data),
    update: (id, data) => api.put(`/categories/${id}`, data),
    delete: (id) => api.delete(`/categories/${id}`),
};

// ============================================
// Reports API (New)
// ============================================

export const reportsAPI = {
    getStudentPayments: (params) => api.get('/reports/student-payments', { params }),
    getTransactions: (params) => api.get('/reports/transactions', { params }),
};

// ============================================
// Extended Students API (New functions)
// ============================================

export const studentManagementAPI = {
    getAll: (params) => api.get('/students/management', { params }),
    addStudent: (data) => api.post('/students/add', data),
    updateStudent: (prn, data) => api.put(`/students/update/${prn}`, data),
    deleteStudent: (prn) => api.delete(`/students/${prn}`),
    deleteByDivision: (division) => api.delete(`/students/division/${division}`),
    deleteByYear: (year) => api.delete(`/students/year/${year}`),
    deleteByClass: (year, division) => api.delete('/students/class', { data: { year, division } }),
};

export default api;


