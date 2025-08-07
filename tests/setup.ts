// Jest setup file for UFOBeep platform
// This file is executed before running tests

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/ufobeep_test';

// Mock console methods in test environment to reduce noise
const originalError = console.error;
beforeAll(() => {
  console.error = (...args: any[]) => {
    // Only show errors that are not expected test errors
    if (!args[0]?.toString().includes('Warning:') && 
        !args[0]?.toString().includes('console.error')) {
      originalError(...args);
    }
  };
});

afterAll(() => {
  console.error = originalError;
});

// Global test utilities
global.testUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  username: 'testuser',
  isAnonymous: false,
  isAdmin: false,
};

global.testAdminUser = {
  id: 'test-admin-id',
  email: 'admin@test.com',
  username: 'admin',
  isAnonymous: false,
  isAdmin: true,
};

// Declare global types for TypeScript
declare global {
  var testUser: {
    id: string;
    email: string;
    username: string;
    isAnonymous: boolean;
    isAdmin: boolean;
  };
  
  var testAdminUser: {
    id: string;
    email: string;
    username: string;
    isAnonymous: boolean;
    isAdmin: boolean;
  };
}