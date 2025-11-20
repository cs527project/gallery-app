/**
 * @jest-environment jsdom
 */

describe("Flaky Memory and State Pollution Tests", () => {
  // Shared state that can cause pollution between tests
  let globalCounter = 0;
  let sharedCache = {};
  let eventListeners = [];

  beforeEach(() => {
    document.body.innerHTML = `
      <div class="state-container">
        <button id="increment-btn">Increment</button>
        <div id="counter-display">0</div>
        <div class="event-target"></div>
      </div>
    `;

    // Intentionally NOT resetting shared state to create MORE pollution
    // globalCounter = 0;  // COMMENTED OUT - causes state pollution
    // sharedCache = {};   // COMMENTED OUT - causes state pollution

    // Actually increment counter to guarantee pollution
    globalCounter += Math.floor(Math.random() * 5) + 1; // Add 1-5 to counter each time
    sharedCache[`pollution-${Date.now()}`] = "polluted data"; // Add random cache entries
  });

  // FLAKY TEST 25: Shared counter state pollution
  test("should start with counter at zero (FLAKY: state pollution)", () => {
    const counterDisplay = document.getElementById("counter-display");

    // Mock counter increment function that uses global state
    const mockIncrement = () => {
      globalCounter++;
      counterDisplay.textContent = globalCounter.toString();
    };

    // Test assumes counter starts at 0, but previous tests may have incremented it
    expect(globalCounter).toBe(0); // FLAKY: might be > 0 from previous tests
    expect(counterDisplay.textContent).toBe("0");

    mockIncrement();
    expect(globalCounter).toBe(1); // FLAKY: might be > 1 if starting value wasn't 0
  });

  // FLAKY TEST 26: Cache pollution between tests
  test("should have empty cache initially (FLAKY: cache pollution)", () => {
    // Mock cache operations
    const mockSetCache = (key, value) => {
      sharedCache[key] = value;
    };

    const mockGetCache = (key) => {
      return sharedCache[key];
    };

    // Test assumes empty cache, but previous tests may have populated it
    expect(Object.keys(sharedCache)).toHaveLength(0); // FLAKY: cache might have entries from previous tests
    expect(mockGetCache("user")).toBeUndefined(); // FLAKY: might exist from previous test

    mockSetCache("user", { id: 1, name: "Test User" });
    expect(mockGetCache("user")).toBeDefined();
    expect(sharedCache.user.name).toBe("Test User");
  });

  // FLAKY TEST 27: Event listener accumulation
  test("should handle events correctly (FLAKY: listener pollution)", () => {
    const eventTarget = document.querySelector(".event-target");
    let clickCount = 0;

    // Mock event listener that accumulates
    const mockAddClickListener = () => {
      const handler = () => {
        clickCount++;
      };

      eventTarget.addEventListener("click", handler);
      eventListeners.push({ element: eventTarget, type: "click", handler });
    };

    mockAddClickListener();

    // Simulate click
    eventTarget.click();

    // Test assumes only one listener, but previous tests may have added more
    expect(clickCount).toBe(1); // FLAKY: might be > 1 if previous tests added listeners
    expect(eventListeners).toHaveLength(1); // FLAKY: might have more listeners from previous tests
  });

  // FLAKY TEST 28: DOM pollution from previous tests
  test("should have clean DOM structure (FLAKY: DOM pollution)", () => {
    // Previous tests might have added elements that weren't cleaned up
    const existingButtons = document.querySelectorAll("button");
    const existingDivs = document.querySelectorAll("div");

    // Test assumes specific DOM structure from beforeEach
    expect(existingButtons).toHaveLength(1); // FLAKY: previous tests might have added buttons
    expect(existingDivs).toHaveLength(3); // FLAKY: previous tests might have added divs

    // Add element that won't be cleaned up
    const newElement = document.createElement("div");
    newElement.className = "polluting-element";
    document.body.appendChild(newElement);

    expect(document.querySelector(".polluting-element")).toBeInTheDocument();
  });

  // FLAKY TEST 29: Global variable pollution
  test("should not have global variables set (FLAKY: global pollution)", () => {
    // Mock setting global variables
    const mockSetGlobals = () => {
      window.testGlobal = "test value";
      window.userPreferences = { theme: "dark" };
      global.debugMode = true;
    };

    // Test assumes no globals, but previous tests may have set them
    expect(window.testGlobal).toBeUndefined(); // FLAKY: might be set from previous test
    expect(window.userPreferences).toBeUndefined(); // FLAKY: might exist from previous test
    expect(global.debugMode).toBeUndefined(); // FLAKY: might be set from previous test

    mockSetGlobals();

    expect(window.testGlobal).toBe("test value");
    expect(window.userPreferences.theme).toBe("dark");
    expect(global.debugMode).toBe(true);

    // Intentionally NOT cleaning up globals
  });

  test("should handle timers correctly (FLAKY: timer pollution)", () => {
    jest.useFakeTimers();
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.9);
    let timerCount = 0;

    const mockStartTimer = () => {
      const interval = setInterval(() => {
        timerCount++;
      }, 50);

      if (Math.random() > 0.5) {
        setTimeout(() => {
          clearInterval(interval);
        }, 200);
      }
    };

    mockStartTimer();

    jest.advanceTimersByTime(200);

    expect(timerCount).toBe(4);
    expect(timerCount).toBeGreaterThan(0);

    randomSpy.mockRestore();
    jest.useRealTimers();
  });

  // FLAKY TEST 31: Module state pollution
  test("should have clean module state (FLAKY: module pollution)", () => {
    // Mock module with internal state
    const mockModule = (() => {
      let internalState = { initialized: false, data: [] };

      return {
        initialize: () => {
          internalState.initialized = true;
          internalState.data = ["initial"];
        },

        addData: (item) => {
          internalState.data.push(item);
        },

        getState: () => internalState,

        // No reset method - state persists between tests
      };
    })();

    // Test assumes module is not initialized
    expect(mockModule.getState().initialized).toBe(false); // FLAKY: might be true from previous test
    expect(mockModule.getState().data).toHaveLength(0); // FLAKY: might have data from previous test

    mockModule.initialize();
    mockModule.addData("test item");

    expect(mockModule.getState().initialized).toBe(true);
    expect(mockModule.getState().data).toContain("test item");
  });

  // FLAKY TEST 32: CSS class pollution
  test("should have clean CSS classes (FLAKY: CSS pollution)", () => {
    const container = document.querySelector(".state-container");

    // Mock CSS class manipulation
    const mockApplyTheme = (theme) => {
      document.body.classList.add(`theme-${theme}`);
      container.classList.add("themed");
    };

    // Test assumes no theme classes
    expect(document.body.classList.contains("theme-dark")).toBe(false); // FLAKY: might exist from previous test
    expect(document.body.classList.contains("theme-light")).toBe(false); // FLAKY: might exist from previous test
    expect(container.classList.contains("themed")).toBe(false); // FLAKY: might exist from previous test

    mockApplyTheme("dark");

    expect(document.body.classList.contains("theme-dark")).toBe(true);
    expect(container.classList.contains("themed")).toBe(true);

    // Intentionally NOT cleaning up classes
  });

  // FLAKY TEST 33: Local storage pollution
  test("should have clean local storage (FLAKY: storage pollution)", () => {
    // Mock localStorage operations
    const mockStorage = {
      setItem: (key, value) => {
        localStorage.setItem(key, JSON.stringify(value));
      },

      getItem: (key) => {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      },
    };

    // Test assumes clean localStorage
    expect(mockStorage.getItem("userSettings")).toBeNull(); // FLAKY: might exist from previous test
    expect(mockStorage.getItem("gameState")).toBeNull(); // FLAKY: might exist from previous test
    expect(localStorage.length).toBe(0); // FLAKY: might have items from previous tests

    mockStorage.setItem("userSettings", { volume: 0.8 });
    mockStorage.setItem("gameState", { level: 1, score: 100 });

    expect(mockStorage.getItem("userSettings").volume).toBe(0.8);
    expect(mockStorage.getItem("gameState").level).toBe(1);

    // Intentionally NOT cleaning up localStorage
  });

  // FLAKY TEST 34: Async state pollution
  test("should handle async state correctly (FLAKY: async pollution)", async () => {
    let asyncResults = [];

    // Mock async operation that adds to shared array
    const mockAsyncOperation = async (id) => {
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
      asyncResults.push(`result-${id}`);
    };

    // Test assumes empty results array
    expect(asyncResults).toHaveLength(0); // FLAKY: might have results from previous async tests

    // Start async operations
    const promises = [
      mockAsyncOperation(1),
      mockAsyncOperation(2),
      mockAsyncOperation(3),
    ];

    await Promise.all(promises);

    expect(asyncResults).toHaveLength(3); // FLAKY: might have more if previous tests added results
    expect(asyncResults).toContain("result-1");
    expect(asyncResults).toContain("result-2");
    expect(asyncResults).toContain("result-3");
  });
});
