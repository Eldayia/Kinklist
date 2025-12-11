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

    // Share site button (in header)
    const shareSiteBtn = document.getElementById('share-site-btn');
    if (shareSiteBtn) {
        shareSiteBtn.addEventListener('click', shareSiteLink);
    }

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

        // 3) Config et hauteur totale (mise en page large avec catégories en colonnes)
        // Configuration optimisée pour Discord (8 colonnes = 4 catégories × 2 items = image très compacte)
        const config = {
            width: 2400,
            padding: 35,
            headerHeight: 110,
            legendHeight: 80,
            categoryHeaderHeight: 65,
            itemHeight: 58,
            itemsPerRow: 2, // 2 items par ligne dans chaque catégorie
            itemGap: 12,
            categoriesPerRow: 4, // 4 colonnes de catégories
            categoryGap: 20,
            sectionGap: 25,
            footerHeight: 75,
            colors: { love: '#ef4444', like: '#fdba74', curious: '#3b82f6', maybe: '#06b6d4', no: '#525252', limit: '#000000' },
            labels: { love: "J'adore", like: "J'aime", curious: 'Curieux/se', maybe: 'Peut-être', no: 'Non merci', limit: 'Hard Limit' }
        };

        // Calcul de la hauteur avec catégories en colonnes
        const categories = Object.entries(categoriesWithSelections);
        const categoryWidth = (config.width - config.padding * 2 - config.categoryGap * (config.categoriesPerRow - 1)) / config.categoriesPerRow;

        // Organiser les catégories en lignes
        let rowHeights = [];
        for (let i = 0; i < categories.length; i += config.categoriesPerRow) {
            let maxHeightInRow = 0;
            for (let j = 0; j < config.categoriesPerRow && i + j < categories.length; j++) {
                const kinks = categories[i + j][1];
                const rows = Math.ceil(kinks.length / config.itemsPerRow);
                const categoryHeight = config.categoryHeaderHeight + (rows * (config.itemHeight + config.itemGap));
                maxHeightInRow = Math.max(maxHeightInRow, categoryHeight);
            }
            rowHeights.push(maxHeightInRow);
        }

        let totalHeight = config.padding * 2 + config.headerHeight + config.legendHeight + config.footerHeight;
        totalHeight += rowHeights.reduce((sum, height) => sum + height + config.sectionGap, 0);

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

        // 5) Dessiner sur canvas (méthode native) avec résolution optimisée pour Discord
        const canvas = document.createElement('canvas');
        const scale = 2.5; // Équilibre qualité/taille pour Discord
        canvas.width = config.width * scale;
        canvas.height = totalHeight * scale;
        const ctx = canvas.getContext('2d');
        ctx.scale(scale, scale);

        // Optimisation du rendu texte
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.textRendering = 'optimizeLegibility';

        // Fond
        ctx.fillStyle = '#fafaf9';
        ctx.fillRect(0, 0, config.width, totalHeight);

        let y = config.padding;

        // En-tête avec dégradé violet
        const headerGradient = ctx.createLinearGradient(config.padding, y, config.width - config.padding, y);
        headerGradient.addColorStop(0, '#a855f7');
        headerGradient.addColorStop(1, '#ec4899');
        ctx.fillStyle = headerGradient;
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.headerHeight, 12, true, false);
        ctx.fillStyle = 'white';
        ctx.font = '700 54px Fraunces, serif';
        ctx.textAlign = 'center';
        ctx.fillText('Ma Kinklist', config.width / 2, y + 52);
        ctx.font = '400 26px "DM Sans", sans-serif';
        ctx.globalAlpha = 0.95;
        ctx.fillText('Explorez et partagez vos préférences', config.width / 2, y + 88);
        ctx.globalAlpha = 1;
        y += config.headerHeight + 20;

        // Légende sur une seule ligne centrée
        ctx.fillStyle = 'white';
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.legendHeight, 12, true, false);
        ctx.strokeStyle = '#e7e5e4';
        ctx.lineWidth = 1;
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.legendHeight, 12, false, true);

        const legendItems = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];
        const legendBgs = { love: '#fee2e2', like: '#ffedd5', curious: '#dbeafe', maybe: '#cffafe', no: '#e5e5e5', limit: '#f5f5f5' };

        // Calculer la largeur totale
        ctx.font = '700 28px "DM Sans", sans-serif';
        const legendTitleWidth = ctx.measureText('LÉGENDE').width + 35;
        ctx.font = '500 24px "DM Sans", sans-serif';
        let totalWidth = legendTitleWidth;
        const pillWidths = [];
        legendItems.forEach((status) => {
            const pillWidth = ctx.measureText(config.labels[status]).width + 70;
            pillWidths.push(pillWidth);
            totalWidth += pillWidth + 12;
        });

        // Centrer horizontalement
        let legendX = (config.width - totalWidth) / 2;
        const legendY = y + config.legendHeight / 2;

        // Dessiner "LÉGENDE"
        ctx.fillStyle = '#000000';
        ctx.font = '700 28px "DM Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText('LÉGENDE', legendX, legendY);
        legendX += legendTitleWidth;

        // Dessiner les items
        legendItems.forEach((status, index) => {
            const pillWidth = pillWidths[index];
            ctx.fillStyle = legendBgs[status];
            roundRect(ctx, legendX, legendY - 19, pillWidth, 38, 8, true, false);
            drawStatusIcon(ctx, status, legendX + 20, legendY, config.colors, 1.5);
            ctx.fillStyle = config.colors[status];
            ctx.font = '600 24px "DM Sans", sans-serif';
            ctx.textBaseline = 'middle';
            ctx.fillText(config.labels[status], legendX + 45, legendY);
            legendX += pillWidth + 12;
        });

        y += config.legendHeight + 25;

        // Catégories + items (en colonnes)
        let rowIndex = 0;
        for (let i = 0; i < categories.length; i += config.categoriesPerRow) {
            const rowHeight = rowHeights[rowIndex];

            // Dessiner chaque catégorie de cette ligne
            for (let j = 0; j < config.categoriesPerRow && i + j < categories.length; j++) {
                const [category, kinks] = categories[i + j];
                const categoryX = config.padding + j * (categoryWidth + config.categoryGap);

                const rows = Math.ceil(kinks.length / config.itemsPerRow);
                const categoryHeight = config.categoryHeaderHeight + (rows * (config.itemHeight + config.itemGap));

                // Fond de la catégorie
                ctx.fillStyle = 'white';
                roundRect(ctx, categoryX, y, categoryWidth, categoryHeight, 12, true, false);
                ctx.strokeStyle = '#e7e5e4';
                ctx.lineWidth = 1;
                roundRect(ctx, categoryX, y, categoryWidth, categoryHeight, 12, false, true);

                // Header de la catégorie
                ctx.fillStyle = '#f5f5f4';
                roundRect(ctx, categoryX, y, categoryWidth, config.categoryHeaderHeight, 12, true, false);
                ctx.fillStyle = '#1c1917';
                ctx.font = '600 32px Fraunces, serif';
                ctx.textAlign = 'left';
                ctx.fillText(category, categoryX + 25, y + 42);

                // Items de la catégorie
                const itemWidth = (categoryWidth - 40) / config.itemsPerRow;
                kinks.forEach((item, index) => {
                    const col = index % config.itemsPerRow;
                    const row = Math.floor(index / config.itemsPerRow);
                    const itemX = categoryX + 20 + col * (itemWidth + config.itemGap);
                    const itemY = y + config.categoryHeaderHeight + row * (config.itemHeight + config.itemGap);

                    ctx.fillStyle = '#fafaf9';
                    roundRect(ctx, itemX, itemY, itemWidth - config.itemGap, config.itemHeight, 8, true, false);
                    drawStatusIcon(ctx, item.status, itemX + 20, itemY + config.itemHeight / 2, config.colors, 1.8);
                    ctx.fillStyle = '#1c1917';
                    ctx.font = '600 24px "DM Sans", sans-serif';
                    ctx.textAlign = 'left';
                    const maxTextWidth = itemWidth - 70;
                    let text = item.kink;
                    if (ctx.measureText(text).width > maxTextWidth) {
                        while (ctx.measureText(text + '...').width > maxTextWidth && text.length > 0) text = text.slice(0, -1);
                        text += '...';
                    }
                    ctx.fillText(text, itemX + 55, itemY + config.itemHeight / 2 + 8);
                });
            }

            y += rowHeight + config.sectionGap;
            rowIndex++;
        }

        // Pied de page
        ctx.fillStyle = 'white';
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.footerHeight, 12, true, false);
        ctx.strokeStyle = '#e7e5e4';
        ctx.lineWidth = 1;
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.footerHeight, 12, false, true);
        ctx.fillStyle = '#78716c';
        ctx.font = '500 24px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Développé par EldaDev / Twitter : @eldadev_ / @eldayia', config.width / 2, y + config.footerHeight / 2 + 8);

        // 6) Générer et télécharger en JPEG haute qualité
        const blob = await canvasToBlobAsync(canvas);
        if (!blob) throw new Error('Impossible de créer l\'image');
        downloadBlob(`kinklist-${new Date().toISOString().split('T')[0]}.jpg`, blob);
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
            return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.95));
        }
        // Polyfill via dataURL
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
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
    const size = 12 * scale; // Taille de base augmentée pour meilleure visibilité
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
            ctx.font = `${26 * scale}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x, y);
            break;
    }
    ctx.restore();
}

// Build an index mapping kinkId <-> numeric ID for compression
function buildKinkIndex() {
    const index = [];
    const reverseIndex = {};
    let id = 0;

    Object.entries(kinksData).forEach(([category, kinks]) => {
        kinks.forEach(kink => {
            const kinkId = `${category}::${kink}`;
            index[id] = kinkId;
            reverseIndex[kinkId] = id;
            id++;
        });
    });

    return { index, reverseIndex };
}

// Encode status to a single character
function encodeStatus(status) {
    const map = { love: 'l', like: 'k', curious: 'c', maybe: 'm', no: 'n', limit: 'h' };
    return map[status] || '';
}

// Decode character to status
function decodeStatus(char) {
    const map = { l: 'love', k: 'like', c: 'curious', m: 'maybe', n: 'no', h: 'limit' };
    return map[char] || '';
}

// Compression and encoding functions for sharing (optimized format with gzip)
function compressAndEncode(data) {
    const { reverseIndex } = buildKinkIndex();

    // Convert to compact format: [[id, statusChar], ...]
    const compact = Object.entries(data).map(([kinkId, status]) => {
        const id = reverseIndex[kinkId];
        if (id === undefined) return null; // Kink not found
        return [id, encodeStatus(status)];
    }).filter(x => x !== null);

    // Check if all statuses are the same for ultra-compact format
    const statuses = compact.map(x => x[1]);
    const allSameStatus = statuses.length > 0 && statuses.every(s => s === statuses[0]);

    let str;
    if (allSameStatus && compact.length > 5) {
        // Ultra-compact: "s:id,id,id,..." where s is the common status
        const ids = compact.map(([id]) => id.toString(36)).join(',');
        str = `${statuses[0]}:${ids}`;
    } else {
        // Regular compact: "ids,ids,..." where each entry is id+status in base36
        str = compact.map(([id, s]) => `${id.toString(36)}${s}`).join(',');
    }

    // Compress with gzip (pako required)
    if (typeof pako === 'undefined') {
        throw new Error('La bibliothèque de compression (pako) n\'est pas chargée. Impossible de générer le lien de partage.');
    }

    try {
        // Compress the string
        const compressed = pako.deflate(str);
        // Convert Uint8Array to binary string
        const binaryStr = String.fromCharCode.apply(null, compressed);
        // Encode to base64
        const encoded = btoa(binaryStr);
        // Make it URL-safe and add version prefix
        return 'v2_' + encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    } catch (e) {
        throw new Error('Échec de la compression des données : ' + e.message);
    }
}

function decodeAndDecompress(encoded) {
    try {
        const { index } = buildKinkIndex();
        let str;

        // Check if it's v2 format (gzip compressed)
        if (encoded.startsWith('v2_')) {
            const encodedData = encoded.substring(3);

            if (typeof pako !== 'undefined') {
                try {
                    // Restore base64 padding and standard characters
                    let base64 = encodedData.replace(/-/g, '+').replace(/_/g, '/');
                    while (base64.length % 4) {
                        base64 += '=';
                    }

                    // Decode from base64 to binary string
                    const binaryStr = atob(base64);

                    // Convert binary string to Uint8Array
                    const compressed = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                        compressed[i] = binaryStr.charCodeAt(i);
                    }

                    // Decompress
                    const decompressed = pako.inflate(compressed, { to: 'string' });
                    str = decompressed;
                } catch (e) {
                    console.error('Decompression failed:', e);
                    return null;
                }
            } else {
                console.error('pako library not loaded');
                return null;
            }
        } else {
            // Legacy format (uncompressed)
            let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }
            str = atob(base64);
        }

        // Parse compact format
        const result = {};

        // Check if it's ultra-compact format (s:id,id,id,...)
        if (str.includes(':') && str.indexOf(':') < 5) {
            const [statusChar, idsStr] = str.split(':');
            const status = decodeStatus(statusChar);

            if (status) {
                idsStr.split(',').forEach(idStr => {
                    if (!idStr) return;
                    const id = parseInt(idStr, 36);
                    if (isNaN(id)) return;

                    const kinkId = index[id];
                    if (kinkId) {
                        result[kinkId] = status;
                    }
                });
            }
        } else {
            // Regular compact format
            str.split(',').forEach(pair => {
                if (!pair) return;

                // Extract status character (last char)
                const statusChar = pair.slice(-1);
                const idStr = pair.slice(0, -1);

                const id = parseInt(idStr, 36);
                if (isNaN(id)) return;

                const kinkId = index[id];
                const status = decodeStatus(statusChar);

                if (kinkId && status) {
                    result[kinkId] = status;
                }
            });
        }

        return result;
    } catch (e) {
        console.error('Error decoding shared data:', e);
        return null;
    }
}

// Share site link (without selections)
function shareSiteLink() {
    const siteUrl = 'https://kinklist.eldadev.fr';

    // Copy to clipboard
    navigator.clipboard.writeText(siteUrl).then(() => {
        alert('Lien du site copié dans le presse-papier !\n\n' + siteUrl);
    }).catch(() => {
        // Fallback: show the link in a prompt
        prompt('Copiez ce lien pour partager le site :', siteUrl);
    });
}

// Generate share link (avec API backend et fallback)
async function generateShareLink() {
    if (Object.keys(kinkSelections).length === 0) {
        alert('Vous n\'avez aucune sélection à partager. Sélectionnez des kinks avant de partager.');
        return;
    }

    try {
        // Tentative d'appel à l'API backend pour créer un lien court
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: kinkSelections })
        });

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const { url } = await response.json();

        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert(`Lien de partage copié dans le presse-papier !\n\n${url}\n\nPartagez ce lien pour que d'autres puissent voir votre kinklist.`);
        }).catch(() => {
            // Fallback: show the link in a prompt
            prompt('Copiez ce lien pour partager votre kinklist :', url);
        });
    } catch (error) {
        console.warn('API backend non disponible, utilisation du format legacy:', error);

        // Fallback vers l'ancien système compressé si l'API n'est pas disponible
        try {
            const encoded = compressAndEncode(kinkSelections);
            const url = new URL(window.location.href);
            url.hash = `share=${encoded}`;

            // Copy to clipboard
            navigator.clipboard.writeText(url.toString()).then(() => {
                alert('Lien de partage copié dans le presse-papier !\n\nNote : Lien au format legacy (backend non disponible).\n\nPartagez ce lien pour que d\'autres puissent voir votre kinklist.');
            }).catch(() => {
                // Fallback: show the link in a prompt
                prompt('Copiez ce lien pour partager votre kinklist :', url.toString());
            });
        } catch (fallbackError) {
            console.error('Erreur lors du fallback:', fallbackError);
            alert('Erreur : Impossible de générer le lien de partage.\n\n' + fallbackError.message);
        }
    }
}

// Load shared data from URL
async function loadSharedData() {
    const hash = window.location.hash;

    // Format court : #s/abc123
    if (hash && hash.startsWith('#s/')) {
        const id = hash.substring(3); // Remove '#s/'

        if (id.length === 6) {
            try {
                const response = await fetch(`/api/share/${id}`);

                if (!response.ok) {
                    throw new Error(`Lien non trouvé (${response.status})`);
                }

                const { data: sharedSelections } = await response.json();
                await handleSharedData(sharedSelections);
            } catch (error) {
                console.error('Erreur chargement lien court:', error);
                alert('Erreur : Le lien de partage est invalide ou a expiré.');
                window.location.hash = '';
            }
        } else {
            alert('Format de lien invalide.');
            window.location.hash = '';
        }
    }
    // Format legacy : #share=v2_...
    else if (hash && hash.startsWith('#share=')) {
        const encoded = hash.substring(7); // Remove '#share='
        const sharedSelections = decodeAndDecompress(encoded);

        if (sharedSelections) {
            await handleSharedData(sharedSelections);
        } else {
            alert('Le lien de partage est invalide ou corrompu.');
            window.location.hash = '';
        }
    }
}

// Helper function to handle shared data import
async function handleSharedData(sharedSelections) {
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
            window.location.hash = '';
            alert('Kinklist importée avec succès !');
        } else {
            // Just display without saving
            kinkSelections = sharedSelections;
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
