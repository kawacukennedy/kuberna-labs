/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  transform: {
    // Resolved rather than named: this package is a workspace member, so ts-jest
    // can be hoisted to the repository root and a bare 'ts-jest' is not always
    // found from here (which fails the frontend test job outright).
    '^.+\\.tsx?$': [require.resolve('ts-jest'), { tsconfig: 'tsconfig.test.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/test/**/*.test.{ts,tsx}'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
};

module.exports = config;
