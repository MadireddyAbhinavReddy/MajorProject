# Clarity.AI — Indian Environmental Policy Chatbot

## What is this chatbot?

Clarity.AI is a RAG (Retrieval-Augmented Generation) policy assistant that answers questions about Indian environmental law, pollution norms, industry compliance, waste management rules, and climate data. It is grounded entirely in official government documents — it does not hallucinate or use general internet knowledge.

**Target users:**
- Regular citizens wanting to understand air quality, health risks, or what GRAP means
- Companies and industries checking compliance obligations, consent requirements, and penalty exposure
- Lawyers and policymakers looking up specific sections, standards, or EC calculations

**Tone the frontend should reflect:** Authoritative but accessible. Think "expert librarian" — precise, cites its sources, never guesses.

---

## API

The backend runs on `http://localhost:8000`

### POST `/chat`

**Request**
```json
{ "query": "What is the penalty for not filing annual returns under EPR?" }
```

**Response**
```json
{
  "answer": "According to the CPCB guidelines (Page 29)...",
  "sources": ["cpcb_penalty_norms_2024.pdf (Pages: [29, 30])"]
}
```

- `answer` — markdown-formatted string, may contain tables, bullet points, quoted numbers
- `sources` — array of strings, each is `"filename.pdf (Pages: [x, y])"` — use these to show source tags in the UI

---

## What the chatbot can answer

### Core Laws
Questions about the foundational legal framework — what powers the government has, what constitutes an offence, what the penalties are under the parent acts.

- Environment (Protection) Act, 1986
- Air (Prevention & Control of Pollution) Act, 1981
- Water (Prevention & Control of Pollution) Act, 1974
- National Green Tribunal Act, 2010
- Forest Conservation Act, 1980

### Air Quality Standards & Pollution
Specific pollutant limits, AQI levels, city rankings, emergency action triggers.

- NAAQS — legal limits for SO₂, NO₂, PM10, PM2.5, O₃, CO, Pb, Benzene, etc.
- GRAP Delhi-NCR (Nov 2025) — Stage I/II/III/IV emergency measures
- NCAP framework, revised targets, and 2026 progress report
- Industry classification (Red/Orange/Green/White categories)
- Stubble burning action plan (Punjab 2026-27)

### Penalties & Compensation
Specific fine amounts, day-wise EC slabs, EPR violation penalties.

- CPCB EC guidelines for industries (2017) — Category-wise day-by-day compensation slabs
- CPCB penalty norms for Plastic Waste Management Rules violations (2024)
- Consent fee structure — CF = CI × SF × PIF formula with full tables

### Consent & Compliance
How industries get and maintain their legal right to operate.

- Air Pollution Consent Guidelines 2025 — CTE/CTO timelines (Red: 60/90/90 days, Orange: 45/60/60, Green: 30/30/30), validity periods, fee formula
- CPCB Consent SOP 2026 — inspection frequencies, grievance redressal, UCAMS portal
- EIA Notification 2006 + 2020 amendment
- Coastal Regulation Zone Notification 2019

### Waste Management
Rules, obligations, and penalties across all waste categories.

- Plastic Waste Management Rules 2016 + amendments (2022, 2024)
- Solid Waste Management Rules 2026
- E-Waste Management Rules 2022
- Hazardous & Other Wastes Rules 2016
- Bio-Medical Waste Management Rules 2016
- Construction & Demolition Waste Rules 2016
- MSW Landfill guidelines (CPCB)

### Health
Health impacts of pollution, climate-sensitive diseases, protective guidelines.

- NPCCHH — National Action Plan on Climate Change & Human Health
- CPCB India AQI Health Advisory

### Climate
Scientific climate data and projections for India.

- MoES Assessment of Climate Change over the Indian Region (2026)

---

## What the chatbot cannot answer

- Questions about specific companies, court cases, or state-level rules not in the knowledge base
- Real-time AQI data (it knows the standards, not live readings)
- Anything outside Indian environmental law (no global treaties, no other countries)
- Legal advice — it explains what the law says, not what you should do

---

## Architecture

```
POST /chat  { query }
      ↓
  Stage 1a — File Selection (Groq LLM)
    Tiny prompt: all doc names + page 1 keyword → picks 1-2 relevant files
      ↓
  Stage 1b — Page Selection (Groq LLM)
    Full hints of selected docs only → picks 3-5 relevant pages
      ↓
  Stage 2 — Extraction
    Reads exact page text from ./storage/*.md using regex page markers
      ↓
  Stage 3 — Expert Answer (Groq LLM)
    Answers with context, quotes specific numbers and page references
      ↓
  Returns { answer: string, sources: string[] }
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| LLM | Groq API — `llama-3.1-8b-instant` |
| PDF parsing | Docling (primary), PyMuPDF (fallback) |
| Chunking | semchunk 4.0.0 (cl100k_base, 600 tokens) |
| Backend | FastAPI + Uvicorn (port 8000) |
| Env | python-dotenv |

---

## Running the Backend

```bash
pip install -r requirements.txt

# .env
GROQ_API_KEY=your_key_here

python ingestion.py   # one-time, or when adding new PDFs
python main.py        # starts API on http://localhost:8000
```

---

## Knowledge Base Folder Structure

```
data/
├── core_laws/
│   ├── environment_protection_act_1986.pdf
│   ├── air_prevention_control_pollution_act_1981.pdf
│   ├── water_prevention_control_pollution_act_1974.pdf
│   ├── national_green_tribunal_act_2010.pdf
│   └── forest_conservation_act_1980.pdf
│
├── standards/
│   ├── naaqs-Air_Quality_Standards.pdf
│   ├── national_water_quality_standards_cpcb.pdf
│   ├── effluent_discharge_standards_cpcb.pdf
│   └── noise_pollution_rules_2000.pdf
│
├── pollution/
│   ├── industry_classification_2016.pdf
│   ├── grap_delhi_nov_2025.pdf
│   ├── ncap_framework_original.pdf
│   ├── ncap_2026_revised_targets.pdf
│   ├── ncap_progress_report_2026.pdf
│   └── stubble_burning_action_plan_2026.pdf
│
├── penalties/
│   ├── cpcb_ec_guidelines_industries_2017.pdf
│   ├── cpcb_penalty_norms_2024.pdf
│   ├── cpcb_consent_sop_2026.pdf
│   └── air_pollution_consent_guidelines_2025.pdf
│
├── compliance/
│   ├── eia_notification_2006.pdf
│   ├── eia_amendment_2020.pdf
│   └── coastal_regulation_zone_notification_2019.pdf
│
├── waste/
│   ├── plastic_waste_management_rules_2016.pdf
│   ├── plastic_waste_amendment_2024.pdf
│   ├── swm_rules_2026_notification.pdf
│   ├── landfill_fire_mitigation_cpcb.pdf
│   ├── hazardous_waste_management_rules_2016.pdf
│   ├── biomedical_waste_management_rules_2016.pdf
│   ├── construction_demolition_waste_rules_2016.pdf
│   └── e_waste_management_rules_2022.pdf
│
├── health/
│   ├── npcchh_health_guidelines.pdf
│   └── india_aqi_health_advisory_cpcb.pdf
│
└── climate/
    └── moes_climate_assessment_2026.pdf
```



Then test with these questions, ordered from simple to hard — they cover every category and will expose any routing or extraction issues:

Air Quality & Standards

"What is the permissible annual limit for PM2.5 in India?"
"What are the GRAP Stage III restrictions for Delhi-NCR?"
Industry & Consent

"What is the validity period of Consent to Operate for a Red category industry?"
"How is the annual consent fee calculated for an Orange category industry?"
"What documents are required to apply for Consent to Establish?"
Penalties — the ones that were failing before

"What is the Environmental Compensation for a Category III industry on its second day of non-compliance?"
"What is the penalty for not filing annual returns under EPR for plastic waste?"
Waste Management

"What are the obligations of a Producer under the Plastic Waste Management Rules?"
"What are the rules for e-waste disposal for bulk consumers?"
Legal / Core Laws

"What powers does the Central Government have under the Environment Protection Act 1986?"
"Under what conditions can the NGT take suo motu cognizance?"
EIA / Compliance

"Which industries require mandatory Environmental Impact Assessment before setting up?"
Health

"What health precautions should someone with heart disease take on a Very Poor AQI day?"
For each response check three things:

Is the answer factually specific (has numbers, section references, not vague)?
Does the source tag show the right file and reasonable page numbers?
Is there no None in the pages list?
If any question returns "This specific information is not mentioned in the provided pages" — tell me which one and I'll debug the routing for that doc.