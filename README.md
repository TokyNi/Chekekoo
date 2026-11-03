# Checkeko

Application web de vérification de la fiabilité des informations.

Checkeko permet de rechercher des évaluations éditoriales d'une affirmation, de comparer les sources retournées et de retrouver les analyses précédentes. Les résultats restent « Non vérifiable » en l'absence de preuves convergentes. Aucun score numérique n'est affiché lorsqu'aucun score calibré n'est fourni par le service.

## Architecture

```
checkeko/
├── frontend/          React + TypeScript + Vite + Tailwind CSS + Recharts
└── backend/           FastAPI + Pydantic (Clean Architecture)
    └── app/
        ├── api/       Contrôleurs HTTP et schémas Pydantic
        ├── application/  Cas d’usage
        ├── domain/    Entités et contrats de dépôts
        └── infrastructure/  Fournisseur Google Fact Check et dépôt SQLite
```

- Frontend : `http://localhost:5173`
- Backend : `http://localhost:8000`
- Endpoints : `POST /api/v1/verifications`, `GET /api/v1/verifications` et `GET /api/v1/verifications/{id}`

## Prérequis

- Node.js 20+
- Python 3.11+

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

La documentation interactive est disponible sur `http://localhost:8000/docs`.

Pour activer les recherches réelles, configurez `FACT_CHECK_API_KEY` dans `backend/.env` avec une clé Google Fact Check Tools API. Lorsque cette option est activée, le contenu soumis est envoyé à cette API. Sans clé, l'application enregistre l'analyse et renvoie « Non vérifiable » sans fabriquer de source ou de score.

L'historique est conservé dans le fichier SQLite `checkeko.db` (ou dans le chemin défini par `DATABASE_PATH`).

Exemple d’appel :

```bash
curl -X POST http://localhost:8000/api/v1/verifications \
  -H "Content-Type: application/json" \
  -d '{"content":"La terre est plate.","source_url":"https://example.com"}'
```

## Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Ouvrir `http://localhost:5173`.

La variable `VITE_API_URL` doit pointer vers l’API (`http://localhost:8000` par défaut). Le backend autorise les origines `http://localhost:5173` et `http://127.0.0.1:5173`.

Le tableau de bord est accessible à `/dashboard/{id}` et présente les évaluations, preuves et arguments effectivement retournés par l'API.
