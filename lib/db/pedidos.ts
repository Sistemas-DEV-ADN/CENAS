import { supabase } from '../supabase';
import type { ItemMenuConVariantes } from './menu';

export interface Pedido {
    id: string;
    numero_pedido: string;
    cliente: string;
    origen: 'Facebook' | 'WhatsApp' | 'Instagram' | 'Referido' | 'Otro';
    telefono: string;
    horario_entrega: string; // TIME format "HH:mm"
    anticipo: number;
    restante: number;
    total: number;
    metodo_pago: 'efectivo' | 'transferencia' | 'pendiente';
    estado: 'pendiente' | 'en_preparacion' | 'completado';
    notas?: string;
    fecha_creacion: string;
}

export interface ItemPedido {
    id: string;
    pedido_id: string;
    item_menu_id: string;
    variante_id?: string;
    salsa_id?: string; // Para items con salsa adicional
    cantidad: number;
    precio_unitario: number;
    subtotal: number;
    estado: 'pendiente' | 'preparando' | 'listo';
    notas?: string;
    fecha_creacion: string;
}

export interface ItemPedidoConDetalles extends ItemPedido {
    items_menu: ItemMenuConVariantes;
    variantes_menu?: {
        id: string;
        nombre: string;
        precio?: number;
        descripcion?: string;
    };
    salsa?: {
        id: string;
        nombre: string;
    };
}

export interface PedidoCompleto extends Pedido {
    items_pedido: ItemPedidoConDetalles[];
}

/**
 * Obtiene todos los pedidos
 */
export async function obtenerPedidos() {
    const { data, error } = await supabase
        .from('pedidos')
        .select(`
      *,
      items_pedido (
        *,
        items_menu (*),
        variantes_menu:variantes_menu!items_pedido_variante_id_fkey (*),
        salsa:variantes_menu!items_pedido_salsa_id_fkey (*)
      )
    `)
        .order('horario_entrega');

    if (error) throw error;
    return data as PedidoCompleto[];
}

/**
 * Obtiene un pedido por ID
 */
export async function obtenerPedidoPorId(id: string) {
    const { data, error } = await supabase
        .from('pedidos')
        .select(`
      *,
      items_pedido (
        *,
        items_menu (*),
        variantes_menu:variantes_menu!items_pedido_variante_id_fkey (*),
        salsa:variantes_menu!items_pedido_salsa_id_fkey (*)
      )
    `)
        .eq('id', id)
        .single();

    if (error) throw error;
    return data as PedidoCompleto;
}

/**
 * Crea un nuevo pedido con sus items
 */
export async function crearPedido(
    pedido: Omit<Pedido, 'id' | 'numero_pedido' | 'fecha_creacion'>,
    items: Omit<ItemPedido, 'id' | 'pedido_id' | 'fecha_creacion'>[]
) {
    // Calcular total del pedido
    const total = items.reduce((sum, item) => sum + item.subtotal, 0);

    // Preparar datos para RPC
    const pedidoData = {
        ...pedido,
        total,
        numero_pedido: '', // El trigger lo generará
    };

    // La función RPC espera los items con las claves exactas que definimos en el SQL
    const itemsData = items.map(item => ({
        item_menu_id: item.item_menu_id,
        variante_id: item.variante_id || '', // Enviar string vacío si es undefined para que el SQL lo convierta a NULL
        salsa_id: item.salsa_id || '',
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario,
        subtotal: item.subtotal,
        notas: item.notas || '',
        estado: item.estado
    }));

    const { data: nuevoPedido, error } = await supabase.rpc('crear_pedido_completo', {
        pedido_data: pedidoData,
        items_data: itemsData
    });

    if (error) {
        console.error('Supabase RPC Error:', error);
        throw error;
    }

    // El RPC devuelve el objeto pedido creado, pero queremos devolverlo con las relaciones expandidas
    // así que hacemos una consulta final para obtener el formato PedidoCompleto
    return obtenerPedidoPorId(nuevoPedido.id);
}

/**
 * Actualiza un pedido
 */
export async function actualizarPedido(
    id: string,
    cambios: Partial<Omit<Pedido, 'id' | 'numero_pedido' | 'fecha_creacion'>>
) {
    const { data, error } = await supabase
        .from('pedidos')
        .update(cambios)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as Pedido;
}

/**
 * Elimina un pedido y sus items
 */
export async function eliminarPedido(id: string) {
    const { error } = await supabase
        .from('pedidos')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

/**
 * Obtiene pedidos por estado
 */
export async function obtenerPedidosPorEstado(
    estado: Pedido['estado']
) {
    const { data, error } = await supabase
        .from('pedidos')
        .select(`
      *,
      items_pedido (
        *,
        items_menu (*),
        variantes_menu:variantes_menu!items_pedido_variante_id_fkey (*),
        salsa:variantes_menu!items_pedido_salsa_id_fkey (*)
      )
    `)
        .eq('estado', estado)
        .order('horario_entrega');

    if (error) throw error;
    return data as PedidoCompleto[];
}

/**
 * Actualiza el estado de un item específico
 */
export async function actualizarEstadoItem(
    itemId: string,
    estado: ItemPedido['estado']
) {
    const { data, error } = await supabase
        .from('items_pedido')
        .update({ estado })
        .eq('id', itemId)
        .select()
        .single();

    if (error) throw error;
    return data;
}
