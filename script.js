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
const DEV_BACKUP_KEY = 'kinklist-dev-test-backup';
const LOCAL_APP_ORIGIN = 'http://localhost:3000';

function getCurrentAppOrigin() {
    // Une page file:// n'a pas d'origine HTTP et ne peut pas appeler /api.
    // Dans ce cas, utiliser le serveur Node local prévu par `npm start`.
    if (window.location.protocol === 'file:') return LOCAL_APP_ORIGIN;
    return window.location.origin;
}

function getApiUrl(path) {
    return `${getCurrentAppOrigin()}${path}`;
}

function buildShortShareUrl(id) {
    return `${getCurrentAppOrigin()}/#s/${id}`;
}

function clearShareHash() {
    if (!window.location.hash) return;
    const cleanUrl = window.location.href.split('#')[0];
    window.history.replaceState(null, document.title, cleanUrl);
}

// Status types
const STATUS_TYPES = ['love', 'like', 'curious', 'maybe', 'no', 'limit'];

const CATEGORY_DESCRIPTIONS = Object.freeze({
    'BDSM général & Domination': 'Pouvoir, règles et dynamiques de contrôle',
    'Impact Play - Outils & Intensité': "Instruments d'impact et niveaux d'intensité",
    'Sensations - Température & Corps': 'Contrastes thermiques, pressions et sensations physiques',
    'Oral, Pénétration & Jouets classiques': 'Pratiques orales, pénétration et accessoires courants',
    'Fluides corporels': 'Salive, sperme, urine et autres fluides corporels',
    'Lieux publics, Clubs & Exhibition': 'Exhibition, voyeurisme et lieux réservés aux adultes',
    'Roleplay - Archétypes classiques': "Rôles d'autorité, métiers et rencontres fictives",
    'Partenaires multiples - Pratiques classiques': 'Trios, groupes et configurations à plusieurs',
    'Fétichisme': 'Parties du corps, matières et objets fétichisés',
    'Humiliation, Dégradation & Contrôle sexuel': "Dégradation, objectification et contrôle de l'orgasme",
    'Jeu Mental & Psychologique': 'Suggestion, anticipation et jeux psychologiques',
    'Médical, Aiguilles & Body Mod': 'Scénarios médicaux, aiguilles et modifications corporelles',
    'Restrictions & Contrôle relationnel': 'Règles, suivi et contrôle consenti du quotidien',
    'Romance & Sensualité': 'Tendresse, connexion et sensualité',
    'Extrême & Edge Play': 'Pratiques à risque élevé et scénarios extrêmes',
    'Technologie, Pornographie & Distance': 'Contenus adultes, distance et outils numériques',
    'Situations & Contextes': 'Contextes, rythmes et circonstances de rencontre',
    'Communication & Négociation': 'Limites, signaux et échanges avant ou après une scène',
    'Dynamiques D/s & Échange de pouvoir': 'Domination, soumission et échanges de pouvoir',
    'Bondage & Immobilisation': 'Cordes, attaches et restrictions de mouvement',
    'Impact Play - Pratiques & Rituels': 'Gestes, rituels et conséquences liés aux impacts',
    'Sensations - Textures & Électricité': 'Textures, température, privation sensorielle et électricité',
    'Masturbation & Plaisir non pénétratif': 'Stimulation manuelle, frottements et plaisir externe',
    'Pratiques orales complémentaires': 'Variantes et rythmes de stimulation orale',
    'Pénétration - Techniques & Rythmes': 'Positions, profondeurs et rythmes de pénétration',
    'Jouets & Machines': 'Accessoires intimes, plugs et appareils motorisés',
    'Orgasme, Edging & Chasteté': "Contrôle, retard et déclenchement de l'orgasme",
    'Jeux génitaux': 'Pressions, liens et sensations appliqués aux organes génitaux',
    'Messy Play & Fluides complémentaires': 'Fluides, matières salissantes et jeux sensoriels associés',
    'Exhibition & Médias': 'Photographie, vidéo, observation et exposition consentie',
    'Non-monogamie, Échangisme & Groupe': 'Relations ouvertes, échange et sexualité de groupe',
    'Roleplay - Fantastique & Scénarios': 'Personnages fantastiques et scénarios fictifs entre adultes',
    'Furry & Creature Play': 'Univers anthropomorphes, créatures et transformations imaginaires',
    'Pet Play': 'Rôles animaux, dressage et relation handler/pet',
    'ABDL & Ageplay adulte': 'Couches, Little space et relations caregiver/Little entre adultes',
    'Corps & Apparence': 'Morphologie, pilosité et modifications visibles du corps',
    'Vêtements & Matières': 'Lingerie, uniformes et matières portées',
    'Masques & Anonymat': 'Dissimulation du visage, identité et dépersonnalisation',
    'Humiliation & Adoration corporelle': 'Louange, humiliation et usage symbolique du corps',
    'Contrôle quotidien & Discipline': 'Protocoles, tâches et discipline dans la vie courante',
    'Fear Play & Intimidation': 'Peur contrôlée, poursuite et intimidation fictive',
    'Médical - Examens & Hôpital': 'Examens, soins et environnement hospitalier simulés',
    'Intimité & Aftercare': 'Affection, récupération et suivi après les scènes',
    'Technologie interactive & Connectée': 'Jouets connectés, commandes à distance et environnements virtuels',
    'Consentement & Sécurité pratique': 'Prévention, consentement et sécurité physique ou émotionnelle'
});

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    loadFromLocalStorage();
    loadRolesFromLocalStorage();
    loadUserInfoFromLocalStorage();
    populateUserInfoFields();
    setupGuideCarousel();
    setupBackToTop();
    await loadSharedData(); // Check for shared data in URL (async)
    renderKinklist();
    setupEventListeners();
});

function setupBackToTop() {
    const button = document.getElementById('back-to-top');
    if (!button) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let updatePending = false;

    const updateVisibility = () => {
        const isVisible = window.scrollY > 160;
        button.classList.toggle('visible', isVisible);
        button.setAttribute('aria-hidden', String(!isVisible));
        button.tabIndex = isVisible ? 0 : -1;
        updatePending = false;
    };

    window.addEventListener('scroll', () => {
        if (updatePending) return;
        updatePending = true;
        window.requestAnimationFrame(updateVisibility);
    }, { passive: true });

    button.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: reducedMotion.matches ? 'auto' : 'smooth'
        });
    });

    updateVisibility();
}

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

        const indexSpan = document.createElement('span');
        indexSpan.className = 'category-index';
        indexSpan.textContent = String(categoryIndex + 1).padStart(2, '0');

        const categoryCopy = document.createElement('span');
        categoryCopy.className = 'category-copy';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'category-title';
        titleSpan.textContent = category;

        const descriptionSpan = document.createElement('span');
        descriptionSpan.className = 'category-description';
        descriptionSpan.textContent = CATEGORY_DESCRIPTIONS[category];

        categoryCopy.appendChild(titleSpan);
        categoryCopy.appendChild(descriptionSpan);

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
        toggleButton.appendChild(indexSpan);
        toggleButton.appendChild(categoryCopy);
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
        noResults.className = 'no-results';
        noResults.innerHTML = '<h3>Aucun résultat trouvé</h3><p>Essayez de modifier vos filtres</p>';
        container.appendChild(noResults);
    }
}

function setupGuideCarousel() {
    const container = document.querySelector('.guide-pages');
    const previousButton = document.getElementById('guide-previous');
    const nextButton = document.getElementById('guide-next');
    const pageButtons = Array.from(document.querySelectorAll('[data-guide-page]'));

    if (!container || !previousButton || !nextButton || pageButtons.length === 0) return;

    const pages = Array.from(container.querySelectorAll('.guide-page'));
    let activePage = 0;

    function showPage(index, direction = 'next') {
        activePage = Math.max(0, Math.min(index, pages.length - 1));
        container.dataset.direction = direction;

        pages.forEach((page, pageIndex) => {
            const active = pageIndex === activePage;
            page.classList.toggle('active', active);
            page.setAttribute('aria-hidden', String(!active));
        });

        pageButtons.forEach((button, pageIndex) => {
            const active = pageIndex === activePage;
            button.classList.toggle('active', active);
            if (active) {
                button.setAttribute('aria-current', 'page');
            } else {
                button.removeAttribute('aria-current');
            }
        });

        previousButton.disabled = activePage === 0;
        nextButton.disabled = activePage === pages.length - 1;
    }

    previousButton.addEventListener('click', () => showPage(activePage - 1, 'previous'));
    nextButton.addEventListener('click', () => showPage(activePage + 1, 'next'));

    pageButtons.forEach((button, pageIndex) => {
        button.addEventListener('click', () => {
            showPage(pageIndex, pageIndex < activePage ? 'previous' : 'next');
        });
    });

    showPage(0);
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
    window.addEventListener('hashchange', handleShareHashChange);

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
    exportImageBtn.addEventListener('click', exportKinklistAsReadableImage);

    // Reset button
    const resetBtn = document.getElementById('reset-btn');
    resetBtn.addEventListener('click', resetKinklist);
}

// Apply filters
function applyFilters() {
    const searchTerm = document.getElementById('search').value;
    renderKinklist('all', 'all', searchTerm);
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

            const response = await fetch(getApiUrl('/api/share'), {
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
                infoItems.push({ label: 'Orientation', value: userInfo.sexuality });
            }
            if (userInfo.preference) {
                infoItems.push({ label: 'Rôle', value: userInfo.preference });
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
        a.className = 'download-link-hidden';
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

async function exportKinklistAsReadableImage() {
    const exportBtn = document.getElementById('export-image-btn');
    const originalText = exportBtn.textContent;
    exportBtn.textContent = 'Génération en cours...';
    exportBtn.disabled = true;

    try {
        if (Object.keys(kinkSelections).length === 0) {
            alert('Vous n\'avez aucune sélection à exporter. Sélectionnez des kinks avant d\'exporter en image.');
            return;
        }

        if (document.fonts) {
            await Promise.all([
                document.fonts.load('400 24px Inter'),
                document.fonts.load('600 24px Inter'),
                document.fonts.load('700 48px "Playfair Display"'),
                document.fonts.ready
            ]);
        }

        const logoImage = await new Promise(resolve => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = 'favicon.svg';
        });

        let shareId = null;
        try {
            const response = await fetch(getApiUrl('/api/share'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    data: { selections: kinkSelections, userInfo, roles: kinkRoles }
                })
            });
            if (response.ok) {
                const payload = await response.json();
                shareId = payload.id || null;
            }
        } catch (error) {
            console.warn('Impossible de générer un ID de partage pour l\'export:', error);
        }

        const groupedSelections = {};
        Object.entries(kinkSelections).forEach(([kinkId, status]) => {
            const separatorIndex = kinkId.indexOf('::');
            if (separatorIndex === -1) return;
            const category = kinkId.slice(0, separatorIndex);
            const kink = kinkId.slice(separatorIndex + 2);
            if (!groupedSelections[category]) groupedSelections[category] = [];
            groupedSelections[category].push({
                kink,
                status,
                role: kinkRoles[kinkId] || null
            });
        });

        const config = {
            width: 0,
            maxCanvasHeight: 16300,
            padding: 48,
            headerHeight: 126,
            legendHeight: 94,
            footerHeight: 76,
            categoryWidth: 690,
            categoryGap: 24,
            rowGap: 24,
            itemGap: 7,
            itemMinHeight: 60,
            itemLineHeight: 29,
            categoryTitleLineHeight: 32,
            categoryDescriptionLineHeight: 23,
            colors: {
                love: '#ef4444', like: '#fdba74', curious: '#3b82f6',
                maybe: '#06b6d4', no: '#a39aa1', limit: '#f6eef4',
                donne: '#10b981', recois: '#8b5cf6'
            },
            labels: {
                love: "J'adore", like: "J'aime", curious: 'Curieux/se',
                maybe: 'Peut-être', no: 'Non merci', limit: 'Hard Limit',
                donne: 'Donne', recois: 'Reçoit'
            },
            theme: {
                background: '#110d12',
                panel: '#1a141b',
                panelRaised: '#211820',
                item: '#171217',
                border: '#382835',
                borderStrong: '#5a3048',
                text: '#f6eef4',
                secondaryText: '#ad9faa',
                mutedText: '#806f7b',
                accent: '#ff4f91',
                accentSoft: '#ff82b2'
            }
        };

        const measureCanvas = document.createElement('canvas');
        const measureCtx = measureCanvas.getContext('2d');

        function wrapText(ctx, text, maxWidth) {
            const paragraphs = String(text).split(/\n/);
            const lines = [];

            paragraphs.forEach(paragraph => {
                const words = paragraph.split(/\s+/).filter(Boolean);
                let currentLine = '';

                words.forEach(word => {
                    if (ctx.measureText(word).width > maxWidth) {
                        if (currentLine) {
                            lines.push(currentLine);
                            currentLine = '';
                        }
                        let fragment = '';
                        [...word].forEach(character => {
                            const candidate = fragment + character;
                            if (fragment && ctx.measureText(candidate).width > maxWidth) {
                                lines.push(fragment);
                                fragment = character;
                            } else {
                                fragment = candidate;
                            }
                        });
                        currentLine = fragment;
                        return;
                    }

                    const candidate = currentLine ? `${currentLine} ${word}` : word;
                    if (currentLine && ctx.measureText(candidate).width > maxWidth) {
                        lines.push(currentLine);
                        currentLine = word;
                    } else {
                        currentLine = candidate;
                    }
                });

                if (currentLine) lines.push(currentLine);
                if (words.length === 0) lines.push('');
            });

            return lines.length ? lines : [''];
        }

        const infoText = [
            userInfo.name && `Nom : ${userInfo.name}`,
            userInfo.gender && `Genre : ${userInfo.gender}`,
            userInfo.sexuality && `Orientation : ${userInfo.sexuality}`,
            userInfo.preference && `Rôle : ${userInfo.preference}`
        ].filter(Boolean).join('  •  ');

        function measureCategory(category, items, categoryWidth, categoryNumber) {
            const headerTextWidth = categoryWidth - 104;
            measureCtx.font = '700 29px "Playfair Display", Georgia, serif';
            const titleLines = wrapText(measureCtx, category, headerTextWidth);
            measureCtx.font = '500 18px Inter, sans-serif';
            const descriptionLines = wrapText(
                measureCtx,
                CATEGORY_DESCRIPTIONS[category],
                headerTextWidth
            );
            const headerHeight = Math.max(
                92,
                22
                    + titleLines.length * config.categoryTitleLineHeight
                    + 4
                    + descriptionLines.length * config.categoryDescriptionLineHeight
                    + 18
            );
            const itemLayouts = items.map(item => {
                measureCtx.font = '600 25px Inter, sans-serif';
                const roleWidth = item.role ? 68 : 20;
                const textWidth = categoryWidth - 32 - 54 - roleWidth;
                const lines = wrapText(measureCtx, item.kink, textWidth);
                const height = Math.max(
                    config.itemMinHeight,
                    lines.length * config.itemLineHeight + 22
                );
                return { ...item, lines, height, textWidth };
            });
            const itemsHeight = itemLayouts.reduce((sum, item) => sum + item.height, 0)
                + Math.max(0, itemLayouts.length - 1) * config.itemGap;
            return {
                category,
                categoryNumber,
                titleLines,
                descriptionLines,
                headerHeight,
                items: itemLayouts,
                height: headerHeight + 16 + itemsHeight + 16
            };
        }

        function partitionInBalancedColumns(layouts, columnCount) {
            const count = layouts.length;
            const columnsToUse = Math.min(columnCount, count);
            const prefix = [0];
            layouts.forEach(layout => {
                prefix.push(prefix[prefix.length - 1] + layout.height + config.rowGap);
            });

            const costs = Array.from({ length: count + 1 }, () =>
                Array(columnsToUse + 1).fill(Infinity)
            );
            const cuts = Array.from({ length: count + 1 }, () =>
                Array(columnsToUse + 1).fill(0)
            );
            costs[0][0] = 0;

            for (let itemCount = 1; itemCount <= count; itemCount++) {
                for (let columns = 1; columns <= Math.min(columnsToUse, itemCount); columns++) {
                    for (let cut = columns - 1; cut < itemCount; cut++) {
                        const currentColumnHeight = prefix[itemCount] - prefix[cut] - config.rowGap;
                        const cost = Math.max(costs[cut][columns - 1], currentColumnHeight);
                        if (cost < costs[itemCount][columns]) {
                            costs[itemCount][columns] = cost;
                            cuts[itemCount][columns] = cut;
                        }
                    }
                }
            }

            const columns = [];
            let itemCount = count;
            let remainingColumns = columnsToUse;
            while (remainingColumns > 0) {
                const cut = cuts[itemCount][remainingColumns];
                columns.unshift(layouts.slice(cut, itemCount));
                itemCount = cut;
                remainingColumns--;
            }
            return columns;
        }

        const categoryEntries = Object.keys(kinksData)
            .map((category, index) => [
                category,
                groupedSelections[category],
                String(index + 1).padStart(2, '0')
            ])
            .filter(([, items]) => Array.isArray(items) && items.length > 0);
        let columnCount = categoryEntries.length <= 6 ? 2
            : categoryEntries.length <= 12 ? 3
                : categoryEntries.length <= 20 ? 4 : 5;
        columnCount = Math.min(columnCount, Math.max(2, categoryEntries.length));

        let categoryLayouts;
        let columns;
        let innerWidth;
        let infoLines;
        let userInfoHeight;
        let fixedTopHeight;
        let fixedBottomHeight;
        let contentHeight;
        let imageHeight;

        while (true) {
            config.width = config.padding * 2
                + columnCount * config.categoryWidth
                + (columnCount - 1) * config.categoryGap;
            innerWidth = config.width - config.padding * 2;
            categoryLayouts = categoryEntries
                .map(([category, items, categoryNumber]) =>
                    measureCategory(category, items, config.categoryWidth, categoryNumber)
                );
            columns = partitionInBalancedColumns(categoryLayouts, columnCount);
            contentHeight = Math.max(...columns.map(column =>
                column.reduce((height, layout, index) =>
                    height + layout.height + (index ? config.rowGap : 0), 0)
            ));

            measureCtx.font = '600 27px Inter, sans-serif';
            infoLines = infoText ? wrapText(measureCtx, infoText, innerWidth - 60) : [];
            userInfoHeight = infoLines.length ? Math.max(82, infoLines.length * 34 + 32) : 0;
            fixedTopHeight = config.padding + config.headerHeight + 18
                + (userInfoHeight ? userInfoHeight + 18 : 0)
                + config.legendHeight + 24;
            fixedBottomHeight = config.footerHeight + config.padding;
            imageHeight = fixedTopHeight + contentHeight + fixedBottomHeight;

            if (imageHeight <= config.maxCanvasHeight || columnCount >= 8
                || columnCount >= categoryEntries.length) {
                break;
            }
            columnCount++;
        }

        function drawHeader(ctx, y) {
            const gradient = ctx.createLinearGradient(config.padding, y, config.width - config.padding, y);
            gradient.addColorStop(0, '#2f1828');
            gradient.addColorStop(0.52, '#21151e');
            gradient.addColorStop(1, '#171217');
            ctx.fillStyle = gradient;
            roundRect(ctx, config.padding, y, innerWidth, config.headerHeight, 18, true, false);
            ctx.strokeStyle = config.theme.borderStrong;
            ctx.lineWidth = 1.5;
            roundRect(ctx, config.padding, y, innerWidth, config.headerHeight, 18, false, true);

            const accent = ctx.createLinearGradient(config.padding, y, config.width - config.padding, y);
            accent.addColorStop(0, '#ff4f91');
            accent.addColorStop(0.55, '#c43c91');
            accent.addColorStop(1, '#8b5cf6');
            ctx.fillStyle = accent;
            roundRect(ctx, config.padding + 1, y + 1, innerWidth - 2, 7, 6, true, false);

            const brandWidth = 455;
            const logoSize = 76;
            const brandX = config.width / 2 - brandWidth / 2;
            const logoY = y + (config.headerHeight - logoSize) / 2 + 2;
            const logoGradient = ctx.createLinearGradient(brandX, logoY, brandX + logoSize, logoY + logoSize);
            logoGradient.addColorStop(0, '#451b35');
            logoGradient.addColorStop(1, '#231222');
            ctx.fillStyle = logoGradient;
            roundRect(ctx, brandX, logoY, logoSize, logoSize, 18, true, false);
            ctx.strokeStyle = '#713a57';
            roundRect(ctx, brandX, logoY, logoSize, logoSize, 18, false, true);
            if (logoImage) {
                ctx.drawImage(logoImage, brandX + 9, logoY + 9, logoSize - 18, logoSize - 18);
            }

            const textX = brandX + logoSize + 24;
            ctx.fillStyle = config.theme.text;
            ctx.textAlign = 'left';
            ctx.textBaseline = 'alphabetic';
            ctx.font = '700 48px "Playfair Display", Georgia, serif';
            ctx.fillText('Ma Kinklist', textX, y + 58);
            ctx.fillStyle = config.theme.secondaryText;
            ctx.font = '500 20px Inter, sans-serif';
            ctx.fillText('EXPLORER · COMPRENDRE · PARTAGER', textX, y + 88);
            return y + config.headerHeight + 18;
        }

        function drawUserInfo(ctx, y) {
            if (!userInfoHeight) return y;
            ctx.fillStyle = config.theme.panel;
            roundRect(ctx, config.padding, y, innerWidth, userInfoHeight, 14, true, false);
            ctx.strokeStyle = config.theme.border;
            ctx.lineWidth = 1;
            roundRect(ctx, config.padding, y, innerWidth, userInfoHeight, 14, false, true);
            ctx.fillStyle = config.theme.text;
            ctx.font = '600 27px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const firstLineY = y + userInfoHeight / 2 - ((infoLines.length - 1) * 34) / 2;
            infoLines.forEach((line, index) => {
                ctx.fillText(line, config.width / 2, firstLineY + index * 34);
            });
            return y + userInfoHeight + 18;
        }

        function drawLegend(ctx, y) {
            ctx.fillStyle = config.theme.panel;
            roundRect(ctx, config.padding, y, innerWidth, config.legendHeight, 14, true, false);
            ctx.strokeStyle = config.theme.border;
            roundRect(ctx, config.padding, y, innerWidth, config.legendHeight, 14, false, true);
            const entries = ['love', 'like', 'curious', 'maybe', 'no', 'limit', 'donne', 'recois'];
            const gap = 10;
            const pillWidth = (innerWidth - 40 - gap * (entries.length - 1)) / entries.length;
            let x = config.padding + 20;
            const centerY = y + config.legendHeight / 2;
            entries.forEach(entry => {
                ctx.fillStyle = config.theme.item;
                roundRect(ctx, x, centerY - 25, pillWidth, 50, 8, true, false);
                ctx.strokeStyle = config.theme.border;
                roundRect(ctx, x, centerY - 25, pillWidth, 50, 8, false, true);
                if (entry === 'donne' || entry === 'recois') {
                    ctx.fillStyle = config.colors[entry];
                    ctx.font = '700 23px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(entry === 'donne' ? '→' : '←', x + 24, centerY);
                } else {
                    drawStatusIcon(ctx, entry, x + 24, centerY, config.colors, 1.35);
                }
                ctx.fillStyle = config.theme.text;
                ctx.font = '600 19px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(config.labels[entry], x + 48, centerY);
                x += pillWidth + gap;
            });
            return y + config.legendHeight + 24;
        }

        function drawCategory(ctx, layout, x, y) {
            ctx.fillStyle = config.theme.panel;
            roundRect(ctx, x, y, config.categoryWidth, layout.height, 14, true, false);
            ctx.strokeStyle = config.theme.border;
            ctx.lineWidth = 1;
            roundRect(ctx, x, y, config.categoryWidth, layout.height, 14, false, true);

            const headerGradient = ctx.createLinearGradient(x, y, x + config.categoryWidth, y);
            headerGradient.addColorStop(0, '#301a29');
            headerGradient.addColorStop(1, '#1c151c');
            ctx.fillStyle = headerGradient;
            roundRect(ctx, x + 1, y + 1, config.categoryWidth - 2, layout.headerHeight, 13, true, false);
            ctx.strokeStyle = config.theme.border;
            ctx.beginPath();
            ctx.moveTo(x, y + layout.headerHeight);
            ctx.lineTo(x + config.categoryWidth, y + layout.headerHeight);
            ctx.stroke();

            ctx.fillStyle = config.theme.accentSoft;
            ctx.font = '800 18px Inter, sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(layout.categoryNumber, x + 22, y + 24);

            const copyX = x + 72;
            const titleStartY = y + 18;
            ctx.fillStyle = config.theme.text;
            ctx.font = '700 29px "Playfair Display", Georgia, serif';
            layout.titleLines.forEach((line, index) => {
                ctx.fillText(line, copyX, titleStartY + index * config.categoryTitleLineHeight);
            });

            const descriptionStartY = titleStartY
                + layout.titleLines.length * config.categoryTitleLineHeight
                + 4;
            ctx.fillStyle = config.theme.secondaryText;
            ctx.font = '500 18px Inter, sans-serif';
            layout.descriptionLines.forEach((line, index) => {
                ctx.fillText(
                    line,
                    copyX,
                    descriptionStartY + index * config.categoryDescriptionLineHeight
                );
            });

            let itemY = y + layout.headerHeight + 16;
            layout.items.forEach(item => {
                ctx.fillStyle = config.theme.item;
                roundRect(ctx, x + 16, itemY, config.categoryWidth - 32, item.height, 8, true, false);
                ctx.strokeStyle = '#30232e';
                roundRect(ctx, x + 16, itemY, config.categoryWidth - 32, item.height, 8, false, true);
                const centerY = itemY + item.height / 2;
                drawStatusIcon(ctx, item.status, x + 40, centerY, config.colors, 1.5);

                ctx.fillStyle = config.theme.text;
                ctx.font = '600 25px Inter, sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                const textStartY = centerY - ((item.lines.length - 1) * config.itemLineHeight) / 2;
                item.lines.forEach((line, index) => {
                    ctx.fillText(line, x + 70, textStartY + index * config.itemLineHeight);
                });

                if (item.role) {
                    const roleX = x + config.categoryWidth - 48;
                    ctx.font = '700 23px Inter, sans-serif';
                    ctx.textAlign = 'center';
                    if (item.role === 'gives' || item.role === 'both') {
                        ctx.fillStyle = config.colors.donne;
                        ctx.fillText('→', roleX - (item.role === 'both' ? 12 : 0), centerY);
                    }
                    if (item.role === 'receives' || item.role === 'both') {
                        ctx.fillStyle = config.colors.recois;
                        ctx.fillText('←', roleX + (item.role === 'both' ? 12 : 0), centerY);
                    }
                }
                itemY += item.height + config.itemGap;
            });
        }

        function drawFooter(ctx, y) {
            ctx.fillStyle = config.theme.panel;
            roundRect(ctx, config.padding, y, innerWidth, config.footerHeight, 14, true, false);
            ctx.strokeStyle = config.theme.border;
            roundRect(ctx, config.padding, y, innerWidth, config.footerHeight, 14, false, true);
            ctx.fillStyle = config.theme.secondaryText;
            ctx.font = '500 21px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('Développé par Eldayia · x.com/eldayia', config.width / 2, y + config.footerHeight / 2);
            ctx.textAlign = 'right';
            const reference = shareId ? `#s/${shareId}` : '';
            ctx.fillStyle = config.theme.accentSoft;
            ctx.fillText(reference, config.width - config.padding - 24, y + config.footerHeight / 2);
        }

        const maxExportBytes = 4_900_000;

        async function canvasToJpegBlob(canvas, quality) {
            return await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', quality));
        }

        async function compressExportCanvas(sourceCanvas) {
            const qualities = [0.88, 0.84, 0.80, 0.76, 0.72];
            let blob = null;

            for (const quality of qualities) {
                blob = await canvasToJpegBlob(sourceCanvas, quality);
                if (!blob) throw new Error('Impossible d\'encoder l\'image en JPEG');
                if (blob.size <= maxExportBytes) {
                    return {
                        blob,
                        width: sourceCanvas.width,
                        height: sourceCanvas.height
                    };
                }
            }

            // Cas exceptionnel : si la compression JPEG seule ne suffit pas,
            // réduire progressivement l'image tout en conservant ses proportions.
            let workingCanvas = sourceCanvas;
            for (let attempt = 0; attempt < 6 && blob.size > maxExportBytes; attempt++) {
                const estimatedScale = Math.sqrt(maxExportBytes / blob.size) * 0.96;
                const scale = Math.max(0.65, Math.min(0.94, estimatedScale));
                const resizedCanvas = document.createElement('canvas');
                resizedCanvas.width = Math.max(1, Math.floor(workingCanvas.width * scale));
                resizedCanvas.height = Math.max(1, Math.floor(workingCanvas.height * scale));
                const resizedCtx = resizedCanvas.getContext('2d');
                resizedCtx.imageSmoothingEnabled = true;
                resizedCtx.imageSmoothingQuality = 'high';
                resizedCtx.fillStyle = config.theme.background;
                resizedCtx.fillRect(0, 0, resizedCanvas.width, resizedCanvas.height);
                resizedCtx.drawImage(
                    workingCanvas,
                    0,
                    0,
                    resizedCanvas.width,
                    resizedCanvas.height
                );
                workingCanvas = resizedCanvas;
                blob = await canvasToJpegBlob(workingCanvas, 0.72);
                if (!blob) throw new Error('Impossible d\'encoder l\'image redimensionnée');
            }

            if (blob.size > maxExportBytes) {
                throw new Error('Impossible de réduire l\'image sous la limite de 5 Mo');
            }

            return {
                blob,
                width: workingCanvas.width,
                height: workingCanvas.height
            };
        }

        function downloadExportBlob(filename, blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.className = 'download-link-hidden';
            document.body.appendChild(link);
            link.click();
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }

        const date = new Date().toISOString().split('T')[0];
        const canvas = document.createElement('canvas');
        canvas.width = config.width;
        canvas.height = imageHeight;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.fillStyle = config.theme.background;
        ctx.fillRect(0, 0, config.width, imageHeight);
        const pageGlow = ctx.createRadialGradient(
            config.width * 0.86,
            0,
            0,
            config.width * 0.86,
            0,
            Math.max(config.width * 0.62, 900)
        );
        pageGlow.addColorStop(0, '#42152f');
        pageGlow.addColorStop(0.42, '#20111c');
        pageGlow.addColorStop(1, config.theme.background);
        ctx.fillStyle = pageGlow;
        ctx.fillRect(0, 0, config.width, imageHeight);

        let contentY = config.padding;
        contentY = drawHeader(ctx, contentY);
        contentY = drawUserInfo(ctx, contentY);
        contentY = drawLegend(ctx, contentY);

        columns.forEach((column, columnIndex) => {
            const x = config.padding + columnIndex * (config.categoryWidth + config.categoryGap);
            let categoryY = contentY;
            column.forEach((category, categoryIndex) => {
                drawCategory(ctx, category, x, categoryY);
                categoryY += category.height;
                if (categoryIndex < column.length - 1) categoryY += config.rowGap;
            });
        });

        drawFooter(ctx, contentY + contentHeight);
        const compressedExport = await compressExportCanvas(canvas);
        downloadExportBlob(`kinklist-${date}.jpg`, compressedExport.blob);

        const shareMessage = shareId
            ? ` L'identifiant de partage #s/${shareId} est présent dans le pied de page.`
            : '';
        const exportSize = (compressedExport.blob.size / 1_000_000).toFixed(2);
        alert(`Votre kinklist a été exportée en une seule image lisible (${exportSize} Mo).${shareMessage}`);
    } catch (error) {
        console.error('Erreur export image lisible:', error);
        alert('Échec de l\'exportation en image. Ouvrez la console pour plus de détails.');
    } finally {
        exportBtn.textContent = originalText;
        exportBtn.disabled = false;
    }
}

async function handleShareHashChange() {
    const sharedDataLoaded = await loadSharedData();
    if (sharedDataLoaded) applyFilters();
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

// Generate a short share link through the backend (no oversized URL fallback)
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
        const response = await fetch(getApiUrl('/api/share'), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ data: shareData })
        });

        if (!response.ok) {
            throw new Error(`Erreur API: ${response.status}`);
        }

        const { id } = await response.json();
        if (!id || !/^[a-zA-Z0-9]{12}$/.test(id)) {
            throw new Error('Réponse API invalide : identifiant court manquant');
        }
        const url = buildShortShareUrl(id);

        // Copy to clipboard
        navigator.clipboard.writeText(url).then(() => {
            alert(`Lien de partage copié dans le presse-papier !\n\n${url}\n\nPartagez ce lien pour que d'autres puissent voir votre kinklist.`);
        }).catch(() => {
            // Fallback: show the link in a prompt
            prompt('Copiez ce lien pour partager votre kinklist :', url);
        });
    } catch (error) {
        console.error('API de liens courts indisponible:', error);
        const localInstructions = window.location.protocol === 'file:'
            ? '\n\nLa page est ouverte directement depuis un fichier. Lancez `npm start`, puis ouvrez http://localhost:3000 et réessayez.'
            : '';
        alert(
            'Impossible de créer le lien court sur le domaine actuel.'
            + localInstructions
            + '\n\nAucun lien long n\'a été généré.'
        );
    }
}

// Load shared data from URL
async function loadSharedData() {
    const hash = window.location.hash;

    // Format court : #s/A1b2C3d4E5f6
    if (hash && hash.startsWith('#s/')) {
        const id = hash.substring(3); // Remove '#s/'

        if (/^[a-zA-Z0-9]{12}$/.test(id)) {
            try {
                const response = await fetch(getApiUrl(`/api/share/${id}`));

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
                clearShareHash();
                return true;
            } catch (error) {
                console.error('Erreur chargement lien court:', error);
                alert('Erreur : Le lien de partage est invalide ou a expiré.');
                clearShareHash();
                return false;
            }
        } else {
            alert('Format de lien invalide.');
            clearShareHash();
            return false;
        }
    }
    // Les anciens liens contenant directement les données ne sont plus acceptés.
    else if (hash && hash.startsWith('#share=')) {
        alert('Cet ancien format de lien n\'est plus accepté. Demandez un nouveau lien court.');
        clearShareHash();
        return false;
    }

    return false;
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

function createSeededRandom(seed) {
    let state = (Number(seed) >>> 0) || 0x45da1a;
    return () => {
        state = (state * 1664525 + 1013904223) >>> 0;
        return state / 4294967296;
    };
}

function fillDevImageTestData(seed = 20260721, withProfile = false) {
    if (!localStorage.getItem(DEV_BACKUP_KEY)) {
        localStorage.setItem(DEV_BACKUP_KEY, JSON.stringify({
            selections: kinkSelections,
            roles: kinkRoles,
            userInfo
        }));
    }

    const random = createSeededRandom(seed);
    const roleTypes = ['gives', 'receives', 'both', null];
    const roleCounts = { gives: 0, receives: 0, both: 0, none: 0 };
    kinkSelections = {};
    kinkRoles = {};

    Object.entries(kinksData).forEach(([category, kinks]) => {
        kinks.forEach(kink => {
            const kinkId = `${category}::${kink}`;
            const status = STATUS_TYPES[Math.floor(random() * STATUS_TYPES.length)];
            const role = roleTypes[Math.floor(random() * roleTypes.length)];

            kinkSelections[kinkId] = status;
            if (role) {
                kinkRoles[kinkId] = role;
                roleCounts[role]++;
            } else {
                roleCounts.none++;
            }
        });
    });

    if (withProfile) {
        userInfo = {
            name: 'Profil de test',
            gender: 'Genre de test',
            sexuality: 'Sexualité de test',
            preference: 'Switch'
        };
        saveUserInfoToLocalStorage();
        populateUserInfoFields();
    }

    saveToLocalStorage();
    saveRolesToLocalStorage();
    applyFilters();

    return {
        seed: Number(seed),
        totalKinks: Object.keys(kinkSelections).length,
        statuses: getStatistics(),
        roles: roleCounts,
        profileIncluded: Boolean(withProfile),
        restoreCommand: 'window.__eldaKinkTest.restore()'
    };
}

function restoreDevImageTestData() {
    const savedBackup = localStorage.getItem(DEV_BACKUP_KEY);
    if (!savedBackup) {
        return { restored: false, reason: 'Aucune sauvegarde de test disponible.' };
    }

    try {
        const backup = JSON.parse(savedBackup);
        kinkSelections = backup.selections || {};
        kinkRoles = backup.roles || {};
        userInfo = backup.userInfo || { name: '', gender: '', sexuality: '', preference: '' };

        saveToLocalStorage();
        saveRolesToLocalStorage();
        saveUserInfoToLocalStorage();
        populateUserInfoFields();
        applyFilters();
        localStorage.removeItem(DEV_BACKUP_KEY);

        return {
            restored: true,
            totalKinks: Object.keys(kinkSelections).length
        };
    } catch (error) {
        return { restored: false, reason: error.message };
    }
}

Object.defineProperty(window, '__eldaKinkTest', {
    value: Object.freeze({
        fill: fillDevImageTestData,
        restore: restoreDevImageTestData
    }),
    enumerable: false,
    configurable: false,
    writable: false
});

// Console helper for statistics
window.getKinklistStats = getStatistics;

console.log('Kinklist chargée avec succès ! 🎉');
console.log('Utilisez getKinklistStats() dans la console pour voir vos statistiques.');
