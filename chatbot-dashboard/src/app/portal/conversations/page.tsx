//src/app/portal/conversations/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiChevronDown,
  FiChevronUp,
  FiClock,
  FiGlobe,
  FiPhoneCall,
  FiRefreshCw,
  FiSearch,
  FiUser,
} from "react-icons/fi";
import {
  SiFacebook,
  SiInstagram,
  SiWhatsapp,
} from "react-icons/si";

import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";

type ConversationMessage = {
  id: string;
  message_id?: string | null;
  role?: string | null;
  content: string;
  timestamp: string;
  emotion?: string | null;
  intent?: string | null;
  interest_level?: number | null;
};

type Conversation = {
  conversation_id: string;
  channel: string;
  from_number: string | null;
  customer_name: string | null;
  started_at: string;
  ended_at: string;
  message_count: number;
  last_message: string | null;
  duration_sec?: number | null;
  messages: ConversationMessage[];
};

type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

const PAGE_SIZE = 10;

function normalizeChannel(value: unknown): string {
  return String(value || "")
    .trim()
    .toLowerCase();
}

export default function PortalConversationsPage() {
  const { t, lang } = useI18n();

  const [conversations, setConversations] =
    useState<Conversation[]>([]);

  const [pagination, setPagination] =
    useState<Pagination>({
      page: 1,
      limit: PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });

  const [channel, setChannel] = useState("");
  const [searchInput, setSearchInput] =
    useState("");
  const [search, setSearch] = useState("");

  const [expandedId, setExpandedId] =
    useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] = useState("");

  const locale = useMemo(() => {
    if (lang === "pt") return "pt-BR";
    if (lang === "es") return "es-US";

    return "en-US";
  }, [lang]);

  function formatDate(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function formatTime(value: string): string {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleTimeString(locale, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatDuration(
    seconds?: number | null
  ): string {
    const total = Number(seconds || 0);

    if (!total) {
      return "—";
    }

    const minutes = Math.floor(total / 60);
    const remainingSeconds = total % 60;

    if (minutes === 0) {
      return `${remainingSeconds}s`;
    }

    return `${minutes}m ${remainingSeconds}s`;
  }

  function getChannelIcon(channelName: string) {
    const normalized =
      normalizeChannel(channelName);

    if (normalized === "whatsapp") {
      return (
        <SiWhatsapp className="text-emerald-300" />
      );
    }

    if (normalized === "facebook") {
      return (
        <SiFacebook className="text-blue-300" />
      );
    }

    if (normalized === "instagram") {
      return (
        <SiInstagram className="text-pink-300" />
      );
    }

    if (normalized === "voice") {
      return (
        <FiPhoneCall className="text-purple-300" />
      );
    }

    return <FiGlobe className="text-white/50" />;
  }

  function getChannelLabel(
    channelName: string
  ): string {
    const normalized =
      normalizeChannel(channelName);

    if (normalized === "voice") {
      return t("history.channels.voice");
    }

    if (normalized === "whatsapp") {
      return "WhatsApp";
    }

    if (normalized === "facebook") {
      return "Facebook";
    }

    if (normalized === "instagram") {
      return "Instagram";
    }

    return channelName || "Other";
  }

  async function loadConversations(
    page = 1,
    refresh = false
  ) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const params = new URLSearchParams();

      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));

      if (channel) {
        params.set("canal", channel);
      }

      if (search) {
        params.set("search", search);
      }

      const response = await fetch(
        `${BACKEND_URL}/api/conversations?${params.toString()}`,
        {
          credentials: "include",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
            t("history.errors.load")
        );
      }

      setConversations(
        Array.isArray(data?.conversations)
          ? data.conversations
          : []
      );

      setPagination({
        page: Number(
          data?.pagination?.page || page
        ),
        limit: Number(
          data?.pagination?.limit ||
            PAGE_SIZE
        ),
        total: Number(
          data?.pagination?.total || 0
        ),
        totalPages: Math.max(
          1,
          Number(
            data?.pagination?.totalPages || 1
          )
        ),
      });

      setExpandedId(null);
    } catch (loadError) {
      console.error(
        "[PORTAL_CONVERSATIONS][LOAD_FAILED]",
        loadError
      );

      setConversations([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : t("history.errors.load")
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function applySearch() {
    setSearch(searchInput.trim());
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }

  useEffect(() => {
    void loadConversations(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [channel, search]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-purple-300">
            {t(
              "portal.navigation.conversations"
            )}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {t("history.title")}
          </h1>

          <p className="mt-2 text-sm text-white/50">
            {pagination.total}{" "}
            {t(
              "portal.conversations.total"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadConversations(
              pagination.page,
              true
            )
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold hover:bg-white/10 disabled:opacity-40"
        >
          <FiRefreshCw
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {t("portal.conversations.refresh")}
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-4">
        <div className="grid gap-3 md:grid-cols-[1fr_220px_auto_auto]">
          <div className="relative">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />

            <input
              type="text"
              value={searchInput}
              onChange={(event) =>
                setSearchInput(
                  event.target.value
                )
              }
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  applySearch();
                }
              }}
              placeholder={t(
                "portal.conversations.search"
              )}
              className="w-full rounded-xl border border-white/10 bg-black/25 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-purple-500"
            />
          </div>

          <select
            value={channel}
            onChange={(event) =>
              setChannel(event.target.value)
            }
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
          >
            <option value="">
              {t("history.filter.all")}
            </option>
            <option value="voice">
              {t("history.channels.voice")}
            </option>
            <option value="whatsapp">
              WhatsApp
            </option>
            <option value="facebook">
              Facebook
            </option>
            <option value="instagram">
              Instagram
            </option>
          </select>

          <button
            type="button"
            onClick={applySearch}
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold hover:bg-purple-500"
          >
            {t(
              "portal.conversations.searchAction"
            )}
          </button>

          <button
            type="button"
            onClick={clearSearch}
            className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold hover:bg-white/10"
          >
            {t(
              "portal.conversations.clear"
            )}
          </button>
        </div>
      </section>

      {loading ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-12 text-center text-white/50">
          {t("history.loading")}
        </div>
      ) : null}

      {!loading &&
      conversations.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] p-12 text-center text-white/50">
          {t("history.empty")}
        </div>
      ) : null}

      {!loading &&
      conversations.length > 0 ? (
        <section className="space-y-4">
          {conversations.map(
            (conversation) => {
              const expanded =
                expandedId ===
                conversation.conversation_id;

              return (
                <article
                  key={
                    conversation.conversation_id
                  }
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045]"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(
                        expanded
                          ? null
                          : conversation.conversation_id
                      )
                    }
                    className="flex w-full flex-col gap-4 p-5 text-left transition hover:bg-white/[0.025] sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-4">
                      <div className="rounded-xl bg-white/5 p-3 text-xl">
                        {getChannelIcon(
                          conversation.channel
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="font-bold">
                            {conversation.customer_name ||
                              conversation.from_number ||
                              t(
                                "history.sender.anonymous"
                              )}
                          </h2>

                          <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white/50">
                            {getChannelLabel(
                              conversation.channel
                            )}
                          </span>
                        </div>

                        {conversation.customer_name &&
                        conversation.from_number ? (
                          <p className="mt-1 text-xs text-white/35">
                            {
                              conversation.from_number
                            }
                          </p>
                        ) : null}

                        <p className="mt-3 line-clamp-2 text-sm text-white/60">
                          {conversation.last_message ||
                            "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center justify-between gap-5 sm:justify-end">
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          {formatDate(
                            conversation.ended_at
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {formatTime(
                            conversation.ended_at
                          )}
                        </p>

                        <p className="mt-1 text-xs text-white/40">
                          {
                            conversation.message_count
                          }{" "}
                          {t(
                            "portal.conversations.messages"
                          )}
                        </p>
                      </div>

                      {expanded ? (
                        <FiChevronUp />
                      ) : (
                        <FiChevronDown />
                      )}
                    </div>
                  </button>

                  {expanded ? (
                    <div className="border-t border-white/10 p-4 sm:p-5">
                      <div className="mb-5 flex flex-wrap gap-3 text-xs text-white/45">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                          <FiClock />
                          {formatDate(
                            conversation.started_at
                          )}{" "}
                          {formatTime(
                            conversation.started_at
                          )}
                        </span>

                        {conversation.channel ===
                          "voice" &&
                        conversation.duration_sec ? (
                          <span className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5">
                            <FiPhoneCall />
                            {formatDuration(
                              conversation.duration_sec
                            )}
                          </span>
                        ) : null}
                      </div>

                      <div className="max-h-[65vh] space-y-3 overflow-y-auto pr-1">
                        {conversation.messages.map(
                          (message) => {
                            const isUser =
                              normalizeChannel(
                                message.role
                              ) === "user";

                            return (
                              <div
                                key={message.id}
                                className={[
                                  "flex",
                                  isUser
                                    ? "justify-start"
                                    : "justify-end",
                                ].join(" ")}
                              >
                                <div
                                  className={[
                                    "max-w-[88%] rounded-2xl border px-4 py-3 text-sm sm:max-w-[72%]",
                                    isUser
                                      ? "border-purple-500/20 bg-purple-500/10"
                                      : "border-emerald-500/20 bg-emerald-500/10",
                                  ].join(" ")}
                                >
                                  <div className="mb-2 flex items-center gap-2 text-xs text-white/40">
                                    <FiUser />

                                    <span>
                                      {isUser
                                        ? conversation.customer_name ||
                                          t(
                                            "history.sender.client"
                                          )
                                        : t(
                                            "history.sender.assistant"
                                          )}
                                    </span>

                                    <span>·</span>

                                    <span>
                                      {formatTime(
                                        message.timestamp
                                      )}
                                    </span>
                                  </div>

                                  <p className="whitespace-pre-wrap leading-6 text-white/85">
                                    {message.content}
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            }
          )}
        </section>
      ) : null}

      {!loading &&
      pagination.totalPages > 1 ? (
        <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.045] p-4">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() =>
              void loadConversations(
                pagination.page - 1
              )
            }
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {t(
              "portal.appointments.pagination.previous"
            )}
          </button>

          <span className="text-sm text-white/50">
            {pagination.page} /{" "}
            {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={
              pagination.page >=
              pagination.totalPages
            }
            onClick={() =>
              void loadConversations(
                pagination.page + 1
              )
            }
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
          >
            {t(
              "portal.appointments.pagination.next"
            )}
          </button>
        </div>
      ) : null}
    </div>
  );
}