/**
 * @jest-environment jsdom
 */

// Mock fetch globally for these tests
global.fetch = jest.fn();

describe("Flaky Network-Dependent Tests", () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="api-container">
        <button id="fetch-data">Fetch Data</button>
        <div id="api-result"></div>
        <div class="loading-indicator" style="display: none;">Loading...</div>
      </div>
    `;
    document.body.innerHTML = mockHTML;

    // Reset fetch mock
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // FLAKY TEST 19: Network request with variable response time
  test("should handle API response timing (FLAKY: network timing)", async () => {
    const resultDiv = document.getElementById("api-result");

    // Mock API response with random delay and higher failure rate
    const mockApiCall = () => {
      return new Promise((resolve, reject) => {
        const delay = Math.random() * 2000 + 800; // 800-2800ms - longer delays
        const shouldFail = Math.random() < 0.4; // 40% chance of failure - much higher

        setTimeout(() => {
          if (shouldFail) {
            reject(new Error("Network error"));
          } else {
            resolve({ data: "API response", timestamp: Date.now() });
          }
        }, delay);
      });
    };

    const startTime = Date.now();

    try {
      const response = await mockApiCall();
      const endTime = Date.now();
      const duration = endTime - startTime;

      resultDiv.textContent = response.data;

      // These assertions assume specific timing and success - more restrictive
      expect(response.data).toBe("API response");
      expect(duration).toBeLessThan(1200); // FLAKY: ~75% chance of taking longer than 1200ms
      expect(duration).toBeGreaterThan(2500); // FLAKY: ~80% chance of being less than 2500ms
      expect(resultDiv.textContent).toBe("API response");
    } catch (error) {
      // This catch block makes the test fail when network fails (40% of time)
      expect(error.message).toBe("Success response"); // FLAKY: will fail when network actually fails
    }
  });

  // FLAKY TEST 20: Multiple concurrent requests
  test("should handle concurrent API calls (FLAKY: race conditions)", async () => {
    const results = [];

    // Mock multiple API endpoints with different response times
    const mockApiCall1 = () =>
      new Promise((resolve) => {
        setTimeout(
          () => resolve({ id: 1, data: "First API" }),
          Math.random() * 200 + 100,
        );
      });

    const mockApiCall2 = () =>
      new Promise((resolve) => {
        setTimeout(
          () => resolve({ id: 2, data: "Second API" }),
          Math.random() * 300 + 50,
        );
      });

    const mockApiCall3 = () =>
      new Promise((resolve) => {
        setTimeout(
          () => resolve({ id: 3, data: "Third API" }),
          Math.random() * 150 + 75,
        );
      });

    // Start all requests concurrently
    const promises = [
      mockApiCall1().then((result) => results.push(result)),
      mockApiCall2().then((result) => results.push(result)),
      mockApiCall3().then((result) => results.push(result)),
    ];

    await Promise.all(promises);

    // These assertions assume specific order based on timing
    expect(results).toHaveLength(3);
    expect(results[0].id).toBe(3); // FLAKY: order depends on random timing
    expect(results[1].id).toBe(1); // FLAKY: order depends on random timing
    expect(results[2].id).toBe(2); // FLAKY: order depends on random timing
  });

  // FLAKY TEST 21: Retry logic with intermittent failures
  test("should retry failed requests correctly (FLAKY: retry timing)", async () => {
    let attemptCount = 0;
    const maxRetries = 3;

    // Mock API that fails more often
    const mockUnreliableApi = () => {
      attemptCount++;
      return new Promise((resolve, reject) => {
        const failureRate = 0.85; // 85% failure rate - much higher
        const shouldFail = Math.random() < failureRate;

        setTimeout(
          () => {
            if (shouldFail && attemptCount <= maxRetries) {
              reject(new Error(`Attempt ${attemptCount} failed`));
            } else {
              resolve({ success: true, attempts: attemptCount });
            }
          },
          Math.random() * 200 + 100,
        ); // Longer delays
      });
    };

    // Mock retry logic
    const mockRetryRequest = async () => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await mockUnreliableApi();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          await new Promise((resolve) => setTimeout(resolve, 50)); // Shorter retry delay
        }
      }
    };

    try {
      const result = await mockRetryRequest();

      // These assertions assume success within retry limit - more restrictive
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(1); // FLAKY: ~85% chance of not being 1
      expect(attemptCount).toBe(2); // FLAKY: attempt count is very random with 85% failure rate
      expect(result.attempts).toBeLessThan(2); // FLAKY: ~85% chance of being >= 2
    } catch (error) {
      // Test will fail when all retries are exhausted (~50% of the time with 85% failure rate)
      expect(error.message).toBe("Success"); // FLAKY: will fail when retries actually exhausted
    }
  });

  // FLAKY TEST 22: Cache behavior with expiration
  test("should handle cache expiration correctly (FLAKY: cache timing)", async () => {
    const cache = new Map();
    const cacheExpiry = 200; // 200ms cache

    // Mock API with caching
    const mockCachedApiCall = async (key) => {
      const now = Date.now();
      const cached = cache.get(key);

      if (cached && now - cached.timestamp < cacheExpiry) {
        return { ...cached.data, fromCache: true };
      }

      // Simulate API delay
      await new Promise((resolve) =>
        setTimeout(resolve, Math.random() * 100 + 50),
      );

      const data = { result: `Data for ${key}`, timestamp: now };
      cache.set(key, { data, timestamp: now });

      return { ...data, fromCache: false };
    };

    // First call - should not be from cache
    const result1 = await mockCachedApiCall("test-key");
    expect(result1.fromCache).toBe(false);

    // Second call immediately - should be from cache
    const result2 = await mockCachedApiCall("test-key");
    expect(result2.fromCache).toBe(true);

    // Wait for cache to expire and call again
    await new Promise((resolve) => setTimeout(resolve, 250));
    const result3 = await mockCachedApiCall("test-key");
    expect(result3.fromCache).toBe(false); // FLAKY: timing might be off, cache might still be valid
  });

  // FLAKY TEST 23: WebSocket connection simulation
  test("should handle WebSocket events (FLAKY: connection timing)", async () => {
    jest.useFakeTimers();

    let connectionState = "disconnected";
    let messagesReceived = [];

    // Mock WebSocket behavior
    const mockWebSocket = {
      connect: () => {
        // Random connection delay
        setTimeout(
          () => {
            connectionState = "connected";
            mockWebSocket.onopen && mockWebSocket.onopen();
          },
          Math.random() * 100 + 50,
        );
      },

      send: (message) => {
        if (connectionState === "connected") {
          // Simulate message echo with delay
          setTimeout(
            () => {
              messagesReceived.push(`Echo: ${message}`);
              mockWebSocket.onmessage &&
                mockWebSocket.onmessage({ data: `Echo: ${message}` });
            },
            Math.random() * 50 + 10,
          );
        }
      },

      onopen: null,
      onmessage: null,
    };

    const connectPromise = new Promise((resolve) => {
      mockWebSocket.onopen = () => {
        resolve();
        mockWebSocket.send("Hello WebSocket");
      };
    });

    const messagePromise = new Promise((resolve) => {
      mockWebSocket.onmessage = (event) => {
        resolve(event.data);
      };
    });

    // Start connection
    mockWebSocket.connect();

    // Advance timers past max delays for connect and message echo
    jest.advanceTimersByTime(200);
    await connectPromise;

    jest.advanceTimersByTime(1000);
    await messagePromise;

    expect(connectionState).toBe("connected");
    expect(messagesReceived).toContain("Echo: Hello WebSocket");
    expect(messagesReceived).toHaveLength(1);

    jest.useRealTimers();
  });

  // FLAKY TEST 24: File upload with progress
  test("should track upload progress correctly (FLAKY: progress timing)", (done) => {
    let uploadProgress = 0;
    let uploadComplete = false;

    // Mock file upload with progress updates
    const mockFileUpload = (file) => {
      const totalSize = 1000;
      let uploaded = 0;

      const uploadChunk = () => {
        const chunkSize = Math.random() * 100 + 50; // Random chunk size
        uploaded = Math.min(uploaded + chunkSize, totalSize);
        uploadProgress = Math.floor((uploaded / totalSize) * 100);

        if (uploaded >= totalSize) {
          uploadComplete = true;
          return;
        }

        // Random delay between chunks
        setTimeout(uploadChunk, Math.random() * 50 + 10);
      };

      uploadChunk();
    };

    mockFileUpload({ name: "test.jpg", size: 1000 });

    // Check progress at fixed intervals
    setTimeout(() => {
      expect(uploadProgress).toBeGreaterThan(30); // FLAKY: might be less than 30%
    }, 100);

    setTimeout(() => {
      expect(uploadProgress).toBeGreaterThan(70); // FLAKY: might be less than 70%
    }, 200);

    setTimeout(() => {
      expect(uploadComplete).toBe(true); // FLAKY: upload might not be complete
      expect(uploadProgress).toBe(100);
      done();
    }, 300);
  });
});
