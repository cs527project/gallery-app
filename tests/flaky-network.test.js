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
    jest.useRealTimers();
  });

  // Deterministic: Network request timing (no randomness, no contradictory timing assertions)
  test("should handle API response timing deterministically", async () => {
    jest.useFakeTimers();

    const resultDiv = document.getElementById("api-result");

    const mockApiCall = () => {
      return new Promise((resolve) => {
        const delay = 1000; // fixed delay
        setTimeout(() => {
          resolve({ data: "API response", timestamp: Date.now() });
        }, delay);
      });
    };

    const promise = mockApiCall().then((response) => {
      resultDiv.textContent = response.data;
      expect(response.data).toBe("API response");
      expect(resultDiv.textContent).toBe("API response");
    });

    jest.runAllTimers();
    await promise;
  });

  // Deterministic: Multiple concurrent requests (order-independent)
  test("should handle concurrent API calls without assuming order", async () => {
    const results = [];

    const mockApiCall1 = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ id: 1, data: "First API" }), 120);
      });

    const mockApiCall2 = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ id: 2, data: "Second API" }), 80);
      });

    const mockApiCall3 = () =>
      new Promise((resolve) => {
        setTimeout(() => resolve({ id: 3, data: "Third API" }), 160);
      });

    jest.useFakeTimers();

    const promises = [
      mockApiCall1().then((r) => results.push(r)),
      mockApiCall2().then((r) => results.push(r)),
      mockApiCall3().then((r) => results.push(r)),
    ];

    const all = Promise.all(promises);
    jest.runAllTimers();
    await all;

    expect(results).toHaveLength(3);
    const ids = results.map((r) => r.id).sort((a, b) => a - b);
    expect(ids).toEqual([1, 2, 3]);
  });

  // Deterministic: Retry logic with scripted outcomes
  test("should retry failed requests and succeed within limit", async () => {
    let attemptCount = 0;
    const maxRetries = 3;
    const outcomes = [false, false, true]; // fail, fail, succeed

    const mockUnreliableApi = () => {
      attemptCount++;
      return new Promise((resolve, reject) => {
        const shouldSucceed = outcomes[attemptCount - 1] === true;
        if (shouldSucceed) {
          resolve({ success: true, attempts: attemptCount });
        } else {
          reject(new Error(`Attempt ${attemptCount} failed`));
        }
      });
    };

    const mockRetryRequest = async () => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await mockUnreliableApi();
        } catch (error) {
          if (i === maxRetries - 1) throw error;
          // no wait between retries in this deterministic test
        }
      }
    };

    const result = await mockRetryRequest();

    expect(result.success).toBe(true);
    expect(result.attempts).toBe(3);
    expect(attemptCount).toBe(3);
  });

  // Deterministic: Cache behavior with expiration using fake timers
  test("should handle cache expiration deterministically", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(0));

    const cache = new Map();
    const cacheExpiry = 200; // 200ms cache

    const mockCachedApiCall = async (key) => {
      const now = Date.now();
      const cached = cache.get(key);

      if (cached && now - cached.timestamp < cacheExpiry) {
        return { ...cached.data, fromCache: true };
      }

      await new Promise((resolve) => setTimeout(resolve, 50)); // fixed delay

      const data = { result: `Data for ${key}`, timestamp: now };
      cache.set(key, { data, timestamp: now });

      return { ...data, fromCache: false };
    };

    let p = mockCachedApiCall("test-key");
    jest.runOnlyPendingTimers();
    const result1 = await p;
    expect(result1.fromCache).toBe(false);

    p = mockCachedApiCall("test-key");
    jest.runOnlyPendingTimers();
    const result2 = await p;
    expect(result2.fromCache).toBe(true);

    jest.advanceTimersByTime(250);
    p = mockCachedApiCall("test-key");
    jest.runOnlyPendingTimers();
    const result3 = await p;
    expect(result3.fromCache).toBe(false);
  });

  // Deterministic: WebSocket connection simulation
  test("should handle WebSocket events deterministically", () => {
    jest.useFakeTimers();

    let connectionState = "disconnected";
    let messagesReceived = [];

    const mockWebSocket = {
      connect: () => {
        setTimeout(() => {
          connectionState = "connected";
          mockWebSocket.onopen && mockWebSocket.onopen();
        }, 50);
      },
      send: (message) => {
        if (connectionState === "connected") {
          setTimeout(() => {
            messagesReceived.push(`Echo: ${message}`);
            mockWebSocket.onmessage &&
              mockWebSocket.onmessage({ data: `Echo: ${message}` });
          }, 20);
        }
      },
      onopen: null,
      onmessage: null,
    };

    mockWebSocket.onopen = () => {
      mockWebSocket.send("Hello WebSocket");
    };

    mockWebSocket.onmessage = () => {
      // After message echo processed
      expect(connectionState).toBe("connected");
      expect(messagesReceived).toContain("Echo: Hello WebSocket");
      expect(messagesReceived).toHaveLength(1);
    };

    mockWebSocket.connect();

    // process connect (50ms) and echo (20ms)
    jest.advanceTimersByTime(50);
    jest.advanceTimersByTime(20);

    // No premature assertions
    expect(connectionState).toBe("connected");
    expect(messagesReceived).toEqual(["Echo: Hello WebSocket"]);
  });

  // Deterministic: File upload with progress
  test("should track upload progress deterministically", () => {
    jest.useFakeTimers();

    let uploadProgress = 0;
    let uploadComplete = false;

    const mockFileUpload = (file) => {
      const totalSize = 1000;
      let uploaded = 0;

      const uploadChunk = () => {
        const chunkSize = 200; // fixed chunk size
        uploaded = Math.min(uploaded + chunkSize, totalSize);
        uploadProgress = Math.floor((uploaded / totalSize) * 100);

        if (uploaded >= totalSize) {
          uploadComplete = true;
          return;
        }

        setTimeout(uploadChunk, 20); // fixed delay between chunks
      };

      uploadChunk();
    };

    mockFileUpload({ name: "test.jpg", size: 1000 });

    // step through 5 chunks (0 -> 200 -> 400 -> 600 -> 800 -> 1000)
    expect(uploadProgress).toBe(20);
    jest.advanceTimersByTime(20);
    expect(uploadProgress).toBe(40);
    jest.advanceTimersByTime(20);
    expect(uploadProgress).toBe(60);
    jest.advanceTimersByTime(20);
    expect(uploadProgress).toBe(80);
    jest.advanceTimersByTime(20);
    expect(uploadProgress).toBe(100);
    expect(uploadComplete).toBe(true);
  });
});
