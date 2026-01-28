// API Configuration (Global namespace)
const API_CONFIG = {
    BASE_URL: 'http://localhost:5000',
    BASE_PATH: '/api/v1',
    TIMEOUT: 10000, // 10 seconds
    USE_MOCK_DATA: true, // Set to false when backend is ready
};

// API Endpoints
const ENDPOINTS = {
    HEALTH: '/health',
    HEALTH_DB: '/health/db',
    CLIENTS: '/clients',
    PROVIDERS: '/providers',
    SERVICES: '/services',
    USAGES: '/usages',
    BUDGETS: '/budgets',
    INVOICES: '/invoices',
};

// Build full URL for an endpoint
function getApiUrl(endpoint, params = {}) {
    const url = new URL(API_CONFIG.BASE_URL + API_CONFIG.BASE_PATH + endpoint);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
            url.searchParams.append(key, params[key]);
        }
    });
    
    return url.toString();
}

// Provider IDs (from backend)
const PROVIDER_IDS = {
    AWS: 1,
    AZURE: 2,
};

// Provider names
const PROVIDER_NAMES = {
    1: 'AWS',
    2: 'Azure',
};

// Chart colors
const CHART_COLORS = {
    AWS: '#ff9900',
    AZURE: '#0078d4',
    PRIMARY: '#2563eb',
    SUCCESS: '#10b981',
    WARNING: '#f59e0b',
    DANGER: '#ef4444',
};

// Date range options (in days)
const DATE_RANGES = {
    LAST_7_DAYS: 7,
    LAST_30_DAYS: 30,
    LAST_60_DAYS: 60,
    LAST_90_DAYS: 90,
};

// Default query limit for API calls
const DEFAULT_LIMIT = 100;

// Waste detection thresholds
const WASTE_THRESHOLDS = {
    LOW_UTILIZATION: 0.20, // 20% utilization considered waste
    MEDIUM_UTILIZATION: 0.50, // 50% utilization considered medium waste
};

// Export formats
const EXPORT_FORMATS = {
    CSV: 'csv',
    PDF: 'pdf',
};