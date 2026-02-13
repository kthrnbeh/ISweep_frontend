const CURRENT_PLAN_KEY = "currentPlan"; // Stores the selected plan in localStorage so plan info persists.
const SETTINGS_KEY = "isweep-settings"; // Stores settings payloads in localStorage for the settings page demo.
const themePreferenceKey = 'isweep-theme'; // Stores the user’s theme preference so it survives reloads.
const themeLabelMap = { light: 'Light', dark: 'Dark', system: 'System' }; // Maps preference keys to human-friendly labels for the dropdown text.
const authStateKey = 'auth-state'; // Stores { name, email, token } as a placeholder auth state until backend exists.
const authModal = document.getElementById('authModal'); // Grabs the auth modal container if present on the page.
const authBackdrop = authModal ? authModal.querySelector('.auth-backdrop') : null; // Finds the backdrop to support outside-click close.
const authPanels = authModal ? authModal.querySelectorAll('[data-auth-panel]') : []; // Collects auth panels so we can toggle sign-in/create/account views.
const accountSummary = authModal ? authModal.querySelector('#accountSummary') : null; // Targets the account summary text to reflect signed-in user info.
const signInForm = authModal ? authModal.querySelector('#signInForm') : null; // Points to the sign-in form for submit handling.
const createAccountForm = authModal ? authModal.querySelector('#createAccountForm') : null; // Points to the create-account form for submit handling.
const themeButtons = document.querySelectorAll('[data-theme-option]'); // Collects all theme option buttons to wire click handlers.
const dropdownThemeToggle = document.querySelector('[data-theme-toggle]'); // Locates the dropdown theme toggle row now that the header button is removed.
const dropdownThemeIcon = dropdownThemeToggle ? dropdownThemeToggle.querySelector('[data-theme-icon]') : null; // Points to the icon span so we can swap sun/moon visuals.
const dropdownThemeLabel = dropdownThemeToggle ? dropdownThemeToggle.querySelector('[data-theme-label]') : null; // Points to the text span so we can show the current theme label.
const signedInBlock = document.querySelector('[data-auth-signed-in]'); // Finds the signed-in menu block to toggle visibility.
const signedOutBlock = document.querySelector('[data-auth-signed-out]'); // Finds the signed-out menu block to toggle visibility.
const authLaunchers = document.querySelectorAll('[data-open-auth]'); // Finds buttons that open the auth modal in specific modes.
const authSwitchers = document.querySelectorAll('[data-switch-auth]'); // Finds buttons that switch between auth panels inside the modal.
const logoutButtons = document.querySelectorAll('[data-logout]'); // Finds logout triggers in both modal and dropdown so we clear auth consistently.
const userMenu = document.querySelector('.user-menu'); // Grabs the dropdown element so we can close it after actions.
const authState = { // Lightweight helper to manage auth data in localStorage until a backend exists.
  get() { // Reads auth state from storage to know if the user is signed in.
    try { // Protects against JSON parsing errors so the UI does not crash.
      const raw = localStorage.getItem(authStateKey); // Pulls the raw string from storage.
      return raw ? JSON.parse(raw) : null; // Parses stored JSON or returns null when missing.
    } catch (error) { // Catches malformed JSON cases.
      console.error('Failed to parse auth state', error); // Logs the issue for debugging without breaking the page.
      return null; // Falls back to signed-out state on error.
    }
  },
  set(state) { // Writes auth state to storage so it persists across reloads.
    localStorage.setItem(authStateKey, JSON.stringify(state)); // Serializes the object into localStorage.
  },
  clear() { // Removes auth state to sign the user out locally.
    localStorage.removeItem(authStateKey); // Clears the stored auth entry.
  },
};

function applyThemePreference(preference) { // Applies the requested theme and updates UI/state.
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; // Detects OS dark mode for system selection.
  const resolvedTheme = preference === 'system' ? (prefersDark ? 'dark' : 'light') : preference; // Resolves actual theme based on system or explicit choice.
  document.documentElement.classList.toggle('dark', resolvedTheme === 'dark'); // Toggles Tailwind dark class to switch palettes.
  document.documentElement.setAttribute('data-theme', resolvedTheme); // Sets data attribute so CSS can react if needed.
  localStorage.setItem(themePreferenceKey, preference); // Persists the chosen preference for future visits.

  if (dropdownThemeToggle) { // Guard dropdown toggle to avoid null errors on pages without it.
    const icon = resolvedTheme === 'dark' ? '🌙' : '☀️'; // Picks an icon that represents the active theme.
    const label = themeLabelMap[preference] || themeLabelMap[resolvedTheme] || 'Light'; // Chooses a friendly label based on preference or resolved theme.
    if (dropdownThemeIcon) dropdownThemeIcon.textContent = icon; // Updates the icon span so users see sun/moon inside the dropdown.
    if (dropdownThemeLabel) dropdownThemeLabel.textContent = `Theme: ${label}`; // Updates the text so users know the current mode from the menu.
    dropdownThemeToggle.setAttribute('aria-label', `Toggle theme (current ${label})`); // Keeps the toggle accessible with the latest mode label.
  }

  themeButtons.forEach((button) => { // Syncs pressed state on every theme button.
    const isSelected = button.getAttribute('data-theme-option') === preference; // Checks if this button matches the chosen preference.
    button.setAttribute('aria-pressed', isSelected); // Announces selection state for accessibility.
  });
}

function showAuthPanel(panel) { // Switches the visible panel in the auth modal.
  if (!authModal) return; // Exits safely if the modal is absent on this page.
  authPanels.forEach((p) => { // Iterates panels to toggle visibility.
    p.style.display = p.getAttribute('data-auth-panel') === panel ? 'block' : 'none'; // Shows only the requested panel.
  });
  authModal.style.display = 'block'; // Displays the modal container.
}

function closeAuth() { // Hides the auth modal.
  if (!authModal) return; // Guard to avoid errors when modal is missing.
  authModal.style.display = 'none'; // Sets display none to close the modal.
}

function syncAuthUI() { // Updates dropdown and modal content based on auth state.
  const state = authState.get(); // Reads current auth data from storage.
  const isSignedIn = Boolean(state); // Flags whether a user is signed in.

  if (signedInBlock && signedOutBlock) { // Only toggle blocks if they exist.
    signedInBlock.style.display = isSignedIn ? 'block' : 'none'; // Shows signed-in menu when authenticated.
    signedOutBlock.style.display = isSignedIn ? 'none' : 'block'; // Shows sign-in/create when signed out.
    if (state) { // When signed in, populate identity text.
      const accountName = signedInBlock.querySelector('.account-name'); // Finds the name label inside the menu.
      const accountEmail = signedInBlock.querySelector('.account-email'); // Finds the email label inside the menu.
      if (accountName) accountName.textContent = state.name || 'Welcome back'; // Displays stored name with fallback.
      if (accountEmail) accountEmail.textContent = state.email || ''; // Displays stored email with fallback.
    }
  }

  if (accountSummary) { // Update modal account summary when present.
    accountSummary.textContent = state
      ? `${state.name || 'Account'}, ${state.email || ''}` // Shows name/email when signed in.
      : 'Not signed in.'; // Shows signed-out message otherwise.
  }
}

function fakeAuthApi(payload) { // Simulates async auth until real endpoints exist.
  // TODO: replace this stub with real backend login/register requests.
  return new Promise((resolve) => { // Returns a promise to mimic network latency.
    setTimeout(() => resolve({ token: 'demo-token', ...payload }), 300); // Resolves with a fake token and echoed payload.
  });
}

const savedThemePreference = localStorage.getItem(themePreferenceKey) || 'light'; // Reads persisted theme or defaults to light.
applyThemePreference(savedThemePreference); // Applies saved theme immediately to avoid flash.

if (dropdownThemeToggle) { // Bind dropdown toggle so theme can change from inside the menu.
  dropdownThemeToggle.addEventListener('click', () => { // Switches theme on button click in the dropdown.
    const current = localStorage.getItem(themePreferenceKey) || 'light'; // Reads current stored preference to decide next.
    const next = current === 'dark' ? 'light' : 'dark'; // Flips between light and dark for quick toggle.
    applyThemePreference(next); // Applies the new preference and updates storage/icon/label.
  });
}

if (themeButtons.length) { // Only bind if theme buttons are present.
  themeButtons.forEach((button) => { // Attach click to each theme option.
    button.addEventListener('click', () => { // Handles theme option selection.
      const theme = button.getAttribute('data-theme-option'); // Reads requested theme from data attribute.
      applyThemePreference(theme || 'light'); // Applies chosen theme with light as fallback.
    });
  });
}

if (authLaunchers.length && authModal) { // Bind modal openers when both launchers and modal exist.
  authLaunchers.forEach((trigger) => { // Attach handler to each launcher.
    trigger.addEventListener('click', () => { // Opens modal on click.
      const panel = trigger.getAttribute('data-open-auth') || 'signin'; // Chooses target panel (defaults to sign-in).
      showAuthPanel(panel); // Shows the requested auth panel.
    });
  });
}

if (authSwitchers.length) { // Wire panel switch buttons inside the modal.
  authSwitchers.forEach((switcher) => { // Iterate through switches.
    switcher.addEventListener('click', () => { // Respond to click to swap panels.
      const target = switcher.getAttribute('data-switch-auth'); // Reads the target panel key.
      if (target) showAuthPanel(target); // Shows the requested panel when defined.
    });
  });
}

if (logoutButtons.length) { // Bind logout across modal and dropdown.
  logoutButtons.forEach((btn) => { // Attach listener to each logout button.
    btn.addEventListener('click', () => { // Handles logout action.
      authState.clear(); // Clears stored auth data to sign out.
      syncAuthUI(); // Refreshes UI to signed-out state.
      closeAuth(); // Closes modal if it is open.
      if (userMenu) userMenu.open = false; // Closes the dropdown so the menu resets after signing out.
    });
  });
}

if (authBackdrop) { // Only add close behavior if backdrop exists.
  authBackdrop.addEventListener('click', (event) => { // Listens for clicks on backdrop or close controls.
    if (event.target === authBackdrop || event.target.hasAttribute('data-close-auth')) { // Checks if user clicked outside dialog or on close button.
      closeAuth(); // Hides the modal.
    }
  });
}

if (authModal) { // Adds escape-to-close when modal is present.
  document.addEventListener('keydown', (event) => { // Watches for keyboard events globally.
    if (event.key === 'Escape' && authModal.style.display === 'block') { // Closes only when modal is open and Escape is pressed.
      closeAuth(); // Hides the modal on Escape.
    }
  });
}

if (signInForm) { // Bind sign-in submission only when form exists.
  signInForm.addEventListener('submit', async (event) => { // Handles sign-in form submit.
    event.preventDefault(); // Prevents page reload on submit.
    const formData = new FormData(signInForm); // Collects form fields.
    const payload = { // Builds auth payload.
      email: formData.get('email'), // Reads email input.
      password: formData.get('password'), // Reads password input.
    };
    const result = await fakeAuthApi(payload); // Calls placeholder auth API for now.
    authState.set({ name: payload.email.split('@')[0] || 'User', email: payload.email, token: result.token }); // Saves demo auth state with a derived name.
    syncAuthUI(); // Refreshes menu/modal to signed-in state.
    closeAuth(); // Closes modal after successful sign-in.
  });
}

if (createAccountForm) { // Bind create-account submission when form exists.
  createAccountForm.addEventListener('submit', async (event) => { // Handles create-account form submit.
    event.preventDefault(); // Prevents reload on submit.
    const formData = new FormData(createAccountForm); // Collects form fields.
    const payload = { // Builds registration payload.
      name: formData.get('name'), // Reads name input.
      email: formData.get('email'), // Reads email input.
      password: formData.get('password'), // Reads password input.
      confirm: formData.get('confirm'), // Reads confirm password input.
    };
    // TODO: add password confirmation validation + call backend register endpoint.
    const result = await fakeAuthApi(payload); // Uses placeholder API until backend exists.
    authState.set({ name: payload.name || 'New user', email: payload.email, token: result.token }); // Saves demo auth state using provided name.
    syncAuthUI(); // Refreshes menu/modal to signed-in state.
    closeAuth(); // Closes modal after successful create.
  });
}

syncAuthUI(); // Initializes dropdown/modal state on load based on stored auth.
//-----------------------------------------------------
//  ISWEEP PLAN SYSTEM
//-----------------------------------------------------

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
