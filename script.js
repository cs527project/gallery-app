// DOM Content Loaded
document.addEventListener("DOMContentLoaded", function () {
  // Navigation functionality
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");
  const navLinks = document.querySelectorAll(".nav-link");

  // Mobile menu toggle
  hamburger.addEventListener("click", function () {
    hamburger.classList.toggle("active");
    navMenu.classList.toggle("active");
  });

  // Close mobile menu when clicking on links
  navLinks.forEach((link) => {
    link.addEventListener("click", function () {
      hamburger.classList.remove("active");
      navMenu.classList.remove("active");
    });
  });

  // Navbar scroll effect
  window.addEventListener("scroll", function () {
    const navbar = document.querySelector(".navbar");
    if (window.scrollY > 100) {
      navbar.style.background = "rgba(255, 255, 255, 0.98)";
      navbar.style.boxShadow = "0 2px 20px rgba(0,0,0,0.1)";
    } else {
      navbar.style.background = "rgba(255, 255, 255, 0.95)";
      navbar.style.boxShadow = "none";
    }
  });

  // Gallery filtering
  const filterButtons = document.querySelectorAll(".filter-btn");
  const galleryItems = document.querySelectorAll(".gallery-item");

  filterButtons.forEach((button) => {
    button.addEventListener("click", function () {
      // Remove active class from all buttons
      filterButtons.forEach((btn) => btn.classList.remove("active"));
      // Add active class to clicked button
      this.classList.add("active");

      const filterValue = this.getAttribute("data-filter");

      galleryItems.forEach((item) => {
        const itemCategory = item.getAttribute("data-category");

        if (filterValue === "all" || itemCategory === filterValue) {
          item.classList.remove("hide");
          item.classList.add("show");
          item.style.display = "block";
        } else {
          item.classList.remove("show");
          item.classList.add("hide");
          setTimeout(() => {
            item.style.display = "none";
          }, 300);
        }
      });
    });
  });

  // Smooth scrolling for navigation links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute("href"));
      if (target) {
        const offsetTop = target.offsetTop - 80; // Account for fixed navbar
        window.scrollTo({
          top: offsetTop,
          behavior: "smooth",
        });
      }
    });
  });

  // Form submission
  const contactForm = document.querySelector(".contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();

      // Get form data
      const formData = new FormData(this);
      const formObject = {};
      formData.forEach((value, key) => {
        formObject[key] = value;
      });

      // Simulate form submission
      const submitBtn = this.querySelector(".submit-btn");
      const originalText = submitBtn.textContent;

      submitBtn.textContent = "Sending...";
      submitBtn.disabled = true;

      // Simulate API call
      setTimeout(() => {
        alert("Thank you for your message! I'll get back to you soon.");
        this.reset();
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
      }, 2000);
    });
  }

  // Parallax effect for hero section
  window.addEventListener("scroll", function () {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector(".hero");
    if (hero) {
      const rate = scrolled * -0.5;
      hero.style.transform = `translateY(${rate}px)`;
    }
  });

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  };

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  // Observe elements for scroll animations
  const animateElements = document.querySelectorAll(
    ".featured-item, .gallery-item, .about-content, .contact-content"
  );
  animateElements.forEach((el) => {
    el.style.opacity = "0";
    el.style.transform = "translateY(50px)";
    el.style.transition = "opacity 0.6s ease, transform 0.6s ease";
    observer.observe(el);
  });

  // Counter animation for stats
  const stats = document.querySelectorAll(".stat-number");
  const countUp = (element, target) => {
    let current = 0;
    const increment = target / 100;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target;
        clearInterval(timer);
      } else {
        element.textContent = Math.floor(current);
      }
    }, 20);
  };

  const statsObserver = new IntersectionObserver(
    function (entries) {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          const finalValue = target.textContent;
          const numericValue = parseInt(finalValue.replace(/\D/g, ""));
          countUp(target, numericValue);
          statsObserver.unobserve(target);
        }
      });
    },
    { threshold: 0.5 }
  );

  stats.forEach((stat) => {
    statsObserver.observe(stat);
  });

  // Gallery item click to enlarge (basic lightbox effect)
  galleryItems.forEach((item) => {
    item.addEventListener("click", function () {
      const img = this.querySelector("img");
      const imgSrc = img.src;
      const imgAlt = img.alt;

      // Create lightbox
      const lightbox = document.createElement("div");
      lightbox.classList.add("lightbox");
      lightbox.innerHTML = `
                <div class="lightbox-content">
                    <span class="lightbox-close">&times;</span>
                    <img src="${imgSrc}" alt="${imgAlt}">
                    <div class="lightbox-caption">${imgAlt}</div>
                </div>
            `;

      document.body.appendChild(lightbox);
      document.body.style.overflow = "hidden";

      // Close lightbox
      const closeBtn = lightbox.querySelector(".lightbox-close");
      closeBtn.addEventListener("click", closeLightbox);
      lightbox.addEventListener("click", function (e) {
        if (e.target === lightbox) {
          closeLightbox();
        }
      });

      function closeLightbox() {
        document.body.removeChild(lightbox);
        document.body.style.overflow = "auto";
      }

      // Close with Escape key
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") {
          closeLightbox();
        }
      });
    });
  });

  // Lazy loading for images
  const images = document.querySelectorAll("img[data-src]");
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target;
        img.src = img.dataset.src;
        img.classList.remove("lazy");
        imageObserver.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));

  // Add smooth reveal animation to section titles
  const sectionTitles = document.querySelectorAll(".section-title");
  sectionTitles.forEach((title) => {
    title.style.opacity = "0";
    title.style.transform = "translateY(30px)";
    title.style.transition = "opacity 0.8s ease, transform 0.8s ease";
    observer.observe(title);
  });

  // Featured items hover effect enhancement
  const featuredItems = document.querySelectorAll(".featured-item");
  featuredItems.forEach((item) => {
    item.addEventListener("mouseenter", function () {
      this.style.zIndex = "10";
    });

    item.addEventListener("mouseleave", function () {
      this.style.zIndex = "1";
    });
  });

  // Add scroll progress indicator
  const scrollProgress = document.createElement("div");
  scrollProgress.classList.add("scroll-progress");
  document.body.appendChild(scrollProgress);

  window.addEventListener("scroll", function () {
    const scrollTotal =
      document.documentElement.scrollHeight - window.innerHeight;
    const scrollCurrent = window.pageYOffset;
    const scrollPercentage = (scrollCurrent / scrollTotal) * 100;
    scrollProgress.style.width = scrollPercentage + "%";
  });
});

// Add CSS for lightbox and scroll progress
const additionalStyles = `
    .lightbox {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        opacity: 0;
        animation: fadeIn 0.3s ease forwards;
    }

    .lightbox-content {
        position: relative;
        max-width: 90%;
        max-height: 90%;
        text-align: center;
    }

    .lightbox-content img {
        max-width: 100%;
        max-height: 80vh;
        object-fit: contain;
        border-radius: 10px;
    }

    .lightbox-close {
        position: absolute;
        top: -40px;
        right: 0;
        color: white;
        font-size: 30px;
        cursor: pointer;
        font-weight: bold;
        z-index: 10001;
    }

    .lightbox-close:hover {
        color: #f39c12;
    }

    .lightbox-caption {
        color: white;
        margin-top: 1rem;
        font-size: 1.1rem;
    }

    .scroll-progress {
        position: fixed;
        top: 0;
        left: 0;
        width: 0%;
        height: 3px;
        background: #f39c12;
        z-index: 9999;
        transition: width 0.1s ease;
    }

    @keyframes fadeIn {
        to {
            opacity: 1;
        }
    }

    .lazy {
        opacity: 0;
        transition: opacity 0.3s ease;
    }

    .lazy.loaded {
        opacity: 1;
    }
`;

// Inject additional styles
const styleSheet = document.createElement("style");
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
