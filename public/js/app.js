// ============================================================
// app.js — BiblioTech Frontend
// ============================================================

let currentPage = 'dashboard';
let currentUser = null;

const modalOverlay = document.getElementById('modalOverlay');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toastMessage');

// ============================================================
// INITIALISATION
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    const saved = localStorage.getItem('bibliotech_user');
    if (saved) {
        currentUser = JSON.parse(saved);
        afficherEspacePrincipal();
    } else {
        chargerAccueil();
    }
    configurerModal();
});

async function chargerAccueil() {
    try {
        const [statsRes, livresRes] = await Promise.all([
            fetch('/api/stats'),
            fetch('/api/livres')
        ]);
        const stats = await statsRes.json();
        const livres = await livresRes.json();

        document.getElementById('heroTotalLivres').textContent = stats.totalLivres;
        document.getElementById('heroLivresDispo').textContent = stats.livresDisponibles;
        document.getElementById('heroMembers').textContent = stats.totalUtilisateurs || 0;

        const grid = document.getElementById('catalogueAccueil');
        grid.innerHTML = livres.map(l => `
            <div class="book-card">
                <img class="book-card-img" src="${l.image}" alt="${l.titre}" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'">
                <div class="book-card-body">
                    <h3>${l.titre}</h3>
                    <p class="book-author">${l.auteur}</p>
                    <div class="book-meta">
                        <span class="book-genre">${l.genre}</span>
                        <span class="book-status ${l.disponible ? 'disponible' : 'emprunte'}">${l.disponible ? 'Disponible' : 'Emprunte'}</span>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error('Erreur chargement accueil:', e);
    }
}

// ============================================================
// AUTH
// ============================================================
function afficherConnexion() {
    document.getElementById('authOverlay').classList.add('active');
    document.getElementById('formConnexion').style.display = 'block';
    document.getElementById('formInscription').style.display = 'none';
}

function afficherInscription() {
    document.getElementById('authOverlay').classList.add('active');
    document.getElementById('formConnexion').style.display = 'none';
    document.getElementById('formInscription').style.display = 'block';
}

function fermerAuth() {
    document.getElementById('authOverlay').classList.remove('active');
}

function basculerVersInscription() {
    document.getElementById('formConnexion').style.display = 'none';
    document.getElementById('formInscription').style.display = 'block';
}

function basculerVersConnexion() {
    document.getElementById('formConnexion').style.display = 'block';
    document.getElementById('formInscription').style.display = 'none';
}

async function connecter(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const motDePasse = document.getElementById('loginPassword').value;

    try {
        const res = await fetch('/api/auth/connexion', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, motDePasse })
        });
        if (res.ok) {
            currentUser = await res.json();
            localStorage.setItem('bibliotech_user', JSON.stringify(currentUser));
            fermerAuth();
            afficherEspacePrincipal();
            afficherToast('Connexion reussie !', 'success');
        } else {
            const err = await res.json();
            afficherToast(err.erreur || 'Erreur de connexion', 'error');
        }
    } catch (err) {
        afficherToast('Erreur de connexion au serveur', 'error');
    }
}

async function inscrire(e) {
    e.preventDefault();
    const nom = document.getElementById('registerNom').value;
    const email = document.getElementById('registerEmail').value;
    const motDePasse = document.getElementById('registerPassword').value;

    try {
        const res = await fetch('/api/auth/inscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nom, email, motDePasse })
        });
        if (res.ok) {
            currentUser = await res.json();
            localStorage.setItem('bibliotech_user', JSON.stringify(currentUser));
            fermerAuth();
            afficherEspacePrincipal();
            afficherToast('Inscription reussie ! Bienvenue ' + currentUser.nom, 'success');
        } else {
            const err = await res.json();
            afficherToast(err.erreur || 'Erreur lors de l\'inscription', 'error');
        }
    } catch (err) {
        afficherToast('Erreur de connexion au serveur', 'error');
    }
}

function deconnecter() {
    currentUser = null;
    localStorage.removeItem('bibliotech_user');
    document.getElementById('espacePrincipal').style.display = 'none';
    document.getElementById('pageAccueil').style.display = 'block';
    chargerAccueil();
    afficherToast('Deconnexion reussie', 'success');
}

// ============================================================
// ESPACE PRINCIPAL
// ============================================================
function afficherEspacePrincipal() {
    document.getElementById('pageAccueil').style.display = 'none';
    document.getElementById('espacePrincipal').style.display = 'flex';

    const initials = currentUser.nom.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    document.getElementById('userAvatar').textContent = initials;
    document.getElementById('userName').textContent = currentUser.nom;
    document.getElementById('userRole').textContent = currentUser.role === 'admin' ? 'Administrateur' : 'Membre';
    document.getElementById('topBarUserName').textContent = currentUser.nom;
    document.getElementById('topBarAvatar').textContent = initials;

    afficherDateDuJour();
    construireMenu();
    configurerMenuMobile();
    chargerPage('dashboard');
}

function construireMenu() {
    const menu = document.getElementById('navMenu');
    const isAdmin = currentUser.role === 'admin';

    let items = [];
    if (isAdmin) {
        items = [
            { page: 'dashboard', icon: 'fa-chart-pie', label: 'Tableau de bord' },
            { page: 'livres', icon: 'fa-book', label: 'Livres' },
            { page: 'demandes-admin', icon: 'fa-inbox', label: 'Demandes', badge: true },
            { page: 'emprunts', icon: 'fa-hand-holding', label: 'Emprunts' },
            { page: 'retours', icon: 'fa-undo-alt', label: 'Retours' },
            { page: 'amendes', icon: 'fa-coins', label: 'Amendes' }
        ];
    } else {
        items = [
            { page: 'catalogue-user', icon: 'fa-book-open', label: 'Catalogue' },
            { page: 'mes-demandes', icon: 'fa-paper-plane', label: 'Mes demandes' },
            { page: 'mes-emprunts', icon: 'fa-hand-holding', label: 'Mes emprunts' }
        ];
    }

    menu.innerHTML = items.map((item, i) => `
        <li class="nav-item ${i === 0 ? 'active' : ''}" data-page="${item.page}">
            <i class="fas ${item.icon}"></i>
            <span>${item.label}</span>
            ${item.badge ? '<span class="nav-badge" id="badgeDemandes" style="display:none">0</span>' : ''}
        </li>
    `).join('');

    menu.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            menu.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            chargerPage(item.dataset.page);
            document.getElementById('sidebar').classList.remove('active');
        });
    });

    if (isAdmin) mettreAJourBadgeDemandes();
}

async function mettreAJourBadgeDemandes() {
    try {
        const res = await fetch('/api/stats');
        const stats = await res.json();
        const badge = document.getElementById('badgeDemandes');
        if (badge) {
            if (stats.demandesEnAttente > 0) {
                badge.style.display = 'inline';
                badge.textContent = stats.demandesEnAttente;
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (e) { /* ignore */ }
}

// ============================================================
// NAVIGATION
// ============================================================
function chargerPage(page) {
    currentPage = page;
    const titres = {
        'dashboard': 'Tableau de bord',
        'livres': 'Gestion des livres',
        'emprunts': 'Gestion des emprunts',
        'retours': 'Retour de livres',
        'amendes': 'Amendes',
        'demandes-admin': 'Demandes d\'emprunt',
        'catalogue-user': 'Catalogue',
        'mes-demandes': 'Mes demandes',
        'mes-emprunts': 'Mes emprunts'
    };
    document.getElementById('pageTitle').textContent = titres[page] || 'Page';

    const contentArea = document.getElementById('contentArea');

    switch (page) {
        case 'dashboard': chargerDashboard(); break;
        case 'livres': chargerLivres(); break;
        case 'emprunts': chargerEmprunts(); break;
        case 'retours': chargerRetours(); break;
        case 'amendes': chargerAmendes(); break;
        case 'demandes-admin': chargerDemandesAdmin(); break;
        case 'catalogue-user': chargerCatalogueUser(); break;
        case 'mes-demandes': chargerMesDemandes(); break;
        case 'mes-emprunts': chargerMesEmprunts(); break;
    }
}

// ============================================================
// DASHBOARD (admin)
// ============================================================
async function chargerDashboard() {
    const contentArea = document.getElementById('contentArea');
    try {
        const [statsRes, empruntsRes] = await Promise.all([
            fetch('/api/stats'),
            fetch('/api/emprunts/en-cours')
        ]);
        const stats = await statsRes.json();
        const empruntsEnCours = await empruntsRes.json();

        contentArea.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card livres">
                    <div class="stat-card-header">
                        <span>Total livres</span>
                        <div class="stat-icon"><i class="fas fa-book"></i></div>
                    </div>
                    <div class="stat-number">${stats.totalLivres}</div>
                    <p style="color:var(--gray-600);font-size:12px;margin-top:6px">${stats.livresDisponibles} disponible(s)</p>
                </div>
                <div class="stat-card emprunts">
                    <div class="stat-card-header">
                        <span>Emprunts en cours</span>
                        <div class="stat-icon"><i class="fas fa-hand-holding"></i></div>
                    </div>
                    <div class="stat-number">${stats.empruntsEnCours}</div>
                    <p style="color:var(--gray-600);font-size:12px;margin-top:6px">${stats.totalEmprunts} au total</p>
                </div>
                <div class="stat-card retards">
                    <div class="stat-card-header">
                        <span>Demandes en attente</span>
                        <div class="stat-icon"><i class="fas fa-inbox"></i></div>
                    </div>
                    <div class="stat-number">${stats.demandesEnAttente}</div>
                    <p style="color:var(--gray-600);font-size:12px;margin-top:6px">a traiter</p>
                </div>
                <div class="stat-card amendes">
                    <div class="stat-card-header">
                        <span>Amendes</span>
                        <div class="stat-icon"><i class="fas fa-coins"></i></div>
                    </div>
                    <div class="stat-number">${stats.montantTotalAmendes.toFixed(2)} EUR</div>
                    <p style="color:var(--gray-600);font-size:12px;margin-top:6px">${stats.totalAmendes} amende(s)</p>
                </div>
            </div>

            <div class="recent-section">
                <h3><i class="fas fa-history" style="color:var(--primary)"></i> Emprunts en cours</h3>
                ${empruntsEnCours.length > 0 ? `
                    <div class="table-container">
                        <table>
                            <thead><tr><th>Livre</th><th>Emprunteur</th><th>Date emprunt</th><th>Retour prevu</th><th>Statut</th></tr></thead>
                            <tbody>
                                ${empruntsEnCours.map(e => {
                                    const enRetard = new Date() > new Date(e.dateRetourPrevue);
                                    return `<tr>
                                        <td><strong>${e.titreLivre}</strong></td>
                                        <td>${e.emprunteur}</td>
                                        <td>${formaterDate(e.dateEmprunt)}</td>
                                        <td>${formaterDate(e.dateRetourPrevue)}</td>
                                        <td>${enRetard ? '<span class="badge badge-danger">En retard</span>' : '<span class="badge badge-info">En cours</span>'}</td>
                                    </tr>`;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                ` : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Aucun emprunt en cours</p></div>'}
            </div>
        `;
    } catch (err) {
        contentArea.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erreur de chargement</p></div>';
    }
}

// ============================================================
// LIVRES (admin)
// ============================================================
async function chargerLivres() {
    const contentArea = document.getElementById('contentArea');
    try {
        const res = await fetch('/api/livres');
        const livres = await res.json();

        contentArea.innerHTML = `
            <div class="toolbar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Rechercher un livre..." id="searchInput" oninput="rechercherLivres()">
                </div>
                <button class="btn btn-primary" onclick="ouvrirModalAjoutLivre()">
                    <i class="fas fa-plus"></i> Ajouter un livre
                </button>
            </div>
            <div id="livresContainer">${genererTableauLivres(livres)}</div>
        `;
    } catch (err) {
        contentArea.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erreur de chargement</p></div>';
    }
}

function genererTableauLivres(livres) {
    if (livres.length === 0) return '<div class="empty-state"><i class="fas fa-book-open"></i><p>Aucun livre trouve</p></div>';
    return `
        <div class="table-container">
            <table>
                <thead><tr><th></th><th>Titre</th><th>Auteur</th><th>ISBN</th><th>Annee</th><th>Genre</th><th>Statut</th><th>Actions</th></tr></thead>
                <tbody>
                    ${livres.map(l => `
                        <tr>
                            <td><img src="${l.image || ''}" style="width:40px;height:55px;border-radius:4px;object-fit:cover" onerror="this.style.display='none'"></td>
                            <td><strong>${l.titre}</strong></td>
                            <td>${l.auteur}</td>
                            <td><code style="font-size:12px">${l.isbn}</code></td>
                            <td>${l.annee || '-'}</td>
                            <td>${l.genre}</td>
                            <td>${l.disponible ? '<span class="badge badge-success">Disponible</span>' : '<span class="badge badge-warning">Emprunte</span>'}</td>
                            <td>
                                <div class="action-group">
                                    <button class="btn btn-primary btn-sm" onclick="ouvrirModalModifierLivre(${l.id})"><i class="fas fa-edit"></i></button>
                                    <button class="btn btn-danger btn-sm" onclick="supprimerLivre(${l.id})"><i class="fas fa-trash"></i></button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function rechercherLivres() {
    const terme = document.getElementById('searchInput').value;
    if (!terme.trim()) {
        const res = await fetch('/api/livres');
        const livres = await res.json();
        document.getElementById('livresContainer').innerHTML = genererTableauLivres(livres);
        return;
    }
    try {
        const res = await fetch(`/api/livres/recherche?q=${encodeURIComponent(terme)}`);
        const resultats = await res.json();
        document.getElementById('livresContainer').innerHTML = genererTableauLivres(resultats);
    } catch (e) { console.error(e); }
}

function ouvrirModalAjoutLivre() {
    modalTitle.textContent = 'Ajouter un nouveau livre';
    modalBody.innerHTML = `
        <form id="formLivre" onsubmit="ajouterLivre(event)">
            <div class="form-group"><label>Titre *</label><input type="text" id="titre" placeholder="Le Petit Prince" required></div>
            <div class="form-group"><label>Auteur *</label><input type="text" id="auteur" placeholder="Antoine de Saint-Exupery" required></div>
            <div class="form-group"><label>ISBN *</label><input type="text" id="isbn" placeholder="978-2-07-040850-4" required></div>
            <div class="form-group"><label>Annee</label><input type="number" id="annee" placeholder="2024" min="1000" max="2100"></div>
            <div class="form-group"><label>Genre</label>
                <select id="genre">
                    <option value="">-- Choisir --</option>
                    <option>Roman</option><option>Conte</option><option>Poesie</option>
                    <option>Theatre</option><option>Science-fiction</option><option>Fantasy</option>
                    <option>Policier</option><option>Biographie</option><option>Histoire</option>
                    <option>Sciences</option><option>Philosophie</option><option>Roman d'aventure</option>
                    <option>Autre</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary" style="width:100%"><i class="fas fa-plus"></i> Ajouter</button>
        </form>
    `;
    ouvrirModal();
}

async function ajouterLivre(e) {
    e.preventDefault();
    const livre = {
        titre: document.getElementById('titre').value,
        auteur: document.getElementById('auteur').value,
        isbn: document.getElementById('isbn').value,
        annee: document.getElementById('annee').value ? parseInt(document.getElementById('annee').value) : null,
        genre: document.getElementById('genre').value || 'Non classe'
    };
    try {
        const res = await fetch('/api/livres', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(livre) });
        if (res.ok) { fermerModal(); afficherToast('Livre ajoute !', 'success'); chargerLivres(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur serveur', 'error'); }
}

async function ouvrirModalModifierLivre(id) {
    try {
        const res = await fetch(`/api/livres/${id}`);
        const livre = await res.json();
        modalTitle.textContent = 'Modifier le livre';
        modalBody.innerHTML = `
            <form onsubmit="modifierLivre(event, ${id})">
                <div class="form-group"><label>Titre *</label><input type="text" id="editTitre" value="${livre.titre}" required></div>
                <div class="form-group"><label>Auteur *</label><input type="text" id="editAuteur" value="${livre.auteur}" required></div>
                <div class="form-group"><label>ISBN *</label><input type="text" id="editIsbn" value="${livre.isbn}" required></div>
                <div class="form-group"><label>Annee</label><input type="number" id="editAnnee" value="${livre.annee || ''}" min="1000" max="2100"></div>
                <div class="form-group"><label>Genre</label>
                    <select id="editGenre">
                        ${['Roman','Conte','Poesie','Theatre','Science-fiction','Fantasy','Policier','Biographie','Histoire','Sciences','Philosophie',"Roman d'aventure",'Autre']
                            .map(g => `<option ${g === livre.genre ? 'selected' : ''}>${g}</option>`).join('')}
                    </select>
                </div>
                <button type="submit" class="btn btn-primary" style="width:100%"><i class="fas fa-save"></i> Enregistrer</button>
            </form>
        `;
        ouvrirModal();
    } catch (e) { afficherToast('Erreur', 'error'); }
}

async function modifierLivre(e, id) {
    e.preventDefault();
    const data = {
        titre: document.getElementById('editTitre').value,
        auteur: document.getElementById('editAuteur').value,
        isbn: document.getElementById('editIsbn').value,
        annee: document.getElementById('editAnnee').value ? parseInt(document.getElementById('editAnnee').value) : null,
        genre: document.getElementById('editGenre').value
    };
    try {
        const res = await fetch(`/api/livres/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) { fermerModal(); afficherToast('Livre modifie !', 'success'); chargerLivres(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur serveur', 'error'); }
}

async function supprimerLivre(id) {
    if (!confirm('Supprimer ce livre ?')) return;
    try {
        const res = await fetch(`/api/livres/${id}`, { method: 'DELETE' });
        if (res.ok) { afficherToast('Livre supprime !', 'success'); chargerLivres(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur serveur', 'error'); }
}

// ============================================================
// EMPRUNTS (admin)
// ============================================================
async function chargerEmprunts() {
    const contentArea = document.getElementById('contentArea');
    try {
        const res = await fetch('/api/emprunts');
        const emprunts = await res.json();
        contentArea.innerHTML = `
            <div class="toolbar">
                <div class="tabs">
                    <button class="tab active" onclick="filtrerEmprunts('tous', this)">Tous</button>
                    <button class="tab" onclick="filtrerEmprunts('en-cours', this)">En cours</button>
                    <button class="tab" onclick="filtrerEmprunts('termines', this)">Termines</button>
                </div>
                <button class="btn btn-primary" onclick="ouvrirModalNouvelEmprunt()"><i class="fas fa-plus"></i> Nouvel emprunt</button>
            </div>
            <div id="empruntsContainer">${genererTableauEmprunts(emprunts)}</div>
        `;
    } catch (e) { contentArea.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Erreur</p></div>'; }
}

function genererTableauEmprunts(emprunts) {
    if (emprunts.length === 0) return '<div class="empty-state"><i class="fas fa-hand-holding"></i><p>Aucun emprunt</p></div>';
    return `
        <div class="table-container">
            <table>
                <thead><tr><th>ID</th><th>Livre</th><th>Emprunteur</th><th>Date emprunt</th><th>Retour prevu</th><th>Retourne le</th><th>Statut</th></tr></thead>
                <tbody>
                    ${emprunts.map(e => {
                        let statut;
                        if (e.dateRetourEffective) statut = '<span class="badge badge-success">Retourne</span>';
                        else if (new Date() > new Date(e.dateRetourPrevue)) statut = '<span class="badge badge-danger">En retard</span>';
                        else statut = '<span class="badge badge-info">En cours</span>';
                        return `<tr>
                            <td>#${e.id}</td><td><strong>${e.titreLivre}</strong></td><td>${e.emprunteur}</td>
                            <td>${formaterDate(e.dateEmprunt)}</td><td>${formaterDate(e.dateRetourPrevue)}</td>
                            <td>${e.dateRetourEffective ? formaterDate(e.dateRetourEffective) : '-'}</td><td>${statut}</td>
                        </tr>`;
                    }).join('')}
                </tbody>
            </table>
        </div>
    `;
}

async function filtrerEmprunts(filtre, bouton) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    bouton.classList.add('active');
    try {
        let emprunts;
        if (filtre === 'en-cours') {
            const res = await fetch('/api/emprunts/en-cours');
            emprunts = await res.json();
        } else if (filtre === 'termines') {
            const res = await fetch('/api/emprunts');
            emprunts = (await res.json()).filter(e => e.dateRetourEffective);
        } else {
            const res = await fetch('/api/emprunts');
            emprunts = await res.json();
        }
        document.getElementById('empruntsContainer').innerHTML = genererTableauEmprunts(emprunts);
    } catch (e) { console.error(e); }
}

async function ouvrirModalNouvelEmprunt() {
    try {
        const res = await fetch('/api/livres');
        const livres = await res.json();
        const disponibles = livres.filter(l => l.disponible);
        if (disponibles.length === 0) { afficherToast('Aucun livre disponible', 'error'); return; }
        modalTitle.textContent = 'Nouvel emprunt';
        modalBody.innerHTML = `
            <form id="formEmprunt" onsubmit="creerEmprunt(event)">
                <div class="form-group"><label>Livre *</label>
                    <select id="livreId" required>
                        <option value="">-- Choisir --</option>
                        ${disponibles.map(l => `<option value="${l.id}">${l.titre} - ${l.auteur}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>Emprunteur *</label><input type="text" id="emprunteur" placeholder="Jean Dupont" required></div>
                <div class="form-group"><label>Duree (jours)</label><input type="number" id="dureeJours" value="14" min="1" max="90"></div>
                <button type="submit" class="btn btn-primary" style="width:100%"><i class="fas fa-hand-holding"></i> Enregistrer</button>
            </form>
        `;
        ouvrirModal();
    } catch (e) { afficherToast('Erreur', 'error'); }
}

async function creerEmprunt(e) {
    e.preventDefault();
    const data = {
        livreId: parseInt(document.getElementById('livreId').value),
        emprunteur: document.getElementById('emprunteur').value,
        dureeJours: parseInt(document.getElementById('dureeJours').value) || 14
    };
    try {
        const res = await fetch('/api/emprunts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
        if (res.ok) { fermerModal(); afficherToast('Emprunt enregistre !', 'success'); chargerEmprunts(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur serveur', 'error'); }
}

// ============================================================
// RETOURS (admin)
// ============================================================
async function chargerRetours() {
    const contentArea = document.getElementById('contentArea');
    try {
        const res = await fetch('/api/emprunts/en-cours');
        const emprunts = await res.json();
        contentArea.innerHTML = `
            <p style="color:var(--gray-600);font-size:14px;margin-bottom:18px">
                <i class="fas fa-info-circle" style="color:var(--info);margin-right:6px"></i>
                Enregistrez le retour d'un livre. Une amende sera generee automatiquement en cas de retard.
            </p>
            ${emprunts.length > 0 ? `
                <div class="table-container">
                    <table>
                        <thead><tr><th>ID</th><th>Livre</th><th>Emprunteur</th><th>Emprunte le</th><th>Retour prevu</th><th>Statut</th><th>Action</th></tr></thead>
                        <tbody>
                            ${emprunts.map(e => {
                                const enRetard = new Date() > new Date(e.dateRetourPrevue);
                                return `<tr>
                                    <td>#${e.id}</td><td><strong>${e.titreLivre}</strong></td><td>${e.emprunteur}</td>
                                    <td>${formaterDate(e.dateEmprunt)}</td><td>${formaterDate(e.dateRetourPrevue)}</td>
                                    <td>${enRetard ? '<span class="badge badge-danger">En retard</span>' : '<span class="badge badge-info">En cours</span>'}</td>
                                    <td><button class="btn btn-success btn-sm" onclick="enregistrerRetour(${e.id})"><i class="fas fa-undo-alt"></i> Retourner</button></td>
                                </tr>`;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Tous les livres ont ete retournes !</p></div>'}
        `;
    } catch (e) { console.error(e); }
}

async function enregistrerRetour(empruntId) {
    if (!confirm('Confirmer le retour ?')) return;
    try {
        const res = await fetch(`/api/retours/${empruntId}`, { method: 'POST' });
        const result = await res.json();
        if (res.ok) {
            if (result.enRetard) afficherToast(`Retourne avec ${result.joursRetard} jour(s) de retard. Amende: ${result.amende.montant.toFixed(2)} EUR`, 'error');
            else afficherToast('Livre retourne !', 'success');
            chargerRetours();
        } else { afficherToast(result.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur serveur', 'error'); }
}

// ============================================================
// AMENDES (admin)
// ============================================================
async function chargerAmendes() {
    const contentArea = document.getElementById('contentArea');
    try {
        const res = await fetch('/api/amendes');
        const amendes = await res.json();
        contentArea.innerHTML = `
            ${amendes.length > 0 ? `
                <div class="table-container">
                    <table>
                        <thead><tr><th>ID</th><th>Livre</th><th>Emprunteur</th><th>Jours retard</th><th>Montant</th><th>Statut</th><th>Action</th></tr></thead>
                        <tbody>
                            ${amendes.map(a => `
                                <tr>
                                    <td>#${a.id}</td><td>${a.titreLivre}</td><td>${a.emprunteur}</td>
                                    <td>${a.joursRetard} jour(s)</td><td><strong>${a.montant.toFixed(2)} EUR</strong></td>
                                    <td>${a.payee ? '<span class="badge badge-success">Payee</span>' : '<span class="badge badge-danger">Impayee</span>'}</td>
                                    <td>${!a.payee ? `<button class="btn btn-success btn-sm" onclick="payerAmende(${a.id})"><i class="fas fa-check"></i> Payer</button>` : '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            ` : '<div class="empty-state"><i class="fas fa-check-circle"></i><p>Aucune amende</p></div>'}
        `;
    } catch (e) { console.error(e); }
}

async function payerAmende(id) {
    try {
        const res = await fetch(`/api/amendes/${id}/payer`, { method: 'PUT' });
        if (res.ok) { afficherToast('Amende marquee comme payee', 'success'); chargerAmendes(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur', 'error'); }
}

// ============================================================
// DEMANDES ADMIN
// ============================================================
async function chargerDemandesAdmin() {
    const contentArea = document.getElementById('contentArea');
    try {
        const res = await fetch('/api/demandes');
        const demandes = await res.json();

        const enAttente = demandes.filter(d => d.statut === 'en_attente');
        const traitees = demandes.filter(d => d.statut !== 'en_attente');

        contentArea.innerHTML = `
            <div class="tabs" style="margin-bottom:20px">
                <button class="tab active" onclick="afficherOngletDemandes('attente', this)">En attente (${enAttente.length})</button>
                <button class="tab" onclick="afficherOngletDemandes('traitees', this)">Traitees (${traitees.length})</button>
            </div>

            <div id="demandesAttente">
                ${enAttente.length > 0 ? enAttente.map(d => `
                    <div class="demande-card">
                        <img class="demande-card-img" src="${d.imageLivre || ''}" onerror="this.style.display='none'">
                        <div class="demande-card-info">
                            <h4>${d.titreLivre}</h4>
                            <p class="demande-meta">${d.nomUtilisateur} &mdash; ${formaterDate(d.dateDemande)} &mdash; ${d.dureeJours || 14} jours${d.type === 'retour' ? ' (RETOUR)' : ''}</p>
                            <span class="badge badge-pending">${d.type === 'retour' ? 'Demande de retour' : 'En attente'}</span>
                        </div>
                        <div class="demande-card-actions">
                            ${d.type === 'retour' ?
                                `<button class="btn btn-success btn-sm" onclick="confirmerRetour(${d.id})"><i class="fas fa-check"></i> Confirmer retour</button>` :
                                `<button class="btn btn-success btn-sm" onclick="approuverDemande(${d.id})"><i class="fas fa-check"></i> Approuver</button>
                                 <button class="btn btn-danger btn-sm" onclick="refuserDemande(${d.id})"><i class="fas fa-times"></i> Refuser</button>`
                            }
                        </div>
                    </div>
                `).join('') : '<div class="empty-state"><i class="fas fa-inbox"></i><p>Aucune demande en attente</p></div>'}
            </div>

            <div id="demandesTraitees" style="display:none">
                ${traitees.length > 0 ? traitees.map(d => `
                    <div class="demande-card">
                        <img class="demande-card-img" src="${d.imageLivre || ''}" onerror="this.style.display='none'">
                        <div class="demande-card-info">
                            <h4>${d.titreLivre}</h4>
                            <p class="demande-meta">${d.nomUtilisateur} &mdash; ${formaterDate(d.dateDemande)}</p>
                            <span class="badge ${d.statut === 'approuvee' ? 'badge-success' : 'badge-danger'}">${d.statut === 'approuvee' ? 'Approuvee' : 'Refusee'}</span>
                            ${d.commentaireAdmin ? `<p style="font-size:12px;color:var(--gray-600);margin-top:4px">${d.commentaireAdmin}</p>` : ''}
                        </div>
                    </div>
                `).join('') : '<div class="empty-state"><i class="fas fa-folder-open"></i><p>Aucune demande traitee</p></div>'}
            </div>
        `;
        mettreAJourBadgeDemandes();
    } catch (e) { console.error(e); }
}

function afficherOngletDemandes(onglet, btn) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('demandesAttente').style.display = onglet === 'attente' ? 'block' : 'none';
    document.getElementById('demandesTraitees').style.display = onglet === 'traitees' ? 'block' : 'none';
}

async function approuverDemande(id) {
    try {
        const res = await fetch(`/api/demandes/${id}/approuver`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
        if (res.ok) { afficherToast('Demande approuvee !', 'success'); chargerDemandesAdmin(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur', 'error'); }
}

async function refuserDemande(id) {
    const commentaire = prompt('Raison du refus (optionnel):');
    try {
        const res = await fetch(`/api/demandes/${id}/refuser`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ commentaire }) });
        if (res.ok) { afficherToast('Demande refusee', 'success'); chargerDemandesAdmin(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur', 'error'); }
}

async function confirmerRetour(id) {
    try {
        const res = await fetch(`/api/demandes/${id}/confirmer-retour`, { method: 'PUT' });
        const result = await res.json();
        if (res.ok) {
            if (result.enRetard) afficherToast(`Retour confirme avec ${result.joursRetard} jour(s) de retard`, 'error');
            else afficherToast('Retour confirme !', 'success');
            chargerDemandesAdmin();
        } else { afficherToast(result.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur', 'error'); }
}

// ============================================================
// CATALOGUE UTILISATEUR
// ============================================================
async function chargerCatalogueUser() {
    const contentArea = document.getElementById('contentArea');
    try {
        const res = await fetch('/api/livres');
        const livres = await res.json();
        contentArea.innerHTML = `
            <div class="toolbar">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" placeholder="Rechercher..." id="searchCatalogue" oninput="rechercherCatalogue()">
                </div>
            </div>
            <div id="catalogueContainer">
                <div class="books-grid-admin">
                    ${livres.map(l => `
                        <div class="book-card-admin">
                            <img src="${l.image || ''}" alt="${l.titre}" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'">
                            <div class="book-card-admin-body">
                                <h4>${l.titre}</h4>
                                <p class="author">${l.auteur} ${l.annee ? '(' + l.annee + ')' : ''}</p>
                                <div class="card-footer">
                                    <span class="book-genre">${l.genre}</span>
                                    ${l.disponible ?
                                        `<button class="btn btn-primary btn-sm" onclick="demanderEmprunt(${l.id})"><i class="fas fa-paper-plane"></i> Demander</button>` :
                                        '<span class="badge badge-warning">Indisponible</span>'
                                    }
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    } catch (e) { console.error(e); }
}

async function rechercherCatalogue() {
    const terme = document.getElementById('searchCatalogue').value;
    let livres;
    if (!terme.trim()) {
        const res = await fetch('/api/livres');
        livres = await res.json();
    } else {
        const res = await fetch(`/api/livres/recherche?q=${encodeURIComponent(terme)}`);
        livres = await res.json();
    }
    document.getElementById('catalogueContainer').innerHTML = `
        <div class="books-grid-admin">
            ${livres.map(l => `
                <div class="book-card-admin">
                    <img src="${l.image || ''}" alt="${l.titre}" onerror="this.src='https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop'">
                    <div class="book-card-admin-body">
                        <h4>${l.titre}</h4>
                        <p class="author">${l.auteur}</p>
                        <div class="card-footer">
                            <span class="book-genre">${l.genre}</span>
                            ${l.disponible ?
                                `<button class="btn btn-primary btn-sm" onclick="demanderEmprunt(${l.id})"><i class="fas fa-paper-plane"></i> Demander</button>` :
                                '<span class="badge badge-warning">Indisponible</span>'
                            }
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

async function demanderEmprunt(livreId) {
    modalTitle.textContent = 'Demande d\'emprunt';
    modalBody.innerHTML = `
        <form onsubmit="envoyerDemande(event, ${livreId})">
            <div class="form-group"><label>Duree souhaitee (jours)</label><input type="number" id="dureeDemande" value="14" min="1" max="90"></div>
            <p style="font-size:13px;color:var(--gray-600);margin-bottom:16px"><i class="fas fa-info-circle"></i> Votre demande sera envoyee a l'administrateur pour validation.</p>
            <button type="submit" class="btn btn-primary" style="width:100%"><i class="fas fa-paper-plane"></i> Envoyer la demande</button>
        </form>
    `;
    ouvrirModal();
}

async function envoyerDemande(e, livreId) {
    e.preventDefault();
    const dureeJours = parseInt(document.getElementById('dureeDemande').value) || 14;
    try {
        const res = await fetch('/api/demandes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ livreId, utilisateurId: currentUser.id, dureeJours })
        });
        if (res.ok) { fermerModal(); afficherToast('Demande envoyee ! L\'administrateur va la traiter.', 'success'); chargerCatalogueUser(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur serveur', 'error'); }
}

// ============================================================
// MES DEMANDES (utilisateur)
// ============================================================
async function chargerMesDemandes() {
    const contentArea = document.getElementById('contentArea');
    try {
        const res = await fetch(`/api/demandes/utilisateur/${currentUser.id}`);
        const demandes = await res.json();
        const filtered = demandes.filter(d => d.type !== 'retour');
        contentArea.innerHTML = `
            ${filtered.length > 0 ? filtered.map(d => `
                <div class="demande-card">
                    <img class="demande-card-img" src="${d.imageLivre || ''}" onerror="this.style.display='none'">
                    <div class="demande-card-info">
                        <h4>${d.titreLivre}</h4>
                        <p class="demande-meta">${formaterDate(d.dateDemande)} &mdash; ${d.dureeJours || 14} jours</p>
                        <span class="badge ${d.statut === 'en_attente' ? 'badge-pending' : d.statut === 'approuvee' ? 'badge-success' : 'badge-danger'}">
                            ${d.statut === 'en_attente' ? 'En attente' : d.statut === 'approuvee' ? 'Approuvee' : 'Refusee'}
                        </span>
                        ${d.commentaireAdmin ? `<p style="font-size:12px;color:var(--gray-600);margin-top:4px">${d.commentaireAdmin}</p>` : ''}
                    </div>
                </div>
            `).join('') : '<div class="empty-state"><i class="fas fa-paper-plane"></i><p>Aucune demande. Parcourez le catalogue pour emprunter un livre.</p></div>'}
        `;
    } catch (e) { console.error(e); }
}

// ============================================================
// MES EMPRUNTS (utilisateur)
// ============================================================
async function chargerMesEmprunts() {
    const contentArea = document.getElementById('contentArea');
    try {
        const res = await fetch('/api/emprunts');
        const emprunts = await res.json();
        const mesEmprunts = emprunts.filter(e => e.utilisateurId === currentUser.id);

        contentArea.innerHTML = `
            ${mesEmprunts.length > 0 ? mesEmprunts.map(e => {
                const enCours = !e.dateRetourEffective;
                const enRetard = enCours && new Date() > new Date(e.dateRetourPrevue);
                return `
                    <div class="emprunt-card">
                        <div class="emprunt-card-info">
                            <h4>${e.titreLivre}</h4>
                            <p class="meta">Emprunte le ${formaterDate(e.dateEmprunt)} &mdash; Retour prevu : ${formaterDate(e.dateRetourPrevue)}</p>
                            ${e.dateRetourEffective ? `<span class="badge badge-success">Retourne le ${formaterDate(e.dateRetourEffective)}</span>` :
                              enRetard ? '<span class="badge badge-danger">En retard</span>' :
                              '<span class="badge badge-info">En cours</span>'}
                        </div>
                        ${enCours ? `<button class="btn btn-outline btn-sm" onclick="signalerRetour(${e.id})"><i class="fas fa-undo-alt"></i> Signaler retour</button>` : ''}
                    </div>
                `;
            }).join('') : '<div class="empty-state"><i class="fas fa-book"></i><p>Aucun emprunt. Faites une demande depuis le catalogue.</p></div>'}
        `;
    } catch (e) { console.error(e); }
}

async function signalerRetour(empruntId) {
    if (!confirm('Signaler le retour de ce livre ? L\'administrateur confirmera le retour.')) return;
    try {
        const res = await fetch(`/api/demandes/signaler-retour/${empruntId}`, { method: 'POST' });
        if (res.ok) { afficherToast('Demande de retour envoyee !', 'success'); chargerMesEmprunts(); }
        else { const err = await res.json(); afficherToast(err.erreur || 'Erreur', 'error'); }
    } catch (e) { afficherToast('Erreur serveur', 'error'); }
}

// ============================================================
// UTILITAIRES
// ============================================================
function afficherDateDuJour() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = new Date().toLocaleDateString('fr-FR', options);
}

function formaterDate(dateStr) {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function ouvrirModal() {
    modalOverlay.classList.add('active');
}

function fermerModal() {
    modalOverlay.classList.remove('active');
}

function configurerModal() {
    modalClose.addEventListener('click', fermerModal);
    modalOverlay.addEventListener('click', (e) => { if (e.target === modalOverlay) fermerModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') { fermerModal(); fermerAuth(); } });
}

function configurerMenuMobile() {
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
}

function toggleMobileMenu() {
    document.getElementById('navLinks').classList.toggle('active');
}

function afficherToast(message, type = 'success') {
    const toastEl = document.getElementById('toast');
    const icon = toastEl.querySelector('.toast-icon');
    toastMessage.textContent = message;
    toastEl.className = 'toast show ' + type;
    icon.className = 'toast-icon fas ' + (type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle');
    setTimeout(() => { toastEl.classList.remove('show'); }, 4000);
}
