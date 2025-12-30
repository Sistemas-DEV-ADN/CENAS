'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2 } from 'lucide-react';
import { agregarItemMenu, actualizarItemMenu, agregarVariante, eliminarVariante } from '@/lib/db/menu';
import type { ItemMenu, ItemMenuConVariantes, VarianteMenu } from '@/lib/db/menu';

interface ItemMenuModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: () => void;
    itemToEdit: ItemMenuConVariantes | null;
}

export default function ItemMenuModal({ isOpen, onClose, onSave, itemToEdit }: ItemMenuModalProps) {
    const [loading, setLoading] = useState(false);

    // Form States
    const [nombre, setNombre] = useState('');
    const [categoria, setCategoria] = useState<ItemMenu['categoria']>('platos_fuertes');
    const [unidadMedida, setUnidadMedida] = useState('pz');
    const [precioBase, setPrecioBase] = useState<string>('0');
    const [tipoVariante, setTipoVariante] = useState('');
    const [tiempoPreparacion, setTiempoPreparacion] = useState<string>('15');

    // Variantes (solo para edición o nuevas en memoria)
    const [nuevasVariantes, setNuevasVariantes] = useState<Array<{ nombre: string, precio: string, descripcion: string }>>([]);

    useEffect(() => {
        if (isOpen) {
            if (itemToEdit) {
                setNombre(itemToEdit.nombre);
                setCategoria(itemToEdit.categoria);
                setUnidadMedida(itemToEdit.unidad_medida);
                setPrecioBase(itemToEdit.precio_base?.toString() || '0');
                setTipoVariante(itemToEdit.tipo_variante || '');
                setTiempoPreparacion(itemToEdit.tiempo_preparacion?.toString() || '15');
            } else {
                // Reset form for create
                setNombre('');
                setCategoria('platos_fuertes');
                setUnidadMedida('pz');
                setPrecioBase('0');
                setTipoVariante('');
                setTiempoPreparacion('15');
            }
            setNuevasVariantes([]);
        }
    }, [isOpen, itemToEdit]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const itemData = {
                nombre,
                categoria, // Asegúrate de que este valor esté permitido en el CHECK constraint de la BD
                unidad_medida: unidadMedida,
                precio_base: parseFloat(precioBase) || 0,
                tipo_variante: tipoVariante || undefined,
                tiempo_preparacion: parseInt(tiempoPreparacion) || 15,
                activo: true
            };

            let itemId = itemToEdit?.id;

            if (itemToEdit) {
                await actualizarItemMenu(itemToEdit.id, itemData);
            } else {
                const nuevoItem = await agregarItemMenu(itemData);
                itemId = nuevoItem.id;
            }

            // Guardar nuevas variantes si hay (función básica por ahora)
            if (itemId && nuevasVariantes.length > 0) {
                for (const v of nuevasVariantes) {
                    await agregarVariante({
                        item_menu_id: itemId,
                        nombre: v.nombre,
                        precio: parseFloat(v.precio) || undefined,
                        descripcion: v.descripcion || undefined
                    });
                }
            }

            onSave();
            onClose();
        } catch (error: any) {
            console.error('Error al guardar item (Detalle):', error);
            // Mostrar mensaje más detallado si es posible
            const mensaje = error.message || error.details || 'Error desconocido al guardar';
            alert(`Error al guardar el item: ${mensaje}`);
        } finally {
            setLoading(false);
        }
    };

    const handleAddVarianteRow = () => {
        setNuevasVariantes([...nuevasVariantes, { nombre: '', precio: '', descripcion: '' }]);
    };

    const handleUpdateVarianteRow = (index: number, field: string, value: string) => {
        const updated = [...nuevasVariantes];
        updated[index] = { ...updated[index], [field]: value };
        setNuevasVariantes(updated);
    };

    const handleRemoveVarianteRow = (index: number) => {
        const updated = [...nuevasVariantes];
        updated.splice(index, 1);
        setNuevasVariantes(updated);
    };

    const handleDeleteExistingVariante = async (id: string) => {
        if (!confirm('¿Eliminar esta variante?')) return;
        try {
            await eliminarVariante(id);
            onSave(); // Refresh parent to update list
        } catch (e) {
            console.error(e);
            alert('Error al eliminar variante');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
                <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold">
                        {itemToEdit ? 'Editar Platillo' : 'Nuevo Platillo'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Datos Principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="label">Nombre del Platillo</label>
                            <input
                                required
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                className="input w-full"
                                placeholder="Ej. Lomo Mechado"
                            />
                        </div>

                        <div>
                            <label className="label">Categoría</label>
                            <select
                                value={categoria}
                                onChange={e => setCategoria(e.target.value as any)}
                                className="input w-full"
                            >
                                <option value="platos_fuertes">Platos Fuertes</option>
                                <option value="entradas">Entradas / Complementos</option>
                                <option value="postres_bebidas">Postres y Bebidas</option>
                            </select>
                            <p className="text-xs text-gray-400 mt-1">
                                Nota: Complementos se guardan como Entradas en el sistema actual.
                            </p>
                        </div>

                        <div>
                            <label className="label">Unidad de Medida</label>
                            <select
                                value={unidadMedida}
                                onChange={e => setUnidadMedida(e.target.value)}
                                className="input w-full"
                            >
                                <option value="pz">Pieza (pz)</option>
                                <option value="orden">Orden</option>
                                <option value="kg">Kilogramo (kg)</option>
                                <option value="litro">Litro</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Precio Base ($)</label>
                            <input
                                type="number"
                                step="0.50"
                                value={precioBase}
                                onChange={e => setPrecioBase(e.target.value)}
                                className="input w-full"
                                placeholder="0.00"
                            />
                            <p className="text-xs text-gray-500 mt-1">Si tiene variantes con precio distinto, deja esto en 0 o pon el precio menor.</p>
                        </div>

                        <div>
                            <label className="label">Tiempo Prep. (min)</label>
                            <input
                                type="number"
                                value={tiempoPreparacion}
                                onChange={e => setTiempoPreparacion(e.target.value)}
                                className="input w-full"
                            />
                        </div>
                    </div>

                    {/* Sección Variantes */}
                    <div className="border-t pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="font-bold text-gray-700">Variantes</h3>
                                <p className="text-sm text-gray-500">Opcional: Sabores, tamaños, etc.</p>
                                <select
                                    className="input text-sm mt-1 py-1"
                                    value={tipoVariante}
                                    onChange={e => setTipoVariante(e.target.value)}
                                >
                                    <option value="">-- Sin tipo específico --</option>
                                    <option value="sabor">Por Sabor</option>
                                    <option value="tamaño">Por Tamaño</option>
                                    <option value="presentacion">Por Presentación</option>
                                </select>
                            </div>
                            <button
                                type="button"
                                onClick={handleAddVarianteRow}
                                className="btn-secondary text-sm flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Agregar Variante
                            </button>
                        </div>

                        <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                            {/* Variantes Existentes (Solo en Edición) */}
                            {itemToEdit?.variantes_menu?.map(variante => (
                                <div key={variante.id} className="flex gap-2 items-center opacity-80 bg-white p-2 border rounded">
                                    <span className="font-bold w-1/3">{variante.nombre}</span>
                                    <span className="text-sm text-gray-600 w-1/4">
                                        ${variante.precio || itemToEdit.precio_base}
                                    </span>
                                    <span className="text-xs text-gray-400 flex-1 truncate">
                                        {variante.descripcion}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteExistingVariante(variante.id)}
                                        className="text-red-500 hover:text-red-700 p-1"
                                        title="Eliminar variante existente"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {/* Nuevas Variantes */}
                            {nuevasVariantes.map((v, idx) => (
                                <div key={idx} className="flex gap-2 items-start animate-slide-up">
                                    <input
                                        placeholder="Nombre (ej. Grande)"
                                        value={v.nombre}
                                        onChange={e => handleUpdateVarianteRow(idx, 'nombre', e.target.value)}
                                        className="input text-sm flex-1"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Precio"
                                        value={v.precio}
                                        onChange={e => handleUpdateVarianteRow(idx, 'precio', e.target.value)}
                                        className="input text-sm w-24"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveVarianteRow(idx)}
                                        className="text-red-500 hover:text-red-700 p-2 mt-0.5"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}

                            {itemToEdit?.variantes_menu?.length === 0 && nuevasVariantes.length === 0 && (
                                <p className="text-center text-sm text-gray-400 italic py-2">
                                    Sin variantes configuradas
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="pt-4 flex gap-3 justify-end border-t bg-white sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {itemToEdit ? 'Guardar Cambios' : 'Crear Platillo'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
