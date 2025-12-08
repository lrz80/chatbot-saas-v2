// src/components/ConditionalNavbar.tsx
'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';

export default function ConditionalNavbar() {
  const pathname = usePathname();

  // Mostrar el navbar solo en la landing page (/)
  if (pathname !== '/') return null;

  return <Navbar />;
}
