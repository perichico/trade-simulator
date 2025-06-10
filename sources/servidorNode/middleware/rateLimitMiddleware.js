const rateLimit = require('express-rate-limit');

// Rate limiting general para todas las rutas
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // máximo 1000 requests por ventana de tiempo por IP
  message: {
    error: 'Demasiadas solicitudes desde esta IP',
    mensaje: 'Por favor, intenta nuevamente en 15 minutos',
    tipo: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true, // Retorna rate limit info en los headers `RateLimit-*`
  legacyHeaders: false, // Deshabilita los headers `X-RateLimit-*`
  // Función personalizada para generar la clave de rate limiting
  keyGenerator: (req) => {
    // Combinar IP con user-agent para mayor precisión
    return `${req.ip}-${req.get('User-Agent') || 'unknown'}`;
  },
  // Función para saltar rate limiting en ciertos casos
  skip: (req) => {
    // Saltar rate limiting para health check
    return req.path === '/health';
  }
});

// Rate limiting estricto para autenticación (prevenir ataques de fuerza bruta)
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 intentos de login por IP en 15 minutos
  message: {
    error: 'Demasiados intentos de autenticación',
    mensaje: 'Has superado el límite de intentos de login. Intenta nuevamente en 15 minutos',
    tipo: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Solo aplicar a rutas de login específicas
  skipSuccessfulRequests: true, // No contar requests exitosos
  skipFailedRequests: false // Contar requests fallidos
});

// Rate limiting para transacciones (prevenir spam de transacciones)
const transactionRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 10, // máximo 10 transacciones por minuto por usuario
  message: {
    error: 'Demasiadas transacciones',
    mensaje: 'Has superado el límite de transacciones por minuto. Espera un momento antes de realizar otra transacción',
    tipo: 'TRANSACTION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Usar ID de usuario en lugar de IP para usuarios autenticados
  keyGenerator: (req) => {
    if (req.session && req.session.usuario) {
      return `user-${req.session.usuario.id}`;
    }
    return req.ip;
  }
});

// Rate limiting para rutas de admin (muy restrictivo)
const adminRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 50, // máximo 50 requests por ventana para admin
  message: {
    error: 'Límite de solicitudes de administrador excedido',
    mensaje: 'Has superado el límite de solicitudes administrativas. Intenta nuevamente en 5 minutos',
    tipo: 'ADMIN_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    if (req.session && req.session.usuario) {
      return `admin-${req.session.usuario.id}`;
    }
    return `admin-${req.ip}`;
  }
});

// Rate limiting para APIs públicas (como obtener activos)
const apiRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por minuto por IP
  message: {
    error: 'Límite de API excedido',
    mensaje: 'Has superado el límite de solicitudes a la API. Intenta nuevamente en 1 minuto',
    tipo: 'API_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para registro de usuarios
const registrationRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // máximo 3 registros por IP por hora
  message: {
    error: 'Límite de registros excedido',
    mensaje: 'Has superado el límite de registros por hora. Intenta nuevamente más tarde',
    tipo: 'REGISTRATION_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Middleware para logging de rate limiting
const rateLimitLogger = (req, res, next) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    // Si la respuesta es un error de rate limiting, loggearlo
    if (res.statusCode === 429) {
      console.log(`🚫 Rate limit excedido:`, {
        ip: req.ip,
        path: req.path,
        method: req.method,
        userAgent: req.get('User-Agent'),
        usuario: req.session?.usuario?.id || 'No autenticado',
        timestamp: new Date().toISOString()
      });
    }
    return originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  generalRateLimit,
  authRateLimit,
  transactionRateLimit,
  adminRateLimit,
  apiRateLimit,
  registrationRateLimit,
  rateLimitLogger
};
