/**
 * File: dashboard.js
 * Project: Cloud Cost Intelligence Platform
 * Author: Ishan (Frontend Lead)
 * Created: January 2026
 * Updated: February 2026 - Added waste alerts, recommendations, budget bar,
 *          invoice PDF, CSV analyst workbook, and filter cascading.
 * Description: Main dashboard controller. Initializes Chart.js visualizations,
 *              handles navigation, user interactions, filter state, and export.
 *
 * Dependencies (loaded via <script> tags before this file):
 *   config.js  - API_CONFIG, ENDPOINTS, PROVIDER_IDS, CHART_COLORS
 *   utils.js   - formatCurrency, formatDate, formatPercentage, groupBy, exportToCSV, showError
 *   api.js     - getDashboardData, getWasteAlerts, getRecommendations, getBudgets, patchBudget
 *   analysis.js - computeWasteAlerts, computeRecommendations, getBudgetForClient
 *
 * FR Coverage:
 *   FR-01: Dashboard cost summary cards
 *   FR-02: Trend chart visualization (renderTrendChart)
 *   FR-03: Provider/service/client filtering (applyFilters)
 *   FR-04: Waste alerts page (loadWasteAlerts)
 *   FR-05: Optimization recommendations (loadRecommendations)
 *   FR-06: CSV/PDF export (exportData)
 *   FR-07: Budget settings (loadSettings, handleSaveBudgetSettings)
 *   FR-08: Resource metrics cards (calculateDashboardMetrics)
 */

// Global state
let currentPage = 'dashboard';
let dashboardChart = null;
let currentDateRange = 30;
let unfilteredDashboardData = null; // Cache for filtering

// Global state for waste alerts sorting
let wasteAlertsData = [];
let currentSortColumn = 'potential_savings'; // Default sort by savings (high to low)
let currentSortDirection = 'desc';

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    console.log('Cloud Cost Intelligence Platform - Initializing...');
    console.log('API Mode:', API_CONFIG.USE_MOCK_DATA ? 'MOCK DATA' : 'LIVE API');
    
    // Setup navigation
    setupNavigation();
    
    // Setup event listeners
    setupEventListeners();
    
    // Load initial page
    await loadDashboard();
    
    console.log('Initialization complete!');
}

// Navigation setup
function setupNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = link.dataset.page;
            navigateToPage(page);
        });
    });
}

function navigateToPage(page) {
    // Update active nav link
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
        if (link.dataset.page === page) {
            link.classList.add('active');
        }
    });
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(pageEl => {
        pageEl.classList.remove('active');
    });
    
    // Show selected page
    const pageMap = {
        'dashboard': 'dashboard-view',
        'waste': 'waste-alerts-view',
        'recommendations': 'recommendations-view',
        'settings': 'settings-view',
    };
    
    const pageId = pageMap[page];
    if (pageId) {
        document.getElementById(pageId).classList.add('active');
        currentPage = page;
        
        // Load page data
        loadPageData(page);
    }
}

async function loadPageData(page) {
    switch (page) {
        case 'dashboard':
            // Re-apply active filters if any are set
            const clientFilter = document.getElementById('client-filter')?.value;
            const providerFilter = document.getElementById('provider-filter')?.value;
            const serviceFilter = document.getElementById('service-filter')?.value;
            const hasFilters = clientFilter || providerFilter || serviceFilter;
            await loadDashboard(hasFilters);
            if (hasFilters) {
                await applyFilters();
            }
            break;
        case 'waste':
            await loadWasteAlerts();
            break;
        case 'recommendations':
            await loadRecommendations();
            break;
        case 'settings':
            await loadSettings();
            break;
    }
}

// Event listeners setup
function setupEventListeners() {
    // Dashboard refresh button
    document.getElementById('refresh-button')?.addEventListener('click', async () => {
        const cf = document.getElementById('client-filter')?.value;
        const pf = document.getElementById('provider-filter')?.value;
        const sf = document.getElementById('service-filter')?.value;
        const hasFilters = cf || pf || sf;
        await loadDashboard(hasFilters);
        if (hasFilters) {
            await applyFilters();
        }
    });
    
    // Filter drawer toggle
    document.getElementById('filter-toggle')?.addEventListener('click', () => {
        const drawer = document.getElementById('filter-drawer');
        const toggle = document.getElementById('filter-toggle');
        if (drawer) {
            drawer.classList.toggle('hidden');
            drawer.classList.toggle('open');
            toggle.classList.toggle('active');
        }
    });

    // Date range selector (now in global filter drawer)
    document.getElementById('date-range-selector')?.addEventListener('change', async (e) => {
        currentDateRange = parseInt(e.target.value);
        unfilteredDashboardData = null; // Clear cache when date range changes
        const cf = document.getElementById('client-filter')?.value;
        const pf = document.getElementById('provider-filter')?.value;
        const sf = document.getElementById('service-filter')?.value;
        const hasFilters = cf || pf || sf;
        await loadDashboard(hasFilters);
        if (hasFilters) {
            await applyFilters();
        }
        updateActiveFilterCount();
    });
    
    // Filter buttons
    document.getElementById('apply-filters')?.addEventListener('click', () => {
        applyFilters();
        updateActiveFilterCount();
    });
    document.getElementById('clear-filters')?.addEventListener('click', () => {
        clearFilters();
        updateActiveFilterCount();
    });

    // Client selector in navbar - auto-apply on change
    document.getElementById('client-filter')?.addEventListener('change', () => {
        applyFilters();
        updateActiveFilterCount();
    });
    
    // Provider filter cascading (optional enhancement)
    document.getElementById('provider-filter')?.addEventListener('change', (e) => {
        updateServiceFilterOptions(e.target.value);
    });
    
    // Budget settings
    document.getElementById('alert-threshold')?.addEventListener('input', (e) => {
        document.getElementById('threshold-value').textContent = e.target.value + '%';
    });
    
    document.getElementById('save-settings')?.addEventListener('click', handleSaveBudgetSettings);
    document.getElementById('cancel-settings')?.addEventListener('click', () => {
        navigateToPage('dashboard');
    });
    
    // Export buttons
    document.getElementById('export-csv')?.addEventListener('click', () => exportData('csv'));
    document.getElementById('export-pdf')?.addEventListener('click', () => exportData('pdf'));
}

/**
 * Load dashboard data from API, cache for filtering, and render UI.
 * Entry point for the main dashboard view (FR-01, FR-02, FR-08).
 *
 * @param {boolean} skipRender - if true, skip initial render (filters will re-render immediately after)
 */
async function loadDashboard(skipRender = false) {
    try {
        hideError();
        
        // Show loading state
        document.getElementById('total-cost').textContent = 'Loading...';
        document.getElementById('aws-cost').textContent = 'Loading...';
        document.getElementById('azure-cost').textContent = 'Loading...';
        document.getElementById('gcp-cost').textContent = 'Loading...';
        document.getElementById('potential-savings').textContent = 'Loading...';
        document.getElementById('avg-daily-cost').textContent = '...';
        document.getElementById('max-daily-cost').textContent = '...';
        document.getElementById('active-services').textContent = '...';
        document.getElementById('avg-cost-per-service').textContent = '...';
        document.getElementById('total-units-used').textContent = '...';
        document.getElementById('avg-units-per-day').textContent = '...';
        
        // Fetch dashboard data
        const data = await getDashboardData(currentDateRange);
        
        // Cache the unfiltered data for filtering
        unfilteredDashboardData = data;
        
        // Calculate metrics (including FR-08 resource metrics)
        const metricsData = calculateDashboardMetrics(data.usages, data.services, data.providers);
        
        // Update UI (skip if filters will be applied immediately after)
        if (!skipRender) {
            updateDashboardUI(metricsData);
        }
        
        // Update cost period display
        document.querySelectorAll('.cost-period').forEach(el => {
            el.textContent = `Last ${currentDateRange} days`;
        });
        
        // Populate filters
        await populateFilters(data.services, data.providers);
        
    } catch (error) {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data. Please try again.', loadDashboard);
    }
}

/**
 * Populate service, provider, and client filter dropdowns (FR-03).
 * Called on dashboard load and when settings page opens.
 * Preserves current selection when repopulating.
 *
 * @param {Array|null} services - service records (fetched if null)
 * @param {Array|null} providers - provider records (fetched if null)
 */
async function populateFilters(services = null, providers = null) {
    try {
        // Get service/provider data if not passed from loadDashboard()
        if (!services || !providers) {
            const [servicesResponse, providersResponse] = await Promise.all([
                getServices(),
                getProviders(),
            ]);
            services = servicesResponse.services || [];
            providers = providersResponse.providers || [];
        }
        
        // Populate service filter
        const serviceFilter = document.getElementById('service-filter');
        if (serviceFilter && services.length > 0) {
            const savedServiceValue = serviceFilter.value;
            serviceFilter.innerHTML = '<option value="">All Services</option>';
            
            // Group services by type
            const servicesByType = groupBy(services, 'service_type');
            Object.keys(servicesByType).sort().forEach(type => {
                const optgroup = document.createElement('optgroup');
                optgroup.label = type;
                
                servicesByType[type].forEach(service => {
                    const option = document.createElement('option');
                    option.value = service.service_id;
                    option.textContent = service.service_name;
                    optgroup.appendChild(option);
                });
                
                serviceFilter.appendChild(optgroup);
            });
            serviceFilter.value = savedServiceValue;
        }
        
        // Populate client filter
        const clientFilter = document.getElementById('client-filter');
        if (clientFilter) {
            const savedClientValue = clientFilter.value;
            const clientsResponse = await getClients();
            const clients = clientsResponse || [];
            
            clientFilter.innerHTML = '<option value="">All Clients</option>';
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.client_id;
                option.textContent = client.client_name;
                clientFilter.appendChild(option);
            });
            clientFilter.value = savedClientValue;
        }
    } catch (error) {
        console.error('Error populating filters:', error);
    }
}

/**
 * Apply active client/provider/service filters to cached dashboard data (FR-03).
 * Filters usages client-side from unfilteredDashboardData, recalculates metrics,
 * and cascades to waste alerts / recommendations if those pages are active.
 */
async function applyFilters() {
    try {
        hideError();
        
        const providerId = document.getElementById('provider-filter').value;
        const serviceId = document.getElementById('service-filter').value;
        const clientId = document.getElementById('client-filter').value;
        
        console.log('Applying filters:', { providerId, serviceId, clientId });
        
        // If no filters selected, show all data
        if (!providerId && !serviceId && !clientId) {
            console.log('No filters selected - showing all data');
            if (unfilteredDashboardData) {
                const metricsData = calculateDashboardMetrics(
                    unfilteredDashboardData.usages,
                    unfilteredDashboardData.services,
                    unfilteredDashboardData.providers
                );
                updateDashboardUI(metricsData);
            } else {
                await loadDashboard();
            }
            // Reload active page
            const activePage = document.querySelector('.nav-link.active')?.dataset.page;
            if (activePage === 'waste') await loadWasteAlerts();
            if (activePage === 'recommendations') await loadRecommendations();
            if (activePage === 'settings') await loadSettings();
            return;
        }
        
        // Get the unfiltered data if we don't have it
        if (!unfilteredDashboardData) {
            unfilteredDashboardData = await getDashboardData(currentDateRange);
        }
        
        // Filter the usages array based on selected filters
        let filteredUsages = unfilteredDashboardData.usages;
        
        // Filter by client
        if (clientId) {
            filteredUsages = filteredUsages.filter(u => u.client_id === parseInt(clientId));
            console.log(`Filtered by client ${clientId}: ${filteredUsages.length} records`);
        }
        
        // Filter by service (and implicitly by provider since services belong to providers)
        if (serviceId) {
            filteredUsages = filteredUsages.filter(u => u.service_id === parseInt(serviceId));
            console.log(`Filtered by service ${serviceId}: ${filteredUsages.length} records`);
        } else if (providerId) {
            // If no service selected but provider is selected, filter by provider
            const providerServices = unfilteredDashboardData.services
                .filter(s => s.provider_id === parseInt(providerId))
                .map(s => s.service_id);
            filteredUsages = filteredUsages.filter(u => providerServices.includes(u.service_id));
            console.log(`Filtered by provider ${providerId}: ${filteredUsages.length} records`);
        }
        
        // If no results after filtering, show message
        if (filteredUsages.length === 0) {
            showError('No data found for the selected filters. Try different filter combinations.');
            return;
        }
        
        // Recalculate costs from filtered data
        const filteredData = calculateDashboardMetrics(
            filteredUsages, 
            unfilteredDashboardData.services, 
            unfilteredDashboardData.providers
        );
        
        // Update the UI with filtered data
        updateDashboardUI(filteredData);
        
        console.log(`✓ Filters applied: Showing ${filteredUsages.length} of ${unfilteredDashboardData.usages.length} total records`);
        console.log(`Total Cost: ${formatCurrency(filteredData.totalCost)} (was ${formatCurrency(unfilteredDashboardData.totalCost)})`);
        
        // Also reload waste alerts / recommendations if those pages are active
        const activePage = document.querySelector('.nav-link.active')?.dataset.page;
        if (activePage === 'waste') await loadWasteAlerts();
        if (activePage === 'recommendations') await loadRecommendations();
        if (activePage === 'settings') await loadSettings();
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showError('Failed to apply filters. Please try again.');
    }
}

/**
 * Calculate all dashboard metrics from a (possibly filtered) set of usage records.
 * Returns cost totals, per-provider breakdowns, trend data, and resource metrics.
 * This is the single source of truth for what the dashboard displays (FR-01, FR-08).
 *
 * @param {Array} usages - usage records (may be filtered by client/provider/service)
 * @param {Array} services - all service records
 * @param {Array} providers - all provider records
 * @returns {Object} metrics for updateDashboardUI()
 */
function calculateDashboardMetrics(usages, services, providers) {
    // Calculate total cost
    const totalCost = usages.reduce((sum, u) => sum + u.total_cost, 0);
    
    // Calculate by provider
    const costsByProvider = {};
    usages.forEach(usage => {
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
    usages.forEach(usage => {
        const date = usage.usage_date;
        if (!costsByDate[date]) {
            costsByDate[date] = { date, total: 0, aws: 0, azure: 0, gcp: 0 };
        }
        
        const service = services.find(s => s.service_id === usage.service_id);
        if (service) {
            costsByDate[date].total += usage.total_cost;
            if (service.provider_id === PROVIDER_IDS.AWS) {
                costsByDate[date].aws += usage.total_cost;
            } else if (service.provider_id === PROVIDER_IDS.AZURE) {
                costsByDate[date].azure += usage.total_cost;
            } else if (service.provider_id === PROVIDER_IDS.GCP) {
                costsByDate[date].gcp += usage.total_cost;
            }
        }
    });
    
    const trendData = Object.values(costsByDate).sort((a, b) => 
        a.date.localeCompare(b.date)
    );
    
    // Resource metrics (FR-08)
    const uniqueDays = Object.keys(costsByDate).length || 1;
    const avgDailyCost = totalCost / uniqueDays;
    const maxDailyCost = trendData.reduce((max, d) => Math.max(max, d.total), 0);
    const activeServices = new Set(usages.map(u => u.service_id)).size;
    const avgCostPerService = activeServices > 0 ? totalCost / activeServices : 0;
    const totalUnitsUsed = usages.reduce((sum, u) => sum + u.units_used, 0);
    const avgUnitsPerDay = totalUnitsUsed / uniqueDays;
    
    return {
        totalCost,
        awsCost: costsByProvider[PROVIDER_IDS.AWS] || 0,
        azureCost: costsByProvider[PROVIDER_IDS.AZURE] || 0,
        gcpCost: costsByProvider[PROVIDER_IDS.GCP] || 0,
        trendData,
        avgDailyCost,
        maxDailyCost,
        activeServices,
        avgCostPerService,
        totalUnitsUsed,
        avgUnitsPerDay,
        usages,
        services,
        providers,
    };
}

/**
 * Render dashboard UI from pre-calculated metrics. Does NOT fetch data.
 * Updates cost cards, resource metric cards, and re-renders the trend chart.
 *
 * @param {Object} data - output from calculateDashboardMetrics()
 */
function updateDashboardUI(data) {
    // Update cost summary cards
    document.getElementById('total-cost').textContent = formatCurrency(data.totalCost);
    document.getElementById('aws-cost').textContent = formatCurrency(data.awsCost);
    document.getElementById('azure-cost').textContent = formatCurrency(data.azureCost);
    document.getElementById('gcp-cost').textContent = formatCurrency(data.gcpCost);
    
    // Update potential savings (estimate 15% of total)
    const potentialSavings = data.totalCost * 0.15;
    document.getElementById('potential-savings').textContent = formatCurrency(potentialSavings);
    
    // Update resource metrics (FR-08)
    document.getElementById('avg-daily-cost').textContent = formatCurrency(data.avgDailyCost);
    document.getElementById('max-daily-cost').textContent = formatCurrency(data.maxDailyCost);
    document.getElementById('active-services').textContent = data.activeServices;
    document.getElementById('avg-cost-per-service').textContent = formatCurrency(data.avgCostPerService);
    document.getElementById('total-units-used').textContent = formatNumber(Math.round(data.totalUnitsUsed));
    document.getElementById('avg-units-per-day').textContent = formatNumber(Math.round(data.avgUnitsPerDay));
    
    // Re-render trend chart with filtered data
    renderTrendChart(data.trendData);
}

/** Cascade provider filter: rebuild service dropdown to show only selected provider's services. */
function updateServiceFilterOptions(providerId) {
    const serviceFilter = document.getElementById('service-filter');
    if (!serviceFilter || !unfilteredDashboardData) return;
    
    const services = unfilteredDashboardData.services;
    
    // Filter services by provider if one is selected
    const filteredServices = providerId 
        ? services.filter(s => s.provider_id === parseInt(providerId))
        : services;
    
    // Rebuild the service dropdown
    serviceFilter.innerHTML = '<option value="">All Services</option>';
    
    if (filteredServices.length > 0) {
        const servicesByType = groupBy(filteredServices, 'service_type');
        Object.keys(servicesByType).sort().forEach(type => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = type;
            
            servicesByType[type].forEach(service => {
                const option = document.createElement('option');
                option.value = service.service_id;
                option.textContent = service.service_name;
                optgroup.appendChild(option);
            });
            
            serviceFilter.appendChild(optgroup);
        });
    }
}

/** Reset all filter dropdowns to 'All' and re-render dashboard with unfiltered data. */
function clearFilters() {
    // Reset filter dropdowns to default
    document.getElementById('provider-filter').value = '';
    document.getElementById('service-filter').value = '';
    document.getElementById('client-filter').value = '';
    
    // Reset service filter options to show all services
    updateServiceFilterOptions('');
    
    // Re-render dashboard with unfiltered data
    if (unfilteredDashboardData) {
        const metricsData = calculateDashboardMetrics(
            unfilteredDashboardData.usages,
            unfilteredDashboardData.services,
            unfilteredDashboardData.providers
        );
        updateDashboardUI(metricsData);
        console.log('Filters cleared - showing all data');
    } else {
        // If we don't have cached data, reload
        loadDashboard();
    }
}

/** Update the filter count badge in the navbar (e.g. "2" when client + provider selected). */
function updateActiveFilterCount() {
    const badge = document.getElementById('active-filter-count');
    if (!badge) return;
    
    let count = 0;
    if (document.getElementById('provider-filter')?.value) count++;
    if (document.getElementById('service-filter')?.value) count++;
    if (document.getElementById('client-filter')?.value) count++;
    // Date range doesn't count as a "filter" since it always has a value
    
    if (count > 0) {
        badge.textContent = count;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

/**
 * Render the cost trend line chart using Chart.js (FR-02).
 * Smart dataset selection: hides "Total" line when only one provider has data,
 * hides provider lines that are all-zero (e.g., GCP when filtered to AWS-only client).
 *
 * @param {Array} trendData - array of { date, total, aws, azure, gcp } objects
 */
function renderTrendChart(trendData) {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destroy existing chart if it exists
    if (dashboardChart) {
        dashboardChart.destroy();
    }
    
    // Prepare chart data
    const labels = trendData.map(d => formatDate(d.date));
    const totalData = trendData.map(d => d.total);
    const awsData = trendData.map(d => d.aws);
    const azureData = trendData.map(d => d.azure);
    const gcpData = trendData.map(d => d.gcp);
    
    // Helper: check if a data array is all zeros
    const isAllZero = (arr) => arr.every(v => v === 0);
    
    // Helper: check if two arrays are equal (total matches a single provider)
    const arraysEqual = (a, b) => a.length === b.length && a.every((v, i) => Math.abs(v - b[i]) < 0.01);
    
    // Count how many providers have non-zero data
    const activeProviders = [awsData, azureData, gcpData].filter(arr => !isAllZero(arr));
    
    // Hide total cost line if it duplicates a single active provider
    const showTotal = activeProviders.length > 1 || (
        activeProviders.length === 1 &&
        !arraysEqual(totalData, awsData) &&
        !arraysEqual(totalData, azureData) &&
        !arraysEqual(totalData, gcpData)
    );
    
    // Build datasets - only include lines that add information
    const datasets = [];
    
    if (showTotal && !isAllZero(totalData)) {
        datasets.push({
            label: 'Total Cost',
            data: totalData,
            borderColor: '#9ca3af',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [6, 4],
            fill: false,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
        });
    }
    
    if (!isAllZero(awsData)) {
        datasets.push({
            label: 'AWS',
            data: awsData,
            borderColor: CHART_COLORS.AWS,
            backgroundColor: CHART_COLORS.AWS + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
        });
    }
    
    if (!isAllZero(azureData)) {
        datasets.push({
            label: 'Azure',
            data: azureData,
            borderColor: CHART_COLORS.AZURE,
            backgroundColor: CHART_COLORS.AZURE + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
        });
    }
    
    if (!isAllZero(gcpData)) {
        datasets.push({
            label: 'GCP',
            data: gcpData,
            borderColor: CHART_COLORS.GCP,
            backgroundColor: CHART_COLORS.GCP + '20',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
        });
    }
    
    // Create new chart
    dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                title: {
                    display: false,
                },
                legend: {
                    display: true,
                    position: 'top',
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            label += formatCurrency(context.parsed.y);
                            return label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Date'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                },
                y: {
                    display: true,
                    title: {
                        display: true,
                        text: 'Cost ($)'
                    },
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            },
            interaction: {
                mode: 'nearest',
                axis: 'x',
                intersect: false
            }
        }
    });
}

// ═══════════════════════════════════════════════════════════════════════════
// WASTE ALERTS PAGE — Full rendering with analysis engine
// ═══════════════════════════════════════════════════════════════════════════

async function loadWasteAlerts() {
    try {
        hideError();
        const alertsBody = document.getElementById('waste-alerts-body');
        alertsBody.innerHTML = '<tr><td colspan="8" class="loading">Analyzing resource utilization...</td></tr>';

        const filters = {
            providerId: document.getElementById('provider-filter')?.value || '',
            serviceId: document.getElementById('service-filter')?.value || '',
            clientId: document.getElementById('client-filter')?.value || '',
        };

        const { alerts, summary } = await getWasteAlerts(filters);

        // Update summary banner
        document.getElementById('waste-monthly-spend').textContent = formatCurrency(summary.totalMonthlyCost || 0);
        document.getElementById('waste-total-savings').textContent = formatCurrency(summary.totalSavings || 0) + '/mo';

        // Hide budget cards when viewing all clients (budget is per-client)
        const hasClient = !!filters.clientId;
        document.querySelectorAll('.waste-budget-only').forEach(el => {
            el.style.display = hasClient ? '' : 'none';
        });

        if (hasClient) {
            document.getElementById('waste-budget-target').textContent = formatCurrency(summary.budgetAmount || 0);
            const overBudgetEl = document.getElementById('waste-over-budget');
            if (summary.overBudget) {
                overBudgetEl.textContent = '+' + formatCurrency(summary.overBudgetAmount);
                overBudgetEl.classList.add('waste-banner-danger');
            } else {
                overBudgetEl.textContent = 'On Track';
                overBudgetEl.classList.remove('waste-banner-danger');
                overBudgetEl.style.color = '#10b981';
            }
        }

        // Severity counts
        document.getElementById('waste-critical-count').textContent = summary.criticalCount || 0;
        document.getElementById('waste-warning-count').textContent = summary.warningCount || 0;
        const infoCount = alerts.filter(a => a.severity === 'info').length;
        document.getElementById('waste-info-count').textContent = infoCount;

        // Provider concentration warning
        const concEl = document.getElementById('waste-provider-concentration');
        if (summary.topProviderPct > 80 && summary.providerCount === 1) {
            document.getElementById('waste-concentration-text').textContent =
                `100% of spend is with ${summary.topProvider}. No cross-provider alternatives available for diversification.`;
            concEl.classList.remove('hidden');
        } else if (summary.topProviderPct > 80) {
            document.getElementById('waste-concentration-text').textContent =
                `${summary.topProviderPct.toFixed(0)}% of spend is concentrated with ${summary.topProvider}. Consider multi-provider strategy.`;
            concEl.classList.remove('hidden');
        } else {
            concEl.classList.add('hidden');
        }

        // Empty state
        if (!alerts || alerts.length === 0) {
            alertsBody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:#10b981;">No waste detected! Resources are well-optimized.</td></tr>';
            return;
        }

        // Store for sorting
        wasteAlertsData = alerts;
        setupWasteAlertsSorting();
        renderWasteAlertsTable(alerts);

        // Category breakdown bars
        renderCategoryBreakdown(summary.categorySpend || {}, summary.totalMonthlyCost || 1);

    } catch (error) {
        console.error('Error loading waste alerts:', error);
        showError('Failed to load waste alerts. Please try again.', loadWasteAlerts);
    }
}

/** Render waste alerts table rows with severity badges, trend arrows, and alt-provider flags. */
function renderWasteAlertsTable(alerts) {
    const alertsBody = document.getElementById('waste-alerts-body');
    alertsBody.innerHTML = '';

    alerts.forEach(alert => {
        const row = document.createElement('tr');

        // Trend arrow
        let trendHtml;
        if (alert.trend > 5) {
            trendHtml = `<span class="trend-up">▲ ${alert.trend.toFixed(0)}%</span>`;
        } else if (alert.trend < -5) {
            trendHtml = `<span class="trend-down">▼ ${Math.abs(alert.trend).toFixed(0)}%</span>`;
        } else {
            trendHtml = `<span class="trend-flat">— flat</span>`;
        }

        // Alt provider
        const altHtml = alert.has_alternative
            ? `<span class="alt-badge">✓ Available</span>`
            : `<span class="alt-badge locked">— Locked</span>`;

        row.innerHTML = `
            <td><span class="severity-badge ${alert.severity}"><span class="severity-dot-sm"></span>${alert.severity}</span></td>
            <td>${alert.service_name}<br><span style="font-size:0.8rem;color:var(--text-secondary)">${alert.service_type}</span></td>
            <td>${alert.provider_name}</td>
            <td><span class="utilization-badge ${alert.utilization < 0.2 ? 'utilization-low' : 'utilization-medium'}">${formatPercentage(alert.utilization)}</span></td>
            <td>${formatCurrency(alert.monthly_cost)}</td>
            <td style="color:#10b981;font-weight:600">${formatCurrency(alert.potential_savings)}/mo</td>
            <td>${trendHtml}</td>
            <td>${altHtml}</td>
        `;

        alertsBody.appendChild(row);
    });
}

/** Render horizontal bar chart showing spend by service category (e.g. Compute, Storage). */
function renderCategoryBreakdown(categorySpend, totalSpend) {
    const container = document.getElementById('waste-category-bars');
    if (!container) return;
    container.innerHTML = '';

    const sorted = Object.entries(categorySpend).sort((a, b) => b[1] - a[1]);
    const maxCost = sorted.length > 0 ? sorted[0][1] : 1;

    sorted.forEach(([category, cost]) => {
        const pct = (cost / maxCost) * 100;
        const row = document.createElement('div');
        row.className = 'category-bar-row';
        row.innerHTML = `
            <span class="category-bar-label">${category}</span>
            <div class="category-bar-track"><div class="category-bar-fill" style="width:${pct}%"></div></div>
            <span class="category-bar-value">${formatCurrency(cost)}/mo</span>
        `;
        container.appendChild(row);
    });
}

/** Wire sortable column headers on waste alerts table. Clones nodes to clear stale listeners. */
function setupWasteAlertsSorting() {
    const sortableHeaders = document.querySelectorAll('.alerts-table .sortable');
    sortableHeaders.forEach(header => {
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
    });
    document.querySelectorAll('.alerts-table .sortable').forEach(header => {
        header.addEventListener('click', () => {
            const col = header.dataset.sort;
            if (col === currentSortColumn) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                currentSortColumn = col;
                currentSortDirection = ['service_name', 'provider_name'].includes(col) ? 'asc' : 'desc';
            }
            renderWasteAlertsTable(sortWasteAlerts(wasteAlertsData, currentSortColumn, currentSortDirection));
            updateSortIndicators();
        });
    });
    updateSortIndicators();
}

/** Sort alerts by column and direction. Returns new array (no mutation). */
function sortWasteAlerts(alerts, column, direction) {
    return [...alerts].sort((a, b) => {
        let valA, valB;
        switch (column) {
            case 'service_name': case 'provider_name':
                valA = a[column].toLowerCase(); valB = b[column].toLowerCase();
                return direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
            case 'utilization': case 'monthly_cost': case 'daily_cost': case 'potential_savings':
                valA = a[column]; valB = b[column];
                return direction === 'asc' ? valA - valB : valB - valA;
            default: return 0;
        }
    });
}

/** Update sort arrow CSS classes on waste alerts table headers. */
function updateSortIndicators() {
    document.querySelectorAll('.alerts-table .sortable').forEach(h => h.classList.remove('sorted', 'asc', 'desc'));
    const cur = document.querySelector(`.alerts-table .sortable[data-sort="${currentSortColumn}"]`);
    if (cur) cur.classList.add('sorted', currentSortDirection);
}

// ═══════════════════════════════════════════════════════════════════════════
// RECOMMENDATIONS PAGE — Savings Roadmap with Plus/Minus
// ═══════════════════════════════════════════════════════════════════════════

async function loadRecommendations() {
    try {
        hideError();
        const phaseCardsEl = document.getElementById('rec-phase-cards');
        const detailEl = document.getElementById('rec-phases-detail');
        phaseCardsEl.innerHTML = '<div class="loading">Generating savings roadmap...</div>';
        detailEl.innerHTML = '';

        const filters = {
            providerId: document.getElementById('provider-filter')?.value || '',
            serviceId: document.getElementById('service-filter')?.value || '',
            clientId: document.getElementById('client-filter')?.value || '',
        };

        const { phases, totals } = await getRecommendations(filters);

        if (!phases || Object.keys(phases).length === 0) {
            phaseCardsEl.innerHTML = '<p style="text-align:center;color:var(--text-secondary);grid-column:1/-1">No optimization recommendations at this time.</p>';
            return;
        }

        // Savings banner
        const currentSpend = phases[1]?.spendBefore || 0;
        const optimizedSpend = phases[3]?.spendAfter ?? phases[2]?.spendAfter ?? phases[1]?.spendAfter ?? currentSpend;
        const budgetAmount = phases[1]?.budgetAmount || 0;
        const hasClient = !!filters.clientId;

        document.getElementById('rec-current-spend').textContent = formatCurrency(currentSpend) + '/mo';
        document.getElementById('rec-target-spend').textContent = formatCurrency(optimizedSpend) + '/mo';
        document.getElementById('rec-total-savings').textContent = formatCurrency(totals.savings || 0) + '/mo';

        // Hide budget elements when viewing all clients (budget is per-client)
        document.querySelectorAll('.rec-budget-only').forEach(el => {
            el.style.display = hasClient ? '' : 'none';
        });
        if (hasClient) {
            document.getElementById('rec-budget').textContent = budgetAmount > 0 ? formatCurrency(budgetAmount) + '/mo' : 'Not set';
        }

        // Budget vs Optimization bar (only when a specific client is selected)
        const barEl = document.getElementById('rec-budget-bar');
        if (hasClient && budgetAmount > 0) {
            const savingsTotal = totals.savings || 0;
            const savingsPct = ((savingsTotal / currentSpend) * 100).toFixed(0);
            const maxVal = currentSpend * 1.15; // 15% padding so current marker isn't on the edge
            const optimizedPct = ((optimizedSpend / maxVal) * 100).toFixed(1);
            const budgetPctVal = ((budgetAmount / maxVal) * 100).toFixed(1);
            const currentPct = ((currentSpend / maxVal) * 100).toFixed(1);
            const diff = budgetAmount - optimizedSpend;

            // Gradient fill spans full track
            document.getElementById('rec-bar-fill').style.width = '100%';

            // Position markers
            document.getElementById('rec-marker-optimized').style.left = optimizedPct + '%';
            document.getElementById('rec-marker-optimized-val').textContent = formatCurrency(optimizedSpend);
            document.getElementById('rec-marker-budget').style.left = budgetPctVal + '%';
            document.getElementById('rec-marker-budget-val').textContent = formatCurrency(budgetAmount);
            document.getElementById('rec-marker-current').style.left = currentPct + '%';
            document.getElementById('rec-marker-current-val').textContent = formatCurrency(currentSpend);

            // Scale ticks
            const scaleEl = document.getElementById('rec-bar-scale');
            const step = Math.ceil(currentSpend / 4 / 100) * 100;
            let ticks = [];
            for (let v = 0; v <= currentSpend; v += step) {
                ticks.push(formatCurrency(v));
            }
            if (ticks[ticks.length - 1] !== formatCurrency(currentSpend)) {
                ticks.push(formatCurrency(currentSpend));
            }
            scaleEl.innerHTML = ticks.map(t => `<span class="rec-bar-tick">${t}</span>`).join('');

            // Summary callouts
            const summaryEl = document.getElementById('rec-bar-summary');
            let budgetLine = '';
            if (totals.budgetShortfall > 0) {
                // Can't reach budget even with all optimizations
                budgetLine = `<span class="rec-callout rec-callout-bad">⚠ Still ${formatCurrency(totals.budgetShortfall)}/mo over budget after all optimizations — recommend increasing budget to ${formatCurrency(totals.recommendedBudget)}/mo</span>`;
            } else if (diff > 0) {
                budgetLine = `<span class="rec-callout rec-callout-good">✓ Optimization lands ${formatCurrency(diff)}/mo under budget</span>`;
            } else if (diff < 0) {
                budgetLine = `<span class="rec-callout rec-callout-bad">⚠ Still ${formatCurrency(Math.abs(diff))}/mo over budget after all optimizations</span>`;
            } else {
                budgetLine = `<span class="rec-callout rec-callout-good">✓ Meets budget exactly</span>`;
            }
            summaryEl.innerHTML = `
                <div class="rec-callout-row">
                    <span class="rec-callout rec-callout-savings">🔥 ${savingsPct}% of current spend is recoverable — ${formatCurrency(savingsTotal)}/mo</span>
                </div>
                <div class="rec-callout-row">${budgetLine}</div>
            `;
            barEl.classList.remove('hidden');
        } else {
            barEl.classList.add('hidden');
        }

        // Phase summary cards
        phaseCardsEl.innerHTML = '';
        [1, 2, 3].forEach(p => {
            const phase = phases[p];
            if (!phase) return;
            const card = document.createElement('div');
            card.className = `phase-summary-card phase-${p}${phase.skipped ? ' phase-skipped' : ''}`;
            if (phase.skipped) {
                card.innerHTML = `
                    <div class="phase-card-header">
                        <span class="phase-card-title">${phase.label}</span>
                        <span class="phase-tag ${phase.tagClass}">${phase.tag}</span>
                    </div>
                    <div class="phase-card-savings phase-skipped-msg">✓ Not needed</div>
                    <div class="phase-card-meta">
                        <span style="grid-column:1/-1;text-align:center;color:var(--success-color);font-size:0.85rem">${phase.skipReason}</span>
                    </div>
                `;
            } else {
                card.innerHTML = `
                    <div class="phase-card-header">
                        <span class="phase-card-title">${phase.label}</span>
                        <span class="phase-tag ${phase.tagClass}">${phase.tag}</span>
                    </div>
                    <div class="phase-card-savings">${formatCurrency(phase.savings)}/mo</div>
                    <div class="phase-card-meta">
                        <span><span>Upfront</span><span>${phase.upfront > 0 ? formatCurrency(phase.upfront) : '$0'}</span></span>
                        <span><span>Effort</span><span>${phase.hours} hrs</span></span>
                        <span><span>Downtime</span><span>${phase.downtime}</span></span>
                        <span><span>Payback</span><span>${phase.payback}</span></span>
                    </div>
                `;
            }
            phaseCardsEl.appendChild(card);
        });

        // Phase detail sections with plus/minus
        detailEl.innerHTML = '';
        [1, 2, 3].forEach(p => {
            const phase = phases[p];
            if (!phase) return;
            if (phase.skipped) {
                const section = document.createElement('div');
                section.className = 'phase-detail-section phase-skipped';
                section.innerHTML = `
                    <div class="phase-detail-header">
                        <span class="phase-detail-title">
                            <span class="phase-tag ${phase.tagClass}">${phase.tag}</span>
                            Phase ${p}: ${phase.label}
                        </span>
                        <span class="phase-skipped-badge">✓ Skipped</span>
                    </div>
                    <div class="phase-skipped-body">
                        ${phase.skipReason} — budget target already met.
                    </div>
                `;
                detailEl.appendChild(section);
                return;
            }
            if (phase.items.length === 0) return;

            const section = document.createElement('div');
            section.className = 'phase-detail-section';

            const isOpen = p === 1; // Phase 1 open by default
            section.innerHTML = `
                <div class="phase-detail-header" onclick="togglePhaseDetail(this)">
                    <span class="phase-detail-title">
                        <span class="phase-tag ${phase.tagClass}">${phase.tag}</span>
                        Phase ${p}: ${phase.label} — ${formatCurrency(phase.savings)}/mo
                    </span>
                    <span class="phase-detail-toggle ${isOpen ? 'open' : ''}">▼</span>
                </div>
                <div class="phase-detail-body ${isOpen ? '' : 'collapsed'}">
                    ${phase.items.map(rec => `
                        <div class="rec-item">
                            <div class="rec-item-header" onclick="toggleRecItem(this)" style="cursor:pointer">
                                <span class="rec-item-service">🛠 ${rec.service_name} <span style="color:var(--text-secondary);font-weight:400">(${rec.provider_name})</span> — ${rec.action}</span>
                                <span style="display:flex;align-items:center;gap:8px">
                                    <span class="rec-item-savings">${formatCurrency(rec.savings)}/mo</span>
                                    <span class="rec-item-toggle">▶</span>
                                </span>
                            </div>
                            <div class="rec-item-detail collapsed">
                                <div class="rec-plusminus">
                                    <div class="rec-plus">
                                        <div class="rec-plus-title">Benefits</div>
                                        <ul>${rec.plus.map(t => `<li>${t}</li>`).join('')}</ul>
                                    </div>
                                    <div class="rec-minus">
                                        <div class="rec-minus-title">Costs & Tradeoffs</div>
                                        <ul>${rec.minus.map(t => `<li>${t}</li>`).join('')}</ul>
                                    </div>
                                </div>
                                ${rec.risk ? `<div class="rec-risk"><span class="rec-risk-icon">⚠️</span>${rec.risk}</div>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
            detailEl.appendChild(section);
        });

        // Comparison table
        const compBody = document.getElementById('rec-comparison-body');
        compBody.innerHTML = '';
        const rows = [
            { label: 'Monthly Savings', key: 'savings', fmt: v => formatCurrency(v) },
            { label: 'Upfront Cost', key: 'upfront', fmt: v => v > 0 ? formatCurrency(v) : '$0' },
            { label: 'Labor Hours', key: 'hours', fmt: v => v + ' hrs' },
            { label: 'Downtime', key: 'downtime', fmt: v => v },
            { label: 'Payback', key: 'payback', fmt: v => v },
            { label: 'Spend After', key: 'spendAfter', fmt: v => formatCurrency(v) + '/mo' },
        ];
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${r.label}</td>` +
                [1, 2, 3].map(p => {
                    const val = phases[p]?.[r.key] ?? 0;
                    const cls = r.key === 'savings' ? 'class="rec-highlight"' : '';
                    return `<td ${cls}>${r.fmt(val)}</td>`;
                }).join('');
            compBody.appendChild(tr);
        });

        // Bottom line
        const bottomEl = document.getElementById('rec-bottom-line');
        const phase1Savings = phases[1]?.savings || 0;
        if (phase1Savings > 0) {
            document.getElementById('rec-bottom-text').textContent =
                `Phase 1 alone saves ${formatCurrency(phase1Savings)}/mo with zero downtime and zero upfront cost. Start there.`;
            bottomEl.classList.remove('hidden');
        } else {
            bottomEl.classList.add('hidden');
        }

    } catch (error) {
        console.error('Error loading recommendations:', error);
        showError('Failed to load recommendations. Please try again.', loadRecommendations);
    }
}

/** Toggle phase detail accordion open/closed. Called via onclick in rendered HTML. */
function togglePhaseDetail(headerEl) {
    const body = headerEl.nextElementSibling;
    const toggle = headerEl.querySelector('.phase-detail-toggle');
    body.classList.toggle('collapsed');
    toggle.classList.toggle('open');
}

/** Toggle individual recommendation plus/minus detail. Called via onclick in rendered HTML. */
function toggleRecItem(headerEl) {
    const detail = headerEl.nextElementSibling;
    const toggle = headerEl.querySelector('.rec-item-toggle');
    detail.classList.toggle('collapsed');
    toggle.textContent = detail.classList.contains('collapsed') ? '▶' : '▼';
}

// ═══════════════════════════════════════════════════════════════════════════
// SETTINGS PAGE — Budget settings with PATCH integration
// ═══════════════════════════════════════════════════════════════════════════

/** Budget record ID for selected client. Set by loadSettings(), consumed by handleSaveBudgetSettings(). */
let currentBudgetId = null;

/**
 * Load budget settings for the selected client (FR-07).
 * Reads from GET /budgets, finds the matching client record,
 * and populates the form fields.
 */
async function loadSettings() {
    try {
        hideError();
        // Clear fields until real data loads
        document.getElementById('budget-amount').value = '';
        document.getElementById('monthly-limit').value = '';
        document.getElementById('alert-threshold').value = 50;
        document.getElementById('threshold-value').textContent = '---';
        document.getElementById('enable-alerts').checked = false;

        await populateFilters();

        // If a client is selected, load their budget
        const clientId = document.getElementById('client-filter')?.value;
        if (clientId) {
            const budgets = await getBudgets();
            const budget = getBudgetForClient(budgets, clientId);
            if (budget) {
                currentBudgetId = budget.budget_id;
                document.getElementById('budget-amount').value = budget.budget_amount || '';
                document.getElementById('monthly-limit').value = budget.monthly_limit || '';
                const thresholdPct = budget.budget_amount > 0
                    ? Math.round((budget.alert_threshold / budget.budget_amount) * 100)
                    : 80;
                document.getElementById('alert-threshold').value = thresholdPct;
                document.getElementById('threshold-value').textContent = thresholdPct + '%';
                document.getElementById('enable-alerts').checked = budget.alert_enabled || false;
            }
        }
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * Save budget settings via PATCH /budgets/:id (FR-07).
 * Converts the threshold slider (percentage) to a dollar amount before sending.
 * Uses Sean's PATCH endpoint from budgets.py.
 */
async function handleSaveBudgetSettings() {
    try {
        const clientId = document.getElementById('client-filter').value;
        const budgetAmount = parseFloat(document.getElementById('budget-amount').value);
        const monthlyLimit = parseFloat(document.getElementById('monthly-limit').value);
        const alertThresholdPct = parseInt(document.getElementById('alert-threshold').value);
        const alertEnabled = document.getElementById('enable-alerts').checked;

        if (!clientId) {
            showError('Please select a client from the navbar');
            return;
        }
        if (!budgetAmount || budgetAmount <= 0) {
            showError('Please enter a valid budget amount');
            return;
        }
        if (!monthlyLimit || monthlyLimit <= 0) {
            showError('Please enter a valid monthly limit');
            return;
        }

        // Look up budget ID if we don't have it
        if (!currentBudgetId) {
            const budgets = await getBudgets();
            const budget = getBudgetForClient(budgets, clientId);
            if (budget) {
                currentBudgetId = budget.budget_id;
            } else {
                showError('No budget record found for this client. Contact Backend Lead to create one.');
                return;
            }
        }

        // Convert threshold % to dollar amount for PATCH
        const alertThresholdDollar = (alertThresholdPct / 100) * budgetAmount;

        const patchData = {
            budget_amount: budgetAmount.toFixed(2),
            monthly_limit: monthlyLimit.toFixed(2),
            alert_threshold: alertThresholdDollar.toFixed(2),
            alert_enabled: alertEnabled,
        };

        const result = await patchBudget(currentBudgetId, patchData);

        if (result.status === 'ok') {
            alert('Budget settings saved successfully!');
            console.log('Budget updated:', result.data);
        }
    } catch (error) {
        console.error('Error saving budget settings:', error);
        showError('Failed to save budget settings: ' + error.message);
    }
}

/**
 * Export dashboard data as CSV or PDF invoice (FR-06).
 *
 * CSV ("The Analyst's Workbook") — 20-column flat file with:
 *   - Cross-provider rate comparison per service type
 *   - 7-day rolling averages and 30-day trend percentages
 *   - Switch-savings calculation (cheapest provider delta)
 *   - Utilization estimates and waste status flags
 *   Respects all active filters (client/provider/service).
 *
 * PDF (Invoice) — Finance-persona document with:
 *   - December 2025 billing period vs November 2025 comparison
 *   - Month-over-month delta (color-coded red/green)
 *   - Budget comparison in totals section (over/under)
 *   - Provider breakdown table
 *   Uses jsPDF + jspdf-autotable for generation.
 *
 * @param {string} format - 'csv' or 'pdf'
 */
async function exportData(format) {
    try {
        hideError();
        const progressDiv = document.getElementById('export-progress');
        const progressFill = progressDiv.querySelector('.progress-fill');
        const progressText = progressDiv.querySelector('.progress-text');
        
        progressDiv.classList.remove('hidden');
        progressFill.style.width = '0%';
        progressText.textContent = 'Preparing export...';
        
        // Simulate progress
        progressFill.style.width = '30%';
        
        const dateRange = currentDateRange;
        const data = await getDashboardData(dateRange);
        
        // Apply active filters to export data
        const activeProviderId = document.getElementById('provider-filter')?.value;
        const activeServiceId = document.getElementById('service-filter')?.value;
        const activeClientId = document.getElementById('client-filter')?.value;
        
        let exportUsages = data.usages;
        if (activeClientId) {
            exportUsages = exportUsages.filter(u => u.client_id === parseInt(activeClientId));
        }
        if (activeServiceId) {
            exportUsages = exportUsages.filter(u => u.service_id === parseInt(activeServiceId));
        } else if (activeProviderId) {
            const providerServiceIds = data.services
                .filter(s => s.provider_id === parseInt(activeProviderId))
                .map(s => s.service_id);
            exportUsages = exportUsages.filter(u => providerServiceIds.includes(u.service_id));
        }
        
        // Use filtered usages for export
        data.usages = exportUsages;
        
        progressFill.style.width = '60%';
        progressText.textContent = 'Generating file...';
        
        if (format === 'csv') {
            // ─── CSV EXPORT: "The Analyst's Workbook" ─── 20-column flat file ───
            progressText.textContent = 'Loading reference data...';
            const clientsResponse = await getClients();
            const clients = clientsResponse || [];
            const clientMap = {};
            clients.forEach(c => { clientMap[c.client_id] = c.client_name; });

            progressFill.style.width = '50%';
            progressText.textContent = 'Building cross-provider rate map...';

            // Build cross-provider rate lookup: service_type -> { AWS: rate, Azure: rate, GCP: rate }
            const providerNames = {};
            data.providers.forEach(p => { providerNames[p.provider_id] = p.provider_name; });

            const typeRates = {};
            data.services.forEach(svc => {
                const pName = providerNames[svc.provider_id] || 'Unknown';
                const sType = svc.service_type || 'Unknown';
                if (!typeRates[sType]) {
                    typeRates[sType] = { AWS: null, Azure: null, GCP: null, unit: svc.service_unit || 'unit' };
                }
                const rate = parseFloat(svc.service_cost) || 0;
                if (pName === 'AWS' && (typeRates[sType].AWS === null || rate < typeRates[sType].AWS)) {
                    typeRates[sType].AWS = rate;
                }
                if (pName === 'Azure' && (typeRates[sType].Azure === null || rate < typeRates[sType].Azure)) {
                    typeRates[sType].Azure = rate;
                }
                if (pName === 'GCP' && (typeRates[sType].GCP === null || rate < typeRates[sType].GCP)) {
                    typeRates[sType].GCP = rate;
                }
            });

            progressFill.style.width = '60%';
            progressText.textContent = 'Computing trends and forecasts...';

            // Pre-compute daily cost per client+service for rolling averages and trends
            const dailyMap = {};
            data.usages.forEach(u => {
                const key = u.client_id + '|' + u.service_id;
                if (!dailyMap[key]) dailyMap[key] = {};
                const d = u.usage_date;
                if (!dailyMap[key][d]) dailyMap[key][d] = { units: 0, cost: 0 };
                dailyMap[key][d].units += u.units_used;
                dailyMap[key][d].cost += u.total_cost;
            });

            // Helper: compute 7-day rolling avg and 30-day trend for a client+service on a date
            const computeMetrics = (clientId, serviceId, targetDate) => {
                const key = clientId + '|' + serviceId;
                const dayData = dailyMap[key] || {};
                const allDates = Object.keys(dayData).sort();

                const targetIdx = allDates.indexOf(targetDate);
                if (targetIdx < 0) return { avg7d: 0, trend30d: 0, forecast30d: 0 };

                // 7-day rolling average
                let sum7 = 0, count7 = 0;
                for (let i = Math.max(0, targetIdx - 6); i <= targetIdx; i++) {
                    sum7 += dayData[allDates[i]].cost;
                    count7++;
                }
                const avg7d = count7 > 0 ? sum7 / count7 : 0;

                // 30-day trend: compare last 15 days avg vs prior 15 days avg
                let recentSum = 0, recentCount = 0, priorSum = 0, priorCount = 0;
                for (let i = Math.max(0, targetIdx - 14); i <= targetIdx; i++) {
                    recentSum += dayData[allDates[i]].cost;
                    recentCount++;
                }
                for (let i = Math.max(0, targetIdx - 29); i <= Math.max(0, targetIdx - 15); i++) {
                    priorSum += dayData[allDates[i]].cost;
                    priorCount++;
                }
                const recentAvg = recentCount > 0 ? recentSum / recentCount : 0;
                const priorAvg = priorCount > 0 ? priorSum / priorCount : 0;
                const trend30d = priorAvg > 0 ? ((recentAvg - priorAvg) / priorAvg) * 100 : 0;

                // Forecast: project current daily avg forward 30 days
                const forecast30d = avg7d * 30;

                return { avg7d, trend30d, forecast30d };
            };

            progressFill.style.width = '70%';
            progressText.textContent = 'Building export rows...';

            // Build one row per usage record
            const rows = data.usages
                .sort((a, b) => a.usage_date.localeCompare(b.usage_date) || a.client_id - b.client_id)
                .map(u => {
                    const service = data.services.find(s => s.service_id === u.service_id);
                    const providerName = providerNames[service?.provider_id] || 'Unknown';
                    const serviceType = service?.service_type || 'Unknown';
                    const serviceUnit = service?.service_unit || 'unit';
                    const unitCost = parseFloat(service?.service_cost) || 0;

                    const metrics = computeMetrics(u.client_id, u.service_id, u.usage_date);

                    // Cross-provider rates
                    const rates = typeRates[serviceType] || { AWS: null, Azure: null, GCP: null };
                    const awsRate = rates.AWS !== null ? rates.AWS : '';
                    const azureRate = rates.Azure !== null ? rates.Azure : '';
                    const gcpRate = rates.GCP !== null ? rates.GCP : '';

                    // Cheapest provider for this service type
                    const available = [];
                    if (rates.AWS !== null) available.push({ name: 'AWS', rate: rates.AWS });
                    if (rates.Azure !== null) available.push({ name: 'Azure', rate: rates.Azure });
                    if (rates.GCP !== null) available.push({ name: 'GCP', rate: rates.GCP });
                    available.sort((a, b) => a.rate - b.rate);

                    let cheapest = 'N/A';
                    let switchSavings = 0;
                    if (available.length > 1) {
                        const cheapestRate = available[0].rate;
                        const allSameRate = available.every(a => a.rate === cheapestRate);
                        if (allSameRate) {
                            cheapest = 'Tied';
                        } else {
                            cheapest = available[0].name;
                            switchSavings = u.total_cost - (u.units_used * cheapestRate);
                            if (switchSavings < 0) switchSavings = 0;
                        }
                    } else if (available.length === 1) {
                        cheapest = available[0].name + ' Only';
                    }

                    // Utilization: estimated capacity = units * 1.5 (provisioned headroom)
                    const estimatedCapacity = u.units_used * 1.5;
                    const utilization = estimatedCapacity > 0 ? (u.units_used / estimatedCapacity) : 0;
                    const status = utilization < 0.5 ? 'Underutilized' : (utilization < 0.75 ? 'Review' : 'Optimal');

                    // Est monthly savings
                    const wasteRate = status === 'Underutilized' ? 0.30 : (status === 'Review' ? 0.10 : 0);
                    const estMonthlySavings = metrics.forecast30d * wasteRate;

                    return {
                        'Date': u.usage_date,
                        'Client': clientMap[u.client_id] || 'Unknown',
                        'Provider': providerName,
                        'Service': service?.service_name || 'Unknown',
                        'Service Type': serviceType,
                        'Unit': serviceUnit,
                        'Units Used': u.units_used.toFixed(2),
                        'Unit Cost': unitCost.toFixed(2),
                        'Total Cost': u.total_cost.toFixed(2),
                        'Daily Avg (7d)': metrics.avg7d.toFixed(2),
                        '30d Trend %': (metrics.trend30d >= 0 ? '+' : '') + metrics.trend30d.toFixed(1) + '%',
                        'Forecast 30d': metrics.forecast30d.toFixed(2),
                        'AWS Rate': awsRate !== '' ? awsRate.toFixed(2) : 'N/A',
                        'Azure Rate': azureRate !== '' ? azureRate.toFixed(2) : 'N/A',
                        'GCP Rate': gcpRate !== '' ? gcpRate.toFixed(2) : 'N/A',
                        'Cheapest': cheapest,
                        'Switch Savings': switchSavings.toFixed(2),
                        'Utilization %': (utilization * 100).toFixed(1) + '%',
                        'Status': status,
                        'Est Monthly Savings': estMonthlySavings.toFixed(2),
                    };
                });

            progressFill.style.width = '90%';

            const clientLabel = clientMap[parseInt(document.getElementById('client-filter')?.value)] || 'all-clients';
            exportToCSV(rows, 'cost-workbook-' + clientLabel + '-' + dateRange + 'days-' + new Date().toISOString().split('T')[0] + '.csv');

            progressFill.style.width = '100%';
            progressText.textContent = 'Export complete! ' + rows.length + ' records exported.';

            setTimeout(() => {
                progressDiv.classList.add('hidden');
            }, 2000);

        } else if (format === 'pdf') {
            // ─── PDF EXPORT: Invoice-Style (Finance Persona) ───
            progressFill.style.width = '50%';
            progressText.textContent = 'Loading invoice data...';
            
            try {
                // Fetch invoice and client data
                const [invoices, clientsResponse, budgets] = await Promise.all([
                    getInvoices(),
                    getClients(),
                    getBudgets(),
                ]);
                const clients = clientsResponse || [];
                const clientMap = {};
                clients.forEach(c => { clientMap[c.client_id] = c.client_name; });

                // Determine which client(s) to invoice
                const selectedClientId = document.getElementById('client-filter')?.value;
                let filteredInvoices = selectedClientId
                    ? invoices.filter(inv => inv.client_id === parseInt(selectedClientId))
                    : invoices;

                if (filteredInvoices.length === 0) {
                    showError('No invoices found. Select a client with invoice history.');
                    progressDiv.classList.add('hidden');
                    return;
                }

                progressFill.style.width = '70%';
                progressText.textContent = 'Generating invoice PDF...';

                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const pageWidth = doc.internal.pageSize.getWidth();
                const brandColor = [37, 99, 235];
                const darkGray = [40, 40, 40];
                const midGray = [100, 100, 100];
                const lightGray = [200, 200, 200];

                // Fetch full year of usages for invoice line items (not dashboard's 30-day window)
                const allData = await getDashboardData(365);

                /**
                 * Build invoice line items: aggregate usages by service for a given month.
                 * Returns sorted array (highest cost first) with provider, units, rate, amount.
                 */
                const buildLineItems = (clientId, yearMonth) => {
                    const clientUsages = allData.usages.filter(u =>
                        u.client_id === clientId && u.usage_date.startsWith(yearMonth)
                    );
                    const byService = {};
                    clientUsages.forEach(u => {
                        const service = allData.services.find(s => s.service_id === u.service_id);
                        const provider = allData.providers.find(p => p.provider_id === service?.provider_id);
                        const key = u.service_id;
                        if (!byService[key]) {
                            byService[key] = {
                                provider: provider?.provider_name || 'Unknown',
                                service: service?.service_name || 'Unknown',
                                type: service?.service_type || 'Unknown',
                                unit: service?.service_unit || 'unit',
                                unitCost: parseFloat(service?.service_cost) || 0,
                                totalUnits: 0,
                                totalCost: 0,
                            };
                        }
                        byService[key].totalUnits += u.units_used;
                        byService[key].totalCost += u.total_cost;
                    });
                    return Object.values(byService).sort((a, b) => b.totalCost - a.totalCost);
                };

                // Billing period: December 2025 (current) vs November 2025 (prior)
                // Hardcoded to match seed data date range
                const invoiceMonth = '2025-12';
                const compareMonth = '2025-11';
                const invoiceMonthLabel = 'December 2025';
                const compareMonthLabel = 'November 2025';

                // Group invoices by client for multi-page support
                const clientIds = [...new Set(filteredInvoices.map(inv => inv.client_id))];
                let isFirstPage = true;

                // Generate one invoice page per client
                clientIds.forEach(clientId => {
                    const clientInvoices = filteredInvoices
                        .filter(inv => inv.client_id === clientId)
                        .sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
                    const latestInvoice = clientInvoices[0];
                    const clientName = clientMap[clientId] || 'Unknown Client';
                    const lineItems = buildLineItems(clientId, invoiceMonth);
                    const priorLineItems = buildLineItems(clientId, compareMonth);
                    const priorTotal = priorLineItems.reduce((sum, item) => sum + item.totalCost, 0);

                    if (!isFirstPage) doc.addPage();
                    isFirstPage = false;

                    // ── PDF Header Band (blue stripe with logo text) ──
                    doc.setFillColor(...brandColor);
                    doc.rect(0, 0, pageWidth, 40, 'F');

                    doc.setFontSize(22);
                    doc.setTextColor(255, 255, 255);
                    doc.text('INVOICE', 14, 18);

                    doc.setFontSize(10);
                    doc.text('Cloud Cost Intelligence Platform', 14, 26);
                    doc.text('The Code Collective', 14, 32);

                    // ── Invoice metadata (right-aligned in header) ──
                    doc.setFontSize(9);
                    doc.text('Invoice #: ' + latestInvoice.invoice_id, pageWidth - 14, 18, { align: 'right' });
                    doc.text('Date: ' + latestInvoice.invoice_date, pageWidth - 14, 24, { align: 'right' });
                    doc.text('Generated: ' + new Date().toLocaleDateString(), pageWidth - 14, 30, { align: 'right' });

                    // ── Bill To / Billing Period ──
                    let y = 50;
                    doc.setFontSize(9);
                    doc.setTextColor(...midGray);
                    doc.text('BILL TO', 14, y);
                    doc.setFontSize(12);
                    doc.setTextColor(...darkGray);
                    doc.text(clientName, 14, y + 7);

                    // Invoice period (right side)
                    doc.setFontSize(9);
                    doc.setTextColor(...midGray);
                    doc.text('BILLING PERIOD', pageWidth - 14, y, { align: 'right' });
                    doc.setFontSize(10);
                    doc.setTextColor(...darkGray);
                    doc.text(invoiceMonthLabel, pageWidth - 14, y + 7, { align: 'right' });

                    // ── Amount Due Box with MoM comparison ──
                    y = 70;
                    const usageTotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
                    const momDelta = priorTotal > 0 ? usageTotal - priorTotal : 0;
                    const momPct = priorTotal > 0 ? ((momDelta / priorTotal) * 100).toFixed(1) : 0;
                    const momSign = momDelta >= 0 ? '+' : '';

                    doc.setFillColor(245, 247, 250);
                    doc.roundedRect(14, y, pageWidth - 28, 24, 2, 2, 'F');
                    doc.setFontSize(10);
                    doc.setTextColor(...midGray);
                    doc.text('AMOUNT DUE — ' + invoiceMonthLabel.toUpperCase(), 20, y + 8);
                    doc.setFontSize(16);
                    doc.setTextColor(...darkGray);
                    doc.text(formatCurrency(usageTotal), pageWidth - 20, y + 10, { align: 'right' });
                    // Prior month comparison line
                    doc.setFontSize(8);
                    const momColor = momDelta > 0 ? [220, 53, 69] : [39, 174, 96];
                    doc.setTextColor(...momColor);
                    doc.text(momSign + formatCurrency(momDelta) + ' (' + momSign + momPct + '%) vs ' + compareMonthLabel, pageWidth - 20, y + 18, { align: 'right' });
                    doc.setFontSize(8);
                    doc.setTextColor(...midGray);
                    doc.text(compareMonthLabel + ': ' + formatCurrency(priorTotal), 20, y + 18);

                    // ── Line Items Table (one row per service) ──
                    y = 96;
                    const lineItemRows = lineItems.map(item => [
                        item.provider,
                        item.service,
                        item.type,
                        item.totalUnits.toFixed(1) + ' ' + item.unit,
                        '$' + item.unitCost.toFixed(2) + '/' + item.unit,
                        '$' + item.totalCost.toFixed(2),
                    ]);

                    doc.autoTable({
                        startY: y,
                        head: [['Provider', 'Service', 'Type', 'Usage', 'Rate', 'Amount']],
                        body: lineItemRows,
                        theme: 'grid',
                        headStyles: {
                            fillColor: brandColor,
                            textColor: [255, 255, 255],
                            fontStyle: 'bold',
                            fontSize: 8,
                        },
                        styles: { fontSize: 8, cellPadding: 3 },
                        columnStyles: {
                            0: { cellWidth: 25 },
                            1: { cellWidth: 35 },
                            2: { cellWidth: 30 },
                            3: { cellWidth: 30, halign: 'right' },
                            4: { cellWidth: 25, halign: 'right' },
                            5: { cellWidth: 25, halign: 'right' },
                        },
                        margin: { left: 14, right: 14 },
                    });

                    // ── Totals Section: MoM delta + budget comparison ──
                    let finalY = doc.lastAutoTable.finalY + 5;
                    const clientBudget = getBudgetForClient(budgets, clientId);
                    const budgetAmt = clientBudget ? parseFloat(clientBudget.budget_amount) : 0;
                    const budgetDelta = budgetAmt > 0 ? usageTotal - budgetAmt : 0;

                    const totalsData = [
                        [invoiceMonthLabel + ' Total', '$' + usageTotal.toFixed(2)],
                        [compareMonthLabel + ' Total', '$' + priorTotal.toFixed(2)],
                        ['Month-over-Month Change', momSign + '$' + Math.abs(momDelta).toFixed(2) + ' (' + momSign + momPct + '%)'],
                    ];
                    if (budgetAmt > 0) {
                        totalsData.push(['Monthly Budget', '$' + budgetAmt.toFixed(2)]);
                        if (budgetDelta > 0) {
                            totalsData.push(['Over Budget', '+$' + budgetDelta.toFixed(2)]);
                        } else {
                            totalsData.push(['Under Budget', '-$' + Math.abs(budgetDelta).toFixed(2)]);
                        }
                    }

                    doc.autoTable({
                        startY: finalY,
                        body: totalsData,
                        theme: 'plain',
                        styles: { fontSize: 9, cellPadding: 2 },
                        columnStyles: {
                            0: { cellWidth: 50, fontStyle: 'bold', halign: 'right' },
                            1: { cellWidth: 30, halign: 'right' },
                        },
                        margin: { left: pageWidth - 100 },
                    });

                    // ── Provider Breakdown (mini table if space permits) ──
                    finalY = doc.lastAutoTable.finalY + 10;
                    if (finalY < 240) {
                        doc.setFontSize(11);
                        doc.setTextColor(...darkGray);
                        doc.text('Cost by Provider', 14, finalY);

                        const providerTotals = {};
                        lineItems.forEach(item => {
                            providerTotals[item.provider] = (providerTotals[item.provider] || 0) + item.totalCost;
                        });

                        const providerRows = Object.entries(providerTotals)
                            .sort((a, b) => b[1] - a[1])
                            .map(([name, cost]) => [
                                name,
                                '$' + cost.toFixed(2),
                                usageTotal > 0 ? ((cost / usageTotal) * 100).toFixed(1) + '%' : '0%',
                            ]);

                        doc.autoTable({
                            startY: finalY + 4,
                            head: [['Provider', 'Total', '% of Spend']],
                            body: providerRows,
                            theme: 'striped',
                            headStyles: { fillColor: brandColor, fontSize: 8 },
                            styles: { fontSize: 8 },
                            columnStyles: {
                                1: { halign: 'right' },
                                2: { halign: 'right' },
                            },
                            margin: { left: 14 },
                            tableWidth: 100,
                        });
                    }
                });

                // ── Footer on all pages ──
                const pageCount = doc.internal.getNumberOfPages();
                for (let i = 1; i <= pageCount; i++) {
                    doc.setPage(i);
                    doc.setDrawColor(...lightGray);
                    doc.line(14, doc.internal.pageSize.getHeight() - 16, pageWidth - 14, doc.internal.pageSize.getHeight() - 16);
                    doc.setFontSize(7);
                    doc.setTextColor(150);
                    doc.text(
                        'Page ' + i + ' of ' + pageCount + '  |  Cloud Cost Intelligence Platform  |  \u00a9 2026 The Code Collective',
                        pageWidth / 2,
                        doc.internal.pageSize.getHeight() - 10,
                        { align: 'center' }
                    );
                }

                progressFill.style.width = '100%';
                progressText.textContent = 'Download starting...';

                // Filename reflects client if filtered
                const clientLabel = selectedClientId ? (clientMap[parseInt(selectedClientId)] || 'client') : 'all-clients';
                doc.save('invoice-' + clientLabel + '-' + new Date().toISOString().split('T')[0] + '.pdf');
                
                setTimeout(() => {
                    progressDiv.classList.add('hidden');
                    progressText.textContent = 'Export complete!';
                }, 2000);
                
            } catch (pdfError) {
                console.error('PDF generation error:', pdfError);
                showError('Failed to generate PDF. Please try again.');
                progressDiv.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        showError('Failed to export data. Please try again.');
        document.getElementById('export-progress').classList.add('hidden');
    }
}
