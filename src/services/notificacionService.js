const Notificacion = require('../models/Notificacion');
const Factura = require('../models/Factura');
const User = require('../models/User');
const nodemailer = require('nodemailer');

// Configurar el transporter de nodemailer
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

class NotificacionService {
    // Enviar notificación por email
    static async enviarEmail(usuario, asunto, mensaje) {
        try {
            await transporter.sendMail({
                from: process.env.SMTP_FROM,
                to: usuario.email,
                subject: asunto,
                html: mensaje
            });
        } catch (error) {
            console.error('Error al enviar email:', error);
            throw error;
        }
    }

    // Crear notificación en el sistema
    static async crearNotificacion(datos) {
        try {
            const notificacion = await Notificacion.crearNotificacion(datos);
            
            // Si el usuario tiene habilitadas las notificaciones por email
            const usuario = await User.findById(datos.usuario);
            if (usuario && usuario.perfil.preferenciasNotificacion.email) {
                await this.enviarEmail(usuario, datos.titulo, datos.mensaje);
            }

            return notificacion;
        } catch (error) {
            console.error('Error al crear notificación:', error);
            throw error;
        }
    }

    // Notificar recordatorio de pago
    static async notificarRecordatorioPago(facturaId) {
        try {
            const factura = await Factura.findById(facturaId).populate('usuario');
            if (!factura) throw new Error('Factura no encontrada');

            const diasRestantes = Math.ceil((factura.fechaVencimiento - new Date()) / (1000 * 60 * 60 * 24));
            
            if (diasRestantes <= 3) {
                await this.crearNotificacion({
                    usuario: factura.usuario._id,
                    tipo: 'recordatorio',
                    titulo: 'Recordatorio de Pago',
                    mensaje: `Tu factura ${factura.numeroFactura} vence en ${diasRestantes} días. ¡No pierdas tus beneficios!`,
                    datosAdicionales: {
                        facturaId: factura._id
                    },
                    accion: {
                        tipo: 'link',
                        url: `/facturas/${factura._id}/pagar`,
                        texto: 'Pagar ahora'
                    }
                });
            }
        } catch (error) {
            console.error('Error al notificar recordatorio:', error);
            throw error;
        }
    }

    // Notificar logro de membresía
    static async notificarLogroMembresia(usuarioId, nivelMembresia) {
        try {
            const beneficios = {
                premium: {
                    titulo: '¡Felicidades! Has alcanzado la membresía Premium',
                    mensaje: 'Ahora disfrutas de 10% de descuento en todas tus facturas y atención prioritaria.'
                },
                vip: {
                    titulo: '¡Felicidades! Has alcanzado la membresía VIP',
                    mensaje: 'Ahora disfrutas de 15% de descuento, atención VIP y servicios adicionales gratuitos.'
                }
            };

            if (beneficios[nivelMembresia]) {
                await this.crearNotificacion({
                    usuario: usuarioId,
                    tipo: 'logro',
                    titulo: beneficios[nivelMembresia].titulo,
                    mensaje: beneficios[nivelMembresia].mensaje,
                    datosAdicionales: {
                        nivelMembresia
                    }
                });
            }
        } catch (error) {
            console.error('Error al notificar logro:', error);
            throw error;
        }
    }

    // Notificar beneficios por pago puntual
    static async notificarBeneficiosPago(facturaId) {
        try {
            const factura = await Factura.findById(facturaId).populate('usuario');
            if (!factura) throw new Error('Factura no encontrada');

            const mensaje = `Has ganado ${factura.beneficios.puntosGanados} puntos por tu pago puntual. `;
            const descuento = factura.beneficios.descuentoAplicado * 100;

            if (descuento > 0) {
                mensaje += `Además, has obtenido un ${descuento}% de descuento en tu próxima factura.`;
            }

            await this.crearNotificacion({
                usuario: factura.usuario._id,
                tipo: 'beneficio',
                titulo: '¡Beneficios por pago puntual!',
                mensaje,
                datosAdicionales: {
                    facturaId: factura._id,
                    puntos: factura.beneficios.puntosGanados
                }
            });
        } catch (error) {
            console.error('Error al notificar beneficios:', error);
            throw error;
        }
    }
}

module.exports = NotificacionService; 