/**
 * @jest-environment jsdom
 */

describe('Flaky DOM-Dependent Tests', () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="dynamic-container">
        <button id="add-element">Add Element</button>
        <div id="element-list"></div>
      </div>
      <div class="render-target"></div>
      <div class="measurement-box" style="width: 100px; height: 50px;"></div>
    `;
    document.body.innerHTML = mockHTML;
  });

  // FLAKY TEST 6: DOM element availability timing
  test('should find dynamically created elements (FLAKY: DOM timing)', async () => {
    const container = document.getElementById('element-list');
    const addButton = document.getElementById('add-element');

    // Mock dynamic element creation with longer variable timing
    const mockAddElement = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 150 + 50; // 50-200ms delay - much longer
        setTimeout(() => {
          const newElement = document.createElement('div');
          newElement.className = 'dynamic-item';
          newElement.textContent = 'Dynamic Item';
          container.appendChild(newElement);
          resolve();
        }, delay);
      });
    };

    await mockAddElement();

    const dynamicElement = document.querySelector('.dynamic-item');
    expect(dynamicElement).toBeInTheDocument();
    expect(dynamicElement.textContent).toBe('Dynamic Item');
  });

  // FLAKY TEST 7: Element dimensions and rendering
  test('should measure element dimensions correctly (FLAKY: rendering timing)', async () => {
    const measurementBox = document.querySelector('.measurement-box');
    const renderTarget = document.querySelector('.render-target');

    // Mock dynamic styling that affects measurements
    const mockApplyStyles = () => {
      return new Promise((resolve) => {
        // Simulate CSS loading/application delay
        setTimeout(() => {
          measurementBox.style.padding = '10px';
          measurementBox.style.border = '2px solid black';
          renderTarget.style.display = 'block';
          renderTarget.style.width = '200px';
          renderTarget.style.height = '100px';
          resolve();
        }, Math.random() * 30); // 0-30ms delay
      });
    };

    await mockApplyStyles();

    // Measure after styles are applied
    const boxRect = measurementBox.getBoundingClientRect();
    const targetRect = renderTarget.getBoundingClientRect();

    // These assertions depend on styles being applied
    expect(boxRect.width).toBe(124); // 100 + 20 padding + 4 border
    expect(boxRect.height).toBe(74); // 50 + 20 padding + 4 border
    expect(targetRect.width).toBe(200);
    expect(targetRect.height).toBe(100);
  });

  // FLAKY TEST 8: Event listener attachment timing
  test('should handle events on dynamically created elements (FLAKY: event timing)', async () => {
    const container = document.getElementById('element-list');
    let clickCount = 0;

    // Mock creating element with event listener
    const mockCreateClickableElement = () => {
      return new Promise((resolve) => {
        const element = document.createElement('button');
        element.className = 'clickable-item';
        element.textContent = 'Click me';

        // Add to DOM first
        container.appendChild(element);

        // Add event listener with longer delay (simulating framework behavior)
        setTimeout(() => {
          element.addEventListener('click', () => {
            clickCount++;
          });
          resolve(element);
        }, Math.random() * 100 + 50); // 50-150ms delay for event listener attachment
      });
    };

    const clickableElement = await mockCreateClickableElement();

    clickableElement.click();
    expect(clickCount).toBe(1);
    expect(clickableElement).toBeInTheDocument();
  });

  // FLAKY TEST 9: CSS class application timing
  test('should apply CSS classes correctly (FLAKY: class timing)', async () => {
    const renderTarget = document.querySelector('.render-target');
    let transitionCompleted = false;

    // Mock CSS class application with transition
    const mockApplyTransition = () => {
      return new Promise((resolve) => {
        renderTarget.classList.add('fade-in');

        // Simulate CSS transition completion detection
        setTimeout(() => {
          transitionCompleted = true;
          resolve();
        }, Math.random() * 100 + 50); // 50-150ms
      });
    };

    await mockApplyTransition();

    // Check class application
    expect(renderTarget.classList.contains('fade-in')).toBe(true);

    // Check transition completion
    expect(transitionCompleted).toBe(true);
  });

  // FLAKY TEST 10: Multiple DOM mutations
  test('should handle multiple DOM mutations correctly (FLAKY: mutation timing)', async () => {
    const container = document.getElementById('element-list');
    const mutations = [];

    // Mock MutationObserver-like behavior
    const mockObserveMutations = async () => {
      // Simulate multiple DOM changes with different timing
      await new Promise((resolve) => {
        setTimeout(() => {
          const div1 = document.createElement('div');
          div1.textContent = 'First';
          container.appendChild(div1);
          mutations.push('added-first');
          resolve();
        }, Math.random() * 20);
      });

      await new Promise((resolve) => {
        setTimeout(() => {
          const div2 = document.createElement('div');
          div2.textContent = 'Second';
          container.appendChild(div2);
          mutations.push('added-second');
          resolve();
        }, Math.random() * 40 + 10);
      });

      await new Promise((resolve) => {
        setTimeout(() => {
          const firstChild = container.firstElementChild;
          if (firstChild) {
            container.removeChild(firstChild);
            mutations.push('removed-first');
          }
          resolve();
        }, Math.random() * 60 + 20);
      });
    };

    await mockObserveMutations();

    // Check mutations after all operations complete
    expect(mutations).toContain('added-first');
    expect(mutations).toContain('added-second');
    expect(mutations).toContain('removed-first');
    expect(container.children.length).toBe(1);
  });
});
