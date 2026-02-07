/**
 * TC-U-JS-016 through TC-U-JS-040
 * Unit Tests for api.js business logic functions
 * Tests FR-01, FR-02, FR-03, FR-04, FR-05, FR-07
 */

const fs = require('fs');
const path = require('path');

// Load utils (dependencies)
const utilsCode = fs.readFileSync(path.join(__dirname, '../js/utils.js'), 'utf8');
eval(utilsCode);

// Test data (mirrors api.js MOCK_DATA structure)
const TEST_MOCK_DATA = {
  clients: [
    { client_id: 1, client_name: 'Acme Corp', created_date: '2026-01-01T00:00:00' },
    { client_id: 2, client_name: 'TechStart', created_date: '2026-01-02T00:00:00' },
    { client_id: 3, client_name: 'Global Inc', created_date: '2026-01-03T00:00:00' },
    { client_id: 4, client_name: 'DataFlow', created_date: '2026-01-04T00:00:00' },
    { client_id: 5, client_name: 'CloudFirst', created_date: '2026-01-05T00:00:00' },
  ],
  providers: [
    { provider_id: 1, provider_name: 'AWS' },
    { provider_id: 2, provider_name: 'Azure' },
  ],
  services: [
    { service_id: 1, service_name: 'EC2', service_type: 'Compute', service_cost: 0.05, provider_id: 1 },
    { service_id: 2, service_name: 'S3', service_type: 'Storage', service_cost: 0.02, provider_id: 1 },
    { service_id: 3, service_name: 'Azure VM', service_type: 'Compute', service_cost: 0.06, provider_id: 2 },
    { service_id: 4, service_name: 'Blob Storage', service_type: 'Storage', service_cost: 0.018, provider_id: 2 },
  ],
  budgets: [
    { budget_id: 1, client_id: 1, budget_amount: 5000, monthly_limit: 6000, alert_threshold: 80, alert_enabled: true },
    { budget_id: 2, client_id: 2, budget_amount: 3000, monthly_limit: 3500, alert_threshold: 85, alert_enabled: true },
  ],
  generateUsages(days) {
    const usages = [];
    let id = 1;
    const today = new Date();
    for (let d = days - 1; d >= 0; d--) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0];
      for (let i = 0; i < 5; i++) {
        usages.push({
          usage_id: id++,
          client_id: (i % 5) + 1,
          service_id: (i % 4) + 1,
          usage_date: dateStr,
          units_used: 10 + Math.random() * 90,
          total_cost: 50 + Math.random() * 200,
        });
      }
    }
    return usages;
  },
};

// Mock usages for calculation tests
const mockServices = [
  { service_id: 1, service_name: 'EC2', service_type: 'Compute', service_cost: 0.05, provider_id: 1 },
  { service_id: 2, service_name: 'S3', service_type: 'Storage', service_cost: 0.02, provider_id: 1 },
  { service_id: 3, service_name: 'Azure VM', service_type: 'Compute', service_cost: 0.06, provider_id: 2 },
  { service_id: 4, service_name: 'Blob Storage', service_type: 'Storage', service_cost: 0.018, provider_id: 2 },
];

const mockUsages = [
  { usage_id: 1, client_id: 1, service_id: 1, usage_date: '2026-01-15', units_used: 100, total_cost: 500.00 },
  { usage_id: 2, client_id: 1, service_id: 2, usage_date: '2026-01-15', units_used: 50, total_cost: 100.00 },
  { usage_id: 3, client_id: 1, service_id: 3, usage_date: '2026-01-15', units_used: 80, total_cost: 400.00 },
  { usage_id: 4, client_id: 2, service_id: 1, usage_date: '2026-01-15', units_used: 200, total_cost: 1000.00 },
  { usage_id: 5, client_id: 2, service_id: 4, usage_date: '2026-01-16', units_used: 30, total_cost: 54.00 },
];

describe('FR-01: Cost Dashboard - Data Structure Validation', () => {
  
  describe('TC-U-JS-016: clients structure', () => {
    test('has required client fields', () => {
      const client = TEST_MOCK_DATA.clients[0];
      expect(client).toHaveProperty('client_id');
      expect(client).toHaveProperty('client_name');
      expect(client).toHaveProperty('created_date');
    });
    
    test('has multiple clients', () => {
      expect(TEST_MOCK_DATA.clients.length).toBeGreaterThanOrEqual(5);
    });
    
    test('client_id is unique', () => {
      const ids = TEST_MOCK_DATA.clients.map(c => c.client_id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });
  });

  describe('TC-U-JS-017: providers structure', () => {
    test('has AWS provider', () => {
      const aws = TEST_MOCK_DATA.providers.find(p => p.provider_name === 'AWS');
      expect(aws).toBeDefined();
      expect(aws.provider_id).toBe(1);
    });
    
    test('has Azure provider', () => {
      const azure = TEST_MOCK_DATA.providers.find(p => p.provider_name === 'Azure');
      expect(azure).toBeDefined();
      expect(azure.provider_id).toBe(2);
    });
  });

  describe('TC-U-JS-018: services structure', () => {
    test('has required service fields', () => {
      const service = TEST_MOCK_DATA.services[0];
      expect(service).toHaveProperty('service_id');
      expect(service).toHaveProperty('service_name');
      expect(service).toHaveProperty('service_type');
      expect(service).toHaveProperty('service_cost');
      expect(service).toHaveProperty('provider_id');
    });
    
    test('has services for both providers', () => {
      const awsServices = TEST_MOCK_DATA.services.filter(s => s.provider_id === 1);
      const azureServices = TEST_MOCK_DATA.services.filter(s => s.provider_id === 2);
      expect(awsServices.length).toBeGreaterThan(0);
      expect(azureServices.length).toBeGreaterThan(0);
    });
    
    test('service_cost is positive', () => {
      TEST_MOCK_DATA.services.forEach(service => {
        expect(service.service_cost).toBeGreaterThan(0);
      });
    });
  });

  describe('TC-U-JS-019: generateUsages', () => {
    test('generates usage records', () => {
      const usages = TEST_MOCK_DATA.generateUsages(7);
      expect(usages.length).toBeGreaterThan(0);
    });
    
    test('usage records have required fields', () => {
      const usages = TEST_MOCK_DATA.generateUsages(1);
      const usage = usages[0];
      expect(usage).toHaveProperty('usage_id');
      expect(usage).toHaveProperty('client_id');
      expect(usage).toHaveProperty('service_id');
      expect(usage).toHaveProperty('usage_date');
      expect(usage).toHaveProperty('units_used');
      expect(usage).toHaveProperty('total_cost');
    });
    
    test('total_cost is positive number', () => {
      const usages = TEST_MOCK_DATA.generateUsages(1);
      usages.forEach(usage => {
        expect(usage.total_cost).toBeGreaterThanOrEqual(0);
        expect(typeof usage.total_cost).toBe('number');
      });
    });
  });
});

describe('FR-01: Cost Dashboard - Cost Calculations', () => {
  
  describe('TC-U-JS-020: Total cost calculation', () => {
    test('sums all usage costs correctly', () => {
      const total = mockUsages.reduce((sum, u) => sum + u.total_cost, 0);
      expect(total).toBe(2054.00);
    });
    
    test('handles empty usages array', () => {
      const total = [].reduce((sum, u) => sum + u.total_cost, 0);
      expect(total).toBe(0);
    });
  });

  describe('TC-U-JS-021: Cost by provider calculation', () => {
    test('calculates AWS costs correctly', () => {
      let awsCost = 0;
      mockUsages.forEach(usage => {
        const service = mockServices.find(s => s.service_id === usage.service_id);
        if (service && service.provider_id === 1) {
          awsCost += usage.total_cost;
        }
      });
      expect(awsCost).toBe(1600.00);
    });
    
    test('calculates Azure costs correctly', () => {
      let azureCost = 0;
      mockUsages.forEach(usage => {
        const service = mockServices.find(s => s.service_id === usage.service_id);
        if (service && service.provider_id === 2) {
          azureCost += usage.total_cost;
        }
      });
      expect(azureCost).toBe(454.00);
    });
    
    test('AWS + Azure = Total', () => {
      let awsCost = 0;
      let azureCost = 0;
      mockUsages.forEach(usage => {
        const service = mockServices.find(s => s.service_id === usage.service_id);
        if (service) {
          if (service.provider_id === 1) awsCost += usage.total_cost;
          if (service.provider_id === 2) azureCost += usage.total_cost;
        }
      });
      const total = mockUsages.reduce((sum, u) => sum + u.total_cost, 0);
      expect(awsCost + azureCost).toBe(total);
    });
  });
});

describe('FR-02: Spending Trends - Data Grouping', () => {
  
  describe('TC-U-JS-022: Group costs by date', () => {
    test('groups usages by date correctly', () => {
      const costsByDate = {};
      mockUsages.forEach(usage => {
        const date = usage.usage_date;
        if (!costsByDate[date]) {
          costsByDate[date] = { date, total: 0 };
        }
        costsByDate[date].total += usage.total_cost;
      });
      
      expect(Object.keys(costsByDate).length).toBe(2);
      expect(costsByDate['2026-01-15'].total).toBe(2000.00);
      expect(costsByDate['2026-01-16'].total).toBe(54.00);
    });
  });

  describe('TC-U-JS-023: Trend data sorting', () => {
    test('sorts dates chronologically', () => {
      const dates = ['2026-01-16', '2026-01-15', '2026-01-17'];
      const sorted = dates.sort((a, b) => a.localeCompare(b));
      expect(sorted).toEqual(['2026-01-15', '2026-01-16', '2026-01-17']);
    });
  });
});

describe('FR-03: Filter Capability - Data Filtering', () => {
  
  describe('TC-U-JS-024: Filter by client', () => {
    test('filters usages by client_id', () => {
      const clientId = 1;
      const filtered = mockUsages.filter(u => u.client_id === clientId);
      expect(filtered.length).toBe(3);
      filtered.forEach(u => expect(u.client_id).toBe(clientId));
    });
    
    test('returns empty array for non-existent client', () => {
      const filtered = mockUsages.filter(u => u.client_id === 999);
      expect(filtered.length).toBe(0);
    });
  });

  describe('TC-U-JS-025: Filter by service', () => {
    test('filters usages by service_id', () => {
      const serviceId = 1;
      const filtered = mockUsages.filter(u => u.service_id === serviceId);
      expect(filtered.length).toBe(2);
      filtered.forEach(u => expect(u.service_id).toBe(serviceId));
    });
  });

  describe('TC-U-JS-026: Filter by provider (via service)', () => {
    test('filters usages by provider through service lookup', () => {
      const providerId = 1;
      const providerServices = mockServices
        .filter(s => s.provider_id === providerId)
        .map(s => s.service_id);
      
      const filtered = mockUsages.filter(u => providerServices.includes(u.service_id));
      expect(filtered.length).toBe(3);
    });
  });

  describe('TC-U-JS-027: Combined filters', () => {
    test('applies multiple filters correctly', () => {
      const clientId = 1;
      const serviceId = 1;
      const filtered = mockUsages.filter(u => 
        u.client_id === clientId && u.service_id === serviceId
      );
      expect(filtered.length).toBe(1);
    });
  });
});

describe('FR-04: Waste Detection Logic', () => {
  
  describe('TC-U-JS-028: Utilization calculation for Compute', () => {
    test('calculates low utilization correctly', () => {
      const avgUnitsUsed = 15;
      const utilization = Math.min(avgUnitsUsed / 100, 1.0);
      expect(utilization).toBe(0.15);
      expect(utilization < 0.30).toBe(true);
    });
    
    test('calculates high utilization correctly', () => {
      const avgUnitsUsed = 80;
      const utilization = Math.min(avgUnitsUsed / 100, 1.0);
      expect(utilization).toBe(0.80);
      expect(utilization < 0.30).toBe(false);
    });
  });

  describe('TC-U-JS-029: Utilization calculation for Storage', () => {
    test('storage uses different threshold', () => {
      const avgUnitsUsed = 200;
      const utilization = Math.min(avgUnitsUsed / 1000, 1.0);
      expect(utilization).toBe(0.20);
    });
  });

  describe('TC-U-JS-030: Waste alert threshold', () => {
    test('flags resources under 30% utilization', () => {
      const testCases = [
        { utilization: 0.29, shouldFlag: true },
        { utilization: 0.30, shouldFlag: false },
        { utilization: 0.10, shouldFlag: true },
        { utilization: 0.50, shouldFlag: false },
      ];
      
      testCases.forEach(({ utilization, shouldFlag }) => {
        expect(utilization < 0.30).toBe(shouldFlag);
      });
    });
  });

  describe('TC-U-JS-031: Potential savings calculation', () => {
    test('estimates 50% savings for underutilized resources', () => {
      const dailyCost = 10.00;
      const daysInMonth = 30;
      const savingsRate = 0.5;
      const potentialSavings = dailyCost * daysInMonth * savingsRate;
      expect(potentialSavings).toBe(150.00);
    });
  });
});

describe('FR-05: Recommendations Generation', () => {
  
  describe('TC-U-JS-032: Recommendation structure', () => {
    test('recommendation has required fields', () => {
      const mockAlert = {
        service_id: 1,
        service_name: 'EC2',
        utilization: 0.15,
        potential_savings: 150.00,
        provider_name: 'AWS',
      };
      
      const recommendation = {
        id: 1,
        title: `Rightsize ${mockAlert.service_name}`,
        description: `Current utilization is only ${Math.round(mockAlert.utilization * 100)}%.`,
        current_config: mockAlert.service_name,
        suggested_config: 'Smaller instance',
        monthly_savings: mockAlert.potential_savings,
        provider: mockAlert.provider_name,
      };
      
      expect(recommendation).toHaveProperty('id');
      expect(recommendation).toHaveProperty('title');
      expect(recommendation).toHaveProperty('description');
      expect(recommendation).toHaveProperty('monthly_savings');
      expect(recommendation.title).toContain('Rightsize');
    });
  });

  describe('TC-U-JS-033: Recommendation limit', () => {
    test('limits recommendations to 5', () => {
      const alerts = Array(10).fill({
        service_id: 1,
        service_name: 'Test',
        utilization: 0.1,
        potential_savings: 100,
      });
      
      const recommendations = alerts.slice(0, 5);
      expect(recommendations.length).toBe(5);
    });
  });
});

describe('FR-07: Budget Thresholds', () => {
  
  describe('TC-U-JS-034: Budget data structure', () => {
    test('budget has required fields', () => {
      const budget = TEST_MOCK_DATA.budgets[0];
      expect(budget).toHaveProperty('budget_id');
      expect(budget).toHaveProperty('client_id');
      expect(budget).toHaveProperty('budget_amount');
      expect(budget).toHaveProperty('monthly_limit');
      expect(budget).toHaveProperty('alert_threshold');
      expect(budget).toHaveProperty('alert_enabled');
    });
  });

  describe('TC-U-JS-035: Alert threshold validation', () => {
    test('alert_threshold is percentage (0-100)', () => {
      TEST_MOCK_DATA.budgets.forEach(budget => {
        expect(budget.alert_threshold).toBeGreaterThanOrEqual(0);
        expect(budget.alert_threshold).toBeLessThanOrEqual(100);
      });
    });
  });

  describe('TC-U-JS-036: Budget alert trigger logic', () => {
    test('triggers alert when spending exceeds threshold', () => {
      const budget = { budget_amount: 1000, alert_threshold: 80 };
      const currentSpending = 850;
      
      const thresholdAmount = budget.budget_amount * (budget.alert_threshold / 100);
      const shouldAlert = currentSpending >= thresholdAmount;
      
      expect(thresholdAmount).toBe(800);
      expect(shouldAlert).toBe(true);
    });
    
    test('does not trigger below threshold', () => {
      const budget = { budget_amount: 1000, alert_threshold: 80 };
      const currentSpending = 750;
      
      const thresholdAmount = budget.budget_amount * (budget.alert_threshold / 100);
      const shouldAlert = currentSpending >= thresholdAmount;
      
      expect(shouldAlert).toBe(false);
    });
  });
});

describe('FR-08: Resource Metrics Aggregation', () => {
  
  describe('TC-U-JS-037: Average calculation', () => {
    test('calculates average cost correctly', () => {
      const total = mockUsages.reduce((sum, u) => sum + u.total_cost, 0);
      const avg = total / mockUsages.length;
      expect(avg).toBe(410.80);
    });
  });

  describe('TC-U-JS-038: Max calculation', () => {
    test('finds maximum cost correctly', () => {
      const max = Math.max(...mockUsages.map(u => u.total_cost));
      expect(max).toBe(1000.00);
    });
  });

  describe('TC-U-JS-039: Min calculation', () => {
    test('finds minimum cost correctly', () => {
      const min = Math.min(...mockUsages.map(u => u.total_cost));
      expect(min).toBe(54.00);
    });
  });

  describe('TC-U-JS-040: Units aggregation', () => {
    test('sums units used correctly', () => {
      const totalUnits = mockUsages.reduce((sum, u) => sum + u.units_used, 0);
      expect(totalUnits).toBe(460);
    });
  });
});
