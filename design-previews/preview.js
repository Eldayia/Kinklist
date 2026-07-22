const previewCategories = [
    {
        name: "BDSM général & Domination",
        description: "Pouvoir, règles et dynamiques de contrôle",
        kinks: ["Discipline", "Ordres / Commandements", "Service domestique", "Contrat BDSM", "Inspection", "Collier / Symbole de propriété"]
    },
    {
        name: "Bondage & Immobilisation",
        description: "Cordes, contraintes et positions maintenues",
        kinks: ["Bondage léger", "Bondage strict", "Shibari / Kinbaku", "Barre d'écartement", "Cocon de bondage", "Suspension partielle"]
    },
    {
        name: "Furry & Creature Play",
        description: "Personnages anthropomorphes et créatures fictives",
        kinks: ["Furry roleplay", "Fursuit partielle", "Pet play", "Monster play", "Transformation en furry", "Art furry érotique"]
    },
    {
        name: "ABDL & Ageplay adulte",
        description: "Rôles caregiver/Little et univers ABDL entre adultes",
        kinks: ["Little space", "Couches adultes", "Mommy / Little", "Daddy / Little", "Grenouillère adulte", "Histoires au coucher"]
    }
];

const statuses = [
    { id: "love", label: "J'adore", short: "Adore" },
    { id: "like", label: "J'aime", short: "Aime" },
    { id: "curious", label: "Curieux·se", short: "Curieux" },
    { id: "maybe", label: "Peut-être", short: "Peut-être" },
    { id: "no", label: "Non merci", short: "Non" },
    { id: "limit", label: "Hard Limit", short: "Limite" }
];

const definitions = {
    "Discipline": "Dynamique fondée sur des règles, des attentes et des conséquences convenues entre les partenaires.",
    "Ordres / Commandements": "Instructions données dans une dynamique de pouvoir afin de guider une action, une posture ou un comportement.",
    "Service domestique": "Soumission exprimée par des tâches ménagères, l'organisation du foyer ou l'assistance quotidienne.",
    "Contrat BDSM": "Document symbolique décrivant rôles, règles, limites, responsabilités et conditions de révision d'une dynamique.",
    "Inspection": "Examen ordonné du corps, de la tenue ou d'une tâche afin d'en vérifier la conformité aux règles établies.",
    "Collier / Symbole de propriété": "Objet représentant symboliquement un rôle, une appartenance négociée ou un engagement dans la dynamique.",
    "Bondage léger": "Immobilisation souple limitant certains mouvements sans rechercher une contrainte complète.",
    "Bondage strict": "Immobilisation ferme qui réduit fortement les mouvements et demande une surveillance attentive.",
    "Shibari / Kinbaku": "Pratique japonaise du bondage par corde, recherchée pour ses motifs, ses sensations et sa dimension relationnelle.",
    "Barre d'écartement": "Barre rigide maintenant une distance constante entre deux membres, généralement les chevilles ou les poignets.",
    "Cocon de bondage": "Enveloppement presque intégral du corps produisant compression, immobilité et sensation d'enveloppement.",
    "Suspension partielle": "Bondage où une partie du poids quitte le sol tandis qu'un ou plusieurs appuis restent en place.",
    "Furry roleplay": "Jeu de rôle où des adultes incarnent des personnages animaux anthropomorphes.",
    "Fursuit partielle": "Port de certaines pièces d'un costume furry, comme une tête, des pattes ou une queue, sans combinaison complète.",
    "Pet play": "Jeu de rôle adulte où une personne adopte les comportements et accessoires d'un animal choisi.",
    "Monster play": "Jeu de rôle adulte impliquant une créature monstrueuse fictive et un scénario fantastique.",
    "Transformation en furry": "Fantasme fictif où une personne humaine acquiert des caractéristiques animales anthropomorphes.",
    "Art furry érotique": "Illustrations sexuelles représentant des personnages animaux anthropomorphes adultes.",
    "Little space": "État de détente adulte associé à une attitude plus jeune, joueuse, dépendante ou réconfortante.",
    "Couches adultes": "Port de protections absorbantes conçues pour un corps adulte, pour le confort, le rôle ou l'usage fonctionnel.",
    "Mommy / Little": "Dynamique adulte où une caregiver appelée Mommy guide, protège ou discipline une personne dans le rôle de Little.",
    "Daddy / Little": "Dynamique adulte où un caregiver appelé Daddy guide, protège ou discipline une personne dans le rôle de Little.",
    "Grenouillère adulte": "Vêtement d'une seule pièce à taille adulte, souvent doux et décoré, porté pour le confort ou l'esthétique Little.",
    "Histoires au coucher": "Lecture d'un récit avant de dormir comme rituel apaisant entre caregiver et Little adultes."
};

function statusButton(status) {
    return `<button class="status-button" data-status="${status.id}" type="button" aria-label="${status.label}" title="${status.label}"><span class="status-icon icon-${status.id}" aria-hidden="true"></span><span class="status-short">${status.short}</span></button>`;
}

function kinkCard(categoryIndex, kinkIndex, kink) {
    const id = `${categoryIndex}-${kinkIndex}`;
    return `
        <article class="kink-card" data-kink="${kink.toLocaleLowerCase('fr')}" data-id="${id}">
            <div class="kink-heading">
                <button class="kink-name" type="button" aria-describedby="definition-${id}">${kink}</button>
                <span class="selection-summary" aria-live="polite">Non renseigné</span>
                <div class="definition" id="definition-${id}" role="tooltip">${definitions[kink]}</div>
            </div>
            <div class="kink-actions" aria-label="Choix pour ${kink}">
                <div class="status-buttons">${statuses.map(statusButton).join("")}</div>
                <div class="role-buttons" aria-label="Rôle">
                    <button class="role-button role-gives" type="button" data-role="gives" title="Donne"><span aria-hidden="true">→</span><span class="role-label">Donne</span></button>
                    <button class="role-button role-receives" type="button" data-role="receives" title="Reçoit"><span aria-hidden="true">←</span><span class="role-label">Reçoit</span></button>
                </div>
            </div>
        </article>`;
}

function categoryBlock(category, index) {
    return `
        <section class="category" data-category="${category.name.toLocaleLowerCase('fr')}">
            <button class="category-header" type="button" aria-expanded="false" aria-controls="category-${index}">
                <span class="category-index">${String(index + 1).padStart(2, "0")}</span>
                <span class="category-copy"><strong>${category.name}</strong><small>${category.description}</small></span>
                <span class="category-count">${category.kinks.length} kinks</span>
                <span class="chevron" aria-hidden="true">⌄</span>
            </button>
            <div class="category-content" id="category-${index}" hidden>
                ${category.kinks.map((kink, kinkIndex) => kinkCard(index, kinkIndex, kink)).join("")}
            </div>
        </section>`;
}

document.body.innerHTML = `
    <a class="skip-link" href="#kinklist">Aller à la liste</a>
    <header class="site-header">
        <a class="brand" href="index.html" aria-label="Retour au choix des maquettes">
            <span class="brand-mark" aria-hidden="true"><img src="../favicon.svg" alt=""></span>
            <span><strong>Ma Kinklist</strong><small>Explorer · Comprendre · Partager</small></span>
        </a>
        <div class="header-actions">
            <span class="prototype-badge">Prototype</span>
            <button class="button button-quiet" type="button">Partager le site</button>
        </div>
    </header>

    <main class="page-shell">
        <aside class="side-panel">
            <div class="intro-card">
                <span class="eyebrow">Votre espace personnel</span>
                <div class="usage-pages" aria-label="Comment utiliser Ma Kinklist">
                    <section class="usage-page usage-welcome">
                        <h1>Exprimez vos envies, simplement.</h1>
                        <p class="intro-summary">Cette liste vous aide à explorer vos envies, exprimer vos limites et préparer une discussion avec vos partenaires. Elle ne remplace pas une conversation ni un consentement clair et continu.</p>
                        <p class="intro-optional"><strong>Tout est facultatif.</strong> Les informations personnelles laissées vides et les kinks sans statut n’apparaîtront pas dans l’image exportée.</p>
                    </section>
                    <section class="usage-page usage-step">
                        <div class="usage-step-heading">
                            <span class="usage-number">Étape 01</span>
                            <span class="usage-icon" aria-hidden="true"><i class="status-icon icon-love"></i></span>
                        </div>
                        <h2>Choisissez un statut</h2>
                        <p>Pour chaque kink, indiquez si vous adorez, aimez, êtes curieux·se, hésitez, refusez ou le considérez comme une limite stricte.</p>
                        <div class="status-preview" aria-hidden="true">
                            ${statuses.map(status => `<span><i class="status-icon icon-${status.id}"></i>${status.short}</span>`).join("")}
                        </div>
                    </section>
                    <section class="usage-page usage-step">
                        <div class="usage-step-heading">
                            <span class="usage-number">Étape 02</span>
                            <span class="usage-icon usage-role-icon" aria-hidden="true">→ ←</span>
                        </div>
                        <h2>Précisez votre rôle</h2>
                        <p>Utilisez Donne et Reçoit si cette distinction s’applique à la pratique. Vous pouvez sélectionner les deux rôles ensemble.</p>
                        <div class="role-preview" aria-hidden="true">
                            <span class="gives"><b>→</b><small>Donne</small></span>
                            <span class="receives"><b>←</b><small>Reçoit</small></span>
                        </div>
                    </section>
                    <section class="usage-page usage-step">
                        <div class="usage-step-heading">
                            <span class="usage-number">Étape 03</span>
                            <span class="usage-icon usage-share-icon" aria-hidden="true">↗</span>
                        </div>
                        <h2>Partagez votre liste</h2>
                        <p>Générez un lien ou exportez une image regroupant uniquement les kinks que vous avez renseignés.</p>
                        <div class="share-preview" aria-hidden="true">
                            <span><b>↗</b><small>Lien privé</small></span>
                            <span><b>▧</b><small>Image unique</small></span>
                        </div>
                    </section>
                </div>
                <div class="usage-navigation" aria-label="Sélecteur de page">
                    <button class="usage-nav-button" id="usage-previous" type="button" aria-label="Page précédente">
                        <span aria-hidden="true">←</span>
                        <span>Précédent</span>
                    </button>
                    <div class="usage-pagination" aria-label="Choisir une page">
                        <button type="button" data-page="0" aria-label="Page 1 : Exprimez vos envies">1</button>
                        <button type="button" data-page="1" aria-label="Page 2 : Choisissez un statut">2</button>
                        <button type="button" data-page="2" aria-label="Page 3 : Précisez votre rôle">3</button>
                        <button type="button" data-page="3" aria-label="Page 4 : Partagez votre liste">4</button>
                    </div>
                    <button class="usage-nav-button" id="usage-next" type="button" aria-label="Page suivante">
                        <span>Suivant</span>
                        <span aria-hidden="true">→</span>
                    </button>
                </div>
                <div class="progress-row"><span>Progression</span><strong id="progress-value">0 / 24</strong></div>
                <div class="progress-track"><span id="progress-bar"></span></div>
            </div>

            <section class="profile-card" aria-labelledby="profile-title">
                <div class="section-heading"><span>01</span><h2 id="profile-title">À propos de vous</h2></div>
                <div class="field-pair profile-row">
                    <label>Pseudo<input type="text" placeholder="Nom ou pseudo"></label>
                    <label>Orientation<input type="text" placeholder="Votre orientation"></label>
                </div>
                <div class="field-pair profile-row">
                    <label>Genre<input type="text" placeholder="Votre genre"></label>
                    <label>Rôle<select><option>Non renseigné</option><option>Top</option><option>Bottom</option><option>Switch</option></select></label>
                </div>
            </section>

            <section class="legend-card" aria-labelledby="legend-title">
                <div class="section-heading"><span>02</span><h2 id="legend-title">Légende</h2></div>
                <div class="legend-grid">
                    ${statuses.map(status => `<div class="legend-item"><span class="status-icon icon-${status.id}"></span><span>${status.label}</span></div>`).join("")}
                    <div class="legend-item role-legend gives"><b>→</b><span>Donne</span></div>
                    <div class="legend-item role-legend receives"><b>←</b><span>Reçoit</span></div>
                </div>
            </section>
        </aside>

        <section class="content-panel" id="kinklist">
            <div class="content-intro">
                <span class="eyebrow">03 · La liste</span>
                <h2>Vos préférences</h2>
                <p>Survolez ou sélectionnez un nom pour lire sa définition.</p>
            </div>

            <div class="toolbar">
                <label class="search-field"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="Rechercher un kink…"></label>
                <button class="button button-quiet" id="expand-all" type="button">Tout déplier</button>
                <button class="button button-quiet" id="collapse-all" type="button">Tout replier</button>
                <button class="button button-primary" type="button">Exporter</button>
            </div>

            <div class="category-list">${previewCategories.map(categoryBlock).join("")}</div>
        </section>
    </main>

    <footer class="site-footer"><span>Ma Kinklist · Proposition visuelle</span><span>Développé par Eldayia</span></footer>`;

function setCategoryState(category, expanded) {
    const button = category.querySelector(".category-header");
    const content = category.querySelector(".category-content");
    button.setAttribute("aria-expanded", String(expanded));
    content.hidden = !expanded;
    category.classList.toggle("expanded", expanded);
}

document.querySelectorAll(".category-header").forEach(button => {
    button.addEventListener("click", () => {
        const category = button.closest(".category");
        setCategoryState(category, button.getAttribute("aria-expanded") !== "true");
    });
});

document.querySelector("#expand-all").addEventListener("click", () => {
    document.querySelectorAll(".category:not([hidden])").forEach(category => setCategoryState(category, true));
});

document.querySelector("#collapse-all").addEventListener("click", () => {
    document.querySelectorAll(".category").forEach(category => setCategoryState(category, false));
});

document.querySelector("#search").addEventListener("input", event => {
    const query = event.target.value.trim().toLocaleLowerCase("fr");
    document.querySelectorAll(".category").forEach(category => {
        let visible = 0;
        category.querySelectorAll(".kink-card").forEach(card => {
            const match = !query || card.dataset.kink.includes(query);
            card.hidden = !match;
            if (match) visible += 1;
        });
        const categoryMatch = category.dataset.category.includes(query);
        category.hidden = Boolean(query) && visible === 0 && !categoryMatch;
        if (query && (visible || categoryMatch)) setCategoryState(category, true);
    });
});

function updateProgress() {
    const selected = document.querySelectorAll(".kink-card[data-selected]").length;
    document.querySelector("#progress-value").textContent = `${selected} / 24`;
    document.querySelector("#progress-bar").style.width = `${selected / 24 * 100}%`;
}

document.querySelectorAll(".status-button").forEach(button => {
    button.addEventListener("click", () => {
        const card = button.closest(".kink-card");
        const wasActive = button.classList.contains("active");
        card.querySelectorAll(".status-button").forEach(item => item.classList.remove("active"));
        if (wasActive) {
            delete card.dataset.selected;
            card.querySelector(".selection-summary").textContent = "Non renseigné";
        } else {
            button.classList.add("active");
            card.dataset.selected = button.dataset.status;
            card.querySelector(".selection-summary").textContent = statuses.find(status => status.id === button.dataset.status).label;
        }
        updateProgress();
    });
});

document.querySelectorAll(".role-button").forEach(button => {
    button.addEventListener("click", () => button.classList.toggle("active"));
});

document.querySelectorAll(".kink-name").forEach(button => {
    button.addEventListener("click", () => button.closest(".kink-heading").classList.toggle("show-definition"));
});

if (document.body.classList.contains("concept-nocturne")) {
    const usagePagesContainer = document.querySelector(".usage-pages");
    const usagePages = [...usagePagesContainer.querySelectorAll(".usage-page")];
    const usagePageButtons = [...document.querySelectorAll(".usage-pagination button")];
    const previousUsagePage = document.querySelector("#usage-previous");
    const nextUsagePage = document.querySelector("#usage-next");
    let activeUsagePage = 0;

    function showUsagePage(index, direction) {
        const targetPage = Math.max(0, Math.min(index, usagePages.length - 1));
        activeUsagePage = targetPage;
        usagePagesContainer.dataset.direction = direction;
        usagePages.forEach((page, pageIndex) => {
            const active = pageIndex === activeUsagePage;
            page.classList.toggle("active", active);
            page.setAttribute("aria-hidden", String(!active));
        });
        usagePageButtons.forEach((button, pageIndex) => {
            const active = pageIndex === activeUsagePage;
            button.classList.toggle("active", active);
            if (active) button.setAttribute("aria-current", "page");
            else button.removeAttribute("aria-current");
        });
        previousUsagePage.disabled = activeUsagePage === 0;
        nextUsagePage.disabled = activeUsagePage === usagePages.length - 1;
    }

    previousUsagePage.addEventListener("click", () => showUsagePage(activeUsagePage - 1, "previous"));
    nextUsagePage.addEventListener("click", () => showUsagePage(activeUsagePage + 1, "next"));
    usagePageButtons.forEach((button, pageIndex) => {
        button.addEventListener("click", () => showUsagePage(pageIndex, pageIndex < activeUsagePage ? "previous" : "next"));
    });
    showUsagePage(0, "next");
}

// Les catégories restent repliées par défaut, comme sur le site demandé.
