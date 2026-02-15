/**
 * File: api.js
 * Project: Cloud Cost Intelligence Platform
 * Author: Ishan (Frontend Lead)
 * Created: January 2026
 * Updated: February 2026 - Added response transformer for backend integration
 * Description: API client module. Handles all backend communication,
 *              includes mock data fallback for offline development.
 *              Now includes type coercion for numeric fields from backend.
 */

// API Layer with Mock Data Fallback (Global namespace)

// Mock data generator for development
const MOCK_DATA = {
    clients: [
        { client_id: 1, client_name: 'Acme Corporation', created_date: '2026-01-01T00:00:00' },
        { client_id: 2, client_name: 'TechStart Inc', created_date: '2026-01-02T00:00:00' },
        { client_id: 3, client_name: 'Global Enterprises', created_date: '2026-01-03T00:00:00' },
        { client_id: 4, client_name: 'DataFlow Systems', created_date: '2026-01-04T00:00:00' },
        { client_id: 5, client_name: 'CloudFirst LLC', created_date: '2026-01-05T00:00:00' },
    ],
    
    providers: [
        { provider_id: 1, provider_name: 'AWS' },
        { provider_id: 2, provider_name: 'Azure' },
    ],
    
    services: [
        { service_id: 1, service_name: 'EC2 Instance t3.medium', service_type: 'Compute', service_cost: 0.0416, provider_id: 1, service_unit: 'hours', created_date: '2026-01-01T00:00:00' },
        { service_id: 2, service_name: 'S3 Storage', service_type: 'Storage', service_cost: 0.023, provider_id: 1, service_unit: 'GB', created_date: '2026-01-01T00:00:00' },
        { service_id: 3, service_name: 'RDS MySQL db.t3.small', service_type: 'Database', service_cost: 0.034, provider_id: 1, service_unit: 'hours', created_date: '2026-01-01T00:00:00' },
        { service_id: 4, service_name: 'Lambda Functions', service_type: 'Compute', service_cost: 0.0000002, provider_id: 1, service_unit: 'requests', created_date: '2026-01-01T00:00:00' },
        { service_id: 5, service_name: 'CloudFront Distribution', service_type: 'Network', service_cost: 0.085, provider_id: 1, service_unit: 'GB', created_date: '2026-01-01T00:00:00' },
        { service_id: 6, service_name: 'Azure VM Standard_D2s_v3', service_type: 'Compute', service_cost: 0.096, provider_id: 2, service_unit: 'hours', created_date: '2026-01-01T00:00:00' },
        { service_id: 7, service_name: 'Blob Storage', service_type: 'Storage', service_cost: 0.018, provider_id: 2, service_unit: 'GB', created_date: '2026-01-01T00:00:00' },
        { service_id: 8, service_name: 'Azure SQL Database', service_type: 'Database', service_cost: 0.12, provider_id: 2, service_unit: 'hours', created_date: '2026-01-01T00:00:00' },
        { service_id: 9, service_name: 'Azure Functions', service_type: 'Compute', service_cost: 0.0000002, provider_id: 2, service_unit: 'requests', created_date: '2026-01-01T00:00:00' },
        { service_id: 10, service_name: 'Azure CDN', service_type: 'Network', service_cost: 0.081, provider_id: 2, service_unit: 'GB', created_date: '2026-01-01T00:00:00' },
    ],
    
    // Generate 30 days of mock usage data
    generateUsages(days = 30) {
        const usages = [];
        let usageId = 1;
        const today = new Date();
        
        for (let day = days - 1; day >= 0; day--) {
            const date = new Date(today);
            date.setDate(date.getDate() - day);
            const dateStr = date.toISOString().split('T')[0];
            
            // Generate 10-20 usage records per day
            const recordsPerDay = 10 + Math.floor(Math.random() * 10);
            
            for (let i = 0; i < recordsPerDay; i++) {
                const clientId = 1 + Math.floor(Math.random() * 5);
                const serviceId = 1 + Math.floor(Math.random() * 10);
                const service = this.services.find(s => s.service_id === serviceId);
                
                // Generate realistic usage based on service type
                let unitsUsed;
                if (service.service_type === 'Compute') {
                    unitsUsed = 1 + Math.random() * 100; // 1-100 hours/day
                } else if (service.service_type === 'Storage') {
                    unitsUsed = 100 + Math.random() * 1000; // 100-1100 GB
                } else if (service.service_type === 'Database') {
                    unitsUsed = 1 + Math.random() * 24; // 1-24 hours
                } else {
                    unitsUsed = 1000 + Math.random() * 10000; // requests/transfers
                }
                
                const totalCost = unitsUsed * service.service_cost;
                
                usages.push({
                    usage_id: usageId++,
                    client_id: clientId,
                    service_id: serviceId,
                    usage_date: dateStr,
                    usage_time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`,
                    units_used: parseFloat(unitsUsed.toFixed(2)),
                    total_cost: parseFloat(totalCost.toFixed(2)),
                    created_date: `${dateStr}T${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:00:00`,
                });
            }
        }
        
        return usages;
    },
    
    budgets: [
        { budget_id: 1, client_id: 1, budget_amount: 5000.00, monthly_limit: 6000.00, alert_threshold: 80, alert_enabled: true, created_date: '2026-01-01T00:00:00' },
        { budget_id: 2, client_id: 2, budget_amount: 3000.00, monthly_limit: 3500.00, alert_threshold: 85, alert_enabled: true, created_date: '2026-01-01T00:00:00' },
        { budget_id: 3, client_id: 3, budget_amount: 10000.00, monthly_limit: 12000.00, alert_threshold: 75, alert_enabled: true, created_date: '2026-01-01T00:00:00' },
        { budget_id: 4, client_id: 4, budget_amount: 2000.00, monthly_limit: 2500.00, alert_threshold: 90, alert_enabled: false, created_date: '2026-01-01T00:00:00' },
        { budget_id: 5, client_id: 5, budget_amount: 7500.00, monthly_limit: 9000.00, alert_threshold: 80, alert_enabled: true, created_date: '2026-01-01T00:00:00' },
    ],
};

/**
 * Response Transformer - Converts backend string numeric values to JavaScript numbers
 * 
 * Backend intentionally sends DECIMAL fields as strings to preserve precision over JSON.
 * Frontend needs to cast these to floats for calculations and display.
 * 
 * This function handles type coercion for all numeric fields across all API endpoints.
 * It's idempotent - works whether backend sends strings or numbers.
 */
function transformBackendResponse(data) {
    if (!data) return data;
    
    // Handle single object response (e.g., GET /clients/1)
    if (!Array.isArray(data) && typeof data === 'object' && !data.status) {
        return transformSingleItem(data);
    }
    
    // Handle array response wrapped in API format
    if (data.status === 'ok') {
        data.data = data.data.map(item => transformSingleItem(item));
    }

    return data;
}

/**
 * Transform a single item - converts string numeric fields to numbers
 */
function transformSingleItem(item) {
    if (!item || typeof item !== 'object') return item;
    
    const transformed = { ...item };
    
    // Numeric fields that need conversion
    const numericFields = [
        // Usage fields
        'units_used',
        'total_cost',
        
        // Service fields
        'service_cost',
        
        // Budget fields
        'budget_amount',
        'monthly_limit',
        'alert_threshold',
        
        // Invoice fields
        'invoice_amount',
        
        // ID fields (though these are usually already numbers)
        'usage_id',
        'client_id',
        'service_id',
        'provider_id',
        'budget_id',
        'invoice_id',
    ];
    
    // Convert each numeric field
    numericFields.forEach(field => {
        if (field in transformed) {
            transformed[field] = parseNumericValue(transformed[field]);
        }
    });
    
    return transformed;
}

/**
 * Safely parse a value to number
 * - If already a number, return as-is
 * - If string, parse to float
 * - If null/undefined/empty, return 0
 */
function parseNumericValue(value) {
    // Already a number
    if (typeof value === 'number') {
        return value;
    }
    
    // Null or undefined
    if (value === null || value === undefined) {
        return 0;
    }
    
    // String - parse to float
    if (typeof value === 'string') {
        // Empty string
        if (value.trim() === '') {
            return 0;
        }
        
        const parsed = parseFloat(value);
        
        // Check if parsing resulted in NaN
        if (isNaN(parsed)) {
            console.warn(`Warning: Could not parse numeric value: "${value}"`);
            return 0;
        }
        
        return parsed;
    }
    
    // Boolean (edge case)
    if (typeof value === 'boolean') {
        return value ? 1 : 0;
    }
    
    // Unknown type
    console.warn(`Warning: Unexpected type for numeric field: ${typeof value}`);
    return 0;
}

// Generic API fetch function with response transformation
async function fetchFromApi(endpoint, params = {}) {
    const url = getApiUrl(endpoint, params);
    
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Transform backend response (convert string numbers to actual numbers)
        const transformedData = transformBackendResponse(data);
        
        return transformedData;
    } catch (error) {
        console.error(`API Error for ${endpoint}:`, error);
        throw error;
    }
}

// Fetch with mock fallback
async function fetchWithMockFallback(endpoint, params, mockDataKey, mockGenerator = null) {
    if (API_CONFIG.USE_MOCK_DATA) {
        console.log(`Using mock data for ${endpoint}`);
        const mockData = mockGenerator ? mockGenerator() : MOCK_DATA[mockDataKey];
        
        // Simulate API response format
        return {
            status: 'ok',
            meta: { count: mockData.length},
            data: mockData,
        };
    }
    
    try {
        return await fetchFromApi(endpoint, params);
    } catch (error) {
        console.warn(`API failed, falling back to mock data for ${endpoint}`);
        const mockData = mockGenerator ? mockGenerator() : MOCK_DATA[mockDataKey];
        return {
            status: 'ok',
            meta: { count: mockData.length},
            data: mockData,
        };
    }
}

// API Functions
async function getClients(limit = DEFAULT_LIMIT) {
    const apiResponse = await fetchWithMockFallback(ENDPOINTS.CLIENTS, { limit }, 'clients');
    return apiResponse.data;
}

async function getClient(clientId) {
    if (API_CONFIG.USE_MOCK_DATA) {
        const client = MOCK_DATA.clients.find(c => c.client_id === clientId);
        return client || null;
    }
    
    try {
        const apiResponse = await fetchFromApi(`${ENDPOINTS.CLIENTS}/${clientId}`);
        return apiResponse.data;
    } catch (error) {
        return null;
    }
}

async function getProviders(limit = DEFAULT_LIMIT) {
    const apiResponse = await fetchWithMockFallback(ENDPOINTS.PROVIDERS, { limit }, 'providers');
    return apiResponse.data;
}

async function getServices(limit = DEFAULT_LIMIT) {
    const apiResponse = await fetchWithMockFallback(ENDPOINTS.SERVICES, { limit }, 'services');
    return apiResponse.data;
}

async function getUsages(limit = DEFAULT_LIMIT) {
    const apiResponse = await fetchWithMockFallback(
        ENDPOINTS.USAGES, 
        { limit }, 
        'usages', 
        () => MOCK_DATA.generateUsages(30)
    );
    return apiResponse.data;
}

async function getBudgets(limit = DEFAULT_LIMIT) {
    const apiResponse = await fetchWithMockFallback(ENDPOINTS.BUDGETS, { limit }, 'budgets');
    return apiResponse.data;
}

async function getInvoices(limit = DEFAULT_LIMIT) {
    const apiResponse = await fetchWithMockFallback(ENDPOINTS.INVOICES, { limit }, 'invoices');
    return apiResponse.data;
}

async function getBudget(budgetId) {
    if (API_CONFIG.USE_MOCK_DATA) {
        const budget = MOCK_DATA.budgets.find(b => b.budget_id === budgetId);
        return budget || null;
    }
    
    try {
        const apiResponse = await fetchFromApi(`${ENDPOINTS.BUDGETS}/${budgetId}`);
        return apiResponse.data;
    } catch (error) {
        return null;
    }
}

// Health check
async function checkHealth() {
    try {
        const response = await fetchFromApi(ENDPOINTS.HEALTH);
        return response.status === 'ok';
    } catch (error) {
        return false;
    }
}

// Get aggregated cost data for dashboard
async function getDashboardData(days = 30) {
    try {
        const [usages, providers, services] = await Promise.all([
            getUsages(),
            getProviders(),
            getServices(),
        ]);
        
        // const usages = usagesResponse.usages || [];
        // const providers = providersResponse.providers || [];
        // const services = servicesResponse.services || [];
        
        // Filter usages to last N days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);
        const cutoffStr = cutoffDate.toISOString().split('T')[0];
        
        const recentUsages = usages.filter(u => u.usage_date >= cutoffStr);
        
        // Calculate totals (now works correctly with numeric values!)
        const totalCost = recentUsages.reduce((sum, u) => sum + u.total_cost, 0);
        
        // Calculate by provider
        const costsByProvider = {};
        recentUsages.forEach(usage => {
            const service = services.find(s => s.service_id === usage.service_id);
            if (service) {
                const providerId = service.provider_id;
                if (!costsByProvider[providerId]) {
                    costsByProvider[providerId] = 0;
                }
                costsByProvider[providerId] += usage.total_cost;
            }
        });
        
        // Group by date for trend chart
        const costsByDate = {};
        recentUsages.forEach(usage => {
            const date = usage.usage_date;
            if (!costsByDate[date]) {
                costsByDate[date] = { date, total: 0, aws: 0, azure: 0 };
            }
            
            const service = services.find(s => s.service_id === usage.service_id);
            if (service) {
                costsByDate[date].total += usage.total_cost;
                if (service.provider_id === PROVIDER_IDS.AWS) {
                    costsByDate[date].aws += usage.total_cost;
                } else if (service.provider_id === PROVIDER_IDS.AZURE) {
                    costsByDate[date].azure += usage.total_cost;
                }
            }
        });
        
        const trendData = Object.values(costsByDate).sort((a, b) => 
            a.date.localeCompare(b.date)
        );
        
        return {
            totalCost,
            awsCost: costsByProvider[PROVIDER_IDS.AWS] || 0,
            azureCost: costsByProvider[PROVIDER_IDS.AZURE] || 0,
            trendData,
            usages: recentUsages,
            services,
            providers,
        };
    } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError('Failed to load dashboard data. Please try again.');
        throw error;
    }
}

/**
 * Get waste alerts using the analysis engine from analysis.js.
 * Fetches usages, services, providers, and budgets, then runs computeWasteAlerts().
 *
 * @param {Object} filters - { clientId, providerId, serviceId }
 * @returns {Object} { alerts[], summary{} } from computeWasteAlerts
 */
async function getWasteAlerts(filters = {}) {
    try {
        const [dashData, budgets] = await Promise.all([
            getDashboardData(30),
            getBudgets(),
        ]);

        const { usages, services, providers } = dashData;

        // Apply global filters
        let filteredUsages = usages;
        if (filters.clientId) {
            filteredUsages = filteredUsages.filter(u => u.client_id === parseInt(filters.clientId));
        }
        if (filters.providerId) {
            const providerServiceIds = services
                .filter(s => s.provider_id === parseInt(filters.providerId))
                .map(s => s.service_id);
            filteredUsages = filteredUsages.filter(u => providerServiceIds.includes(u.service_id));
        }
        if (filters.serviceId) {
            filteredUsages = filteredUsages.filter(u => u.service_id === parseInt(filters.serviceId));
        }

        // Get budget for selected client (or null for all-clients view)
        const budget = filters.clientId
            ? getBudgetForClient(budgets, filters.clientId)
            : null;

        // Run the analysis engine
        return computeWasteAlerts(filteredUsages, services, providers, budget);
    } catch (error) {
        console.error('Error computing waste alerts:', error);
        return { alerts: [], summary: {} };
    }
}

/**
 * Get optimization recommendations using the analysis engine.
 * Builds on waste alerts, then runs computeRecommendations().
 *
 * @param {Object} filters - { clientId, providerId, serviceId }
 * @returns {Object} { phases, totals } from computeRecommendations
 */
async function getRecommendations(filters = {}) {
    try {
        // Recommendations use ALL available data (not just 30 days)
        // and ignore provider/service filters — we need the full picture
        // to calculate accurate optimization potential
        const [dashData, budgets] = await Promise.all([
            getDashboardData(365),
            getBudgets(),
        ]);

        const { usages, services, providers } = dashData;

        // Only filter by client — recommendations must span all providers/services
        let filteredUsages = usages;
        if (filters.clientId) {
            filteredUsages = filteredUsages.filter(u => u.client_id === parseInt(filters.clientId));
        }

        const budget = filters.clientId
            ? getBudgetForClient(budgets, filters.clientId)
            : null;

        // Step 1: compute waste alerts
        const { alerts, summary } = computeWasteAlerts(filteredUsages, services, providers, budget);

        // Step 2: compute recommendations from alerts
        return computeRecommendations(alerts, services, summary);
    } catch (error) {
        console.error('Error computing recommendations:', error);
        return { phases: {}, totals: {} };
    }
}

/**
 * Save budget settings via PATCH /api/v1/budgets/:budgetId
 * Uses Sean's PATCH endpoint (commit 11af8bf).
 *
 * @param {number} budgetId - budget record ID
 * @param {Object} patchData - fields to update (budget_amount, monthly_limit, alert_threshold, alert_enabled)
 * @returns {Object} API response
 */
async function patchBudget(budgetId, patchData) {
    if (API_CONFIG.USE_MOCK_DATA) {
        console.log('Mock: Patching budget', budgetId, patchData);
        return { status: 'ok', data: { ...patchData, budget_id: budgetId } };
    }

    try {
        const url = getApiUrl(`${ENDPOINTS.BUDGETS}/${budgetId}`);
        const response = await fetch(url, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patchData),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error patching budget:', error);
        throw error;
    }
}

// Legacy wrapper for backward compatibility
async function saveBudgetSettings(budgetData) {
    return patchBudget(budgetData.budget_id, budgetData);
}