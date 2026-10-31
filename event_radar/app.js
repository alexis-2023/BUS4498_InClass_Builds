(function () {
  "use strict";

  const config = window.EVENT_RADAR_CONFIG || {};
  const board = document.getElementById("event-board");
  const postForm = document.getElementById("post-form");
  const announcementInput = document.getElementById("announcement");
  const submitButton = document.getElementById("submit-button");
  const refreshButton = document.getElementById("refresh-button");
  const result = document.getElementById("result");
  const resultLabel = document.getElementById("result-label");
  const resultMessage = document.getElementById("result-message");
  const resultReasons = document.getElementById("result-reasons");
  const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));
  const state = { events: [], freeFoodOnly: false };

  function fetchWithApiKeyOnly(input, init) {
    const request = new Request(input, init);
    const headers = new Headers(request.headers);
    headers.delete("authorization");
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

  function renderBoardMessage(message) {
    clearElement(board);
    board.appendChild(makeElement("li", "empty", message));
  }

  function renderEvent(event) {
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

    item.appendChild(date);
    item.appendChild(body);
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
      .select("id, created_at, status, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary")
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

  async function submitAnnouncement(event) {
    event.preventDefault();
    const announcement = announcementInput.value.trim();
    if (!announcement) {
      showResult("error", "Paste an announcement before posting.", []);
      announcementInput.focus();
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Checking announcement…";
    const formData = new FormData();
    formData.append("announcement", announcement);

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
      announcementInput.value = "";
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
