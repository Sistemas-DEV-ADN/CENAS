'use client';

import { forwardRef } from 'react';
import type { PedidoCompleto } from '@/lib/db/pedidos';

interface OrderReceiptProps {
    pedido: PedidoCompleto;
}

const OrderReceipt = forwardRef<HTMLDivElement, OrderReceiptProps>(({ pedido }, ref) => {
    return (
        <div
            ref={ref}
            style={{
                width: '600px',
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                padding: '40px',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                color: '#f1f5f9',
                boxSizing: 'border-box',
                position: 'relative',
                overflow: 'hidden'
            }}
        >
            {/* Decorative snowflakes background */}
            <div style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                fontSize: '40px',
                opacity: 0.1
            }}>❄️</div>
            <div style={{
                position: 'absolute',
                bottom: '40px',
                left: '30px',
                fontSize: '30px',
                opacity: 0.1
            }}>⭐</div>
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '10px',
                fontSize: '25px',
                opacity: 0.08
            }}>🎄</div>

            {/* Header with Christmas theme */}
            <div style={{
                textAlign: 'center',
                marginBottom: '32px',
                paddingBottom: '20px',
                borderBottom: '3px solid',
                borderImage: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24) 1',
                position: 'relative'
            }}>
                <div style={{
                    fontSize: '14px',
                    color: '#fbbf24',
                    marginBottom: '8px',
                    letterSpacing: '2px',
                    fontWeight: 'bold'
                }}>
                    🎄 CENAS DE FIN DE AÑO 2024 🎄
                </div>
                <h1 style={{
                    fontSize: '32px',
                    fontWeight: 'bold',
                    background: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    margin: '0 0 12px 0',
                    letterSpacing: '1px'
                }}>
                    HNOS. PIENDA
                </h1>
                <div style={{
                    background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
                    padding: '8px 24px',
                    borderRadius: '20px',
                    display: 'inline-block',
                    boxShadow: '0 4px 12px rgba(251, 191, 36, 0.3)'
                }}>
                    <p style={{
                        fontSize: '20px',
                        color: '#0f172a',
                        margin: 0,
                        fontWeight: 'bold',
                        letterSpacing: '1px'
                    }}>
                        PEDIDO #{pedido.numero_pedido}
                    </p>
                </div>
            </div>

            {/* Información del Cliente */}
            <div style={{
                marginBottom: '28px',
                padding: '20px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1) 0%, rgba(245, 158, 11, 0.05) 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(251, 191, 36, 0.3)',
                boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>👤</span>
                    <span style={{ fontWeight: 'bold', color: '#fbbf24', marginRight: '8px' }}>Cliente:</span>
                    <span style={{ fontSize: '17px', color: '#f1f5f9' }}>{pedido.cliente}</span>
                </div>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>📱</span>
                    <span style={{ fontWeight: 'bold', color: '#fbbf24', marginRight: '8px' }}>Teléfono:</span>
                    <span style={{ fontSize: '17px', color: '#f1f5f9' }}>{pedido.telefono}</span>
                </div>
                <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>🕐</span>
                    <span style={{ fontWeight: 'bold', color: '#fbbf24', marginRight: '8px' }}>Entrega:</span>
                    <span style={{
                        fontSize: '18px',
                        fontWeight: 'bold',
                        color: '#fbbf24',
                        textShadow: '0 0 10px rgba(251, 191, 36, 0.5)'
                    }}>{pedido.horario_entrega}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                    <span style={{ fontSize: '18px', marginRight: '8px' }}>📍</span>
                    <span style={{ fontWeight: 'bold', color: '#fbbf24', marginRight: '8px' }}>Origen:</span>
                    <span style={{ fontSize: '15px', color: '#cbd5e1' }}>{pedido.origen}</span>
                </div>
            </div>

            {/* Items del Pedido */}
            <div style={{ marginBottom: '28px' }}>
                <h2 style={{
                    fontSize: '20px',
                    fontWeight: 'bold',
                    marginBottom: '20px',
                    color: '#fbbf24',
                    borderLeft: '4px solid #fbbf24',
                    paddingLeft: '12px',
                    letterSpacing: '0.5px'
                }}>
                    🎁 PLATILLOS
                </h2>
                {pedido.items_pedido.map((item, index) => (
                    <div
                        key={item.id}
                        style={{
                            marginBottom: '18px',
                            paddingBottom: '18px',
                            borderBottom: index < pedido.items_pedido.length - 1 ? '1px solid rgba(251, 191, 36, 0.2)' : 'none',
                            background: 'rgba(15, 23, 42, 0.5)',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid rgba(251, 191, 36, 0.2)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                            <div style={{ flex: 1 }}>
                                <div style={{ fontSize: '17px', fontWeight: 'bold', color: '#f1f5f9', display: 'flex', alignItems: 'center' }}>
                                    <span style={{
                                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                                        color: '#0f172a',
                                        padding: '4px 12px',
                                        borderRadius: '12px',
                                        marginRight: '10px',
                                        fontSize: '16px',
                                        fontWeight: 'bold'
                                    }}>
                                        {Number(item.cantidad)}x
                                    </span>
                                    {item.items_menu.nombre}
                                </div>
                                {item.variantes_menu && (
                                    <div style={{
                                        fontSize: '15px',
                                        color: '#60a5fa',
                                        marginLeft: '16px',
                                        marginTop: '6px',
                                        background: 'rgba(96, 165, 250, 0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        display: 'inline-block',
                                        border: '1px solid rgba(96, 165, 250, 0.3)'
                                    }}>
                                        ⭐ {item.variantes_menu.nombre}
                                    </div>
                                )}
                                {item.salsa && (
                                    <div style={{
                                        fontSize: '15px',
                                        color: '#fb923c',
                                        marginLeft: '16px',
                                        marginTop: '6px',
                                        background: 'rgba(251, 146, 60, 0.1)',
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        display: 'inline-block',
                                        border: '1px solid rgba(251, 146, 60, 0.3)'
                                    }}>
                                        🌶️ Salsa: {item.salsa.nombre}
                                    </div>
                                )}
                                {item.notas && (
                                    <div style={{
                                        fontSize: '14px',
                                        color: '#34d399',
                                        marginLeft: '16px',
                                        marginTop: '8px',
                                        fontStyle: 'italic',
                                        background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(52, 211, 153, 0.1))',
                                        padding: '10px 14px',
                                        borderRadius: '8px',
                                        display: 'inline-block',
                                        border: '1px solid rgba(52, 211, 153, 0.4)',
                                        boxShadow: '0 2px 8px rgba(52, 211, 153, 0.2)'
                                    }}>
                                        📝 <strong>Nota:</strong> {item.notas}
                                    </div>
                                )}
                            </div>
                            <div style={{
                                fontSize: '18px',
                                fontWeight: 'bold',
                                color: '#fbbf24',
                                minWidth: '110px',
                                textAlign: 'right',
                                textShadow: '0 0 10px rgba(251, 191, 36, 0.3)'
                            }}>
                                ${Number(item.subtotal).toFixed(2)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Totales */}
            <div style={{
                borderTop: '3px solid',
                borderImage: 'linear-gradient(90deg, #fbbf24, #f59e0b, #fbbf24) 1',
                paddingTop: '20px',
                marginBottom: '20px',
                background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.08), rgba(245, 158, 11, 0.05))',
                padding: '20px',
                borderRadius: '12px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', alignItems: 'center' }}>
                    <span style={{
                        fontSize: '22px',
                        fontWeight: 'bold',
                        color: '#fbbf24',
                        letterSpacing: '1px'
                    }}>💰 TOTAL:</span>
                    <span style={{
                        fontSize: '28px',
                        fontWeight: 'bold',
                        background: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        textShadow: '0 0 20px rgba(251, 191, 36, 0.5)'
                    }}>
                        ${Number(pedido.total).toFixed(2)}
                    </span>
                </div>
                {pedido.anticipo > 0 && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '16px' }}>
                            <span style={{ color: '#cbd5e1' }}>✅ Anticipo:</span>
                            <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                                ${Number(pedido.anticipo).toFixed(2)}
                            </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px' }}>
                            <span style={{ color: '#cbd5e1' }}>⏳ Restante:</span>
                            <span style={{ color: '#fb923c', fontWeight: 'bold' }}>
                                ${Number(pedido.restante).toFixed(2)}
                            </span>
                        </div>
                    </>
                )}
            </div>

            {/* Notas Generales */}
            {pedido.notas && (
                <div style={{
                    marginTop: '24px',
                    padding: '16px',
                    background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.1), rgba(245, 158, 11, 0.05))',
                    borderLeft: '4px solid #fbbf24',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#fbbf24', fontSize: '16px' }}>
                        📋 Notas del Pedido:
                    </div>
                    <div style={{ fontSize: '15px', color: '#e2e8f0', lineHeight: '1.6' }}>
                        {pedido.notas}
                    </div>
                </div>
            )}

            {/* Footer */}
            <div style={{
                marginTop: '36px',
                paddingTop: '20px',
                borderTop: '2px solid rgba(251, 191, 36, 0.3)',
                textAlign: 'center',
                color: '#94a3b8',
                fontSize: '13px'
            }}>
                <p style={{ margin: '0 0 6px 0', fontSize: '16px', color: '#fbbf24' }}>
                    ✨ ¡Gracias por tu preferencia! ✨
                </p>
                <p style={{ margin: '0 0 6px 0' }}>
                    🎄 ¡Felices Fiestas! 🎄
                </p>
                <p style={{ margin: 0, fontSize: '12px' }}>
                    📅 {new Date(pedido.fecha_creacion).toLocaleString('es-MX', {
                        dateStyle: 'long',
                        timeStyle: 'short'
                    })}
                </p>
            </div>

            {/* Decorative corner elements */}
            <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '80px',
                height: '80px',
                background: 'radial-gradient(circle at top left, rgba(251, 191, 36, 0.2), transparent)',
                pointerEvents: 'none'
            }} />
            <div style={{
                position: 'absolute',
                bottom: '0',
                right: '0',
                width: '80px',
                height: '80px',
                background: 'radial-gradient(circle at bottom right, rgba(251, 191, 36, 0.2), transparent)',
                pointerEvents: 'none'
            }} />
        </div>
    );
});

OrderReceipt.displayName = 'OrderReceipt';

export default OrderReceipt;
