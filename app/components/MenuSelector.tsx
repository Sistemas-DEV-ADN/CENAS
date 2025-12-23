'use client';

import { useState, useEffect, useMemo } from 'react';
import { X, ChevronRight, Check, ArrowLeft, Info, Search } from 'lucide-react';
import { obtenerItemsMenu, obtenerSalsas, calcularPrecioItem } from '@/lib/db/menu';
import type { ItemMenuConVariantes, VarianteMenu } from '@/lib/db/menu';

interface MenuSelectorProps {
    isOpen: boolean;
    onClose: () => void;
    onSelect: (item: {
        itemMenuId: string;
        nombreItem: string;
        varianteId?: string;
        nombreVariante?: string;
        cantidad: number;
        precioUnitario: number;
        salsaId?: string; // Para items que llevan salsa extra
        nombreSalsa?: string;
        notas?: string;
    }) => void;
}

type Step = 'categorias' | 'items' | 'detalles';

export default function MenuSelector({ isOpen, onClose, onSelect }: MenuSelectorProps) {
    const [step, setStep] = useState<Step>('categorias');
    const [loading, setLoading] = useState(true);
    const [allItems, setAllItems] = useState<ItemMenuConVariantes[]>([]);
    const [salsasItems, setSalsasItems] = useState<VarianteMenu[]>([]);

    // Búsqueda
    const [searchTerm, setSearchTerm] = useState('');

    // Selección actual
    const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<string | null>(null);
    const [itemSeleccionado, setItemSeleccionado] = useState<ItemMenuConVariantes | null>(null);
    const [varianteSeleccionada, setVarianteSeleccionada] = useState<VarianteMenu | null>(null);
    const [salsaSeleccionada, setSalsaSeleccionada] = useState<VarianteMenu | null>(null);
    const [cantidad, setCantidad] = useState(1);
    const [notas, setNotas] = useState('');

    useEffect(() => {
        if (isOpen) {
            cargarDatos();
            resetearSeleccion();
        }
    }, [isOpen]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [items, salsas] = await Promise.all([
                obtenerItemsMenu(true),
                obtenerSalsas()
            ]);
            setAllItems(items);
            setSalsasItems(salsas);
        } catch (error) {
            console.error('Error cargando menú:', error);
            alert('Error al cargar el menú');
        } finally {
            setLoading(false);
        }
    };

    const resetearSeleccion = () => {
        setStep('categorias');
        setSearchTerm('');
        setCategoriaSeleccionada(null);
        setItemSeleccionado(null);
        setVarianteSeleccionada(null);
        setSalsaSeleccionada(null);
        setCantidad(1);
        setNotas('');
    };

    const handleCategoriaSelect = (cat: string) => {
        setCategoriaSeleccionada(cat);
        setSearchTerm(''); // Limpiar búsqueda al entrar a categoría
        setStep('items');
    };

    const handleItemSelect = (item: ItemMenuConVariantes) => {
        setItemSeleccionado(item);
        // Si no tiene variantes, pre-seleccionar "null" o manejar lógica directo
        if (item.variantes_menu && item.variantes_menu.length > 0) {
            setVarianteSeleccionada(null);
        } else {
            setVarianteSeleccionada(null);
        }
        setStep('detalles');
    };

    const handleConfirmar = () => {
        if (!itemSeleccionado) return;

        // Validar selección de variante si el item tiene variantes obligatorias
        if (itemSeleccionado.variantes_menu.length > 0 && !varianteSeleccionada) {
            alert('Por favor selecciona una variante (sabor, tamaño, etc.)');
            return;
        }

        const precio = calcularPrecioItem(itemSeleccionado, varianteSeleccionada || undefined);

        onSelect({
            itemMenuId: itemSeleccionado.id,
            nombreItem: itemSeleccionado.nombre,
            varianteId: varianteSeleccionada?.id,
            nombreVariante: varianteSeleccionada?.nombre,
            cantidad,
            precioUnitario: precio,
            salsaId: salsaSeleccionada?.id,
            nombreSalsa: salsaSeleccionada?.nombre,
            notas
        });
        onClose();
    };

    // Lógica de filtrado
    const itemsResultados = useMemo(() => {
        if (!searchTerm) {
            if (step === 'items' && categoriaSeleccionada) {
                return allItems.filter(i => i.categoria === categoriaSeleccionada);
            }
            return [];
        }
        // Filtrado insensible a mayúsculas/minúsculas
        return allItems.filter(item =>
            item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [allItems, searchTerm, step, categoriaSeleccionada]);

    if (!isOpen) return null;

    // Categorías hardcodeadas para mostrar nombres bonitos
    const categorias = [
        { id: 'entradas', nombre: 'Entradas', items: allItems.filter(i => i.categoria === 'entradas').length },
        { id: 'platos_fuertes', nombre: 'Platos Fuertes', items: allItems.filter(i => i.categoria === 'platos_fuertes').length },
        { id: 'postres_bebidas', nombre: 'Postres y Bebidas', items: allItems.filter(i => i.categoria === 'postres_bebidas').length },
    ];

    // Determinar qué mostrar en el cuerpo
    const showCategories = step === 'categorias' && !searchTerm;
    const showItemsList = (step === 'items' || searchTerm.length > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
            <div className="bg-white w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[85vh] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">

                {/* Header Modal */}
                <div className="flex flex-col border-b border-gray-100 bg-gray-50">
                    <div className="flex items-center justify-between p-4 pb-2">
                        <div className="flex items-center gap-2">
                            {step !== 'categorias' && !searchTerm && (
                                <button onClick={() => setStep(step === 'detalles' ? 'items' : 'categorias')} className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-gray-600" />
                                </button>
                            )}
                            <h3 className="font-bold text-lg text-[var(--primary)]">
                                {searchTerm ? 'Resultados de búsqueda' : (
                                    <>
                                        {step === 'categorias' && 'Seleccionar Categoría'}
                                        {step === 'items' && 'Seleccionar Platillo'}
                                        {step === 'detalles' && 'Detalles y Variantes'}
                                    </>
                                )}
                            </h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Barra de Búsqueda (Visible en pasos de selección) */}
                    {step !== 'detalles' && (
                        <div className="px-4 pb-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Escribe para buscar (ej. Lomo, Lasaña...)"
                                    className="w-full pl-9 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/20 transition-all shadow-sm"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    autoFocus={step === 'categorias'}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--primary)]"></div>
                        </div>
                    ) : (
                        <>
                            {/* VISTA DE CATEGORIAS */}
                            {showCategories && (
                                <div className="grid gap-3">
                                    {categorias.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => handleCategoriaSelect(cat.id)}
                                            className="card hover:border-[var(--primary)] flex items-center justify-between p-4 group text-left transition-all bg-white"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-[var(--primary)] font-bold">
                                                    {cat.nombre.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{cat.nombre}</h4>
                                                    <span className="text-xs text-gray-500">{cat.items} platillos disponibles</span>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--primary)] transform group-hover:translate-x-1 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* VISTA DE ITEMS (Filtrados o por categoría) */}
                            {showItemsList && (
                                <div className="grid gap-3">
                                    {itemsResultados.length === 0 ? (
                                        <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                                            <Search className="w-12 h-12 mb-3 opacity-20" />
                                            <p className="font-medium">No se encontraron resultados</p>
                                            <p className="text-sm">Prueba con otro término de búsqueda</p>
                                        </div>
                                    ) : (
                                        itemsResultados.map(item => (
                                            <button
                                                key={item.id}
                                                onClick={() => handleItemSelect(item)}
                                                className="card hover:border-[var(--primary)] flex items-center justify-between p-4 group text-left transition-all bg-white"
                                            >
                                                <div>
                                                    <h4 className="font-bold text-gray-800">{item.nombre}</h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="badge badge-primary text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-100">
                                                            {item.unidad_medida}
                                                        </span>
                                                        <span className="text-sm font-semibold text-gray-600">
                                                            {item.precio_base ? `$${item.precio_base}` : 'Precio según var.'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-[var(--primary)]" />
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* STEP 3: DETALLES */}
                            {step === 'detalles' && itemSeleccionado && (
                                <div className="space-y-6">
                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3 text-blue-800">
                                        <Info className="w-5 h-5 flex-shrink-0" />
                                        <div>
                                            <p className="font-bold">{itemSeleccionado.nombre}</p>
                                            <p className="text-sm opacity-80">Configura tu platillo a continuación</p>
                                        </div>
                                    </div>

                                    {/* Selección de Variantes (si existen) */}
                                    {itemSeleccionado.variantes_menu && itemSeleccionado.variantes_menu.length > 0 && (
                                        <div>
                                            <label className="label mb-2">
                                                Elige {itemSeleccionado.tipo_variante || 'una opción'}:
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                {itemSeleccionado.variantes_menu.map(variante => (
                                                    <button
                                                        key={variante.id}
                                                        onClick={() => setVarianteSeleccionada(variante)}
                                                        className={`
                                                            p-3 rounded-xl border text-left transition-all
                                                            ${varianteSeleccionada?.id === variante.id
                                                                ? 'border-[var(--primary)] bg-blue-50 text-[var(--primary)] ring-1 ring-[var(--primary)]'
                                                                : 'border-gray-200 hover:border-gray-300'
                                                            }
                                                        `}
                                                    >
                                                        <div className="font-medium text-sm">{variante.nombre}</div>
                                                        {variante.precio && (
                                                            <div className="text-xs font-bold mt-1">${variante.precio}</div>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Selección de Salsa (si es item de salsa opcional) */}
                                    {salsasItems.length > 0 && (
                                        <div>
                                            <label className="label mb-2">¿Agregar Salsa Extra? (Opcional)</label>
                                            <select
                                                className="input-field"
                                                onChange={(e) => {
                                                    const s = salsasItems.find(x => x.id === e.target.value);
                                                    setSalsaSeleccionada(s || null);
                                                }}
                                                value={salsaSeleccionada?.id || ''}
                                            >
                                                <option value="">Sin salsa extra</option>
                                                {salsasItems.map(s => (
                                                    <option key={s.id} value={s.id}>{s.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    {/* Cantidad */}
                                    <div>
                                        <label className="label mb-2">Cantidad ({itemSeleccionado.unidad_medida})</label>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                                className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center font-bold text-xl hover:bg-gray-100"
                                            >
                                                -
                                            </button>
                                            <span className="text-2xl font-bold w-12 text-center">{cantidad}</span>
                                            <button
                                                onClick={() => setCantidad(cantidad + 1)}
                                                className="w-10 h-10 rounded-full border border-[var(--primary)] bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xl hover:bg-[var(--primary-light)]"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    {/* Notas */}
                                    <div>
                                        <label className="label mb-2">Notas específicas para este item</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Ej. Sin cebolla, bien dorado..."
                                            value={notas}
                                            onChange={e => setNotas(e.target.value)}
                                        />
                                    </div>

                                    {/* Resumen Precio */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <span className="text-gray-500">Subtotal Item</span>
                                        <span className="text-2xl font-bold text-[var(--primary)]">
                                            ${(calcularPrecioItem(itemSeleccionado, varianteSeleccionada || undefined) * cantidad).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer Modal */}
                {step === 'detalles' && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <button
                            onClick={handleConfirmar}
                            disabled={(itemSeleccionado?.variantes_menu?.length || 0) > 0 && !varianteSeleccionada}
                            className="w-full btn-primary py-3 text-lg flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check className="w-5 h-5" />
                            Confirmar Agregar
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
