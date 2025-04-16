"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UpgradePage() {
  const router = useRouter();

  useEffect(() => {
    document.title = "Acceso restringido - Amy AI";
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 px-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100">
        <div className="text-5xl mb-4 text-red-500">🚫</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Acceso restringido</h1>
        <p className="text-gray-700 mb-6">
          Para usar el panel necesitas tener una <strong>membresía activa</strong>.
        </p>
        <button
          onClick={() => router.push("/dashboard/profile?upgrade=1")}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-300"
        >
          Pagar membresía
        </button>
      </div>
    </div>
  );
}
