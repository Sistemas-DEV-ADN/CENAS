import type { PedidoCompleto } from '@/lib/db/pedidos';

export const generarMensajePedido = (pedido: PedidoCompleto): string => {
    // Construir lista de platillos
    let platillosTexto = '';
    pedido.items_pedido.forEach((item, index) => {
        platillosTexto += `\n${index + 1}. ${Number(item.cantidad)}x ${item.items_menu.nombre}`;

        // Agregar variante si existe
        if (item.variantes_menu) {
            platillosTexto += ` (${item.variantes_menu.nombre})`;
        }

        // Agregar salsa si existe
        if (item.salsa) {
            platillosTexto += `\n   + Salsa: ${item.salsa.nombre}`;
        }

        // Agregar notas si existen
        if (item.notas) {
            platillosTexto += `\n   📝 ${item.notas}`;
        }

        // Agregar precio
        platillosTexto += `\n   $${Number(item.subtotal).toFixed(2)}`;
    });

    // Construir mensaje completo
    let mensaje = `🎄 *PEDIDO CONFIRMADO* 🎄\n\n`;
    mensaje += `📋 *Pedido #${pedido.numero_pedido}*\n`;
    mensaje += `👤 Cliente: ${pedido.cliente}\n`;
    mensaje += `📱 Teléfono: ${pedido.telefono}\n`;
    mensaje += `🕐 Horario de Entrega: *${pedido.horario_entrega}*\n`;
    mensaje += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `🎁 *TUS PLATILLOS:*${platillosTexto}`;
    mensaje += `\n━━━━━━━━━━━━━━━━━━━━\n`;
    mensaje += `\n💰 *TOTAL: $${Number(pedido.total).toFixed(2)}*`;

    if (pedido.anticipo > 0) {
        mensaje += `\n✅ Anticipo: $${Number(pedido.anticipo).toFixed(2)}`;
        mensaje += `\n⏳ Restante: $${Number(pedido.restante).toFixed(2)}`;
    }

    if (pedido.notas) {
        mensaje += `\n\n📋 *Notas del pedido:*\n${pedido.notas}`;
    }

    mensaje += `\n\n✨ ¡Gracias por tu preferencia! ✨`;
    mensaje += `\n\n_Hnos. Pienda - Cenas de Fin de Año 2024_`;

    return mensaje;
};

export const generarLinkWhatsApp = (pedido: PedidoCompleto): string => {
    const mensaje = generarMensajePedido(pedido);
    const numeroLimpio = pedido.telefono.replace(/\D/g, '');
    return `https://wa.me/52${numeroLimpio}?text=${encodeURIComponent(mensaje)}`;
};
