/**
 * jest.config.cjs
 */
/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  modulePaths: ['<rootDir>/src'],
  collectCoverage: true,
  coverageDirectory: 'coverage',
  // Incluye tanto unit como integration tests bajo __tests__/integration
  testMatch: ['**/__tests__/integration/**/*.spec.ts', '**/__tests__/**/*.spec.ts'],
  modulePathIgnorePatterns: ['<rootDir>/.serverless'],
  testPathIgnorePatterns: ['<rootDir>/.serverless'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};



