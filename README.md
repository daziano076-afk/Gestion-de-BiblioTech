# BiblioTech - Gestion de Bibliothèque

Application web de gestion de bibliothèque développée en JavaScript (Node.js + Express.js).
Permet de gérer les livres, les emprunts, les retours et les amendes d'une bibliothèque.

## Fonctionnalités

- **Gestion des Livres** : Ajouter, modifier, supprimer et rechercher des livres
- **Gestion des Emprunts** : Enregistrer les emprunts de livres avec durée personnalisable
- **Gestion des Retours** : Enregistrer le retour des livres avec détection automatique des retards
- **Amendes** : Calcul automatique des amendes en cas de retard
- **Tableau de Bord** : Vue d'ensemble avec statistiques en temps réel

## Technologies utilisées

| Technologie | Rôle |
|------------|------|
| **Node.js** | Environnement d'exécution JavaScript côté serveur |
| **Express.js** | Framework web pour créer le serveur HTTP et les routes API |
| **HTML5** | Structure des pages web |
| **CSS3** | Design et mise en page responsive |
| **JavaScript (Vanilla)** | Logique côté client |
| **JSON** | Stockage des données (`data/bibliotheque.json`) |

## Installation et lancement

### Prérequis
- [Node.js](https://nodejs.org/) version 14 ou supérieure

### Étapes

```bash
npm install
npm start
```

### Accéder à l'application
Ouvrir un navigateur et aller sur : **http://localhost:3000**

## API Endpoints

### Livres
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/livres` | Récupérer tous les livres |
| GET | `/api/livres/:id` | Récupérer un livre par ID |
| GET | `/api/livres/recherche?q=terme` | Rechercher des livres |
| POST | `/api/livres` | Ajouter un nouveau livre |
| PUT | `/api/livres/:id` | Modifier un livre |
| DELETE | `/api/livres/:id` | Supprimer un livre |

### Emprunts
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/emprunts` | Récupérer tous les emprunts |
| GET | `/api/emprunts/en-cours` | Récupérer les emprunts en cours |
| POST | `/api/emprunts` | Créer un nouvel emprunt |

### Retours
| Méthode | URL | Description |
|---------|-----|-------------|
| POST | `/api/retours/:empruntId` | Enregistrer un retour |

### Amendes
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/amendes` | Récupérer toutes les amendes |
| GET | `/api/amendes/stats` | Statistiques des amendes |
| PUT | `/api/amendes/:id/payer` | Payer une amende |

### Statistiques
| Méthode | URL | Description |
|---------|-----|-------------|
| GET | `/api/stats` | Statistiques générales |
