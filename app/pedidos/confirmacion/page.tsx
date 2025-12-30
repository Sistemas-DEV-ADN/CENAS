'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, Download, Share2, Eye, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { obtenerPedidoPorId } from '@/lib/db/pedidos';
import type { PedidoCompleto } from '@/lib/db/pedidos';
import { generarLinkWhatsApp } from '@/lib/utils/whatsapp';
import OrderReceipt from '@/app/components/OrderReceipt';

// ... imports remain the same

function ConfirmacionContent() {
    const searchParams = useSearchParams();
    const id = searchParams.get('id');
    const router = useRouter();

    const [pedido, setPedido] = useState<PedidoCompleto | null>(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    const receiptRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!id) {
            router.push('/pedidos');
            return;
        }
        cargarPedido();
    }, [id]);

    const cargarPedido = async () => {
        try {
            const data = await obtenerPedidoPorId(id as string);
            setPedido(data);
        } catch (error) {
            console.error('Error al cargar pedido:', error);
            alert('No se pudo cargar el pedido.');
            router.push('/pedidos');
        } finally {
            setLoading(false);
        }
    };

    const handleDescargarImagen = async () => {
        if (!receiptRef.current || !pedido) return;

        try {
            setDownloading(true);

            // Generar canvas del componente
            const canvas = await html2canvas(receiptRef.current, {
                scale: 2, // Alta resolución
                backgroundColor: '#ffffff',
                logging: false,
                useCORS: true
            });

            // Convertir a blob y descargar
            canvas.toBlob((blob) => {
                if (!blob) return;

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `Pedido_${pedido.numero_pedido}_${pedido.cliente.replace(/\s+/g, '_')}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 'image/png');

        } catch (error) {
            console.error('Error al generar imagen:', error);
            alert('Error al generar la imagen. Por favor intenta nuevamente.');
        } finally {
            setDownloading(false);
        }
    };

    const handleCompartirWhatsApp = async () => {
        if (!pedido) return;
        const url = generarLinkWhatsApp(pedido);
        window.open(url, '_blank');
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
                <p className="text-[var(--text-secondary)]">Cargando confirmación...</p>
            </div>
        );
    }

    if (!pedido) return null;

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            {/* Success Message */}
            <div className="mb-8 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                    <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-2">
                    ¡Pedido Creado Exitosamente!
                </h1>
                <p className="text-xl text-[var(--text-secondary)]">
                    Pedido #{pedido.numero_pedido} - {pedido.cliente}
                </p>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <button
                    onClick={handleDescargarImagen}
                    disabled={downloading}
                    className="card p-6 hover:border-[var(--primary)] hover:shadow-lg transition-all text-left group"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[var(--primary)] transition-colors">
                            {downloading ? (
                                <Loader2 className="w-6 h-6 text-[var(--primary)] group-hover:text-white animate-spin" />
                            ) : (
                                <Download className="w-6 h-6 text-[var(--primary)] group-hover:text-white" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">Descargar Imagen</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Descarga el comprobante como imagen PNG para compartir
                            </p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={handleCompartirWhatsApp}
                    className="card p-6 hover:border-green-500 hover:shadow-lg transition-all text-left group"
                >
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500 transition-colors">
                            <Share2 className="w-6 h-6 text-green-600 group-hover:text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-lg mb-1">Enviar por WhatsApp</h3>
                            <p className="text-sm text-[var(--text-secondary)]">
                                Abre WhatsApp con el mensaje de confirmación
                            </p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Preview Toggle */}
            <div className="card p-4 mb-8">
                <button
                    onClick={() => setShowPreview(!showPreview)}
                    className="flex items-center justify-between w-full"
                >
                    <div className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-[var(--primary)]" />
                        <span className="font-semibold">
                            {showPreview ? 'Ocultar' : 'Ver'} Vista Previa del Comprobante
                        </span>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">
                        {showPreview ? '▼' : '▶'}
                    </span>
                </button>
            </div>

            {/* Preview Container */}
            {showPreview && (
                <div className="mb-8 flex justify-center">
                    <div className="card p-8 inline-block">
                        <OrderReceipt ref={receiptRef} pedido={pedido} />
                    </div>
                </div>
            )}

            {/* Hidden receipt for capture when preview is closed */}
            {!showPreview && (
                <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
                    <OrderReceipt ref={receiptRef} pedido={pedido} />
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-4 justify-center pt-4 pb-12">
                <Link href="/nuevo-pedido" className="btn-outline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" />
                    Crear Otro Pedido
                </Link>
                <Link href="/pedidos" className="btn-primary">
                    Ver Todos los Pedidos
                </Link>
            </div>
        </div>
    );
}

export default function ConfirmacionPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 text-[var(--primary)] animate-spin" />
                <p className="text-[var(--text-secondary)]">Cargando...</p>
            </div>
        }>
            <ConfirmacionContent />
        </Suspense>
    );
}
