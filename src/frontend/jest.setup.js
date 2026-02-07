// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = jest.fn();

// Mock Chart.js
global.Chart = jest.fn().mockImplementation(() => ({
  destroy: jest.fn(),
  update: jest.fn(),
}));

// Mock DOM elements that might not exist
document.body.innerHTML = `
  <div id="total-cost"></div>
  <div id="aws-cost"></div>
  <div id="azure-cost"></div>
  <div id="potential-savings"></div>
  <div id="error-display" class="hidden">
    <span class="error-message"></span>
    <button class="btn-retry"></button>
    <button class="btn-dismiss"></button>
  </div>
`;
