const { body, validationResult } = require('express-validator');

const validarFactura = [
    body('numeroFactura').notEmpty().withMessage('El número de factura es requerido'),
    body('fechaEmision').isDate().withMessage('Fecha de emisión inválida'),
    body('consumo.lecturaAnterior').isNumeric().withMessage('Lectura anterior debe ser un número'),
    body('consumo.lecturaActual').isNumeric().withMessage('Lectura actual debe ser un número'),
    body('valores.total').isNumeric().withMessage('El total debe ser un número'),
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];

module.exports = {
    validarFactura
};
