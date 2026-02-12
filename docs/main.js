//-----------------------------------------------------
//  ISWEEP PLAN SYSTEM
//-----------------------------------------------------

const CURRENT_PLAN_KEY = "currentPlan"; // Single localStorage key for plan data

// Plan data structure: { key: "free"|"flexible"|"full", label: "Plan Name" }
const PLAN_CONFIGS = {
  free: { key: "free", label: "Free Tier" },
  flexible: { key: "flexible", label: "Flexible Subscription" },
  full: { key: "full", label: "Full Ownership" },
};

// Which plans allow filtering?
function planHasFiltering(planKey) {
  // Developer mode: allow all plans to use filtering
  return true;
  // Production: 
  // return planKey === "flexible" || planKey === "full";
  // free = no filtering
  // flexible = filtering ON
  // full = filtering ON
}

// Apply selected plan + redirect to Account.html
function selectPlan(planKey) {
  const planConfig = PLAN_CONFIGS[planKey];
  if (!planConfig) return;

  // Save plan data as single JSON object
  localStorage.setItem(CURRENT_PLAN_KEY, JSON.stringify(planConfig));

  // Redirect user to Account page
  window.location.href = "Account.html";
}

//-----------------------------------------------------
//  HOOK PLAN BUTTONS (Plans page)
//-----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const btnFree = document.getElementById("planFreeBtn");
  const btnFlexible = document.getElementById("planFlexibleBtn");
  const btnFull = document.getElementById("planFullBtn");

  if (btnFree) {
    btnFree.addEventListener("click", (e) => {
      e.preventDefault();
      selectPlan("free");
    });
  }

  if (btnFlexible) {
    btnFlexible.addEventListener("click", (e) => {
      e.preventDefault();
      selectPlan("flexible");
    });
  }

  if (btnFull) {
    btnFull.addEventListener("click", (e) => {
      e.preventDefault();
      selectPlan("full");
    });
  }
});

//-----------------------------------------------------
//  THEME TOGGLE (All pages)
//-----------------------------------------------------
const themeBtn = document.getElementById("themeBtn");

if (themeBtn) {
  // Load saved theme and apply it
  const savedTheme = localStorage.getItem("isweep-theme") || "light";
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    themeBtn.textContent = "Light Mode";
  } else {
    document.documentElement.classList.remove("dark");
    themeBtn.textContent = "Dark Mode";
  }

  // Toggle theme on button click
  themeBtn.addEventListener("click", () => {
    const isDark = document.documentElement.classList.toggle("dark");
    const newTheme = isDark ? "dark" : "light";
    localStorage.setItem("isweep-theme", newTheme);
    themeBtn.textContent = isDark ? "Light Mode" : "Dark Mode";
  });
}

//-----------------------------------------------------
//  ACCOUNT PAGE DISPLAY
//-----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const displayElement = document.getElementById("current-plan-display");
  const inputElement = document.querySelector('input[name="plan"]');

  try {
    const planData = localStorage.getItem(CURRENT_PLAN_KEY);
    const plan = planData ? JSON.parse(planData) : null;
    const planLabel = plan ? plan.label : "No plan selected yet";

    if (displayElement) displayElement.textContent = planLabel;
    if (inputElement) {
      inputElement.value = planLabel;
      if (!plan) inputElement.placeholder = "No plan selected yet";
    }
  } catch (err) {
    console.error("Failed to load plan from localStorage", err);
    if (displayElement) displayElement.textContent = "No plan selected yet";
    if (inputElement) inputElement.placeholder = "No plan selected yet";
  }
});

//-----------------------------------------------------
//  CHECK IF FILTERING IS ENABLED
//-----------------------------------------------------
function isFilteringEnabled() {
  try {
    const planData = localStorage.getItem(CURRENT_PLAN_KEY);
    const plan = planData ? JSON.parse(planData) : null;
    const planKey = plan ? plan.key : "free";
    return planHasFiltering(planKey);
  } catch (err) {
    console.error("Failed to check filtering status", err);
    return planHasFiltering("free");
  }
}
// Example usage:
// -----------------------------------------------------
// SETTINGS PAGE → LOCAL STORAGE + /preferences
// -----------------------------------------------------

// Reuse backend base + user id if you already have them.
// If not, uncomment these lines:
//
// const ISWEEP_API_BASE = "http://127.0.0.1:8000";
// const ISWEEP_USER_ID = "demo-user";

const SETTINGS_KEY = "isweep-settings";

// Helper: read current settings from localStorage
function loadSettingsFromStorage() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (err) {
    console.error("Failed to read settings from localStorage", err);
    return {};
  }
}

// Helper: save settings object to localStorage
function saveSettingsToStorage(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("Failed to save settings to localStorage", err);
  }
}

// Map select value -> backend action + duration
function mapAction(selectValue, defaultDurationSeconds) {
  switch (selectValue) {
    case "mute":
      return { action: "mute", duration_seconds: defaultDurationSeconds };
    case "skip":
      return { action: "skip", duration_seconds: defaultDurationSeconds };
    case "fast-forward":
      // Backend uses "fast_forward" with underscore
      return { action: "fast_forward", duration_seconds: defaultDurationSeconds };
    case "log-only":
    default:
      // "Log only" means no actual action, just logs
      return { action: "none", duration_seconds: 0 };
  }
}

// Send a single preference object to /preferences
async function sendPreferenceToBackend(prefBody) {
  const res = await fetch(`${ISWEEP_API_BASE}/preferences`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(prefBody),
  });

  if (!res.ok) {
    throw new Error("Failed to save preference: " + (await res.text()));
  }
}

// Build and send preferences for language/sexual/violence
async function syncFilterPreferencesWithBackend(settings) {
  // If backend isn't running, these will just error and we log it.
  const tasks = [];

  // 1) Profanity → ContentType.language
  const languageEnabled = !!settings.filter_profanity;
  const languageActionInfo = mapAction(
    settings.action_profanity || "mute",
    4 // seconds (matches earlier demo)
  );
  tasks.push(
    sendPreferenceToBackend({
      user_id: ISWEEP_USER_ID,
      content_type: "language",
      enabled: languageEnabled,
      action: languageActionInfo.action,
      duration_seconds: languageActionInfo.duration_seconds,
      blocked_words: [
        "badword",
        "dummy",
        "oh my god"
        // Later this list can come from another Settings panel
      ],
    })
  );

  // 2) Sexual content → ContentType.sexual
  const sexualEnabled = !!settings.filter_sexual;
  const sexualActionInfo = mapAction(
    settings.action_sexual || "skip",
    30 // seconds, matches your "Fast-forward 30 seconds" option
  );
  tasks.push(
    sendPreferenceToBackend({
      user_id: ISWEEP_USER_ID,
      content_type: "sexual",
      enabled: sexualEnabled,
      action: sexualActionInfo.action,
      duration_seconds: sexualActionInfo.duration_seconds,
      blocked_words: [], // Not word-based; backend can detect by type later
    })
  );

  // 3) Violence → ContentType.violence
  const violenceEnabled = !!settings.filter_violence;
  const violenceActionInfo = mapAction(
    settings.action_violence || "skip",
    15 // seconds, matches your "Fast-forward 15 seconds" option
  );
  tasks.push(
    sendPreferenceToBackend({
      user_id: ISWEEP_USER_ID,
      content_type: "violence",
      enabled: violenceEnabled,
      action: violenceActionInfo.action,
      duration_seconds: violenceActionInfo.duration_seconds,
      blocked_words: [],
    })
  );

  // Run all three calls
  await Promise.all(tasks);
}

// -----------------------------------------------------
// WIRE UP THE SETTINGS PAGE
// -----------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
  // Grab forms (will be null on non-settings pages)
  const contentFiltersForm = document.getElementById("contentFiltersForm");
  const filterActionsForm = document.getElementById("filterActionsForm");
  const sensitivityForm = document.getElementById("sensitivityForm");
  const notificationsForm = document.getElementById("notificationsForm");
  const parentalForm = document.getElementById("parentalForm");

  // If none of these exist, we're not on Settings page; do nothing.
  if (
    !contentFiltersForm &&
    !filterActionsForm &&
    !sensitivityForm &&
    !notificationsForm &&
    !parentalForm
  ) {
    return;
  }

  // Load previously saved settings and prefill the form UI
  const saved = loadSettingsFromStorage();

  // --- PREFILL: Content Filters checkboxes ---
  if (contentFiltersForm) {
    contentFiltersForm.elements["filter-profanity"].checked =
      saved.filter_profanity ?? true;
    contentFiltersForm.elements["filter-sexual"].checked =
      saved.filter_sexual ?? true;
    contentFiltersForm.elements["filter-violence"].checked =
      saved.filter_violence ?? false;
    contentFiltersForm.elements["filter-horror"].checked =
      saved.filter_horror ?? false;
    contentFiltersForm.elements["filter-crude"].checked =
      saved.filter_crude ?? false;

    contentFiltersForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      // Update settings object
      saved.filter_profanity =
        contentFiltersForm.elements["filter-profanity"].checked;
      saved.filter_sexual =
        contentFiltersForm.elements["filter-sexual"].checked;
      saved.filter_violence =
        contentFiltersForm.elements["filter-violence"].checked;
      saved.filter_horror =
        contentFiltersForm.elements["filter-horror"].checked;
      saved.filter_crude =
        contentFiltersForm.elements["filter-crude"].checked;

      saveSettingsToStorage(saved);

      try {
        await syncFilterPreferencesWithBackend(saved);
        alert("Content filter categories saved and sent to ISweep.");
      } catch (err) {
        console.error(err);
        alert(
          "Filters saved locally, but backend update failed. Is the API running?"
        );
      }
    });
  }

  // --- PREFILL: Filter Actions selects ---
  if (filterActionsForm) {
    // Profanity action
    if (saved.action_profanity) {
      filterActionsForm.elements["action-profanity"].value =
        saved.action_profanity;
    }

    // Sexual action
    if (saved.action_sexual) {
      filterActionsForm.elements["action-sexual"].value =
        saved.action_sexual;
    }

    // Violence action
    if (saved.action_violence) {
      filterActionsForm.elements["action-violence"].value =
        saved.action_violence;
    }

    filterActionsForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      saved.action_profanity =
        filterActionsForm.elements["action-profanity"].value;
      saved.action_sexual =
        filterActionsForm.elements["action-sexual"].value;
      saved.action_violence =
        filterActionsForm.elements["action-violence"].value;

      saveSettingsToStorage(saved);

      try {
        await syncFilterPreferencesWithBackend(saved);
        alert("Filter actions saved and sent to ISweep.");
      } catch (err) {
        console.error(err);
        alert(
          "Actions saved locally, but backend update failed. Is the API running?"
        );
      }
    });
  }

  // --- PREFILL: Sensitivity slider (local only for now) ---
  if (sensitivityForm) {
    const sensitivityInput = sensitivityForm.elements["sensitivity"];
    if (saved.sensitivity) {
      sensitivityInput.value = saved.sensitivity;
    }

    sensitivityForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saved.sensitivity = sensitivityInput.value;
      saveSettingsToStorage(saved);
      alert("Sensitivity saved.");
    });
  }

  // --- PREFILL: Notifications (local only) ---
  if (notificationsForm) {
    notificationsForm.elements["notify-email"].checked =
      saved.notify_email ?? true;
    notificationsForm.elements["notify-inapp"].checked =
      saved.notify_inapp ?? true;
    notificationsForm.elements["notify-none"].checked =
      saved.notify_none ?? false;

    notificationsForm.addEventListener("submit", (e) => {
      e.preventDefault();
      saved.notify_email =
        notificationsForm.elements["notify-email"].checked;
      saved.notify_inapp =
        notificationsForm.elements["notify-inapp"].checked;
      saved.notify_none =
        notificationsForm.elements["notify-none"].checked;

      saveSettingsToStorage(saved);
      alert("Notification preferences saved.");
    });
  }

  // --- PREFILL: Parental controls (PIN + require-pin) ---
  if (parentalForm) {
    const pinInput = parentalForm.elements["parent-pin"];
    const requirePinCheckbox = parentalForm.elements["require-pin"];

    if (saved.parent_pin) {
      pinInput.value = saved.parent_pin;
    }
    requirePinCheckbox.checked = saved.require_pin ?? true;

    parentalForm.addEventListener("submit", (e) => {
      e.preventDefault();

      saved.parent_pin = pinInput.value;
      saved.require_pin = requirePinCheckbox.checked;

      saveSettingsToStorage(saved);
      alert(
        "Parental PIN saved locally. (In a real app, this would be stored securely on the server.)"
      );
    });
  }
});

//-----------------------------------------------------
//  INDEX & HELP PAGE DEMO
//-----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const checkBtn = document.getElementById("checkSubtitleBtn"); // This grabs the test button so we can run the subtitle filter demo when clicked.
  const subtitleInput = document.getElementById("subtitleInput"); // This references the subtitle text box so we can read what the user typed.
  const decisionOutput = document.getElementById("decisionOutput"); // This points to the output area so we can show pass/fail messages.
  const broomIcon = document.getElementById("broomIcon"); // This finds the broom badge so we can flash it when filtering triggers.
  const demoVideo = document.getElementById("demoVideo"); // This locates the single demo video so play events can show the broom overlay.

  if (checkBtn && subtitleInput && decisionOutput) { // This ensures the filter demo only runs when all required elements exist, preventing null errors on other pages.
    checkBtn.addEventListener("click", () => { // This listens for clicks so we can process the user's subtitle input on demand.
      const text = subtitleInput.value.trim().toLowerCase(); // This normalizes the user text so keyword matching works reliably regardless of casing.
      if (!text) { // This guards against empty input so we don't run checks with no data.
        decisionOutput.textContent = "(Enter a subtitle line to test ISweep)"; // This prompts the user to type something so the demo has content to scan.
        return; // This exits early because there is nothing to filter yet.
      }

      const filteringEnabled = isFilteringEnabled(); // This checks the current plan so we only simulate filtering when the plan allows it.

      if (!filteringEnabled) { // This handles plans without filtering so users know why actions are blocked.
        decisionOutput.textContent =
          "ISweep Filtering is DISABLED on your current plan.\nUpgrade to Flexible or Full plan to enable filtering."; // This message tells users to upgrade because filtering logic stays off on restricted plans.
        return; // This stops further checks because filtering is intentionally disabled.
      }

      const blockedWords = [ // This array lists demo trigger words so the filter can flag them in the sample text.
        "badword", // This entry represents a placeholder profanity so the detection demo has a clear hit.
        "profanity", // This entry broadens the sample list so multiple triggers are possible.
        "swear", // This entry gives another common word to catch in the demo.
        "curse", // This entry expands coverage for varied language in the test.
        "hell", // This entry captures lighter profanity so users see nuanced detection.
        "damn", // This entry provides an additional mild word for the filter to find.
        "crap", // This entry rounds out the demo list to show multiple detections.
      ];
      let foundWords = []; // This array collects any blocked words that appear so we can display them back to the user.
      blockedWords.forEach((word) => { // This iterates through every sample word so we can compare each one against the input.
        if (text.includes(word)) { // This checks whether the current word exists in the input so we know when to flag it.
          foundWords.push(word); // This records the detected word so we can list all hits in the output message.
        } // This closes the condition that tracks individual blocked word matches.
      }); // This closes the loop that scans for all blocked words in the user text.

      if (foundWords.length > 0) { // This branch handles the case where at least one blocked word was found so we can simulate an action.
        decisionOutput.textContent = `🧹 ISweep DETECTED: ${foundWords.join(", "
        )}\nAction: MUTE\nDuration: 5 seconds`; // This message lists the detected words and shows the pretend mute action length so users see what would happen.
        if (broomIcon) { // This guard makes sure the overlay exists before we try to show it, preventing errors on pages without the icon.
          broomIcon.style.display = "block"; // This makes the broom badge visible to signal the filter activated.
          setTimeout(() => { // This sets a timer so the icon hides itself automatically after a short demo window.
            broomIcon.style.display = "none"; // This hides the broom badge so the UI returns to normal after the alert.
          }, 3000); // This keeps the badge visible for 3 seconds so users have time to notice it.
        } // This closes the broomIcon existence guard so we only manipulate it when present.
      } else { // This branch runs when no blocked words were found so we can reassure the user.
        decisionOutput.textContent =
          "✓ ISweep PASSED: No blocked content detected.\nAction: PLAY"; // This success message confirms nothing was flagged and playback would continue.
      } // This closes the detected/clean branching so the demo always produces a clear outcome.
    }); // This closes the click event listener setup for the subtitle check button.

    subtitleInput.addEventListener("keypress", (e) => { // This watches for Enter presses so keyboard users can run the demo quickly.
      if (e.key === "Enter") { // This checks for the Enter key so only the intended key triggers the action.
        checkBtn.click(); // This reuses the click handler so the logic stays in one place for both mouse and keyboard input.
      } // This closes the Enter key check to avoid triggering on other keys.
    }); // This closes the keypress listener on the subtitle input field.
  } // This closes the guard that ensures the subtitle demo elements exist before wiring events.

  if (demoVideo && broomIcon) { // This ensures video behavior only attaches when both the video and overlay exist, guarding against null references on pages without the demo.
    demoVideo.addEventListener("play", () => { // This listens for the video starting so we can show the broom badge during playback.
      broomIcon.style.display = "block"; // This shows the broom badge as soon as the demo video plays to mimic filtering feedback.
      setTimeout(() => broomIcon.style.display = "none", 5000); // This hides the badge after 5 seconds so the overlay does not stay on screen too long.
    }); // This closes the play event listener setup for the demo video.
  } // This closes the guard around the demo video behavior to keep the script safe on pages without the elements.
}); // This closes the DOMContentLoaded handler that wires the demo interactions after the page is ready.

//-----------------------------------------------------
//  HELP PAGE: CONTACT FORM
//-----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector("#contact-form .profile-form");
  if (contactForm) {
    contactForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const name = contactForm.elements["name"].value;
      const email = contactForm.elements["email"].value;
      const topic = contactForm.elements["topic"].value;
      const message = contactForm.elements["message"].value;

      // Show confirmation
      alert(
        `Thank you, ${name}! Your message about "${topic}" has been received. We'll respond to ${email} within 24 hours.`
      );

      // Reset form
      contactForm.reset();
    });
  }
});

//-----------------------------------------------------
//  HELP PAGE: CHAT WIDGET
//-----------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const chatToggle = document.getElementById("chatToggle");
  const chatWidget = document.getElementById("chatWidget");
  const chatClose = document.getElementById("chatClose");
  const chatForm = document.getElementById("chatForm");
  const chatInput = document.getElementById("chatInput");
  const chatLog = document.getElementById("chatLog");

  if (chatToggle && chatWidget && chatClose && chatForm) {
    chatToggle.addEventListener("click", () => {
      chatWidget.classList.toggle("open");
    });

    chatClose.addEventListener("click", () => {
      chatWidget.classList.remove("open");
    });

    // Fake chat: just echoes the user message into the window
    chatForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = chatInput.value.trim();
      if (!text) return;

      const msg = document.createElement("p");
      msg.className = "chat-message user";
      msg.textContent = text;
      chatLog.appendChild(msg);

      // Clear input
      chatInput.value = "";

      // Fake bot reply
      const reply = document.createElement("p");
      reply.className = "chat-message bot";
      reply.textContent =
        "Thanks for your message! In a real app, this would send to support.";
      chatLog.appendChild(reply);

      // Scroll to bottom
      chatLog.scrollTop = chatLog.scrollHeight;
    });
  }
});
