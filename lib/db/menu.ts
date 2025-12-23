import { supabase } from '../supabase';

export interface ItemMenu {
    id: string;
    nombre: string;
    categoria: 'entradas' | 'platos_fuertes' | 'postres_bebidas';
    unidad_medida: string; // 'pz', 'kg', 'litro', 'tamaño'
    precio_base?: number; // Puede ser null si el precio depende de la variante
    tipo_variante?: string; // 'sabor', 'tamaño', 'salsa', 'relleno', null
    activo: boolean;
    tiempo_preparacion: number; // en minutos
    fecha_creacion: string;
}

export interface VarianteMenu {
    id: string;
    item_menu_id: string;
    nombre: string;
    precio?: number; // Precio específico de la variante (opcional)
    descripcion?: string;
    fecha_creacion: string;
}

export interface ItemMenuConVariantes extends ItemMenu {
    variantes_menu: VarianteMenu[];
}

/**
 * Obtiene todos los items del menú activos con sus variantes
 */
export async function obtenerItemsMenu(soloActivos = true) {
    let query = supabase
        .from('items_menu')
        .select('*, variantes_menu(*)');

    if (soloActivos) {
        query = query.eq('activo', true);
    }

    const { data, error } = await query.order('categoria').order('nombre');

    if (error) throw error;
    return data as ItemMenuConVariantes[];
}

/**
 * Obtiene items del menú por categoría
 */
export async function obtenerItemsPorCategoria(
    categoria: ItemMenu['categoria']
) {
    const { data, error } = await supabase
        .from('items_menu')
        .select('*, variantes_menu(*)')
        .eq('categoria', categoria)
        .eq('activo', true)
        .order('nombre');

    if (error) throw error;
    return data as ItemMenuConVariantes[];
}

/**
 * Obtiene las variantes de salsas (para items que las necesitan)
 */
export async function obtenerSalsas() {
    const { data, error } = await supabase
        .from('items_menu')
        .select('*, variantes_menu(*)')
        .eq('nombre', 'Salsas')
        .single();

    if (error) throw error;
    return data?.variantes_menu as VarianteMenu[] || [];
}

/**
 * Calcula el precio de un item con su variante
 */
export function calcularPrecioItem(
    item: ItemMenuConVariantes,
    variante?: VarianteMenu
): number {
    // Si la variante tiene precio, usar ese
    if (variante?.precio) {
        return variante.precio;
    }

    // Si no, usar el precio base del item
    return item.precio_base || 0;
}

/**
 * Agrega un nuevo item al menú
 */
export async function agregarItemMenu(
    item: Omit<ItemMenu, 'id' | 'fecha_creacion'>
) {
    const { data, error } = await supabase
        .from('items_menu')
        .insert(item)
        .select()
        .single();

    if (error) throw error;
    return data as ItemMenu;
}

/**
 * Actualiza un item del menú
 */
export async function actualizarItemMenu(
    id: string,
    cambios: Partial<Omit<ItemMenu, 'id' | 'fecha_creacion'>>
) {
    const { data, error } = await supabase
        .from('items_menu')
        .update(cambios)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data as ItemMenu;
}

/**
 * Agrega una variante a un item del menú
 */
export async function agregarVariante(
    variante: Omit<VarianteMenu, 'id' | 'fecha_creacion'>
) {
    const { data, error } = await supabase
        .from('variantes_menu')
        .insert(variante)
        .select()
        .single();

    if (error) throw error;
    return data as VarianteMenu;
}

/**
 * Elimina una variante
 */
export async function eliminarVariante(id: string) {
    const { error } = await supabase
        .from('variantes_menu')
        .delete()
        .eq('id', id);

    if (error) throw error;
}
