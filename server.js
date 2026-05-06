const express = require('express');
const path = require('path');
const fs = require('fs');

const livresRoutes = require('./routes/livres');
const empruntsRoutes = require('./routes/emprunts');
const retoursRoutes = require('./routes/retours');
const amendesRoutes = require('./routes/amendes');
const authRoutes = require('./routes/auth');
const demandesRoutes = require('./routes/demandes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- Data file ---
const dataFilePath = path.join(__dirname, 'data', 'bibliotheque.json');

const initialData = {
    livres: [
        {
            id: 1,
            titre: "Le Petit Prince",
            auteur: "Antoine de Saint-Exupery",
            isbn: "978-2-07-040850-4",
            annee: 1943,
            genre: "Conte",
            disponible: true,
            image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop"
        },
        {
            id: 2,
            titre: "Les Miserables",
            auteur: "Victor Hugo",
            isbn: "978-2-07-040951-8",
            annee: 1862,
            genre: "Roman",
            disponible: true,
            image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop"
        },
        {
            id: 3,
            titre: "L'Etranger",
            auteur: "Albert Camus",
            isbn: "978-2-07-036024-8",
            annee: 1942,
            genre: "Roman",
            disponible: true,
            image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop"
        },
        {
            id: 4,
            titre: "Germinal",
            auteur: "Emile Zola",
            isbn: "978-2-07-040930-3",
            annee: 1885,
            genre: "Roman",
            disponible: true,
            image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop"
        },
        {
            id: 5,
            titre: "Le Comte de Monte-Cristo",
            auteur: "Alexandre Dumas",
            isbn: "978-2-07-040298-4",
            annee: 1844,
            genre: "Roman d'aventure",
            disponible: true,
            image: "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop"
        }
    ],
    emprunts: [],
    amendes: [],
    utilisateurs: [
        {
            id: 1,
            nom: "Administrateur",
            email: "admin@bibliotech.fr",
            motDePasse: "admin123",
            role: "admin"
        }
    ],
    demandes: []
};

if (!fs.existsSync(dataFilePath)) {
    fs.writeFileSync(dataFilePath, JSON.stringify(initialData, null, 2));
    console.log('Fichier de donnees cree.');
} else {
    const donnees = JSON.parse(fs.readFileSync(dataFilePath, 'utf-8'));
    let modified = false;
    if (!donnees.utilisateurs) {
        donnees.utilisateurs = initialData.utilisateurs;
        modified = true;
    }
    if (!donnees.demandes) {
        donnees.demandes = [];
        modified = true;
    }
    donnees.livres.forEach(l => {
        if (!l.image) {
            l.image = "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop";
            modified = true;
        }
    });
    if (modified) {
        fs.writeFileSync(dataFilePath, JSON.stringify(donnees, null, 2));
    }
}

function lireDonnees() {
    const contenu = fs.readFileSync(dataFilePath, 'utf-8');
    return JSON.parse(contenu);
}

function sauvegarderDonnees(donnees) {
    fs.writeFileSync(dataFilePath, JSON.stringify(donnees, null, 2));
}

app.locals.lireDonnees = lireDonnees;
app.locals.sauvegarderDonnees = sauvegarderDonnees;

app.use('/api/livres', livresRoutes);
app.use('/api/emprunts', empruntsRoutes);
app.use('/api/retours', retoursRoutes);
app.use('/api/amendes', amendesRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/demandes', demandesRoutes);

app.get('/api/stats', (req, res) => {
    const donnees = lireDonnees();
    const stats = {
        totalLivres: donnees.livres.length,
        livresDisponibles: donnees.livres.filter(l => l.disponible).length,
        livresEmpruntes: donnees.livres.filter(l => !l.disponible).length,
        totalEmprunts: donnees.emprunts.length,
        empruntsEnCours: donnees.emprunts.filter(e => !e.dateRetourEffective).length,
        totalAmendes: donnees.amendes.length,
        montantTotalAmendes: donnees.amendes.reduce((total, a) => total + a.montant, 0),
        demandesEnAttente: (donnees.demandes || []).filter(d => d.statut === 'en_attente').length,
        totalUtilisateurs: (donnees.utilisateurs || []).filter(u => u.role === 'utilisateur').length
    };
    res.json(stats);
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Serveur demarre sur http://localhost:${PORT}`);
});
