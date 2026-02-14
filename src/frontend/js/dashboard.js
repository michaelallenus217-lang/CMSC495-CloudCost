/**
 * File: dashboard.js
 * Project: Cloud Cost Intelligence Platform
 * Author: Ishan (Frontend Lead)
 * Created: January 2026
 * Description: Main dashboard logic. Initializes charts, handles user
 *              interactions, and renders cost data visualizations.
 */

// Main Dashboard Logic & Chart.js Integration (uses global functions from other files)

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

// Load Dashboard
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

// Populate filter dropdowns
async function populateFilters(services = null, providers = null) {
    try {
        // Get data if not provided
        if (!services || !providers) {
            const [servicesResponse, providersResponse, clientsResponse] = await Promise.all([
                getServices(),
                getProviders(),
                getClients(),
            ]);
            services = servicesResponse.services || [];
            providers = providersResponse.providers || [];
            const clients = clientsResponse || [];
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

// Apply filters - FULL IMPLEMENTATION
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
            // Reload waste/recommendations if active
            const activePage = document.querySelector('.nav-link.active')?.dataset.page;
            if (activePage === 'waste') await loadWasteAlerts();
            if (activePage === 'recommendations') await loadRecommendations();
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
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showError('Failed to apply filters. Please try again.');
    }
}

// Calculate dashboard metrics from filtered usages
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

// Update UI without re-fetching data
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

// Update service filter options based on selected provider (cascading filter)
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

// Update the active filter count badge in the navbar
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

// Render Trend Chart using Chart.js
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

// Load Waste Alerts with sorting
async function loadWasteAlerts() {
    try {
        hideError();
        const alertsBody = document.getElementById('waste-alerts-body');
        alertsBody.innerHTML = '<tr><td colspan="7" class="loading">Loading waste alerts...</td></tr>';
        
        // Read global filters
        const filters = {
            providerId: document.getElementById('provider-filter')?.value || '',
            serviceId: document.getElementById('service-filter')?.value || '',
            clientId: document.getElementById('client-filter')?.value || '',
        };
        
        const alerts = await getWasteAlerts(filters);
        
        if (alerts.length === 0) {
            alertsBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem; color: #10b981;">No waste detected! Your resources are well-optimized.</td></tr>';
            return;
        }
        
        // Store alerts data globally for sorting
        wasteAlertsData = alerts;
        
        // Setup sort handlers (only once)
        setupWasteAlertsSorting();
        
        // Render with default sort
        renderWasteAlertsTable(wasteAlertsData);
        
    } catch (error) {
        console.error('Error loading waste alerts:', error);
        showError('Failed to load waste alerts. Please try again.', loadWasteAlerts);
    }
}

// Setup sorting click handlers
function setupWasteAlertsSorting() {
    const sortableHeaders = document.querySelectorAll('.alerts-table .sortable');
    
    // Remove existing listeners to avoid duplicates
    sortableHeaders.forEach(header => {
        const newHeader = header.cloneNode(true);
        header.parentNode.replaceChild(newHeader, header);
    });
    
    // Add new listeners
    document.querySelectorAll('.alerts-table .sortable').forEach(header => {
        header.addEventListener('click', () => {
            const sortColumn = header.dataset.sort;
            
            // Toggle direction if clicking same column
            if (sortColumn === currentSortColumn) {
                currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                // New column - default to descending for numbers, ascending for text
                currentSortColumn = sortColumn;
                currentSortDirection = ['service_name', 'provider_name'].includes(sortColumn) ? 'asc' : 'desc';
            }
            
            // Sort and re-render
            const sortedData = sortWasteAlerts(wasteAlertsData, currentSortColumn, currentSortDirection);
            renderWasteAlertsTable(sortedData);
            updateSortIndicators();
        });
    });
    
    // Set initial sort indicators
    updateSortIndicators();
}

// Sort waste alerts by column
function sortWasteAlerts(alerts, column, direction) {
    const sorted = [...alerts].sort((a, b) => {
        let valA, valB;
        
        switch (column) {
            case 'service_name':
            case 'provider_name':
                valA = a[column].toLowerCase();
                valB = b[column].toLowerCase();
                return direction === 'asc' 
                    ? valA.localeCompare(valB)
                    : valB.localeCompare(valA);
            
            case 'utilization':
            case 'daily_cost':
            case 'potential_savings':
                valA = a[column];
                valB = b[column];
                return direction === 'asc' 
                    ? valA - valB
                    : valB - valA;
            
            default:
                return 0;
        }
    });
    
    return sorted;
}

// Update sort indicator arrows
function updateSortIndicators() {
    // Remove all sorted classes
    document.querySelectorAll('.alerts-table .sortable').forEach(header => {
        header.classList.remove('sorted', 'asc', 'desc');
    });
    
    // Add sorted class to current column
    const currentHeader = document.querySelector(`.alerts-table .sortable[data-sort="${currentSortColumn}"]`);
    if (currentHeader) {
        currentHeader.classList.add('sorted', currentSortDirection);
    }
}

// Render waste alerts table
function renderWasteAlertsTable(alerts) {
    const alertsBody = document.getElementById('waste-alerts-body');
    alertsBody.innerHTML = '';
    
    alerts.forEach(alert => {
        const row = document.createElement('tr');
        
        const utilizationClass = alert.utilization < 0.2 ? 'utilization-low' : 'utilization-medium';
        
        row.innerHTML = `
            <td>${alert.service_name}</td>
            <td>${alert.provider_name}</td>
            <td>Multiple</td>
            <td><span class="utilization-badge ${utilizationClass}">${formatPercentage(alert.utilization)}</span></td>
            <td>${formatCurrency(alert.daily_cost)}</td>
            <td style="color: var(--success-color); font-weight: 600;">${formatCurrency(alert.potential_savings)}/mo</td>
            <td><button class="btn-action" onclick="viewWasteAlertDetails(${alert.service_id})">View Details</button></td>
        `;
        
        alertsBody.appendChild(row);
    });
}

// Placeholder for details view (Phase II Priority 2 if needed)
function viewWasteAlertDetails(serviceId) {
    const alert = wasteAlertsData.find(a => a.service_id === serviceId);
    if (alert) {
        console.log('View details for:', alert);
        showError(`Details view: ${alert.service_name} - ${formatPercentage(alert.utilization)} utilization, save ${formatCurrency(alert.potential_savings)}/month`);
    }
}

// Load Recommendations
async function loadRecommendations() {
    try {
        hideError();
        const container = document.getElementById('recommendations-container');
        container.innerHTML = '<div class="loading">Loading recommendations...</div>';
        
        // Read global filters
        const filters = {
            providerId: document.getElementById('provider-filter')?.value || '',
            serviceId: document.getElementById('service-filter')?.value || '',
            clientId: document.getElementById('client-filter')?.value || '',
        };
        
        const recommendations = await getRecommendations(filters);
        
        if (recommendations.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-secondary);">No optimization recommendations at this time.</p>';
            return;
        }
        
        container.innerHTML = '';
        recommendations.forEach(rec => {
            const card = document.createElement('div');
            card.className = 'recommendation-card';
            card.innerHTML = `
                <h4>${rec.title}</h4>
                <p>${rec.description}</p>
                <div class="config-display">
                    <strong>Current:</strong> ${rec.current_config}
                </div>
                <div class="config-display">
                    <strong>Suggested:</strong> ${rec.suggested_config}
                </div>
                <div class="savings-amount">
                    💰 Save ${formatCurrency(rec.monthly_savings)}/month
                </div>
                <button class="btn-implement">Implement</button>
            `;
            container.appendChild(card);
        });
    } catch (error) {
        console.error('Error loading recommendations:', error);
        showError('Failed to load recommendations. Please try again.', loadRecommendations);
    }
}

// Load Settings
async function loadSettings() {
    try {
        hideError();
        // Populate client dropdown if not already done
        await populateFilters();
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

// Save Budget Settings (Event Handler)
async function handleSaveBudgetSettings() {
    try {
        const clientId = document.getElementById('client-filter').value;
        const budgetAmount = parseFloat(document.getElementById('budget-amount').value);
        const monthlyLimit = parseFloat(document.getElementById('monthly-limit').value);
        const alertThreshold = parseInt(document.getElementById('alert-threshold').value);
        const alertEnabled = document.getElementById('enable-alerts').checked;
        
        // Validation
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
        
        const budgetData = {
            client_id: parseInt(clientId),
            budget_amount: budgetAmount,
            monthly_limit: monthlyLimit,
            alert_threshold: alertThreshold,
            alert_enabled: alertEnabled,
        };
        
        // Call the API function from api.js (not this function!)
        const result = await window.saveBudgetSettings(budgetData);
        
        if (result.status === 'ok') {
            alert('Budget settings saved successfully!');
            // Clear form
            document.getElementById('budget-amount').value = '';
            document.getElementById('monthly-limit').value = '';
        }
    } catch (error) {
        console.error('Error saving budget settings:', error);
        showError('Budget save requires backend POST /budgets endpoint (not yet implemented). Please contact the Backend Lead.');
    }
}

// Export Data
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
            // Fetch client lookup for IT manager report
            progressText.textContent = 'Loading client data...';
            const clientsResponse = await getClients();
            const clients = clientsResponse || [];
            const clientMap = {};
            clients.forEach(c => { clientMap[c.client_id] = c.client_name; });

            progressFill.style.width = '50%';
            progressText.textContent = 'Building cost analysis report...';

            // Build service-level daily aggregation for IT manager view
            // Group by: date + client + provider + service
            const aggregation = {};
            data.usages.forEach(u => {
                const service = data.services.find(s => s.service_id === u.service_id);
                const provider = data.providers.find(p => p.provider_id === service?.provider_id);
                const key = `${u.usage_date}|${u.client_id}|${u.service_id}`;

                if (!aggregation[key]) {
                    aggregation[key] = {
                        date: u.usage_date,
                        clientName: clientMap[u.client_id] || 'Unknown',
                        providerName: provider?.provider_name || 'Unknown',
                        serviceName: service?.service_name || 'Unknown',
                        serviceType: service?.service_type || 'Unknown',
                        serviceUnit: service?.service_unit || 'unit',
                        unitCost: parseFloat(service?.service_cost) || 0,
                        totalUnits: 0,
                        totalCost: 0,
                        recordCount: 0,
                    };
                }
                aggregation[key].totalUnits += u.units_used;
                aggregation[key].totalCost += u.total_cost;
                aggregation[key].recordCount += 1;
            });

            progressFill.style.width = '70%';

            // Convert to sorted array and compute utilization + waste
            const rows = Object.values(aggregation)
                .sort((a, b) => a.date.localeCompare(b.date) || a.clientName.localeCompare(b.clientName))
                .map(row => {
                    // Utilization: ratio of actual cost to potential cost at full unit usage
                    // Estimated capacity = units * 1.5 (assumed provisioned headroom)
                    const estimatedCapacity = row.totalUnits * 1.5;
                    const utilization = estimatedCapacity > 0 ? (row.totalUnits / estimatedCapacity) : 0;
                    const wasteFlag = utilization < 0.5 ? 'Underutilized' : (utilization < 0.75 ? 'Review' : 'Optimal');
                    const potentialSavings = wasteFlag === 'Underutilized' ? row.totalCost * 0.30 :
                                            wasteFlag === 'Review' ? row.totalCost * 0.10 : 0;

                    return {
                        'Date': row.date,
                        'Client': row.clientName,
                        'Provider': row.providerName,
                        'Service': row.serviceName,
                        'Service Type': row.serviceType,
                        'Units Used': row.totalUnits.toFixed(2),
                        'Unit': row.serviceUnit,
                        'Unit Cost ($)': row.unitCost.toFixed(2),
                        'Total Cost ($)': row.totalCost.toFixed(2),
                        'Utilization (%)': (utilization * 100).toFixed(1),
                        'Status': wasteFlag,
                        'Est. Savings ($)': potentialSavings.toFixed(2),
                    };
                });

            progressFill.style.width = '90%';

            exportToCSV(rows, `cost-analysis-report-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`);
            
            progressFill.style.width = '100%';
            progressText.textContent = `Export complete! ${rows.length} records exported.`;
            
            setTimeout(() => {
                progressDiv.classList.add('hidden');
            }, 2000);
        } else if (format === 'pdf') {
            // Invoice-Style PDF Export (Finance Persona)
            progressFill.style.width = '50%';
            progressText.textContent = 'Loading invoice data...';
            
            try {
                // Fetch invoice and client data
                const [invoices, clientsResponse] = await Promise.all([
                    getInvoices(),
                    getClients(),
                ]);
                const clients = clientsResponse || [];
                const clientMap = {};
                clients.forEach(c => { clientMap[c.client_id] = c.client_name; });

                // Determine which client(s) to invoice
                const selectedClientId = document.getElementById('client-filter')?.value;
                const filteredInvoices = selectedClientId
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

                // Aggregate line items from usages by service for each client
                const buildLineItems = (clientId) => {
                    const clientUsages = data.usages.filter(u => u.client_id === clientId);
                    const byService = {};
                    clientUsages.forEach(u => {
                        const service = data.services.find(s => s.service_id === u.service_id);
                        const provider = data.providers.find(p => p.provider_id === service?.provider_id);
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

                // Group invoices by client for multi-page support
                const clientIds = [...new Set(filteredInvoices.map(inv => inv.client_id))];
                let isFirstPage = true;

                clientIds.forEach(clientId => {
                    const clientInvoices = filteredInvoices
                        .filter(inv => inv.client_id === clientId)
                        .sort((a, b) => b.invoice_date.localeCompare(a.invoice_date));
                    const latestInvoice = clientInvoices[0];
                    const clientName = clientMap[clientId] || 'Unknown Client';
                    const lineItems = buildLineItems(clientId);

                    if (!isFirstPage) doc.addPage();
                    isFirstPage = false;

                    // Header band
                    doc.setFillColor(...brandColor);
                    doc.rect(0, 0, pageWidth, 40, 'F');

                    doc.setFontSize(22);
                    doc.setTextColor(255, 255, 255);
                    doc.text('INVOICE', 14, 18);

                    doc.setFontSize(10);
                    doc.text('Cloud Cost Intelligence Platform', 14, 26);
                    doc.text('The Code Collective', 14, 32);

                    // Invoice meta (right side)
                    doc.setFontSize(9);
                    doc.text('Invoice #: ' + latestInvoice.invoice_id, pageWidth - 14, 18, { align: 'right' });
                    doc.text('Date: ' + latestInvoice.invoice_date, pageWidth - 14, 24, { align: 'right' });
                    doc.text('Generated: ' + new Date().toLocaleDateString(), pageWidth - 14, 30, { align: 'right' });

                    // Bill To
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
                    doc.text('INVOICE PERIOD', pageWidth - 14, y, { align: 'right' });
                    const invoiceDates = clientInvoices.map(inv => inv.invoice_date).sort();
                    doc.setFontSize(10);
                    doc.setTextColor(...darkGray);
                    doc.text(invoiceDates[0] + ' to ' + invoiceDates[invoiceDates.length - 1], pageWidth - 14, y + 7, { align: 'right' });

                    // Invoice Amount Box
                    y = 70;
                    const invoiceTotal = clientInvoices.reduce((sum, inv) => sum + parseFloat(inv.invoice_amount), 0);
                    doc.setFillColor(245, 247, 250);
                    doc.roundedRect(14, y, pageWidth - 28, 18, 2, 2, 'F');
                    doc.setFontSize(10);
                    doc.setTextColor(...midGray);
                    doc.text('AMOUNT DUE', 20, y + 8);
                    doc.setFontSize(16);
                    doc.setTextColor(...darkGray);
                    doc.text(formatCurrency(invoiceTotal), pageWidth - 20, y + 12, { align: 'right' });

                    // Line Items Table
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

                    // Totals Section
                    let finalY = doc.lastAutoTable.finalY + 5;
                    const usageTotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
                    const potentialSavings = usageTotal * 0.15;

                    const totalsData = [
                        ['Subtotal (Usage)', '$' + usageTotal.toFixed(2)],
                        ['Invoice Amount', '$' + invoiceTotal.toFixed(2)],
                        ['Est. Optimization Savings', '-$' + potentialSavings.toFixed(2)],
                    ];

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

                    // Provider Breakdown
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

                // Footer on all pages
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