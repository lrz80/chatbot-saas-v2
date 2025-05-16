// src/components/EmailLogViewer.tsx
"use client";

import { useEffect, useState } from "react";
import { HiOutlineExclamationTriangle } from "react-icons/hi2";

interface Props {
  campaignId: number;
}

export default function EmailLogViewer({ campaignId }: Props) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/email-status?campaign_id=${campaignId}`, {
      credentials: "include", // ✅ esto es correcto
    })
      .then((res) => res.json())
      .then((data) => setLogs(data || []))
      .finally(() => setLoading(false));
  }, [campaignId]);  

  if (loading) return <p className="text-white/50 text-sm">Cargando envíos...</p>;
  if (error) return <p className="text-red-400 text-sm">{error}</p>;
  if (logs.length === 0) return <p className="text-white/50 text-sm">No hay registros aún.</p>;

  return (
    <ul className="mt-4 border-t border-white/10 pt-3 text-xs space-y-2">
      {logs.map((log, idx) => (
        <li key={idx} className="border-b border-white/10 pb-2">
          <p className="text-white font-mono">{log.email}</p>
          <p>
            Estado:{" "}
            <span
              className={`font-bold ${
                log.status === "sent"
                  ? "text-green-400"
                  : "text-red-400"
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
