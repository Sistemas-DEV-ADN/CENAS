// Tiempos de preparación en horas antes de la entrega
export const PREPARATION_TIMES = {
    platos_fuertes: 3,
    entradas: 2,
    complementos: 2,
    postres_bebidas: 1
} as const;

export type Categoria = keyof typeof PREPARATION_TIMES;

/**
 * Calcula la hora de inicio de preparación basado en el horario de entrega
 * @param deliveryTime - Hora de entrega en formato "HH:mm"
 * @param category - Categoría del item del menú
 * @returns Date con la hora de inicio de preparación
 */
export function getPreparationStartTime(
    deliveryTime: string,
    category: Categoria
): Date {
    const hoursBeforeDelivery = PREPARATION_TIMES[category];

    // Crear fecha para el 24 de diciembre de 2025
    const deliveryDate = new Date('2025-12-24');
    const [hours, minutes] = deliveryTime.split(':').map(Number);
    deliveryDate.setHours(hours, minutes, 0, 0);

    // Restar las horas de preparación
    const prepTime = new Date(deliveryDate);
    prepTime.setHours(prepTime.getHours() - hoursBeforeDelivery);

    return prepTime;
}

/**
 * Determina el estado de un item basado en el tiempo actual
 * @param prepStartTime - Hora de inicio de preparación
 * @returns Estado: 'preparar_ahora' | 'proximamente' | 'futuro' | 'atrasado'
 */
export function getPreparationStatus(prepStartTime: Date): string {
    const now = new Date();
    const diffMinutes = (prepStartTime.getTime() - now.getTime()) / (1000 * 60);

    if (diffMinutes < -15) return 'atrasado'; // Ya pasó la hora
    if (diffMinutes <= 15) return 'preparar_ahora'; // Dentro de 15 min
    if (diffMinutes <= 60) return 'proximamente'; // 15-60 min
    return 'futuro'; // Más de 60 min
}
