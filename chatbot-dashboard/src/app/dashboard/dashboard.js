"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const router = useRouter();

  useEffect(() => {
    // 🔐 Aquí puedes conectar con Railway usando cookies, JWT o fetch
    const checkAuth = async () => {
      try {
        // Por ahora simula que no hay usuario
        const authenticatedUser = null; // ← aquí iría la lógica real

        if (authenticatedUser) {
          setUser(authenticatedUser);
        } else {
          router.push("/login"); // o donde manejes la redirección
        }
      } catch (err) {
        console.error("Error comprobando autenticación:", err);
        router.push("/login");
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    // 🚪 Aquí puedes limpiar token o sesión con tu backend en Railway
    setUser(null);
    router.push("/login");
  };

  return (
    <div className="min-h-screen p-8 text-white bg-black">
      <h1 className="text-3xl font-bold mb-4">Panel de Control</h1>
      {user ? (
        <>
          <p className="mb-4">Bienvenido, {user.email}</p>
          <button
            onClick={handleLogout}
            className="bg-red-600 px-4 py-2 rounded hover:bg-red-700"
          >
            Cerrar sesión
          </button>
        </>
      ) : (
        <p>Cargando...</p>
      )}
    </div>
  );
}

