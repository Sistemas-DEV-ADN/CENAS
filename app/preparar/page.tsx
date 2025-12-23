'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, ChefHat, Clock } from 'lucide-react';
import { obtenerPedidos, actualizarEstadoItem } from '@/lib/db/pedidos';
import { getPreparationStartTime, getPreparationStatus, PREPARATION_TIMES, type Categoria } from '@/lib/utils/preparation-times';


interface ItemPreparacion {
    id: string; // ID del item_pedido para actualizar
    pedidoNumero: string;
    cliente: string;
    itemNombre: string;
    variante?: string;
    cantidad: number;
    categoria: Categoria;
    horarioEntrega: string;
    horaPreparacion: Date;
    estado: 'pendiente' | 'preparando' | 'listo'; // Estado del item, no del tiempo
}

export default function PrepararPage() {
    const [vista, setVista] = useState<'categorias' | 'timeline'>('categorias');
    const [items, setItems] = useState<ItemPreparacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [mostrarTerminados, setMostrarTerminados] = useState(false); // Estado para toggle

    useEffect(() => {
        cargarItems();
        // Actualizar cada minuto para refrescar los estados
        const interval = setInterval(cargarItems, 60000);
        return () => clearInterval(interval);
    }, []);

    const cargarItems = async () => {
        try {
            const pedidos = await obtenerPedidos();
            const itemsPrep: ItemPreparacion[] = [];

            pedidos.forEach(pedido => {
                pedido.items_pedido?.forEach(item => {
                    const categoria = item.items_menu.categoria as Categoria;
                    const horaPrep = getPreparationStartTime(pedido.horario_entrega, categoria);
                    // Usamos el estado real de la BD, no calculado
                    // const estado = getPreparationStatus(horaPrep); 

                    itemsPrep.push({
                        id: item.id,
                        pedidoNumero: pedido.numero_pedido,
                        cliente: pedido.cliente,
                        itemNombre: item.items_menu.nombre,
                        variante: item.variantes_menu?.nombre,
                        cantidad: item.cantidad,
                        categoria,
                        horarioEntrega: pedido.horario_entrega,
                        horaPreparacion: horaPrep,
                        estado: item.estado || 'pendiente',
                    });
                });
            });

            // Ordenar por hora de preparación
            itemsPrep.sort((a, b) => a.horaPreparacion.getTime() - b.horaPreparacion.getTime());
            setItems(itemsPrep);
        } catch (error) {
            console.error('Error al cargar items:', error);
        } finally {
            setLoading(false);
        }
    };



    const getCategoriaTexto = (categoria: Categoria) => {
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

    const itemsPorCategoria = (categoria: Categoria) => {
        return items.filter(item => {
            if (item.categoria !== categoria) return false;
            // Ocultar terminados a menos que el toggle esté activo
            if (!mostrarTerminados && item.estado === 'listo') return false;
            return true;
        });
    };

    // Items filtrados para la vista de timeline
    const itemsTimeline = items.filter(item =>
        mostrarTerminados || item.estado !== 'listo'
    );

    // Auto-ordenar: Pendientes arriba, Listos abajo (si se muestran)
    const itemsOrdenados = [...itemsTimeline].sort((a, b) => {
        // Primero prioridad por estado
        const weight = { 'preparar_ahora': 0, 'atrasado': 1, 'proximamente': 2, 'futuro': 3 };
        const statusA = getPreparationStatus(a.horaPreparacion);
        const statusB = getPreparationStatus(b.horaPreparacion);

        if (weight[statusA as keyof typeof weight] !== weight[statusB as keyof typeof weight]) {
            return weight[statusA as keyof typeof weight] - weight[statusB as keyof typeof weight];
        }

        // Luego por hora
        return a.horaPreparacion.getTime() - b.horaPreparacion.getTime();
    });

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    };

    const toggleEstado = async (itemId: string, estadoActual: string) => {
        let nuevoEstado: 'pendiente' | 'preparando' | 'listo' = 'pendiente';

        if (estadoActual === 'pendiente') nuevoEstado = 'preparando';
        else if (estadoActual === 'preparando') nuevoEstado = 'listo';
        else if (estadoActual === 'listo') nuevoEstado = 'pendiente'; // Ciclo para corregir errores

        try {
            await actualizarEstadoItem(itemId, nuevoEstado);
            // La actualización en tiempo real o el intervalo refrescarán la UI
            // Pero actualizamos localmente para feedback inmediato
            setItems(prev => prev.map(item =>
                item.id === itemId ? { ...item, estado: nuevoEstado } : item
            ));
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            alert('Error al actualizar el estado del item');
        }
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="text-xl text-[var(--text-secondary)]">Cargando items para preparar...</div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto animate-fade-in pb-20">
            {/* Header */}
            <div className="mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al inicio
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-4xl font-bold flex items-center gap-3">
                            <ChefHat className="w-10 h-10 text-[var(--accent)]" />
                            Cocina
                        </h2>
                        <p className="text-[var(--text-secondary)] mt-2">
                            Control de producción por tiempos de entrega
                        </p>
                    </div>

                    {/* Toggle Vista */}
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                        {/* Filtro Terminados */}
                        <label className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 rounded-lg border border-[var(--border-color)]">
                            <input
                                type="checkbox"
                                checked={mostrarTerminados}
                                onChange={(e) => setMostrarTerminados(e.target.checked)}
                                className="w-4 h-4 text-[var(--primary)] rounded focus:ring-[var(--primary)]"
                            />
                            <span className="text-sm font-medium text-gray-700">Ver Terminados</span>
                        </label>

                        <div className="flex gap-2 bg-white p-1 rounded-lg border border-[var(--border-color)] self-start">
                            <button
                                onClick={() => setVista('categorias')}
                                className={`px-4 py-2 rounded-md transition-all font-medium ${vista === 'categorias'
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                                    }`}
                            >
                                Por Categoría
                            </button>
                            <button
                                onClick={() => setVista('timeline')}
                                className={`px-4 py-2 rounded-md transition-all font-medium ${vista === 'timeline'
                                    ? 'bg-[var(--primary)] text-white'
                                    : 'text-[var(--text-secondary)] hover:bg-[var(--bg-primary)]'
                                    }`}
                            >
                                Cronología
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {items.length === 0 ? (
                <div className="card p-12 text-center">
                    <div className="text-6xl mb-4">👨‍🍳</div>
                    <h3 className="text-2xl font-semibold mb-2">Todo limpio por ahora</h3>
                    <p className="text-[var(--text-secondary)]">
                        No hay items pendientes de preparación
                    </p>
                </div>
            ) : (
                <>
                    {vista === 'categorias' ? (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {(['platos_fuertes', 'entradas', 'complementos', 'postres_bebidas'] as Categoria[]).map(
                                (categoria, idx) => {
                                    const itemsCategoria = itemsPorCategoria(categoria);
                                    const horasAntes = PREPARATION_TIMES[categoria];

                                    return (
                                        <div
                                            key={categoria}
                                            className="card p-0 overflow-hidden animate-slide-up bg-white"
                                            style={{ animationDelay: `${idx * 100}ms` }}
                                        >
                                            <div className="p-4 bg-gray-50 border-b flex items-center justify-between">
                                                <h3 className="text-lg font-bold text-[var(--primary)] uppercase tracking-wide">
                                                    {getCategoriaTexto(categoria)}
                                                </h3>
                                                <span className="badge badge-primary bg-white shadow-sm">
                                                    Iniciar {horasAntes}h antes
                                                </span>
                                            </div>

                                            {itemsCategoria.length === 0 ? (
                                                <div className="p-8 text-center text-[var(--text-secondary)] italic">
                                                    Nada pendiente en esta estación
                                                </div>
                                            ) : (
                                                <div className="divide-y divide-gray-100">
                                                    {itemsCategoria.map((item, index) => (
                                                        <div
                                                            key={`${item.id}-${index}`}
                                                            className={`p-4 transition-colors ${item.estado === 'listo' ? 'bg-green-50/50 opacity-60' :
                                                                item.estado === 'preparando' ? 'bg-blue-50' : 'hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <div className="flex justify-between items-start gap-3">
                                                                {/* Info Principal */}
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-200 text-gray-700">
                                                                            #{item.pedidoNumero}
                                                                        </span>
                                                                        <span className="text-sm text-gray-500 truncate max-w-[150px]">
                                                                            {item.cliente}
                                                                        </span>
                                                                    </div>

                                                                    <div className="text-lg font-bold text-gray-800 leading-tight">
                                                                        {item.cantidad}x {item.itemNombre}
                                                                    </div>
                                                                    {item.variante && (
                                                                        <div className="text-sm text-[var(--accent)] font-medium mt-0.5">
                                                                            {item.variante}
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                {/* Tiempos */}
                                                                <div className="text-right min-w-[80px]">
                                                                    <div className="flex flex-col items-end">
                                                                        <span className="text-xs text-gray-400 uppercase">Iniciar</span>
                                                                        <span className={`font-bold text-lg ${getPreparationStatus(item.horaPreparacion) === 'atrasado'
                                                                            && item.estado === 'pendiente' ? 'text-red-500 animate-pulse' : 'text-gray-700'
                                                                            }`}>
                                                                            {formatTime(item.horaPreparacion)}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Footer Actions */}
                                                            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100 border-dashed">
                                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                                    <span>Entrega:</span>
                                                                    <strong className="text-gray-600">{item.horarioEntrega}</strong>
                                                                </div>

                                                                <button
                                                                    onClick={() => toggleEstado(item.id, item.estado)}
                                                                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 ${item.estado === 'pendiente'
                                                                        ? 'bg-white border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                                                                        : item.estado === 'preparando'
                                                                            ? 'bg-blue-100 border-blue-200 text-blue-700 hover:bg-blue-200'
                                                                            : 'bg-green-100 border-green-200 text-green-700 hover:bg-green-200'
                                                                        }`}
                                                                >
                                                                    <div className={`w-2 h-2 rounded-full ${item.estado === 'pendiente' ? 'bg-gray-400' :
                                                                        item.estado === 'preparando' ? 'bg-blue-500 animate-pulse' :
                                                                            'bg-green-500'
                                                                        }`} />
                                                                    {item.estado === 'pendiente' && 'MARCAR INICIO'}
                                                                    {item.estado === 'preparando' && 'FINALIZAR'}
                                                                    {item.estado === 'listo' && 'TERMINADO'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                            )}
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-4">
                            {itemsOrdenados.map((item, index) => (
                                <div
                                    key={`${item.id}-${index}`}
                                    className={`card p-4 transition-all hover:shadow-md border-l-4 ${item.estado === 'listo' ? 'border-l-green-500 opacity-70' :
                                        item.estado === 'preparando' ? 'border-l-blue-500 bg-blue-50/30' :
                                            getPreparationStatus(item.horaPreparacion) === 'atrasado' ? 'border-l-red-500' :
                                                'border-l-gray-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        {/* Hora Inicio Grande */}
                                        <div className="text-center min-w-[70px]">
                                            <span className="block text-xs text-gray-400 uppercase tracking-wider">Iniciar</span>
                                            <span className="block text-2xl font-bold text-gray-700">{formatTime(item.horaPreparacion)}</span>
                                        </div>

                                        {/* Detalles */}
                                        <div className="flex-1 border-l pl-4 border-gray-100">
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="badge badge-primary text-[10px] px-2 py-0.5">
                                                    {getCategoriaTexto(item.categoria)}
                                                </span>
                                                <span className="text-xs font-mono text-gray-400">#{item.pedidoNumero}</span>
                                            </div>
                                            <h4 className="text-lg font-bold text-gray-800">
                                                {item.cantidad}x {item.itemNombre}
                                                {item.variante && <span className="text-[var(--accent)] font-normal ml-1">({item.variante})</span>}
                                            </h4>
                                            <p className="text-sm text-gray-500">{item.cliente}</p>
                                        </div>

                                        {/* Botón Acción */}
                                        <button
                                            onClick={() => toggleEstado(item.id, item.estado)}
                                            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${item.estado === 'pendiente' ? 'bg-gray-100 text-gray-400 hover:bg-blue-100 hover:text-blue-600' :
                                                item.estado === 'preparando' ? 'bg-blue-500 text-white shadow-lg hover:bg-blue-600' :
                                                    'bg-green-500 text-white shadow-sm'
                                                }`}
                                            title="Cambiar Estado"
                                        >
                                            {item.estado === 'pendiente' && <div className="w-4 h-4 rounded-sm border-2 border-current" />}
                                            {item.estado === 'preparando' && <Clock className="w-6 h-6 animate-pulse" />}
                                            {item.estado === 'listo' && <div className="text-xl">✓</div>}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
