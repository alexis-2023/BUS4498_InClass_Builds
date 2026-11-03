(function () {
  "use strict";

  const config = window.EVENT_RADAR_CONFIG || {};
  const $ = function (id) { return document.getElementById(id); };
  const board = $("board");
  const postForm = $("postForm");
  const announcementInput = $("announcement");
  const flyerInput = $("flyer");
  const postButton = $("postBtn");
  const postResult = $("postResult");
  const signInForm = $("signInForm");
  const signOutButton = $("signOutBtn");
  const moderatorArea = $("modArea");
  const moderatorWho = $("modWho");
  const signInMessage = $("signInMsg");
  const waitingList = $("waitingList");
  const waitingStatus = $("waitingStatus");
  const waitingCount = $("waitingCount");
  const teachForm = $("teachForm");
  const lessonText = $("lessonText");
  const teachMessage = $("teachMsg");
  const lessonsStatus = $("lessonsStatus");
  const lessonsList = $("lessonsList");
  const lessonsCount = $("lessonsCount");
  const moderatorResult = $("moderatorResult");
  const moderatorResultLabel = $("moderatorResultLabel");
  const moderatorResultMessage = $("moderatorResultMessage");
  const live = $("live");
  const boardStatus = $("boardStatus");
  const state = { events: [], filter: "all" };
  const maxFlyerBytes = 5 * 1024 * 1024;
  let moderatorSession = null;
  let openDrawerId = null;
  let toastTimer = null;

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
  const baseUrl = String(config.supabaseUrl || "").replace(/\/+$/, "");
  const agentUrl = baseUrl + "/functions/v1/submit-event";
  const publicColumns = "id, created_at, status, title, club, event_date, start_time, end_time, place_name, place_detail, cost, free_food, summary, flyer_url";

  function makeElement(tagName, className, text) {
    const element = document.createElement(tagName);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  }

  function clearElement(element) {
    while (element.firstChild) element.removeChild(element.firstChild);
  }

  function parseDateValue(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || "")) return null;
    const date = new Date(value + "T12:00:00Z");
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = parseDateValue(value);
    if (!date) return "Date to be announced";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      weekday: "short",
      month: "short",
      day: "numeric",
    }).format(date);
  }

  function formatDateParts(value) {
    const date = parseDateValue(value);
    if (!date) return null;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
    }).formatToParts(date);
    const values = {};
    parts.forEach(function (part) { values[part.type] = part.value; });
    return { month: values.month, day: values.day };
  }

  function formatTime(value) {
    if (!/^\d{2}:\d{2}/.test(value || "")) return "";
    const date = new Date("2000-01-01T" + value.slice(0, 5) + ":00Z");
    if (Number.isNaN(date.getTime())) return "";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "UTC",
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }

  function isThisWeek(value) {
    const eventDate = parseDateValue(value);
    if (!eventDate) return false;
    const now = new Date();
    const today = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 12));
    const daysAway = (eventDate.getTime() - today.getTime()) / 86400000;
    return daysAway >= 0 && daysAway < 7;
  }

  function isFreeCost(cost) {
    const value = String(cost || "").trim().toLowerCase();
    return value === "free" || value === "$0" || value === "0" || value === "no cost";
  }

  function isProjectFlyerUrl(value) {
    if (typeof value !== "string" || !value) return false;
    try {
      const url = new URL(value);
      const projectUrl = new URL(baseUrl);
      return url.origin === projectUrl.origin && url.pathname.indexOf("/storage/v1/object/public/flyers/") === 0;
    } catch (_error) {
      return false;
    }
  }

  function showToast(message) {
    const toast = $("toast");
    toast.textContent = message;
    toast.className = "toast show";
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.className = "toast"; }, 2400);
  }

  function describeLookedAt(value) {
    if (typeof value === "string") return value;
    if (!value || typeof value !== "object") return "Memory context was checked.";
    const source = value.source;
    if (source === "announcement") return "Read the submitted announcement.";
    if (source === "recent_messages") {
      return "Chat context: read " + Number(value.count || 0) + " earlier message(s).";
    }
    if (source === "club_list") {
      const clubs = Array.isArray(value.clubs) ? value.clubs : [];
      return "Club list: checked " + clubs.length + " club(s)" + (clubs.length ? " (" + clubs.join(", ") + ")." : ".");
    }
    if (source === "upcoming_posts") {
      const ids = Array.isArray(value.event_ids) ? value.event_ids : [];
      return "Upcoming posts: checked " + ids.length + " existing post(s).";
    }
    if (source === "moderator_lessons") {
      const ids = Array.isArray(value.lesson_ids) ? value.lesson_ids : [];
      return "Moderator lessons: read " + ids.length + " lesson(s).";
    }
    return "Checked " + source + ".";
  }

  function memo(value) {
    if (!Array.isArray(value) || value.length === 0) return null;
    const box = makeElement("div", "memo");
    box.appendChild(makeElement("p", "memo-title", "What the agent looked at"));
    const list = makeElement("ul");
    value.forEach(function (item) {
      list.appendChild(makeElement("li", "", describeLookedAt(item)));
    });
    box.appendChild(list);
    return box;
  }

  function openDrawer(id) {
    closeDrawer();
    const drawer = $(id);
    if (!drawer) return;
    drawer.hidden = false;
    $("scrim").hidden = false;
    openDrawerId = id;
    const firstInput = drawer.querySelector("textarea, input:not([type=hidden])");
    if (firstInput) firstInput.focus();
  }

  function closeDrawer() {
    if (!openDrawerId) return;
    $(openDrawerId).hidden = true;
    $("scrim").hidden = true;
    openDrawerId = null;
  }

  function dateBadge(value) {
    const badge = makeElement("div", "date");
    const parts = formatDateParts(value);
    if (!parts) {
      badge.className = "date tba";
      badge.appendChild(makeElement("span", "day-num", "TBA"));
      return badge;
    }
    badge.appendChild(makeElement("span", "mon", parts.month));
    badge.appendChild(makeElement("span", "day-num", parts.day));
    return badge;
  }

  function renderEvent(event, review) {
    const item = makeElement("article", "event");
    item.appendChild(dateBadge(event.event_date));

    const body = makeElement("div", "event-body");
    const start = formatTime(event.start_time);
    const end = formatTime(event.end_time);
    let when = formatDate(event.event_date);
    if (start) when += " · " + start + (end ? " to " + end : "");
    else when += " · Time to be announced";
    body.appendChild(makeElement("p", "when", when));
    body.appendChild(makeElement("h3", "", event.title || "Untitled event"));

    const place = [event.place_name, event.place_detail].filter(Boolean).join(", ");
    const meta = [event.club, place].filter(Boolean).join(" · ");
    if (meta) body.appendChild(makeElement("p", "meta", meta));
    if (event.summary) body.appendChild(makeElement("p", "summary", event.summary));

    const tags = makeElement("p", "tags");
    if (event.cost) tags.appendChild(makeElement("span", "tag", isFreeCost(event.cost) ? "Free" : event.cost));
    if (event.free_food === true) tags.appendChild(makeElement("span", "tag food", "🍕 Free food"));
    if (event.place_name === "Online") tags.appendChild(makeElement("span", "tag", "💻 Online"));
    if (tags.firstChild) body.appendChild(tags);

    if (review) {
      const reviewBlock = makeElement("div", "review");
      if (review.reason) reviewBlock.appendChild(makeElement("p", "why", "Why it’s waiting: " + review.reason));
      reviewBlock.appendChild(makeElement("p", "original", "Original post: " + (review.original || "")));
      const lookedAt = memo(event.looked_at);
      if (lookedAt) reviewBlock.appendChild(lookedAt);
      const actions = makeElement("div", "actions-row");
      const approve = makeElement("button", "", "Approve");
      const reject = makeElement("button", "ghost", "Reject");
      approve.type = reject.type = "button";
      approve.addEventListener("click", review.onApprove);
      reject.addEventListener("click", review.onReject);
      actions.appendChild(approve);
      actions.appendChild(reject);
      reviewBlock.appendChild(actions);
      body.appendChild(reviewBlock);
    }

    item.appendChild(body);
    if (isProjectFlyerUrl(event.flyer_url)) {
      const flyer = makeElement("img", "flyer");
      flyer.src = event.flyer_url;
      flyer.alt = "Flyer for " + (event.title || "this event");
      flyer.loading = "lazy";
      item.appendChild(flyer);
    }
    return item;
  }

  function visibleEvents() {
    return state.events.filter(function (event) {
      if (state.filter === "week") return isThisWeek(event.event_date);
      if (state.filter === "food") return event.free_food === true;
      if (state.filter === "online") return event.place_name === "Online";
      return true;
    });
  }

  function renderBoard() {
    const shown = visibleEvents();
    clearElement(board);
    if (shown.length === 0) {
      const empty = makeElement("div", "empty");
      empty.appendChild(makeElement("b", "", state.events.length ? "Nothing matches this filter." : "No events yet."));
      empty.appendChild(makeElement("span", "", state.events.length ? "Try another filter." : "Post one in the club chat, or use + Post an event above."));
      board.appendChild(empty);
    }

    const groups = {};
    const order = [];
    shown.forEach(function (event) {
      const key = event.event_date || "";
      if (!groups[key]) { groups[key] = []; order.push(key); }
      groups[key].push(event);
    });
    order.forEach(function (key) {
      const day = makeElement("section", "day");
      const heading = makeElement("div", "day-head");
      heading.appendChild(makeElement("h2", "", formatDate(key)));
      heading.appendChild(makeElement("span", "n", groups[key].length + (groups[key].length === 1 ? " event" : " events")));
      day.appendChild(heading);
      groups[key].forEach(function (event, index) {
        const card = renderEvent(event);
        card.style.setProperty("--i", String(index));
        day.appendChild(card);
      });
      board.appendChild(day);
    });
    $("statCount").textContent = String(state.events.length);
    $("statWeek").textContent = String(state.events.filter(function (event) { return isThisWeek(event.event_date); }).length);
    $("statFood").textContent = String(state.events.filter(function (event) { return event.free_food === true; }).length);
    boardStatus.textContent = shown.length ? shown.length + (shown.length === 1 ? " event" : " events") + (state.filter !== "all" ? " shown" : "") : "";
  }

  async function loadBoard(quiet) {
    if (!quiet) boardStatus.textContent = "Loading…";
    live.classList.add("busy");
    const response = await supabaseClient
      .from("events")
      .select(publicColumns)
      .eq("status", "published")
      .order("event_date", { ascending: true, nullsFirst: false })
      .order("start_time", { ascending: true, nullsFirst: false });
    live.classList.remove("busy");
    if (response.error) {
      console.error("Could not load events", response.error);
      boardStatus.textContent = "Couldn’t load events. Try Refresh.";
      clearElement(board);
      board.appendChild(makeElement("div", "empty", "We could not load events right now."));
      return;
    }
    state.events = response.data || [];
    renderBoard();
  }

  function showPostResult(data) {
    const labels = { published: "Published", waiting: "Waiting for a moderator", rejected: "Not posted", duplicate: "Already posted", error: "Something went wrong" };
    const kind = data && data.ok ? data.status : "error";
    postResult.hidden = false;
    postResult.className = "result " + (labels[kind] ? kind : "error");
    clearElement(postResult);
    postResult.appendChild(makeElement("p", "result-label", labels[kind] || labels.error));
    postResult.appendChild(makeElement("p", "", (data && data.message) || "Please try again."));
    if (data && Array.isArray(data.reasons) && data.reasons.length) {
      const reasons = makeElement("ul", "reasons");
      data.reasons.forEach(function (reason) { reasons.appendChild(makeElement("li", "", reason)); });
      postResult.appendChild(reasons);
    }
    if (data && data.event && kind !== "rejected") postResult.appendChild(renderEvent(data.event));
    const lookedAt = data && (data.looked_at || (data.event && data.event.looked_at));
    const lookedAtBox = memo(lookedAt);
    if (lookedAtBox) postResult.appendChild(lookedAtBox);
  }

  function showModeratorResult(success, message) {
    moderatorResult.hidden = false;
    moderatorResult.className = "result " + (success ? "published" : "error");
    moderatorResultLabel.textContent = success ? "Done" : "Sign-in problem";
    moderatorResultMessage.textContent = message;
  }

  async function loadWaiting() {
    if (!moderatorSession) return;
    waitingStatus.textContent = "Loading…";
    clearElement(waitingList);
    const response = await supabaseClient
      .from("events")
      .select("*")
      .eq("status", "waiting")
      .order("created_at", { ascending: true });
    if (response.error) {
      console.error("Could not load waiting events", response.error);
      waitingStatus.textContent = "Couldn’t load waiting posts right now.";
      waitingCount.textContent = "0";
      return;
    }
    const events = response.data || [];
    waitingCount.textContent = String(events.length);
    waitingStatus.textContent = events.length ? events.length + (events.length === 1 ? " post" : " posts") + " waiting" : "Nothing is waiting.";
    if (events.length === 0) {
      waitingList.appendChild(makeElement("li", "empty", "No posts are waiting for review."));
      return;
    }
    events.forEach(function (event) {
      const item = makeElement("li");
      item.appendChild(renderEvent(event, {
        reason: event.status_reason,
        original: event.announcement,
        onApprove: function () { reviewEvent(event.id, "published"); },
        onReject: function () { reviewEvent(event.id, "rejected"); },
      }));
      waitingList.appendChild(item);
    });
  }

  async function loadLessons() {
    if (!moderatorSession) return;
    lessonsStatus.textContent = "Loading…";
    clearElement(lessonsList);
    const response = await supabaseClient
      .from("agent_lessons")
      .select("id, lesson, created_at")
      .order("created_at", { ascending: false });
    if (response.error) {
      console.error("Could not load agent lessons", response.error);
      lessonsStatus.textContent = "Couldn’t load lessons right now.";
      lessonsCount.textContent = "0";
      return;
    }
    const lessons = response.data || [];
    lessonsCount.textContent = String(lessons.length);
    lessonsStatus.textContent = lessons.length ? lessons.length + (lessons.length === 1 ? " lesson" : " lessons") + " saved" : "No lessons yet.";
    if (lessons.length === 0) {
      lessonsList.appendChild(makeElement("li", "empty", "No lessons yet."));
      return;
    }
    lessons.forEach(function (lesson) {
      const item = makeElement("li", "lesson");
      item.appendChild(makeElement("p", "lesson-text", lesson.lesson));
      item.appendChild(makeElement("p", "lesson-meta", "Saved " + new Date(lesson.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })));
      lessonsList.appendChild(item);
    });
  }

  async function saveLesson(event) {
    event.preventDefault();
    if (!moderatorSession) return;
    const lesson = lessonText.value.trim();
    if (!lesson) return;
    const response = await supabaseClient
      .from("agent_lessons")
      .insert({ lesson: lesson, created_by: moderatorSession.user.id });
    if (response.error) {
      console.error("Could not save agent lesson", response.error);
      teachMessage.textContent = "The lesson could not be saved.";
      return;
    }
    teachForm.reset();
    teachMessage.textContent = "Saved. The agent reads it with the next post.";
    showToast("Lesson saved");
    await loadLessons();
  }

  async function reviewEvent(eventId, nextStatus) {
    if (!moderatorSession) return;
    const statusReason = nextStatus === "published" ? "Approved by moderator." : "Rejected by moderator.";
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
      showModeratorResult(false, "The post could not be updated.");
      return;
    }
    showToast(nextStatus === "published" ? "Approved and posted" : "Rejected");
    await loadWaiting();
    await loadBoard(true);
  }

  function renderModerator() {
    const signedIn = Boolean(moderatorSession);
    signInForm.hidden = signedIn;
    moderatorArea.hidden = !signedIn;
    if (signedIn) {
      moderatorWho.textContent = moderatorSession.user.email || "moderator";
      loadWaiting();
      loadLessons();
    } else {
      moderatorWho.textContent = "";
      clearElement(waitingList);
      clearElement(lessonsList);
      moderatorResult.hidden = true;
    }
  }

  async function signInModerator(event) {
    event.preventDefault();
    signInMessage.textContent = "Signing in…";
    const response = await supabaseClient.auth.signInWithPassword({
      email: $("modEmail").value.trim(),
      password: $("modPassword").value,
    });
    if (response.error) {
      console.error("Moderator sign-in failed", response.error);
      signInMessage.textContent = "The email or password was not accepted.";
      return;
    }
    $("modPassword").value = "";
    signInMessage.textContent = "";
    showToast("Signed in");
  }

  async function signOutModerator() {
    const response = await supabaseClient.auth.signOut();
    if (response.error) {
      console.error("Moderator sign-out failed", response.error);
      showModeratorResult(false, "The moderator could not be signed out.");
      return;
    }
    showToast("Signed out");
  }

  async function submitAnnouncement(event) {
    event.preventDefault();
    const announcement = announcementInput.value.trim();
    if (!announcement) {
      showPostResult({ ok: false, message: "Paste an announcement before posting." });
      announcementInput.focus();
      return;
    }
    const flyer = flyerInput.files && flyerInput.files[0];
    if (flyer && flyer.size > maxFlyerBytes) {
      showPostResult({ ok: false, message: "The flyer must be 5 MB or smaller." });
      return;
    }
    if (flyer && flyer.type !== "image/jpeg" && flyer.type !== "image/png") {
      showPostResult({ ok: false, message: "The flyer must be a JPG or PNG image." });
      return;
    }

    postButton.disabled = true;
    postButton.textContent = "The agent is reading it…";
    const formData = new FormData();
    formData.append("announcement", announcement);
    if (flyer) formData.append("flyer", flyer, flyer.name);
    try {
      const response = await window.fetch(agentUrl, {
        method: "POST",
        headers: { apikey: config.publishableKey },
        body: formData,
      });
      const data = await response.json().catch(function () {
        return { ok: false, message: "The agent did not answer (" + response.status + ")." };
      });
      showPostResult(response.ok ? data : { ok: false, message: data.message || "The announcement could not be submitted.", reasons: data.reasons });
      if (data.ok) {
        postForm.reset();
        await loadBoard(true);
      }
    } catch (error) {
      console.error("Could not submit announcement", error);
      showPostResult({ ok: false, message: "Couldn’t reach the agent. Please try again." });
    } finally {
      postButton.disabled = false;
      postButton.textContent = "Post it";
    }
  }

  $("openPost").addEventListener("click", function () { openDrawer("postDrawer"); });
  $("openMod").addEventListener("click", function () { openDrawer("modDrawer"); });
  $("scrim").addEventListener("click", closeDrawer);
  document.querySelectorAll("[data-close]").forEach(function (button) { button.addEventListener("click", closeDrawer); });
  document.addEventListener("keydown", function (event) { if (event.key === "Escape") closeDrawer(); });
  $("refreshBtn").addEventListener("click", function () { loadBoard(false); });
  postForm.addEventListener("submit", submitAnnouncement);
  signInForm.addEventListener("submit", signInModerator);
  signOutButton.addEventListener("click", signOutModerator);
  teachForm.addEventListener("submit", saveLesson);
  document.querySelectorAll(".tab").forEach(function (tab) {
    tab.addEventListener("click", function () {
      document.querySelectorAll(".tab").forEach(function (other) { other.setAttribute("aria-selected", String(other === tab)); });
      document.querySelectorAll(".tabpanel").forEach(function (panel) { panel.hidden = panel.getAttribute("data-panel") !== tab.getAttribute("data-tab"); });
    });
  });
  document.querySelectorAll("#filters .chip").forEach(function (button) {
    button.addEventListener("click", function () {
      state.filter = button.getAttribute("data-filter");
      document.querySelectorAll("#filters .chip").forEach(function (other) { other.setAttribute("aria-pressed", String(other === button)); });
      renderBoard();
    });
  });
  supabaseClient.auth.onAuthStateChange(function (_event, session) {
    moderatorSession = session;
    renderModerator();
  });
  supabaseClient.auth.getSession().then(function (response) {
    moderatorSession = response.data.session;
    renderModerator();
  });

  window.setInterval(function () {
    if (document.visibilityState === "visible" && !openDrawerId) loadBoard(true);
  }, 15000);
  document.addEventListener("visibilitychange", function () {
    if (document.visibilityState === "visible") loadBoard(true);
  });
  window.fetch(agentUrl, { headers: { apikey: config.publishableKey } })
    .then(function (response) { return response.json(); })
    .then(function (data) {
      if (data && data.ai) $("aiNote").textContent = "Cards are drafted by " + data.ai + ".";
    })
    .catch(function () { /* The board still works if the status check is unavailable. */ });

  loadBoard(false);
})();
