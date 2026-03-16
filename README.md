# DOME : Domain Observation & Malicious Entity

## Using Threat Intelligence Fusion and Domain Generation Features

A cybersecurity research prototype that detects malicious domains (phishing, DGA, malware) using machine learning models and threat intelligence feeds.

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Backend   | Python, FastAPI, TensorFlow, Scikit-learn, XGBoost |
| Frontend  | React, TailwindCSS, Recharts       |
| Models    | Bi-LSTM, Random Forest, XGBoost    |
| Infra     | Docker, Docker Compose             |


### Instructions to run

```bash
pip install -r backend/requirements.txt
python scripts/collect_data.py
python scripts/clean_dataset.py
python scripts/feature_extraction.py
python scripts/train_model.py
```

### Start with Docker

```bash
docker compose up --build
```
Open the dashboard at **http://localhost:3000**

### Running locally without Docker

**Backend:**
```bash
cd malicious-domain-detector
uvicorn backend.api.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Models

| Model          | Architecture                          |
|----------------|---------------------------------------|
| **LSTM**       | Embedding → Bi-LSTM → Dense → Sigmoid |
| **Random Forest** | 200 estimators, max depth 20       |
| **XGBoost**    | 200 estimators, max depth 8           |

### Features Extracted

**Lexical Features:**
- Domain length, digit count, hyphen count
- Shannon entropy, vowel/consonant ratio
- Bigram/trigram uniqueness

**Threat Intelligence Features:**
- TLD risk score
- Blacklist score
- Phishing report count


## Dashboard Pages

| Page                | Description                                   |
|---------------------|-----------------------------------------------|
| **Dashboard**       | Overview stats, detection trends, TLD charts  |
| **Domain Analyzer** | Single domain analysis with feature breakdown |
| **Batch Scanner**   | CSV upload, bulk prediction, export results   |
| **Threat Intel**    | Feed distribution, entropy analysis           |
| **Model Performance** | Metrics, ROC curves, confusion matrices    |
