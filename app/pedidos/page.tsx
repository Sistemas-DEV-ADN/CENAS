'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, Phone, User, MapPin, Edit, Trash2 } from 'lucide-react';
import { obtenerPedidos, eliminarPedido } from '@/lib/db/pedidos';
import { supabase } from '@/lib/supabase';
import type { PedidoCompleto } from '@/lib/db/pedidos';

export default function PedidosPage() {
    const [pedidos, setPedidos] = useState<PedidoCompleto[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [orden, setOrden] = useState<'recientes' | 'entrega'>('recientes');

    useEffect(() => {
        cargarPedidos();

        // Suscribirse a cambios en tiempo real
        const channel = supabase
            .channel('pedidos_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*', // Escuchar INSERT, UPDATE, DELETE
                    schema: 'public',
                    table: 'pedidos'
                },
                (payload) => {
                    console.log('Cambio detectado en pedidos:', payload);
                    cargarPedidos();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const cargarPedidos = async () => {
        try {
            const data = await obtenerPedidos();
            setPedidos(data);
        } catch (error) {
            console.error('Error al cargar pedidos:', JSON.stringify(error, null, 2));
            alert(`Error al cargar los pedidos: ${error instanceof Error ? error.message : 'Verifica la consola'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: string, numeroPedido: string) => {
        if (!confirm(`¿Estás seguro de eliminar el pedido ${numeroPedido}?`)) {
            return;
        }

        try {
            await eliminarPedido(id);
            setPedidos(pedidos.filter(p => p.id !== id));
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            alert('Error al eliminar el pedido.');
        }
    };

    const generarLinkWhatsApp = (pedido: PedidoCompleto) => {
        const mensaje = `Hola ${pedido.cliente}, confirmamos tu pedido de Hnos. Pienda para las ${pedido.horario_entrega}. Total: $${pedido.total}. ¡Gracias por tu preferencia!`;
        return `https://wa.me/52${pedido.telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`;
    };

    const getBadgeEstado = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return 'badge-warning';
            case 'en_preparacion':
                return 'badge-primary';
            case 'completado':
                return 'badge-success';
            default:
                return 'badge-primary';
        }
    };

    const getTextoEstado = (estado: string) => {
        switch (estado) {
            case 'pendiente':
                return 'Pendiente';
            case 'en_preparacion':
                return 'En Preparación';
            case 'completado':
                return 'Completado';
            default:
                return estado;
        }
    };

    // Lógica de filtrado y ordenamiento
    const pedidosProcesados = pedidos
        .filter(pedido =>
            pedido.cliente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            pedido.numero_pedido.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (orden === 'recientes') {
                // Ordenar por fecha de creación (descendente)
                return new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime();
            } else {
                // Ordenar por horario de entrega (ascendente)
                return a.horario_entrega.localeCompare(b.horario_entrega);
            }
        });

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-xl text-[var(--text-secondary)]">Cargando pedidos...</div>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-bold">Pedidos</h2>
                        <p className="text-[var(--text-secondary)] mt-2">
                            {pedidosProcesados.length} {pedidosProcesados.length === 1 ? 'pedido encontrado' : 'pedidos encontrados'}
                        </p>
                    </div>
                    <Link href="/nuevo-pedido" className="btn-accent self-start sm:self-auto">
                        + Nuevo Pedido
                    </Link>
                </div>

                {/* Controles: Búsqueda y Ordenamiento */}
                <div className="mt-6 flex flex-col md:flex-row gap-4 justify-between items-end md:items-center">
                    <div className="w-full md:w-auto flex-1">
                        <input
                            type="text"
                            placeholder="Buscar por nombre de cliente o número..."
                            className="input-field max-w-md w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => setOrden('recientes')}
                            className={`px-6 py-3 rounded-lg text-[15px] font-semibold transition-colors border-2 ${orden === 'recientes'
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                                }`}
                        >
                            🆕 Recientes
                        </button>
                        <button
                            onClick={() => setOrden('entrega')}
                            className={`px-6 py-3 rounded-lg text-[15px] font-semibold transition-colors border-2 ${orden === 'entrega'
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                                }`}
                        >
                            🕒 Por Entrega
                        </button>
                    </div>
                </div>
            </div>

            {/* Lista de Pedidos */}
            {pedidos.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-6xl mb-4">📋</div>
                    <h3 className="text-2xl font-semibold mb-2">No hay pedidos registrados</h3>
                    <p className="text-[var(--text-secondary)] mb-6">
                        Comienza creando tu primer pedido
                    </p>
                    <Link href="/nuevo-pedido" className="btn-accent inline-block">
                        Crear Primer Pedido
                    </Link>
                </div>
            ) : pedidosProcesados.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-500">No se encontraron pedidos con "{searchTerm}"</p>
                    <button
                        onClick={() => setSearchTerm('')}
                        className="text-[var(--primary)] hover:underline mt-2"
                    >
                        Limpiar búsqueda
                    </button>
                </div>
            ) : (
                <div className="space-y-4">
                    {pedidosProcesados.map((pedido, index) => (
                        <div
                            key={pedido.id}
                            className="card p-6 hover:shadow-lg transition-all animate-slide-up"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[var(--accent)]/10 text-[var(--accent)] font-bold text-xl px-4 py-2 rounded-lg">
                                        #{pedido.numero_pedido}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <User className="w-4 h-4 text-[var(--text-secondary)]" />
                                            <span className="font-semibold text-lg">{pedido.cliente}</span>

                                            {/* Botón de WhatsApp */}
                                            <a
                                                href={generarLinkWhatsApp(pedido)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="ml-2 inline-flex items-center gap-1 text-[var(--success)] bg-[var(--success)]/10 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[var(--success)]/20 transition-colors"
                                                title="Enviar notificación por WhatsApp"
                                            >
                                                <Phone className="w-4 h-4" />
                                                Notificar
                                            </a>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                                            <div className="flex items-center gap-1">
                                                <Phone className="w-3 h-3" />
                                                {pedido.telefono}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {pedido.origen}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`badge ${getBadgeEstado(pedido.estado)}`}>
                                        {getTextoEstado(pedido.estado)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-4 border-t border-[var(--border-color)]">
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                                        <Clock className="w-4 h-4" />
                                        <span className="font-medium text-[var(--text-primary)]">
                                            {pedido.horario_entrega}
                                        </span>
                                        <span className="text-sm">horario de entrega</span>
                                    </div>
                                    <div className="text-sm text-[var(--text-secondary)]">
                                        {pedido.items_pedido?.length || 0} item{(pedido.items_pedido?.length || 0) !== 1 ? 's' : ''}
                                    </div>
                                    {(pedido.anticipo > 0 || pedido.restante > 0) && (
                                        <div className="text-sm">
                                            <span className="text-[var(--text-secondary)]">Anticipo:</span>{' '}
                                            <span className="font-medium text-[var(--success)]">${pedido.anticipo}</span>
                                            {' / '}
                                            <span className="text-[var(--text-secondary)]">Restante:</span>{' '}
                                            <span className="font-medium text-[var(--warning)]">${pedido.restante}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => alert('Función de editar - En desarrollo')}
                                        className="btn-outline text-sm py-1 px-3 flex items-center gap-1"
                                    >
                                        <Edit className="w-3 h-3" />
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => handleEliminar(pedido.id, pedido.numero_pedido)}
                                        className="btn-danger text-sm py-1 px-3 flex items-center gap-1"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            {pedido.notas && (
                                <div className="mt-4 p-3 bg-[var(--bg-primary)] rounded-lg text-sm">
                                    <span className="font-medium">Notas:</span> {pedido.notas}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
