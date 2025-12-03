/**
 * @jest-environment jsdom
 */

describe("Flaky State Management Tests", () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="state-container">
        <div id="counter-display">0</div>
        <button id="increment-btn">Increment</button>
        <button id="decrement-btn">Decrement</button>
        <button id="reset-btn">Reset</button>
        <div id="state-history"></div>
        <div class="toggle-container">
          <button id="toggle-btn">Toggle</button>
          <div id="toggle-status">Off</div>
        </div>
        <div class="form-state">
          <input id="name-input" type="text" />
          <input id="email-input" type="email" />
          <button id="submit-btn">Submit</button>
          <div id="form-status">Not submitted</div>
        </div>
      </div>
    `;
    document.body.innerHTML = mockHTML;
  });

  // FLAKY TEST 1: Counter state with race conditions
  test("should handle counter increments correctly (FLAKY: state race conditions)", (done) => {
    const display = document.getElementById("counter-display");
    const incrementBtn = document.getElementById("increment-btn");
    let counter = 0;
    let pendingIncrements = 0;

    // Mock increment with async state update
    const increment = () => {
      return new Promise((resolve) => {
        pendingIncrements++;
        const delay = Math.random() * 100 + 50; // 50-150ms
        setTimeout(() => {
          counter++;
          display.textContent = counter.toString();
          pendingIncrements--;
          resolve();
        }, delay);
      });
    };

    incrementBtn.addEventListener("click", increment);

    // Rapid clicks without waiting
    const rapidClicks = () => {
      for (let i = 0; i < 5; i++) {
        incrementBtn.click();
      }
    };

    rapidClicks();

    // Check state too early - increments might not be complete
    setTimeout(() => {
      expect(counter).toBe(5); // FLAKY: will often be less than 5
      expect(pendingIncrements).toBe(0); // FLAKY: will often be greater than 0
      expect(display.textContent).toBe("5"); // FLAKY: will often be less than 5
      done();
    }, 200); // Check at 200ms - often before all increments complete
  });

  // FLAKY TEST 2: State history with timing issues
  test("should maintain state history correctly (FLAKY: history timing)", (done) => {
    const history = document.getElementById("state-history");
    const incrementBtn = document.getElementById("increment-btn");
    const decrementBtn = document.getElementById("decrement-btn");
    const resetBtn = document.getElementById("reset-btn");

    let stateHistory = [];
    let currentState = 0;

    // Mock state update with history tracking
    const updateState = (newState) => {
      return new Promise((resolve) => {
        const delay = Math.random() * 80 + 40; // 40-120ms
        setTimeout(() => {
          stateHistory.push(currentState);
          currentState = newState;
          history.textContent = stateHistory.join(", ");
          resolve();
        }, delay);
      });
    };

    incrementBtn.addEventListener("click", () => updateState(currentState + 1));
    decrementBtn.addEventListener("click", () => updateState(currentState - 1));
    resetBtn.addEventListener("click", () => updateState(0));

    // Rapid state changes
    const rapidChanges = () => {
      incrementBtn.click();
      setTimeout(() => decrementBtn.click(), 50);
      setTimeout(() => incrementBtn.click(), 100);
      setTimeout(() => resetBtn.click(), 150);
    };

    rapidChanges();

    // Check history too early
    setTimeout(() => {
      expect(stateHistory.length).toBe(3); // FLAKY: will often be less than 3
      expect(currentState).toBe(0); // FLAKY: might not be reset yet
      expect(history.textContent).toContain("0"); // FLAKY: might not contain reset state
      done();
    }, 180); // Check at 180ms - often before all changes complete
  });

  // FLAKY TEST 3: Toggle state with debouncing
  test("should handle toggle state correctly (FLAKY: toggle timing)", () => {
    jest.useFakeTimers();

    const toggleBtn = document.getElementById("toggle-btn");
    const status = document.getElementById("toggle-status");
    let isOn = false;
    let toggleCount = 0;

    // Deterministic debounce delay
    const randomSpy = jest.spyOn(Math, "random").mockReturnValue(0.5); // 0.5 -> 140ms

    // Mock toggle with debouncing
    const debouncedToggle = (() => {
      let timeout;
      return () => {
        clearTimeout(timeout);
        timeout = setTimeout(
          () => {
            isOn = !isOn;
            toggleCount++;
            status.textContent = isOn ? "On" : "Off";
          },
          Math.random() * 120 + 80,
        ); // 80-200ms debounce
      };
    })();

    toggleBtn.addEventListener("click", debouncedToggle);

    // Rapid toggles (debounce collapses to one)
    for (let i = 0; i < 3; i++) {
      toggleBtn.click();
    }

    // Advance beyond max debounce to flush timer
    jest.advanceTimersByTime(250);

    expect(toggleCount).toBe(1);
    expect(status.textContent).toBe("On");

    randomSpy.mockRestore();
    jest.useRealTimers();
  });

  // FLAKY TEST 4: Form state validation
  test("should validate form state correctly (FLAKY: form timing)", (done) => {
    const nameInput = document.getElementById("name-input");
    const emailInput = document.getElementById("email-input");
    const submitBtn = document.getElementById("submit-btn");
    const status = document.getElementById("form-status");

    let formData = { name: "", email: "" };
    let validationCount = 0;

    // Mock form validation with async processing
    const validateForm = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 150 + 100; // 100-250ms
        setTimeout(() => {
          validationCount++;
          const isValid =
            formData.name.length > 0 && formData.email.includes("@");
          status.textContent = isValid ? "Valid" : "Invalid";
          resolve(isValid);
        }, delay);
      });
    };

    const updateFormData = () => {
      formData.name = nameInput.value;
      formData.email = emailInput.value;
    };

    nameInput.addEventListener("input", updateFormData);
    emailInput.addEventListener("input", updateFormData);
    submitBtn.addEventListener("click", validateForm);

    // Fill form and submit rapidly
    const fillAndSubmit = () => {
      nameInput.value = "John Doe";
      nameInput.dispatchEvent(new Event("input"));
      setTimeout(() => {
        emailInput.value = "john@example.com";
        emailInput.dispatchEvent(new Event("input"));
      }, 50);
      setTimeout(() => {
        submitBtn.click();
      }, 100);
    };

    fillAndSubmit();

    // Check validation too early
    setTimeout(() => {
      expect(validationCount).toBe(1); // FLAKY: might be 0
      expect(status.textContent).toBe("Valid"); // FLAKY: might be 'Invalid' or unchanged
      expect(formData.name).toBe("John Doe"); // FLAKY: might be empty
      expect(formData.email).toBe("john@example.com"); // FLAKY: might be empty
      done();
    }, 120); // Check at 120ms - often before validation completes
  });

  // FLAKY TEST 5: Complex state transitions
  test("should handle complex state transitions correctly (FLAKY: transition timing)", (done) => {
    const display = document.getElementById("counter-display");
    const incrementBtn = document.getElementById("increment-btn");
    const decrementBtn = document.getElementById("decrement-btn");
    const resetBtn = document.getElementById("reset-btn");

    let state = { value: 0, history: [], transitions: 0 };

    // Mock complex state transition
    const transitionState = (action) => {
      return new Promise((resolve) => {
        const delay = Math.random() * 100 + 50; // 50-150ms
        setTimeout(() => {
          state.history.push(state.value);
          state.transitions++;

          switch (action) {
            case "increment":
              state.value++;
              break;
            case "decrement":
              state.value--;
              break;
            case "reset":
              state.value = 0;
              break;
          }

          display.textContent = state.value.toString();
          resolve();
        }, delay);
      });
    };

    incrementBtn.addEventListener("click", () => transitionState("increment"));
    decrementBtn.addEventListener("click", () => transitionState("decrement"));
    resetBtn.addEventListener("click", () => transitionState("reset"));

    // Complex sequence of state changes
    const complexSequence = () => {
      incrementBtn.click();
      setTimeout(() => incrementBtn.click(), 50);
      setTimeout(() => decrementBtn.click(), 100);
      setTimeout(() => incrementBtn.click(), 150);
      setTimeout(() => resetBtn.click(), 200);
    };

    complexSequence();

    // Check final state too early
    setTimeout(() => {
      expect(state.value).toBe(0); // FLAKY: might not be reset yet
      expect(state.transitions).toBe(5); // FLAKY: will often be less than 5
      expect(state.history.length).toBe(4); // FLAKY: will often be less than 4
      expect(display.textContent).toBe("0"); // FLAKY: might not show final state
      done();
    }, 180); // Check at 180ms - often before all transitions complete
  });
});
