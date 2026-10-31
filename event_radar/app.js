(function () {
  "use strict";

  const config = window.EVENT_RADAR_CONFIG || {};
  const board = document.getElementById("event-board");
  const postForm = document.getElementById("post-form");
  const announcementInput = document.getElementById("announcement");
  const flyerInput = document.getElementById("flyer");
  const submitButton = document.getElementById("submit-button");
  const refreshButton = document.getElementById("refresh-button");
  const result = document.getElementById("result");
  const resultLabel = document.getElementById("result-label");
  const resultMessage = document.getElementById("result-message");
  const resultReasons = document.getElementById("result-reasons");
  const signInForm = document.getElementById("sign-in-form");
  const signOutButton = document.getElementById("sign-out-button");
  const moderatorSignedOut = document.getElementById("moderator-signed-out");
  const moderatorSignedIn = document.getElementById("moderator-signed-in");
  const moderatorAccount = document.getElementById("moderator-account");
  const moderatorResult = document.getElementById("moderator-result");
  const moderatorResultLabel = document.getElementById("moderator-result-label");
  const moderatorResultMessage = document.getElementById("moderator-result-message");
  const waitingBoard = document.getElementById("waiting-board");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const state = { events: [], freeFoodOnly: false };
  const maxFlyerBytes = 5 * 1024 * 1024;
  let moderatorSession = null;

  function fetchWithApiKeyOnly(input, init) {
    const request = new Request(input, init);
    const headers = new Headers(request.headers);
    const authorization = headers.get("authorization") || "";
    if (!authorization || /^Bearer\s+sb_/i.test(authorization)) {
      headers.delete("authorization");
    }
    headers.set("apikey", config.publishableKey);
    return window.fetch(request, { headers: headers });
  }

  const supabaseClient = window.supabase.createClient(
    config.supabaseUrl,
    config.publishableKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
      global: { fetch: fetchWithApiKeyOnly },
    },
  );
  const agentUrl = config.supabaseUrl + "/functions/v1/submit-event";

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function formatDateParts(dateValue) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue || "")) return null;
    const date = new Date(dateValue + "T12:00:00Z");
    if (Number.isNaN(date.getTime())) return null;
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      weekday: "short",
    });
    const parts = formatter.formatToParts(date);
    const values = {};
    parts.forEach(function (part) {
      values[part.type] = part.value;
    });
    return { month: values.month, day: values.day, weekday: values.weekday };
  }

  function formatTime(timeValue) {
    if (!/^\d{2}:\d{2}/.test(timeValue || "")) return "";
    const date = new Date("2000-01-01T" + timeValue + ":00Z");
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function formatWhen(event) {
    const dateParts = formatDateParts(event.event_date);
    const start = formatTime(event.start_time);
    const end = formatTime(event.end_time);
    if (!dateParts) return "Date to be announced";

    let when = dateParts.weekday + ", " + dateParts.month + " " + dateParts.day;
    if (start) {
      when += " · " + start;
      if (end) when += " to " + end;
    }
    return when;
  }

  function isFreeCost(cost) {
    const value = String(cost || "").trim().toLowerCase();
    return value === "free" || value === "$0" || value === "0" || value === "no cost";
  }

  function isProjectFlyerUrl(value) {
    if (typeof value !== "string" || !value) return false;
    try {
      const url = new URL(value);
      const projectUrl = new URL(config.supabaseUrl);
      return url.origin === projectUrl.origin && url.pathname.indexOf("/storage/v1/object/public/flyers/") === 0;
    } catch (error) {
      return false;
    }
  }

  function renderBoardMessage(message) {
    clearElement(board);
    board.appendChild(makeElement("li", "empty", message));
  }

  function renderEvent(event, review) {
    const item = makeElement("li", "event");
    const dateParts = formatDateParts(event.event_date);
    const date = makeElement("div", dateParts ? "date" : "date tba");
    if (dateParts) {
      date.appendChild(makeElement("span", "mon", dateParts.month));
      date.appendChild(makeElement("span", "day", dateParts.day));
    } else {
      date.appendChild(makeElement("span", "day", "TBA"));
    }

    const body = makeElement("div", "event-body");
    body.appendChild(makeElement("p", "when", formatWhen(event)));
    body.appendChild(makeElement("h3", "", event.title || "Untitled event"));

    const place = [event.place_name, event.place_detail].filter(Boolean).join(", ");
    const meta = [event.club, place].filter(Boolean).join(" · ");
    body.appendChild(makeElement("p", "meta", meta || "Campus event"));
    body.appendChild(makeElement("p", "summary", event.summary || "Details coming soon."));

    const tags = makeElement("p", "tags");
    if (isFreeCost(event.cost)) {
      tags.appendChild(makeElement("span", "tag", "Free"));
    } else if (event.cost) {
      tags.appendChild(makeElement("span", "tag", event.cost));
    }
    if (event.free_food === true) {
      tags.appendChild(makeElement("span", "tag food", "🍕 Free food"));
    }
    if (tags.firstChild) body.appendChild(tags);

    if (review) {
      const reviewBlock = makeElement("div", "review");
      reviewBlock.appendChild(makeElement("p", "why", review.reason || "Waiting for moderator review."));
      reviewBlock.appendChild(makeElement("p", "original", review.original || ""));
      const actions = makeElement("p", "actions");
      const approveButton = makeElement("button", "", "Approve");
      approveButton.type = "button";
      approveButton.addEventListener("click", review.onApprove);
      const rejectButton = makeElement("button", "ghost", "Reject");
      rejectButton.type = "button";
      rejectButton.addEventListener("click", review.onReject);
      actions.appendChild(approveButton);
      actions.appendChild(rejectButton);
      reviewBlock.appendChild(actions);
      body.appendChild(reviewBlock);
    }

    item.appendChild(date);
    item.appendChild(body);
    if (isProjectFlyerUrl(event.flyer_url)) {
      const flyer = makeElement("img", "flyer");
      flyer.src = event.flyer_url;
      flyer.alt = (event.title || "Event") + " flyer";
      flyer.loading = "lazy";
      item.appendChild(flyer);
    }
    return item;
  }

  function renderEvents() {
    const visibleEvents = state.freeFoodOnly
      ? state.events.filter(function (event) { return event.free_food === true; })
      : state.events;
    clearElement(board);
    if (visibleEvents.length === 0) {
      board.appendChild(makeElement("li", "empty", state.freeFoodOnly ? "No free-food events yet." : "No events yet. Post the first one!"));
      return;
    }
    visibleEvents.forEach(function (event) {
      board.appendChild(renderEvent(event));
    });
  }

  function showResult(status, message, reasons) {
    const labels = {
      published: "Published",
      waiting: "Waiting for review",
      rejected: "Not posted",
      duplicate: "Already posted",
      error: "Something went wrong",
    };
    const resultClass = labels[status] ? status : "error";
    result.className = "result " + resultClass;
    result.hidden = false;
    resultLabel.textContent = labels[status] || labels.error;
    resultMessage.textContent = message || "Please try again.";
    clearElement(resultReasons);
    (Array.isArray(reasons) ? reasons : []).forEach(function (reason) {
      resultReasons.appendChild(makeElement("li", "", reason));
    });
  }

  async function loadEvents() {
    renderBoardMessage("Loading events…");
    const response = await supabaseClient
      .from("events")
      .select("id, created_at, status, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary, flyer_url")
      .eq("status", "published")
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true, nullsFirst: false });

    if (response.error) {
      console.error("Could not load events", response.error);
      renderBoardMessage("We could not load events right now. Please try Refresh.");
      return;
    }

    state.events = response.data || [];
    renderEvents();
  }

  function showModeratorResult(kind, message) {
    moderatorResult.className = "result " + (kind === "success" ? "published" : "error");
    moderatorResult.hidden = false;
    moderatorResultLabel.textContent = kind === "success" ? "Done" : "Sign-in problem";
    moderatorResultMessage.textContent = message;
  }

  async function loadWaitingEvents() {
    if (!moderatorSession) return;
    clearElement(waitingBoard);
    waitingBoard.appendChild(makeElement("li", "empty", "Loading waiting posts…"));
    const response = await supabaseClient
      .from("events")
      .select("id, created_at, status, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary, flyer_url, announcement, status_reason")
      .eq("status", "waiting")
      .order("created_at", { ascending: true });

    if (response.error) {
      console.error("Could not load waiting events", response.error);
      clearElement(waitingBoard);
      waitingBoard.appendChild(makeElement("li", "empty", "We could not load waiting posts right now."));
      return;
    }

    clearElement(waitingBoard);
    if (!response.data || response.data.length === 0) {
      waitingBoard.appendChild(makeElement("li", "empty", "No posts are waiting for review."));
      return;
    }

    response.data.forEach(function (event) {
      waitingBoard.appendChild(renderEvent(event, {
        reason: event.status_reason,
        original: event.announcement,
        onApprove: function () { reviewEvent(event.id, "published"); },
        onReject: function () { reviewEvent(event.id, "rejected"); },
      }));
    });
  }

  async function reviewEvent(eventId, nextStatus) {
    if (!moderatorSession) return;
    const statusReason = nextStatus === "published"
      ? "Approved by moderator."
      : "Rejected by moderator.";
    const response = await supabaseClient
      .from("events")
      .update({
        status: nextStatus,
        status_reason: statusReason,
        reviewed_at: new Date().toISOString(),
        reviewed_by: moderatorSession.user.id,
      })
      .eq("id", eventId);

    if (response.error) {
      console.error("Could not review event", response.error);
      showModeratorResult("error", "The post could not be updated.");
      return;
    }

    showModeratorResult("success", nextStatus === "published" ? "The event was approved." : "The event was rejected.");
    await loadWaitingEvents();
    await loadEvents();
  }

  function setModeratorSession(session) {
    moderatorSession = session;
    const signedIn = Boolean(session);
    moderatorSignedOut.hidden = signedIn;
    moderatorSignedIn.hidden = !signedIn;
    if (signedIn) {
      moderatorAccount.textContent = "Signed in as " + (session.user.email || "moderator");
      window.setTimeout(loadWaitingEvents, 0);
    } else {
      moderatorAccount.textContent = "";
      clearElement(waitingBoard);
      moderatorResult.hidden = true;
    }
  }

  async function signInModerator(event) {
    event.preventDefault();
    const formData = new FormData(signInForm);
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");
    const response = await supabaseClient.auth.signInWithPassword({ email: email, password: password });
    if (response.error) {
      console.error("Moderator sign-in failed", response.error);
      showModeratorResult("error", "The email or password was not accepted.");
      return;
    }
    signInForm.reset();
    showModeratorResult("success", "Signed in. Waiting posts are shown below.");
  }

  async function signOutModerator() {
    const response = await supabaseClient.auth.signOut();
    if (response.error) {
      console.error("Moderator sign-out failed", response.error);
      showModeratorResult("error", "The moderator could not be signed out.");
    }
  }

  async function submitAnnouncement(event) {
    event.preventDefault();
    const announcement = announcementInput.value.trim();
    if (!announcement) {
      showResult("error", "Paste an announcement before posting.", []);
      announcementInput.focus();
      return;
    }

    const flyer = flyerInput.files && flyerInput.files[0];
    if (flyer) {
      if (flyer.size > maxFlyerBytes) {
        showResult("error", "The flyer must be 5 MB or smaller.", []);
        return;
      }
      if (flyer.type !== "image/jpeg" && flyer.type !== "image/png") {
        showResult("error", "The flyer must be a JPG or PNG image.", []);
        return;
      }
    }

    submitButton.disabled = true;
    submitButton.textContent = "Checking announcement…";
    const formData = new FormData();
    formData.append("announcement", announcement);
    if (flyer) formData.append("flyer", flyer, flyer.name);

    try {
      const response = await fetch(agentUrl, {
        method: "POST",
        headers: { apikey: config.publishableKey },
        body: formData,
      });
      const body = await response.json().catch(function () { return {}; });
      if (!response.ok || body.ok === false) {
        showResult("error", body.message || "The announcement could not be submitted.", body.reasons);
        return;
      }

      showResult(body.status, body.message, body.reasons);
      postForm.reset();
      if (body.status === "published") await loadEvents();
    } catch (error) {
      console.error("Could not submit announcement", error);
      showResult("error", "The agent could not be reached. Please try again.", []);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = "Post announcement";
    }
  }

  postForm.addEventListener("submit", submitAnnouncement);
  refreshButton.addEventListener("click", loadEvents);
  signInForm.addEventListener("submit", signInModerator);
  signOutButton.addEventListener("click", signOutModerator);
  supabaseClient.auth.onAuthStateChange(function (_event, session) {
    setModeratorSession(session);
  });
  supabaseClient.auth.getSession().then(function (response) {
    setModeratorSession(response.data.session);
  });
  filterButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      state.freeFoodOnly = button.dataset.filter === "free-food";
      filterButtons.forEach(function (otherButton) {
        otherButton.setAttribute("aria-pressed", String(otherButton === button));
      });
      renderEvents();
    });
  });

  loadEvents();
})();
