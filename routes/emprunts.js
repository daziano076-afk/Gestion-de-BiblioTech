// ============================================================
// routes/emprunts.js — Routes pour la gestion des emprunts
// Ce fichier contient toutes les routes API liées aux emprunts :
// créer un emprunt, lister les emprunts en cours et l'historique.
// ============================================================

// Importer le module 'express' pour créer un routeur
const express = require('express');

// Créer un routeur Express pour les routes d'emprunts
const router = express.Router();

// ============================================================
// GET /api/emprunts — Récupérer tous les emprunts
// ============================================================
// Retourne la liste de tous les emprunts (en cours et terminés)
router.get('/', (req, res) => {
    // Lire toutes les données depuis le fichier JSON
    const donnees = req.app.locals.lireDonnees();

    // Pour chaque emprunt, on ajoute les informations du livre associé
    // Cela évite au client de faire une 2ème requête pour obtenir
    // les détails du livre
    const empruntsAvecLivres = donnees.emprunts.map(emprunt => {
        // Chercher le livre correspondant à l'emprunt via son ID
        const livre = donnees.livres.find(l => l.id === emprunt.livreId);

        // Retourner l'emprunt enrichi avec le titre et l'auteur du livre
        // '...emprunt' copie toutes les propriétés de l'emprunt
        // (opérateur spread/décomposition)
        return {
            ...emprunt,
            // Ajouter le titre du livre (ou 'Inconnu' si le livre n'existe plus)
            titreLivre: livre ? livre.titre : 'Livre inconnu',
            // Ajouter l'auteur du livre
            auteurLivre: livre ? livre.auteur : 'Auteur inconnu'
        };
    });

    // Envoyer la liste des emprunts enrichis au client
    res.json(empruntsAvecLivres);
});

// ============================================================
// GET /api/emprunts/en-cours — Récupérer uniquement les emprunts en cours
// ============================================================
// Retourne uniquement les emprunts qui n'ont pas encore été retournés
router.get('/en-cours', (req, res) => {
    // Lire toutes les données
    const donnees = req.app.locals.lireDonnees();

    // Filtrer pour ne garder que les emprunts sans date de retour effective
    // (ce qui signifie que le livre n'a pas encore été rendu)
    const empruntsEnCours = donnees.emprunts
        .filter(e => !e.dateRetourEffective) // Garder ceux sans retour
        .map(emprunt => {
            // Enrichir chaque emprunt avec les infos du livre
            const livre = donnees.livres.find(l => l.id === emprunt.livreId);
            return {
                ...emprunt,
                titreLivre: livre ? livre.titre : 'Livre inconnu',
                auteurLivre: livre ? livre.auteur : 'Auteur inconnu'
            };
        });

    // Envoyer les emprunts en cours
    res.json(empruntsEnCours);
});

// ============================================================
// POST /api/emprunts — Créer un nouvel emprunt
// ============================================================
// Cette route enregistre un nouvel emprunt de livre.
// Le client doit fournir l'ID du livre et le nom de l'emprunteur.
router.post('/', (req, res) => {
    // Extraire les données de l'emprunt depuis le corps de la requête
    // 'livreId' : l'identifiant du livre à emprunter
    // 'emprunteur' : le nom de la personne qui emprunte
    // 'dureeJours' : la durée de l'emprunt en jours (par défaut 14 jours)
    const { livreId, emprunteur, dureeJours } = req.body;

    // Vérifier que les champs obligatoires sont remplis
    if (!livreId || !emprunteur) {
        return res.status(400).json({
            erreur: 'Les champs livreId et emprunteur sont obligatoires'
        });
    }

    // Lire les données actuelles
    const donnees = req.app.locals.lireDonnees();

    // Chercher le livre dans la bibliothèque
    const livre = donnees.livres.find(l => l.id === livreId);

    // Vérifier que le livre existe
    if (!livre) {
        return res.status(404).json({ erreur: 'Livre non trouvé' });
    }

    // Vérifier que le livre est disponible (pas déjà emprunté)
    if (!livre.disponible) {
        return res.status(400).json({
            erreur: 'Ce livre est déjà emprunté par quelqu\'un d\'autre'
        });
    }

    // --- Créer les dates de l'emprunt ---

    // Date d'aujourd'hui (date de l'emprunt)
    const dateEmprunt = new Date();

    // Calculer la date de retour prévue
    // Par défaut, l'emprunt dure 14 jours (2 semaines)
    const duree = dureeJours || 14;
    const dateRetourPrevue = new Date();
    // Ajouter le nombre de jours à la date actuelle
    // 'getDate()' retourne le jour du mois (1-31)
    // 'setDate()' modifie le jour du mois
    dateRetourPrevue.setDate(dateRetourPrevue.getDate() + duree);

    // Générer un nouvel ID unique pour l'emprunt
    const nouvelId = donnees.emprunts.length > 0
        ? Math.max(...donnees.emprunts.map(e => e.id)) + 1
        : 1;

    // Créer l'objet emprunt
    const nouvelEmprunt = {
        id: nouvelId,                                    // ID unique de l'emprunt
        livreId: livreId,                                // ID du livre emprunté
        emprunteur: emprunteur,                          // Nom de l'emprunteur
        dateEmprunt: dateEmprunt.toISOString(),          // Date de l'emprunt (format ISO)
        dateRetourPrevue: dateRetourPrevue.toISOString(),// Date de retour prévue
        dateRetourEffective: null,                       // null = pas encore retourné
        enRetard: false                                  // false par défaut
    };

    // Marquer le livre comme non disponible (emprunté)
    livre.disponible = false;

    // Ajouter l'emprunt au tableau des emprunts
    donnees.emprunts.push(nouvelEmprunt);

    // Sauvegarder toutes les modifications dans le fichier
    req.app.locals.sauvegarderDonnees(donnees);

    // Retourner l'emprunt créé avec les infos du livre
    res.status(201).json({
        ...nouvelEmprunt,
        titreLivre: livre.titre,
        auteurLivre: livre.auteur
    });
});

// ============================================================
// Exporter le routeur pour qu'il soit utilisable dans server.js
// ============================================================
module.exports = router;
