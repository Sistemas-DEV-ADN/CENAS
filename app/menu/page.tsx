'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Plus, Edit2, Trash2, Power, PowerOff } from 'lucide-react';
import { obtenerItemsMenu, agregarItemMenu, agregarVariante, actualizarItemMenu } from '@/lib/db/menu';
import type { ItemMenuConVariantes, VarianteMenu } from '@/lib/db/menu';

export default function MenuPage() {
    const [items, setItems] = useState<ItemMenuConVariantes[]>([]);
    const [loading, setLoading] = useState(true);
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string>('todas');

    useEffect(() => {
        cargarMenu();
    }, []);

    const cargarMenu = async () => {
        try {
            const data = await obtenerItemsMenu(false); // Mostrar todos, incluyendo inactivos
            setItems(data);
        } catch (error) {
            console.error('Error al cargar menú:', error);
            alert('Error al cargar el menú. Verifica tu conexión con Supabase.');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActivo = async (id: string, activo: boolean) => {
        try {
            await actualizarItemMenu(id, { activo: !activo });
            setItems(items.map(item =>
                item.id === id ? { ...item, activo: !activo } : item
            ));
        } catch (error) {
            console.error('Error al actualizar item:', error);
            alert('Error al actualizar el item.');
        }
    };

    const getCategoriaTexto = (categoria: string) => {
        switch (categoria) {
            case 'platos_fuertes':
                return 'Platos Fuertes';
            case 'entradas':
                return 'Entradas';
            case 'complementos':
                return 'Complementos';
            case 'postres_bebidas':
                return 'Postres y Bebidas';
            default:
                return categoria;
        }
    };

    const getTipoMedidaTexto = (tipo: string) => {
        switch (tipo) {
            case 'tamaño':
                return 'Tamaño';
            case 'presentacion':
                return 'Presentación';
            case 'unidad':
                return 'Unidad de Medida';
            case 'simple':
                return 'Sin variantes';
            default:
                return tipo;
        }
    };

    const itemsFiltrados = items.filter(item =>
        categoriaSeleccionada === 'todas' || item.categoria === categoriaSeleccionada
    );

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-xl text-[var(--text-secondary)]">Cargando menú...</div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-4xl font-bold">Menú</h2>
                        <p className="text-[var(--text-secondary)] mt-2">
                            Administra los items y variantes del menú
                        </p>
                    </div>
                    <button
                        onClick={() => alert('Función agregar item - En desarrollo')}
                        className="btn-accent flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Agregar Item
                    </button>
                </div>
            </div>

            {/* Filtros por Categoría */}
            <div className="mb-6 flex gap-2 flex-wrap">
                {['todas', 'entradas', 'platos_fuertes', 'complementos', 'postres_bebidas'].map(cat => (
                    <button
                        key={cat}
                        onClick={() => setCategoriaSeleccionada(cat)}
                        className={`px-4 py-2 rounded-lg transition-all ${categoriaSeleccionada === cat
                            ? 'bg-[var(--primary)] text-white'
                            : 'bg-white text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                            }`}
                    >
                        {cat === 'todas' ? 'Todas' : getCategoriaTexto(cat)}
                    </button>
                ))}
            </div>

            {/* Lista de Items */}
            {itemsFiltrados.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-6xl mb-4">🍽️</div>
                    <h3 className="text-2xl font-semibold mb-2">No hay items en el menú</h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        {categoriaSeleccionada === 'todas'
                            ? 'Comienza agregando los items de tu menú'
                            : 'No hay items en esta categoría'}
                    </p>
                    {categoriaSeleccionada === 'todas' && (
                        <button
                            onClick={() => alert('Función agregar item - En desarrollo')}
                            className="btn-accent inline-block"
                        >
                            Agregar Primer Item
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {itemsFiltrados.map((item, index) => (
                        <div
                            key={item.id}
                            className={`card p-6 animate-slide-up ${!item.activo ? 'opacity-60' : ''
                                }`}
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-semibold">{item.nombre}</h3>
                                        <span className="badge badge-primary">
                                            {getCategoriaTexto(item.categoria)}
                                        </span>
                                        {!item.activo && (
                                            <span className="badge badge-danger">Inactivo</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-[var(--text-secondary)]">
                                        {getTipoMedidaTexto(item.unidad_medida)}
                                    </p>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => handleToggleActivo(item.id, item.activo)}
                                        className={`btn text-sm py-1 px-3 flex items-center gap-1 ${item.activo ? 'btn-secondary' : 'btn-primary'
                                            }`}
                                        title={item.activo ? 'Desactivar' : 'Activar'}
                                    >
                                        {item.activo ? (
                                            <>
                                                <PowerOff className="w-3 h-3" />
                                                Desactivar
                                            </>
                                        ) : (
                                            <>
                                                <Power className="w-3 h-3" />
                                                Activar
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => alert('Función editar - En desarrollo')}
                                        className="btn-outline text-sm py-1 px-3 flex items-center gap-1"
                                    >
                                        <Edit2 className="w-3 h-3" />
                                        Editar
                                    </button>
                                </div>
                            </div>

                            {/* Variantes */}
                            {item.variantes_menu && item.variantes_menu.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-[var(--border-color)]">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-medium text-sm text-[var(--text-secondary)]">
                                            Variantes disponibles:
                                        </h4>
                                        <button
                                            onClick={() => alert('Función agregar variante - En desarrollo')}
                                            className="text-xs text-[var(--accent)] hover:underline"
                                        >
                                            + Agregar variante
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {item.variantes_menu.map((variante: VarianteMenu) => (
                                            <div
                                                key={variante.id}
                                                className="badge badge-primary bg-[var(--primary)]/10 text-[var(--primary)] flex items-center gap-2"
                                            >
                                                <span>{variante.nombre}</span>
                                                {variante.descripcion && (
                                                    <span className="text-xs opacity-70">
                                                        ({variante.descripcion})
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
