# Fixing Flaky Tests Guide - Gallery App

## Overview
This guide provides best practices for fixing flaky tests in our vanilla JavaScript + Jest application. Flaky tests are tests that sometimes pass and sometimes fail due to timing issues, race conditions, or other non-deterministic behavior.

## Command Restrictions

- You MUST NOT use `sleep()` or `setTimeout()` for delays in test scripts
- You MUST NOT use `eval()` as it poses security risks
- Avoid using shell wildcards in destructive operations (e.g., `rm -rf *`)
- Never use fixed timeouts like `setTimeout(() => {}, 1000)` in tests

## Code Style Preferences

- Prefer functional programming patterns over imperative code
- Use explicit error handling over try-catch-all patterns
- Use async/await syntax over Promise chains for readability
- Always use proper DOM cleanup in tests
- Prefer `querySelector` with specific selectors over broad queries

## Security Considerations

- Always flag use of `innerHTML` without sanitization
- Highlight any potential XSS vulnerabilities in DOM manipulation
- Point out hardcoded credentials or API keys
- Flag any use of `eval()` or `Function()` constructors
- Ensure proper validation of user inputs

## Documentation Standards

- Complex DOM manipulation MUST include explanatory comments
- Flaky test fixes MUST document the root cause and solution
- Test setup and teardown MUST be clearly documented
- Mock implementations MUST be documented with their purpose

## Common Flaky Test Patterns & Solutions

### 1. Race Conditions with Async Operations

#### ❌ **Problematic Code:**
```javascript
test('should handle rapid button clicks correctly', (done) => {
  const button = document.getElementById('click-me');
  const counter = document.getElementById('click-counter');
  let clickCount = 0;
  
  // Mock click handler with async state update
  const handleClick = () => {
    return new Promise((resolve) => {
      const delay = Math.random() * 100 + 50; // Random delay
      setTimeout(() => {
        clickCount++;
        counter.textContent = clickCount.toString();
        resolve();
      }, delay);
    });
  };

  button.addEventListener('click', handleClick);

  // Rapid clicks without waiting - creates race conditions
  for (let i = 0; i < 5; i++) {
    button.click(); // No await - race condition
  }

  // Check results too early
  setTimeout(() => {
    expect(clickCount).toBe(5); // FLAKY!
    done();
  }, 200);
});
```

#### ✅ **Fixed Code:**
```javascript
test('should handle rapid button clicks correctly', async () => {
  const button = document.getElementById('click-me');
  const counter = document.getElementById('click-counter');
  let clickCount = 0;
  
  // Mock click handler with proper async handling
  const handleClick = async () => {
    const delay = Math.random() * 100 + 50;
    await new Promise(resolve => setTimeout(resolve, delay));
    clickCount++;
    counter.textContent = clickCount.toString();
  };

  button.addEventListener('click', handleClick);

  // Sequential clicks with proper waiting
  for (let i = 0; i < 5; i++) {
    button.click();
    await new Promise(resolve => setTimeout(resolve, 10)); // Small delay
  }

  // Wait for all operations to complete
  await new Promise(resolve => setTimeout(resolve, 500));
  
  expect(clickCount).toBe(5);
  expect(counter.textContent).toBe('5');
});
```

### 2. DOM Updates with Timing Issues

#### ❌ **Problematic Code:**
```javascript
test('should handle DOM updates correctly', (done) => {
  const element = document.querySelector('.target');
  
  // Mock DOM update with variable timing
  const updateDOM = () => {
    return new Promise((resolve) => {
      const delay = Math.random() * 200 + 100;
      setTimeout(() => {
        element.style.display = 'block';
        element.innerHTML = 'Updated content';
        resolve();
      }, delay);
    });
  };

  updateDOM();

  // Check DOM state too early
  setTimeout(() => {
    expect(element.style.display).toBe('block'); // FLAKY!
    expect(element.innerHTML).toBe('Updated content'); // FLAKY!
    done();
  }, 150);
});
```

#### ✅ **Fixed Code:**
```javascript
test('should handle DOM updates correctly', async () => {
  const element = document.querySelector('.target');
  
  // Mock DOM update with proper async handling
  const updateDOM = async () => {
    const delay = Math.random() * 200 + 100;
    await new Promise(resolve => setTimeout(resolve, delay));
    element.style.display = 'block';
    element.innerHTML = 'Updated content';
  };

  await updateDOM();

  // Check DOM state after update completes
  expect(element.style.display).toBe('block');
  expect(element.innerHTML).toBe('Updated content');
});
```

### 3. Event Handling with Debouncing

#### ❌ **Problematic Code:**
```javascript
test('should handle debounced events correctly', (done) => {
  let eventCount = 0;
  
  // Mock debounced event handler
  const debouncedHandler = (() => {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        eventCount++;
      }, 180); // 180ms debounce
    };
  })();

  // Trigger multiple events rapidly
  debouncedHandler();
  setTimeout(() => debouncedHandler(), 50);
  setTimeout(() => debouncedHandler(), 100);

  // Check results too early
  setTimeout(() => {
    expect(eventCount).toBe(1); // FLAKY!
    done();
  }, 200);
});
```

#### ✅ **Fixed Code:**
```javascript
test('should handle debounced events correctly', async () => {
  let eventCount = 0;
  
  // Mock debounced event handler
  const debouncedHandler = (() => {
    let timeout;
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        eventCount++;
      }, 180); // 180ms debounce
    };
  })();

  // Trigger multiple events rapidly
  debouncedHandler();
  setTimeout(() => debouncedHandler(), 50);
  setTimeout(() => debouncedHandler(), 100);

  // Wait for debounce to complete
  await new Promise(resolve => setTimeout(resolve, 300));
  
  expect(eventCount).toBe(1);
});
```

## Best Practices for Vanilla JavaScript + Jest Testing

### 1. Proper DOM Setup and Cleanup
```javascript
beforeEach(() => {
  // Setup DOM
  document.body.innerHTML = mockHTML;
});

afterEach(() => {
  // Cleanup DOM
  document.body.innerHTML = '';
  jest.clearAllMocks();
});
```

### 2. Use Async/Await for Promises
```javascript
// GOOD: Use async/await
test('async operation', async () => {
  const result = await someAsyncOperation();
  expect(result).toBeDefined();
});

// BAD: Use done callback
test('async operation', (done) => {
  someAsyncOperation().then(result => {
    expect(result).toBeDefined();
    done();
  });
});
```

### 3. Mock External Dependencies
```javascript
// Mock fetch globally
global.fetch = jest.fn();

beforeEach(() => {
  fetch.mockClear();
});

test('API call', async () => {
  fetch.mockResolvedValueOnce({
    json: async () => ({ data: 'test' })
  });
  
  const result = await fetchData();
  expect(result.data).toBe('test');
});
```

### 4. Use Proper Event Simulation
```javascript
test('button click', () => {
  const button = document.getElementById('test-button');
  const handler = jest.fn();
  
  button.addEventListener('click', handler);
  
  // Simulate click
  button.click();
  
  expect(handler).toHaveBeenCalledTimes(1);
});
```

## Common Anti-Patterns to Avoid

### ❌ **Don't Use Fixed Timeouts**
```javascript
// BAD: Fixed timeout
setTimeout(() => {
  expect(element).toBeDefined();
  done();
}, 1000);
```

### ✅ **Use Proper Async Handling**
```javascript
// GOOD: Wait for specific condition
const waitForElement = async (selector, timeout = 5000) => {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error(`Element ${selector} not found`);
};

test('wait for element', async () => {
  const element = await waitForElement('.target');
  expect(element).toBeDefined();
});
```

### ❌ **Don't Check DOM State Immediately**
```javascript
// BAD: Immediate check
updateDOM();
expect(element.style.display).toBe('block'); // Might not be ready
```

### ✅ **Wait for DOM Updates**
```javascript
// GOOD: Wait for update
await updateDOM();
expect(element.style.display).toBe('block');
```

## Debugging Flaky Tests

### 1. Add Logging
```javascript
test('debug flaky test', async () => {
  console.log('Test started');
  
  await someOperation();
  console.log('Operation completed');
  
  const element = document.querySelector('.target');
  console.log('Element found:', !!element);
  expect(element).toBeDefined();
});
```

### 2. Use DOM Inspection
```javascript
test('debug DOM state', async () => {
  await updateDOM();
  
  // Print current DOM state
  console.log(document.body.innerHTML);
  
  const element = document.querySelector('.target');
  expect(element).toBeDefined();
});
```

### 3. Increase Timeout for Slow Operations
```javascript
test('slow operation', async () => {
  const element = await waitForElement('.target', 10000); // 10 second timeout
  expect(element).toBeDefined();
});
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test File
```bash
npm test -- tests/flaky-timing.test.js
```

### Run with Coverage
```bash
npm run test:coverage
```

### Run in Watch Mode
```bash
npm test -- --watch
```

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [DOM Testing Guide](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model)
- [Async JavaScript Testing](https://jestjs.io/docs/asynchronous)
- [Mock Functions](https://jestjs.io/docs/mock-functions)
