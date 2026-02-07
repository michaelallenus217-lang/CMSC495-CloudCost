/**
 * TC-U-JS-001 through TC-U-JS-015
 * Unit Tests for utils.js functions
 * Tests FR-01, FR-06, FR-08 utility functions
 */

// Import functions by loading the file
const fs = require('fs');
const path = require('path');
const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
eval(utilsCode);

describe('FR-08: Resource Metrics - Utility Functions', () => {
  
  describe('TC-U-JS-001: formatCurrency', () => {
    test('formats positive numbers correctly', () => {
      expect(formatCurrency(1234.56)).toBe('$1,234.56');
    });
    
    test('formats zero correctly', () => {
      expect(formatCurrency(0)).toBe('$0.00');
    });
    
    test('handles null input', () => {
      expect(formatCurrency(null)).toBe('$0.00');
    });
    
    test('handles undefined input', () => {
      expect(formatCurrency(undefined)).toBe('$0.00');
    });
    
    test('formats large numbers with commas', () => {
      expect(formatCurrency(1234567.89)).toBe('$1,234,567.89');
    });
    
    test('rounds to 2 decimal places', () => {
      expect(formatCurrency(123.456)).toBe('$123.46');
    });
  });

  describe('TC-U-JS-002: formatPercentage', () => {
    test('formats decimal as percentage', () => {
      expect(formatPercentage(0.75)).toBe('75%');
    });
    
    test('handles zero', () => {
      expect(formatPercentage(0)).toBe('0%');
    });
    
    test('handles null input', () => {
      expect(formatPercentage(null)).toBe('0%');
    });
    
    test('handles 100%', () => {
      expect(formatPercentage(1.0)).toBe('100%');
    });
    
    test('rounds to nearest integer', () => {
      expect(formatPercentage(0.756)).toBe('76%');
    });
  });

  describe('TC-U-JS-003: sumBy', () => {
    test('sums array values by key', () => {
      const data = [
        { cost: 10 },
        { cost: 20 },
        { cost: 30 },
      ];
      expect(sumBy(data, 'cost')).toBe(60);
    });
    
    test('handles empty array', () => {
      expect(sumBy([], 'cost')).toBe(0);
    });
    
    test('handles missing key', () => {
      const data = [{ other: 10 }];
      expect(sumBy(data, 'cost')).toBe(0);
    });
    
    test('handles mixed valid/invalid values', () => {
      const data = [
        { cost: 10 },
        { cost: null },
        { cost: 20 },
      ];
      expect(sumBy(data, 'cost')).toBe(30);
    });
  });

  describe('TC-U-JS-004: average', () => {
    test('calculates average correctly', () => {
      const data = [
        { value: 10 },
        { value: 20 },
        { value: 30 },
      ];
      expect(average(data, 'value')).toBe(20);
    });
    
    test('handles empty array', () => {
      expect(average([], 'value')).toBe(0);
    });
    
    test('handles single item', () => {
      const data = [{ value: 42 }];
      expect(average(data, 'value')).toBe(42);
    });
  });

  describe('TC-U-JS-005: groupBy', () => {
    test('groups array by key', () => {
      const data = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
      ];
      const result = groupBy(data, 'type');
      expect(Object.keys(result)).toEqual(['A', 'B']);
      expect(result['A'].length).toBe(2);
      expect(result['B'].length).toBe(1);
    });
    
    test('handles empty array', () => {
      const result = groupBy([], 'type');
      expect(result).toEqual({});
    });
  });
});

describe('FR-01: Date Formatting Functions', () => {
  
  describe('TC-U-JS-006: formatDate', () => {
    test('formats ISO date string to readable format', () => {
      const result = formatDate('2026-01-15T12:00:00Z');
      expect(result).toContain('Jan');
      expect(result).toContain('2026');
      // Date may vary by timezone, just verify it returns a formatted string
      expect(result).toMatch(/Jan \d+, 2026/);
    });
    
    test('handles null input', () => {
      expect(formatDate(null)).toBe('N/A');
    });
    
    test('handles undefined input', () => {
      expect(formatDate(undefined)).toBe('N/A');
    });
  });

  describe('TC-U-JS-007: formatDateForApi', () => {
    test('formats date object to YYYY-MM-DD', () => {
      const date = new Date(2026, 0, 15); // Month is 0-indexed
      expect(formatDateForApi(date)).toBe('2026-01-15');
    });
    
    test('pads single digit month and day', () => {
      const date = new Date(2026, 4, 5); // May 5
      expect(formatDateForApi(date)).toBe('2026-05-05');
    });
  });

  describe('TC-U-JS-008: getDaysAgo', () => {
    test('returns date N days in past', () => {
      const today = new Date();
      const result = getDaysAgo(7);
      const diffDays = Math.round((today - result) / (1000 * 60 * 60 * 24));
      expect(diffDays).toBe(7);
    });
    
    test('returns today for 0 days', () => {
      const today = new Date();
      const result = getDaysAgo(0);
      expect(result.toDateString()).toBe(today.toDateString());
    });
  });
  
  describe('TC-U-JS-015: generateDateRange', () => {
    test('generates correct number of dates', () => {
      const result = generateDateRange(7);
      expect(result.length).toBe(7);
    });
    
    test('dates are in YYYY-MM-DD format', () => {
      const result = generateDateRange(3);
      result.forEach(date => {
        expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      });
    });
    
    test('dates are in chronological order', () => {
      const result = generateDateRange(5);
      for (let i = 1; i < result.length; i++) {
        expect(result[i] > result[i-1]).toBe(true);
      }
    });
  });
});

describe('FR-04: Waste Detection Utilities', () => {
  
  describe('TC-U-JS-009: calculateUtilization', () => {
    test('calculates percentage correctly', () => {
      expect(calculateUtilization(50, 100)).toBe(0.5);
    });
    
    test('caps at 100%', () => {
      expect(calculateUtilization(150, 100)).toBe(1.0);
    });
    
    test('handles zero capacity', () => {
      expect(calculateUtilization(50, 0)).toBe(0);
    });
    
    test('handles zero usage', () => {
      expect(calculateUtilization(0, 100)).toBe(0);
    });
  });

  describe('TC-U-JS-010: getWasteLevel', () => {
    test('returns low for utilization < 20%', () => {
      expect(getWasteLevel(0.15)).toBe('low');
    });
    
    test('returns medium for utilization 20-50%', () => {
      expect(getWasteLevel(0.35)).toBe('medium');
    });
    
    test('returns high for utilization >= 50%', () => {
      expect(getWasteLevel(0.75)).toBe('high');
    });
    
    test('boundary: exactly 20% is medium', () => {
      expect(getWasteLevel(0.20)).toBe('medium');
    });
    
    test('boundary: exactly 50% is high', () => {
      expect(getWasteLevel(0.50)).toBe('high');
    });
  });
});

describe('FR-06: Export Functions', () => {
  
  describe('TC-U-JS-011: exportToCSV structure', () => {
    beforeEach(() => {
      // Mock URL and DOM APIs
      global.URL.createObjectURL = jest.fn(() => 'mock-url');
      global.URL.revokeObjectURL = jest.fn();
      document.body.appendChild = jest.fn();
      document.body.removeChild = jest.fn();
    });
    
    test('handles empty data gracefully', () => {
      // Should not throw
      expect(() => exportToCSV([], 'test.csv')).not.toThrow();
    });
    
    test('handles null data gracefully', () => {
      expect(() => exportToCSV(null, 'test.csv')).not.toThrow();
    });
  });
});

describe('TC-U-JS-012: Input Validation', () => {
  
  describe('isValidEmail', () => {
    test('accepts valid email', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
    });
    
    test('accepts email with subdomain', () => {
      expect(isValidEmail('user@mail.example.com')).toBe(true);
    });
    
    test('rejects invalid email - no @', () => {
      expect(isValidEmail('testexample.com')).toBe(false);
    });
    
    test('rejects invalid email - no domain', () => {
      expect(isValidEmail('test@')).toBe(false);
    });
    
    test('rejects invalid email - spaces', () => {
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });
});

describe('TC-U-JS-013: String Utilities', () => {
  
  describe('truncate', () => {
    test('truncates long string', () => {
      expect(truncate('Hello World', 5)).toBe('Hello...');
    });
    
    test('returns short string unchanged', () => {
      expect(truncate('Hi', 10)).toBe('Hi');
    });
    
    test('handles null input', () => {
      expect(truncate(null, 5)).toBe(null);
    });
    
    test('handles exact length', () => {
      expect(truncate('Hello', 5)).toBe('Hello');
    });
    
    test('handles empty string', () => {
      expect(truncate('', 5)).toBe('');
    });
  });
});

describe('TC-U-JS-014: Number Formatting', () => {
  
  describe('formatNumber', () => {
    test('adds commas to large numbers', () => {
      expect(formatNumber(1234567)).toBe('1,234,567');
    });
    
    test('handles null', () => {
      expect(formatNumber(null)).toBe('0');
    });
    
    test('handles undefined', () => {
      expect(formatNumber(undefined)).toBe('0');
    });
    
    test('handles small numbers', () => {
      expect(formatNumber(42)).toBe('42');
    });
    
    test('handles zero', () => {
      expect(formatNumber(0)).toBe('0');
    });
  });
});
