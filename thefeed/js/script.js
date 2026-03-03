document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // DOM helpers + element references
  // ---------------------------------------------------------------------------
  // Lightweight query helpers used throughout this script.
  const qs = (selector) => document.querySelector(selector);
  const qsa = (selector) => Array.from(document.querySelectorAll(selector));

  // Fixed UI blocks that animate into view on initial page load.
  const staticElements = [
    qs("h1"),
    qs("nav"),
    qs(".side-card-left"),
    qs(".side-card-right"),
    qs(".side-card-playlist"),
    qs(".side-card-collage"),
  ].filter(Boolean);

  // Feed cards reveal progressively as the user scrolls.
  const cards = qsa(".feed .card");

  // Playlist card elements.
  const playlistAudio = qs("#playlistAudio");
  const playlistPlayBtn = qs("#playlistPlayBtn");
  const playlistBtnLabel = qs("#playlistBtnLabel");
  const playlistProgress = qs("#playlistProgress");
  const playlistProgressFill = qs("#playlistProgressFill");
  const playlistTimeCurrent = qs("#playlistTimeCurrent");
  const playlistTimeTotal = qs("#playlistTimeTotal");

  // Collage widget elements.
  const collageImg = qs("#collageimg");
  const collagePlayButton = qs("#playbutton");
  const collageStopButton = qs("#stopbutton");

  // ---------------------------------------------------------------------------
  // Animation helpers
  // ---------------------------------------------------------------------------
  // Fade/slide-in animation used by fixed page elements.
  const animateStaticElement = (element, delayMs) => {
    const isNav = element.tagName === "NAV";

    element.style.opacity = "0";
    element.style.transition = isNav
      ? "opacity 0.9s ease-out"
      : "opacity 0.9s ease-out, transform 0.9s ease-out";

    if (!isNav) {
      element.style.transform = "translateY(24px)";
    }

    setTimeout(() => {
      element.style.opacity = "1";
      if (isNav) return;

      element.style.transform = "translateY(0)";
      setTimeout(() => {
        element.style.removeProperty("transform");
      }, 900);
    }, delayMs);
  };

  // Marks a feed card as visible once observed in viewport.
  const revealCard = (card) => {
    card.classList.add("is-visible");
    card.classList.remove("is-hidden");
  };

  // ---------------------------------------------------------------------------
  // Initial reveal setup
  // ---------------------------------------------------------------------------
  // Apply staged entry animation to static elements.
  staticElements.forEach((element, index) => {
    animateStaticElement(element, 180 + index * 120);
  });

  // Default cards to hidden state before intersection-driven reveal.
  cards.forEach((card) => card.classList.add("is-hidden"));

  // Fallback for older browsers: reveal all cards immediately.
  if (!("IntersectionObserver" in window)) {
    cards.forEach(revealCard);
    return;
  }

  // Reveal each feed card once it becomes visible in viewport.
  const cardObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        revealCard(entry.target);
        observer.unobserve(entry.target);
      });
    },
    {
      root: null,
      threshold: 0.16,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  cards.forEach((card) => cardObserver.observe(card));

  // ---------------------------------------------------------------------------
  // Playlist behavior
  // ---------------------------------------------------------------------------
  // Playlist controls and progress sync.
  if (
    playlistAudio &&
    playlistPlayBtn &&
    playlistBtnLabel &&
    playlistProgress &&
    playlistProgressFill &&
    playlistTimeCurrent &&
    playlistTimeTotal
  ) {
    // Convert seconds to mm:ss.
    const formatTime = (seconds) => {
      if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60).toString().padStart(2, "0");
      return `${mins}:${secs}`;
    };

    // Update progress bar, aria value, and time labels.
    const updateProgress = () => {
      const duration = playlistAudio.duration || 0;
      const current = playlistAudio.currentTime || 0;
      const progress = duration > 0 ? (current / duration) * 100 : 0;
      playlistProgressFill.style.width = `${progress}%`;
      playlistProgress.setAttribute("aria-valuenow", `${Math.round(progress)}`);
      playlistTimeCurrent.textContent = formatTime(current);
      playlistTimeTotal.textContent = formatTime(duration);
    };

    // Toggle play/pause from button.
    playlistPlayBtn.addEventListener("click", async () => {
      if (playlistAudio.paused) {
        await playlistAudio.play();
      } else {
        playlistAudio.pause();
      }
    });

    // Keep button label synchronized with player state.
    playlistAudio.addEventListener("play", () => {
      playlistBtnLabel.textContent = "Pause";
    });

    playlistAudio.addEventListener("pause", () => {
      playlistBtnLabel.textContent = "Play";
    });

    // Keep progress/time UI updated as the track plays.
    playlistAudio.addEventListener("loadedmetadata", updateProgress);
    playlistAudio.addEventListener("timeupdate", updateProgress);
    playlistAudio.addEventListener("ended", () => {
      playlistAudio.currentTime = 0;
      updateProgress();
    });
  }

  // ---------------------------------------------------------------------------
  // Collage behavior
  // ---------------------------------------------------------------------------
  // Collage slideshow controls.
  if (collageImg && collagePlayButton && collageStopButton) {
    const collageFrames = [
      "img/album1.jpeg",
      "img/album2.jpg",
      "img/album3.jpg",
      "img/album4.jpeg",
      "img/album5.jpg",
      "img/album6.jpg",
      "img/album7.jpg",
      "img/album8.jpg",
    ];
    let collageIndex = 0;
    let collageTimer = null;
    collageImg.src = collageFrames[0];

    // Advance one frame each tick.
    const showNextFrame = () => {
      collageIndex = (collageIndex + 1) % collageFrames.length;
      collageImg.src = collageFrames[collageIndex];
    };

    // Start frame cycling every second.
    const playCollage = () => {
      if (collageTimer) return;
      showNextFrame();
      collageTimer = setInterval(showNextFrame, 1000);
      collagePlayButton.disabled = true;
      collagePlayButton.innerHTML = '<span class="collage-cursor"></span>Playing....';
    };

    // Stop frame cycling and reset button state.
    const stopCollage = () => {
      clearInterval(collageTimer);
      collageTimer = null;
      collagePlayButton.disabled = false;
      collagePlayButton.innerHTML = '<span class="collage-cursor"></span>Play';
    };

    collagePlayButton.addEventListener("click", playCollage);
    collageStopButton.addEventListener("click", stopCollage);
  }
});
