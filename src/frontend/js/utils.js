/**
 * File: utils.js
 * Project: Cloud Cost Intelligence Platform
 * Author: Ishan (Frontend Lead)
 * Created: January 2026
 * Description: Utility functions. Provides formatting helpers for currency,
 *              dates, and data transformations used across the frontend.
 */

// Date formatting utilities
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC'
    });
}

function formatDateTime(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Currency formatting
function formatCurrency(amount) {
    if (amount === null || amount === undefined) return '$0.00';
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount);
}

// Percentage formatting
function formatPercentage(value) {
    if (value === null || value === undefined) return '0%';
    return `${Math.round(value * 100)}%`;
}

// Number formatting with commas
function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return new Intl.NumberFormat('en-US').format(num);
}

// Get date N days ago
function getDaysAgo(days) {
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date;
}

// Format date for API (YYYY-MM-DD)
function formatDateForApi(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Generate date range array
function generateDateRange(days) {
    const dates = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        dates.push(formatDateForApi(date));
    }
    
    return dates;
}

// Group array by key
function groupBy(array, key) {
    return array.reduce((result, item) => {
        const groupKey = item[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(item);
        return result;
    }, {});
}

// Sum array values by key
function sumBy(array, key) {
    return array.reduce((sum, item) => sum + (parseFloat(item[key]) || 0), 0);
}

// Calculate average
function average(array, key) {
    if (array.length === 0) return 0;
    return sumBy(array, key) / array.length;
}

// Debounce function for search/filter inputs
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Show error message
function showError(message, retryCallback = null) {
    const errorDisplay = document.getElementById('error-display');
    const errorMessage = errorDisplay.querySelector('.error-message');
    const retryButton = errorDisplay.querySelector('.btn-retry');
    const dismissButton = errorDisplay.querySelector('.btn-dismiss');
    
    errorMessage.textContent = message;
    errorDisplay.classList.remove('hidden');
    
    // Handle retry button
    if (retryCallback) {
        retryButton.style.display = 'inline-block';
        retryButton.onclick = () => {
            errorDisplay.classList.add('hidden');
            retryCallback();
        };
    } else {
        retryButton.style.display = 'none';
    }
    
    // Handle dismiss button
    dismissButton.onclick = () => {
        errorDisplay.classList.add('hidden');
    };
    
    // Auto-dismiss after 10 seconds
    setTimeout(() => {
        errorDisplay.classList.add('hidden');
    }, 10000);
}

// Hide error message
function hideError() {
    const errorDisplay = document.getElementById('error-display');
    errorDisplay.classList.add('hidden');
}

// Show loading state
function showLoading(elementId, message = 'Loading...') {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = `<div class="loading">${message}</div>`;
    }
}

// Local storage helpers
function saveToStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Error saving to localStorage:', e);
    }
}

function loadFromStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (e) {
        console.error('Error loading from localStorage:', e);
        return defaultValue;
    }
}

// Calculate utilization percentage from units used
function calculateUtilization(unitsUsed, maxCapacity = 100) {
    if (!maxCapacity || maxCapacity === 0) return 0;
    return Math.min(unitsUsed / maxCapacity, 1.0);
}

// Determine waste level based on utilization
function getWasteLevel(utilization) {
    if (utilization < 0.20) return 'low';
    if (utilization < 0.50) return 'medium';
    return 'high';
}

// Generate random color for charts
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Validate email
function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Truncate text
function truncate(str, length) {
    if (!str || str.length <= length) return str;
    return str.substring(0, length) + '...';
}

// Export data to CSV
function exportToCSV(data, filename) {
    if (!data || data.length === 0) {
        showError('No data to export');
        return;
    }
    
    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Build CSV content
    let csv = headers.join(',') + '\n';
    
    data.forEach(row => {
        const values = headers.map(header => {
            const value = row[header];
            // Escape values that contain commas or quotes
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        });
        csv += values.join(',') + '\n';
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
}
// Format "LastFirst" client names as "First Last"
function formatClientName(name) {
    if (!name) return 'N/A';
    const parts = name.match(/[A-Z][a-z]+/g);
    if (parts && parts.length >= 2) {
        return parts.slice(1).join(' ') + ' ' + parts[0];
    }
    return name;
}
