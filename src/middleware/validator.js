const { body, validationResult } = require('express-validator');

const validarFactura = [
    body('numeroFactura')
        .notEmpty().withMessage('El número de factura es requerido')
        .isString().withMessage('El número de factura debe ser texto'),
    
    body('fechaEmision')
        .notEmpty().withMessage('La fecha de emisión es requerida')
        .isDate().withMessage('Fecha de emisión inválida'),
    
    body('consumo.lecturaAnterior')
        .notEmpty().withMessage('La lectura anterior es requerida')
        .isNumeric().withMessage('Lectura anterior debe ser un número')
        .custom((value, { req }) => {
            if (value < 0) {
                throw new Error('La lectura anterior no puede ser negativa');
            }
            return true;
        }),
    
    body('consumo.lecturaActual')
        .notEmpty().withMessage('La lectura actual es requerida')
        .isNumeric().withMessage('Lectura actual debe ser un número')
        .custom((value, { req }) => {
            if (value < 0) {
                throw new Error('La lectura actual no puede ser negativa');
            }
            if (value < req.body.consumo.lecturaAnterior) {
                throw new Error('La lectura actual no puede ser menor que la lectura anterior');
            }
            return true;
        }),
    
    body('valores.total')
        .notEmpty().withMessage('El total es requerido')
        .isNumeric().withMessage('El total debe ser un número')
        .custom((value) => {
            if (value < 0) {
                throw new Error('El total no puede ser negativo');
            }
            return true;
        }),

    body('estado')
        .optional()
        .isIn(['pendiente', 'pagada', 'vencida']).withMessage('Estado inválido'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ 
                error: 'Error de validación',
                detalles: errors.array() 
            });
        }
        next();
    }
];

module.exports = {
    validarFactura
};
