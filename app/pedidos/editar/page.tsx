'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { obtenerPedidoPorId, actualizarPedidoCompleto } from '@/lib/db/pedidos';
import type { ItemPedido, PedidoCompleto } from '@/lib/db/pedidos';
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
    estado?: string;
}

function EditarPedidoContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [pedidoOriginal, setPedidoOriginal] = useState<PedidoCompleto | null>(null);

    // Datos del cliente
    const [cliente, setCliente] = useState('');
    const [origen, setOrigen] = useState<'Facebook' | 'WhatsApp' | 'Instagram' | 'Referido' | 'Otro'>('WhatsApp');
    const [telefono, setTelefono] = useState('');
    const [horario, setHorario] = useState('');
    const [metodoPago, setMetodoPago] = useState<'efectivo' | 'transferencia' | 'pendiente'>('efectivo');
    const [anticipo, setAnticipo] = useState('0');
    const [restante, setRestante] = useState('0');
    const [notas, setNotas] = useState('');
    const [estadoPedido, setEstadoPedido] = useState<'pendiente' | 'en_preparacion' | 'completado'>('pendiente');

    // Carrito de items
    const [carrito, setCarrito] = useState<ItemCarrito[]>([]);

    const totalPedido = carrito.reduce((sum, item) => sum + item.subtotal, 0);

    useEffect(() => {
        if (id) {
            cargarPedido();
        } else {
            router.push('/pedidos');
        }
    }, [id]);

    const cargarPedido = async () => {
        try {
            const data = await obtenerPedidoPorId(id as string);
            setPedidoOriginal(data);

            // Llenar el formulario
            setCliente(data.cliente);
            setOrigen(data.origen);
            setTelefono(data.telefono);
            setHorario(data.horario_entrega);
            setMetodoPago(data.metodo_pago);
            setAnticipo(data.anticipo.toString());
            setRestante(data.restante.toString());
            setNotas(data.notas || '');
            setEstadoPedido(data.estado);

            // Llenar el carrito
            const itemsCarrito: ItemCarrito[] = data.items_pedido.map(item => ({
                itemMenuId: item.item_menu_id,
                nombreItem: item.items_menu.nombre,
                varianteId: item.variante_id,
                nombreVariante: item.variantes_menu?.nombre,
                cantidad: Number(item.cantidad),
                precioUnitario: Number(item.precio_unitario),
                subtotal: Number(item.subtotal),
                salsaId: item.salsa_id,
                nombreSalsa: item.salsa?.nombre,
                notas: item.notas,
                estado: item.estado
            }));
            setCarrito(itemsCarrito);
        } catch (error) {
            console.error('Error al cargar pedido:', error);
            alert('No se pudo cargar la información del pedido.');
        } finally {
            setLoading(false);
        }
    };

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
            notas: item.notas,
            estado: 'pendiente'
        };

        const nuevoCarrito = [...carrito, newItem];
        setCarrito(nuevoCarrito);

        // Recalcular restante
        const nuevoTotal = totalPedido + newItem.subtotal;
        setRestante((nuevoTotal - parseFloat(anticipo || '0')).toFixed(2));
    };

    const eliminarDelCarrito = (index: number) => {
        const newCarrito = carrito.filter((_, i) => i !== index);
        setCarrito(newCarrito);

        // Recalcular restante
        const nuevoTotal = newCarrito.reduce((s, i) => s + i.subtotal, 0);
        setRestante((nuevoTotal - parseFloat(anticipo || '0')).toFixed(2));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (carrito.length === 0) {
            alert('Debes agregar al menos un platillo al pedido');
            return;
        }

        setSaving(true);

        try {
            const items: Omit<ItemPedido, 'id' | 'pedido_id' | 'fecha_creacion'>[] = carrito.map(item => ({
                item_menu_id: item.itemMenuId,
                variante_id: item.varianteId,
                cantidad: item.cantidad,
                notas: item.notas,
                precio_unitario: item.precioUnitario,
                subtotal: item.subtotal,
                salsa_id: item.salsaId,
                estado: (item.estado as any) || 'pendiente'
            }));

            await actualizarPedidoCompleto(
                id as string,
                {
                    cliente,
                    origen,
                    telefono,
                    horario_entrega: horario,
                    anticipo: parseFloat(anticipo),
                    restante: parseFloat(restante),
                    total: totalPedido,
                    metodo_pago: metodoPago,
                    estado: estadoPedido,
                    notas,
                },
                items
            );

            router.push('/pedidos');
        } catch (error: any) {
            console.error('Error al actualizar pedido:', error);
            alert('Error al actualizar el pedido. Por favor intente nuevamente.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
                <p className="text-[var(--text-secondary)]">Cargando datos del pedido...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/pedidos"
                    className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Pedidos
                </Link>
                <div className="flex justify-between items-end">
                    <div>
                        <h2 className="text-4xl font-bold text-[var(--text-primary)]">Editar Pedido #{pedidoOriginal?.numero_pedido}</h2>
                        <p className="text-[var(--text-secondary)] mt-2">
                            Modifica la información del pedido seleccionado
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
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${item.estado === 'listo' ? 'bg-green-100 text-green-700' :
                                            item.estado === 'preparando' ? 'bg-blue-100 text-blue-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {item.estado || 'pendiente'}
                                        </span>
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

                        <div className="flex justify-end pt-4 border-t border-gray-100 mt-4">
                            <div className="text-right">
                                <span className="text-gray-500 mr-4">Total Pedido:</span>
                                <span className="text-2xl font-bold text-[var(--primary)]">${totalPedido.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Pagos y Estado */}
                <div className="card p-6 animate-slide-up" style={{ animationDelay: '200ms' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-semibold mb-4">Información de Pago</h3>
                            <div className="space-y-4">
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

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="label">Anticipo ($)</label>
                                        <input
                                            type="number"
                                            step="10"
                                            className="input-field"
                                            value={anticipo}
                                            onChange={(e) => {
                                                setAnticipo(e.target.value);
                                                const valorAnticipo = parseFloat(e.target.value) || 0;
                                                setRestante((totalPedido - valorAnticipo).toFixed(2));
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="label">Restante ($)</label>
                                        <input
                                            type="number"
                                            className="input-field bg-gray-50"
                                            value={restante}
                                            readOnly
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-xl font-semibold mb-4">Estado del Pedido</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="label">Estado Actual</label>
                                    <select
                                        className="input-field"
                                        value={estadoPedido}
                                        onChange={(e) => setEstadoPedido(e.target.value as any)}
                                        required
                                    >
                                        <option value="pendiente">Pendiente</option>
                                        <option value="en_preparacion">En Preparación</option>
                                        <option value="completado">Completado</option>
                                    </select>
                                    <p className="text-[10px] text-gray-400 mt-2">
                                        Nota: El estado se sincroniza automáticamente al actualizar items desde Cocina.
                                    </p>
                                </div>
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
                        placeholder="Instrucciones especiales..."
                    />
                </div>

                {/* Botones */}
                <div className="flex gap-4 justify-end pt-4 pb-12">
                    <Link href="/pedidos" className="btn-outline">
                        Cancelar
                    </Link>
                    <button
                        type="submit"
                        className="btn-accent text-lg px-8"
                        disabled={saving || carrito.length === 0}
                    >
                        {saving ? 'Guardando Cambios...' : 'Actualizar Pedido'}
                    </button>
                </div>
            </form>

            <MenuSelector
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                onSelect={handleAddItem}
            />
        </div>
    );
}

export default function EditarPedidoPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
                <p className="text-[var(--text-secondary)]">Cargando aplicación...</p>
            </div>
        }>
            <EditarPedidoContent />
        </Suspense>
    );
}
