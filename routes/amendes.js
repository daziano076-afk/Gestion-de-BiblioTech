// ============================================================
// routes/amendes.js — Routes pour la gestion des amendes simulées
// Ce fichier gère les amendes générées lors des retours en retard.
// Les amendes sont simulées (pas de vrai paiement).
// ============================================================

// Importer le module 'express' pour créer un routeur
const express = require('express');

// Créer un routeur Express pour les routes d'amendes
const router = express.Router();

// ============================================================
// GET /api/amendes — Récupérer toutes les amendes
// ============================================================
// Retourne la liste de toutes les amendes (payées et non payées)
router.get('/', (req, res) => {
    // Lire toutes les données depuis le fichier JSON
    const donnees = req.app.locals.lireDonnees();

    // Pour chaque amende, ajouter les informations du livre associé
    const amendesAvecLivres = donnees.amendes.map(amende => {
        // Chercher le livre correspondant à l'amende
        const livre = donnees.livres.find(l => l.id === amende.livreId);

        // Retourner l'amende enrichie avec les infos du livre
        return {
            ...amende,                                          // Copier toutes les propriétés de l'amende
            titreLivre: livre ? livre.titre : 'Livre inconnu',  // Ajouter le titre du livre
            auteurLivre: livre ? livre.auteur : 'Auteur inconnu'// Ajouter l'auteur du livre
        };
    });

    // Envoyer la liste des amendes au client
    res.json(amendesAvecLivres);
});

// ============================================================
// PUT /api/amendes/:id/payer — Marquer une amende comme payée
// ============================================================
// Cette route simule le paiement d'une amende.
// ':id' est l'identifiant de l'amende à payer.
router.put('/:id/payer', (req, res) => {
    // Récupérer l'ID de l'amende depuis l'URL
    const id = parseInt(req.params.id);

    // Lire les données actuelles
    const donnees = req.app.locals.lireDonnees();

    // Chercher l'amende dans le tableau des amendes
    const amende = donnees.amendes.find(a => a.id === id);

    // Vérifier que l'amende existe
    if (!amende) {
        // Code 404 = ressource non trouvée
        return res.status(404).json({ erreur: 'Amende non trouvée' });
    }

    // Vérifier que l'amende n'a pas déjà été payée
    if (amende.payee) {
        return res.status(400).json({
            erreur: 'Cette amende a déjà été payée'
        });
    }

    // Marquer l'amende comme payée
    // On met 'payee' à true pour indiquer que le paiement est effectué
    amende.payee = true;

    // Enregistrer la date de paiement
    amende.datePaiement = new Date().toISOString();

    // Sauvegarder les modifications dans le fichier JSON
    req.app.locals.sauvegarderDonnees(donnees);

    // Retourner l'amende mise à jour avec un message de confirmation
    res.json({
        message: 'Amende payée avec succès (simulation)',
        amende: amende
    });
});

// ============================================================
// GET /api/amendes/stats — Statistiques des amendes
// ============================================================
// Retourne un résumé des amendes (total, payées, impayées, montants)
router.get('/stats', (req, res) => {
    // Lire les données actuelles
    const donnees = req.app.locals.lireDonnees();

    // Calculer les statistiques des amendes
    const stats = {
        // Nombre total d'amendes
        totalAmendes: donnees.amendes.length,

        // Nombre d'amendes payées
        // '.filter()' crée un tableau des amendes où payee === true
        amendesPayees: donnees.amendes.filter(a => a.payee).length,

        // Nombre d'amendes non payées (en attente)
        amendesImpayees: donnees.amendes.filter(a => !a.payee).length,

        // Montant total de toutes les amendes
        // '.reduce()' parcourt le tableau et accumule les montants
        // 'total' est l'accumulateur, 'a' est l'amende courante
        // '0' est la valeur initiale de l'accumulateur
        montantTotal: donnees.amendes.reduce((total, a) => total + a.montant, 0),

        // Montant total des amendes payées
        montantPaye: donnees.amendes
            .filter(a => a.payee)
            .reduce((total, a) => total + a.montant, 0),

        // Montant total des amendes impayées
        montantImpaye: donnees.amendes
            .filter(a => !a.payee)
            .reduce((total, a) => total + a.montant, 0)
    };

    // Envoyer les statistiques au client
    res.json(stats);
});

// ============================================================
// Exporter le routeur pour qu'il soit utilisable dans server.js
// ============================================================
module.exports = router;
