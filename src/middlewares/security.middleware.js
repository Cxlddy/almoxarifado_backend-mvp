const DEFAULT_MAX_BODY_DEPTH = 8;
const DEFAULT_MAX_STRING_LENGTH = 2000;
const DEFAULT_MAX_ARRAY_LENGTH = 100;

function securityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'"
  );

  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }

  next();
}

function noStore(req, res, next) {
  res.setHeader('Cache-Control', 'no-store');
  next();
}

function hideInternalErrors(req, res, next) {
  const originalJson = res.json.bind(res);

  res.json = (payload) => {
    if (res.statusCode >= 500 && payload && typeof payload === 'object') {
      const { erro, error, stack, ...safePayload } = payload;

      return originalJson({
        mensagem: safePayload.mensagem || 'Erro interno do servidor',
        ...safePayload
      });
    }

    return originalJson(payload);
  };

  next();
}

function clientKey(req) {
  const forwardedFor = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwardedFor || req.ip || req.socket?.remoteAddress || 'unknown';
}

function pruneExpiredHits(hits, now) {
  if (hits.size < 1000) return;

  for (const [key, value] of hits.entries()) {
    if (value.resetAt <= now) hits.delete(key);
  }
}

function rateLimit({ windowMs, max, message }) {
  const hits = new Map();

  return (req, res, next) => {
    const now = Date.now();
    pruneExpiredHits(hits, now);

    const key = clientKey(req);
    const current = hits.get(key);

    if (!current || current.resetAt <= now) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    current.count += 1;

    if (current.count > max) {
      const retryAfter = Math.ceil((current.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(429).json({
        mensagem: message || 'Muitas tentativas. Tente novamente mais tarde.'
      });
    }

    return next();
  };
}

function sanitizeValue(value, depth = 0) {
  if (depth > DEFAULT_MAX_BODY_DEPTH) {
    throw new Error('Payload muito profundo');
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (trimmed.length > DEFAULT_MAX_STRING_LENGTH) {
      throw new Error('Campo de texto muito longo');
    }

    return trimmed;
  }

  if (Array.isArray(value)) {
    if (value.length > DEFAULT_MAX_ARRAY_LENGTH) {
      throw new Error('Lista muito grande');
    }

    return value.map((item) => sanitizeValue(item, depth + 1));
  }

  if (value && typeof value === 'object') {
    const sanitized = {};

    for (const [key, item] of Object.entries(value)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) {
        throw new Error('Campo invalido');
      }

      sanitized[key] = sanitizeValue(item, depth + 1);
    }

    return sanitized;
  }

  return value;
}

function sanitizeBody(req, res, next) {
  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitizeValue(req.body);
    }

    return next();
  } catch (error) {
    return res.status(400).json({
      mensagem: error.message
    });
  }
}

export {
  hideInternalErrors,
  noStore,
  rateLimit,
  sanitizeBody,
  securityHeaders
};
