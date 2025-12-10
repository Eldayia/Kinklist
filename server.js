const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const { customAlphabet } = require('nanoid');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'shares.json');

// Générateur d'ID courts (6 caractères, alphanumériques)
const nanoid = customAlphabet('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz', 6);

// Middleware
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static('.', {
    index: 'index.html',
    extensions: ['html', 'htm']
}));

// Initialisation du fichier de données
async function initDataFile() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        try {
            await fs.access(DATA_FILE);
        } catch {
            await fs.writeFile(DATA_FILE, JSON.stringify({}), 'utf8');
            console.log('📁 Fichier de données créé');
        }
    } catch (error) {
        console.error('Erreur lors de l\'initialisation du fichier de données:', error);
    }
}

// Lecture des données
async function readShares() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Erreur lecture shares:', error);
        return {};
    }
}

// Écriture des données
async function writeShares(shares) {
    try {
        await fs.writeFile(DATA_FILE, JSON.stringify(shares, null, 2), 'utf8');
    } catch (error) {
        console.error('Erreur écriture shares:', error);
        throw error;
    }
}

// API Routes

// POST /api/share - Créer un lien court
app.post('/api/share', async (req, res) => {
    try {
        const { data } = req.body;

        if (!data || typeof data !== 'object') {
            return res.status(400).json({ error: 'Données invalides' });
        }

        // Vérifier que les données ne sont pas vides
        if (Object.keys(data).length === 0) {
            return res.status(400).json({ error: 'Aucune sélection à partager' });
        }

        // Générer un ID unique
        let id = nanoid();
        const shares = await readShares();

        // S'assurer que l'ID est unique (très peu probable de collision)
        while (shares[id]) {
            id = nanoid();
        }

        // Sauvegarder
        shares[id] = {
            data,
            createdAt: new Date().toISOString(),
            accessCount: 0
        };

        await writeShares(shares);

        console.log(`✅ Lien court créé: ${id}`);
        res.json({ id, url: `${req.protocol}://${req.get('host')}/#s/${id}` });

    } catch (error) {
        console.error('Erreur création lien:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/share/:id - Récupérer les données d'un lien court
app.get('/api/share/:id', async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || id.length !== 6) {
            return res.status(400).json({ error: 'ID invalide' });
        }

        const shares = await readShares();
        const share = shares[id];

        if (!share) {
            return res.status(404).json({ error: 'Lien non trouvé' });
        }

        // Incrémenter le compteur d'accès
        share.accessCount = (share.accessCount || 0) + 1;
        share.lastAccessedAt = new Date().toISOString();
        await writeShares(shares);

        console.log(`📥 Lien accédé: ${id} (${share.accessCount} fois)`);
        res.json({ data: share.data });

    } catch (error) {
        console.error('Erreur récupération lien:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// GET /api/stats - Statistiques (optionnel)
app.get('/api/stats', async (req, res) => {
    try {
        const shares = await readShares();
        const stats = {
            totalShares: Object.keys(shares).length,
            totalAccess: Object.values(shares).reduce((sum, s) => sum + (s.accessCount || 0), 0)
        };
        res.json(stats);
    } catch (error) {
        console.error('Erreur stats:', error);
        res.status(500).json({ error: 'Erreur serveur' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 pour les routes API non trouvées
app.use('/api/*', (req, res) => {
    res.status(404).json({ error: 'Route API non trouvée' });
});

// Démarrage du serveur
async function startServer() {
    await initDataFile();

    app.listen(PORT, () => {
        console.log('');
        console.log('🎉 Kinklist Server démarré !');
        console.log(`📡 Serveur: http://localhost:${PORT}`);
        console.log(`🔗 API: http://localhost:${PORT}/api`);
        console.log('');
    });
}

startServer().catch(error => {
    console.error('❌ Erreur démarrage serveur:', error);
    process.exit(1);
});

// Gestion des erreurs non gérées
process.on('unhandledRejection', (error) => {
    console.error('❌ Erreur non gérée:', error);
});
