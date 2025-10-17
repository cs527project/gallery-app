/**
 * @jest-environment jsdom
 */

describe('Flaky Randomness-Based Tests', () => {
  let mockHTML;

  beforeEach(() => {
    mockHTML = `
      <div class="game-container">
        <div id="score-display">0</div>
        <button id="random-action">Random Action</button>
        <div class="shuffle-list">
          <div class="item" data-id="1">Item 1</div>
          <div class="item" data-id="2">Item 2</div>
          <div class="item" data-id="3">Item 3</div>
        </div>
      </div>
    `;
    document.body.innerHTML = mockHTML;
  });

  // TEST 11: Deterministic Math.random() logic
  test('should generate expected random values (deterministic)', () => {
    const scoreDisplay = document.getElementById('score-display');
    
    // Random score generation driven by stubbed Math.random
    const mockGenerateScore = () => {
      const randomMultiplier = Math.random(); // 0-1
      const baseScore = 100;
      return Math.floor(baseScore * randomMultiplier);
    };

    const randSpy = jest.spyOn(Math, 'random')
      .mockReturnValueOnce(0.86)
      .mockReturnValueOnce(0.12)
      .mockReturnValueOnce(0.42);

    const score1 = mockGenerateScore();
    const score2 = mockGenerateScore();
    const score3 = mockGenerateScore();

    expect(score1).toBe(86);
    expect(score2).toBe(12);
    expect(score3).toBe(42);
    expect([score1, score2, score3]).toEqual([86, 12, 42]);

    randSpy.mockRestore();
  });

  // TEST 12: Date/time dependent behavior made deterministic
  test('should handle time-based logic correctly (date deterministic)', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2021-01-01T10:00:10Z'));

    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    const currentSecond = currentTime.getSeconds();
    
    // Time-based feature toggle
    const mockIsFeatureEnabled = () => {
      // Feature enabled only during specific times
      return currentHour >= 9 && currentHour < 17 && currentMinute % 2 === 0;
    };

    const mockGetTimeBasedMessage = () => {
      if (currentSecond < 30) {
        return 'First half of minute';
      } else {
        return 'Second half of minute';
      }
    };

    expect(mockIsFeatureEnabled()).toBe(true);
    expect(mockGetTimeBasedMessage()).toBe('First half of minute');
    expect(currentMinute).toBe(0);

    jest.useRealTimers();
  });

  // TEST 13: Array shuffling made deterministic via stubbed randomness
  test('should shuffle array deterministically with stubbed randomness', () => {
    const originalArray = [1, 2, 3, 4, 5];
    
    // Fisher-Yates shuffle
    const mockShuffle = (array) => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const randSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

    const shuffled1 = mockShuffle(originalArray);

    // With Math.random() stubbed to 0, the expected result is deterministic
    expect(shuffled1).toEqual([2, 3, 4, 5, 1]);
    // Invariants
    expect([...shuffled1].sort()).toEqual([...originalArray].sort());
    expect(shuffled1.length).toBe(originalArray.length);

    randSpy.mockRestore();
  });

  // TEST 14: Probability outcomes made deterministic via stubs
  test('should handle probability deterministically via stubs', () => {
    let successCount = 0;
    let failureCount = 0;
    const iterations = 10;
    
    // 70% success rate predicate
    const mockProbabilityAction = () => {
      return Math.random() < 0.7;
    };

    const seq = [0.1, 0.2, 0.3, 0.8, 0.9, 0.15, 0.65, 0.72, 0.05, 0.85];
    const randSpy = jest.spyOn(Math, 'random');
    seq.forEach(v => randSpy.mockReturnValueOnce(v));

    // Run iterations with deterministic sequence
    for (let i = 0; i < iterations; i++) {
      if (mockProbabilityAction()) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    expect(successCount).toBe(seq.filter(v => v < 0.7).length);
    expect(failureCount).toBe(iterations - successCount);
    expect(successCount + failureCount).toBe(iterations);

    randSpy.mockRestore();
  });

  // TEST 15: Random ID generation assertions relaxed to invariants
  test('should generate IDs without assuming impossible uniqueness', () => {
    const generatedIds = new Set();
    
    const mockGenerateId = () => {
      return Math.floor(Math.random() * 100).toString(); // Range 0-99
    };

    // Generate multiple IDs - more than the range guarantees collisions
    for (let i = 0; i < 150; i++) {
      const id = mockGenerateId();
      generatedIds.add(id);
    }

    // Invariants that always hold
    expect(generatedIds.size).toBeLessThan(150);
    expect(generatedIds.size).toBeLessThanOrEqual(100);
    expect(Array.from(generatedIds).every(id => /^\d+$/.test(id))).toBe(true);
  });

  // TEST 16: Random selection made deterministic via stubs
  test('should select random items deterministically with stubs', () => {
    const items = ['apple', 'banana', 'cherry', 'date', 'elderberry'];
    const selections = [];
    
    const mockRandomSelect = (array) => {
      const randomIndex = Math.floor(Math.random() * array.length);
      return array[randomIndex];
    };

    const seq = [0.2, 0.4, 0.6, 0.8, 0.0]; // indices 1,2,3,4,0
    const randSpy = jest.spyOn(Math, 'random');
    seq.forEach(v => randSpy.mockReturnValueOnce(v));

    for (let i = 0; i < 5; i++) {
      selections.push(mockRandomSelect(items));
    }

    expect(selections).toEqual(['banana', 'cherry', 'date', 'elderberry', 'apple']);
    expect(new Set(selections).size).toBe(5);

    randSpy.mockRestore();
  });

  // TEST 17: Random delay simulation made deterministic with fake timers
  test('should handle random delays (FLAKY: delay timing)', (done) => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2021-01-01T10:00:00Z'));

    let operationCompleted = false;
    const startTime = Date.now();
    
    const mockRandomDelayOperation = () => {
      const delay = Math.random() * 200 + 100; // 100-300ms
      setTimeout(() => {
        operationCompleted = true;
      }, delay);
    };

    mockRandomDelayOperation();
    
    setTimeout(() => {
      const elapsedTime = Date.now() - startTime;
      
      expect(operationCompleted).toBe(true);
      expect(elapsedTime).toBeGreaterThanOrEqual(100);
      jest.useRealTimers();
      done();
    }, 300);

    jest.advanceTimersByTime(300);
  });

  // TEST 18: Weighted random selection driven by deterministic sequence
  test('should respect weighted probabilities via deterministic sequence', () => {
    const weights = { common: 0.7, rare: 0.25, legendary: 0.05 };
    const results = { common: 0, rare: 0, legendary: 0 };
    const iterations = 20;
    
    const mockWeightedSelect = () => {
      const random = Math.random();
      if (random < weights.legendary) return 'legendary';
      if (random < weights.legendary + weights.rare) return 'rare';
      return 'common';
    };

    // Sequence with 1 legendary (<0.05), 5 rare (<0.30), 14 common
    const seq = [
      0.9, 0.8, 0.6, 0.3, 0.2, 0.01, 0.75, 0.26, 0.55, 0.4,
      0.15, 0.05, 0.95, 0.7, 0.85, 0.32, 0.22, 0.12, 0.88, 0.62
    ];
    const randSpy = jest.spyOn(Math, 'random');
    seq.forEach(v => randSpy.mockReturnValueOnce(v));

    for (let i = 0; i < iterations; i++) {
      const result = mockWeightedSelect();
      results[result]++;
    }

    expect(results).toEqual({ common: 13, rare: 6, legendary: 1 });

    randSpy.mockRestore();
  });
});
