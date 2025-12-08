"use client";

import { useEffect, useState } from "react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";
import { BACKEND_URL } from "@/utils/api";

interface Props {
  campaignId: number;
}

export default function EmailLogViewer({ campaignId }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!campaignId || isNaN(campaignId)) return;

    const abort = new AbortController();

    const cargarLogs = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/email-status?campaign_id=${campaignId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          cache: "no-store",
        });        

        if (res.status === 401) {
          setError("⚠️ No estás autorizado para ver esta información.");
          return;
        }

        if (!res.ok) throw new Error(`Error HTTP ${res.status}`);

        const data = await res.json();
        setLogs(Array.isArray(data) ? data : []);
        setError(null);
      } catch (err) {
        if (!abort.signal.aborted) {
          console.error("❌ Error al obtener logs:", err);
          setError("Error al cargar los registros.");
          setLogs([]);
        }
      } finally {
        if (!abort.signal.aborted) {
          setLoading(false);
        }
      }
    };

    cargarLogs();

    return () => abort.abort();
  }, [campaignId]);

  if (loading) return <p className="text-white/50 text-sm">Cargando envíos...</p>;

  if (error)
    return (
      <p className="text-red-400 text-sm flex items-center gap-1">
        <HiOutlineExclamationTriangle /> {error}
      </p>
    );

  if (logs.length === 0)
    return <p className="text-white/50 text-sm">No hay registros aún.</p>;

  return (
    <ul className="mt-4 border-t border-white/10 pt-3 text-xs space-y-2">
      {logs.map((log, idx) => (
        <li key={idx} className="border-b border-white/10 pb-2">
          <p className="text-white font-mono">{log.email}</p>
          <p>
            Estado:{" "}
            <span
              className={`font-bold ${
                log.status === "sent" ? "text-green-400" : "text-red-400"
              }`}
            >
              {log.status}
            </span>
          </p>
          {log.error_message && (
            <p className="text-red-300 flex items-center gap-1">
              <HiOutlineExclamationTriangle /> {log.error_message}
            </p>
          )}
          <p className="text-white/40">
            {new Date(log.timestamp).toLocaleString()}
          </p>
        </li>
      ))}
    </ul>
  );
}
