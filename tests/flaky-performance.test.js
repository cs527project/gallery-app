/**
 * @jest-environment jsdom
 */

describe('Flaky Performance and Resource Tests', () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="performance-container">
        <div id="loading-indicator" style="display: none;">Loading...</div>
        <div id="content-area"></div>
        <button id="load-heavy-content">Load Heavy Content</button>
        <button id="process-large-data">Process Large Data</button>
        <div id="progress-bar">
          <div id="progress-fill" style="width: 0%;"></div>
        </div>
        <div id="memory-usage">Memory: 0MB</div>
        <div class="image-gallery">
          <img id="img1" src="" alt="Image 1" />
          <img id="img2" src="" alt="Image 2" />
          <img id="img3" src="" alt="Image 3" />
        </div>
        <div id="image-status">Images not loaded</div>
      </div>
    `;
    document.body.innerHTML = mockHTML;
  });

  // FLAKY TEST 1: Heavy content loading with timing issues
  test('should load heavy content correctly (FLAKY: loading timing)', (done) => {
    const loadingIndicator = document.getElementById('loading-indicator');
    const contentArea = document.getElementById('content-area');
    const loadBtn = document.getElementById('load-heavy-content');
    
    let loadingStarted = false;
    let loadingCompleted = false;
    let contentLoaded = false;
    
    // Mock heavy content loading with variable timing
    const loadHeavyContent = () => {
      return new Promise((resolve) => {
        loadingStarted = true;
        loadingIndicator.style.display = 'block';
        
        // Simulate heavy processing with random delay
        const delay = Math.random() * 2000 + 1000; // 1000-3000ms
        setTimeout(() => {
          loadingCompleted = true;
          loadingIndicator.style.display = 'none';
          contentArea.innerHTML = '<div>Heavy content loaded!</div>';
          contentLoaded = true;
          resolve();
        }, delay);
      });
    };

    loadBtn.addEventListener('click', loadHeavyContent);

    // Start loading
    loadBtn.click();

    // Check loading state too early
    setTimeout(() => {
      expect(loadingStarted).toBe(true); // FLAKY: might be false
      expect(loadingCompleted).toBe(true); // FLAKY: will often be false
      expect(contentLoaded).toBe(true); // FLAKY: will often be false
      expect(loadingIndicator.style.display).toBe('none'); // FLAKY: will often be 'block'
      expect(contentArea.innerHTML).toContain('Heavy content'); // FLAKY: will often be empty
      done();
    }, 800); // Check at 800ms - often before 1000-3000ms delay completes
  });

  // FLAKY TEST 2: Large data processing with progress tracking
  test('should process large data with progress updates (FLAKY: progress timing)', (done) => {
    const processBtn = document.getElementById('process-large-data');
    const progressFill = document.getElementById('progress-fill');
    const progressBar = document.getElementById('progress-bar');
    
    let processingStarted = false;
    let progressUpdates = 0;
    let processingCompleted = false;
    
    // Mock large data processing with progress updates
    const processLargeData = () => {
      return new Promise((resolve) => {
        processingStarted = true;
        
        const totalItems = 100;
        let processedItems = 0;
        
        const processBatch = () => {
          const batchSize = Math.floor(Math.random() * 10) + 5; // 5-15 items per batch
          const delay = Math.random() * 100 + 50; // 50-150ms per batch
          
          setTimeout(() => {
            processedItems += batchSize;
            progressUpdates++;
            const progress = Math.min((processedItems / totalItems) * 100, 100);
            progressFill.style.width = `${progress}%`;
            
            if (processedItems >= totalItems) {
              processingCompleted = true;
              resolve();
            } else {
              processBatch(); // Continue processing
            }
          }, delay);
        };
        
        processBatch();
      });
    };

    processBtn.addEventListener('click', processLargeData);

    // Start processing
    processBtn.click();

    // Check progress too early
    setTimeout(() => {
      expect(processingStarted).toBe(true); // FLAKY: might be false
      expect(processingCompleted).toBe(true); // FLAKY: will often be false
      expect(progressUpdates).toBeGreaterThan(5); // FLAKY: might be 0 or less
      expect(progressFill.style.width).toBe('100%'); // FLAKY: will often be less than 100%
      done();
    }, 600); // Check at 600ms - often before processing completes
  });

  // FLAKY TEST 3: Memory usage tracking with GC timing
  test('should track memory usage correctly (FLAKY: memory timing)', (done) => {
    const memoryDisplay = document.getElementById('memory-usage');
    let memoryAllocations = [];
    let memoryChecks = 0;
    
    // Mock memory allocation and tracking
    const allocateMemory = (size) => {
      const allocation = {
        id: Math.random(),
        size: size,
        timestamp: Date.now()
      };
      memoryAllocations.push(allocation);
      
      // Simulate async memory tracking
      setTimeout(() => {
        const totalMemory = memoryAllocations.reduce((sum, alloc) => sum + alloc.size, 0);
        memoryDisplay.textContent = `Memory: ${Math.round(totalMemory / 1024 / 1024)}MB`;
        memoryChecks++;
      }, Math.random() * 100 + 50); // 50-150ms delay
    };

    const cleanupMemory = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 200 + 100; // 100-300ms
        setTimeout(() => {
          memoryAllocations = [];
          memoryDisplay.textContent = 'Memory: 0MB';
          resolve();
        }, delay);
      });
    };

    // Allocate memory in batches
    const allocateMemoryBatches = () => {
      for (let i = 0; i < 5; i++) {
        allocateMemory(Math.random() * 1000000 + 500000); // 0.5-1.5MB per allocation
      }
    };

    allocateMemoryBatches();

    // Check memory state too early
    setTimeout(() => {
      expect(memoryAllocations.length).toBe(5); // FLAKY: might be less than 5
      expect(memoryChecks).toBe(5); // FLAKY: will often be less than 5
      expect(memoryDisplay.textContent).toContain('MB'); // FLAKY: might not be updated
      done();
    }, 200); // Check at 200ms - often before all memory checks complete
  });

  // FLAKY TEST 4: Image loading with timing issues
  test('should load images correctly (FLAKY: image loading timing)', (done) => {
    const img1 = document.getElementById('img1');
    const img2 = document.getElementById('img2');
    const img3 = document.getElementById('img3');
    const status = document.getElementById('image-status');
    
    let imagesLoaded = 0;
    let allImagesLoaded = false;
    
    // Mock image loading with variable timing
    const loadImage = (img, src) => {
      return new Promise((resolve) => {
        const delay = Math.random() * 1000 + 500; // 500-1500ms per image
        setTimeout(() => {
          img.src = src;
          img.onload = () => {
            imagesLoaded++;
            if (imagesLoaded === 3) {
              allImagesLoaded = true;
              status.textContent = 'All images loaded';
            }
            resolve();
          };
        }, delay);
      });
    };

    // Load all images
    const loadAllImages = async () => {
      await Promise.all([
        loadImage(img1, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iYmx1ZSIvPjwvc3ZnPg=='),
        loadImage(img2, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0icmVkIi8+PC9zdmc+'),
        loadImage(img3, 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iZ3JlZW4iLz48L3N2Zz4=')
      ]);
    };

    loadAllImages();

    // Check image loading state too early
    setTimeout(() => {
      expect(imagesLoaded).toBe(3); // FLAKY: will often be less than 3
      expect(allImagesLoaded).toBe(true); // FLAKY: will often be false
      expect(status.textContent).toBe('All images loaded'); // FLAKY: will often be 'Images not loaded'
      expect(img1.src).toBeTruthy(); // FLAKY: might be empty
      expect(img2.src).toBeTruthy(); // FLAKY: might be empty
      expect(img3.src).toBeTruthy(); // FLAKY: might be empty
      done();
    }, 800); // Check at 800ms - often before 500-1500ms delays complete
  });

  // FLAKY TEST 5: Resource cleanup with timing issues
  test('should cleanup resources correctly (FLAKY: cleanup timing)', (done) => {
    const contentArea = document.getElementById('content-area');
    let resourcesCreated = 0;
    let resourcesCleaned = 0;
    let cleanupCompleted = false;
    
    // Mock resource creation and cleanup
    const createResource = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 100 + 50; // 50-150ms
        setTimeout(() => {
          resourcesCreated++;
          const resource = document.createElement('div');
          resource.className = 'resource';
          resource.textContent = `Resource ${resourcesCreated}`;
          contentArea.appendChild(resource);
          resolve(resource);
        }, delay);
      });
    };

    const cleanupResources = () => {
      return new Promise((resolve) => {
        const delay = Math.random() * 150 + 100; // 100-250ms
        setTimeout(() => {
          const resources = contentArea.querySelectorAll('.resource');
          resources.forEach(resource => {
            resource.remove();
            resourcesCleaned++;
          });
          cleanupCompleted = true;
          resolve();
        }, delay);
      });
    };

    // Create resources and then cleanup
    const createAndCleanup = async () => {
      for (let i = 0; i < 3; i++) {
        await createResource();
      }
      await cleanupResources();
    };

    createAndCleanup();

    // Check cleanup state too early
    setTimeout(() => {
      expect(resourcesCreated).toBe(3); // FLAKY: might be less than 3
      expect(resourcesCleaned).toBe(3); // FLAKY: will often be less than 3
      expect(cleanupCompleted).toBe(true); // FLAKY: will often be false
      expect(contentArea.querySelectorAll('.resource')).toHaveLength(0); // FLAKY: might still have resources
      done();
    }, 400); // Check at 400ms - often before cleanup completes
  });
});
