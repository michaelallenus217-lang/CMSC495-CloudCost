module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.js'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleFileExtensions: ['js'],
  collectCoverageFrom: ['js/**/*.js'],
  coverageDirectory: 'coverage',
  verbose: true,
};
