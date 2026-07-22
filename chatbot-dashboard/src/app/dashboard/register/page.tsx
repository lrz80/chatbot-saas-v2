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

function randomCharacter(
  characters: string
): string {
  const values = new Uint32Array(1);

  crypto.getRandomValues(values);

  return characters[
    values[0] % characters.length
  ];
}

function shuffleCharacters(
  characters: string[]
): string[] {
  const result = [...characters];

  for (
    let index = result.length - 1;
    index > 0;
    index -= 1
  ) {
    const values = new Uint32Array(1);

    crypto.getRandomValues(values);

    const randomIndex =
      values[0] % (index + 1);

    [
      result[index],
      result[randomIndex],
    ] = [
      result[randomIndex],
      result[index],
    ];
  }

  return result;
}

function generateTemporaryPassword(): string {
  const lowercase =
    "abcdefghijkmnopqrstuvwxyz";

  const uppercase =
    "ABCDEFGHJKLMNPQRSTUVWXYZ";

  const numbers = "23456789";

  const symbols = "!@#$%&*";

  const allCharacters =
    lowercase +
    uppercase +
    numbers +
    symbols;

  const passwordCharacters = [
    randomCharacter(lowercase),
    randomCharacter(uppercase),
    randomCharacter(numbers),
    randomCharacter(symbols),
  ];

  while (
    passwordCharacters.length < 12
  ) {
    passwordCharacters.push(
      randomCharacter(allCharacters)
    );
  }

  return shuffleCharacters(
    passwordCharacters
  ).join("");
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

export default function AdminRegisterTenantPage() {
  const router = useRouter();

  const [form, setForm] =
    useState<BusinessFormState>(
      initialForm
    );

  const [
    checkingAccess,
    setCheckingAccess,
  ] = useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState<CreatedBusinessResponse | null>(
      null
    );

  const [passwordCopied, setPasswordCopied] =
    useState(false);

  useEffect(() => {
    let cancelled = false;

    const checkAdminAccess =
      async () => {
        try {
          const response = await fetch(
            `${BACKEND_URL}/api/settings`,
            {
              method: "GET",
              credentials: "include",
              cache: "no-store",
            }
          );

          if (
            response.status === 401
          ) {
            router.replace("/login");
            return;
          }

          if (!response.ok) {
            router.replace(
              "/dashboard"
            );
            return;
          }

          const data =
            await readJsonResponse(
              response
            );

          if (!data?.is_admin) {
            router.replace(
              "/dashboard"
            );
            return;
          }
        } catch (accessError) {
          console.error(
            "[CREATE_BUSINESS][ACCESS_CHECK_FAILED]",
            accessError
          );

          router.replace(
            "/dashboard"
          );
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

  const handleGeneratePassword =
    () => {
      const password =
        generateTemporaryPassword();

      updateField(
        "password",
        password
      );

      setShowPassword(true);
      setPasswordCopied(false);
    };

  const handleCopyPassword =
    async () => {
      if (!form.password) {
        return;
      }

      try {
        await navigator.clipboard.writeText(
          form.password
        );

        setPasswordCopied(true);

        window.setTimeout(() => {
          setPasswordCopied(false);
        }, 2000);
      } catch (clipboardError) {
        console.error(
          "[CREATE_BUSINESS][COPY_PASSWORD_FAILED]",
          clipboardError
        );

        setError(
          "No se pudo copiar la contraseña"
        );
      }
    };

  const validateForm =
    (): string | null => {
      if (
        !form.business_name.trim()
      ) {
        return "El nombre del negocio es requerido";
      }

      if (!form.nombre.trim()) {
        return "El nombre del propietario es requerido";
      }

      if (!form.apellido.trim()) {
        return "El apellido del propietario es requerido";
      }

      if (!form.email.trim()) {
        return "El correo electrónico es requerido";
      }

      if (!form.telefono.trim()) {
        return "El teléfono es requerido";
      }

      if (
        form.password.length < 8
      ) {
        return "La contraseña debe tener al menos 8 caracteres";
      }

      return null;
    };

  const selectCreatedTenant =
    async (tenantId: string) => {
      const response = await fetch(
        `${BACKEND_URL}/api/admin/tenants/select`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            tenant_id: tenantId,
          }),
        }
      );

      const data =
        await readJsonResponse(
          response
        );

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "El negocio fue creado, pero no se pudo seleccionar"
        );
      }
    };

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

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

            nombre:
              form.nombre.trim(),

            apellido:
              form.apellido.trim(),

            email:
              form.email
                .trim()
                .toLowerCase(),

            telefono:
              form.telefono.trim(),

            password:
              form.password,

            timezone:
              form.timezone,

            verification_language:
              form.verification_language,

            sms_opt_in:
              form.sms_opt_in,
          }),
        }
      );

      const data =
        await readJsonResponse(
          response
        );

      if (
        response.status === 401
      ) {
        router.replace("/login");
        return;
      }

      if (
        response.status === 403
      ) {
        router.replace(
          "/dashboard"
        );
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo crear el negocio"
        );
      }

      const createdBusiness =
        data as CreatedBusinessResponse;

      if (
        !createdBusiness.tenant?.id
      ) {
        throw new Error(
          "El servidor no devolvió el ID del negocio"
        );
      }

      setSuccess(
        createdBusiness
      );

      await selectCreatedTenant(
        createdBusiness.tenant.id
      );

      window.setTimeout(() => {
        window.location.href =
          "/dashboard";
      }, 1800);
    } catch (submitError) {
      console.error(
        "[CREATE_BUSINESS][SUBMIT_FAILED]",
        submitError
      );

      setError(
        submitError instanceof Error
          ? submitError.message
          : "No se pudo crear el negocio"
      );

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

  if (success) {
    return (
      <div className="flex min-h-[65vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-2xl border border-green-400/30 bg-green-500/10 p-8 text-center shadow-xl">
          <FiCheckCircle className="mx-auto mb-4 text-6xl text-green-300" />

          <h1 className="text-2xl font-bold text-green-200">
            Negocio creado correctamente
          </h1>

          <p className="mt-4 text-white/80">
            <strong>
              {success.tenant.name}
            </strong>{" "}
            fue creado y seleccionado.
          </p>

          <p className="mt-2 text-sm text-white/70">
            Propietario:{" "}
            <strong>
              {success.owner.name}
            </strong>
          </p>

          <p className="mt-1 text-sm text-white/70">
            Correo:{" "}
            <strong>
              {success.owner.email}
            </strong>
          </p>

          <p className="mt-3 text-sm text-white/60">
            {success
              .verification_email_sent
              ? "El correo de verificación fue enviado al propietario."
              : "El negocio fue creado, pero el correo de verificación no pudo enviarse."}
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-purple-300">
            <FiLoader className="animate-spin" />
            Abriendo el negocio...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="mb-6">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard")
          }
          className="mb-3 flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <FiArrowLeft />
          Volver al dashboard
        </button>

        <h1 className="flex items-center gap-3 text-2xl font-bold text-purple-200 md:text-3xl">
          <FiPlusCircle />
          Crear nuevo negocio
        </h1>

        <p className="mt-2 text-sm text-white/60">
          Crea el tenant y la cuenta
          propietaria del negocio.
        </p>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
        >
          {error}
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
              Nombre del negocio
            </label>

            <input
              id="business_name"
              type="text"
              value={
                form.business_name
              }
              onChange={(event) =>
                updateField(
                  "business_name",
                  event.target.value
                )
              }
              placeholder="Ej. The Perfect Cleaning Company"
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
              Nombre del propietario
            </label>

            <input
              id="nombre"
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
              Apellido
            </label>

            <input
              id="apellido"
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
              Correo electrónico
            </label>

            <input
              id="email"
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
              Teléfono
            </label>

            <input
              id="telefono"
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
                Contraseña temporal
              </label>

              <button
                type="button"
                onClick={
                  handleGeneratePassword
                }
                disabled={submitting}
                className="text-xs font-medium text-purple-300 transition hover:text-purple-200 disabled:opacity-50"
              >
                Generar contraseña
              </button>
            </div>

            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  id="password"
                  type={
                    showPassword
                      ? "text"
                      : "password"
                  }
                  value={form.password}
                  onChange={(event) => {
                    updateField(
                      "password",
                      event.target.value
                    );

                    setPasswordCopied(
                      false
                    );
                  }}
                  placeholder="Genera o escribe una contraseña"
                  autoComplete="new-password"
                  minLength={8}
                  required
                  disabled={submitting}
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 pr-12 text-white outline-none transition placeholder:text-white/30 focus:border-purple-400"
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (current) =>
                        !current
                    )
                  }
                  className="absolute inset-y-0 right-0 flex w-12 items-center justify-center text-white/50 hover:text-white"
                  aria-label={
                    showPassword
                      ? "Ocultar contraseña"
                      : "Mostrar contraseña"
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
                onClick={
                  handleCopyPassword
                }
                disabled={
                  submitting ||
                  !form.password
                }
                className="flex w-12 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Copiar contraseña"
              >
                {passwordCopied ? (
                  <FiCheckCircle className="text-green-300" />
                ) : (
                  <FiCopy />
                )}
              </button>
            </div>

            <p className="mt-2 text-xs text-white/40">
              La contraseña generada tendrá
              12 caracteres, mayúsculas,
              minúsculas, números y símbolos.
            </p>

            {passwordCopied ? (
              <p className="mt-1 text-xs text-green-300">
                Contraseña copiada.
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="timezone"
              className="mb-2 block text-sm font-medium text-white/80"
            >
              Zona horaria
            </label>

            <select
              id="timezone"
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
              Idioma del correo de
              verificación
            </label>

            <select
              id="verification_language"
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
                checked={
                  form.sms_opt_in
                }
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
                  Autoriza mensajes SMS
                </span>

                <span className="mt-1 block text-xs text-white/50">
                  Marca esta opción únicamente
                  cuando el propietario haya
                  autorizado recibir mensajes
                  relacionados con su cuenta y
                  servicio.
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
            Cancelar
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? (
              <>
                <FiLoader className="animate-spin" />
                Creando negocio...
              </>
            ) : (
              <>
                <FiPlusCircle />
                Crear negocio
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}