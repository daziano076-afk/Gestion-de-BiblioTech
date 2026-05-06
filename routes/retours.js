// ============================================================
// routes/retours.js — Routes pour la gestion des retours
// Ce fichier gère le retour des livres empruntés.
// Quand un livre est rendu, on met à jour l'emprunt et on
// vérifie s'il y a un retard pour générer une amende.
// ============================================================

// Importer le module 'express' pour créer un routeur
const express = require('express');

// Créer un routeur Express pour les routes de retours
const router = express.Router();

// ============================================================
// POST /api/retours/:empruntId — Enregistrer le retour d'un livre
// ============================================================
// ':empruntId' est l'identifiant de l'emprunt à clôturer.
// Cette route marque le livre comme rendu et vérifie les retards.
router.post('/:empruntId', (req, res) => {
    // Récupérer l'ID de l'emprunt depuis les paramètres de l'URL
    const empruntId = parseInt(req.params.empruntId);

    // Lire toutes les données actuelles
    const donnees = req.app.locals.lireDonnees();

    // Chercher l'emprunt correspondant dans le tableau des emprunts
    const emprunt = donnees.emprunts.find(e => e.id === empruntId);

    // Vérifier que l'emprunt existe
    if (!emprunt) {
        // Code 404 = ressource non trouvée
        return res.status(404).json({ erreur: 'Emprunt non trouvé' });
    }

    // Vérifier que le livre n'a pas déjà été retourné
    // Si 'dateRetourEffective' existe déjà, le retour a déjà été fait
    if (emprunt.dateRetourEffective) {
        return res.status(400).json({
            erreur: 'Ce livre a déjà été retourné'
        });
    }

    // --- Enregistrer la date du retour ---

    // Créer la date actuelle (moment du retour)
    const dateRetour = new Date();

    // Enregistrer la date de retour effective dans l'emprunt
    // '.toISOString()' convertit la date en format standard international
    // Exemple : "2024-03-15T14:30:00.000Z"
    emprunt.dateRetourEffective = dateRetour.toISOString();

    // --- Vérifier s'il y a un retard ---

    // Convertir la date de retour prévue (stockée en texte) en objet Date
    const dateRetourPrevue = new Date(emprunt.dateRetourPrevue);

    // Calculer le nombre de jours de retard
    // (dateRetour - dateRetourPrevue) donne la différence en millisecondes
    // On divise par (1000 * 60 * 60 * 24) pour convertir en jours
    // 1000 ms = 1 seconde, 60 secondes = 1 minute,
    // 60 minutes = 1 heure, 24 heures = 1 jour
    const differenceMs = dateRetour - dateRetourPrevue;
    const joursRetard = Math.ceil(differenceMs / (1000 * 60 * 60 * 24));

    // Variable pour stocker l'amende si nécessaire
    let amende = null;

    // Si le nombre de jours est positif, il y a du retard
    if (joursRetard > 0) {
        // Marquer l'emprunt comme en retard
        emprunt.enRetard = true;

        // --- Calculer l'amende ---
        // Tarif : 0.50€ par jour de retard (tarif simulé)
        const tarifParJour = 0.50;
        // Montant total = nombre de jours × tarif par jour
        // 'parseFloat' et 'toFixed(2)' assurent 2 décimales (ex: 3.50)
        const montant = parseFloat((joursRetard * tarifParJour).toFixed(2));

        // Générer un nouvel ID pour l'amende
        const amendeId = donnees.amendes.length > 0
            ? Math.max(...donnees.amendes.map(a => a.id)) + 1
            : 1;

        // Créer l'objet amende
        amende = {
            id: amendeId,                                 // ID unique de l'amende
            empruntId: empruntId,                         // ID de l'emprunt concerné
            livreId: emprunt.livreId,                     // ID du livre concerné
            emprunteur: emprunt.emprunteur,               // Nom de l'emprunteur
            joursRetard: joursRetard,                     // Nombre de jours de retard
            tarifParJour: tarifParJour,                   // Tarif par jour (0.50€)
            montant: montant,                             // Montant total de l'amende
            dateCreation: dateRetour.toISOString(),       // Date de création de l'amende
            payee: false                                  // false = amende non payée
        };

        // Ajouter l'amende au tableau des amendes
        donnees.amendes.push(amende);
    }

    // --- Remettre le livre en disponible ---

    // Chercher le livre dans la bibliothèque
    const livre = donnees.livres.find(l => l.id === emprunt.livreId);

    // Si le livre existe, le marquer comme disponible
    if (livre) {
        livre.disponible = true;
    }

    // Sauvegarder toutes les modifications dans le fichier JSON
    req.app.locals.sauvegarderDonnees(donnees);

    // Construire la réponse à envoyer au client
    const reponse = {
        message: 'Livre retourné avec succès',            // Message de confirmation
        emprunt: emprunt,                                 // Détails de l'emprunt mis à jour
        enRetard: joursRetard > 0,                        // Indique s'il y a du retard
        joursRetard: joursRetard > 0 ? joursRetard : 0,   // Nombre de jours de retard
        amende: amende                                    // Détails de l'amende (ou null)
    };

    // Envoyer la réponse au client
    res.json(reponse);
});

// ============================================================
// Exporter le routeur pour qu'il soit utilisable dans server.js
// ============================================================
module.exports = router;
