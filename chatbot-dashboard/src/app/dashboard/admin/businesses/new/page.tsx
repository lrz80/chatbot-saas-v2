// src/app/dashboard/admin/businesses/new/page.tsx

"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiCopy,
  FiEye,
  FiEyeOff,
  FiLoader,
  FiPlusCircle,
} from "react-icons/fi";

import { BACKEND_URL } from "@/utils/api";
import { useI18n } from "@/i18n/LanguageProvider";

type VerificationLanguage =
  | "en"
  | "es"
  | "pt";

type BusinessFormState = {
  business_name: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  timezone: string;
  verification_language: VerificationLanguage;
  sms_opt_in: boolean;
};

type CreatedBusinessResponse = {
  success: boolean;
  tenant: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  owner: {
    uid: string;
    tenant_id: string;
    name: string;
    email: string;
    telefono: string;
    role: "business_owner";
    verified: boolean;
  };
  verification_email_sent: boolean;
};

const initialForm: BusinessFormState = {
  business_name: "",
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  password: "",
  timezone: "America/New_York",
  verification_language: "en",
  sms_opt_in: false,
};

const timezoneOptions = [
  {
    value: "America/New_York",
    label: "Eastern Time",
  },
  {
    value: "America/Chicago",
    label: "Central Time",
  },
  {
    value: "America/Denver",
    label: "Mountain Time",
  },
  {
    value: "America/Los_Angeles",
    label: "Pacific Time",
  },
  {
    value: "America/Puerto_Rico",
    label: "Puerto Rico",
  },
  {
    value: "Europe/Madrid",
    label: "Madrid",
  },
  {
    value: "America/Sao_Paulo",
    label: "São Paulo",
  },
];

function generateTemporaryPassword(): string {
  const lowercase = "abcdefghijkmnopqrstuvwxyz";
  const uppercase = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const numbers = "23456789";
  const symbols = "!@#$%&*";

  const allCharacters =
    lowercase +
    uppercase +
    numbers +
    symbols;

  const requiredCharacters = [
    lowercase[
      Math.floor(Math.random() * lowercase.length)
    ],
    uppercase[
      Math.floor(Math.random() * uppercase.length)
    ],
    numbers[
      Math.floor(Math.random() * numbers.length)
    ],
    symbols[
      Math.floor(Math.random() * symbols.length)
    ],
  ];

  const remainingCharacters = Array.from(
    { length: 8 },
    () =>
      allCharacters[
        Math.floor(
          Math.random() * allCharacters.length
        )
      ]
  );

  return [
    ...requiredCharacters,
    ...remainingCharacters,
  ]
    .sort(() => Math.random() - 0.5)
    .join("");
}

async function readJsonResponse(
  response: Response
): Promise<any> {
  const raw = await response.text();

  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {
      error: raw,
    };
  }
}

export default function CreateBusinessPage() {
  const router = useRouter();
  const { t } = useI18n();

  const [form, setForm] =
    useState<BusinessFormState>(initialForm);

  const [checkingAccess, setCheckingAccess] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState<CreatedBusinessResponse | null>(
      null
    );

  useEffect(() => {
    let cancelled = false;

    const checkAdminAccess = async () => {
      try {
        const response = await fetch(
          `${BACKEND_URL}/api/settings`,
          {
            credentials: "include",
            cache: "no-store",
          }
        );

        if (response.status === 401) {
          router.replace("/login");
          return;
        }

        if (!response.ok) {
          router.replace("/dashboard");
          return;
        }

        const data = await readJsonResponse(
          response
        );

        if (!data?.is_admin) {
          router.replace("/dashboard");
          return;
        }
      } catch (accessError) {
        console.error(
          "[CREATE_BUSINESS][ACCESS_CHECK_FAILED]",
          accessError
        );

        router.replace("/dashboard");
      } finally {
        if (!cancelled) {
          setCheckingAccess(false);
        }
      }
    };

    void checkAdminAccess();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const updateField = <
    Key extends keyof BusinessFormState
  >(
    key: Key,
    value: BusinessFormState[Key]
  ) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleGeneratePassword = () => {
    const password =
      generateTemporaryPassword();

    updateField("password", password);
    setShowPassword(true);
  };

  const handleCopyPassword = async () => {
    if (!form.password) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        form.password
      );
    } catch (clipboardError) {
      console.error(
        "[CREATE_BUSINESS][COPY_PASSWORD_FAILED]",
        clipboardError
      );
    }
  };

  const validateForm = (): string | null => {
    if (!form.business_name.trim()) {
      return t(
        "adminBusinesses.create.validation.businessName"
      );
    }

    if (!form.nombre.trim()) {
      return t(
        "adminBusinesses.create.validation.firstName"
      );
    }

    if (!form.apellido.trim()) {
      return t(
        "adminBusinesses.create.validation.lastName"
      );
    }

    if (!form.email.trim()) {
      return t(
        "adminBusinesses.create.validation.email"
      );
    }

    if (!form.telefono.trim()) {
      return t(
        "adminBusinesses.create.validation.phone"
      );
    }

    if (form.password.length < 8) {
      return t(
        "adminBusinesses.create.validation.password"
      );
    }

    return null;
  };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setError("");
    setSuccess(null);

    const validationError =
      validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/tenants`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            business_name:
              form.business_name.trim(),
            nombre: form.nombre.trim(),
            apellido:
              form.apellido.trim(),
            email: form.email
              .trim()
              .toLowerCase(),
            telefono:
              form.telefono.trim(),
            password: form.password,
            timezone: form.timezone,
            verification_language:
              form.verification_language,
            sms_opt_in:
              form.sms_opt_in,
          }),
        }
      );

      const data =
        await readJsonResponse(response);

      if (response.status === 401) {
        router.replace("/login");
        return;
      }

      if (response.status === 403) {
        router.replace("/dashboard");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            t(
              "adminBusinesses.create.errors.generic"
            )
        );
      }

      setSuccess(
        data as CreatedBusinessResponse
      );

      setForm(initialForm);
      setShowPassword(false);
    } catch (submitError) {
      console.error(
        "[CREATE_BUSINESS][SUBMIT_FAILED]",
        submitError
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : t(
              "adminBusinesses.create.errors.generic"
            )
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (checkingAccess) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <FiLoader className="animate-spin text-3xl text-purple-300" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            className="mb-3 flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
          >
            <FiArrowLeft />
            {t(
              "adminBusinesses.create.back"
            )}
          </button>

          <h1 className="flex items-center gap-3 text-2xl font-bold text-purple-200 md:text-3xl">
            <FiPlusCircle />
            {t(
              "adminBusinesses.create.title"
            )}
          </h1>

          <p className="mt-2 text-sm text-white/60">
            {t(
              "adminBusinesses.create.description"
            )}
          </p>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-xl border border-green-400/30 bg-green-500/10 p-5">
          <div className="flex items-start gap-3">
            <FiCheckCircle className="mt-0.5 shrink-0 text-2xl text-green-300" />

            <div>
              <h2 className="font-semibold text-green-200">
                {t(
                  "adminBusinesses.create.success.title"
                )}
              </h2>

              <p className="mt-1 text-sm text-white/80">
                {t(
                  "adminBusinesses.create.success.business"
                )}
                :{" "}
                <strong>
                  {success.tenant.name}
                </strong>
              </p>

              <p className="mt-1 text-sm text-white/80">
                {t(
                  "adminBusinesses.create.success.owner"
                )}
                :{" "}
                <strong>
                  {success.owner.name}
                </strong>
              </p>

              <p className="mt-1 text-sm text-white/80">
                {t(
                  "adminBusinesses.create.success.email"
                )}
                :{" "}
                <strong>
                  {success.owner.email}
                </strong>
              </p>

              <p className="mt-2 text-sm text-white/70">
                {success.verification_email_sent
                  ? t(
                      "adminBusinesses.create.success.verificationSent"
                    )
                  : t(
                      "adminBusinesses.create.success.verificationFailed"
                    )}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 shadow-xl backdrop-blur md:p-7"
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <label
              htmlFor="business_name"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              {t(
                "adminBusinesses.create.fields.businessName"
              )}
            </label>

            <input
              id="business_name"
              name="business_name"
              type="text"
              value={form.business_name}
              onChange={(event) =>
                updateField(
                  "business_name",
                  event.target.value
                )
              }
              autoComplete="organization"
              required
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-purple-400"
            />
          </div>

          <div>
            <label
              htmlFor="nombre"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              {t(
                "adminBusinesses.create.fields.firstName"
              )}
            </label>

            <input
              id="nombre"
              name="nombre"
              type="text"
              value={form.nombre}
              onChange={(event) =>
                updateField(
                  "nombre",
                  event.target.value
                )
              }
              autoComplete="given-name"
              required
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-purple-400"
            />
          </div>

          <div>
            <label
              htmlFor="apellido"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              {t(
                "adminBusinesses.create.fields.lastName"
              )}
            </label>

            <input
              id="apellido"
              name="apellido"
              type="text"
              value={form.apellido}
              onChange={(event) =>
                updateField(
                  "apellido",
                  event.target.value
                )
              }
              autoComplete="family-name"
              required
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-purple-400"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              {t(
                "adminBusinesses.create.fields.email"
              )}
            </label>

            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              autoComplete="email"
              required
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition focus:border-purple-400"
            />
          </div>

          <div>
            <label
              htmlFor="telefono"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              {t(
                "adminBusinesses.create.fields.phone"
              )}
            </label>

            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={form.telefono}
              onChange={(event) =>
                updateField(
                  "telefono",
                  event.target.value
                )
              }
              placeholder="+14075550123"
              autoComplete="tel"
              required
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-white outline-none transition placeholder:text-white/30 focus:border-purple-400"
            />
          </div>

          <div className="md:col-span-2">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-white/80"
              >
                {t(
                  "adminBusinesses.create.fields.password"
                )}
              </label>

              <button
                type="button"
                onClick={
                  handleGeneratePassword
                }
                disabled={submitting}
                className="text-xs font-medium text-purple-300 transition hover:text-purple-200 disabled:opacity-50"
              >
                {t(
                  "adminBusinesses.create.generatePassword"
                )}
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={form.password}
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-white outline-none transition focus:border-purple-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) => !current
                    )
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/50 hover:text-white"
                  aria-label={
                    showPassword
                      ? t(
                          "adminBusinesses.create.hidePassword"
                        )
                      : t(
                          "adminBusinesses.create.showPassword"
                        )
                  }
                >
                  {showPassword ? (
                    <FiEyeOff />
                  ) : (
                    <FiEye />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleCopyPassword}
                disabled={
                  submitting ||
                  !form.password
                }
                className="flex w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label={t(
                  "adminBusinesses.create.copyPassword"
                )}
              >
                <FiCopy />
              </button>
            </div>

            <p className="mt-2 text-xs text-white/40">
              {t(
                "adminBusinesses.create.passwordHelp"
              )}
            </p>
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              {t(
                "adminBusinesses.create.fields.timezone"
              )}
            </label>

            <select
              id="timezone"
              name="timezone"
              value={form.timezone}
              onChange={(event) =>
                updateField(
                  "timezone",
                  event.target.value
                )
              }
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-[#171717] px-4 py-3 text-white outline-none transition focus:border-purple-400"
            >
              {timezoneOptions.map(
                (timezone) => (
                  <option
                    key={timezone.value}
                    value={timezone.value}
                  >
                    {timezone.label}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="verification_language"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              {t(
                "adminBusinesses.create.fields.verificationLanguage"
              )}
            </label>

            <select
              id="verification_language"
              name="verification_language"
              value={
                form.verification_language
              }
              onChange={(event) =>
                updateField(
                  "verification_language",
                  event.target
                    .value as VerificationLanguage
                )
              }
              disabled={submitting}
              className="w-full rounded-xl border border-white/10 bg-[#171717] px-4 py-3 text-white outline-none transition focus:border-purple-400"
            >
              <option value="en">
                English
              </option>

              <option value="es">
                Español
              </option>

              <option value="pt">
                Português
              </option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-black/20 p-4">
              <input
                type="checkbox"
                checked={form.sms_opt_in}
                onChange={(event) =>
                  updateField(
                    "sms_opt_in",
                    event.target.checked
                  )
                }
                disabled={submitting}
                className="mt-1 h-4 w-4 accent-purple-600"
              />

              <span>
                <span className="block text-sm font-medium text-white/80">
                  {t(
                    "adminBusinesses.create.fields.smsOptIn"
                  )}
                </span>

                <span className="mt-1 block text-xs text-white/50">
                  {t(
                    "adminBusinesses.create.smsOptInHelp"
                  )}
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-white/10 pt-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() =>
              router.push("/dashboard")
            }
            disabled={submitting}
            className="rounded-xl border border-white/10 px-5 py-3 font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
          >
            {t(
              "adminBusinesses.create.cancel"
            )}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" />
                {t(
                  "adminBusinesses.create.creating"
                )}
              </>
            ) : (
              <>
                <FiPlusCircle />
                {t(
                  "adminBusinesses.create.submit"
                )}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}