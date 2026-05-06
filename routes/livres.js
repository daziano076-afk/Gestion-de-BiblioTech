const express = require('express');
const router = express.Router();

const bookImages = [
    "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1476275466078-4007374efbbe?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1524578271613-d550eacf6090?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=400&h=600&fit=crop",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=400&h=600&fit=crop"
];

router.get('/', (req, res) => {
    const donnees = req.app.locals.lireDonnees();
    res.json(donnees.livres);
});

router.get('/recherche', (req, res) => {
    const terme = req.query.q ? req.query.q.toLowerCase() : '';
    if (!terme) {
        return res.status(400).json({
            erreur: 'Veuillez fournir un terme de recherche avec ?q=votre_recherche'
        });
    }
    const donnees = req.app.locals.lireDonnees();
    const resultats = donnees.livres.filter(livre =>
        livre.titre.toLowerCase().includes(terme) ||
        livre.auteur.toLowerCase().includes(terme) ||
        livre.isbn.toLowerCase().includes(terme) ||
        livre.genre.toLowerCase().includes(terme)
    );
    res.json(resultats);
});

router.get('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const donnees = req.app.locals.lireDonnees();
    const livre = donnees.livres.find(l => l.id === id);
    if (!livre) {
        return res.status(404).json({ erreur: 'Livre non trouve' });
    }
    res.json(livre);
});

router.post('/', (req, res) => {
    const { titre, auteur, isbn, annee, genre } = req.body;
    if (!titre || !auteur || !isbn) {
        return res.status(400).json({
            erreur: 'Les champs titre, auteur et isbn sont obligatoires'
        });
    }

    const donnees = req.app.locals.lireDonnees();

    const isbnExiste = donnees.livres.find(l => l.isbn === isbn);
    if (isbnExiste) {
        return res.status(409).json({ erreur: 'Un livre avec cet ISBN existe deja' });
    }

    const nouvelId = donnees.livres.length > 0
        ? Math.max(...donnees.livres.map(l => l.id)) + 1
        : 1;

    const nouveauLivre = {
        id: nouvelId,
        titre,
        auteur,
        isbn,
        annee: annee || null,
        genre: genre || 'Non classe',
        disponible: true,
        image: bookImages[Math.floor(Math.random() * bookImages.length)]
    };

    donnees.livres.push(nouveauLivre);
    req.app.locals.sauvegarderDonnees(donnees);
    res.status(201).json(nouveauLivre);
});

router.put('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const { titre, auteur, isbn, annee, genre } = req.body;
    const donnees = req.app.locals.lireDonnees();

    const index = donnees.livres.findIndex(l => l.id === id);
    if (index === -1) {
        return res.status(404).json({ erreur: 'Livre non trouve' });
    }

    donnees.livres[index].titre = titre || donnees.livres[index].titre;
    donnees.livres[index].auteur = auteur || donnees.livres[index].auteur;
    donnees.livres[index].isbn = isbn || donnees.livres[index].isbn;
    donnees.livres[index].annee = annee || donnees.livres[index].annee;
    donnees.livres[index].genre = genre || donnees.livres[index].genre;

    req.app.locals.sauvegarderDonnees(donnees);
    res.json(donnees.livres[index]);
});

router.delete('/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const donnees = req.app.locals.lireDonnees();

    const index = donnees.livres.findIndex(l => l.id === id);
    if (index === -1) {
        return res.status(404).json({ erreur: 'Livre non trouve' });
    }
    if (!donnees.livres[index].disponible) {
        return res.status(400).json({
            erreur: 'Impossible de supprimer un livre actuellement emprunte'
        });
    }

    donnees.livres.splice(index, 1);
    req.app.locals.sauvegarderDonnees(donnees);
    res.json({ message: 'Livre supprime avec succes' });
});

module.exports = router;
