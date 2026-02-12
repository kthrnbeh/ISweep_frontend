const CURRENT_PLAN_KEY = "currentPlan"; // Single localStorage key for plan data
const SETTINGS_KEY = "isweep-settings";
const themePreferenceKey = 'isweep-theme';
const authStateKey = 'auth-state'; // Stores { name, email, token } for demo purposes.
const authModal = document.getElementById('authModal');
const authBackdrop = authModal ? authModal.querySelector('.auth-backdrop') : null;
const authPanels = authModal ? authModal.querySelectorAll('[data-auth-panel]') : [];
const accountSummary = authModal ? authModal.querySelector('#accountSummary') : null;
const signInForm = authModal ? authModal.querySelector('#signInForm') : null;
const createAccountForm = authModal ? authModal.querySelector('#createAccountForm') : null;
const themeButtons = document.querySelectorAll('[data-theme-option]');
const themeModeLabel = document.getElementById("themeModeLabel");
const signedInBlock = document.querySelector('[data-auth-signed-in]');
const signedOutBlock = document.querySelector('[data-auth-signed-out]');
const authLaunchers = document.querySelectorAll('[data-open-auth]');
const authSwitchers = document.querySelectorAll('[data-switch-auth]');
const logoutButtons = document.querySelectorAll('[data-logout]');
const authState = {
  get() {
    try {
      const raw = localStorage.getItem(authStateKey);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error('Failed to parse auth state', error);
      return null;
    }
  },
  set(state) {
    localStorage.setItem(authStateKey, JSON.stringify(state));
  },
  clear() {
    localStorage.removeItem(authStateKey);
  },
};

function applyThemePreference(preference) {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const resolvedTheme = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference;
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark');
  document.documentElement.setAttribute('data-theme', resolvedTheme);
  localStorage.setItem(themePreferenceKey, preference);

  if (themeModeLabel) {
    const label = preference === 'system' ? 'System' : resolvedTheme === 'dark' ? 'Dark' : 'Light';
    themeModeLabel.textContent = label;
  }

  themeButtons.forEach((button) => {
    const isSelected = button.getAttribute('data-theme-option') === preference;
    button.setAttribute('aria-pressed', isSelected);
  });
}

function showAuthPanel(panel) {
  if (!authModal) return;
  authPanels.forEach((p) => {
    p.style.display = p.getAttribute('data-auth-panel') === panel ? 'block' : 'none';
  });
  authModal.style.display = 'block';
}

function closeAuth() {
  if (!authModal) return;
  authModal.style.display = 'none';
}

function syncAuthUI() {
  const state = authState.get();
  const isSignedIn = Boolean(state);

  if (signedInBlock && signedOutBlock) {
    signedInBlock.style.display = isSignedIn ? 'block' : 'none';
    signedOutBlock.style.display = isSignedIn ? 'none' : 'block';
    if (state) {
      const accountName = signedInBlock.querySelector('.account-name');
      const accountEmail = signedInBlock.querySelector('.account-email');
      if (accountName) accountName.textContent = state.name || 'Welcome back';
      if (accountEmail) accountEmail.textContent = state.email || '';
    }
  }

  if (accountSummary) {
    accountSummary.textContent = state
      ? `${state.name || 'Account'}, ${state.email || ''}`
      : 'Not signed in.';
  }
}

function fakeAuthApi(payload) {
  // Placeholder to simulate async auth; replace with real API later.
  return new Promise((resolve) => {
    setTimeout(() => resolve({ token: 'demo-token', ...payload }), 300);
  });
}

const savedThemePreference = localStorage.getItem(themePreferenceKey) || 'light';
applyThemePreference(savedThemePreference);

if (themeButtons.length) {
  themeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const theme = button.getAttribute('data-theme-option');
      applyThemePreference(theme || 'light');
    });
  });
}

if (authLaunchers.length && authModal) {
  authLaunchers.forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const panel = trigger.getAttribute('data-open-auth') || 'signin';
      showAuthPanel(panel);
    });
  });
}

if (authSwitchers.length) {
  authSwitchers.forEach((switcher) => {
    switcher.addEventListener('click', () => {
      const target = switcher.getAttribute('data-switch-auth');
      if (target) showAuthPanel(target);
    });
  });
}

if (logoutButtons.length) {
  logoutButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      authState.clear();
      syncAuthUI();
      closeAuth();
      if (dropdownMenu) dropdownMenu.classList.remove('show');
    });
  });
}

if (authBackdrop) {
  authBackdrop.addEventListener('click', (event) => {
    if (event.target === authBackdrop || event.target.hasAttribute('data-close-auth')) {
      closeAuth();
    }
  });
}

if (signInForm) {
  signInForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(signInForm);
    const payload = {
      email: formData.get('email'),
      password: formData.get('password'),
    };
    const result = await fakeAuthApi(payload);
    authState.set({ name: payload.email.split('@')[0] || 'User', email: payload.email, token: result.token });
    syncAuthUI();
    closeAuth();
    if (dropdownMenu) dropdownMenu.classList.remove('show');
  });
}

if (createAccountForm) {
  createAccountForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(createAccountForm);
    const payload = {
      name: formData.get('name'),
      email: formData.get('email'),
      password: formData.get('password'),
      confirm: formData.get('confirm'),
    };
    // TODO: add password confirmation validation + real API integration when backend is ready.
    const result = await fakeAuthApi(payload);
    authState.set({ name: payload.name || 'New user', email: payload.email, token: result.token });
    syncAuthUI();
    closeAuth();
    if (dropdownMenu) dropdownMenu.classList.remove('show');
  });
}

syncAuthUI();
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
//  THEME PICKER (All pages via avatar dropdown)
//-----------------------------------------------------
const themeModeLabel = document.getElementById("themeModeLabel"); // This grabs the visible theme label in the header dropdown so we can show the active mode.

function applyThemePreference(preference) { // This function applies the chosen theme and records the preference for later visits.
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches; // This reads the system theme so "system" mode can mirror the OS choice.
  const resolvedTheme = preference === "system" ? (prefersDark ? "dark" : "light") : preference; // This decides whether to use light or dark based on user choice or system setting.
  document.documentElement.classList.toggle("dark", resolvedTheme === "dark"); // This toggles the root .dark class so all pages switch palettes consistently.
  localStorage.setItem("isweep-theme", preference); // This stores the user’s preference so it persists across page loads.
  if (themeModeLabel) themeModeLabel.textContent = preference === "system" ? "System" : resolvedTheme === "dark" ? "Dark" : "Light"; // This updates the header label so users see which mode is active.
} // This closes the theme application helper.

const savedThemePreference = localStorage.getItem("isweep-theme") || "light"; // This reads the last saved theme so we can initialize the UI predictably.
applyThemePreference(savedThemePreference); // This applies the stored theme immediately so the page loads in the correct palette.

const themeOptionButtons = document.querySelectorAll("[data-theme-option]"); // This selects all dropdown buttons that set a specific theme choice.
themeOptionButtons.forEach((button) => { // This loops through each option so we can attach click handlers individually.
  button.addEventListener("click", () => { // This listens for a user click on a theme option.
    const targetTheme = button.getAttribute("data-theme-option"); // This reads the desired theme from the data attribute so the handler stays generic.
    applyThemePreference(targetTheme); // This applies the selected theme and updates storage/label accordingly.
  }); // This closes the click listener attachment for a single button.
}); // This finishes wiring all theme option buttons.

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
//  INDEX & HELP PAGE DEMO (REMOVED FOR MARKETING-ONLY HOME)
//-----------------------------------------------------
// Demo wiring removed because the subtitle test and broom overlay were stripped from the homepage to keep it marketing-only with a single hero video. // This comment documents the removal so future readers know why no demo wiring remains and prevents confusion about missing elements.

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
