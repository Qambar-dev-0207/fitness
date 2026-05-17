/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|js|jsx|mjs)$': ['babel-jest', { presets: ['next/babel'] }],
  },
  setupFiles: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: [
    '<rootDir>/src/__tests__/**/*.test.ts',
    '<rootDir>/src/__tests__/**/*.test.tsx',
  ],
  // Transform jose and @openrouter (ESM-only packages) via babel
  transformIgnorePatterns: [
    '/node_modules/(?!(jose|@openrouter)/)',
  ],
  collectCoverageFrom: [
    'src/lib/**/*.ts',
    'src/app/api/**/*.ts',
    'src/middleware.ts',
  ],
  coverageReporters: ['text', 'lcov'],
};
