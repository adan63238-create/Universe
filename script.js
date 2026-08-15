/* =========================================================
   VOID — script.js
   Cinematic interaction layer
   ========================================================= */

(() => {
  "use strict";

  const $ = (selector, parent = document) => parent.querySelector(selector);
  const $$ = (selector, parent = document) =>
    Array.from(parent.querySelectorAll(selector));

  const state = {
    loaded: false,
    menuOpen: false,
    searchOpen: false,
    reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches
  };

  /* =======================================================
     Helpers
     ======================================================= */

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const lerp = (a, b, t) => a + (b - a) * t;

  const isVisible = (element) => {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return rect.bottom > 0 && rect.top < window.innerHeight;
  };

  /* =======================================================
     Loader
     ======================================================= */

  const loader = $("#loader") || $(".loader");
  const loaderProgress = $(".loader-progress");

  const updateLoader = (value) => {
    if (!loaderProgress) return;
    loaderProgress.style.width = `${clamp(value, 0, 100)}%`;
  };

  const finishLoader = () => {
    updateLoader(100);

    window.setTimeout(() => {
      loader?.classList.add("is-done");
      state.loaded = true;
      document.body.classList.remove("is-locked");

      window.dispatchEvent(new CustomEvent("void:loaded"));
    }, state.reducedMotion ? 0 : 450);
  };

  const startLoader = () => {
    if (!loader) {
      state.loaded = true;
      return;
    }

    document.body.classList.add("is-locked");

    let progress = 0;

    const timer = window.setInterval(() => {
      progress += Math.random() * 12 + 4;

      if (progress >= 92) {
        progress = 92;
        window.clearInterval(timer);
      }

      updateLoader(progress);
    }, 120);

    const complete = () => {
      window.clearInterval(timer);
      finishLoader();
    };

    if (document.readyState === "complete") {
      window.setTimeout(complete, 250);
    } else {
      window.addEventListener("load", () => {
        window.setTimeout(complete, 250);
      }, { once: true });
    }
  };

  /* =======================================================
     Mobile navigation
     ======================================================= */

  const menuButton = $(".menu-button");
  const navLinks = $(".nav-links");

  const setMenu = (open) => {
    state.menuOpen = open;

    menuButton?.classList.toggle("is-open", open);
    navLinks?.classList.toggle("is-open", open);
    menuButton?.setAttribute("aria-expanded", String(open));
  };

  menuButton?.addEventListener("click", () => {
    setMenu(!state.menuOpen);
  });

  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      setMenu(false);
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 640) setMenu(false);
  });

  /* =======================================================
     Search overlay
     ======================================================= */

  const searchOverlay = $(".search-overlay");
  const searchInput = $(".search-input");
  const searchButtons = $$("[data-search], .search-button");
  const closeSearchButtons = $$("[data-close-search], .close-overlay");

  const setSearch = (open) => {
    state.searchOpen = open;

    searchOverlay?.classList.toggle("is-open", open);

    if (open) {
      document.body.classList.add("is-locked");

      window.setTimeout(() => {
        searchInput?.focus();
      }, 100);
    } else {
      document.body.classList.remove("is-locked");
      searchInput?.blur();
    }
  };

  searchButtons.forEach((button) => {
    button.addEventListener("click", () => setSearch(true));
  });

  closeSearchButtons.forEach((button) => {
    button.addEventListener("click", () => setSearch(false));
  });

  searchOverlay?.addEventListener("click", (event) => {
    if (event.target === searchOverlay) {
      setSearch(false);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (state.searchOpen) setSearch(false);
      if (state.menuOpen) setMenu(false);
    }

    if (
      event.key === "/" &&
      !["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)
    ) {
      event.preventDefault();
      setSearch(true);
    }
  });

  /* =======================================================
     Smooth anchor navigation
     ======================================================= */

  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const targetId = link.getAttribute("href");

      if (!targetId || targetId === "#") return;

      const target = $(targetId);

      if (!target) return;

      event.preventDefault();

      target.scrollIntoView({
        behavior: state.reducedMotion ? "auto" : "smooth",
        block: "start"
      });
    });
  });

  /* =======================================================
     Active navigation
     ======================================================= */

  const sections = $$("section[id], [data-section-id]");
  const navigationLinks = $$(".nav-link");

  const updateActiveNavigation = () => {
    if (!sections.length || !navigationLinks.length) return;

    const scrollPosition = window.scrollY + window.innerHeight * 0.35;

    let activeSection = null;

    sections.forEach((section) => {
      const top = section.offsetTop;
      const bottom = top + section.offsetHeight;

      if (scrollPosition >= top && scrollPosition < bottom) {
        activeSection = section;
      }
    });

    if (!activeSection) return;

    const id =
      activeSection.id ||
      activeSection.dataset.sectionId;

    navigationLinks.forEach((link) => {
      const href = link.getAttribute("href");

      link.classList.toggle(
        "is-active",
        href === `#${id}`
      );

      link.classList.toggle(
        "active",
        href === `#${id}`
      );
    });
  };

  let navigationTick = false;

  window.addEventListener("scroll", () => {
    if (navigationTick) return;

    navigationTick = true;

    requestAnimationFrame(() => {
      updateActiveNavigation();
      navigationTick = false;
    });
  }, { passive: true });

  /* =======================================================
     Scroll reveal
     ======================================================= */

  const revealElements = $$(".reveal");

  if ("IntersectionObserver" in window && revealElements.length) {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px"
      }
    );

    revealElements.forEach((element) => {
      revealObserver.observe(element);
    });
  } else {
    revealElements.forEach((element) => {
      element.classList.add("is-visible");
    });
  }
  /* =======================================================
     Hero entrance
     ======================================================= */

  const heroWords = $$(".hero-title .word");
  const heroSubtitle = $(".hero-subtitle");
  const heroActions = $(".hero-actions");
  const heroEyebrow = $(".hero .eyebrow");

  const runHeroIntro = () => {
    if (state.reducedMotion) {
      heroWords.forEach((word) => {
        word.style.opacity = "1";
        word.style.transform = "none";
      });

      return;
    }

    heroWords.forEach((word, index) => {
      word.animate(
        [
          {
            opacity: 0,
            transform: "translateY(110%)"
          },
          {
            opacity: 1,
            transform: "translateY(0)"
          }
        ],
        {
          duration: 1100,
          delay: 150 + index * 100,
          easing: "cubic-bezier(.16,1,.3,1)",
          fill: "both"
        }
      );
    });

    [heroEyebrow, heroSubtitle, heroActions].forEach(
      (element, index) => {
        if (!element) return;

        element.animate(
          [
            {
              opacity: 0,
              transform: "translateY(18px)"
            },
            {
              opacity: 1,
              transform: "translateY(0)"
            }
          ],
          {
            duration: 900,
            delay: 300 + index * 120,
            easing: "cubic-bezier(.16,1,.3,1)",
            fill: "both"
          }
        );
      }
    );
  };

  window.addEventListener("void:loaded", runHeroIntro, {
    once: true
  });


  /* =======================================================
     Scroll progress
     ======================================================= */

  const progressElements = $$("[data-scroll-progress]");

  const updateScrollProgress = () => {
    const documentHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    if (documentHeight <= 0) return;

    const progress = window.scrollY / documentHeight;

    progressElements.forEach((element) => {
      element.style.transform =
        `scaleX(${clamp(progress, 0, 1)})`;
    });
  };

  let scrollProgressTick = false;

  window.addEventListener("scroll", () => {
    if (scrollProgressTick) return;

    scrollProgressTick = true;

    requestAnimationFrame(() => {
      updateScrollProgress();
      scrollProgressTick = false;
    });
  }, { passive: true });


  /* =======================================================
     Parallax
     ======================================================= */

  const parallaxElements = $$("[data-parallax]");

  const updateParallax = () => {
    if (state.reducedMotion) return;

    const viewportCenter = window.innerHeight / 2;

    parallaxElements.forEach((element) => {
      if (!isVisible(element)) return;

      const rect = element.getBoundingClientRect();
      const center = rect.top + rect.height / 2;
      const distance = center - viewportCenter;

      const speed =
        parseFloat(element.dataset.parallax) || 0.08;

      const translateY =
        distance * speed * -1;

      element.style.transform =
        `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
    });
  };

  let parallaxTick = false;

  window.addEventListener("scroll", () => {
    if (parallaxTick) return;

    parallaxTick = true;

    requestAnimationFrame(() => {
      updateParallax();
      parallaxTick = false;
    });
  }, { passive: true });


  /* =======================================================
     Horizontal tracks
     ======================================================= */

  const horizontalSections =
    $$("[data-horizontal-section]");

  const updateHorizontalTracks = () => {
    if (state.reducedMotion) return;

    horizontalSections.forEach((section) => {
      const track =
        $("[data-horizontal-track]", section);

      if (!track) return;

      const rect =
        section.getBoundingClientRect();

      const viewport =
        window.innerHeight;

      const distance =
        viewport + rect.height;

      const progress = clamp(
        (viewport - rect.top) / distance,
        0,
        1
      );

      const maxShift =
        Math.max(
          0,
          track.scrollWidth -
            window.innerWidth +
            40
        );

      const direction =
        section.dataset.horizontalDirection === "reverse"
          ? -1
          : 1;

      const translate =
        progress * maxShift * direction;

      track.style.transform =
        `translate3d(${-translate}px, 0, 0)`;
    });
  };

  let horizontalTick = false;

  window.addEventListener("scroll", () => {
    if (horizontalTick) return;

    horizontalTick = true;

    requestAnimationFrame(() => {
      updateHorizontalTracks();
      horizontalTick = false;
    });
  }, { passive: true });


  /* =======================================================
     Mouse movement / cinematic depth
     ======================================================= */

  const depthElements =
    $$("[data-depth]");

  if (
    !state.reducedMotion &&
    depthElements.length
  ) {
    window.addEventListener(
      "pointermove",
      (event) => {
        const x =
          event.clientX /
            window.innerWidth -
          0.5;

        const y =
          event.clientY /
            window.innerHeight -
          0.5;

        depthElements.forEach((element) => {
          const depth =
            parseFloat(
              element.dataset.depth
            ) || 8;

          const tx = x * depth;
          const ty = y * depth;

          element.style.transform =
            `translate3d(
              ${tx.toFixed(2)}px,
              ${ty.toFixed(2)}px,
              0
            )`;
        });
      },
      { passive: true }
    );
  }


  /* =======================================================
     Magnetic buttons
     ======================================================= */

  const magneticButtons =
    $$(".btn[data-magnetic], [data-magnetic]");

  if (
    !state.reducedMotion &&
    window.matchMedia("(pointer:fine)").matches
  ) {
    magneticButtons.forEach((button) => {

      button.addEventListener(
        "pointermove",
        (event) => {
          const rect =
            button.getBoundingClientRect();

          const x =
            event.clientX -
            (rect.left + rect.width / 2);

          const y =
            event.clientY -
            (rect.top + rect.height / 2);

          const strength =
            parseFloat(
              button.dataset.magnetic
            ) || 0.18;

          button.style.transform =
            `translate(
              ${x * strength}px,
              ${y * strength}px
            )`;
        }
      );

      button.addEventListener(
        "pointerleave",
        () => {
          button.style.transform = "";
        }
      );

    });
  }


  /* =======================================================
     Tilt cards
     ======================================================= */

  const tiltCards =
    $$("[data-tilt]");

  if (
    !state.reducedMotion &&
    window.matchMedia("(pointer:fine)").matches
  ) {
    tiltCards.forEach((card) => {

      card.addEventListener(
        "pointermove",
        (event) => {
          const rect =
            card.getBoundingClientRect();

          const x =
            (event.clientX -
              rect.left) /
              rect.width -
            0.5;

          const y =
            (event.clientY -
              rect.top) /
              rect.height -
            0.5;

          const amount =
            parseFloat(
              card.dataset.tilt
            ) || 5;

          card.style.transform =
            `perspective(900px)
             rotateX(${(-y * amount).toFixed(2)}deg)
             rotateY(${(x * amount).toFixed(2)}deg)
             translateY(-4px)`;
        }
      );

      card.addEventListener(
        "pointerleave",
        () => {
          card.style.transform = "";
        }
      );

    });
  }


  /* =======================================================
     Video handling
     ======================================================= */

  const videos =
    $$("video");

  videos.forEach((video) => {

    video.muted = true;
    video.playsInline = true;

    video.addEventListener(
      "error",
      () => {
        video.classList.add("media-error");
      }
    );

    if ("IntersectionObserver" in window) {

      const videoObserver =
        new IntersectionObserver(
          (entries) => {

            entries.forEach((entry) => {

              if (entry.isIntersecting) {

                const playPromise =
                  video.play();

                if (playPromise?.catch) {
                  playPromise.catch(() => {});
                }

              } else {

                video.pause();

              }

            });

          },
          {
            threshold: 0.15
          }
        );

      videoObserver.observe(video);
    }
  });


  /* =======================================================
     Image lazy loading
     ======================================================= */

  $$("img").forEach((image) => {

    if (!image.hasAttribute("loading")) {
      image.setAttribute(
        "loading",
        "lazy"
      );
    }

    image.addEventListener(
      "error",
      () => {
        image.classList.add(
          "media-error"
        );
      }
    );

  });
  /* =======================================================
     Counter animation
     ======================================================= */

  const counters = $$("[data-counter]");

  const animateCounter = (element) => {
    if (element.dataset.counted === "true") return;

    element.dataset.counted = "true";

    const target =
      parseFloat(element.dataset.counter);

    if (!Number.isFinite(target)) return;

    const decimals =
      parseInt(
        element.dataset.decimals || "0",
        10
      );

    const suffix =
      element.dataset.suffix || "";

    const prefix =
      element.dataset.prefix || "";

    if (state.reducedMotion) {
      element.textContent =
        `${prefix}${target.toFixed(decimals)}${suffix}`;

      return;
    }

    const duration = 1300;
    const start = performance.now();

    const tick = (now) => {

      const progress =
        clamp(
          (now - start) / duration,
          0,
          1
        );

      const eased =
        1 - Math.pow(1 - progress, 4);

      const value =
        target * eased;

      element.textContent =
        `${prefix}${value.toFixed(decimals)}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  };


  if (
    "IntersectionObserver" in window &&
    counters.length
  ) {

    const counterObserver =
      new IntersectionObserver(
        (entries, observer) => {

          entries.forEach((entry) => {

            if (!entry.isIntersecting) return;

            animateCounter(entry.target);

            observer.unobserve(
              entry.target
            );

          });

        },
        {
          threshold: 0.5
        }
      );

    counters.forEach((counter) => {
      counterObserver.observe(counter);
    });

  } else {

    counters.forEach(animateCounter);

  }


  /* =======================================================
     Cursor glow
     ======================================================= */

  const cursorGlow =
    $(".cursor-glow") ||
    $("#cursorGlow");

  if (
    cursorGlow &&
    !state.reducedMotion &&
    window.matchMedia("(pointer:fine)").matches
  ) {

    let glowX = 0;
    let glowY = 0;

    let targetX = 0;
    let targetY = 0;

    window.addEventListener(
      "pointermove",
      (event) => {

        targetX =
          event.clientX;

        targetY =
          event.clientY;

      },
      {
        passive: true
      }
    );

    const animateGlow = () => {

      glowX =
        lerp(
          glowX,
          targetX,
          0.14
        );

      glowY =
        lerp(
          glowY,
          targetY,
          0.14
        );

      cursorGlow.style.transform =
        `translate3d(
          ${glowX}px,
          ${glowY}px,
          0
        )`;

      requestAnimationFrame(
        animateGlow
      );
    };

    requestAnimationFrame(
      animateGlow
    );
  }


  /* =======================================================
     Back-to-top
     ======================================================= */

  $$("[data-top]").forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        window.scrollTo({
          top: 0,
          behavior:
            state.reducedMotion
              ? "auto"
              : "smooth"
        });

      }
    );

  });


  /* =======================================================
     Generic action buttons
     ======================================================= */

  $$("[data-action]").forEach((button) => {

    button.addEventListener(
      "click",
      () => {

        const action =
          button.dataset.action;

        if (action === "search") {
          setSearch(true);
        }

        if (action === "menu") {
          setMenu(!state.menuOpen);
        }

        if (action === "top") {

          window.scrollTo({
            top: 0,
            behavior:
              state.reducedMotion
                ? "auto"
                : "smooth"
          });

        }

      }
    );

  });


  /* =======================================================
     Keyboard accessibility
     ======================================================= */

  document.addEventListener(
    "keydown",
    (event) => {

      if (event.key !== "Tab") return;

      document.body.classList.add(
        "keyboard-user"
      );

    }
  );


  document.addEventListener(
    "pointerdown",
    () => {

      document.body.classList.remove(
        "keyboard-user"
      );

    },
    {
      passive: true
    }
  );


  /* =======================================================
     Visibility / resize refresh
     ======================================================= */

  document.addEventListener(
    "visibilitychange",
    () => {

      if (document.hidden) return;

      updateActiveNavigation();
      updateScrollProgress();
      updateParallax();
      updateHorizontalTracks();

    }
  );


  window.addEventListener(
    "resize",
    () => {

      updateScrollProgress();
      updateParallax();
      updateHorizontalTracks();

    }
  );


  /* =======================================================
     Initial state
     ======================================================= */

  updateActiveNavigation();

  updateScrollProgress();


  if (
    document.readyState !==
    "loading"
  ) {

    startLoader();

  } else {

    document.addEventListener(
      "DOMContentLoaded",
      startLoader,
      {
        once: true
      }
    );

  }


  /* =======================================================
     Public VOID API
     ======================================================= */

  window.VOID = {

    state,

    setMenu,

    setSearch,

    updateActiveNavigation,

    updateScrollProgress

  };


})();
