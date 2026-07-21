'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiEdit2, FiPlus, FiRefreshCw, FiTrash2, FiX } from 'react-icons/fi';

import { BACKEND_URL } from '@/utils/api';
import { useI18n } from '@/i18n/LanguageProvider';

type ResourceType =
  | 'person'
  | 'crew'
  | 'vehicle'
  | 'equipment'
  | 'other';

type FieldStaffResource = {
  id: string;
  tenantId: string;

  name: string;
  resourceType: ResourceType;

  externalProvider: string | null;
  externalReference: string | null;

  active: boolean;

  startAddress: string | null;
  startLatitude: number | null;
  startLongitude: number | null;

  endAddress: string | null;
  endLatitude: number | null;
  endLongitude: number | null;

  timezone: string | null;

  availability: Record<string, unknown>;
  capabilities: unknown[];
  metadata: Record<string, unknown>;

  createdAt: string;
  updatedAt: string;
};

type SquareTeamMember = {
  teamMemberId: string;
  displayName: string;
  bookable: boolean;
};

type StaffFormState = {
  name: string;
  resourceType: ResourceType;
  active: boolean;

  source: 'manual' | 'square';
  squareTeamMemberId: string;

  startAddress: string;
  endAddress: string;
  timezone: string;

  capabilitiesText: string;
};

type AppointmentStaffCardProps = {
  squareConnected: boolean;
  tenantId: string;
};

const EMPTY_FORM: StaffFormState = {
  name: '',
  resourceType: 'person',
  active: true,

  source: 'manual',
  squareTeamMemberId: '',

  startAddress: '',
  endAddress: '',
  timezone: 'America/New_York',

  capabilitiesText: '',
};

function clean(value: unknown): string {
  return String(value ?? '').trim();
}

function parseCapabilities(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function capabilitiesToText(value: unknown[]): string {
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return item.trim();
      }

      if (
        item &&
        typeof item === 'object' &&
        !Array.isArray(item)
      ) {
        const row = item as Record<string, unknown>;

        return clean(
          row.name ??
          row.label ??
          row.value ??
          row.id
        );
      }

      return '';
    })
    .filter(Boolean)
    .join(', ');
}

function parseSquareTeamMembers(data: unknown): SquareTeamMember[] {
  const root =
    data &&
    typeof data === 'object' &&
    !Array.isArray(data)
      ? (data as Record<string, unknown>)
      : {};

  const wrappedData =
    root.data &&
    typeof root.data === 'object' &&
    !Array.isArray(root.data)
      ? (root.data as Record<string, unknown>)
      : root;

  const profiles = Array.isArray(
    wrappedData.team_member_booking_profiles
  )
    ? wrappedData.team_member_booking_profiles
    : [];

  return profiles
    .map((item): SquareTeamMember | null => {
      const row =
        item &&
        typeof item === 'object' &&
        !Array.isArray(item)
          ? (item as Record<string, unknown>)
          : {};

      const teamMemberId = clean(row.team_member_id);
      const displayName = clean(row.display_name);
      const bookable = row.is_bookable === true;

      if (!teamMemberId || !displayName) {
        return null;
      }

      return {
        teamMemberId,
        displayName,
        bookable,
      };
    })
    .filter(
      (item): item is SquareTeamMember =>
        item !== null && item.bookable
    )
    .sort((a, b) =>
      a.displayName.localeCompare(b.displayName)
    );
}

export default function AppointmentStaffCard({
  squareConnected,
  tenantId,
}: AppointmentStaffCardProps) {
  const { t } = useI18n();

  const [resources, setResources] = useState<FieldStaffResource[]>([]);
  const [squareTeamMembers, setSquareTeamMembers] = useState<SquareTeamMember[]>([]);

  const [loading, setLoading] = useState(true);
  const [squareLoading, setSquareLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingResourceId, setEditingResourceId] =
    useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<StaffFormState>(EMPTY_FORM);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const editingResource = useMemo(
    () =>
      resources.find(
        (resource) => resource.id === editingResourceId
      ) ?? null,
    [editingResourceId, resources]
  );

  const loadResources = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `${BACKEND_URL}/api/field-operations/resources`,
        {
          credentials: 'include',
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
          t('appointments.staff.errors.load')
        );
      }

      setResources(
        Array.isArray(data.resources)
          ? data.resources
          : []
      );
    } catch (err) {
      console.error(
        '[APPOINTMENT_STAFF][LOAD_FAILED]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : t('appointments.staff.errors.load')
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  const loadSquareTeamMembers = useCallback(async () => {
    if (!squareConnected || !tenantId) {
      setSquareTeamMembers([]);
      return;
    }

    try {
      setSquareLoading(true);
      setError(null);

      const query = new URLSearchParams({
        tenantId,
      });

      const response = await fetch(
        `${BACKEND_URL}/api/integrations/square/tenant/team-members?${query.toString()}`,
        {
          credentials: 'include',
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
          t('appointments.staff.errors.squareLoad')
        );
      }

      setSquareTeamMembers(
        parseSquareTeamMembers(data)
      );
    } catch (err) {
      console.error(
        '[APPOINTMENT_STAFF][SQUARE_LOAD_FAILED]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : t('appointments.staff.errors.squareLoad')
      );
    } finally {
      setSquareLoading(false);
    }
  }, [squareConnected, tenantId, t]);

  useEffect(() => {
    void loadResources();
  }, [loadResources]);

  useEffect(() => {
    void loadSquareTeamMembers();
  }, [loadSquareTeamMembers]);

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditingResourceId(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    setError(null);
    setSuccess(null);
    setEditingResourceId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (resource: FieldStaffResource) => {
    setError(null);
    setSuccess(null);

    setEditingResourceId(resource.id);

    setForm({
      name: resource.name,
      resourceType: resource.resourceType,
      active: resource.active,

      source:
        resource.externalProvider === 'square'
          ? 'square'
          : 'manual',

      squareTeamMemberId:
        resource.externalProvider === 'square'
          ? clean(resource.externalReference)
          : '',

      startAddress: clean(resource.startAddress),
      endAddress: clean(resource.endAddress),
      timezone:
        clean(resource.timezone) ||
        'America/New_York',

      capabilitiesText:
        capabilitiesToText(resource.capabilities),
    });

    setShowForm(true);
  };

  const handleSourceChange = (
    source: StaffFormState['source']
  ) => {
    setForm((current) => ({
      ...current,
      source,
      squareTeamMemberId:
        source === 'square'
          ? current.squareTeamMemberId
          : '',
    }));
  };

  const handleSquareMemberChange = (
    teamMemberId: string
  ) => {
    const selected = squareTeamMembers.find(
      (member) =>
        member.teamMemberId === teamMemberId
    );

    setForm((current) => ({
      ...current,
      squareTeamMemberId: teamMemberId,
      name:
        selected?.displayName ||
        current.name,
      resourceType: 'person',
    }));
  };

  const saveResource = async () => {
    const name = form.name.trim();

    if (!name) {
      setError(
        t('appointments.staff.errors.nameRequired')
      );
      return;
    }

    if (
      form.source === 'square' &&
      !form.squareTeamMemberId
    ) {
      setError(
        t('appointments.staff.errors.squareStaffRequired')
      );
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const payload = {
        name,
        resourceType: form.resourceType,
        active: form.active,

        externalProvider:
          form.source === 'square'
            ? 'square'
            : null,

        externalReference:
          form.source === 'square'
            ? form.squareTeamMemberId
            : null,

        startAddress:
          form.startAddress.trim() || null,

        endAddress:
          form.endAddress.trim() || null,

        timezone:
          form.timezone.trim() || null,

        availability:
          editingResource?.availability ?? {},

        capabilities:
          parseCapabilities(
            form.capabilitiesText
          ),

        metadata: {
          ...(editingResource?.metadata ?? {}),
          staffSource: form.source,
        },
      };

      const url = editingResourceId
        ? `${BACKEND_URL}/api/field-operations/resources/${encodeURIComponent(
            editingResourceId
          )}`
        : `${BACKEND_URL}/api/field-operations/resources`;

      const response = await fetch(url, {
        method: editingResourceId
          ? 'PATCH'
          : 'POST',

        credentials: 'include',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
          t('appointments.staff.errors.save')
        );
      }

      setSuccess(
        editingResourceId
          ? t('appointments.staff.success.updated')
          : t('appointments.staff.success.created')
      );

      resetForm();
      await loadResources();
    } catch (err) {
      console.error(
        '[APPOINTMENT_STAFF][SAVE_FAILED]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : t('appointments.staff.errors.save')
      );
    } finally {
      setSaving(false);
    }
  };

  const deactivateResource = async (
    resource: FieldStaffResource
  ) => {
    const confirmed = window.confirm(
      t('appointments.staff.confirmDeactivate')
        .replace(
          '{{name}}',
          resource.name
        )
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${BACKEND_URL}/api/field-operations/resources/${encodeURIComponent(
          resource.id
        )}`,
        {
          method: 'DELETE',
          credentials: 'include',
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
          t('appointments.staff.errors.deactivate')
        );
      }

      setSuccess(
        t('appointments.staff.success.deactivated')
      );

      await loadResources();
    } catch (err) {
      console.error(
        '[APPOINTMENT_STAFF][DEACTIVATE_FAILED]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : t('appointments.staff.errors.deactivate')
      );
    } finally {
      setSaving(false);
    }
  };

  const reactivateResource = async (
    resource: FieldStaffResource
  ) => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch(
        `${BACKEND_URL}/api/field-operations/resources/${encodeURIComponent(
          resource.id
        )}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            active: true,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.ok) {
        throw new Error(
          data?.error ||
          t('appointments.staff.errors.activate')
        );
      }

      setSuccess(
        t('appointments.staff.success.activated')
      );

      await loadResources();
    } catch (err) {
      console.error(
        '[APPOINTMENT_STAFF][ACTIVATE_FAILED]',
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : t('appointments.staff.errors.activate')
      );
    } finally {
      setSaving(false);
    }
  };

  const resourceTypeLabel = (
    resourceType: ResourceType
  ): string => {
    return t(
      `appointments.staff.resourceTypes.${resourceType}`
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-white">
            {t('appointments.staff.title')}
          </div>

          <div className="mt-1 text-xs text-white/55">
            {t('appointments.staff.description')}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              void loadResources();
              void loadSquareTeamMembers();
            }}
            disabled={loading || squareLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FiRefreshCw
              className={
                loading || squareLoading
                  ? 'animate-spin'
                  : ''
              }
            />

            {t('appointments.staff.refresh')}
          </button>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500"
          >
            <FiPlus />
            {t('appointments.staff.add')}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          {success}
        </div>
      )}

      {showForm && (
        <div className="rounded-2xl border border-white/10 bg-black/20 p-4 sm:p-5">
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">
                {editingResourceId
                  ? t('appointments.staff.form.editTitle')
                  : t('appointments.staff.form.createTitle')}
              </div>

              <div className="mt-1 text-xs text-white/50">
                {t('appointments.staff.form.subtitle')}
              </div>
            </div>

            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <FiX />
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs text-white/60">
                {t('appointments.staff.form.source')}
              </label>

              <select
                value={form.source}
                onChange={(event) =>
                  handleSourceChange(
                    event.target.value as StaffFormState['source']
                  )
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="manual">
                  {t('appointments.staff.sources.manual')}
                </option>

                <option
                  value="square"
                  disabled={!squareConnected}
                >
                  {t('appointments.staff.sources.square')}
                </option>
              </select>

              {!squareConnected && (
                <div className="mt-1 text-xs text-amber-300/80">
                  {t('appointments.staff.squareNotConnected')}
                </div>
              )}
            </div>

            {form.source === 'square' && (
              <div>
                <label className="mb-1 block text-xs text-white/60">
                  {t('appointments.staff.form.squareStaff')}
                </label>

                <select
                  value={form.squareTeamMemberId}
                  onChange={(event) =>
                    handleSquareMemberChange(
                      event.target.value
                    )
                  }
                  disabled={squareLoading}
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none disabled:opacity-50"
                >
                  <option value="">
                    {squareLoading
                      ? t('appointments.staff.loadingSquare')
                      : t('appointments.staff.selectSquare')}
                  </option>

                  {squareTeamMembers.map((member) => (
                    <option
                      key={member.teamMemberId}
                      value={member.teamMemberId}
                    >
                      {member.displayName}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs text-white/60">
                {t('appointments.staff.form.name')}
              </label>

              <input
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">
                {t('appointments.staff.form.type')}
              </label>

              <select
                value={form.resourceType}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    resourceType:
                      event.target.value as ResourceType,
                  }))
                }
                className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none"
              >
                <option value="person">
                  {t('appointments.staff.resourceTypes.person')}
                </option>
                <option value="crew">
                  {t('appointments.staff.resourceTypes.crew')}
                </option>
                <option value="vehicle">
                  {t('appointments.staff.resourceTypes.vehicle')}
                </option>
                <option value="equipment">
                  {t('appointments.staff.resourceTypes.equipment')}
                </option>
                <option value="other">
                  {t('appointments.staff.resourceTypes.other')}
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">
                {t('appointments.staff.form.startAddress')}
              </label>

              <input
                value={form.startAddress}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    startAddress:
                      event.target.value,
                  }))
                }
                placeholder={t(
                  'appointments.staff.form.startAddressPlaceholder'
                )}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">
                {t('appointments.staff.form.endAddress')}
              </label>

              <input
                value={form.endAddress}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    endAddress:
                      event.target.value,
                  }))
                }
                placeholder={t(
                  'appointments.staff.form.endAddressPlaceholder'
                )}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">
                {t('appointments.staff.form.timezone')}
              </label>

              <input
                value={form.timezone}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    timezone:
                      event.target.value,
                  }))
                }
                placeholder="America/New_York"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs text-white/60">
                {t('appointments.staff.form.capabilities')}
              </label>

              <input
                value={form.capabilitiesText}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    capabilitiesText:
                      event.target.value,
                  }))
                }
                placeholder={t(
                  'appointments.staff.form.capabilitiesPlaceholder'
                )}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
              />
            </div>

            <label className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    active:
                      event.target.checked,
                  }))
                }
                className="h-4 w-4"
              />

              <span className="text-sm text-white">
                {t('appointments.staff.form.active')}
              </span>
            </label>
          </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={resetForm}
              disabled={saving}
              className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
              {t('appointments.staff.form.cancel')}
            </button>

            <button
              type="button"
              onClick={() => void saveResource()}
              disabled={saving}
              className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving
                ? t('appointments.staff.form.saving')
                : t('appointments.staff.form.save')}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-8 text-center text-sm text-white/55">
          {t('appointments.staff.loading')}
        </div>
      ) : resources.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-4 py-10 text-center">
          <div className="text-sm font-medium text-white">
            {t('appointments.staff.emptyTitle')}
          </div>

          <div className="mt-1 text-xs text-white/50">
            {t('appointments.staff.emptySubtitle')}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => {
            const squareMember =
              squareTeamMembers.find(
                (member) =>
                  member.teamMemberId ===
                  resource.externalReference
              );

            return (
              <div
                key={resource.id}
                className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-white">
                        {resource.name}
                      </div>

                      <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[11px] text-white/60">
                        {resourceTypeLabel(
                          resource.resourceType
                        )}
                      </span>

                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                          resource.active
                            ? 'bg-emerald-500/15 text-emerald-200'
                            : 'bg-red-500/15 text-red-200'
                        }`}
                      >
                        {resource.active
                          ? t('appointments.staff.active')
                          : t('appointments.staff.inactive')}
                      </span>

                      {resource.externalProvider ===
                        'square' && (
                        <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-[11px] font-medium text-blue-200">
                          Square
                        </span>
                      )}
                    </div>

                    <div className="mt-2 space-y-1 text-xs text-white/50">
                      {resource.externalProvider ===
                        'square' && (
                        <div>
                          {t(
                            'appointments.staff.linkedSquare'
                          )}:{' '}
                          <span className="text-white/75">
                            {squareMember?.displayName ||
                              resource.externalReference}
                          </span>
                        </div>
                      )}

                      {resource.startAddress && (
                        <div>
                          {t(
                            'appointments.staff.startAddress'
                          )}:{' '}
                          <span className="text-white/75">
                            {resource.startAddress}
                          </span>
                        </div>
                      )}

                      {resource.endAddress && (
                        <div>
                          {t(
                            'appointments.staff.endAddress'
                          )}:{' '}
                          <span className="text-white/75">
                            {resource.endAddress}
                          </span>
                        </div>
                      )}

                      {resource.capabilities.length >
                        0 && (
                        <div>
                          {t(
                            'appointments.staff.capabilities'
                          )}:{' '}
                          <span className="text-white/75">
                            {capabilitiesToText(
                              resource.capabilities
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        openEditForm(resource)
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition hover:bg-white/10"
                    >
                      <FiEdit2 />
                      {t('appointments.staff.edit')}
                    </button>

                    {resource.active ? (
                      <button
                        type="button"
                        onClick={() =>
                          void deactivateResource(
                            resource
                          )
                        }
                        disabled={saving}
                        className="inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs font-medium text-red-200 transition hover:bg-red-500/20 disabled:opacity-50"
                      >
                        <FiTrash2 />
                        {t(
                          'appointments.staff.deactivate'
                        )}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          void reactivateResource(
                            resource
                          )
                        }
                        disabled={saving}
                        className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-50"
                      >
                        {t(
                          'appointments.staff.activate'
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}