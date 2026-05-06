const express = require('express');
const router = express.Router();

// GET /api/demandes
router.get('/', (req, res) => {
    const donnees = req.app.locals.lireDonnees();
    const demandes = (donnees.demandes || []).map(d => {
        const livre = donnees.livres.find(l => l.id === d.livreId);
        const utilisateur = donnees.utilisateurs.find(u => u.id === d.utilisateurId);
        return {
            ...d,
            titreLivre: livre ? livre.titre : 'Livre inconnu',
            auteurLivre: livre ? livre.auteur : 'Auteur inconnu',
            imageLivre: livre ? livre.image : '',
            nomUtilisateur: utilisateur ? utilisateur.nom : 'Utilisateur inconnu',
            emailUtilisateur: utilisateur ? utilisateur.email : ''
        };
    });
    res.json(demandes);
});

// GET /api/demandes/utilisateur/:userId
router.get('/utilisateur/:userId', (req, res) => {
    const userId = parseInt(req.params.userId);
    const donnees = req.app.locals.lireDonnees();
    const demandes = (donnees.demandes || [])
        .filter(d => d.utilisateurId === userId)
        .map(d => {
            const livre = donnees.livres.find(l => l.id === d.livreId);
            return {
                ...d,
                titreLivre: livre ? livre.titre : 'Livre inconnu',
                auteurLivre: livre ? livre.auteur : 'Auteur inconnu',
                imageLivre: livre ? livre.image : ''
            };
        });
    res.json(demandes);
});

// POST /api/demandes
router.post('/', (req, res) => {
    const { livreId, utilisateurId, dureeJours } = req.body;

    if (!livreId || !utilisateurId) {
        return res.status(400).json({ erreur: 'livreId et utilisateurId sont obligatoires' });
    }

    const donnees = req.app.locals.lireDonnees();

    const livre = donnees.livres.find(l => l.id === livreId);
    if (!livre) {
        return res.status(404).json({ erreur: 'Livre non trouve' });
    }
    if (!livre.disponible) {
        return res.status(400).json({ erreur: 'Ce livre n\'est pas disponible' });
    }

    const utilisateur = donnees.utilisateurs.find(u => u.id === utilisateurId);
    if (!utilisateur) {
        return res.status(404).json({ erreur: 'Utilisateur non trouve' });
    }

    const dejaEnAttente = (donnees.demandes || []).find(
        d => d.livreId === livreId && d.utilisateurId === utilisateurId && d.statut === 'en_attente'
    );
    if (dejaEnAttente) {
        return res.status(400).json({ erreur: 'Vous avez deja une demande en attente pour ce livre' });
    }

    const nouvelId = (donnees.demandes || []).length > 0
        ? Math.max(...donnees.demandes.map(d => d.id)) + 1
        : 1;

    const nouvelleDemande = {
        id: nouvelId,
        livreId,
        utilisateurId,
        dureeJours: dureeJours || 14,
        statut: 'en_attente',
        dateDemande: new Date().toISOString(),
        dateTraitement: null,
        commentaireAdmin: null
    };

    if (!donnees.demandes) donnees.demandes = [];
    donnees.demandes.push(nouvelleDemande);
    req.app.locals.sauvegarderDonnees(donnees);

    res.status(201).json({
        ...nouvelleDemande,
        titreLivre: livre.titre,
        auteurLivre: livre.auteur
    });
});

// PUT /api/demandes/:id/approuver
router.put('/:id/approuver', (req, res) => {
    const id = parseInt(req.params.id);
    const { commentaire } = req.body;
    const donnees = req.app.locals.lireDonnees();

    const demande = (donnees.demandes || []).find(d => d.id === id);
    if (!demande) {
        return res.status(404).json({ erreur: 'Demande non trouvee' });
    }
    if (demande.statut !== 'en_attente') {
        return res.status(400).json({ erreur: 'Cette demande a deja ete traitee' });
    }

    const livre = donnees.livres.find(l => l.id === demande.livreId);
    if (!livre || !livre.disponible) {
        return res.status(400).json({ erreur: 'Livre non disponible' });
    }

    demande.statut = 'approuvee';
    demande.dateTraitement = new Date().toISOString();
    demande.commentaireAdmin = commentaire || null;

    const dateEmprunt = new Date();
    const duree = demande.dureeJours || 14;
    const dateRetourPrevue = new Date();
    dateRetourPrevue.setDate(dateRetourPrevue.getDate() + duree);

    const nouvelEmpruntId = donnees.emprunts.length > 0
        ? Math.max(...donnees.emprunts.map(e => e.id)) + 1
        : 1;

    const utilisateur = donnees.utilisateurs.find(u => u.id === demande.utilisateurId);

    const nouvelEmprunt = {
        id: nouvelEmpruntId,
        livreId: demande.livreId,
        emprunteur: utilisateur ? utilisateur.nom : 'Inconnu',
        utilisateurId: demande.utilisateurId,
        dateEmprunt: dateEmprunt.toISOString(),
        dateRetourPrevue: dateRetourPrevue.toISOString(),
        dateRetourEffective: null,
        enRetard: false
    };

    livre.disponible = false;
    donnees.emprunts.push(nouvelEmprunt);
    req.app.locals.sauvegarderDonnees(donnees);

    res.json({
        message: 'Demande approuvee, emprunt cree',
        demande,
        emprunt: nouvelEmprunt
    });
});

// PUT /api/demandes/:id/refuser
router.put('/:id/refuser', (req, res) => {
    const id = parseInt(req.params.id);
    const { commentaire } = req.body;
    const donnees = req.app.locals.lireDonnees();

    const demande = (donnees.demandes || []).find(d => d.id === id);
    if (!demande) {
        return res.status(404).json({ erreur: 'Demande non trouvee' });
    }
    if (demande.statut !== 'en_attente') {
        return res.status(400).json({ erreur: 'Cette demande a deja ete traitee' });
    }

    demande.statut = 'refusee';
    demande.dateTraitement = new Date().toISOString();
    demande.commentaireAdmin = commentaire || 'Demande refusee';

    req.app.locals.sauvegarderDonnees(donnees);

    res.json({ message: 'Demande refusee', demande });
});

// POST /api/demandes/signaler-retour/:empruntId
router.post('/signaler-retour/:empruntId', (req, res) => {
    const empruntId = parseInt(req.params.empruntId);
    const donnees = req.app.locals.lireDonnees();

    const emprunt = donnees.emprunts.find(e => e.id === empruntId);
    if (!emprunt) {
        return res.status(404).json({ erreur: 'Emprunt non trouve' });
    }
    if (emprunt.dateRetourEffective) {
        return res.status(400).json({ erreur: 'Ce livre a deja ete retourne' });
    }

    const nouvelId = (donnees.demandes || []).length > 0
        ? Math.max(...donnees.demandes.map(d => d.id)) + 1
        : 1;

    const demandeRetour = {
        id: nouvelId,
        livreId: emprunt.livreId,
        utilisateurId: emprunt.utilisateurId,
        empruntId: empruntId,
        type: 'retour',
        statut: 'en_attente',
        dateDemande: new Date().toISOString(),
        dateTraitement: null,
        commentaireAdmin: null
    };

    if (!donnees.demandes) donnees.demandes = [];
    donnees.demandes.push(demandeRetour);
    req.app.locals.sauvegarderDonnees(donnees);

    const livre = donnees.livres.find(l => l.id === emprunt.livreId);
    res.status(201).json({
        message: 'Demande de retour envoyee',
        demande: {
            ...demandeRetour,
            titreLivre: livre ? livre.titre : 'Inconnu'
        }
    });
});

// PUT /api/demandes/:id/confirmer-retour
router.put('/:id/confirmer-retour', (req, res) => {
    const id = parseInt(req.params.id);
    const donnees = req.app.locals.lireDonnees();

    const demande = (donnees.demandes || []).find(d => d.id === id);
    if (!demande || demande.type !== 'retour') {
        return res.status(404).json({ erreur: 'Demande de retour non trouvee' });
    }
    if (demande.statut !== 'en_attente') {
        return res.status(400).json({ erreur: 'Deja traitee' });
    }

    const emprunt = donnees.emprunts.find(e => e.id === demande.empruntId);
    if (!emprunt) {
        return res.status(404).json({ erreur: 'Emprunt non trouve' });
    }

    const dateRetour = new Date();
    emprunt.dateRetourEffective = dateRetour.toISOString();

    const dateRetourPrevue = new Date(emprunt.dateRetourPrevue);
    const differenceMs = dateRetour - dateRetourPrevue;
    const joursRetard = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));

    let amende = null;
    if (joursRetard > 0) {
        emprunt.enRetard = true;
        const tarifParJour = 0.50;
        const montant = parseFloat((joursRetard * tarifParJour).toFixed(2));
        const amendeId = donnees.amendes.length > 0
            ? Math.max(...donnees.amendes.map(a => a.id)) + 1
            : 1;
        amende = {
            id: amendeId,
            empruntId: demande.empruntId,
            livreId: emprunt.livreId,
            emprunteur: emprunt.emprunteur,
            joursRetard,
            tarifParJour,
            montant,
            dateCreation: dateRetour.toISOString(),
            payee: false
        };
        donnees.amendes.push(amende);
    }

    const livre = donnees.livres.find(l => l.id === emprunt.livreId);
    if (livre) livre.disponible = true;

    demande.statut = 'approuvee';
    demande.dateTraitement = new Date().toISOString();

    req.app.locals.sauvegarderDonnees(donnees);

    res.json({
        message: 'Retour confirme',
        emprunt,
        enRetard: joursRetard > 0,
        joursRetard: joursRetard > 0 ? joursRetard : 0,
        amende
    });
});

module.exports = router;
