'use client';

import Link from 'next/link';
import { FilePlus, List, Clock, UtensilsCrossed } from 'lucide-react';

const menuCards = [
  {
    title: 'Nuevo Pedido',
    desc: 'Registrar pedido de cliente',
    icon: FilePlus,
    href: '/nuevo-pedido',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    title: 'Ver Pedidos',
    desc: 'Consultar y editar pedidos',
    icon: List,
    href: '/pedidos',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    title: 'Por Preparar',
    desc: 'Vista de tiempos de cocina',
    icon: Clock,
    href: '/preparar',
    gradient: 'from-green-500 to-emerald-500',
  },
  {
    title: 'Menú',
    desc: 'Administrar platillos',
    icon: UtensilsCrossed,
    href: '/menu',
    gradient: 'from-purple-500 to-pink-500',
  },
];

export default function Home() {
  return (
    <div>
      {/* Welcome */}
      <div className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-dark)] mb-2">
          Bienvenido, Chef
        </h1>
        <p className="text-[var(--text-muted)]">
          Sistema de pedidos para el 24 de diciembre
        </p>
      </div>

      {/* Grid 2x2 - Centrado */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6">
        {menuCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.href} href={card.href}>
              <div className={`
                relative overflow-hidden rounded-2xl p-6 sm:p-8
                bg-gradient-to-br ${card.gradient}
                text-white shadow-lg
                hover:shadow-xl hover:scale-[1.02]
                transition-all duration-200 cursor-pointer
                min-h-[160px] sm:min-h-[200px]
                flex flex-col items-center justify-center text-center
              `}>
                <Icon className="w-10 h-10 sm:w-12 sm:h-12 opacity-90 mb-3" strokeWidth={1.5} />
                <h2 className="text-lg sm:text-xl font-bold">{card.title}</h2>
                <p className="text-white/80 text-xs sm:text-sm mt-1">{card.desc}</p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-10">
        <div className="card p-4 sm:p-5 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-orange-500">--</div>
          <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">Pendientes</div>
        </div>
        <div className="card p-4 sm:p-5 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-green-500">--</div>
          <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">En Preparación</div>
        </div>
        <div className="card p-4 sm:p-5 text-center">
          <div className="text-2xl sm:text-3xl font-bold text-blue-500">--</div>
          <div className="text-xs sm:text-sm text-[var(--text-muted)] mt-1">Completados</div>
        </div>
      </div>
    </div>
  );
}
