/**
 * @jest-environment jsdom
 */

describe('Flaky User Interaction Tests', () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="interaction-container">
        <button id="click-me">Click Me</button>
        <button id="double-click-me">Double Click Me</button>
        <input id="text-input" type="text" />
        <div id="click-counter">0</div>
        <div id="input-display"></div>
        <div class="hover-target">Hover Me</div>
        <div id="hover-status">Not hovered</div>
        <div class="drag-container">
          <div class="draggable" id="drag-item">Drag Me</div>
          <div class="drop-zone" id="drop-zone">Drop Here</div>
        </div>
        <div id="drag-status">Not dragged</div>
      </div>
    `;
    document.body.innerHTML = mockHTML;
  });

  // FLAKY TEST 1: Rapid clicking with state updates
  test('should handle rapid button clicks correctly (FLAKY: click timing)', (done) => {
    const button = document.getElementById('click-me');
    const counter = document.getElementById('click-counter');
    let clickCount = 0;
    
    // Mock click handler with async state update
    const handleClick = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 100 + 50; // 50-150ms random delay
        setTimeout(() => {
          clickCount++;
          counter.textContent = clickCount.toString();
          resolve();
        }, delay);
      });
    };

    button.addEventListener('click', handleClick);

    // Rapid clicks without waiting for previous ones to complete
    const rapidClicks = async () => {
      for (let i = 0; i < 5; i++) {
        button.click();
        // No await - this creates race conditions
      }
    };

    rapidClicks();

    // Check results too early - clicks might not have processed
    setTimeout(() => {
      expect(clickCount).toBe(5); // FLAKY: will often be less than 5
      expect(counter.textContent).toBe('5'); // FLAKY: will often be less than 5
      done();
    }, 200); // Check at 200ms - often before all clicks complete
  });

  // FLAKY TEST 2: Double-click detection with timing issues
  test('should detect double-clicks correctly (FLAKY: double-click timing)', (done) => {
    const button = document.getElementById('double-click-me');
    const counter = document.getElementById('click-counter');
    let singleClicks = 0;
    let doubleClicks = 0;
    
    let clickTimeout;
    let lastClickTime = 0;
    
    const handleClick = () => {
      const now = Date.now();
      const timeDiff = now - lastClickTime;
      
      if (timeDiff < 300) { // Double-click threshold
        doubleClicks++;
        clearTimeout(clickTimeout);
      } else {
        clickTimeout = setTimeout(() => {
          singleClicks++;
        }, 350); // Wait longer than double-click threshold
      }
      
      lastClickTime = now;
    };

    button.addEventListener('click', handleClick);

    // Simulate double-click with variable timing
    const simulateDoubleClick = () => {
      button.click();
      setTimeout(() => {
        button.click();
      }, Math.random() * 200 + 100); // 100-300ms between clicks
    };

    simulateDoubleClick();

    // Check results with insufficient wait time
    setTimeout(() => {
      expect(doubleClicks).toBe(1); // FLAKY: timing might not be detected correctly
      expect(singleClicks).toBe(0); // FLAKY: might register as single clicks
      done();
    }, 400); // Check at 400ms - might be before double-click detection completes
  });

  // FLAKY TEST 3: Input validation with debouncing
  test('should validate input with proper debouncing (FLAKY: input timing)', (done) => {
    const input = document.getElementById('text-input');
    const display = document.getElementById('input-display');
    let validationCount = 0;
    
    // Mock debounced validation
    const debouncedValidation = (() => {
      let timeout;
      return (value) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          validationCount++;
          display.textContent = value.length > 3 ? 'Valid' : 'Invalid';
        }, Math.random() * 150 + 100); // 100-250ms debounce
      };
    })();

    input.addEventListener('input', (e) => {
      debouncedValidation(e.target.value);
    });

    // Rapid typing without waiting
    const rapidTyping = () => {
      input.value = 'a';
      input.dispatchEvent(new Event('input'));
      setTimeout(() => {
        input.value = 'ab';
        input.dispatchEvent(new Event('input'));
      }, 50);
      setTimeout(() => {
        input.value = 'abc';
        input.dispatchEvent(new Event('input'));
      }, 100);
      setTimeout(() => {
        input.value = 'abcd';
        input.dispatchEvent(new Event('input'));
      }, 150);
    };

    rapidTyping();

    // Check validation results too early
    setTimeout(() => {
      expect(validationCount).toBe(1); // FLAKY: might be 0 or more than 1
      expect(display.textContent).toBe('Valid'); // FLAKY: might be 'Invalid' or empty
      done();
    }, 200); // Check at 200ms - often before debounce completes
  });

  // FLAKY TEST 4: Hover state with timing issues
  test('should handle hover states correctly (FLAKY: hover timing)', (done) => {
    const hoverTarget = document.querySelector('.hover-target');
    const status = document.getElementById('hover-status');
    let hoverCount = 0;
    
    // Mock hover handler with async processing
    const handleHover = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 100 + 50; // 50-150ms
        setTimeout(() => {
          hoverCount++;
          status.textContent = 'Hovered';
          resolve();
        }, delay);
      });
    };

    const handleLeave = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 80 + 30; // 30-110ms
        setTimeout(() => {
          status.textContent = 'Not hovered';
          resolve();
        }, delay);
      });
    };

    hoverTarget.addEventListener('mouseenter', handleHover);
    hoverTarget.addEventListener('mouseleave', handleLeave);

    // Simulate rapid hover/leave events
    const simulateHover = () => {
      hoverTarget.dispatchEvent(new Event('mouseenter'));
      setTimeout(() => {
        hoverTarget.dispatchEvent(new Event('mouseleave'));
      }, 100);
      setTimeout(() => {
        hoverTarget.dispatchEvent(new Event('mouseenter'));
      }, 200);
    };

    simulateHover();

    // Check hover state too early
    setTimeout(() => {
      expect(hoverCount).toBeGreaterThan(0); // FLAKY: might be 0
      expect(status.textContent).toBe('Hovered'); // FLAKY: might be 'Not hovered'
      done();
    }, 150); // Check at 150ms - often before hover processing completes
  });

  // FLAKY TEST 5: Drag and drop with timing issues
  test('should handle drag and drop correctly (FLAKY: drag timing)', (done) => {
    const dragItem = document.getElementById('drag-item');
    const dropZone = document.getElementById('drop-zone');
    const status = document.getElementById('drag-status');
    
    let dragStarted = false;
    let dragEnded = false;
    let dropCompleted = false;
    
    // Mock drag handlers with async processing
    const handleDragStart = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          dragStarted = true;
          status.textContent = 'Dragging';
          resolve();
        }, Math.random() * 100 + 50); // 50-150ms
      });
    };

    const handleDragEnd = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          dragEnded = true;
          resolve();
        }, Math.random() * 80 + 30); // 30-110ms
      });
    };

    const handleDrop = () => {
      return new Promise((resolve) => {
        setTimeout(() => {
          dropCompleted = true;
          status.textContent = 'Dropped';
          resolve();
        }, Math.random() * 120 + 60); // 60-180ms
      });
    };

    dragItem.addEventListener('dragstart', handleDragStart);
    dragItem.addEventListener('dragend', handleDragEnd);
    dropZone.addEventListener('drop', handleDrop);

    // Simulate drag and drop sequence
    const simulateDragDrop = () => {
      dragItem.dispatchEvent(new Event('dragstart'));
      setTimeout(() => {
        dropZone.dispatchEvent(new Event('dragover'));
      }, 100);
      setTimeout(() => {
        dropZone.dispatchEvent(new Event('drop'));
      }, 200);
      setTimeout(() => {
        dragItem.dispatchEvent(new Event('dragend'));
      }, 300);
    };

    simulateDragDrop();

    // Check drag and drop state too early
    setTimeout(() => {
      expect(dragStarted).toBe(true); // FLAKY: might be false
      expect(dropCompleted).toBe(true); // FLAKY: might be false
      expect(dragEnded).toBe(true); // FLAKY: might be false
      expect(status.textContent).toBe('Dropped'); // FLAKY: might be 'Dragging' or 'Not dragged'
      done();
    }, 250); // Check at 250ms - often before all events complete
  });
});
