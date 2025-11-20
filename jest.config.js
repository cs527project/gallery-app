const isCI = process.env.CI === "true" || process.env.GITHUB_ACTIONS === "true";

module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  testMatch: ["<rootDir>/tests/**/*.test.js"],
  testPathIgnorePatterns: isCI ? ["flaky-.*\\.test\\.js"] : [],
  collectCoverageFrom: ["script.js", "!**/node_modules/**"],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  verbose: true,
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
};
