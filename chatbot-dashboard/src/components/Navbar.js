'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleMenu = () => setOpen(!open);

  const isLanding = pathname === '/';

  return (
    <nav className="w-full fixed top-0 z-50 bg-black/60 backdrop-blur-md text-white px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-xl font-bold text-purple-400">
        Aamy.ai
      </Link>

      <button className="md:hidden" onClick={toggleMenu}>
        {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <ul className={`md:flex gap-6 font-medium items-center ${open ? 'block mt-4 md:mt-0' : 'hidden md:flex'}`}>
        <li>
          <a href="#benefits" className="hover:text-purple-400 transition" onClick={() => setOpen(false)}>
            Beneficios
          </a>
        </li>

        {/* Mostrar Dashboard solo si NO estamos en la landing */}
        {!isLanding && (
          <li>
            <Link href="/dashboard" className="hover:text-purple-400 transition" onClick={() => setOpen(false)}>
              Dashboard
            </Link>
          </li>
        )}

        <li>
          <Link
            href="/login"
            className="bg-purple-600 px-4 py-2 rounded-full text-white font-semibold hover:bg-purple-700 transition"
            onClick={() => setOpen(false)}
          >
            Ingresar
          </Link>
        </li>
      </ul>
    </nav>
  );
}
