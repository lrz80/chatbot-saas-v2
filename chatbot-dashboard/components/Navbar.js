'use client';

import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  return (
    <nav className="w-full fixed top-0 z-50 bg-black/50 backdrop-blur-md text-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-purple-400">
        Aamy.ai
      </Link>

      {/* Botón de menú móvil */}
      <button className="md:hidden" onClick={toggleMenu}>
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Menú de navegación */}
      <ul className={`md:flex gap-8 font-medium transition-all duration-300 ${open ? 'block' : 'hidden'} md:block`}>
        <li>
          <Link href="/" className="hover:text-purple-400 transition">
            Inicio
          </Link>
        </li>
        <li>
          <a href="#benefits" className="hover:text-purple-400 transition" onClick={() => setOpen(false)}>
            Ver cómo funciona
          </a>
        </li>
        <li>
          <Link href="/dashboard" className="hover:text-purple-400 transition">
            Dashboard
          </Link>
        </li>
        <li>
          <Link href="/login" className="bg-purple-600 px-4 py-2 rounded-full hover:bg-purple-700 transition">
            Ingresar
          </Link>
        </li>
      </ul>
    </nav>
  );
}
