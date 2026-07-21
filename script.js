// State management
let kinkSelections = {};
let userInfo = {
    name: '',
    gender: '',
    sexuality: '',
    preference: ''
};
let kinkRoles = {};
let expandedCategories = new Set();
const STORAGE_KEY = 'kinklist-selections';
const USER_INFO_KEY = 'kinklist-user-info';
const ROLES_KEY = 'kinklist-roles';

// Status types
const STATUS_TYPES = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    loadFromLocalStorage();
    loadRolesFromLocalStorage();
    loadUserInfoFromLocalStorage();
    populateUserInfoFields();
    await loadSharedData(); // Check for shared data in URL (async)
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

// Load user info from localStorage
function loadUserInfoFromLocalStorage() {
    const saved = localStorage.getItem(USER_INFO_KEY);
    if (saved) {
        try {
            userInfo = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading user info:', e);
            userInfo = { name: '', gender: '', sexuality: '', preference: '' };
        }
    }
}

// Populate user info fields with saved data
function populateUserInfoFields() {
    document.getElementById('user-name').value = userInfo.name || '';
    document.getElementById('user-gender').value = userInfo.gender || '';
    document.getElementById('user-sexuality').value = userInfo.sexuality || '';
    document.getElementById('user-preference').value = userInfo.preference || '';
}

// Save selections to localStorage
function saveToLocalStorage() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(kinkSelections));
    } catch (e) {
        console.error('Error saving data:', e);
    }
}

// Save user info to localStorage
function saveUserInfoToLocalStorage() {
    try {
        localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo));
    } catch (e) {
        console.error('Error saving user info:', e);
    }
}

// Load roles from localStorage
function loadRolesFromLocalStorage() {
    const saved = localStorage.getItem(ROLES_KEY);
    if (saved) {
        try {
            kinkRoles = JSON.parse(saved);
        } catch (e) {
            console.error('Error loading roles:', e);
            kinkRoles = {};
        }
    }
}

// Save roles to localStorage
function saveRolesToLocalStorage() {
    try {
        localStorage.setItem(ROLES_KEY, JSON.stringify(kinkRoles));
    } catch (e) {
        console.error('Error saving roles:', e);
    }
}

// Render the kinklist
function renderKinklist(filterCategory = 'all', filterStatus = 'all', searchTerm = '') {
    const container = document.getElementById('kinklist-container');
    container.innerHTML = '';

    Object.entries(kinksData).forEach(([category, kinks], categoryIndex) => {
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
        const isExpanded = expandedCategories.has(category);
        categoryDiv.classList.toggle('expanded', isExpanded);

        // Category header
        const headerDiv = document.createElement('div');
        headerDiv.className = 'category-header';

        const gridId = `category-panel-${categoryIndex}`;
        const toggleButton = document.createElement('button');
        toggleButton.type = 'button';
        toggleButton.className = 'category-toggle';
        toggleButton.setAttribute('aria-expanded', String(isExpanded));
        toggleButton.setAttribute('aria-controls', gridId);

        const titleSpan = document.createElement('span');
        titleSpan.className = 'category-title';
        titleSpan.textContent = category;

        const countSpan = document.createElement('span');
        countSpan.className = 'category-count';
        const selectedCount = filteredKinks.filter(kink => {
            const kinkId = `${category}::${kink}`;
            return kinkSelections[kinkId];
        }).length;
        countSpan.textContent = `${selectedCount}/${filteredKinks.length} sélectionnés`;

        const headerMeta = document.createElement('span');
        headerMeta.className = 'category-header-meta';

        const chevron = document.createElement('span');
        chevron.className = 'category-chevron';
        chevron.setAttribute('aria-hidden', 'true');
        chevron.textContent = '⌄';

        headerMeta.appendChild(countSpan);
        headerMeta.appendChild(chevron);
        toggleButton.appendChild(titleSpan);
        toggleButton.appendChild(headerMeta);
        headerDiv.appendChild(toggleButton);

        // Kinks grid
        const gridDiv = document.createElement('div');
        gridDiv.className = 'kinks-grid';
        gridDiv.id = gridId;
        gridDiv.hidden = !isExpanded;

        toggleButton.addEventListener('click', () => {
            const shouldExpand = !expandedCategories.has(category);
            if (shouldExpand) {
                expandedCategories.add(category);
            } else {
                expandedCategories.delete(category);
            }
            updateCategoryExpansion(categoryDiv, shouldExpand);
        });

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

function updateCategoryExpansion(categoryElement, expanded) {
    const toggle = categoryElement.querySelector('.category-toggle');
    const panel = categoryElement.querySelector('.kinks-grid');

    categoryElement.classList.toggle('expanded', expanded);
    if (toggle) {
        toggle.setAttribute('aria-expanded', String(expanded));
    }
    if (panel) {
        panel.hidden = !expanded;
    }
}

function setAllCategoriesExpanded(expanded) {
    expandedCategories = expanded ? new Set(Object.keys(kinksData)) : new Set();
    document.querySelectorAll('.category').forEach(categoryElement => {
        updateCategoryExpansion(categoryElement, expanded);
    });
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
    const nameWrapper = document.createElement('span');
    nameWrapper.className = 'kink-name-wrapper';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'kink-name';
    nameSpan.textContent = kink;
    const category = kinkId.split('::')[0];
    const definition = typeof getKinkDefinition === 'function'
        ? getKinkDefinition(kink, category)
        : `Définition de ${kink}.`;
    nameWrapper.setAttribute('data-definition', definition);
    nameWrapper.setAttribute('aria-label', `${kink}. ${definition}`);
    nameWrapper.setAttribute('tabindex', '0');
    nameWrapper.appendChild(nameSpan);

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
        icon.setAttribute('title', getStatusLabel(status));

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

    // Role toggles (Donne/Reçois)
    const roleDiv = document.createElement('div');
    roleDiv.className = 'kink-role';

    const currentRole = kinkRoles[kinkId];

    const donneBtn = document.createElement('button');
    donneBtn.className = 'role-btn role-btn-donne';
    donneBtn.setAttribute('data-role', 'gives');
    donneBtn.setAttribute('aria-label', 'Donne');
    donneBtn.setAttribute('title', 'Donne');
    donneBtn.textContent = '\u2192';
    if (currentRole === 'gives' || currentRole === 'both') {
        donneBtn.classList.add('active');
    }
    donneBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleKinkRole(kinkId, 'gives');
    });

    const recoisBtn = document.createElement('button');
    recoisBtn.className = 'role-btn role-btn-recois';
    recoisBtn.setAttribute('data-role', 'receives');
    recoisBtn.setAttribute('aria-label', 'Re\u00e7oit');
    recoisBtn.setAttribute('title', 'Re\u00e7oit');
    recoisBtn.textContent = '\u2190';
    if (currentRole === 'receives' || currentRole === 'both') {
        recoisBtn.classList.add('active');
    }
    recoisBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleKinkRole(kinkId, 'receives');
    });

    roleDiv.appendChild(donneBtn);
    roleDiv.appendChild(recoisBtn);

    kinkDiv.appendChild(nameWrapper);
    kinkDiv.appendChild(statusDiv);
    kinkDiv.appendChild(roleDiv);

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

// Toggle kink role (Donne/Reçois)
function toggleKinkRole(kinkId, role) {
    const currentRole = kinkRoles[kinkId];

    if (currentRole === role) {
        // Clicking the same role: deselect it
        delete kinkRoles[kinkId];
    } else if (currentRole === 'both') {
        // If currently 'both', clicking either one keeps only the other
        if (role === 'gives') {
            kinkRoles[kinkId] = 'receives';
        } else {
            kinkRoles[kinkId] = 'gives';
        }
    } else if (currentRole === 'gives' || currentRole === 'receives') {
        // If one is already selected, selecting the other makes it 'both'
        kinkRoles[kinkId] = 'both';
    } else {
        // No role set, assign the clicked one
        kinkRoles[kinkId] = role;
    }

    saveRolesToLocalStorage();

    // Update the UI for this specific kink
    const kinkDiv = document.querySelector(`[data-kink-id="${kinkId}"]`);
    if (kinkDiv) {
        const newRole = kinkRoles[kinkId];
        const donneBtn = kinkDiv.querySelector('.role-btn-donne');
        const recoisBtn = kinkDiv.querySelector('.role-btn-recois');

        if (donneBtn) {
            if (newRole === 'gives' || newRole === 'both') {
                donneBtn.classList.add('active');
            } else {
                donneBtn.classList.remove('active');
            }
        }
        if (recoisBtn) {
            if (newRole === 'receives' || newRole === 'both') {
                recoisBtn.classList.add('active');
            } else {
                recoisBtn.classList.remove('active');
            }
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
    // User info fields
    const userNameInput = document.getElementById('user-name');
    const userGenderInput = document.getElementById('user-gender');
    const userSexualityInput = document.getElementById('user-sexuality');
    const userPreferenceSelect = document.getElementById('user-preference');

    userNameInput.addEventListener('input', (e) => {
        userInfo.name = e.target.value;
        saveUserInfoToLocalStorage();
    });

    userGenderInput.addEventListener('input', (e) => {
        userInfo.gender = e.target.value;
        saveUserInfoToLocalStorage();
    });

    userSexualityInput.addEventListener('input', (e) => {
        userInfo.sexuality = e.target.value;
        saveUserInfoToLocalStorage();
    });

    userPreferenceSelect.addEventListener('change', (e) => {
        userInfo.preference = e.target.value;
        saveUserInfoToLocalStorage();
    });

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

    document.getElementById('expand-all-btn').addEventListener('click', () => {
        setAllCategoriesExpanded(true);
    });

    document.getElementById('collapse-all-btn').addEventListener('click', () => {
        setAllCategoriesExpanded(false);
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

    // Variable pour stocker l'ID de partage
    let shareId = null;

    try {
        // 1) Sélections nécessaires
        if (Object.keys(kinkSelections).length === 0) {
            alert('Vous n\'avez aucune sélection à exporter. Sélectionnez des kinks avant d\'exporter en image.');
            return;
        }

        // 1.5) Générer un lien de partage pour obtenir l'ID
        try {
            const shareData = {
                selections: kinkSelections,
                userInfo: userInfo,
                roles: kinkRoles
            };

            const response = await fetch('/api/share', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ data: shareData })
            });

            if (response.ok) {
                const { id } = await response.json();
                shareId = id;
            }
        } catch (error) {
            console.warn('Impossible de générer un ID de partage:', error);
            // Continue sans ID si l'API n'est pas disponible
        }

        // 2) Agréger par catégories
        const categoriesWithSelections = {};
        Object.entries(kinkSelections).forEach(([kinkId, status]) => {
            const [category, kink] = kinkId.split('::');
            if (!categoriesWithSelections[category]) categoriesWithSelections[category] = [];
            categoriesWithSelections[category].push({ kink, status, role: kinkRoles[kinkId] || null });
        });

        // 3) Config et hauteur totale (mise en page large avec catégories en colonnes)
        // Configuration optimisée pour Discord (8 colonnes = 4 catégories × 2 items = image très compacte)
        const config = {
            width: 2400,
            padding: 35,
            headerHeight: 110,
            userInfoHeight: 0, // Calculé dynamiquement selon les infos remplies
            legendHeight: 80,
            categoryHeaderHeight: 65,
            itemHeight: 58,
            itemsPerRow: 2, // 2 items par ligne dans chaque catégorie
            itemGap: 12,
            categoriesPerRow: 4, // 4 colonnes de catégories
            categoryGap: 20,
            sectionGap: 25,
            footerHeight: 75,
            colors: { love: '#ef4444', like: '#fdba74', curious: '#3b82f6', maybe: '#06b6d4', no: '#525252', limit: '#000000', donne: '#10b981', recois: '#8b5cf6' },
            labels: { love: "J'adore", like: "J'aime", curious: 'Curieux/se', maybe: 'Peut-être', no: 'Non merci', limit: 'Hard Limit', donne: 'Donne', recois: 'Re\u00e7oit' }
        };

        // Calculer la hauteur de la section infos perso (si au moins un champ rempli)
        const hasUserInfo = userInfo.name || userInfo.gender || userInfo.sexuality || userInfo.preference;
        if (hasUserInfo) {
            config.userInfoHeight = 100; // Hauteur fixe pour la section infos perso
        }

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

        let totalHeight = config.padding * 2 + config.headerHeight + config.userInfoHeight + config.legendHeight + config.footerHeight;
        totalHeight += rowHeights.reduce((sum, height) => sum + height + config.sectionGap, 0);
        // Ajouter un espace entre les sections si infos perso présentes
        if (hasUserInfo) {
            totalHeight += 20; // Espace après infos perso
        }

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

        // Section infos personnelles (si au moins un champ rempli)
        if (hasUserInfo) {
            ctx.fillStyle = 'white';
            roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.userInfoHeight, 12, true, false);
            ctx.strokeStyle = '#e7e5e4';
            ctx.lineWidth = 1;
            roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.userInfoHeight, 12, false, true);

            // Construire le texte sur une seule ligne avec séparateurs
            const infoY = y + config.userInfoHeight / 2 + 8;
            const infoItems = [];

            if (userInfo.name) {
                infoItems.push({ label: 'Nom', value: userInfo.name });
            }
            if (userInfo.gender) {
                infoItems.push({ label: 'Genre', value: userInfo.gender });
            }
            if (userInfo.sexuality) {
                infoItems.push({ label: 'Sexualité', value: userInfo.sexuality });
            }
            if (userInfo.preference) {
                infoItems.push({ label: 'Préférence', value: userInfo.preference });
            }

            // Calculer la largeur totale pour centrer
            ctx.font = '600 24px "DM Sans", sans-serif';
            let totalWidth = 0;
            const itemWidths = [];

            infoItems.forEach((item, index) => {
                const labelWidth = ctx.measureText(item.label + ' ').width;
                const valueWidth = ctx.measureText(item.value).width;
                const itemWidth = labelWidth + valueWidth;
                itemWidths.push({ labelWidth, valueWidth, itemWidth });
                totalWidth += itemWidth;

                // Ajouter la largeur du séparateur (sauf pour le dernier)
                if (index < infoItems.length - 1) {
                    totalWidth += 50; // Espace pour le séparateur •
                }
            });

            // Position de départ pour centrer
            let currentX = (config.width - totalWidth) / 2;
            ctx.textBaseline = 'middle';

            infoItems.forEach((item, index) => {
                const widths = itemWidths[index];

                // Label (gris, plus petit)
                ctx.fillStyle = '#78716c';
                ctx.font = '500 22px "DM Sans", sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(item.label + ' ', currentX, infoY);
                currentX += widths.labelWidth;

                // Valeur (noir, plus gros)
                ctx.fillStyle = '#1c1917';
                ctx.font = '600 26px "DM Sans", sans-serif';
                ctx.fillText(item.value, currentX, infoY);
                currentX += widths.valueWidth;

                // Séparateur (sauf pour le dernier)
                if (index < infoItems.length - 1) {
                    ctx.fillStyle = '#d6d3d1';
                    ctx.font = '400 28px "DM Sans", sans-serif';
                    ctx.textAlign = 'center';
                    currentX += 25;
                    ctx.fillText('•', currentX, infoY);
                    currentX += 25;
                }
            });

            y += config.userInfoHeight + 20;
        }

        // Légende sur une seule ligne centrée
        ctx.fillStyle = 'white';
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.legendHeight, 12, true, false);
        ctx.strokeStyle = '#e7e5e4';
        ctx.lineWidth = 1;
        roundRect(ctx, config.padding, y, config.width - config.padding * 2, config.legendHeight, 12, false, true);

        const legendItems = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];
        const legendBgs = { love: '#fee2e2', like: '#ffedd5', curious: '#dbeafe', maybe: '#cffafe', no: '#e5e5e5', limit: '#f5f5f5' };

        // Calculer la largeur totale (avec Donne/Reçois)
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
        // Ajouter largeur pour séparateur + Donne/Reçois
        const roleLegendItems = ['donne', 'recois'];
        const roleLegendBgs = { donne: '#d1fae5', recois: '#ede9fe' };
        totalWidth += 24; // Séparateur
        roleLegendItems.forEach((role) => {
            const pillWidth = ctx.measureText(config.labels[role]).width + 70;
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

        // Dessiner les items de statut
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

        // Séparateur visuel
        ctx.fillStyle = '#d6d3d1';
        ctx.fillRect(legendX, legendY - 14, 1, 28);
        legendX += 24;

        // Dessiner les items de rôle (Donne/Reçois)
        roleLegendItems.forEach((role, index) => {
            const pillIndex = legendItems.length + index;
            const pillWidth = pillWidths[pillIndex];
            ctx.fillStyle = roleLegendBgs[role];
            roundRect(ctx, legendX, legendY - 19, pillWidth, 38, 8, true, false);
            // Dessiner la flèche de rôle
            ctx.fillStyle = config.colors[role];
            ctx.font = '700 24px "DM Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const arrowChar = role === 'donne' ? '\u2192' : '\u2190';
            ctx.fillText(arrowChar, legendX + 20, legendY);
            ctx.fillStyle = config.colors[role];
            ctx.font = '600 24px "DM Sans", sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(config.labels[role], legendX + 45, legendY);
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
                    // Réserver de l'espace pour les indicateurs de rôle
                    const roleSpace = item.role ? 45 : 0;
                    const maxTextWidth = itemWidth - 70 - roleSpace;
                    let text = item.kink;
                    if (ctx.measureText(text).width > maxTextWidth) {
                        while (ctx.measureText(text + '...').width > maxTextWidth && text.length > 0) text = text.slice(0, -1);
                        text += '...';
                    }
                    ctx.fillText(text, itemX + 55, itemY + config.itemHeight / 2 + 8);

                    // Dessiner les indicateurs de rôle (Donne/Reçois)
                    if (item.role) {
                        const roleX = itemX + itemWidth - config.itemGap - 12;
                        const roleY = itemY + config.itemHeight / 2;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.font = '700 20px "DM Sans", sans-serif';
                        if (item.role === 'gives' || item.role === 'both') {
                            ctx.fillStyle = config.colors.donne;
                            ctx.fillText('\u2192', roleX - (item.role === 'both' ? 12 : 0), roleY);
                        }
                        if (item.role === 'receives' || item.role === 'both') {
                            ctx.fillStyle = config.colors.recois;
                            ctx.fillText('\u2190', roleX + (item.role === 'both' ? 12 : 0), roleY);
                        }
                    }
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

        // Texte centré
        ctx.fillStyle = '#78716c';
        ctx.font = '500 24px "DM Sans", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Développé par Eldayia · x.com/eldayia', config.width / 2, y + config.footerHeight / 2 + 8);

        // ID de partage en bas à droite (si disponible)
        if (shareId) {
            ctx.fillStyle = '#a8a29e';
            ctx.font = '600 22px "DM Sans", sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(`#s/${shareId}`, config.width - config.padding - 30, y + config.footerHeight / 2 + 8);
        }

        // 6) Générer et télécharger en JPEG haute qualité
        const blob = await canvasToBlobAsync(canvas);
        if (!blob) throw new Error('Impossible de créer l\'image');
        downloadBlob(`kinklist-${new Date().toISOString().split('T')[0]}.jpg`, blob);

        if (shareId) {
            alert(`Votre kinklist a été exportée en image avec succès !\n\nL'identifiant de partage #s/${shareId} a été ajouté en bas à droite de l'image.`);
        } else {
            alert('Votre kinklist a été exportée en image avec succès !');
        }
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

// Encode role to a single character
function encodeRole(role) {
    const map = { gives: 'g', receives: 'r', both: 'b' };
    return map[role] || '';
}

// Decode character to role
function decodeRole(char) {
    const map = { g: 'gives', r: 'receives', b: 'both' };
    return map[char] || null;
}

// Compression and encoding functions for sharing (optimized format with gzip)
function compressAndEncode(data) {
    const { reverseIndex } = buildKinkIndex();

    // Convert to compact format: [[id, statusChar, roleChar], ...]
    const hasRoles = Object.keys(kinkRoles).length > 0;
    const compact = Object.entries(data).map(([kinkId, status]) => {
        const id = reverseIndex[kinkId];
        if (id === undefined) return null;
        const roleChar = encodeRole(kinkRoles[kinkId]);
        return [id, encodeStatus(status), roleChar];
    }).filter(x => x !== null);

    // Check if all statuses are the same and no roles for ultra-compact format
    const statuses = compact.map(x => x[1]);
    const allSameStatus = statuses.length > 0 && statuses.every(s => s === statuses[0]);
    const noRoles = !hasRoles || compact.every(x => x[2] === '');

    let str;
    if (allSameStatus && compact.length > 5 && noRoles) {
        // Ultra-compact: "s:id,id,id,..." where s is the common status
        const ids = compact.map(([id]) => id.toString(36)).join(',');
        str = `${statuses[0]}:${ids}`;
    } else if (noRoles) {
        // Regular compact without roles: "ids,ids,..." where each entry is id+status in base36
        str = compact.map(([id, s]) => `${id.toString(36)}${s}`).join(',');
    } else {
        // Compact with roles: "idSr,idSr,..." where S=status, R=role (optional)
        str = compact.map(([id, s, r]) => r ? `${id.toString(36)}${s}${r}` : `${id.toString(36)}${s}`).join(',');
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
        const roles = {};

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
            // Regular compact format (with or without roles)
            str.split(',').forEach(pair => {
                if (!pair) return;

                // Check if last char is a role char (g, r, b)
                // INVARIANT: status chars (l,k,c,m,n,h) and role chars (g,r,b) are disjoint,
                // so we can safely disambiguate by checking the last two characters.
                const lastChar = pair.slice(-1);
                const secondLastChar = pair.slice(-2, -1);
                let statusChar, roleChar, idStr;

                if ('grb'.includes(lastChar) && 'lkcmnh'.includes(secondLastChar)) {
                    // New format with role
                    statusChar = secondLastChar;
                    roleChar = lastChar;
                    idStr = pair.slice(0, -2);
                } else {
                    // Old format without role
                    statusChar = lastChar;
                    roleChar = null;
                    idStr = pair.slice(0, -1);
                }

                const id = parseInt(idStr, 36);
                if (isNaN(id)) return;

                const kinkId = index[id];
                const status = decodeStatus(statusChar);

                if (kinkId && status) {
                    result[kinkId] = status;
                    if (roleChar) {
                        const role = decodeRole(roleChar);
                        if (role) {
                            roles[kinkId] = role;
                        }
                    }
                }
            });
        }

        return { selections: result, roles };
    } catch (e) {
        console.error('Error decoding shared data:', e);
        return null;
    }
}

// Share site link (without selections)
function shareSiteLink() {
    const siteUrl = 'https://kink.eldayia.fr';

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
        // Préparer les données à partager (sélections + infos perso + rôles)
        const shareData = {
            selections: kinkSelections,
            userInfo: userInfo,
            roles: kinkRoles
        };

        // Tentative d'appel à l'API backend pour créer un lien court
        const response = await fetch('/api/share', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: shareData })
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

                const { data: sharedData } = await response.json();

                // Nouveau format avec selections + userInfo + roles
                if (sharedData.selections) {
                    await handleSharedData(sharedData.selections, sharedData.userInfo, sharedData.roles);
                } else {
                    // Ancien format (rétrocompatibilité)
                    await handleSharedData(sharedData);
                }
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
        const decoded = decodeAndDecompress(encoded);

        if (decoded) {
            await handleSharedData(decoded.selections, null, decoded.roles);
        } else {
            alert('Le lien de partage est invalide ou corrompu.');
            window.location.hash = '';
        }
    }
}

// Helper function to handle shared data import
async function handleSharedData(sharedSelections, sharedUserInfo = null, sharedRoles = null) {
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
            if (sharedRoles) {
                kinkRoles = sharedRoles;
                saveRolesToLocalStorage();
            }
            if (sharedUserInfo) {
                userInfo = sharedUserInfo;
                saveUserInfoToLocalStorage();
                populateUserInfoFields();
            }
            saveToLocalStorage();
            window.location.hash = '';
            alert('Kinklist importée avec succès !');
        } else {
            // Just display without saving
            kinkSelections = sharedSelections;
            if (sharedRoles) {
                kinkRoles = sharedRoles;
            }
            if (sharedUserInfo) {
                userInfo = sharedUserInfo;
                populateUserInfoFields();
            }
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
            if (sharedRoles) {
                kinkRoles = sharedRoles;
                saveRolesToLocalStorage();
            }
            if (sharedUserInfo) {
                userInfo = sharedUserInfo;
                saveUserInfoToLocalStorage();
                populateUserInfoFields();
            }
            saveToLocalStorage();
            window.location.hash = '';
            alert('Kinklist importée avec succès !');
        } else {
            // Just display without saving
            kinkSelections = sharedSelections;
            if (sharedRoles) {
                kinkRoles = sharedRoles;
            }
            if (sharedUserInfo) {
                userInfo = sharedUserInfo;
                populateUserInfoFields();
            }
        }
    }
}

// Reset kinklist
function resetKinklist() {
    const confirmReset = confirm(
        'Êtes-vous sûr(e) de vouloir réinitialiser toute votre kinklist et vos informations personnelles ?\n\n' +
        'Cette action est irréversible.'
    );

    if (confirmReset) {
        kinkSelections = {};
        kinkRoles = {};
        userInfo = { name: '', gender: '', sexuality: '', preference: '' };
        saveToLocalStorage();
        saveRolesToLocalStorage();
        saveUserInfoToLocalStorage();
        populateUserInfoFields();
        applyFilters();
        alert('Votre kinklist et vos informations personnelles ont été réinitialisées.');
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
