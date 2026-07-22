"use client";

import {
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  FiArrowLeft,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import { BACKEND_URL } from "@/utils/api";

type VerificationLanguage =
  | "en"
  | "es"
  | "pt";

type RegisterFormData = {
  businessName: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  password: string;
  confirmPassword: string;
  timezone: string;
  verificationLanguage: VerificationLanguage;
  smsOptIn: boolean;
};

type CreateTenantResponse = {
  success?: boolean;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    timezone: string;
  };
  owner?: {
    uid: string;
    tenant_id: string;
    name: string;
    email: string;
    telefono: string;
    role: string;
    verified: boolean;
  };
  verification_email_sent?: boolean;
  error?: string;
};

const inputClassName =
  "w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none transition placeholder:text-white/40 focus:border-purple-400/70 focus:bg-white/10";

export default function AdminRegisterTenantPage() {
  const router = useRouter();

  const timezoneGuess = useMemo(() => {
    try {
      return (
        Intl.DateTimeFormat()
          .resolvedOptions()
          .timeZone ||
        "America/New_York"
      );
    } catch {
      return "America/New_York";
    }
  }, []);

  const [formData, setFormData] =
    useState<RegisterFormData>({
      businessName: "",
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      password: "",
      confirmPassword: "",
      timezone: timezoneGuess,
      verificationLanguage: "en",
      smsOptIn: false,
    });

  const [error, setError] =
    useState("");

  const [submitting, setSubmitting] =
    useState(false);

  const [createdTenantName, setCreatedTenantName] =
    useState("");

  const [
    verificationEmailSent,
    setVerificationEmailSent,
  ] = useState(false);

  const updateField = <
    K extends keyof RegisterFormData
  >(
    field: K,
    value: RegisterFormData[K]
  ) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const selectCreatedTenant = async (
    tenantId: string
  ) => {
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

    if (!response.ok) {
      const data = await response
        .json()
        .catch(() => null);

      throw new Error(
        data?.error ||
          "El negocio se creó, pero no se pudo seleccionar"
      );
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    setError("");
    setCreatedTenantName("");

    if (
      formData.password !==
      formData.confirmPassword
    ) {
      setError(
        "Las contraseñas no coinciden"
      );
      return;
    }

    if (formData.password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres"
      );
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
              formData.businessName,
            nombre: formData.nombre,
            apellido: formData.apellido,
            email: formData.email,
            telefono: formData.telefono,
            password: formData.password,
            timezone: formData.timezone,
            verification_language:
              formData.verificationLanguage,
            sms_opt_in:
              formData.smsOptIn,
          }),
        }
      );

      const data =
        (await response
          .json()
          .catch(() => null)) as
          | CreateTenantResponse
          | null;

      if (!response.ok) {
        throw new Error(
          data?.error ||
            `No se pudo crear el negocio (${response.status})`
        );
      }

      const tenantId =
        data?.tenant?.id;

      if (!tenantId) {
        throw new Error(
          "El servidor no devolvió el ID del negocio"
        );
      }

      setCreatedTenantName(
        data.tenant?.name ||
          formData.businessName
      );

      setVerificationEmailSent(
        data.verification_email_sent ===
          true
      );

      await selectCreatedTenant(
        tenantId
      );

      window.setTimeout(() => {
        window.location.href =
          "/dashboard";
      }, 1200);
    } catch (submitError: unknown) {
      console.error(
        "❌ Error creando negocio:",
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

  if (createdTenantName) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg rounded-2xl border border-green-400/25 bg-[#16071f] p-8 text-center shadow-2xl">
          <FiCheckCircle className="mx-auto mb-4 text-6xl text-green-400" />

          <h1 className="text-2xl font-bold text-white">
            Negocio creado correctamente
          </h1>

          <p className="mt-3 text-white/70">
            {createdTenantName} fue creado y
            seleccionado.
          </p>

          <p className="mt-2 text-sm text-white/50">
            {verificationEmailSent
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
    <div className="min-h-full px-4 py-8 md:px-8">
      <div className="mx-auto max-w-3xl">
        <button
          type="button"
          onClick={() =>
            router.push("/dashboard")
          }
          className="mb-5 inline-flex items-center gap-2 text-sm text-white/60 transition hover:text-white"
        >
          <FiArrowLeft />
          Volver al dashboard
        </button>

        <div className="rounded-2xl border border-purple-400/20 bg-[#16071f] p-6 shadow-2xl md:p-8">
          <div className="mb-7">
            <h1 className="text-3xl font-bold text-purple-300">
              Crear nuevo negocio
            </h1>

            <p className="mt-2 text-sm text-white/60">
              Crea el tenant y la cuenta
              propietaria del negocio.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-white/80">
                Nombre del negocio
              </label>

              <input
                type="text"
                value={
                  formData.businessName
                }
                onChange={(event) =>
                  updateField(
                    "businessName",
                    event.target.value
                  )
                }
                placeholder="Ej. The Perfect Cleaning Company"
                required
                disabled={submitting}
                className={inputClassName}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Nombre del propietario
                </label>

                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(event) =>
                    updateField(
                      "nombre",
                      event.target.value
                    )
                  }
                  placeholder="Nombre"
                  required
                  disabled={submitting}
                  className={
                    inputClassName
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Apellido
                </label>

                <input
                  type="text"
                  value={
                    formData.apellido
                  }
                  onChange={(event) =>
                    updateField(
                      "apellido",
                      event.target.value
                    )
                  }
                  placeholder="Apellido"
                  required
                  disabled={submitting}
                  className={
                    inputClassName
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Correo electrónico
                </label>

                <input
                  type="email"
                  value={formData.email}
                  onChange={(event) =>
                    updateField(
                      "email",
                      event.target.value
                    )
                  }
                  placeholder="cliente@negocio.com"
                  required
                  disabled={submitting}
                  autoComplete="off"
                  className={
                    inputClassName
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Teléfono
                </label>

                <input
                  type="tel"
                  value={
                    formData.telefono
                  }
                  onChange={(event) =>
                    updateField(
                      "telefono",
                      event.target.value
                    )
                  }
                  placeholder="+1 305 555 0000"
                  required
                  disabled={submitting}
                  className={
                    inputClassName
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Contraseña
                </label>

                <input
                  type="password"
                  value={
                    formData.password
                  }
                  onChange={(event) =>
                    updateField(
                      "password",
                      event.target.value
                    )
                  }
                  placeholder="Mínimo 8 caracteres"
                  required
                  minLength={8}
                  disabled={submitting}
                  autoComplete="new-password"
                  className={
                    inputClassName
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Confirmar contraseña
                </label>

                <input
                  type="password"
                  value={
                    formData.confirmPassword
                  }
                  onChange={(event) =>
                    updateField(
                      "confirmPassword",
                      event.target.value
                    )
                  }
                  placeholder="Repite la contraseña"
                  required
                  minLength={8}
                  disabled={submitting}
                  autoComplete="new-password"
                  className={
                    inputClassName
                  }
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Zona horaria
                </label>

                <input
                  type="text"
                  value={
                    formData.timezone
                  }
                  onChange={(event) =>
                    updateField(
                      "timezone",
                      event.target.value
                    )
                  }
                  placeholder="America/New_York"
                  required
                  disabled={submitting}
                  className={
                    inputClassName
                  }
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-white/80">
                  Idioma del correo de
                  verificación
                </label>

                <select
                  value={
                    formData.verificationLanguage
                  }
                  onChange={(event) =>
                    updateField(
                      "verificationLanguage",
                      event.target
                        .value as VerificationLanguage
                    )
                  }
                  disabled={submitting}
                  className={inputClassName}
                >
                  <option
                    value="en"
                    className="bg-[#1D0A2B]"
                  >
                    Inglés
                  </option>

                  <option
                    value="es"
                    className="bg-[#1D0A2B]"
                  >
                    Español
                  </option>

                  <option
                    value="pt"
                    className="bg-[#1D0A2B]"
                  >
                    Portugués
                  </option>
                </select>
              </div>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
              <input
                type="checkbox"
                checked={
                  formData.smsOptIn
                }
                onChange={(event) =>
                  updateField(
                    "smsOptIn",
                    event.target.checked
                  )
                }
                disabled={submitting}
                className="mt-1 h-4 w-4 accent-purple-600"
              />

              <span>
                <span className="block text-sm font-medium text-white">
                  Autoriza mensajes SMS
                </span>

                <span className="mt-1 block text-xs leading-5 text-white/50">
                  Marca esta opción únicamente
                  cuando el propietario haya
                  autorizado recibir mensajes
                  relacionados con su cuenta y
                  servicio.
                </span>
              </span>
            </label>

            <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/dashboard"
                  )
                }
                disabled={submitting}
                className="rounded-xl border border-white/15 px-5 py-3 font-medium text-white/70 transition hover:bg-white/5 hover:text-white disabled:opacity-50"
              >
                Cancelar
              </button>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-wait disabled:opacity-60"
              >
                {submitting && (
                  <FiLoader className="animate-spin" />
                )}

                {submitting
                  ? "Creando negocio..."
                  : "Crear negocio"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}