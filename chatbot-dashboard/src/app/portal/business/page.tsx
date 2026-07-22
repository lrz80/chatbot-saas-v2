//src/app/portal/business/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiBriefcase,
  FiCalendar,
  FiClock,
  FiMail,
  FiMapPin,
  FiPhone,
  FiSave,
  FiUpload,
} from "react-icons/fi";

import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";

type DayKey =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";

type DayHours = {
  start: string;
  end: string;
} | null;

type HoursByWeekday = Record<DayKey, DayHours>;

type BusinessData = {
  tenantId: string;
  businessName: string;
  logoUrl: string;
  address: string;
  businessEmail: string;
  businessPhone: string;
  assignedPhoneNumber: string;
  registeredAt: string | null;

  membershipActive: boolean;
  membershipExpiresAt: string | null;
  trialActive: boolean;
  canEdit: boolean;
};

const DEFAULT_HOURS: HoursByWeekday = {
  mon: { start: "09:00", end: "17:00" },
  tue: { start: "09:00", end: "17:00" },
  wed: { start: "09:00", end: "17:00" },
  thu: { start: "09:00", end: "17:00" },
  fri: { start: "09:00", end: "17:00" },
  sat: null,
  sun: null,
};

const DAY_KEYS: DayKey[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];

function normalizeHours(raw: unknown): HoursByWeekday {
  try {
    if (!raw) {
      return DEFAULT_HOURS;
    }

    let source = raw;

    if (typeof source === "string") {
      const value = source.trim();

      const legacyMatch = value.match(
        /^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/
      );

      if (legacyMatch) {
        const start = legacyMatch[1];
        const end = legacyMatch[2];

        return {
          mon: { start, end },
          tue: { start, end },
          wed: { start, end },
          thu: { start, end },
          fri: { start, end },
          sat: null,
          sun: null,
        };
      }

      source = JSON.parse(value);
    }

    const normalized: HoursByWeekday = {
      ...DEFAULT_HOURS,
    };

    for (const key of DAY_KEYS) {
      const day = (source as any)?.[key];

      if (
        day &&
        typeof day === "object" &&
        day.start &&
        day.end
      ) {
        normalized[key] = {
          start: String(day.start),
          end: String(day.end),
        };
      } else {
        normalized[key] = null;
      }
    }

    return normalized;
  } catch {
    return DEFAULT_HOURS;
  }
}

function normalizePhoneNumber(value: unknown): string {
  return String(value || "")
    .replace(/^whatsapp:/i, "")
    .trim();
}

export default function PortalBusinessPage() {
  const { t, lang } = useI18n();

  const [business, setBusiness] = useState<BusinessData>({
    tenantId: "",
    businessName: "",
    logoUrl: "",
    address: "",
    businessEmail: "",
    businessPhone: "",
    assignedPhoneNumber: "",
    registeredAt: null,

    membershipActive: false,
    membershipExpiresAt: null,
    trialActive: false,
    canEdit: false,
  });

  const [hours, setHours] =
    useState<HoursByWeekday>(DEFAULT_HOURS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const locale = useMemo(() => {
    if (lang === "pt") return "pt-BR";
    if (lang === "es") return "es-US";

    return "en-US";
  }, [lang]);

  const dayLabels = useMemo<Record<DayKey, string>>(
    () => ({
      mon: t("profile.days.mon"),
      tue: t("profile.days.tue"),
      wed: t("profile.days.wed"),
      thu: t("profile.days.thu"),
      fri: t("profile.days.fri"),
      sat: t("profile.days.sat"),
      sun: t("profile.days.sun"),
    }),
    [t]
  );

  function formatDate(value: string | null): string {
    if (!value) {
      return t("profile.values.dateUnavailable");
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return t("profile.values.dateUnavailable");
    }

    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "2-digit",
    });
  }

  function updateBusiness(
    patch: Partial<BusinessData>
  ) {
    setBusiness((current) => ({
      ...current,
      ...patch,
    }));
  }

  function updateDay(
    dayKey: DayKey,
    patch:
      | Partial<{
          start: string;
          end: string;
        }>
      | null
  ) {
    setHours((current) => {
      const next = {
        ...current,
      };

      if (patch === null) {
        next[dayKey] = null;
        return next;
      }

      next[dayKey] = {
        start:
          patch.start ??
          current[dayKey]?.start ??
          "09:00",
        end:
          patch.end ??
          current[dayKey]?.end ??
          "17:00",
      };

      return next;
    });
  }

  async function loadBusiness() {
    setLoading(true);
    setError("");

    try {
      const [settingsResponse, tenantResponse] =
        await Promise.all([
          fetch(`${BACKEND_URL}/api/settings`, {
            credentials: "include",
            cache: "no-store",
          }),
          fetch(`${BACKEND_URL}/api/tenants/me`, {
            credentials: "include",
            cache: "no-store",
          }),
        ]);

      if (!settingsResponse.ok) {
        throw new Error(
          `${t("portal.business.errors.load")} (${settingsResponse.status})`
        );
      }

      const settings = await settingsResponse.json();

      const tenant = tenantResponse.ok
        ? await tenantResponse.json()
        : {};

      const voiceNumber = normalizePhoneNumber(
        settings?.twilio_voice_number
      );

      const whatsappNumber = normalizePhoneNumber(
        settings?.twilio_number ||
          settings?.twilio_whatsapp_number
      );

      const trialActive = Boolean(
        settings?.trial_vigente ||
          settings?.trial_activo
      );

      const membershipActive = Boolean(
        settings?.membresia_activa
      );

      const canEdit = Boolean(
        settings?.can_edit ??
          membershipActive ??
          trialActive
      );

      const resolvedHours =
        settings?.horario_atencion ??
        tenant?.horario_atencion ??
        null;

      setBusiness({
        tenantId: String(
          settings?.tenant_id || tenant?.id || ""
        ),

        businessName: String(
          settings?.name ||
            settings?.nombre_negocio ||
            tenant?.name ||
            ""
        ),

        logoUrl: String(
          settings?.logo_url ||
            tenant?.logo_url ||
            ""
        ),

        address: String(
          settings?.direccion ||
            tenant?.direccion ||
            ""
        ),

        businessEmail: String(
          settings?.email_negocio ||
            tenant?.email_negocio ||
            ""
        ),

        businessPhone: String(
          settings?.telefono_negocio ||
            tenant?.telefono_negocio ||
            ""
        ),

        assignedPhoneNumber:
          voiceNumber || whatsappNumber,

        registeredAt:
          settings?.registered_at ||
          tenant?.created_at ||
          null,

        membershipActive,
        membershipExpiresAt:
          settings?.membresia_vigencia || null,
        trialActive,
        canEdit,
      });

      setHours(normalizeHours(resolvedHours));
    } catch (loadError) {
      console.error(
        "[CLIENT_PORTAL][BUSINESS_LOAD_FAILED]",
        loadError
      );

      setError(
        loadError instanceof Error
          ? loadError.message
          : t("portal.business.errors.load")
      );
    } finally {
      setLoading(false);
    }
  }

  async function uploadLogo(
    file: File | undefined
  ) {
    if (!file || !business.canEdit) {
      return;
    }

    setUploadingLogo(true);
    setError("");
    setSuccess("");

    try {
      const body = new FormData();
      body.append("logo", file);

      const response = await fetch(
        `${BACKEND_URL}/api/upload-logo`,
        {
          method: "POST",
          credentials: "include",
          body,
        }
      );

      const data = await response.json();

      if (!response.ok || !data?.logo_url) {
        throw new Error(
          data?.error ||
            t("portal.business.errors.logo")
        );
      }

      updateBusiness({
        logoUrl: String(data.logo_url),
      });

      setSuccess(
        t("portal.business.success.logo")
      );
    } catch (uploadError) {
      console.error(
        "[CLIENT_PORTAL][LOGO_UPLOAD_FAILED]",
        uploadError
      );

      setError(
        uploadError instanceof Error
          ? uploadError.message
          : t("portal.business.errors.logo")
      );
    } finally {
      setUploadingLogo(false);
    }
  }

  async function saveBusiness() {
    if (!business.canEdit) {
      setError(
        t("portal.business.errors.readOnly")
      );
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const legacyMondayRange =
        hours.mon?.start && hours.mon?.end
          ? `${hours.mon.start}-${hours.mon.end}`
          : "";

      const response = await fetch(
        `${BACKEND_URL}/api/settings`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            /*
             * El nombre del negocio NO se envía.
             * El cliente no puede modificarlo.
             */
            horario_atencion: hours,
            horario_atencion_legacy:
              legacyMondayRange,
            direccion: business.address.trim(),
            email_negocio:
              business.businessEmail.trim(),
            telefono_negocio:
              business.businessPhone.trim(),
            logo_url: business.logoUrl,
          }),
        }
      );

      const data = await response
        .json()
        .catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.error ||
            t("portal.business.errors.save")
        );
      }

      setSuccess(
        t("portal.business.success.saved")
      );

      await loadBusiness();
    } catch (saveError) {
      console.error(
        "[CLIENT_PORTAL][BUSINESS_SAVE_FAILED]",
        saveError
      );

      setError(
        saveError instanceof Error
          ? saveError.message
          : t("portal.business.errors.save")
      );
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadBusiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-purple-500" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-purple-300">
          {t("portal.navigation.business")}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {t("portal.business.title")}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
          {t("portal.business.description")}
        </p>
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

      {!business.canEdit ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
          {t("portal.business.readOnly")}
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
            <FiBriefcase size={21} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {t(
                "portal.business.sections.information"
              )}
            </h2>

            <p className="mt-1 text-sm text-white/45">
              {t(
                "portal.business.sections.informationDescription"
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
          <div>
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-black/20">
              {business.logoUrl ? (
                <img
                  src={business.logoUrl}
                  alt={business.businessName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-5xl font-bold text-purple-300">
                  {business.businessName
                    .charAt(0)
                    .toUpperCase() || "A"}
                </span>
              )}
            </div>

            <label
              className={[
                "mt-3 inline-flex w-40 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition",
                business.canEdit
                  ? "cursor-pointer border-white/10 bg-white/5 hover:bg-white/10"
                  : "cursor-not-allowed border-white/5 bg-white/[0.025] text-white/30",
              ].join(" ")}
            >
              <FiUpload />

              {uploadingLogo
                ? t(
                    "portal.business.logo.uploading"
                  )
                : t("portal.business.logo.change")}

              <input
                type="file"
                accept="image/*"
                disabled={
                  !business.canEdit ||
                  uploadingLogo
                }
                onChange={(event) => {
                  void uploadLogo(
                    event.target.files?.[0]
                  );

                  event.currentTarget.value = "";
                }}
                className="hidden"
              />
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold text-white/65">
                {t(
                  "portal.business.fields.businessName"
                )}
              </label>

              <input
                type="text"
                value={business.businessName}
                readOnly
                disabled
                className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-white/50"
              />

              <p className="mt-2 text-xs text-white/35">
                {t(
                  "portal.business.fields.businessNameHelp"
                )}
              </p>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/65">
                <FiMapPin />
                {t("portal.business.fields.address")}
              </label>

              <input
                type="text"
                value={business.address}
                disabled={!business.canEdit}
                onChange={(event) =>
                  updateBusiness({
                    address: event.target.value,
                  })
                }
                placeholder={t(
                  "portal.business.placeholders.address"
                )}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-45"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/65">
                <FiMail />
                {t(
                  "portal.business.fields.businessEmail"
                )}
              </label>

              <input
                type="email"
                value={business.businessEmail}
                disabled={!business.canEdit}
                onChange={(event) =>
                  updateBusiness({
                    businessEmail:
                      event.target.value,
                  })
                }
                placeholder={t(
                  "portal.business.placeholders.businessEmail"
                )}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-45"
              />
            </div>

            <div>
              <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/65">
                <FiPhone />
                {t(
                  "portal.business.fields.businessPhone"
                )}
              </label>

              <input
                type="tel"
                value={business.businessPhone}
                disabled={!business.canEdit}
                onChange={(event) =>
                  updateBusiness({
                    businessPhone:
                      event.target.value,
                  })
                }
                placeholder={t(
                  "portal.business.placeholders.businessPhone"
                )}
                className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-45"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
            <FiClock size={21} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {t(
                "portal.business.sections.hours"
              )}
            </h2>

            <p className="mt-1 text-sm text-white/45">
              {t(
                "portal.business.sections.hoursDescription"
              )}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {DAY_KEYS.map((dayKey) => {
            const dayHours = hours[dayKey];
            const isOpen = dayHours !== null;

            return (
              <div
                key={dayKey}
                className="grid gap-3 rounded-xl border border-white/10 bg-black/15 p-4 sm:grid-cols-[130px_150px_minmax(0,1fr)] sm:items-center"
              >
                <p className="font-semibold">
                  {dayLabels[dayKey]}
                </p>

                <label className="flex items-center gap-2 text-sm text-white/65">
                  <input
                    type="checkbox"
                    checked={isOpen}
                    disabled={!business.canEdit}
                    onChange={(event) => {
                      if (event.target.checked) {
                        updateDay(dayKey, {
                          start: "09:00",
                          end: "17:00",
                        });
                      } else {
                        updateDay(dayKey, null);
                      }
                    }}
                    className="h-4 w-4 accent-purple-600"
                  />

                  {isOpen
                    ? t(
                        "portal.business.hours.open"
                      )
                    : t(
                        "portal.business.hours.closed"
                      )}
                </label>

                <div className="flex flex-wrap items-center gap-3">
                  <input
                    type="time"
                    value={
                      dayHours?.start || "09:00"
                    }
                    disabled={
                      !isOpen || !business.canEdit
                    }
                    onChange={(event) =>
                      updateDay(dayKey, {
                        start: event.target.value,
                      })
                    }
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-35"
                  />

                  <span className="text-white/35">
                    —
                  </span>

                  <input
                    type="time"
                    value={dayHours?.end || "17:00"}
                    disabled={
                      !isOpen || !business.canEdit
                    }
                    onChange={(event) =>
                      updateDay(dayKey, {
                        end: event.target.value,
                      })
                    }
                    className="rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-white outline-none focus:border-purple-500 disabled:cursor-not-allowed disabled:opacity-35"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
            <FiCalendar size={21} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {t(
                "portal.business.sections.account"
              )}
            </h2>

            <p className="mt-1 text-sm text-white/45">
              {t(
                "portal.business.sections.accountDescription"
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 text-sm font-semibold text-white/65">
              <FiPhone />
              {t(
                "portal.business.fields.assignedPhone"
              )}
            </label>

            <input
              type="text"
              value={
                business.assignedPhoneNumber ||
                t("profile.values.notAssigned")
              }
              readOnly
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-white/50"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/65">
              {t(
                "portal.business.fields.registeredAt"
              )}
            </label>

            <input
              type="text"
              value={formatDate(
                business.registeredAt
              )}
              readOnly
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-white/10 bg-white/[0.025] px-4 py-3 text-white/50"
            />
          </div>

          <div className="md:col-span-2">
            <p className="mb-2 text-sm font-semibold text-white/65">
              {t(
                "portal.business.fields.membershipStatus"
              )}
            </p>

            <div className="rounded-xl border border-white/10 bg-black/15 p-4">
              {business.membershipActive ? (
                <p className="font-semibold text-emerald-300">
                  {business.membershipExpiresAt
                    ? t(
                        "portal.business.membership.activeUntil",
                        {
                          date: formatDate(
                            business.membershipExpiresAt
                          ),
                        }
                      )
                    : t(
                        "portal.business.membership.active"
                      )}
                </p>
              ) : business.trialActive ? (
                <p className="font-semibold text-amber-300">
                  {business.membershipExpiresAt
                    ? t(
                        "portal.business.membership.trialUntil",
                        {
                          date: formatDate(
                            business.membershipExpiresAt
                          ),
                        }
                      )
                    : t(
                        "portal.business.membership.trial"
                      )}
                </p>
              ) : (
                <p className="font-semibold text-red-300">
                  {t(
                    "portal.business.membership.inactive"
                  )}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => void saveBusiness()}
          disabled={
            saving ||
            uploadingLogo ||
            !business.canEdit
          }
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-45"
        >
          <FiSave />

          {saving
            ? t(
                "portal.business.actions.saving"
              )
            : t("portal.business.actions.save")}
        </button>
      </div>
    </div>
  );
}