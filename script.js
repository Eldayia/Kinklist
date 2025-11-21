// State management
let kinkSelections = {};
const STORAGE_KEY = 'kinklist-selections';

// Status types
const STATUS_TYPES = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    loadFromLocalStorage();
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

    // Export button (JSON)
    const exportBtn = document.getElementById('export-btn');
    exportBtn.addEventListener('click', exportKinklist);

    // Export button (Image)
    const exportImageBtn = document.getElementById('export-image-btn');
    exportImageBtn.addEventListener('click', exportKinklistAsImage);

    // Import button
    const importBtn = document.getElementById('import-btn');
    importBtn.addEventListener('click', () => {
        document.getElementById('import-input').click();
    });

    // Import file input
    const importInput = document.getElementById('import-input');
    importInput.addEventListener('change', importKinklist);

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

// Export kinklist
function exportKinklist() {
    const exportData = {
        version: '1.0',
        date: new Date().toISOString(),
        selections: kinkSelections
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kinklist-${new Date().toISOString().split('T')[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);

    alert('Votre kinklist a été exportée avec succès !');
}

// Export kinklist as image (méthode native sans dépendance externe)
function exportKinklistAsImage() {
    const exportBtn = document.getElementById('export-image-btn');
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Génération en cours...';
    exportBtn.disabled = true;

    // Check if there are any selections
    if (Object.keys(kinkSelections).length === 0) {
        alert('Vous n\'avez aucune sélection à exporter. Sélectionnez des kinks avant d\'exporter en image.');
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
        return;
    }

    // Organize selections by category
    const categoriesWithSelections = {};
    Object.entries(kinkSelections).forEach(([kinkId, status]) => {
        const [category, kink] = kinkId.split('::');
        if (!categoriesWithSelections[category]) {
            categoriesWithSelections[category] = [];
        }
        categoriesWithSelections[category].push({ kink, status });
    });

    // Configuration
    const config = {
        width: 1200,
        padding: 40,
        headerHeight: 100,
        legendHeight: 80,
        categoryHeaderHeight: 50,
        itemHeight: 40,
        itemsPerRow: 3,
        itemGap: 10,
        sectionGap: 30,
        footerHeight: 80,
        colors: {
            love: '#d81b60',
            like: '#1e88e5',
            curious: '#ffa726',
            maybe: '#9c27b0',
            no: '#757575',
            limit: '#000000'
        },
        labels: {
            love: "J'adore",
            like: "J'aime",
            curious: "Curieux/se",
            maybe: "Peut-être",
            no: "Non merci",
            limit: "Hard Limit"
        }
    };

    // Calculate total height
    let totalHeight = config.padding * 2 + config.headerHeight + config.legendHeight + config.footerHeight;
    Object.values(categoriesWithSelections).forEach(kinks => {
        const rows = Math.ceil(kinks.length / config.itemsPerRow);
        totalHeight += config.categoryHeaderHeight + (rows * (config.itemHeight + config.itemGap)) + config.sectionGap;
    });

    // Create canvas
    const canvas = document.createElement('canvas');
    const scale = 2; // For high DPI
    canvas.width = config.width * scale;
    canvas.height = totalHeight * scale;
    const ctx = canvas.getContext('2d');
    ctx.scale(scale, scale);

    // Background
    ctx.fillStyle = '#f5f5f5';
    ctx.fillRect(0, 0, config.width, totalHeight);

    let y = config.padding;

    // Draw header with gradient
    const headerGradient = ctx.createLinearGradient(config.padding, y, config.width - config.padding, y);
    headerGradient.addColorStop(0, '#667eea');
    headerGradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = headerGradient;
    roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.headerHeight, 12, true, false);

    ctx.fillStyle = 'white';
    ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ma Kinklist', config.width / 2, y + 45);
    ctx.font = '16px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.globalAlpha = 0.9;
    ctx.fillText('Exportée le ' + new Date().toLocaleDateString('fr-FR'), config.width / 2, y + 75);
    ctx.globalAlpha = 1;

    y += config.headerHeight + 20;

    // Draw legend
    ctx.fillStyle = 'white';
    roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.legendHeight, 12, true, false);

    ctx.fillStyle = '#212121';
    ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('Légende', config.padding + 20, y + 28);

    // Draw legend items
    const legendItems = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];
    let legendX = config.padding + 20;
    const legendY = y + 50;
    legendItems.forEach(status => {
        // Background pill
        ctx.fillStyle = '#f5f5f5';
        const pillWidth = ctx.measureText(config.labels[status]).width + 50;
        roundRect(ctx, legendX, legendY - 12, pillWidth, 30, 6, true, false);

        // Draw icon
        drawStatusIcon(ctx, status, legendX + 12, legendY, config.colors);

        // Draw label
        ctx.fillStyle = '#212121';
        ctx.font = '14px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.fillText(config.labels[status], legendX + 32, legendY + 5);

        legendX += pillWidth + 15;
    });

    y += config.legendHeight + 20;

    // Draw categories
    Object.entries(categoriesWithSelections).forEach(([category, kinks]) => {
        const rows = Math.ceil(kinks.length / config.itemsPerRow);
        const categoryHeight = config.categoryHeaderHeight + (rows * (config.itemHeight + config.itemGap));

        // Category background
        ctx.fillStyle = 'white';
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, categoryHeight, 12, true, false);

        // Category title
        ctx.fillStyle = '#212121';
        ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(category, config.padding + 20, y + 32);

        // Draw items
        const itemWidth = (config.width - config.padding * 2 - 60) / config.itemsPerRow;
        kinks.forEach((item, index) => {
            const col = index % config.itemsPerRow;
            const row = Math.floor(index / config.itemsPerRow);
            const itemX = config.padding + 20 + col * (itemWidth + config.itemGap);
            const itemY = y + config.categoryHeaderHeight + row * (config.itemHeight + config.itemGap);

            // Item background
            ctx.fillStyle = '#f5f5f5';
            roundRect(ctx, itemX, itemY, itemWidth - config.itemGap, config.itemHeight, 6, true, false);

            // Draw status icon
            drawStatusIcon(ctx, item.status, itemX + 12, itemY + config.itemHeight / 2, config.colors);

            // Draw kink name
            ctx.fillStyle = '#212121';
            ctx.font = '14px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
            ctx.textAlign = 'left';
            const maxTextWidth = itemWidth - 50;
            let text = item.kink;
            if (ctx.measureText(text).width > maxTextWidth) {
                while (ctx.measureText(text + '...').width > maxTextWidth && text.length > 0) {
                    text = text.slice(0, -1);
                }
                text += '...';
            }
            ctx.fillText(text, itemX + 35, itemY + config.itemHeight / 2 + 5);
        });

        y += categoryHeight + config.sectionGap;
    });

    // Draw footer
    ctx.fillStyle = '#212121';
    roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.footerHeight, 12, true, false);

    ctx.fillStyle = 'white';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.textAlign = 'center';
    ctx.globalAlpha = 0.9;
    ctx.fillText('Site accessible aux daltoniens - Icônes : rond, carré, triangle, losange, croix et étoile', config.width / 2, y + 30);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif';
    ctx.fillText('Développé par EldaDev', config.width / 2, y + 55);

    // Download the image
    try {
        canvas.toBlob(function(blob) {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `kinklist-${new Date().toISOString().split('T')[0]}.png`;
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
                alert('Votre kinklist a été exportée en image avec succès !');
            } else {
                throw new Error('Impossible de créer l\'image');
            }
            exportBtn.textContent = originalText;
            exportBtn.disabled = false;
        }, 'image/png');
    } catch (error) {
        console.error('Error exporting image:', error);
        alert('Erreur lors de l\'exportation: ' + error.message);
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
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
function drawStatusIcon(ctx, status, x, y, colors) {
    ctx.save();
    switch (status) {
        case 'love': // Rond
            ctx.fillStyle = colors.love;
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fill();
            break;
        case 'like': // Carré
            ctx.fillStyle = colors.like;
            roundRect(ctx, x - 8, y - 8, 16, 16, 3, true, false);
            break;
        case 'curious': // Triangle
            ctx.fillStyle = colors.curious;
            ctx.beginPath();
            ctx.moveTo(x, y - 9);
            ctx.lineTo(x + 9, y + 7);
            ctx.lineTo(x - 9, y + 7);
            ctx.closePath();
            ctx.fill();
            break;
        case 'maybe': // Losange
            ctx.fillStyle = colors.maybe;
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(Math.PI / 4);
            ctx.fillRect(-6, -6, 12, 12);
            ctx.restore();
            break;
        case 'no': // Croix
            ctx.strokeStyle = colors.no;
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.moveTo(x - 6, y - 6);
            ctx.lineTo(x + 6, y + 6);
            ctx.moveTo(x + 6, y - 6);
            ctx.lineTo(x - 6, y + 6);
            ctx.stroke();
            break;
        case 'limit': // Étoile
            ctx.fillStyle = colors.limit;
            ctx.font = '18px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', x, y);
            break;
    }
    ctx.restore();
}

// Import kinklist
function importKinklist(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
        try {
            const importData = JSON.parse(e.target.result);

            if (importData.selections) {
                const confirmImport = confirm(
                    'Voulez-vous remplacer votre kinklist actuelle par celle importée ?\n\n' +
                    'Cliquez sur OK pour remplacer, ou Annuler pour fusionner.'
                );

                if (confirmImport) {
                    // Replace
                    kinkSelections = importData.selections;
                } else {
                    // Merge
                    kinkSelections = { ...kinkSelections, ...importData.selections };
                }

                saveToLocalStorage();
                applyFilters();

                alert('Kinklist importée avec succès !');
            } else {
                alert('Format de fichier invalide.');
            }
        } catch (error) {
            console.error('Error importing:', error);
            alert('Erreur lors de l\'importation du fichier.');
        }
    };

    reader.readAsText(file);

    // Reset input
    event.target.value = '';
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
