document.addEventListener("DOMContentLoaded", () => {
  // ---------------------------------------------------------------------------
  // DOM helpers + element references
  // ---------------------------------------------------------------------------
  const qs = (selector) => document.querySelector(selector);

  // Cache core landing-page elements used for intro animation and interactions.
  const heading = qs("h1, h2");
  const logo = qs(".logo");
  const tapIndicator = qs(".arrow");
  const pikachuLink = qs(".pikachu-container");
  const pikachuSfx = qs("#pikachuSfx");
  const music = qs("#bgMusic");
  const musicCueBtn = qs("#musicCueBtn");

  // Intro targets that fade/slide in when the page loads.
  const introElements = [heading, logo, tapIndicator].filter(Boolean);

  // ---------------------------------------------------------------------------
  // Intro animation helpers
  // ---------------------------------------------------------------------------
  // Click burst effect at the cursor position when Pikachu is clicked.
  const spawnCursorBurst = (x, y) => {
    const burst = document.createElement("span");
    burst.className = "cursor-burst";
    burst.style.left = `${x}px`;
    burst.style.top = `${y}px`;
    document.body.appendChild(burst);
    setTimeout(() => {
      burst.remove();
    }, 600);
  };

  const stageElement = (element, yOffset = 30) => {
    element.style.opacity = "0";
    element.style.transform = `translateY(${yOffset}px)`;
  };

  const revealElement = (element, durationMs = 1200) => {
    element.style.transition = `opacity ${durationMs}ms ease-out, transform ${durationMs}ms ease-out`;
    element.style.opacity = "1";
    element.style.transform = "translateY(0)";

    setTimeout(() => {
      element.style.removeProperty("transform");
    }, durationMs);
  };

  // ---------------------------------------------------------------------------
  // Initial reveal
  // ---------------------------------------------------------------------------
  // Stage intro elements first, then reveal them with a staggered entrance.
  introElements.forEach((element) => stageElement(element));

  setTimeout(() => {
    introElements.forEach((element) => revealElement(element, 1200));
  }, 700);

  // ---------------------------------------------------------------------------
  // Pikachu transition behavior
  // ---------------------------------------------------------------------------
  if (pikachuLink) {
    let isTransitioning = false;

    // Match Pikachu run duration to the pikapika SFX length.
    const setPikachuRunDuration = () => {
      if (!pikachuSfx) return;
      const duration = pikachuSfx.duration;
      if (!Number.isFinite(duration) || duration <= 0) return;
      document.body.style.setProperty("--pikachu-run-duration", `${duration}s`);
    };

    if (pikachuSfx) {
      pikachuSfx.addEventListener("loadedmetadata", setPikachuRunDuration);
      pikachuSfx.addEventListener("durationchange", setPikachuRunDuration);
    }

    // Handle transition to feed page when Pikachu is clicked.
    pikachuLink.addEventListener("click", (event) => {
      if (isTransitioning) {
        event.preventDefault();
        return;
      }

      const isModifiedClick = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
      const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (isModifiedClick || prefersReducedMotion) return;

      event.preventDefault();
      isTransitioning = true;
      spawnCursorBurst(event.clientX, event.clientY);

      // Start the run-off-screen animation after duration is known.
      const startExit = () => {
        setPikachuRunDuration();
        document.body.classList.add("is-pikachu-exit");
      };

      if (pikachuSfx) {
        pikachuSfx.currentTime = 0;
        void pikachuSfx.play();

        if (Number.isFinite(pikachuSfx.duration) && pikachuSfx.duration > 0) {
          startExit();
        } else {
          pikachuSfx.addEventListener("loadedmetadata", startExit, { once: true });
        }

        // Navigate after SFX finishes so movement/audio feel synchronized.
        pikachuSfx.addEventListener(
          "ended",
          () => {
            window.location.assign(pikachuLink.href);
          },
          { once: true }
        );

        return;
      }

      startExit();
    });
  }

  // ---------------------------------------------------------------------------
  // Background music widget behavior
  // ---------------------------------------------------------------------------
  if (music && musicCueBtn) {
    // Reflect current background music state in the floating button label/style.
    const setMusicButtonState = (isPlaying) => {
      musicCueBtn.textContent = isPlaying ? "Music: On" : "Music: Off";
      musicCueBtn.classList.toggle("is-active", isPlaying);
    };

    setTimeout(() => {
      musicCueBtn.classList.add("is-visible");
      setMusicButtonState(!music.paused);
    }, 700);

    // Toggle looping background music from the on-screen control.
    musicCueBtn.addEventListener("click", async () => {
      if (music.paused) {
        await music.play();
      } else {
        music.pause();
      }
      setMusicButtonState(!music.paused);
    });
  }
});
