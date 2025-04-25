// rss-proxy.js
const https = require('https');
const http = require('http');
const fs = require('fs');

// Configuration
const PORT = 8081;            // Port 8081 pour éviter les conflits
const RSS2JSON_URL = 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fici.radio-canada.ca%2Frss%2F4159';
const UPDATE_INTERVAL = 15 * 60 * 1000;  // Intervalle de mise à jour (15 minutes)
const CACHE_FILE = 'rss-cache.json';     // Fichier de cache local

// Variables globales
let rssCache = null;

// Fonction pour récupérer le flux RSS via rss2json
function fetchRSS() {
    console.log(`Récupération du flux RSS via rss2json...`);
    
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
            }
        };
        
        https.get(RSS2JSON_URL, options, (res) => {
            if (res.statusCode !== 200) {
                reject(new Error(`Statut HTTP: ${res.statusCode}`));
                return;
            }
            
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                try {
                    // Parser les données JSON
                    const jsonData = JSON.parse(data);
                    
                    // Décoder les entités HTML dans les titres et descriptions
                    if (jsonData.items && jsonData.items.length > 0) {
                        jsonData.items.forEach(item => {
                            item.title = decodeHtmlEntities(item.title);
                            item.description = decodeHtmlEntities(item.description);
                            item.content = decodeHtmlEntities(item.content);
                        });
                    }
                    
                    // Convertir en XML pour MagicMirror
                    const xmlData = convertJsonToRss(jsonData);
                    rssCache = xmlData;
                    
                    // Sauvegarde dans le cache
                    fs.writeFileSync(CACHE_FILE, xmlData);
                    
                    console.log('Flux RSS récupéré et mis en cache avec succès');
                    resolve(xmlData);
                } catch (e) {
                    console.error('Erreur lors du traitement du flux RSS:', e);
                    reject(e);
                }
            });
        }).on('error', (e) => {
            console.error('Erreur lors de la récupération du flux RSS:', e);
            reject(e);
        });
    });
}

// Fonction pour décoder les entités HTML
function decodeHtmlEntities(text) {
    if (!text) return '';
    
    return text
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#39;/g, "'")
        .replace(/&#(\d+);/g, function(match, dec) {
            return String.fromCharCode(dec);
        });
}

// Convertit les données JSON de rss2json en format RSS XML
function convertJsonToRss(jsonData) {
    if (!jsonData || !jsonData.items) {
        return '<rss version="2.0"><channel><title>Erreur</title></channel></rss>';
    }
    
    let xml = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
<channel>
    <title>${escapeXml(jsonData.feed.title || 'Radio-Canada News')}</title>
    <link>${escapeXml(jsonData.feed.link || '')}</link>
    <description>${escapeXml(jsonData.feed.description || '')}</description>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
`;

    for (const item of jsonData.items) {
        xml += `
    <item>
        <title>${escapeXml(item.title || '')}</title>
        <link>${escapeXml(item.link || '')}</link>
        <description>${escapeXml(item.description || '')}</description>
        <pubDate>${escapeXml(item.pubDate || '')}</pubDate>
`;
        
        if (item.enclosure && item.enclosure.link) {
            xml += `        <enclosure url="${escapeXml(item.enclosure.link)}" type="${escapeXml(item.enclosure.type || 'image/jpeg')}" />\n`;
        }
        
        xml += `    </item>\n`;
    }

    xml += `</channel>
</rss>`;

    return xml;
}

// Fonction utilitaire pour échapper les caractères XML
function escapeXml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe.replace(/[<>&'"]/g, function (c) {
        switch (c) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '&': return '&amp;';
            case '\'': return '&apos;';
            case '"': return '&quot;';
        }
    });
}

// Charger depuis le cache si disponible
function loadFromCache() {
    try {
        if (fs.existsSync(CACHE_FILE)) {
            rssCache = fs.readFileSync(CACHE_FILE, 'utf8');
            console.log('Flux RSS chargé depuis le cache');
            return true;
        }
    } catch (e) {
        console.error('Erreur lors du chargement du cache:', e);
    }
    return false;
}

// Créer le serveur HTTP local
const server = http.createServer((req, res) => {
    if (req.url === '/rss') {
        if (rssCache) {
            res.writeHead(200, {
                'Content-Type': 'application/rss+xml',
                'Access-Control-Allow-Origin': '*',
                'Content-Length': Buffer.byteLength(rssCache),
                'Cache-Control': 'no-cache'
            });
            res.end(rssCache);
        } else {
            res.writeHead(503);
            res.end('Flux RSS non disponible');
        }
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

// Initialisation
async function init() {
    // Charger depuis le cache d'abord
    loadFromCache();
    
    // Puis tenter de mettre à jour
    try {
        await fetchRSS();
    } catch (e) {
        console.error('Erreur initiale, utilisation du cache si disponible');
    }
    
    // Configurer la mise à jour périodique
    setInterval(async () => {
        try {
            await fetchRSS();
        } catch (e) {
            console.error('Erreur lors de la mise à jour périodique:', e);
        }
    }, UPDATE_INTERVAL);
    
    // Démarrer le serveur
    server.listen(PORT, () => {
        console.log(`Proxy RSS en écoute sur http://localhost:${PORT}/rss`);
    });
}

// Démarrer l'application
init();
