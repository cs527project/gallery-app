require("@testing-library/jest-dom");

// Mock window methods that aren't available in jsdom
global.alert = jest.fn();
global.scrollTo = jest.fn();

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation((callback) => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  trigger: (entries) => callback(entries),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn((cb) => setTimeout(cb, 0));
global.cancelAnimationFrame = jest.fn();

// Deterministic timezone and locale
process.env.TZ = "America/New_York";
Object.defineProperty(navigator, "language", {
  value: "en-US",
  configurable: true,
});

// Deterministic screen and device metrics
Object.defineProperty(window, "devicePixelRatio", {
  value: 1,
  configurable: true,
});
Object.defineProperty(window, "screen", {
  value: { width: 1920, height: 1080, availWidth: 1920, availHeight: 1040 },
  configurable: true,
});

// Network-related stubs
Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
Object.defineProperty(navigator, "connection", {
  value: { effectiveType: "4g" },
  configurable: true,
});

// Service Worker stub
Object.defineProperty(navigator, "serviceWorker", {
  value: { register: jest.fn() },
  configurable: true,
});

// File/URL API
global.URL.createObjectURL = jest.fn();

// Canvas/WebGL stubs
const mock2dContext = {
  fillStyle: "#000",
  fillRect: jest.fn(),
  beginPath: jest.fn(),
  arc: jest.fn(),
  fill: jest.fn(),
  getImageData: jest.fn(() => ({
    data: new Uint8ClampedArray([255, 0, 0, 255]),
  })),
};

const mockWebGLContext = {
  RENDERER: "RENDERER",
  VENDOR: "VENDOR",
  getParameter: jest.fn((p) =>
    p === "RENDERER" ? "Mock GPU Renderer" : "Mock GPU Vendor",
  ),
};

HTMLCanvasElement.prototype.getContext = function (type) {
  if (type === "2d") return mock2dContext;
  if (type === "webgl" || type === "experimental-webgl")
    return mockWebGLContext;
  return null;
};

// Mock window.pageYOffset
Object.defineProperty(window, "pageYOffset", {
  value: 0,
  writable: true,
});

// Mock window.innerHeight
Object.defineProperty(window, "innerHeight", {
  value: 1024,
  writable: true,
});

// Setup DOM before each test
beforeEach(() => {
  // Reset DOM
  document.body.innerHTML = "";
  document.head.innerHTML = "";

  // Reset window scroll position
  window.pageYOffset = 0;

  // Clear all mocks
  jest.clearAllMocks();
});
