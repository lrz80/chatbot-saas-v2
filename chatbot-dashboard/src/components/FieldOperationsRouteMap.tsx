// src/components/FieldOperationsRouteMap.tsx
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BACKEND_URL } from '@/utils/api';

type SupportedLanguage = 'es' | 'en' | 'pt';

type FieldResource = {
  id: string;
  name: string;
  resourceType?: string;
  resource_type?: string;
  active?: boolean;
  startAddress?: string | null;
  start_address?: string | null;
  startLatitude?: number | string | null;
  start_latitude?: number | string | null;
  startLongitude?: number | string | null;
  start_longitude?: number | string | null;
};

type RoutePlan = {
  id: string;

  resourceId?: string;
  resource_id?: string;

  serviceDate?: string;
  service_date?: string;

  status?: string;
  mode?: string;

  optimizationResult?: Record<string, unknown> | null;
  optimization_result?: Record<string, unknown> | null;
};

type RouteStop = {
  id?: string;

  appointmentId?: string | null;
  appointment_id?: string | null;

  locationId?: string | null;
  location_id?: string | null;

  order?: number;
  stopOrder?: number;
  stop_order?: number;

  latitude?: number | string | null;
  longitude?: number | string | null;

  scheduledStartAt?: string | null;
  scheduled_start_at?: string | null;

  scheduledEndAt?: string | null;
  scheduled_end_at?: string | null;

  plannedArrivalAt?: string | null;
  planned_arrival_at?: string | null;

  plannedDepartureAt?: string | null;
  planned_departure_at?: string | null;

  formattedAddress?: string | null;
  formatted_address?: string | null;

  customerName?: string | null;
  customer_name?: string | null;

  serviceName?: string | null;
  service_name?: string | null;

  metadata?: Record<string, unknown> | null;
};

type RoutePlanResponse = {
  ok: boolean;

  routePlan?: RoutePlan;
  route_plan?: RoutePlan;

  stops?: unknown[];
  routeStops?: unknown[];
  route_stops?: unknown[];

  skippedAppointments?: Array<Record<string, unknown>>;
  skipped_appointments?: Array<Record<string, unknown>>;

  error?: string;
};

declare global {
  interface Window {
    google?: any;
    __aamyGoogleMapsPromise?: Promise<void>;
  }
}

const COPY = {
  es: {
    title: 'Rutas de técnicos',
    subtitle: 'Visualiza el recorrido por carretera y las paradas asignadas.',
    date: 'Fecha', technician: 'Técnico', selectTechnician: 'Selecciona un técnico',
    build: 'Construir ruta', refresh: 'Actualizar', loading: 'Cargando…',
    noResources: 'No hay técnicos o recursos activos.',
    noRoute: 'No existe una ruta para este técnico y esta fecha.',
    noStops: 'La ruta no tiene paradas geocodificadas.',
    mapKeyMissing: 'Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY en el frontend.',
    resourcesError: 'No se pudieron cargar los técnicos.',
    routeError: 'No se pudo cargar o construir la ruta.',
    stops: 'paradas', skipped: 'omitidas', start: 'Inicio', stop: 'Parada',
    appointment: 'Cita', unknownAddress: 'Dirección no disponible',
    roadRoute: 'Ruta por carretera', routePlan: 'Plan de ruta',
  },
  en: {
    title: 'Technician routes', subtitle: 'View the road route and assigned stops.',
    date: 'Date', technician: 'Technician', selectTechnician: 'Select a technician',
    build: 'Build route', refresh: 'Refresh', loading: 'Loading…',
    noResources: 'No active technicians or resources.',
    noRoute: 'No route exists for this technician and date.',
    noStops: 'The route has no geocoded stops.',
    mapKeyMissing: 'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is missing in the frontend.',
    resourcesError: 'Technicians could not be loaded.',
    routeError: 'The route could not be loaded or built.',
    stops: 'stops', skipped: 'skipped', start: 'Start', stop: 'Stop',
    appointment: 'Appointment', unknownAddress: 'Address unavailable',
    roadRoute: 'Road route', routePlan: 'Route plan',
  },
  pt: {
    title: 'Rotas dos técnicos', subtitle: 'Visualize o trajeto por estrada e as paradas atribuídas.',
    date: 'Data', technician: 'Técnico', selectTechnician: 'Selecione um técnico',
    build: 'Criar rota', refresh: 'Atualizar', loading: 'Carregando…',
    noResources: 'Não há técnicos ou recursos ativos.',
    noRoute: 'Não existe rota para este técnico e esta data.',
    noStops: 'A rota não possui paradas geocodificadas.',
    mapKeyMissing: 'Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY no frontend.',
    resourcesError: 'Não foi possível carregar os técnicos.',
    routeError: 'Não foi possível carregar ou criar a rota.',
    stops: 'paradas', skipped: 'ignoradas', start: 'Início', stop: 'Parada',
    appointment: 'Agendamento', unknownAddress: 'Endereço indisponível',
    roadRoute: 'Rota por estrada', routePlan: 'Plano de rota',
  },
} as const;

function todayLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resourceStart(resource: FieldResource | null) {
  if (!resource) return null;
  const lat = numberOrNull(resource.startLatitude ?? resource.start_latitude);
  const lng = numberOrNull(resource.startLongitude ?? resource.start_longitude);
  if (lat === null || lng === null) return null;
  return { lat, lng, address: resource.startAddress ?? resource.start_address ?? null };
}

function asObject(value: unknown): Record<string, unknown> | null {
  if (
    !value ||
    typeof value !== 'object' ||
    Array.isArray(value)
  ) {
    return null;
  }

  return value as Record<string, unknown>;
}

function optionalText(value: unknown): string | null {
  const result = String(value ?? '').trim();
  return result || null;
}

function normalizeRouteStop(
  value: unknown,
  fallbackIndex: number
): RouteStop | null {
  const item = asObject(value);

  if (!item) {
    return null;
  }

  const metadata =
    asObject(item.metadata) ?? {};

  const latitude = numberOrNull(
    item.latitude ??
      item.lat ??
      metadata.latitude ??
      metadata.lat
  );

  const longitude = numberOrNull(
    item.longitude ??
      item.lng ??
      metadata.longitude ??
      metadata.lng
  );

  const appointmentId = optionalText(
    item.appointmentId ??
      item.appointment_id ??
      metadata.appointmentId ??
      metadata.appointment_id
  );

  const locationId = optionalText(
    item.locationId ??
      item.location_id ??
      metadata.locationId ??
      metadata.location_id
  );

  const order = Number(
    item.order ??
      item.stopOrder ??
      item.stop_order ??
      fallbackIndex + 1
  );

  return {
    id:
      optionalText(item.id) ??
      locationId ??
      appointmentId ??
      `route-stop-${fallbackIndex}`,

    appointmentId,
    appointment_id: appointmentId,

    locationId,
    location_id: locationId,

    order:
      Number.isFinite(order)
        ? order
        : fallbackIndex + 1,

    stopOrder:
      Number.isFinite(order)
        ? order
        : fallbackIndex + 1,

    stop_order:
      Number.isFinite(order)
        ? order
        : fallbackIndex + 1,

    latitude,
    longitude,

    scheduledStartAt: optionalText(
      item.scheduledStartAt ??
        item.scheduled_start_at ??
        item.plannedArrivalAt ??
        item.planned_arrival_at ??
        metadata.scheduledStartAt ??
        metadata.scheduled_start_at
    ),

    scheduledEndAt: optionalText(
      item.scheduledEndAt ??
        item.scheduled_end_at ??
        item.plannedDepartureAt ??
        item.planned_departure_at ??
        metadata.scheduledEndAt ??
        metadata.scheduled_end_at
    ),

    plannedArrivalAt: optionalText(
      item.plannedArrivalAt ??
        item.planned_arrival_at
    ),

    plannedDepartureAt: optionalText(
      item.plannedDepartureAt ??
        item.planned_departure_at
    ),

    formattedAddress: optionalText(
      item.formattedAddress ??
        item.formatted_address ??
        metadata.formattedAddress ??
        metadata.formatted_address
    ),

    customerName: optionalText(
      item.customerName ??
        item.customer_name ??
        metadata.customerName ??
        metadata.customer_name
    ),

    serviceName: optionalText(
      item.serviceName ??
        item.service_name ??
        metadata.serviceName ??
        metadata.service_name
    ),

    metadata,
  };
}

function extractRouteStops(
  payload: unknown
): RouteStop[] {
  const data = asObject(payload);

  if (!data) {
    return [];
  }

  const routePlan =
    asObject(data.routePlan) ??
    asObject(data.route_plan) ??
    data;

  const optimizationResult =
    asObject(routePlan.optimizationResult) ??
    asObject(routePlan.optimization_result);

  const directStops =
    Array.isArray(data.stops)
      ? data.stops
      : Array.isArray(data.routeStops)
        ? data.routeStops
        : Array.isArray(data.route_stops)
          ? data.route_stops
          : [];

  const orderedStops =
    optimizationResult &&
    Array.isArray(optimizationResult.orderedStops)
      ? optimizationResult.orderedStops
      : optimizationResult &&
          Array.isArray(optimizationResult.ordered_stops)
        ? optimizationResult.ordered_stops
        : [];

  /*
   * Las paradas directas normalmente tienen las coordenadas.
   * orderedStops normalmente tiene el orden optimizado.
   *
   * Cuando existen ambas, conservamos las coordenadas de directStops
   * y aplicamos el orden del resultado optimizado.
   */
  const normalizedDirectStops = directStops
    .map(normalizeRouteStop)
    .filter(
      (stop): stop is RouteStop =>
        stop !== null
    );

  const normalizedOrderedStops = orderedStops
    .map(normalizeRouteStop)
    .filter(
      (stop): stop is RouteStop =>
        stop !== null
    );

  if (normalizedOrderedStops.length === 0) {
    return normalizedDirectStops;
  }

  if (normalizedDirectStops.length === 0) {
    return normalizedOrderedStops;
  }

  const directByReference = new Map<
    string,
    RouteStop
  >();

  for (const stop of normalizedDirectStops) {
    const references = [
      stop.appointmentId,
      stop.appointment_id,
      stop.locationId,
      stop.location_id,
      stop.id,
    ].filter(
      (reference): reference is string =>
        Boolean(reference)
    );

    for (const reference of references) {
      directByReference.set(reference, stop);
    }
  }

  return normalizedOrderedStops.map(
    (orderedStop, index) => {
      const references = [
        orderedStop.appointmentId,
        orderedStop.appointment_id,
        orderedStop.locationId,
        orderedStop.location_id,
        orderedStop.id,
      ].filter(
        (reference): reference is string =>
          Boolean(reference)
      );

      const directStop = references
        .map((reference) =>
          directByReference.get(reference)
        )
        .find(Boolean);

      return {
        ...directStop,
        ...orderedStop,

        id:
          orderedStop.id ??
          directStop?.id ??
          `route-stop-${index}`,

        latitude:
          orderedStop.latitude ??
          directStop?.latitude ??
          null,

        longitude:
          orderedStop.longitude ??
          directStop?.longitude ??
          null,

        formattedAddress:
          orderedStop.formattedAddress ??
          directStop?.formattedAddress ??
          null,

        customerName:
          orderedStop.customerName ??
          directStop?.customerName ??
          null,

        serviceName:
          orderedStop.serviceName ??
          directStop?.serviceName ??
          null,

        metadata: {
          ...(directStop?.metadata ?? {}),
          ...(orderedStop.metadata ?? {}),
        },
      };
    }
  );
}

function normalizeStops(
  stops: RouteStop[]
): RouteStop[] {
  return [...stops]
    .filter((stop) => {
      const latitude = numberOrNull(
        stop.latitude
      );

      const longitude = numberOrNull(
        stop.longitude
      );

      return (
        latitude !== null &&
        latitude >= -90 &&
        latitude <= 90 &&
        longitude !== null &&
        longitude >= -180 &&
        longitude <= 180
      );
    })
    .sort((a, b) => {
      const orderA = Number(
        a.order ??
          a.stopOrder ??
          a.stop_order ??
          0
      );

      const orderB = Number(
        b.order ??
          b.stopOrder ??
          b.stop_order ??
          0
      );

      return orderA - orderB;
    });
}

function loadGoogleMaps(apiKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('WINDOW_UNAVAILABLE'));
  if (window.google?.maps?.importLibrary) return Promise.resolve();
  if (window.__aamyGoogleMapsPromise) return window.__aamyGoogleMapsPromise;

  window.__aamyGoogleMapsPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-aamy-google-maps="true"]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('GOOGLE_MAPS_SCRIPT_LOAD_FAILED')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.dataset.aamyGoogleMaps = 'true';
    script.async = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&v=weekly&loading=async&libraries=marker,routes`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('GOOGLE_MAPS_SCRIPT_LOAD_FAILED'));
    document.head.appendChild(script);
  });

  return window.__aamyGoogleMapsPromise;
}

export default function FieldOperationsRouteMap({ lang }: { lang?: string }) {
  const selectedLanguage: SupportedLanguage = lang === 'en' || lang === 'pt' ? lang : 'es';
  const copy = COPY[selectedLanguage];
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID';

  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const overlaysRef = useRef<any[]>([]);

  const [resources, setResources] = useState<FieldResource[]>([]);
  const [resourceId, setResourceId] = useState('');
  const [serviceDate, setServiceDate] = useState(todayLocal());
  const [routePlan, setRoutePlan] = useState<RoutePlan | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [skippedCount, setSkippedCount] = useState(0);
  const [loadingResources, setLoadingResources] = useState(true);
  const [loadingRoute, setLoadingRoute] = useState(false);
  const [buildingRoute, setBuildingRoute] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedResource = useMemo(
    () => resources.find((resource) => resource.id === resourceId) ?? null,
    [resourceId, resources]
  );

  const clearMap = useCallback(() => {
    for (const overlay of overlaysRef.current) {
      try {
        if ('map' in overlay) overlay.map = null;
        if (typeof overlay.setMap === 'function') overlay.setMap(null);
      } catch {}
    }
    overlaysRef.current = [];
  }, []);

  const renderMap = useCallback(async () => {
    if (!mapElementRef.current || !apiKey) return;
    const normalizedStops = normalizeStops(stops);
    const start = resourceStart(selectedResource);
    clearMap();
    
    await loadGoogleMaps(apiKey);
    const { Map } = await window.google.maps.importLibrary('maps');
    const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary('marker');
    const firstStop = normalizedStops[0];

    const firstPoint = start
    ? {
        lat: start.lat,
        lng: start.lng,
        }
    : firstStop
        ? {
            lat: Number(firstStop.latitude),
            lng: Number(firstStop.longitude),
        }
        : {
            // Centro aproximado de Florida cuando todavía no hay paradas.
            lat: 28.3,
            lng: -81.6,
        };

    const map = mapRef.current ?? new Map(mapElementRef.current, {
      center: firstPoint, zoom: 11, mapId,
      streetViewControl: false, mapTypeControl: false, fullscreenControl: true,
    });
    mapRef.current = map;
    const bounds = new window.google.maps.LatLngBounds();

    if (start) {
      const pin = new PinElement({ glyph: 'T', scale: 1.15 });
      const marker = new AdvancedMarkerElement({
        map, position: { lat: start.lat, lng: start.lng },
        title: `${copy.start}: ${selectedResource?.name ?? ''}`, content: pin.element,
      });
      overlaysRef.current.push(marker);
      bounds.extend({ lat: start.lat, lng: start.lng });
    }

    for (const [index, stop] of normalizedStops.entries()) {
      const lat = Number(stop.latitude);
      const lng = Number(stop.longitude);
      const order = Number(
        stop.order ??
          stop.stopOrder ??
          stop.stop_order ??
          index + 1
      );
      const pin = new PinElement({ glyph: String(order || index + 1), scale: 1.05 });
      const marker = new AdvancedMarkerElement({
        map, position: { lat, lng },
        title: stop.formattedAddress ?? stop.formatted_address ?? `${copy.stop} ${index + 1}`,
        content: pin.element,
      });
      overlaysRef.current.push(marker);
      bounds.extend({ lat, lng });
    }

    const routePoints = [
      ...(start ? [{ lat: start.lat, lng: start.lng }] : []),
      ...normalizedStops.map((stop) => ({ lat: Number(stop.latitude), lng: Number(stop.longitude) })),
    ];

    if (routePoints.length >= 2) {
      try {
        const { Route } = await window.google.maps.importLibrary('routes');
        const response = await Route.computeRoutes({
          origin: routePoints[0],
          destination: routePoints[routePoints.length - 1],
          intermediates: routePoints.slice(1, -1).map((location) => ({ location })),
          travelMode: 'DRIVING',
          routingPreference: 'TRAFFIC_AWARE',
          fields: ['path', 'viewport', 'distanceMeters', 'durationMillis'],
        });
        const firstRoute = response?.routes?.[0];
        if (firstRoute) {
          const polylines = firstRoute.createPolylines({ polylineOptions: { strokeOpacity: 0.9, strokeWeight: 6 } });
          for (const polyline of polylines) {
            polyline.setMap(map);
            overlaysRef.current.push(polyline);
          }
        }
      } catch (routeError) {
        console.error('[FIELD_OPERATIONS_MAP][ROUTE_ERROR]', routeError);
        const fallbackPolyline = new window.google.maps.Polyline({
          map, path: routePoints, geodesic: true, strokeOpacity: 0.75, strokeWeight: 4,
        });
        overlaysRef.current.push(fallbackPolyline);
      }
    }

    if (!bounds.isEmpty()) map.fitBounds(bounds, 56);
  }, [apiKey, clearMap, copy.start, copy.stop, mapId, selectedResource, stops]);

  const loadResources = useCallback(async () => {
    try {
      setLoadingResources(true);
      setError(null);
      const response = await fetch(`${BACKEND_URL}/api/field-operations/resources?active=true`, { credentials: 'include' });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || copy.resourcesError);
      const nextResources = Array.isArray(data.resources) ? data.resources : [];
      setResources(nextResources);
      setResourceId((current) => current && nextResources.some((item: FieldResource) => item.id === current) ? current : nextResources[0]?.id ?? '');
    } catch (loadError) {
      console.error('[FIELD_OPERATIONS_MAP][RESOURCES_ERROR]', loadError);
      setError(loadError instanceof Error ? loadError.message : copy.resourcesError);
    } finally {
      setLoadingResources(false);
    }
  }, [copy.resourcesError]);

  const loadExistingRoute = useCallback(async () => {
    if (!resourceId || !serviceDate) {
      setRoutePlan(null); setStops([]); return;
    }
    try {
      setLoadingRoute(true); setError(null);
      const response = await fetch(`${BACKEND_URL}/api/field-operations/route-plans/by-resource/${encodeURIComponent(resourceId)}/${encodeURIComponent(serviceDate)}`, { credentials: 'include' });
      if (response.status === 404) {
        setRoutePlan(null); setStops([]); setSkippedCount(0); return;
      }
      const data = await response.json();
      if (!response.ok || !data?.ok || !data.routePlan?.id) throw new Error(data?.error || copy.routeError);
      const detailResponse = await fetch(`${BACKEND_URL}/api/field-operations/route-plans/${encodeURIComponent(data.routePlan.id)}`, { credentials: 'include' });
      const detail = await detailResponse.json();
      if (!detailResponse.ok || !detail?.ok) throw new Error(detail?.error || copy.routeError);
      const resolvedRoutePlan =
        detail.routePlan ??
        detail.route_plan ??
        data.routePlan ??
        data.route_plan ??
        null;

      const resolvedStops = extractRouteStops({
        ...detail,
        routePlan: resolvedRoutePlan,
      });

      setRoutePlan(resolvedRoutePlan);
      setStops(resolvedStops);

      const skippedAppointments =
        Array.isArray(detail.skippedAppointments)
          ? detail.skippedAppointments
          : Array.isArray(detail.skipped_appointments)
            ? detail.skipped_appointments
            : [];

      setSkippedCount(
        skippedAppointments.length
      );
    } catch (loadError) {
      console.error('[FIELD_OPERATIONS_MAP][LOAD_ROUTE_ERROR]', loadError);
      setError(loadError instanceof Error ? loadError.message : copy.routeError);
    } finally {
      setLoadingRoute(false);
    }
  }, [copy.routeError, resourceId, serviceDate]);

  const buildRoute = useCallback(async () => {
    if (!resourceId || !serviceDate) return;
    try {
      setBuildingRoute(true); setError(null);
      const response = await fetch(`${BACKEND_URL}/api/field-operations/route-plans/build`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resourceId, serviceDate, mode: 'view_only', optimize: true,
          geocodeMissingLocations: true, geocodingLanguage: selectedLanguage, geocodingRegion: 'us',
        }),
      });
      const data: RoutePlanResponse = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || copy.routeError);
      const resolvedRoutePlan =
        data.routePlan ??
        data.route_plan ??
        null;

      const resolvedStops =
        extractRouteStops({
          ...data,
          routePlan: resolvedRoutePlan,
      });

      const skippedAppointments =
        Array.isArray(data.skippedAppointments)
          ? data.skippedAppointments
          : Array.isArray(data.skipped_appointments)
            ? data.skipped_appointments
            : [];

      setRoutePlan(resolvedRoutePlan);
      setStops(resolvedStops);
      setSkippedCount(
        skippedAppointments.length
      );
    } catch (buildError) {
      console.error('[FIELD_OPERATIONS_MAP][BUILD_ROUTE_ERROR]', buildError);
      setError(buildError instanceof Error ? buildError.message : copy.routeError);
    } finally {
      setBuildingRoute(false);
    }
  }, [copy.routeError, resourceId, selectedLanguage, serviceDate]);

  useEffect(() => { void loadResources(); }, [loadResources]);
  useEffect(() => { void loadExistingRoute(); }, [loadExistingRoute]);
  useEffect(() => { void renderMap(); }, [renderMap]);

  const normalizedStops = useMemo(() => normalizeStops(stops), [stops]);
  const busy = loadingResources || loadingRoute || buildingRoute;

  return (
    <section className="mb-6 overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm">
      <div className="border-b border-white/10 px-4 py-4 sm:px-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">{copy.title}</h2>
            <p className="mt-1 text-sm text-white/55">{copy.subtitle}</p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[160px_minmax(220px,1fr)_auto_auto]">
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">{copy.date}</span>
              <input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs text-white/60">{copy.technician}</span>
              <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} disabled={loadingResources || resources.length === 0} className="w-full rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm text-white outline-none disabled:opacity-50">
                <option value="">{copy.selectTechnician}</option>
                {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.name}</option>)}
              </select>
            </label>
            <button type="button" onClick={() => void buildRoute()} disabled={!resourceId || busy} className="rounded-xl bg-purple-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50">
              {buildingRoute ? copy.loading : copy.build}
            </button>
            <button type="button" onClick={() => void loadExistingRoute()} disabled={!resourceId || busy} className="rounded-xl border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-50">
              {loadingRoute ? copy.loading : copy.refresh}
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-white/60">
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">{normalizedStops.length} {copy.stops}</span>
          <span className="rounded-full border border-white/10 bg-black/30 px-3 py-1">{skippedCount} {copy.skipped}</span>
          {routePlan && <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-emerald-200">{copy.routePlan}: {routePlan.status ?? 'draft'}</span>}
        </div>
      </div>

      {error && <div className="border-b border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-100 sm:px-6">{error}</div>}

      {!apiKey ? (
        <div className="px-6 py-12 text-center text-sm text-amber-200">{copy.mapKeyMissing}</div>
      ) : loadingResources ? (
        <div className="px-6 py-12 text-center text-sm text-white/60">{copy.loading}</div>
      ) : resources.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-white/60">{copy.noResources}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="relative min-h-[420px] bg-black/20">
            <div ref={mapElementRef} className="absolute inset-0" />
            {!loadingRoute && !buildingRoute && normalizedStops.length === 0 && (
              <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 rounded-xl border border-white/10 bg-black/75 px-4 py-3 text-center text-sm text-white/80 backdrop-blur-sm">
                {routePlan ? copy.noStops : copy.noRoute}
              </div>
            )}
          </div>
          <aside className="border-t border-white/10 bg-black/20 lg:border-l lg:border-t-0">
            <div className="border-b border-white/10 px-4 py-3 text-sm font-semibold text-white">{copy.roadRoute}</div>
            <div className="max-h-[420px] space-y-1 overflow-y-auto p-3">
              {resourceStart(selectedResource) && (
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-600 text-xs font-bold">T</span>
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-white">{copy.start}: {selectedResource?.name}</div>
                      <div className="truncate text-xs text-white/50">{resourceStart(selectedResource)?.address ?? copy.unknownAddress}</div>
                    </div>
                  </div>
                </div>
              )}
              {normalizedStops.map((stop, index) => {
                const order = Number(
                  stop.order ??
                    stop.stopOrder ??
                    stop.stop_order ??
                    index + 1
                );
                const customer = stop.customerName ?? stop.customer_name ?? (stop.metadata?.customerName as string | undefined) ?? (stop.metadata?.customer_name as string | undefined);
                const service = stop.serviceName ?? stop.service_name ?? (stop.metadata?.serviceName as string | undefined) ?? (stop.metadata?.service_name as string | undefined);
                const address = stop.formattedAddress ?? stop.formatted_address ?? (stop.metadata?.formattedAddress as string | undefined) ?? (stop.metadata?.formatted_address as string | undefined) ?? copy.unknownAddress;
                const scheduled = stop.scheduledStartAt ?? stop.scheduled_start_at ?? null;
                return (
                  <div
                    key={
                      stop.id ??
                      stop.appointmentId ??
                      stop.appointment_id ??
                      stop.locationId ??
                      stop.location_id ??
                      `route-stop-${index}`
                    }
                    className="rounded-xl border border-white/10 bg-white/5 p-3"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-black">{order || index + 1}</span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-white">{customer || `${copy.appointment} ${order || index + 1}`}</div>
                        {service && <div className="mt-0.5 text-xs text-purple-200">{service}</div>}
                        <div className="mt-1 text-xs text-white/50">{address}</div>
                        {scheduled && <div className="mt-1 text-xs text-white/45">{new Date(scheduled).toLocaleString()}</div>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        </div>
      )}
    </section>
  );
}