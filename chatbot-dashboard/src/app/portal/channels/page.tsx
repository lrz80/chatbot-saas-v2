//src/app/portal/channels/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiHelpCircle,
  FiLoader,
  FiPhone,
  FiRefreshCw,
  FiSettings,
  FiXCircle,
} from "react-icons/fi";
import { FaFacebook, FaInstagram, FaWhatsapp } from "react-icons/fa";
import { SiMeta } from "react-icons/si";

import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";

type MainChannelKey = "voice" | "whatsapp" | "meta";

type ChannelState = {
  channel: MainChannelKey;

  enabled: boolean;
  maintenance: boolean;
  plan_enabled: boolean;
  settings_enabled: boolean;

  maintenance_message: string | null;

  configured: boolean;
  connection_status: string | null;

  assigned_number: string | null;

  facebook_enabled: boolean;
  instagram_enabled: boolean;

  facebook_connected: boolean;
  instagram_connected: boolean;

  facebook_name: string | null;
  instagram_name: string | null;
};

const EMPTY_CHANNELS: Record<
  MainChannelKey,
  ChannelState
> = {
  voice: {
    channel: "voice",
    enabled: false,
    maintenance: false,
    plan_enabled: false,
    settings_enabled: false,
    maintenance_message: null,
    configured: false,
    connection_status: null,
    assigned_number: null,
    facebook_enabled: false,
    instagram_enabled: false,
    facebook_connected: false,
    instagram_connected: false,
    facebook_name: null,
    instagram_name: null,
  },

  whatsapp: {
    channel: "whatsapp",
    enabled: false,
    maintenance: false,
    plan_enabled: false,
    settings_enabled: false,
    maintenance_message: null,
    configured: false,
    connection_status: null,
    assigned_number: null,
    facebook_enabled: false,
    instagram_enabled: false,
    facebook_connected: false,
    instagram_connected: false,
    facebook_name: null,
    instagram_name: null,
  },

  meta: {
    channel: "meta",
    enabled: false,
    maintenance: false,
    plan_enabled: false,
    settings_enabled: false,
    maintenance_message: null,
    configured: false,
    connection_status: null,
    assigned_number: null,
    facebook_enabled: true,
    instagram_enabled: true,
    facebook_connected: false,
    instagram_connected: false,
    facebook_name: null,
    instagram_name: null,
  },
};

function normalizeText(value: unknown): string {
  return String(value || "").trim();
}

function normalizePhone(value: unknown): string {
  return normalizeText(value).replace(
    /^whatsapp:/i,
    ""
  );
}

function Switch({
  checked,
  disabled,
  loading,
  label,
  onChange,
}: {
  checked: boolean;
  disabled: boolean;
  loading?: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || loading}
      onClick={() => onChange(!checked)}
      className={[
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition",
        checked
          ? "border-emerald-400/40 bg-emerald-500"
          : "border-white/10 bg-white/10",
        disabled || loading
          ? "cursor-not-allowed opacity-40"
          : "cursor-pointer",
      ].join(" ")}
    >
      <span
        className={[
          "inline-block h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked
            ? "translate-x-6"
            : "translate-x-1",
        ].join(" ")}
      />

      {loading ? (
        <FiLoader className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin text-xs text-black" />
      ) : null}
    </button>
  );
}

function StatusBadge({
  type,
  children,
}: {
  type:
    | "active"
    | "inactive"
    | "warning"
    | "neutral";
  children: React.ReactNode;
}) {
  const classes = {
    active:
      "border-emerald-500/25 bg-emerald-500/10 text-emerald-300",
    inactive:
      "border-red-500/25 bg-red-500/10 text-red-300",
    warning:
      "border-amber-500/25 bg-amber-500/10 text-amber-300",
    neutral:
      "border-white/10 bg-white/5 text-white/50",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold",
        classes[type],
      ].join(" ")}
    >
      {children}
    </span>
  );
}

export default function PortalChannelsPage() {
  const { t } = useI18n();

  const [channels, setChannels] = useState(
    EMPTY_CHANNELS
  );

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] =
    useState(false);

  const [savingKey, setSavingKey] =
    useState<string | null>(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeChannelsCount = useMemo(() => {
    return Object.values(channels).filter(
      (channel) =>
        channel.enabled &&
        !channel.maintenance
    ).length;
  }, [channels]);

  function updateChannel(
    channel: MainChannelKey,
    patch: Partial<ChannelState>
  ) {
    setChannels((current) => ({
      ...current,
      [channel]: {
        ...current[channel],
        ...patch,
      },
    }));
  }

  function canToggleChannel(
    state: ChannelState
  ): boolean {
    return (
      state.plan_enabled &&
      state.configured &&
      !state.maintenance
    );
  }

  function getDisabledReason(
    state: ChannelState
  ): string | null {
    if (state.maintenance) {
      return (
        state.maintenance_message ||
        t(
          "portal.channels.reasons.maintenance"
        )
      );
    }

    if (!state.plan_enabled) {
      return t(
        "portal.channels.reasons.notIncluded"
      );
    }

    if (!state.configured) {
      return t(
        "portal.channels.reasons.notConfigured"
      );
    }

    return null;
  }

  function normalizeChannelResponse(
    channel: MainChannelKey,
    data: any
  ): ChannelState {
    const settingsEnabled = Boolean(
      data?.settings_enabled ??
        data?.channel_enabled ??
        data?.enabled
    );

    const planEnabled = Boolean(
      data?.plan_enabled ??
        data?.allowed_by_plan ??
        data?.enabled_by_plan
    );

    const maintenance = Boolean(
      data?.maintenance
    );

    return {
      ...EMPTY_CHANNELS[channel],

      channel,

      enabled: Boolean(
        data?.enabled ??
          (planEnabled &&
            settingsEnabled &&
            !maintenance)
      ),

      maintenance,
      plan_enabled: planEnabled,
      settings_enabled: settingsEnabled,

      maintenance_message:
        normalizeText(
          data?.maintenance_message
        ) || null,

      configured: Boolean(
        data?.configured ??
          data?.is_configured ??
          data?.connected
      ),

      connection_status:
        normalizeText(
          data?.connection_status ||
            data?.status
        ) || null,

      assigned_number:
        normalizePhone(
          data?.assigned_number ||
            data?.phone_number ||
            data?.twilio_number
        ) || null,

      facebook_enabled:
        data?.facebook_enabled !== false,

      instagram_enabled:
        data?.instagram_enabled !== false,

      facebook_connected: Boolean(
        data?.facebook_connected
      ),

      instagram_connected: Boolean(
        data?.instagram_connected
      ),

      facebook_name:
        normalizeText(
          data?.facebook_name
        ) || null,

      instagram_name:
        normalizeText(
          data?.instagram_name
        ) || null,
    };
  }

  async function loadChannels(
    showRefresh = false
  ) {
    if (showRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");
    setSuccess("");

    try {
      const options: RequestInit = {
        credentials: "include",
        cache: "no-store",
      };

      const [
        settingsResult,
        voiceResult,
        whatsappResult,
        metaResult,
        metaConfigResult,
      ] = await Promise.allSettled([
        fetch(
          `${BACKEND_URL}/api/settings`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/channel-settings?canal=voice`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/channel-settings?canal=whatsapp`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/channel-settings?canal=meta`,
          options
        ),

        fetch(
          `${BACKEND_URL}/api/meta-config`,
          options
        ),
      ]);

      let settings: any = {};
      let metaConfig: any = {};

      if (
        settingsResult.status ===
          "fulfilled" &&
        settingsResult.value.ok
      ) {
        settings =
          await settingsResult.value.json();
      }

      if (
        metaConfigResult.status ===
          "fulfilled" &&
        metaConfigResult.value.ok
      ) {
        metaConfig =
          await metaConfigResult.value.json();
      }

      let voiceState =
        EMPTY_CHANNELS.voice;

      if (
        voiceResult.status ===
          "fulfilled" &&
        voiceResult.value.ok
      ) {
        const voiceData =
          await voiceResult.value.json();

        voiceState =
          normalizeChannelResponse(
            "voice",
            voiceData
          );
      }

      const assignedVoiceNumber =
        normalizePhone(
          settings?.twilio_voice_number ||
            settings?.twilio_number
        );

      voiceState = {
        ...voiceState,
        assigned_number:
          voiceState.assigned_number ||
          assignedVoiceNumber ||
          null,

        configured: Boolean(
          voiceState.configured ||
            assignedVoiceNumber
        ),
      };

      let whatsappState =
        EMPTY_CHANNELS.whatsapp;

      if (
        whatsappResult.status ===
          "fulfilled" &&
        whatsappResult.value.ok
      ) {
        const whatsappData =
          await whatsappResult.value.json();

        whatsappState =
          normalizeChannelResponse(
            "whatsapp",
            whatsappData
          );
      }

      const assignedWhatsAppNumber =
        normalizePhone(
          settings?.whatsapp_phone_number ||
            settings?.twilio_number
        );

      const whatsappStatus =
        normalizeText(
          settings?.whatsapp_status
        );

      whatsappState = {
        ...whatsappState,

        assigned_number:
          whatsappState.assigned_number ||
          assignedWhatsAppNumber ||
          null,

        connection_status:
          whatsappState.connection_status ||
          whatsappStatus ||
          null,

        configured: Boolean(
          whatsappState.configured ||
            assignedWhatsAppNumber ||
            whatsappStatus === "connected"
        ),
      };

      let metaState =
        EMPTY_CHANNELS.meta;

      if (
        metaResult.status ===
          "fulfilled" &&
        metaResult.value.ok
      ) {
        const metaData =
          await metaResult.value.json();

        metaState =
          normalizeChannelResponse(
            "meta",
            metaData
          );
      }

      const facebookConnected = Boolean(
        metaConfig?.facebook_page_id
      );

      const instagramConnected = Boolean(
        metaConfig?.instagram_page_id
      );

      metaState = {
        ...metaState,

        configured: Boolean(
          metaState.configured ||
            facebookConnected ||
            instagramConnected
        ),

        facebook_connected:
          facebookConnected,

        instagram_connected:
          instagramConnected,

        facebook_name:
          normalizeText(
            metaConfig?.facebook_page_name
          ) || null,

        instagram_name:
          normalizeText(
            metaConfig?.instagram_page_name
          ) || null,

        facebook_enabled:
          settings?.meta_subchannel_flags
            ?.facebook !== false &&
          settings?.facebook_enabled !== false &&
          metaState.facebook_enabled !== false,

        instagram_enabled:
          settings?.meta_subchannel_flags
            ?.instagram !== false &&
          settings?.instagram_enabled !== false &&
          metaState.instagram_enabled !== false,
      };

      setChannels({
        voice: voiceState,
        whatsapp: whatsappState,
        meta: metaState,
      });

      const successfulRequests = [
        voiceResult,
        whatsappResult,
        metaResult,
      ].filter(
        (result) =>
          result.status ===
            "fulfilled" &&
          result.value.ok
      ).length;

      if (successfulRequests === 0) {
        setError(
          t("portal.channels.errors.load")
        );
      }
    } catch (loadError) {
      console.error(
        "[CLIENT_PORTAL][CHANNELS_LOAD_FAILED]",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : t(
              "portal.channels.errors.load"
            )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function toggleMainChannel(
    channel: MainChannelKey,
    nextEnabled: boolean
  ) {
    const current = channels[channel];

    if (!canToggleChannel(current)) {
      setError(
        getDisabledReason(current) ||
          t(
            "portal.channels.errors.toggle"
          )
      );

      return;
    }

    const savingId = `channel:${channel}`;

    setSavingKey(savingId);
    setError("");
    setSuccess("");

    updateChannel(channel, {
      settings_enabled: nextEnabled,
      enabled: nextEnabled,
    });

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/channel-settings?canal=${channel}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            enabled: nextEnabled,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            t(
              "portal.channels.errors.toggle"
            )
        );
      }

      const normalized =
        normalizeChannelResponse(
          channel,
          data
        );

      updateChannel(channel, {
        ...normalized,

        configured:
          normalized.configured ||
          current.configured,

        assigned_number:
          normalized.assigned_number ||
          current.assigned_number,

        facebook_connected:
          normalized.facebook_connected ||
          current.facebook_connected,

        instagram_connected:
          normalized.instagram_connected ||
          current.instagram_connected,

        facebook_name:
          normalized.facebook_name ||
          current.facebook_name,

        instagram_name:
          normalized.instagram_name ||
          current.instagram_name,
      });

      setSuccess(
        nextEnabled
          ? t(
              "portal.channels.success.activated",
              {
                channel:
                  getChannelName(channel),
              }
            )
          : t(
              "portal.channels.success.deactivated",
              {
                channel:
                  getChannelName(channel),
              }
            )
      );
    } catch (toggleError) {
      console.error(
        "[CLIENT_PORTAL][CHANNEL_TOGGLE_FAILED]",
        toggleError
      );

      updateChannel(channel, {
        settings_enabled:
          current.settings_enabled,
        enabled: current.enabled,
      });

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : t(
              "portal.channels.errors.toggle"
            )
      );
    } finally {
      setSavingKey(null);
    }
  }

  async function toggleMetaSubchannel(
    subchannel: "facebook" | "instagram",
    nextEnabled: boolean
  ) {
    const meta = channels.meta;

    if (
      !meta.plan_enabled ||
      !meta.configured ||
      meta.maintenance ||
      !meta.settings_enabled
    ) {
      setError(
        getDisabledReason(meta) ||
          t(
            "portal.channels.reasons.metaOff"
          )
      );

      return;
    }

    const connected =
      subchannel === "facebook"
        ? meta.facebook_connected
        : meta.instagram_connected;

    if (!connected) {
      setError(
        t(
          "portal.channels.reasons.accountNotConnected"
        )
      );

      return;
    }

    const savingId = `meta:${subchannel}`;

    setSavingKey(savingId);
    setError("");
    setSuccess("");

    const previousValue =
      subchannel === "facebook"
        ? meta.facebook_enabled
        : meta.instagram_enabled;

    updateChannel("meta", {
      [subchannel === "facebook"
        ? "facebook_enabled"
        : "instagram_enabled"]:
        nextEnabled,
    });

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/settings`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            [`${subchannel}_enabled`]:
              nextEnabled,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            t(
              "portal.channels.errors.toggle"
            )
        );
      }

      setSuccess(
        nextEnabled
          ? t(
              "portal.channels.success.activated",
              {
                channel:
                  subchannel === "facebook"
                    ? "Facebook"
                    : "Instagram",
              }
            )
          : t(
              "portal.channels.success.deactivated",
              {
                channel:
                  subchannel === "facebook"
                    ? "Facebook"
                    : "Instagram",
              }
            )
      );
    } catch (toggleError) {
      console.error(
        "[CLIENT_PORTAL][META_SUBCHANNEL_TOGGLE_FAILED]",
        toggleError
      );

      updateChannel("meta", {
        [subchannel === "facebook"
          ? "facebook_enabled"
          : "instagram_enabled"]:
          previousValue,
      });

      setError(
        toggleError instanceof Error
          ? toggleError.message
          : t(
              "portal.channels.errors.toggle"
            )
      );
    } finally {
      setSavingKey(null);
    }
  }

  function getChannelName(
    channel: MainChannelKey
  ): string {
    if (channel === "voice") {
      return t(
        "portal.channels.voice.title"
      );
    }

    if (channel === "whatsapp") {
      return "WhatsApp";
    }

    return "Meta";
  }

  useEffect(() => {
    void loadChannels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-purple-500" />
      </div>
    );
  }

  const voice = channels.voice;
  const whatsapp = channels.whatsapp;
  const meta = channels.meta;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-purple-300">
            {t(
              "portal.navigation.channels"
            )}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            {t(
              "portal.channels.title"
            )}
          </h1>

          <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
            {t(
              "portal.channels.description"
            )}
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void loadChannels(true)
          }
          disabled={refreshing}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <FiRefreshCw
            className={
              refreshing
                ? "animate-spin"
                : ""
            }
          />

          {refreshing
            ? t(
                "portal.channels.actions.refreshing"
              )
            : t(
                "portal.channels.actions.refresh"
              )}
        </button>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          {success}
        </div>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
          <p className="text-sm text-white/45">
            {t(
              "portal.channels.summary.available"
            )}
          </p>

          <p className="mt-2 text-3xl font-bold">
            {
              Object.values(
                channels
              ).filter(
                (channel) =>
                  channel.plan_enabled
              ).length
            }
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
          <p className="text-sm text-white/45">
            {t(
              "portal.channels.summary.active"
            )}
          </p>

          <p className="mt-2 text-3xl font-bold text-emerald-300">
            {activeChannelsCount}
          </p>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
          <p className="text-sm text-white/45">
            {t(
              "portal.channels.summary.pending"
            )}
          </p>

          <p className="mt-2 text-3xl font-bold text-amber-300">
            {
              Object.values(
                channels
              ).filter(
                (channel) =>
                  channel.plan_enabled &&
                  !channel.configured
              ).length
            }
          </p>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
                <FiPhone size={23} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  {t(
                    "portal.channels.voice.title"
                  )}
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  {t(
                    "portal.channels.voice.description"
                  )}
                </p>
              </div>
            </div>

            <Switch
              checked={
                voice.settings_enabled
              }
              disabled={
                !canToggleChannel(voice)
              }
              loading={
                savingKey ===
                "channel:voice"
              }
              label={t(
                "portal.channels.voice.toggle"
              )}
              onChange={(next) =>
                void toggleMainChannel(
                  "voice",
                  next
                )
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <StatusBadge
              type={
                voice.plan_enabled
                  ? "active"
                  : "inactive"
              }
            >
              {voice.plan_enabled ? (
                <FiCheckCircle />
              ) : (
                <FiXCircle />
              )}

              {voice.plan_enabled
                ? t(
                    "portal.channels.status.included"
                  )
                : t(
                    "portal.channels.status.notIncluded"
                  )}
            </StatusBadge>

            <StatusBadge
              type={
                voice.configured
                  ? "active"
                  : "warning"
              }
            >
              {voice.configured ? (
                <FiCheckCircle />
              ) : (
                <FiAlertTriangle />
              )}

              {voice.configured
                ? t(
                    "portal.channels.status.configured"
                  )
                : t(
                    "portal.channels.status.notConfigured"
                  )}
            </StatusBadge>

            <StatusBadge
              type={
                voice.maintenance
                  ? "warning"
                  : voice.enabled
                    ? "active"
                    : "neutral"
              }
            >
              {voice.maintenance
                ? t(
                    "portal.channels.status.maintenance"
                  )
                : voice.enabled
                  ? t(
                      "portal.channels.status.active"
                    )
                  : t(
                      "portal.channels.status.off"
                    )}
            </StatusBadge>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/35">
              {t(
                "portal.channels.fields.assignedNumber"
              )}
            </p>

            <p className="mt-2 font-mono text-sm text-white/75">
              {voice.assigned_number ||
                t(
                  "portal.channels.values.notAssigned"
                )}
            </p>
          </div>

          {getDisabledReason(voice) ? (
            <p className="mt-4 text-sm leading-6 text-amber-200/80">
              {getDisabledReason(voice)}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-300">
                <FaWhatsapp size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  WhatsApp
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  {t(
                    "portal.channels.whatsapp.description"
                  )}
                </p>
              </div>
            </div>

            <Switch
              checked={
                whatsapp.settings_enabled
              }
              disabled={
                !canToggleChannel(
                  whatsapp
                )
              }
              loading={
                savingKey ===
                "channel:whatsapp"
              }
              label={t(
                "portal.channels.whatsapp.toggle"
              )}
              onChange={(next) =>
                void toggleMainChannel(
                  "whatsapp",
                  next
                )
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <StatusBadge
              type={
                whatsapp.plan_enabled
                  ? "active"
                  : "inactive"
              }
            >
              {whatsapp.plan_enabled ? (
                <FiCheckCircle />
              ) : (
                <FiXCircle />
              )}

              {whatsapp.plan_enabled
                ? t(
                    "portal.channels.status.included"
                  )
                : t(
                    "portal.channels.status.notIncluded"
                  )}
            </StatusBadge>

            <StatusBadge
              type={
                whatsapp.configured
                  ? "active"
                  : "warning"
              }
            >
              {whatsapp.configured ? (
                <FiCheckCircle />
              ) : (
                <FiAlertTriangle />
              )}

              {whatsapp.configured
                ? t(
                    "portal.channels.status.configured"
                  )
                : t(
                    "portal.channels.status.notConfigured"
                  )}
            </StatusBadge>

            <StatusBadge
              type={
                whatsapp.maintenance
                  ? "warning"
                  : whatsapp.enabled
                    ? "active"
                    : "neutral"
              }
            >
              {whatsapp.maintenance
                ? t(
                    "portal.channels.status.maintenance"
                  )
                : whatsapp.enabled
                  ? t(
                      "portal.channels.status.active"
                    )
                  : t(
                      "portal.channels.status.off"
                    )}
            </StatusBadge>
          </div>

          <div className="mt-6 rounded-xl border border-white/10 bg-black/15 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/35">
              {t(
                "portal.channels.fields.assignedNumber"
              )}
            </p>

            <p className="mt-2 font-mono text-sm text-white/75">
              {whatsapp.assigned_number ||
                t(
                  "portal.channels.values.notAssigned"
                )}
            </p>
          </div>

          {getDisabledReason(
            whatsapp
          ) ? (
            <p className="mt-4 text-sm leading-6 text-amber-200/80">
              {getDisabledReason(
                whatsapp
              )}
            </p>
          ) : null}
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-500/15 p-3 text-blue-300">
                <SiMeta size={24} />
              </div>

              <div>
                <h2 className="text-xl font-bold">
                  Meta
                </h2>

                <p className="mt-1 text-sm text-white/45">
                  {t(
                    "portal.channels.meta.description"
                  )}
                </p>
              </div>
            </div>

            <Switch
              checked={
                meta.settings_enabled
              }
              disabled={
                !canToggleChannel(meta)
              }
              loading={
                savingKey ===
                "channel:meta"
              }
              label={t(
                "portal.channels.meta.toggle"
              )}
              onChange={(next) =>
                void toggleMainChannel(
                  "meta",
                  next
                )
              }
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <StatusBadge
              type={
                meta.plan_enabled
                  ? "active"
                  : "inactive"
              }
            >
              {meta.plan_enabled ? (
                <FiCheckCircle />
              ) : (
                <FiXCircle />
              )}

              {meta.plan_enabled
                ? t(
                    "portal.channels.status.included"
                  )
                : t(
                    "portal.channels.status.notIncluded"
                  )}
            </StatusBadge>

            <StatusBadge
              type={
                meta.configured
                  ? "active"
                  : "warning"
              }
            >
              {meta.configured ? (
                <FiCheckCircle />
              ) : (
                <FiAlertTriangle />
              )}

              {meta.configured
                ? t(
                    "portal.channels.status.configured"
                  )
                : t(
                    "portal.channels.status.notConfigured"
                  )}
            </StatusBadge>

            <StatusBadge
              type={
                meta.maintenance
                  ? "warning"
                  : meta.enabled
                    ? "active"
                    : "neutral"
              }
            >
              {meta.maintenance
                ? t(
                    "portal.channels.status.maintenance"
                  )
                : meta.enabled
                  ? t(
                      "portal.channels.status.active"
                    )
                  : t(
                      "portal.channels.status.off"
                    )}
            </StatusBadge>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/15 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FaFacebook className="shrink-0 text-blue-300" />

                <div className="min-w-0">
                  <p className="font-semibold">
                    Facebook
                  </p>

                  <p className="truncate text-xs text-white/40">
                    {meta.facebook_connected
                      ? meta.facebook_name ||
                        t(
                          "portal.channels.status.connected"
                        )
                      : t(
                          "portal.channels.status.notConnected"
                        )}
                  </p>
                </div>
              </div>

              <Switch
                checked={
                  meta.facebook_enabled
                }
                disabled={
                  !meta.plan_enabled ||
                  !meta.settings_enabled ||
                  !meta.facebook_connected ||
                  meta.maintenance
                }
                loading={
                  savingKey ===
                  "meta:facebook"
                }
                label="Facebook"
                onChange={(next) =>
                  void toggleMetaSubchannel(
                    "facebook",
                    next
                  )
                }
              />
            </div>

            <div className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-black/15 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <FaInstagram className="shrink-0 text-pink-300" />

                <div className="min-w-0">
                  <p className="font-semibold">
                    Instagram
                  </p>

                  <p className="truncate text-xs text-white/40">
                    {meta.instagram_connected
                      ? meta.instagram_name
                        ? `@${meta.instagram_name.replace(
                            /^@/,
                            ""
                          )}`
                        : t(
                            "portal.channels.status.connected"
                          )
                      : t(
                          "portal.channels.status.notConnected"
                        )}
                  </p>
                </div>
              </div>

              <Switch
                checked={
                  meta.instagram_enabled
                }
                disabled={
                  !meta.plan_enabled ||
                  !meta.settings_enabled ||
                  !meta.instagram_connected ||
                  meta.maintenance
                }
                loading={
                  savingKey ===
                  "meta:instagram"
                }
                label="Instagram"
                onChange={(next) =>
                  void toggleMetaSubchannel(
                    "instagram",
                    next
                  )
                }
              />
            </div>
          </div>

          {getDisabledReason(meta) ? (
            <p className="mt-4 text-sm leading-6 text-amber-200/80">
              {getDisabledReason(meta)}
            </p>
          ) : null}
        </article>
      </section>

      <section className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
            <FiHelpCircle size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold">
              {t(
                "portal.channels.help.title"
              )}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              {t(
                "portal.channels.help.description"
              )}
            </p>

            <a
              href="/portal/support"
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold hover:bg-white/15"
            >
              <FiSettings />
              {t(
                "portal.channels.help.action"
              )}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}