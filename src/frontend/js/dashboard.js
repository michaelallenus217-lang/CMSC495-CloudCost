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
            await loadDashboard();
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
    document.getElementById('refresh-button')?.addEventListener('click', () => {
        loadDashboard();
    });
    
    // Date range selector
    document.getElementById('date-range-selector')?.addEventListener('change', (e) => {
        currentDateRange = parseInt(e.target.value);
        unfilteredDashboardData = null; // Clear cache when date range changes
        loadDashboard();
    });
    
    // Filter buttons
    document.getElementById('apply-filters')?.addEventListener('click', applyFilters);
    document.getElementById('clear-filters')?.addEventListener('click', clearFilters);
    
    // Provider filter cascading (optional enhancement)
    document.getElementById('provider-filter')?.addEventListener('change', (e) => {
        updateServiceFilterOptions(e.target.value);
    });
    
    // Budget settings
    document.getElementById('alert-threshold')?.addEventListener('input', (e) => {
        document.getElementById('threshold-value').textContent = e.target.value + '%';
    });
    
    document.getElementById('save-settings')?.addEventListener('click', saveBudgetSettings);
    document.getElementById('cancel-settings')?.addEventListener('click', () => {
        navigateToPage('dashboard');
    });
    
    // Export buttons
    document.getElementById('export-csv')?.addEventListener('click', () => exportData('csv'));
    document.getElementById('export-pdf')?.addEventListener('click', () => exportData('pdf'));
}

// Load Dashboard
async function loadDashboard() {
    try {
        hideError();
        
        // Show loading state
        document.getElementById('total-cost').textContent = 'Loading...';
        document.getElementById('aws-cost').textContent = 'Loading...';
        document.getElementById('azure-cost').textContent = 'Loading...';
        document.getElementById('potential-savings').textContent = 'Loading...';
        
        // Fetch dashboard data
        const data = await getDashboardData(currentDateRange);
        
        // Cache the unfiltered data for filtering
        unfilteredDashboardData = data;
        
        // Update UI
        updateDashboardUI(data);
        
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
            const clients = clientsResponse.clients || [];
            
            // Populate clients dropdown in settings
            const clientSelect = document.getElementById('client-select');
            if (clientSelect) {
                clientSelect.innerHTML = '<option value="">Select a client</option>';
                clients.forEach(client => {
                    const option = document.createElement('option');
                    option.value = client.client_id;
                    option.textContent = client.client_name;
                    clientSelect.appendChild(option);
                });
            }
        }
        
        // Populate service filter
        const serviceFilter = document.getElementById('service-filter');
        if (serviceFilter && services.length > 0) {
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
        }
        
        // Populate client filter
        const clientFilter = document.getElementById('client-filter');
        if (clientFilter) {
            const clientsResponse = await getClients();
            const clients = clientsResponse.clients || [];
            
            clientFilter.innerHTML = '<option value="">All Clients</option>';
            clients.forEach(client => {
                const option = document.createElement('option');
                option.value = client.client_id;
                option.textContent = client.client_name;
                clientFilter.appendChild(option);
            });
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
        
        // If no filters selected, reload full dashboard
        if (!providerId && !serviceId && !clientId) {
            await loadDashboard();
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
        }
        
        // Filter by service (and implicitly by provider since services belong to providers)
        if (serviceId) {
            filteredUsages = filteredUsages.filter(u => u.service_id === parseInt(serviceId));
        } else if (providerId) {
            // If no service selected but provider is selected, filter by provider
            const providerServices = unfilteredDashboardData.services
                .filter(s => s.provider_id === parseInt(providerId))
                .map(s => s.service_id);
            filteredUsages = filteredUsages.filter(u => providerServices.includes(u.service_id));
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
        
        console.log(`Filtered to ${filteredUsages.length} usage records out of ${unfilteredDashboardData.usages.length} total`);
        
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
    
    // Update potential savings (estimate 15% of total)
    const potentialSavings = data.totalCost * 0.15;
    document.getElementById('potential-savings').textContent = formatCurrency(potentialSavings);
    
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
    document.getElementById('provider-filter').value = '';
    document.getElementById('service-filter').value = '';
    document.getElementById('client-filter').value = '';
    
    // Clear the cached unfiltered data to force fresh load
    unfilteredDashboardData = null;
    
    loadDashboard();
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
    
    // Create new chart
    dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Total Cost',
                    data: totalData,
                    borderColor: CHART_COLORS.PRIMARY,
                    backgroundColor: CHART_COLORS.PRIMARY + '20',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                },
                {
                    label: 'AWS',
                    data: awsData,
                    borderColor: CHART_COLORS.AWS,
                    backgroundColor: CHART_COLORS.AWS + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                },
                {
                    label: 'Azure',
                    data: azureData,
                    borderColor: CHART_COLORS.AZURE,
                    backgroundColor: CHART_COLORS.AZURE + '20',
                    borderWidth: 2,
                    fill: false,
                    tension: 0.4,
                },
            ]
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
        
        const alerts = await getWasteAlerts();
        
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
        
        const recommendations = await getRecommendations();
        
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

// Save Budget Settings
async function saveBudgetSettings() {
    try {
        const clientId = document.getElementById('client-select').value;
        const budgetAmount = parseFloat(document.getElementById('budget-amount').value);
        const monthlyLimit = parseFloat(document.getElementById('monthly-limit').value);
        const alertThreshold = parseInt(document.getElementById('alert-threshold').value);
        const alertEnabled = document.getElementById('enable-alerts').checked;
        
        // Validation
        if (!clientId) {
            showError('Please select a client');
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
        
        const result = await saveBudgetSettings(budgetData);
        
        if (result.status === 'ok') {
            alert('Budget settings saved successfully!');
            // Clear form
            document.getElementById('client-select').value = '';
            document.getElementById('budget-amount').value = '';
            document.getElementById('monthly-limit').value = '';
        }
    } catch (error) {
        console.error('Error saving budget settings:', error);
        showError('Failed to save budget settings. Please try again.');
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
        
        const dateRange = parseInt(document.getElementById('export-date-range').value);
        const data = await getDashboardData(dateRange);
        
        progressFill.style.width = '60%';
        progressText.textContent = 'Generating file...';
        
        if (format === 'csv') {
            const exportData = data.usages.map(u => {
                const service = data.services.find(s => s.service_id === u.service_id);
                const provider = data.providers.find(p => p.provider_id === service?.provider_id);
                
                return {
                    Date: u.usage_date,
                    Provider: provider?.provider_name || 'Unknown',
                    Service: service?.service_name || 'Unknown',
                    'Units Used': u.units_used,
                    Cost: u.total_cost,
                };
            });
            
            progressFill.style.width = '90%';
            
            exportToCSV(exportData, `cloud-costs-${dateRange}days-${new Date().toISOString().split('T')[0]}.csv`);
            
            progressFill.style.width = '100%';
            progressText.textContent = 'Export complete!';
            
            setTimeout(() => {
                progressDiv.classList.add('hidden');
            }, 2000);
        } else if (format === 'pdf') {
            showError('PDF export coming soon!');
            progressDiv.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error exporting data:', error);
        showError('Failed to export data. Please try again.');
        document.getElementById('export-progress').classList.add('hidden');
    }
}