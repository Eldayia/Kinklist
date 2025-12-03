// State management
let kinkSelections = {};
const STORAGE_KEY = 'kinklist-selections';

// Status types
const STATUS_TYPES = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
    loadSharedData(); // Check for shared data in URL
    renderKinklist();
    setupEventListeners();
    populateCategoryFilter();
});

// Load selections from localStorage
function loadFromLocalStorage() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        try {
            kinkSelections = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading saved data:', e);
            kinkSelections = {};
        }
    }
}

// Save selections to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(kinkSelections));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// Render the kinklist
function renderKinklist(filterCategory = 'all', filterStatus = 'all', searchTerm = '') {
    const container = document.getElementById('kinklist-container');
    container.innerHTML = '';

    Object.entries(kinksData).forEach(([category, kinks]) => {
        // Filter by category
        if (filterCategory !== 'all' && category !== filterCategory) {
            return;
        }

        // Filter kinks
        let filteredKinks = kinks.filter(kink => {
            const matchesSearch = searchTerm === '' ||
                kink.toLowerCase().includes(searchTerm.toLowerCase());

            const kinkId = `${category}::${kink}`;
            const kinkStatus = kinkSelections[kinkId];

            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'selected' && kinkStatus) ||
                (filterStatus !== 'selected' && kinkStatus === filterStatus);

            return matchesSearch && matchesStatus;
        });

        // Skip category if no kinks match
        if (filteredKinks.length === 0) {
            return;
        }

        // Create category section
        const categoryDiv = document.createElement('div');
        categoryDiv.className = 'category';
        categoryDiv.setAttribute('data-category', category);

        // Category header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-header';

        const titleH3 = document.createElement('h3');
        titleH3.className = 'category-title';
        titleH3.textContent = category;

        const countSpan = document.createElement('span');
        countSpan.className = 'category-count';
        const selectedCount = filteredKinks.filter(kink => {
            const kinkId = `${category}::${kink}`;
            return kinkSelections[kinkId];
        }).length;
        countSpan.textContent = `${selectedCount}/${filteredKinks.length} sélectionnés`;

        headerDiv.appendChild(titleH3);
        headerDiv.appendChild(countSpan);

        // Kinks grid
        const gridDiv = document.createElement('div');
        gridDiv.className = 'kinks-grid';

        filteredKinks.forEach(kink => {
            const kinkId = `${category}::${kink}`;
            const kinkDiv = createKinkElement(kink, kinkId);
            gridDiv.appendChild(kinkDiv);
        });

        categoryDiv.appendChild(headerDiv);
        categoryDiv.appendChild(gridDiv);
        container.appendChild(categoryDiv);
    });

    // Show message if no results
    if (container.children.length === 0) {
        const noResults = document.createElement('div');
        noResults.style.textAlign = 'center';
        noResults.style.padding = '3rem';
        noResults.style.color = 'var(--text-secondary)';
        noResults.innerHTML = '<h3>Aucun résultat trouvé</h3><p>Essayez de modifier vos filtres</p>';
        container.appendChild(noResults);
    }
}

// Create a kink element
function createKinkElement(kink, kinkId) {
    const kinkDiv = document.createElement('div');
    kinkDiv.className = 'kink-item';
    kinkDiv.setAttribute('data-kink-id', kinkId);

    const currentStatus = kinkSelections[kinkId];
    if (currentStatus) {
        kinkDiv.classList.add('selected');
    }

    // Kink name
    const nameSpan = document.createElement('span');
    nameSpan.className = 'kink-name';
    nameSpan.textContent = kink;

    // Status icons
    const statusDiv = document.createElement('div');
    statusDiv.className = 'kink-status';

    STATUS_TYPES.forEach(status => {
        const icon = document.createElement('span');
        icon.className = `icon icon-${status}`;
        icon.setAttribute('data-status', status);
        icon.setAttribute('role', 'button');
        icon.setAttribute('tabindex', '0');
        icon.setAttribute('aria-label', `Marquer comme ${getStatusLabel(status)}`);

        if (currentStatus === status) {
            icon.classList.add('active');
        }

        icon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleKinkStatus(kinkId, status);
        });

        icon.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                toggleKinkStatus(kinkId, status);
            }
        });

        statusDiv.appendChild(icon);
    });

    kinkDiv.appendChild(nameSpan);
    kinkDiv.appendChild(statusDiv);

    return kinkDiv;
}

// Get status label
function getStatusLabel(status) {
    const labels = {
        love: "J'adore",
        like: "J'aime",
        curious: "Curieux/se",
        maybe: "Peut-être",
        no: "Non merci",
        limit: "Hard Limit"
    };
    return labels[status] || status;
}

// Toggle kink status
function toggleKinkStatus(kinkId, status) {
    if (kinkSelections[kinkId] === status) {
        // Unselect if clicking the same status
        delete kinkSelections[kinkId];
    } else {
        // Select new status
        kinkSelections[kinkId] = status;
    }

    saveToLocalStorage();

    // Update the UI for this specific kink
    const kinkDiv = document.querySelector(`[data-kink-id="${kinkId}"]`);
    if (kinkDiv) {
        // Update selected class
        if (kinkSelections[kinkId]) {
            kinkDiv.classList.add('selected');
        } else {
            kinkDiv.classList.remove('selected');
        }

        // Update active icons
        const icons = kinkDiv.querySelectorAll('.kink-status .icon');
        icons.forEach(icon => {
            const iconStatus = icon.getAttribute('data-status');
            if (kinkSelections[kinkId] === iconStatus) {
                icon.classList.add('active');
            } else {
                icon.classList.remove('active');
            }
        });

        // Update category count
        const category = kinkDiv.closest('.category');
        if (category) {
            updateCategoryCount(category);
        }
    }
}

// Update category count
function updateCategoryCount(categoryElement) {
    const categoryName = categoryElement.getAttribute('data-category');
    const allKinks = categoryElement.querySelectorAll('.kink-item');
    const selectedKinks = categoryElement.querySelectorAll('.kink-item.selected');

    const countSpan = categoryElement.querySelector('.category-count');
    if (countSpan) {
        countSpan.textContent = `${selectedKinks.length}/${allKinks.length} sélectionnés`;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', (e) => {
        applyFilters();
    });

    // Category filter
    const categoryFilter = document.getElementById('category-filter');
    categoryFilter.addEventListener('change', () => {
        applyFilters();
    });

    // Status filter
    const statusFilter = document.getElementById('status-filter');
    statusFilter.addEventListener('change', () => {
        applyFilters();
    });

    // Share button
    const shareBtn = document.getElementById('share-btn');
    shareBtn.addEventListener('click', generateShareLink);

    // Export button (Image)
    const exportImageBtn = document.getElementById('export-image-btn');
    exportImageBtn.addEventListener('click', exportKinklistAsImage);

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', resetKinklist);
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('search').value;
    const categoryFilter = document.getElementById('category-filter').value;
    const statusFilter = document.getElementById('status-filter').value;

    renderKinklist(categoryFilter, statusFilter, searchTerm);
}

// Populate category filter
function populateCategoryFilter() {
    const categoryFilter = document.getElementById('category-filter');

    Object.keys(kinksData).forEach(category => {
        const option = document.createElement('option');
        option.value = category;
        option.textContent = category;
        categoryFilter.appendChild(option);
    });
}

// Export kinklist as image (robuste avec repli html2canvas)
async function exportKinklistAsImage() {
    const exportBtn = document.getElementById('export-image-btn');
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Génération en cours...';
    exportBtn.disabled = true;

    try {
        // 1) Sélections nécessaires
        if (Object.keys(kinkSelections).length === 0) {
            alert('Vous n\'avez aucune sélection à exporter. Sélectionnez des kinks avant d\'exporter en image.');
            return;
        }

        // 2) Agréger par catégories
        const categoriesWithSelections = {};
        Object.entries(kinkSelections).forEach(([kinkId, status]) => {
            const [category, kink] = kinkId.split('::');
            if (!categoriesWithSelections[category]) categoriesWithSelections[category] = [];
            categoriesWithSelections[category].push({ kink, status });
        });

        // 3) Config et hauteur totale (optimisé pour Discord mobile)
        const config = {
            width: 800,
            padding: 30,
            headerHeight: 110,
            legendHeight: 140,
            categoryHeaderHeight: 55,
            itemHeight: 50,
            itemsPerRow: 2,
            itemGap: 12,
            sectionGap: 25,
            footerHeight: 70,
            colors: { love: '#d81b60', like: '#1e88e5', curious: '#ffa726', maybe: '#9c27b0', no: '#757575', limit: '#000000' },
            labels: { love: "J'adore", like: "J'aime", curious: 'Curieux/se', maybe: 'Peut-être', no: 'Non merci', limit: 'Hard Limit' }
        };

        let totalHeight = config.padding * 2 + config.headerHeight + config.legendHeight + config.footerHeight;
        Object.values(categoriesWithSelections).forEach(kinks => {
            const rows = Math.ceil(kinks.length / config.itemsPerRow);
            totalHeight += config.categoryHeaderHeight + (rows * (config.itemHeight + config.itemGap)) + config.sectionGap;
        });

        // 4) Limite de taille des canvases (Chrome/Edge/Firefox ~16k-32k)
        const MAX_CANVAS = 16384; // sécurité multi-navigateurs
        if (totalHeight > MAX_CANVAS) {
            const proceed = confirm(
                'Votre export contient beaucoup d\'éléments et dépasse la taille maximale compatible.\n' +
                'Souhaitez-vous utiliser une capture de l\'interface actuelle à la place ? (html2canvas)\n\n' +
                'Astuce : appliquez un filtre par catégorie pour réduire la hauteur et réessayez.'
            );
            if (proceed && typeof window.html2canvas === 'function') {
                await exportUsingHtml2Canvas();
            } else {
                alert('Export annulé. Réduisez la liste via les filtres puis réessayez.');
            }
            return;
        }

        // 5) Dessiner sur canvas (méthode native)
        const canvas = document.createElement('canvas');
        const scale = 2; // HiDPI
        canvas.width = config.width * scale;
        canvas.height = totalHeight * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // Fond
        ctx.fillStyle = '#f5f5f5';
        ctx.fillRect(0, 0, config.width, totalHeight);

        let y = config.padding;

        // En-tête dégradé
        const headerGradient = ctx.createLinearGradient(config.padding, y, config.width - config.padding, y);
        headerGradient.addColorStop(0, '#667eea');
        headerGradient.addColorStop(1, '#764ba2');
        ctx.fillStyle = headerGradient;
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.headerHeight, 12, true, false);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Ma Kinklist', config.width / 2, y + 50);
        ctx.font = '20px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.globalAlpha = 0.9;
        ctx.fillText('Explorez et partagez vos préférences', config.width / 2, y + 85);
        ctx.globalAlpha = 1;
        y += config.headerHeight + 20;

        // Légende (2 lignes pour meilleure lisibilité)
        ctx.fillStyle = 'white';
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.legendHeight, 12, true, false);
        ctx.fillStyle = '#212121';
        ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText('Légende', config.padding + 20, y + 32);
        const legendItems = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];
        let legendX = config.padding + 20;
        let legendY = y + 65;
        legendItems.forEach((status, index) => {
            // Passer à la 2ème ligne après 3 items
            if (index === 3) {
                legendX = config.padding + 20;
                legendY = y + 105;
            }
            ctx.fillStyle = '#f5f5f5';
            ctx.font = '18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
            const pillWidth = ctx.measureText(config.labels[status]).width + 60;
            roundRect(ctx, legendX, legendY - 14, pillWidth, 36, 8, true, false);
            drawStatusIcon(ctx, status, legendX + 18, legendY, config.colors, 1.2);
            ctx.fillStyle = '#212121';
            ctx.font = '18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
            ctx.fillText(config.labels[status], legendX + 42, legendY + 6);
            legendX += pillWidth + 12;
        });
        y += config.legendHeight + 20;

        // Catégories + items
        Object.entries(categoriesWithSelections).forEach(([category, kinks]) => {
            const rows = Math.ceil(kinks.length / config.itemsPerRow);
            const categoryHeight = config.categoryHeaderHeight + (rows * (config.itemHeight + config.itemGap));
            ctx.fillStyle = 'white';
            roundRect(ctx, config.padding, y, config.width - config.padding * 2, categoryHeight, 12, true, false);
            ctx.fillStyle = '#212121';
            ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(category, config.padding + 20, y + 38);

            const itemWidth = (config.width - config.padding * 2 - 40) / config.itemsPerRow;
            kinks.forEach((item, index) => {
                const col = index % config.itemsPerRow;
                const row = Math.floor(index / config.itemsPerRow);
                const itemX = config.padding + 20 + col * (itemWidth + config.itemGap);
                const itemY = y + config.categoryHeaderHeight + row * (config.itemHeight + config.itemGap);
                ctx.fillStyle = '#f5f5f5';
                roundRect(ctx, itemX, itemY, itemWidth - config.itemGap, config.itemHeight, 8, true, false);
                drawStatusIcon(ctx, item.status, itemX + 15, itemY + config.itemHeight / 2, config.colors, 1.2);
                ctx.fillStyle = '#212121';
                ctx.font = '17px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
                ctx.textAlign = 'left';
                const maxTextWidth = itemWidth - 55;
                let text = item.kink;
                if (ctx.measureText(text).width > maxTextWidth) {
                    while (ctx.measureText(text + '...').width > maxTextWidth && text.length > 0) text = text.slice(0, -1);
                    text += '...';
                }
                ctx.fillText(text, itemX + 42, itemY + config.itemHeight / 2 + 6);
            });

            y += categoryHeight + config.sectionGap;
        });

        // Pied de page
        ctx.fillStyle = '#212121';
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.footerHeight, 12, true, false);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Développé par EldaDev / Twitter : @eldadev_ / @eldayia', config.width / 2, y + config.footerHeight / 2 + 6);

        // 6) Générer et télécharger
        const blob = await canvasToBlobAsync(canvas);
        if (!blob) throw new Error('Impossible de créer l\'image');
        downloadBlob(`kinklist-${new Date().toISOString().split('T')[0]}.png`, blob);
        alert('Votre kinklist a été exportée en image avec succès !');
    } catch (error) {
        console.error('Erreur export image:', error);
        // Repli html2canvas si dispo
        if (typeof window.html2canvas === 'function') {
            try {
                await exportUsingHtml2Canvas();
                return;
            } catch (e2) {
                console.error('Repli html2canvas échoué:', e2);
                alert('Échec de l\'exportation en image. Ouvrez la console pour plus de détails.');
            }
        } else {
            alert('Échec de l\'exportation en image.');
        }
    } finally {
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
    }

    // Helpers internes
    async function canvasToBlobAsync(canvas) {
        if (canvas.toBlob) {
            return await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        }
        // Polyfill via dataURL
        const dataUrl = canvas.toDataURL('image/png');
        const res = await fetch(dataUrl);
        return await res.blob();
    }

    function downloadBlob(filename, blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    async function exportUsingHtml2Canvas() {
        const target = document.querySelector('main.container') || document.body;
        const canvas = await window.html2canvas(target, {
            backgroundColor: '#ffffff',
            useCORS: true,
            scale: 2,
            windowWidth: target.scrollWidth,
            windowHeight: target.scrollHeight
        });
        const blob = await canvasToBlobAsync(canvas);
        if (!blob) throw new Error('Capture html2canvas impossible');
        downloadBlob(`kinklist-${new Date().toISOString().split('T')[0]}.png`, blob);
        alert('Votre kinklist a été exportée en image (mode capture) !');
    }
}

// Helper function to draw rounded rectangles
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
}

// Helper function to draw status icons
function drawStatusIcon(ctx, status, x, y, colors, scale = 1) {
    ctx.save();
    const size = 10 * scale; // Taille de base augmentée
    switch (status) {
        case 'love': // Rond
            ctx.fillStyle = colors.love;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'like': // Carré
            ctx.fillStyle = colors.like;
            roundRect(ctx, x - size, y - size, size * 2, size * 2, 3 * scale, true, false);
            break;
        case 'curious': // Triangle
            ctx.fillStyle = colors.curious;
            ctx.beginPath();
            ctx.moveTo(x, y - size * 1.1);
            ctx.lineTo(x + size * 1.1, y + size * 0.8);
            ctx.lineTo(x - size * 1.1, y + size * 0.8);
            ctx.closePath();
            ctx.fill();
            break;
        case 'maybe': // Losange
            ctx.fillStyle = colors.maybe;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-size * 0.75, -size * 0.75, size * 1.5, size * 1.5);
            ctx.restore();
            break;
        case 'no': // Croix
            ctx.strokeStyle = colors.no;
            ctx.lineWidth = 3 * scale;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - size * 0.75, y - size * 0.75);
            ctx.lineTo(x + size * 0.75, y + size * 0.75);
            ctx.moveTo(x + size * 0.75, y - size * 0.75);
            ctx.lineTo(x - size * 0.75, y + size * 0.75);
            ctx.stroke();
            break;
        case 'limit': // Étoile
            ctx.fillStyle = colors.limit;
            ctx.font = `${22 * scale}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x, y);
            break;
    }
    ctx.restore();
}

// Compression and encoding functions for sharing
function compressAndEncode(data) {
    // Convert to JSON string
    const jsonStr = JSON.stringify(data);
    // Convert to base64 with URL-safe characters
    const encoded = btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, (match, p1) => {
        return String.fromCharCode(parseInt(p1, 16));
    }));
    // Make it URL-safe
    return encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function decodeAndDecompress(encoded) {
    try {
        // Restore base64 padding and standard characters
        let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
            base64 += '=';
        }
        // Decode from base64
        const jsonStr = decodeURIComponent(Array.prototype.map.call(atob(base64), (c) => {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Error decoding shared data:', e);
        return null;
    }
}

// Generate share link
function generateShareLink() {
    if (Object.keys(kinkSelections).length === 0) {
        alert('Vous n\'avez aucune sélection à partager. Sélectionnez des kinks avant de partager.');
        return;
    }

    const encoded = compressAndEncode(kinkSelections);
    const url = new URL(window.location.href);
    url.hash = `share=${encoded}`;

    // Copy to clipboard
    navigator.clipboard.writeText(url.toString()).then(() => {
        alert('Lien de partage copié dans le presse-papier !\n\nPartagez ce lien pour que d\'autres puissent voir votre kinklist.');
    }).catch(() => {
        // Fallback: show the link in a prompt
        prompt('Copiez ce lien pour partager votre kinklist :', url.toString());
    });
}

// Load shared data from URL
function loadSharedData() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#share=')) {
        const encoded = hash.substring(7); // Remove '#share='
        const sharedSelections = decodeAndDecompress(encoded);

        if (sharedSelections) {
            const hasLocalData = Object.keys(kinkSelections).length > 0;

            if (hasLocalData) {
                const choice = confirm(
                    'Vous consultez une kinklist partagée.\n\n' +
                    'Voulez-vous remplacer votre kinklist actuelle par celle-ci ?\n\n' +
                    'OK = Remplacer\n' +
                    'Annuler = Voir sans remplacer'
                );

                if (choice) {
                    kinkSelections = sharedSelections;
                    saveToLocalStorage();
                    // Clear the hash after importing
                    window.location.hash = '';
                    alert('Kinklist importée avec succès !');
                } else {
                    // Just display without saving
                    kinkSelections = sharedSelections;
                }
            } else {
                // No local data, just import
                const choice = confirm(
                    'Vous consultez une kinklist partagée.\n\n' +
                    'Voulez-vous l\'importer dans votre profil ?\n\n' +
                    'OK = Importer\n' +
                    'Annuler = Voir uniquement'
                );

                if (choice) {
                    kinkSelections = sharedSelections;
                    saveToLocalStorage();
                    // Clear the hash after importing
                    window.location.hash = '';
                    alert('Kinklist importée avec succès !');
                } else {
                    // Just display without saving
                    kinkSelections = sharedSelections;
                }
            }
        } else {
            alert('Le lien de partage est invalide ou corrompu.');
            window.location.hash = '';
        }
    }
}

// Reset kinklist
function resetKinklist() {
    const confirmReset = confirm(
        'Êtes-vous sûr(e) de vouloir réinitialiser toute votre kinklist ?\n\n' +
        'Cette action est irréversible.'
    );

    if (confirmReset) {
        kinkSelections = {};
        saveToLocalStorage();
        applyFilters();
        alert('Votre kinklist a été réinitialisée.');
    }
}

// Keyboard navigation improvements
document.addEventListener('keydown', (e) => {
    // Quick selection with number keys when focused on a kink
    if (e.key >= '1' && e.key <= '6') {
        const focused = document.activeElement;
        if (focused && focused.classList.contains('icon')) {
            e.preventDefault();
            const index = parseInt(e.key) - 1;
            const kinkItem = focused.closest('.kink-item');
            if (kinkItem) {
                const icons = kinkItem.querySelectorAll('.kink-status .icon');
                if (icons[index]) {
                    icons[index].click();
                }
            }
        }
    }
});

// Add statistics function
function getStatistics() {
    const stats = {
        total: 0,
        love: 0,
        like: 0,
        curious: 0,
        maybe: 0,
        no: 0,
        limit: 0
    };

    Object.values(kinkSelections).forEach(status => {
        stats.total++;
        stats[status]++;
    });

    return stats;
}

// Console helper for statistics
window.getKinklistStats = getStatistics;

console.log('Kinklist chargée avec succès ! 🎉');
console.log('Utilisez getKinklistStats() dans la console pour voir vos statistiques.');
