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

// Export kinklist as image
function exportKinklistAsImage() {
    // Show loading indicator
    const exportBtn = document.getElementById('export-image-btn');
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Génération en cours...';
    exportBtn.disabled = true;

    // Create a temporary container for the export
    const exportContainer = document.createElement('div');
    exportContainer.id = 'export-container';
    exportContainer.style.cssText = `
        position: absolute;
        left: -9999px;
        top: 0;
        width: 1200px;
        background: #f5f5f5;
        padding: 20px;
    `;

    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 30px;
        border-radius: 12px;
        margin-bottom: 20px;
        text-align: center;
    `;
    header.innerHTML = `
        <h1 style="font-size: 2rem; margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Ma Kinklist</h1>
        <p style="margin: 0; opacity: 0.9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Exportée le ${new Date().toLocaleDateString('fr-FR')}</p>
    `;
    exportContainer.appendChild(header);

    // Create legend
    const legend = document.createElement('div');
    legend.style.cssText = `
        background: white;
        padding: 20px;
        border-radius: 12px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    `;
    legend.innerHTML = `
        <h2 style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Légende</h2>
        <div style="display: flex; flex-wrap: wrap; gap: 15px;">
            <span style="display: flex; align-items: center; gap: 8px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="color: #d81b60; font-size: 20px;">❤</span> J'adore
            </span>
            <span style="display: flex; align-items: center; gap: 8px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="width: 20px; height: 20px; background: #1e88e5; border-radius: 4px; display: inline-block;"></span> J'aime
            </span>
            <span style="display: flex; align-items: center; gap: 8px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="width: 0; height: 0; border-left: 10px solid transparent; border-right: 10px solid transparent; border-bottom: 17px solid #ffa726; display: inline-block;"></span> Curieux/se
            </span>
            <span style="display: flex; align-items: center; gap: 8px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="width: 14px; height: 14px; background: #9c27b0; transform: rotate(45deg); border-radius: 2px; display: inline-block;"></span> Peut-être
            </span>
            <span style="display: flex; align-items: center; gap: 8px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="color: #757575; font-size: 20px; font-weight: bold;">✕</span> Non merci
            </span>
            <span style="display: flex; align-items: center; gap: 8px; background: #f5f5f5; padding: 8px 12px; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <span style="color: #000; font-size: 20px;">⚠</span> Hard Limit
            </span>
        </div>
    `;
    exportContainer.appendChild(legend);

    // Create categories with selections only
    const categoriesWithSelections = {};
    Object.entries(kinkSelections).forEach(([kinkId, status]) => {
        const [category, kink] = kinkId.split('::');
        if (!categoriesWithSelections[category]) {
            categoriesWithSelections[category] = [];
        }
        categoriesWithSelections[category].push({ kink, status });
    });

    // Helper function to get status display
    function getStatusIcon(status) {
        const icons = {
            love: '<span style="color: #d81b60; font-size: 16px; vertical-align: middle;">❤</span>',
            like: '<span style="width: 16px; height: 16px; background: #1e88e5; border-radius: 3px; display: inline-block; vertical-align: middle;"></span>',
            curious: '<span style="width: 0; height: 0; border-left: 8px solid transparent; border-right: 8px solid transparent; border-bottom: 14px solid #ffa726; display: inline-block; vertical-align: middle;"></span>',
            maybe: '<span style="width: 11px; height: 11px; background: #9c27b0; transform: rotate(45deg); border-radius: 2px; display: inline-block; vertical-align: middle;"></span>',
            no: '<span style="color: #757575; font-size: 16px; font-weight: bold; vertical-align: middle;">✕</span>',
            limit: '<span style="color: #000; font-size: 16px; vertical-align: middle;">⚠</span>'
        };
        return icons[status] || '';
    }

    // Create each category
    Object.entries(categoriesWithSelections).forEach(([category, kinks]) => {
        const categoryDiv = document.createElement('div');
        categoryDiv.style.cssText = `
            background: white;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 15px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        `;

        let kinksHtml = kinks.map(({ kink, status }) => `
            <div style="display: flex; align-items: center; gap: 10px; padding: 8px 12px; background: #f5f5f5; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                ${getStatusIcon(status)}
                <span>${kink}</span>
            </div>
        `).join('');

        categoryDiv.innerHTML = `
            <h3 style="margin: 0 0 15px 0; font-size: 1.2rem; color: #212121; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${category}</h3>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">
                ${kinksHtml}
            </div>
        `;
        exportContainer.appendChild(categoryDiv);
    });

    // Create footer
    const footer = document.createElement('div');
    footer.style.cssText = `
        background: #212121;
        color: white;
        padding: 20px;
        border-radius: 12px;
        text-align: center;
        margin-top: 20px;
    `;
    footer.innerHTML = `
        <p style="margin: 0 0 5px 0; opacity: 0.9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Site accessible aux daltoniens - Icônes : cœur, carré, triangle, losange, croix et point d'exclamation</p>
        <p style="margin: 0; font-weight: 600; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">Développé par EldaDev</p>
    `;
    exportContainer.appendChild(footer);

    // Add to body
    document.body.appendChild(exportContainer);

    // Check if there are any selections
    if (Object.keys(kinkSelections).length === 0) {
        alert('Vous n\'avez aucune sélection à exporter. Sélectionnez des kinks avant d\'exporter en image.');
        document.body.removeChild(exportContainer);
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
        return;
    }

    // Use html2canvas to generate the image
    html2canvas(exportContainer, {
        backgroundColor: '#f5f5f5',
        scale: 2,
        useCORS: true,
        logging: false
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = `kinklist-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();

        // Cleanup
        document.body.removeChild(exportContainer);
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;

        alert('Votre kinklist a été exportée en image avec succès !');
    }).catch(error => {
        console.error('Error exporting image:', error);
        document.body.removeChild(exportContainer);
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
        alert('Erreur lors de l\'exportation en image. Veuillez réessayer.');
    });
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
