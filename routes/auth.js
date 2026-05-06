const express = require('express');
const router = express.Router();

// POST /api/auth/inscription
router.post('/inscription', (req, res) => {
    const { nom, email, motDePasse } = req.body;

    if (!nom || !email || !motDePasse) {
        return res.status(400).json({ erreur: 'Tous les champs sont obligatoires' });
    }

    const donnees = req.app.locals.lireDonnees();

    const emailExiste = donnees.utilisateurs.find(u => u.email === email);
    if (emailExiste) {
        return res.status(409).json({ erreur: 'Un compte avec cet email existe deja' });
    }

    const nouvelId = donnees.utilisateurs.length > 0
        ? Math.max(...donnees.utilisateurs.map(u => u.id)) + 1
        : 1;

    const nouvelUtilisateur = {
        id: nouvelId,
        nom,
        email,
        motDePasse,
        role: 'utilisateur',
        dateInscription: new Date().toISOString()
    };

    donnees.utilisateurs.push(nouvelUtilisateur);
    req.app.locals.sauvegarderDonnees(donnees);

    const { motDePasse: _, ...utilisateurSansMotDePasse } = nouvelUtilisateur;
    res.status(201).json(utilisateurSansMotDePasse);
});

// POST /api/auth/connexion
router.post('/connexion', (req, res) => {
    const { email, motDePasse } = req.body;

    if (!email || !motDePasse) {
        return res.status(400).json({ erreur: 'Email et mot de passe requis' });
    }

    const donnees = req.app.locals.lireDonnees();

    const utilisateur = donnees.utilisateurs.find(
        u => u.email === email && u.motDePasse === motDePasse
    );

    if (!utilisateur) {
        return res.status(401).json({ erreur: 'Email ou mot de passe incorrect' });
    }

    const { motDePasse: _, ...utilisateurSansMotDePasse } = utilisateur;
    res.json(utilisateurSansMotDePasse);
});

// GET /api/auth/utilisateurs
router.get('/utilisateurs', (req, res) => {
    const donnees = req.app.locals.lireDonnees();
    const utilisateurs = donnees.utilisateurs.map(u => {
        const { motDePasse, ...reste } = u;
        return reste;
    });
    res.json(utilisateurs);
});

module.exports = router;
