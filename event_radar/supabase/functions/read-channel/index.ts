// Stage 14 chat reader for GroupMe.
//
// This function reads new GroupMe messages, remembers the last message ID in
// public.channel_cursor, and sends each message to the existing submit-event
// function. GroupMe credentials are read only from Supabase Edge Function
// secrets; none are stored in this repository or in the website.

import { createClient } from "npm:@supabase/supabase-js@2.117.2";

const SOURCE = "groupme";
const API = "https://api.groupme.com/v3";
const MAX_PER_RUN = 20;
const MAX_REPLY = 900;
const THREAD_MINUTES = 10;
const THREAD_MAX = 4;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-channel-reader-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const READER_AUTH_HEADER = "x-channel-reader-key";

type GroupMeMessage = {
  id: string;
  text: string | null;
  name: string;
  user_id?: string;
  created_at?: number;
  sender_type?: string;
  system?: boolean;
};

type Decision = {
  ok: boolean;
  status?: string;
  message?: string;
  reasons?: string[];
  already_read?: boolean;
  event?: Record<string, unknown> | null;
};

function jsonResponse(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function secret(name: string): string {
  return (Deno.env.get(name) || "").trim();
}

function timingSafeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  const length = Math.max(leftBytes.length, rightBytes.length);
  let difference = leftBytes.length ^ rightBytes.length;

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return difference === 0;
}

function authorizeReader(request: Request): { ok: true } | { ok: false; status: number; message: string } {
  const expected = secret("CHANNEL_READER_KEY");
  if (!expected) {
    return { ok: false, status: 503, message: "The channel reader is not configured." };
  }

  const provided = request.headers.get(READER_AUTH_HEADER) || "";
  if (!provided || !timingSafeEqual(provided, expected)) {
    return { ok: false, status: 401, message: "Unauthorized." };
  }

  return { ok: true };
}

function serverKey(): string {
  const raw = secret("SUPABASE_SECRET_KEYS");
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (typeof parsed?.default === "string" && parsed.default.trim()) return parsed.default.trim();
    } catch (_) {
      console.error("Could not read SUPABASE_SECRET_KEYS");
    }
  }
  return secret("SUPABASE_SERVICE_ROLE_KEY");
}

function callerKey(): string {
  // The existing submit-event function has JWT verification disabled. Use a
  // publishable key when one is configured, and never fall back to the secret
  // database key for this function-to-function request.
  return secret("SUPABASE_PUBLISHABLE_KEY");
}

async function groupMeGet(path: string, token: string): Promise<{ status: number; messages: GroupMeMessage[] }> {
  const response = await fetch(API + path, { headers: { "X-Access-Token": token } });
  if (response.status === 304) return { status: 304, messages: [] };
  if (!response.ok) {
    throw new Error(`GroupMe answered ${response.status} for ${path.split("?")[0]}. Check the GroupMe secrets.`);
  }
  const data = await response.json();
  return { status: response.status, messages: (data?.response?.messages ?? []) as GroupMeMessage[] };
}

async function threadBefore(message: GroupMeMessage, groupId: string, token: string): Promise<string[]> {
  try {
    const earlier = await groupMeGet(
      `/groups/${encodeURIComponent(groupId)}/messages?before_id=${encodeURIComponent(message.id)}&limit=10`,
      token,
    );
    const since = (message.created_at ?? 0) - THREAD_MINUTES * 60;
    return earlier.messages
      .filter((entry) =>
        entry.user_id === message.user_id &&
        !entry.system &&
        entry.sender_type !== "bot" &&
        Boolean((entry.text ?? "").trim()) &&
        (entry.created_at ?? 0) >= since
      )
      .slice(0, THREAD_MAX)
      .reverse()
      .map((entry) => (entry.text ?? "").trim());
  } catch (error) {
    console.error("Could not read the sender's recent GroupMe messages", error);
    return [];
  }
}

function formatTime(value: unknown): string {
  const match = /^(\d{2}):(\d{2})/.exec(String(value ?? ""));
  if (!match) return "";
  const hour = Number(match[1]);
  return `${hour % 12 || 12}:${match[2]} ${hour >= 12 ? "PM" : "AM"}`;
}

function formatDate(value: unknown): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value ?? ""));
  if (!match) return "";
  return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3])).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function decisionText(who: string, decision: Decision): string {
  const event = decision.event ?? {};
  const card = [event.title, formatDate(event.event_date), formatTime(event.start_time), event.place_name]
    .filter(Boolean)
    .join(" · ");
  const reasons = (decision.reasons ?? []).join(" ");
  if (!decision.ok) return `⚠️ ${who}: the agent could not read that post. ${decision.message ?? ""}`.trim().slice(0, MAX_REPLY);
  if (decision.status === "published") return `✅ ${who}: posted on the website. ${card}`.trim().slice(0, MAX_REPLY);
  if (decision.status === "waiting") return `⏳ ${who}: waiting for a moderator. ${reasons}`.trim().slice(0, MAX_REPLY);
  if (decision.status === "duplicate") return `↩️ ${who}: already posted. ${reasons}`.trim().slice(0, MAX_REPLY);
  return `❌ ${who}: not posted. ${reasons}`.trim().slice(0, MAX_REPLY);
}

async function postBotReply(botId: string, text: string): Promise<void> {
  const response = await fetch(`${API}/bots/post`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bot_id: botId, text }),
  });
  if (!response.ok) console.error("The GroupMe bot could not post its reply", response.status);
}

async function readGroup(req: Request): Promise<Response> {
  const token = secret("GROUPME_TOKEN");
  const groupId = secret("GROUPME_GROUP_ID");
  const botId = secret("GROUPME_BOT_ID");
  const supabaseUrl = secret("SUPABASE_URL");
  const db = createClient(supabaseUrl, serverKey(), { auth: { persistSession: false } });

  if (req.method === "GET") {
    const { data: cursor } = await db
      .from("channel_cursor")
      .select("last_id, read_count, updated_at")
      .eq("source", SOURCE)
      .maybeSingle();
    const status: Record<string, unknown> = {
      ok: true,
      ready: Boolean(token && groupId),
      source: SOURCE,
      bot: Boolean(botId),
      last_message_id: cursor?.last_id ?? "",
      read_count: cursor?.read_count ?? 0,
      last_run: cursor?.updated_at ?? "",
      message: token && groupId
        ? "The GroupMe reader is configured."
        : "Add GROUPME_TOKEN and GROUPME_GROUP_ID in Supabase Edge Function secrets.",
    };
    if (new URL(req.url).searchParams.get("check") === SOURCE && token) {
      const me = await fetch(`${API}/users/me`, { headers: { "X-Access-Token": token } });
      const group = groupId
        ? await fetch(`${API}/groups/${encodeURIComponent(groupId)}`, { headers: { "X-Access-Token": token } })
        : null;
      status.groupme = {
        token_length: token.length,
        token_works: me.ok,
        group_id_is_number: /^\d+$/.test(groupId),
        group_found: group ? group.ok : false,
        message: !me.ok
          ? `GroupMe rejected the token (${me.status}). Check GROUPME_TOKEN.`
          : group && !group.ok
          ? `The token works, but GroupMe could not find the configured group (${group.status}). Check GROUPME_GROUP_ID.`
          : "The GroupMe token and group ID work.",
      };
    }
    return jsonResponse(status);
  }

  if (req.method !== "POST") return jsonResponse({ ok: false, message: "Send a POST request." }, 405);
  if (!token || !groupId) {
    return jsonResponse({ ok: false, message: "Add GROUPME_TOKEN and GROUPME_GROUP_ID in Supabase Edge Function secrets." }, 503);
  }

  try {
    const { data: cursor } = await db
      .from("channel_cursor")
      .select("last_id, read_count")
      .eq("source", SOURCE)
      .maybeSingle();
    let lastId = String(cursor?.last_id ?? "");
    const readCount = Number(cursor?.read_count ?? 0);

    // Do not backfill old chat history on the first run.
    if (!lastId) {
      const newest = await groupMeGet(`/groups/${encodeURIComponent(groupId)}/messages?limit=1`, token);
      lastId = newest.messages[0]?.id ?? "0";
      await db.from("channel_cursor").upsert({
        source: SOURCE,
        last_id: lastId,
        read_count: 0,
        updated_at: new Date().toISOString(),
      });
      return jsonResponse({ ok: true, handled: 0, message: "First run saved the current GroupMe position. New messages will be read next time." });
    }

    const { messages } = await groupMeGet(
      `/groups/${encodeURIComponent(groupId)}/messages?after_id=${encodeURIComponent(lastId)}&limit=${MAX_PER_RUN}`,
      token,
    );
    const results: Record<string, unknown>[] = [];
    const submitHeaders: Record<string, string> = { "Content-Type": "application/json" };
    const publishableKey = callerKey();
    if (publishableKey) submitHeaders.apikey = publishableKey;

    for (const message of messages) {
      lastId = message.id;
      const text = (message.text ?? "").trim();
      if (message.system || message.sender_type === "bot" || !text) continue;
      const who = message.name || "Someone";
      const thread = await threadBefore(message, groupId, token);
      const response = await fetch(`${supabaseUrl}/functions/v1/submit-event`, {
        method: "POST",
        headers: submitHeaders,
        body: JSON.stringify({
          announcement: text.slice(0, 2000),
          source: SOURCE,
          source_id: message.id,
          source_name: who,
          thread,
        }),
      });
      const decision: Decision = await response.json().catch(() => ({
        ok: false,
        message: `The agent did not answer (${response.status}).`,
      }));
      results.push({ id: message.id, from: who, status: decision.ok ? decision.status : "error", message: decision.message ?? "" });
      if (botId && !decision.already_read) await postBotReply(botId, decisionText(who, decision));
    }

    await db.from("channel_cursor").upsert({
      source: SOURCE,
      last_id: lastId,
      read_count: readCount + results.length,
      updated_at: new Date().toISOString(),
    });
    return jsonResponse({ ok: true, handled: results.length, skipped: messages.length - results.length, results });
  } catch (error) {
    console.error("GroupMe reader failed", error);
    return jsonResponse({ ok: false, message: error instanceof Error ? error.message : "The GroupMe reader failed. Check the function logs." }, 502);
  }
}

Deno.serve((request) => {
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  const authorization = authorizeReader(request);
  if (!authorization.ok) return jsonResponse({ ok: false, message: authorization.message }, authorization.status);

  return readGroup(request).catch((error) => {
    console.error("Unhandled GroupMe reader error", error);
    return jsonResponse({ ok: false, message: "The GroupMe reader encountered an error." }, 500);
  });
});
