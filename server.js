const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs').promises;
const path = require('path');
const { customAlphabet } = require('nanoid');

const app = express();
const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const TRUST_PROXY = process.env.TRUST_PROXY === 'true';
const STATS_TOKEN = process.env.STATS_TOKEN || '';
const DATA_ENCRYPTION_SECRET = process.env.DATA_ENCRYPTION_KEY || '';
const DATA_ENCRYPTION_KEY = DATA_ENCRYPTION_SECRET.length >= 32
    ? crypto.createHash('sha256').update(DATA_ENCRYPTION_SECRET, 'utf8').digest()
    : null;
const SHARE_TTL_DAYS = clampInteger(process.env.SHARE_TTL_DAYS, 30, 0, 365);
const SHARE_TTL_MS = SHARE_TTL_DAYS * 24 * 60 * 60 * 1000;
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(__dirname, 'data'));
const DATA_FILE = path.join(DATA_DIR, 'shares.json');
const MAX_SELECTIONS = 1200;
const MAX_KINK_ID_LENGTH = 300;
const SHARE_ID_PATTERN = /^[0-9A-Za-z]{12}$/;
const STATUS_TYPES = new Set(['love', 'like', 'curious', 'maybe', 'no', 'limit']);
const ROLE_TYPES = new Set(['gives', 'receives', 'both']);
const PUBLIC_FILES = new Set([
    'index.html',
    'style.css',
    'script.js',
    'kinks-data.js',
    'kinks-definitions.js',
    'favicon.svg'
]);
const configuredOrigins = new Set(
    (process.env.ALLOWED_ORIGINS || 'https://kink.eldayia.fr')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean)
);
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 12);

if (TRUST_PROXY) app.set('trust proxy', 1);
app.disable('x-powered-by');

function clampInteger(value, fallback, minimum, maximum) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.min(maximum, Math.max(minimum, parsed));
}

function requestOrigin(req) {
    return `${req.protocol}://${req.get('host')}`;
}

function isAllowedOrigin(req, origin) {
    if (!origin) return true;
    if (origin === requestOrigin(req)) return true;
    if (configuredOrigins.has(origin)) return true;
    if (!IS_PRODUCTION && origin === 'null') return true;
    if (!IS_PRODUCTION && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
    return false;
}

app.use((req, res, next) => {
    const origin = req.get('Origin');
    if (!isAllowedOrigin(req, origin)) {
        return res.status(403).json({ error: 'Origine non autorisée' });
    }
    next();
});

app.use(cors({
    origin(origin, callback) {
        callback(null, origin || false);
    },
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
    optionsSuccessStatus: 204
}));

app.use((req, res, next) => {
    const directives = [
        "default-src 'self'",
        "script-src 'self'",
        "style-src 'self'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'"
    ];
    if (IS_PRODUCTION) directives.push('upgrade-insecure-requests');

    res.setHeader('Content-Security-Policy', directives.join('; '));
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=(), usb=()');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    if (IS_PRODUCTION && req.secure) {
        res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }
    if (req.path.startsWith('/api/')) {
        res.setHeader('Cache-Control', 'no-store');
    }
    next();
});

app.use(express.json({ limit: '256kb', strict: true, type: 'application/json' }));

function createRateLimiter({ windowMs, maximum }) {
    const clients = new Map();
    const cleanup = setInterval(() => {
        const now = Date.now();
        for (const [key, bucket] of clients) {
            if (bucket.resetAt <= now) clients.delete(key);
        }
    }, windowMs);
    cleanup.unref();

    return (req, res, next) => {
        const now = Date.now();
        const key = req.ip || req.socket.remoteAddress || 'unknown';
        let bucket = clients.get(key);
        if (!bucket || bucket.resetAt <= now) {
            bucket = { count: 0, resetAt: now + windowMs };
            clients.set(key, bucket);
        }
        bucket.count++;
        res.setHeader('RateLimit-Limit', maximum);
        res.setHeader('RateLimit-Remaining', Math.max(0, maximum - bucket.count));
        res.setHeader('RateLimit-Reset', Math.ceil(bucket.resetAt / 1000));
        if (bucket.count > maximum) {
            res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
            return res.status(429).json({ error: 'Trop de requêtes, réessayez plus tard' });
        }
        next();
    };
}

const createShareLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, maximum: 30 });
const readShareLimiter = createRateLimiter({ windowMs: 60 * 1000, maximum: 120 });
const statsLimiter = createRateLimiter({ windowMs: 60 * 1000, maximum: 20 });

function isPlainRecord(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
}

function isSafeKey(key) {
    return key !== '__proto__' && key !== 'prototype' && key !== 'constructor';
}

function isValidKinkId(kinkId) {
    return typeof kinkId === 'string'
        && kinkId.length > 2
        && kinkId.length <= MAX_KINK_ID_LENGTH
        && kinkId.includes('::')
        && !/[\u0000-\u001f\u007f]/.test(kinkId)
        && isSafeKey(kinkId);
}

function normalizeText(value, maximumLength) {
    if (value === undefined || value === null || value === '') return '';
    if (typeof value !== 'string' || value.length > maximumLength) return null;
    return value.replace(/[\u0000-\u001f\u007f]/g, '').trim();
}

function validateShareData(input) {
    if (!isPlainRecord(input)) return { error: 'Données de partage invalides' };
    const allowedTopLevelKeys = new Set(['selections', 'roles', 'userInfo']);
    if (Object.keys(input).some(key => !allowedTopLevelKeys.has(key))) {
        return { error: 'Champ de partage non autorisé' };
    }
    if (!isPlainRecord(input.selections)) return { error: 'Sélections invalides' };

    const selectionEntries = Object.entries(input.selections);
    if (selectionEntries.length === 0 || selectionEntries.length > MAX_SELECTIONS) {
        return { error: 'Nombre de sélections invalide' };
    }

    const selections = Object.create(null);
    for (const [kinkId, status] of selectionEntries) {
        if (!isValidKinkId(kinkId) || !STATUS_TYPES.has(status)) {
            return { error: 'Sélection invalide' };
        }
        selections[kinkId] = status;
    }

    const roles = Object.create(null);
    if (input.roles !== undefined && input.roles !== null) {
        if (!isPlainRecord(input.roles) || Object.keys(input.roles).length > MAX_SELECTIONS) {
            return { error: 'Rôles invalides' };
        }
        for (const [kinkId, role] of Object.entries(input.roles)) {
            if (!isValidKinkId(kinkId) || !ROLE_TYPES.has(role)) {
                return { error: 'Rôle invalide' };
            }
            // Ne conserver aucune donnée de rôle qui n'a pas de sélection associée.
            if (Object.prototype.hasOwnProperty.call(selections, kinkId)) roles[kinkId] = role;
        }
    }

    const userInfoInput = input.userInfo ?? {};
    if (!isPlainRecord(userInfoInput)) return { error: 'Informations personnelles invalides' };
    const allowedUserKeys = new Set(['name', 'gender', 'sexuality', 'preference']);
    if (Object.keys(userInfoInput).some(key => !allowedUserKeys.has(key))) {
        return { error: 'Champ personnel non autorisé' };
    }

    const name = normalizeText(userInfoInput.name, 100);
    const gender = normalizeText(userInfoInput.gender, 100);
    const sexuality = normalizeText(userInfoInput.sexuality, 100);
    const preference = normalizeText(userInfoInput.preference, 20);
    if ([name, gender, sexuality, preference].includes(null)) {
        return { error: 'Information personnelle trop longue ou invalide' };
    }
    if (preference && !['Top', 'Bottom', 'Switch'].includes(preference)) {
        return { error: 'Préférence invalide' };
    }

    return {
        value: {
            selections,
            roles,
            userInfo: { name, gender, sexuality, preference }
        }
    };
}

let storageQueue = Promise.resolve();

function withStorageLock(operation) {
    const result = storageQueue.then(operation, operation);
    storageQueue = result.then(() => undefined, () => undefined);
    return result;
}

async function writeSharesUnsafe(shares) {
    const temporaryFile = `${DATA_FILE}.${process.pid}.tmp`;
    await fs.writeFile(temporaryFile, JSON.stringify(shares, null, 2), {
        encoding: 'utf8',
        mode: 0o600
    });
    try {
        await fs.rename(temporaryFile, DATA_FILE);
    } catch (error) {
        // Windows peut refuser le remplacement atomique d'un fichier existant.
        if (!['EEXIST', 'EPERM'].includes(error.code)) throw error;
        await fs.copyFile(temporaryFile, DATA_FILE);
        await fs.unlink(temporaryFile).catch(() => {});
    }
    await fs.chmod(DATA_FILE, 0o600).catch(() => {});
}

async function readSharesUnsafe() {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    const shares = JSON.parse(content);
    if (!isPlainRecord(shares)) throw new Error('Format de stockage invalide');
    return shares;
}

function isExpired(share, now = Date.now()) {
    if (!share || typeof share !== 'object') return true;
    if (SHARE_TTL_DAYS === 0) return false;
    const expiresAt = Date.parse(share.expiresAt || '');
    if (Number.isFinite(expiresAt)) return expiresAt <= now;
    const createdAt = Date.parse(share.createdAt || '');
    return !Number.isFinite(createdAt) || createdAt + SHARE_TTL_MS <= now;
}

function shareStorageKey(id) {
    return crypto.createHash('sha256').update(id, 'utf8').digest('hex');
}

function encryptShareData(data) {
    if (!DATA_ENCRYPTION_KEY) return { data };
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', DATA_ENCRYPTION_KEY, iv);
    const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(data), 'utf8'),
        cipher.final()
    ]);
    return {
        encryptedData: {
            version: 1,
            algorithm: 'aes-256-gcm',
            iv: iv.toString('base64'),
            tag: cipher.getAuthTag().toString('base64'),
            ciphertext: ciphertext.toString('base64')
        }
    };
}

function decryptShareData(share) {
    if (share.data) return share.data;
    const encrypted = share.encryptedData;
    if (!DATA_ENCRYPTION_KEY || !isPlainRecord(encrypted)
        || encrypted.version !== 1 || encrypted.algorithm !== 'aes-256-gcm') {
        throw new Error('Données chiffrées illisibles');
    }
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        DATA_ENCRYPTION_KEY,
        Buffer.from(encrypted.iv, 'base64')
    );
    decipher.setAuthTag(Buffer.from(encrypted.tag, 'base64'));
    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(encrypted.ciphertext, 'base64')),
        decipher.final()
    ]).toString('utf8');
    return JSON.parse(plaintext);
}

async function migrateStoredShares() {
    if (!DATA_ENCRYPTION_KEY) return;
    await withStorageLock(async () => {
        const shares = await readSharesUnsafe();
        let changed = false;
        for (const [storedKey, share] of Object.entries(shares)) {
            if (share?.data) {
                Object.assign(share, encryptShareData(share.data));
                delete share.data;
                changed = true;
            }
            if (SHARE_ID_PATTERN.test(storedKey)) {
                const hashedKey = shareStorageKey(storedKey);
                if (!shares[hashedKey]) shares[hashedKey] = share;
                delete shares[storedKey];
                changed = true;
            }
        }
        if (changed) await writeSharesUnsafe(shares);
    });
}

async function removeExpiredShares() {
    return withStorageLock(async () => {
        const shares = await readSharesUnsafe();
        let changed = false;
        for (const [id, share] of Object.entries(shares)) {
            if (isExpired(share)) {
                delete shares[id];
                changed = true;
            }
        }
        if (changed) await writeSharesUnsafe(shares);
    });
}

async function initDataFile() {
    await fs.mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
    await fs.chmod(DATA_DIR, 0o700).catch(() => {});
    try {
        await fs.access(DATA_FILE);
        await fs.chmod(DATA_FILE, 0o600).catch(() => {});
        await readSharesUnsafe();
    } catch (error) {
        if (error.code !== 'ENOENT') throw error;
        await writeSharesUnsafe(Object.create(null));
    }
    await removeExpiredShares();
    await migrateStoredShares();
}

app.post('/api/share', createShareLimiter, async (req, res) => {
    const validation = validateShareData(req.body?.data);
    if (validation.error) return res.status(400).json({ error: validation.error });

    try {
        const id = await withStorageLock(async () => {
            const shares = await readSharesUnsafe();
            let candidate = nanoid();
            let storageKey = shareStorageKey(candidate);
            while (Object.prototype.hasOwnProperty.call(shares, storageKey)) {
                candidate = nanoid();
                storageKey = shareStorageKey(candidate);
            }
            const createdAt = new Date();
            shares[storageKey] = {
                ...encryptShareData(validation.value),
                createdAt: createdAt.toISOString(),
                expiresAt: SHARE_TTL_DAYS === 0
                    ? null
                    : new Date(createdAt.getTime() + SHARE_TTL_MS).toISOString(),
                accessCount: 0
            };
            await writeSharesUnsafe(shares);
            return candidate;
        });

        res.status(201).json({
            id,
            url: `${requestOrigin(req)}/#s/${id}`,
            expiresInDays: SHARE_TTL_DAYS || null
        });
    } catch (error) {
        console.error('Erreur de stockage lors de la création d’un partage');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/share/:id', readShareLimiter, async (req, res) => {
    const { id } = req.params;
    if (!SHARE_ID_PATTERN.test(id)) return res.status(400).json({ error: 'Identifiant invalide' });

    try {
        const result = await withStorageLock(async () => {
            const shares = await readSharesUnsafe();
            const storageKey = shareStorageKey(id);
            const share = shares[storageKey] || shares[id];
            if (!share) return { missing: true };
            if (isExpired(share)) {
                delete shares[storageKey];
                delete shares[id];
                await writeSharesUnsafe(shares);
                return { expired: true };
            }
            const data = decryptShareData(share);
            share.accessCount = Number.isSafeInteger(share.accessCount) ? share.accessCount + 1 : 1;
            share.lastAccessedAt = new Date().toISOString();
            await writeSharesUnsafe(shares);
            return { data };
        });

        if (result.missing) return res.status(404).json({ error: 'Lien non trouvé' });
        if (result.expired) return res.status(410).json({ error: 'Lien expiré' });
        res.json({ data: result.data });
    } catch (error) {
        console.error('Erreur de stockage lors de la lecture d’un partage');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

function hasValidStatsToken(req) {
    if (!STATS_TOKEN) return false;
    const authorization = req.get('Authorization') || '';
    const providedToken = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
    const expected = Buffer.from(STATS_TOKEN);
    const provided = Buffer.from(providedToken);
    return expected.length === provided.length && crypto.timingSafeEqual(expected, provided);
}

app.get('/api/stats', statsLimiter, async (req, res) => {
    if (!STATS_TOKEN) return res.status(404).json({ error: 'Route non disponible' });
    if (!hasValidStatsToken(req)) return res.status(401).json({ error: 'Non autorisé' });

    try {
        const stats = await withStorageLock(async () => {
            const shares = await readSharesUnsafe();
            const activeShares = Object.values(shares).filter(share => !isExpired(share));
            return {
                totalShares: activeShares.length,
                totalAccess: activeShares.reduce((sum, share) => sum + (share.accessCount || 0), 0)
            };
        });
        res.json(stats);
    } catch (error) {
        console.error('Erreur de stockage lors du calcul des statistiques');
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api', (req, res) => {
    res.status(404).json({ error: 'Route API non trouvée' });
});

function sendPublicFile(req, res, filename) {
    const extension = path.extname(filename);
    if (extension === '.js' || extension === '.css' || extension === '.html') {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    } else {
        res.setHeader('Cache-Control', 'public, max-age=86400');
    }
    res.sendFile(filename, { root: __dirname, dotfiles: 'deny' });
}

app.get('/', (req, res) => sendPublicFile(req, res, 'index.html'));
app.get('/:filename', (req, res, next) => {
    if (!PUBLIC_FILES.has(req.params.filename)) return next();
    sendPublicFile(req, res, req.params.filename);
});

app.use((req, res) => {
    res.status(404).type('text/plain').send('Ressource non trouvée');
});

app.use((error, req, res, next) => {
    if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
        return res.status(400).json({ error: 'JSON invalide' });
    }
    if (error?.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Requête trop volumineuse' });
    }
    console.error('Erreur HTTP non gérée');
    res.status(500).json({ error: 'Erreur serveur' });
});

async function startServer() {
    if (IS_PRODUCTION && !DATA_ENCRYPTION_KEY) {
        throw new Error('DATA_ENCRYPTION_KEY doit contenir au moins 32 caractères en production');
    }
    await initDataFile();
    const cleanupInterval = setInterval(() => {
        removeExpiredShares().catch(() => console.error('Échec du nettoyage des partages expirés'));
    }, 6 * 60 * 60 * 1000);
    cleanupInterval.unref();

    app.listen(PORT, () => {
        console.log(`Kinklist disponible sur http://localhost:${PORT}`);
        console.log(
            SHARE_TTL_DAYS === 0
                ? 'Expiration des liens : désactivée'
                : `Expiration des liens : ${SHARE_TTL_DAYS} jours`
        );
    });
}

startServer().catch(() => {
    console.error('Impossible de démarrer le serveur Kinklist');
    process.exit(1);
});

process.on('unhandledRejection', () => {
    console.error('Erreur asynchrone non gérée');
});
