//src/app/portal/support/page.tsx
"use client";

import { useMemo, useState } from "react";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClipboard,
  FiClock,
  FiCreditCard,
  FiHelpCircle,
  FiMail,
  FiMessageCircle,
  FiPhone,
  FiSend,
  FiSettings,
  FiShield,
  FiTool,
} from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

import { useI18n } from "@/i18n/LanguageProvider";

type SupportReason =
  | "technical"
  | "billing"
  | "plan_change"
  | "cancellation"
  | "channels"
  | "other";

type SupportReasonOption = {
  value: SupportReason;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const SUPPORT_EMAIL =
  process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
  "support@aamy.ai";

const SUPPORT_WHATSAPP =
  process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ||
  "";

function normalizeWhatsAppNumber(value: string): string {
  return value.replace(/[^\d]/g, "");
}

export default function PortalSupportPage() {
  const { t, lang } = useI18n();

  const [reason, setReason] =
    useState<SupportReason>("technical");

  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const reasonOptions = useMemo<
    SupportReasonOption[]
  >(
    () => [
      {
        value: "technical",
        label: t(
          "portal.support.reasons.technical.title"
        ),
        description: t(
          "portal.support.reasons.technical.description"
        ),
        icon: <FiTool />,
      },
      {
        value: "billing",
        label: t(
          "portal.support.reasons.billing.title"
        ),
        description: t(
          "portal.support.reasons.billing.description"
        ),
        icon: <FiCreditCard />,
      },
      {
        value: "plan_change",
        label: t(
          "portal.support.reasons.planChange.title"
        ),
        description: t(
          "portal.support.reasons.planChange.description"
        ),
        icon: <FiSettings />,
      },
      {
        value: "cancellation",
        label: t(
          "portal.support.reasons.cancellation.title"
        ),
        description: t(
          "portal.support.reasons.cancellation.description"
        ),
        icon: <FiAlertTriangle />,
      },
      {
        value: "channels",
        label: t(
          "portal.support.reasons.channels.title"
        ),
        description: t(
          "portal.support.reasons.channels.description"
        ),
        icon: <FiMessageCircle />,
      },
      {
        value: "other",
        label: t(
          "portal.support.reasons.other.title"
        ),
        description: t(
          "portal.support.reasons.other.description"
        ),
        icon: <FiHelpCircle />,
      },
    ],
    [t]
  );

  const selectedReason = useMemo(() => {
    return (
      reasonOptions.find(
        (option) => option.value === reason
      ) || reasonOptions[0]
    );
  }, [reason, reasonOptions]);

  function buildSupportMessage(): string {
    const reasonLabel =
      selectedReason?.label ||
      t("portal.support.reasons.other.title");

    const cleanSubject = subject.trim();
    const cleanMessage = message.trim();

    const lines = [
      t("portal.support.message.greeting"),
      "",
      `${t(
        "portal.support.message.reason"
      )}: ${reasonLabel}`,
      cleanSubject
        ? `${t(
            "portal.support.message.subject"
          )}: ${cleanSubject}`
        : "",
      "",
      cleanMessage ||
        t(
          "portal.support.message.noDescription"
        ),
      "",
      t("portal.support.message.footer"),
    ];

    return lines.filter(
      (line, index, array) => {
        if (line !== "") {
          return true;
        }

        return (
          index === 0 ||
          array[index - 1] !== ""
        );
      }
    ).join("\n");
  }

  function buildEmailSubject(): string {
    const reasonLabel =
      selectedReason?.label ||
      t("portal.support.reasons.other.title");

    if (subject.trim()) {
      return `[Aamy Support] ${reasonLabel} - ${subject.trim()}`;
    }

    return `[Aamy Support] ${reasonLabel}`;
  }

  function validateForm(): boolean {
    setError("");

    if (!message.trim()) {
      setError(
        t(
          "portal.support.errors.descriptionRequired"
        )
      );

      return false;
    }

    return true;
  }

  function openEmail() {
    if (!validateForm()) {
      return;
    }

    const emailSubject = encodeURIComponent(
      buildEmailSubject()
    );

    const emailBody = encodeURIComponent(
      buildSupportMessage()
    );

    window.location.href =
      `mailto:${SUPPORT_EMAIL}` +
      `?subject=${emailSubject}` +
      `&body=${emailBody}`;
  }

  function openWhatsApp() {
    if (!validateForm()) {
      return;
    }

    const phone = normalizeWhatsAppNumber(
      SUPPORT_WHATSAPP
    );

    if (!phone) {
      setError(
        t(
          "portal.support.errors.whatsappUnavailable"
        )
      );

      return;
    }

    const text = encodeURIComponent(
      buildSupportMessage()
    );

    window.open(
      `https://wa.me/${phone}?text=${text}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  async function copyMessage() {
    if (!validateForm()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        buildSupportMessage()
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2500);
    } catch (copyError) {
      console.error(
        "[PORTAL_SUPPORT][COPY_FAILED]",
        copyError
      );

      setError(
        t("portal.support.errors.copy")
      );
    }
  }

  function getSupportSchedule(): string {
    if (lang === "pt") {
      return "Segunda a sexta, das 9h às 18h";
    }

    if (lang === "en") {
      return "Monday through Friday, 9:00 AM to 6:00 PM";
    }

    return "Lunes a viernes, de 9:00 a. m. a 6:00 p. m.";
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header>
        <p className="text-sm font-semibold text-purple-300">
          {t("portal.navigation.support")}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {t("portal.support.title")}
        </h1>

        <p className="mt-2 max-w-3xl text-sm leading-6 text-white/50">
          {t("portal.support.description")}
        </p>
      </header>

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
              <FiMail size={21} />
            </div>

            <div>
              <h2 className="font-bold">
                {t(
                  "portal.support.contact.emailTitle"
                )}
              </h2>

              <p className="mt-1 text-sm text-white/45">
                {SUPPORT_EMAIL}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-500/15 p-3 text-emerald-300">
              <FaWhatsapp size={22} />
            </div>

            <div>
              <h2 className="font-bold">
                {t(
                  "portal.support.contact.whatsappTitle"
                )}
              </h2>

              <p className="mt-1 text-sm text-white/45">
                {SUPPORT_WHATSAPP ||
                  t(
                    "portal.support.contact.whatsappNotConfigured"
                  )}
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border border-white/10 bg-white/[0.045] p-5">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-amber-500/15 p-3 text-amber-300">
              <FiClock size={21} />
            </div>

            <div>
              <h2 className="font-bold">
                {t(
                  "portal.support.contact.hoursTitle"
                )}
              </h2>

              <p className="mt-1 text-sm text-white/45">
                {getSupportSchedule()}
              </p>
            </div>
          </div>
        </article>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold">
            {t(
              "portal.support.form.reasonTitle"
            )}
          </h2>

          <p className="mt-1 text-sm text-white/45">
            {t(
              "portal.support.form.reasonDescription"
            )}
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {reasonOptions.map((option) => {
            const selected =
              reason === option.value;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setReason(option.value)
                }
                className={[
                  "rounded-2xl border p-4 text-left transition",
                  selected
                    ? "border-purple-500 bg-purple-500/15"
                    : "border-white/10 bg-black/15 hover:border-white/20 hover:bg-white/[0.04]",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={[
                      "rounded-xl p-3",
                      selected
                        ? "bg-purple-500/20 text-purple-200"
                        : "bg-white/5 text-white/50",
                    ].join(" ")}
                  >
                    {option.icon}
                  </div>

                  <div>
                    <p className="font-semibold">
                      {option.label}
                    </p>

                    <p className="mt-1 text-sm leading-5 text-white/45">
                      {option.description}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {reason === "cancellation" ? (
        <section className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-5">
          <div className="flex items-start gap-3">
            <FiAlertTriangle className="mt-0.5 shrink-0 text-xl text-amber-300" />

            <div>
              <h2 className="font-bold text-amber-200">
                {t(
                  "portal.support.cancellation.noticeTitle"
                )}
              </h2>

              <p className="mt-2 text-sm leading-6 text-amber-100/75">
                {t(
                  "portal.support.cancellation.noticeDescription"
                )}
              </p>
            </div>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-white/[0.045] p-5 sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
            <FiSend size={21} />
          </div>

          <div>
            <h2 className="text-xl font-bold">
              {t(
                "portal.support.form.contactTitle"
              )}
            </h2>

            <p className="mt-1 text-sm text-white/45">
              {t(
                "portal.support.form.contactDescription"
              )}
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-white/65">
              {t(
                "portal.support.form.subject"
              )}
            </label>

            <input
              type="text"
              value={subject}
              onChange={(event) =>
                setSubject(event.target.value)
              }
              placeholder={t(
                "portal.support.form.subjectPlaceholder"
              )}
              className="w-full rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-purple-500"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-white/65">
              {t(
                "portal.support.form.description"
              )}
            </label>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              rows={7}
              placeholder={t(
                "portal.support.form.descriptionPlaceholder"
              )}
              className="w-full resize-y rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-white outline-none placeholder:text-white/25 focus:border-purple-500"
            />

            <p className="mt-2 text-xs text-white/35">
              {t(
                "portal.support.form.descriptionHelp"
              )}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              onClick={openEmail}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-purple-500"
            >
              <FiMail />
              {t(
                "portal.support.actions.email"
              )}
            </button>

            <button
              type="button"
              onClick={openWhatsApp}
              disabled={!SUPPORT_WHATSAPP}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <FaWhatsapp />
              {t(
                "portal.support.actions.whatsapp"
              )}
            </button>

            <button
              type="button"
              onClick={() =>
                void copyMessage()
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {copied ? (
                <FiCheckCircle className="text-emerald-300" />
              ) : (
                <FiClipboard />
              )}

              {copied
                ? t(
                    "portal.support.actions.copied"
                  )
                : t(
                    "portal.support.actions.copy"
                  )}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-xl bg-purple-500/15 p-3 text-purple-300">
            <FiShield size={22} />
          </div>

          <div>
            <h2 className="text-lg font-bold">
              {t(
                "portal.support.response.title"
              )}
            </h2>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-white/55">
              {t(
                "portal.support.response.description"
              )}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}