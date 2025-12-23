'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { crearPedido } from '@/lib/db/pedidos';
import type { ItemPedido } from '@/lib/db/pedidos';
import MenuSelector from '@/app/components/MenuSelector';

interface ItemCarrito {
    itemMenuId: string;
    nombreItem: string;
    varianteId?: string;
    nombreVariante?: string;
    cantidad: number;
    precioUnitario: number;
    subtotal: number;
    salsaId?: string;
    nombreSalsa?: string;
    notas?: string;
}

export default function NuevoPedidoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Datos del cliente
    const [cliente, setCliente] = useState('');
    const [origen, setOrigen] = useState<'Facebook' | 'WhatsApp' | 'Instagram' | 'Referido' | 'Otro'>('WhatsApp');
    const [telefono, setTelefono] = useState('');
    const [horario, setHorario] = useState('');
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'pendiente'>('efectivo');
    const [anticipo, setAnticipo] = useState('0');
    // El restante ya no debería ser manual idealmente, pero lo dejamos editable
    const [restante, setRestante] = useState('0');
    const [notas, setNotas] = useState('');

    // Carrito de items
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

    const totalPedido = carrito.reduce((sum, item) => sum + item.subtotal, 0);

    const handleAddItem = (item: any) => {
        const newItem: ItemCarrito = {
            itemMenuId: item.itemMenuId,
            nombreItem: item.nombreItem,
            varianteId: item.varianteId,
            nombreVariante: item.nombreVariante,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.precioUnitario * item.cantidad,
            salsaId: item.salsaId,
            nombreSalsa: item.nombreSalsa,
            notas: item.notas
        };

        setCarrito([...carrito, newItem]);
        // Actualizar restante sugerido (Total - Anticipo)
        // Esto es solo una sugerencia UX básica
        const nuevoTotal = totalPedido + newItem.subtotal;
        setRestante((nuevoTotal - parseFloat(anticipo || '0')).toFixed(2));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (carrito.length === 0) {
            alert('Debes agregar al menos un platillo al pedido');
            return;
        }

        setLoading(true);

        try {
            const items: Omit<ItemPedido, 'id' | 'pedido_id' | 'fecha_creacion'>[] = carrito.map(item => ({
                item_menu_id: item.itemMenuId,
                variante_id: item.varianteId,
                cantidad: item.cantidad,
                notas: item.notas,
                precio_unitario: item.precioUnitario,
                subtotal: item.subtotal,
                salsa_id: item.salsaId,
                estado: 'pendiente'
            }));

            await crearPedido(
                {
                    cliente,
                    origen,
                    telefono,
                    horario_entrega: horario,
                    anticipo: parseFloat(anticipo),
                    restante: parseFloat(restante),
                    total: totalPedido,
                    metodo_pago: metodoPago,
                    estado: 'pendiente',
                    notas,
                },
                items
            );

            router.push('/pedidos');
        } catch (error: any) {
            console.error('Error al crear pedido:', error);
            alert('Error al crear el pedido. Por favor intente nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    const eliminarDelCarrito = (index: number) => {
        const itemToRemove = carrito[index];
        const newCarrito = carrito.filter((_, i) => i !== index);
        setCarrito(newCarrito);

        // Recalcular restante
        const nuevoTotal = newCarrito.reduce((s, i) => s + i.subtotal, 0);
        setRestante((nuevoTotal - parseFloat(anticipo || '0')).toFixed(2));
    };

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-bold">Nuevo Pedido</h2>
                        <p className="text-[var(--text-secondary)] mt-2">
                            Registra un nuevo pedido para el 24 de diciembre
                        </p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Datos del Cliente */}
                <div className="card p-6 animate-slide-up">
                    <h3 className="text-xl font-semibold mb-4">Datos del Cliente</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="label">Nombre del Cliente *</label>
                            <input
                                type="text"
                                className="input-field"
                                value={cliente}
                                onChange={(e) => setCliente(e.target.value)}
                                required
                                placeholder="Juan Pérez"
                            />
                        </div>

                        <div>
                            <label className="label">Teléfono *</label>
                            <input
                                type="tel"
                                className="input-field"
                                value={telefono}
                                onChange={(e) => setTelefono(e.target.value)}
                                required
                                placeholder="55 1234 5678"
                            />
                        </div>

                        <div>
                            <label className="label">Origen del Contacto *</label>
                            <select
                                className="input-field"
                                value={origen}
                                onChange={(e) => setOrigen(e.target.value as any)}
                                required
                            >
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Facebook">Facebook</option>
                                <option value="Instagram">Instagram</option>
                                <option value="Referido">Referido</option>
                                <option value="Otro">Otro</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Horario de Entrega *</label>
                            <input
                                type="time"
                                className="input-field"
                                value={horario}
                                onChange={(e) => setHorario(e.target.value)}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Selector de Menú */}
                <div className="card p-6 animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-semibold">Platillos del Menú</h3>
                        <button
                            type="button"
                            className="btn-primary flex items-center gap-2"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Platillo
                        </button>
                    </div>

                    {carrito.length === 0 ? (
                        <div className="text-center py-8 text-[var(--text-secondary)] bg-gray-50 rounded-xl border border-dashed border-gray-200">
                            No hay platillos en el pedido.<br />Haz clic en "Agregar Platillo" para comenzar.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {carrito.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-200 transition-all"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-lg text-[var(--primary)]">{item.cantidad}x</span>
                                            <span className="font-semibold text-lg">{item.nombreItem}</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2 text-sm text-[var(--text-secondary)] mt-1">
                                            {item.nombreVariante && (
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-100">
                                                    {item.nombreVariante}
                                                </span>
                                            )}
                                            {item.nombreSalsa && (
                                                <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full border border-orange-100">
                                                    + Salsa: {item.nombreSalsa}
                                                </span>
                                            )}
                                        </div>
                                        {item.notas && (
                                            <div className="text-sm text-gray-400 italic mt-1">
                                                "{item.notas}"
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="font-bold text-lg">${item.subtotal.toFixed(2)}</span>
                                        <button
                                            type="button"
                                            onClick={() => eliminarDelCarrito(index)}
                                            className="text-gray-400 hover:text-[var(--danger)] p-2 rounded-full hover:bg-red-50 transition-colors"
                                        >
                                            <X className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* Totalizador del Carrito */}
                            <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                                <div className="text-right">
                                    <span className="text-gray-500 mr-4">Total Pedido:</span>
                                    <span className="text-2xl font-bold text-[var(--primary)]">${totalPedido.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagos */}
                <div className="card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <h3 className="text-xl font-semibold mb-4">Información de Pago</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="label">Método de Pago *</label>
                            <select
                                className="input-field"
                                value={metodoPago}
                                onChange={(e) => setMetodoPago(e.target.value as any)}
                                required
                            >
                                <option value="efectivo">Efectivo</option>
                                <option value="transferencia">Transferencia</option>
                                <option value="pendiente">Pendiente</option>
                            </select>
                        </div>

                        <div>
                            <label className="label">Anticipo (Pesos)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    step="10"
                                    min="0"
                                    className="input-field pl-8"
                                    value={anticipo}
                                    onChange={(e) => {
                                        setAnticipo(e.target.value);
                                        // Calcular restante automático
                                        const valorAnticipo = parseFloat(e.target.value) || 0;
                                        setRestante((totalPedido - valorAnticipo).toFixed(2));
                                    }}
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="label">Restante (Calculado)</label>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                                <input
                                    type="number"
                                    step="10"
                                    className="input-field pl-8 bg-gray-50"
                                    value={restante}
                                    readOnly
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Notas */}
                <div className="card p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
                    <h3 className="text-xl font-semibold mb-4">Notas Adicionales</h3>
                    <textarea
                        className="input-field min-h-[100px]"
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Instrucciones especiales para el pedido en general..."
                    />
                </div>

                {/* Botones */}
                <div className="flex gap-4 justify-end pt-4">
                    <Link href="/" className="btn-outline">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        className="btn-accent text-lg px-8"
                        disabled={loading || !cliente || !telefono || !horario || carrito.length === 0}
                    >
                        {loading ? 'Guardando...' : 'Guardar Pedido'}
                    </button>
                </div>
            </form>

            {/* Modal de Selección */}
            <MenuSelector
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onSelect={handleAddItem}
            />
        </div>
    );
}
