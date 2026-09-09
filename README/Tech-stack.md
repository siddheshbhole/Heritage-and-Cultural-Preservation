# Ministry of Culture — Heritage & Culture Preservation Platform

This document defines the target technical architecture and technology stack for the platform.

The architecture is layered and modular. The SIH prototype should implement the core architecture first and keep advanced production infrastructure extensible.

---

## Contents

- **Part A — Architecture Overview**
  - 1. Layered Architecture
- **Part B — Experience Layer**
  - 2. Progressive Web App
  - 3. Frontend Stack
  - 4. Frontend Architecture
  - 5. UI Architecture
  - 6. Mobile Application
  - 7. Digital Museum Kiosk
  - 8. Researcher Portal
  - 9. Multilingual Architecture
  - 10. Accessibility Technology
  - 11. Low-Bandwidth Architecture
- **Part C — Application Layer**
  - 12. Application Layer
  - 13. Headless CMS
  - 14. REST and GraphQL APIs
  - 15. Backend Technology
  - 16. API Gateway
  - 17. Authentication and Roles
- **Part D — Intelligence Layer**
  - 18. Search Architecture
  - 19. Search Engine
  - 20. Vector Search
  - 21. Cultural Knowledge Graph
  - 22. OCR / HTR
  - 23. Image Metadata AI
  - 24. Speech and Translation AI
  - 25. RAG Architecture
  - 26. AI Cultural Assistant
  - 27. Recommendation Engine
  - 28. Conservation-Risk Computer Vision
- **Part E — Data Layer**
  - 29. Database (PostgreSQL)
  - 30. PostGIS
  - 31. Object Storage
  - 32. IIIF
  - 33. Metadata Standards
  - 34. Data Sources
  - 35. Data Ingestion
  - 36. Raw Data Storage
  - 37. Provenance
  - 38. Data Governance
- **Part F — Operations Layer**
  - 39. Containerization
  - 40. Kubernetes
  - 41. DevSecOps
  - 42. Security
  - 43. WAF
  - 44. SIEM
  - 45. Monitoring
  - 46. Logging
  - 47. Backup and Disaster Recovery
  - 48. AI Model Monitoring
  - 49. Notifications
  - 50. Analytics
  - 51. Caching
  - 52. Background Workers
  - 53. API and Service Separation
- **Part G — Prototype & Production**
  - 54. Prototype Architecture
  - 55. Prototype Feature Priority
  - 56. Production Architecture
  - 57. Data ↔ Intelligence Dependency
  - 58. Repository Structure
  - 59. Technology Selection and Evolution

---

## Part A — Architecture Overview

### 1. Layered Architecture

The platform consists of five major layers:

```
┌──────────────────────────────────────────────────────────┐
│ EXPERIENCE LAYER                                         │
│ Multilingual PWA • Mobile App • Museum Kiosk             │
│ Researcher Portal • Accessibility • Low Bandwidth        │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ APPLICATION LAYER                                        │
│ Drupal 10 Headless • REST/GraphQL • Authentication       │
│ Moderation • Notifications • Analytics                   │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ INTELLIGENCE LAYER                                       │
│ Semantic Search • Knowledge Graph • OCR/HTR              │
│ Image AI • Translation • RAG • Recommendations           │
│ Conservation Computer Vision                             │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ DATA LAYER                                               │
│ PostgreSQL • PostGIS • Object Storage • IIIF             │
│ JSON-LD • Dublin Core • CIDOC CRM • Search Index         │
│ Data Lake • Provenance • Open Data                       │
└────────────────────────────┬─────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────┐
│ OPERATIONS LAYER                                         │
│ Kubernetes • DevSecOps • WAF/SIEM • Monitoring           │
│ Logging • Backup/DR • AI Model Monitoring                │
└──────────────────────────────────────────────────────────┘
```

---

## Part B — Experience Layer

### 2. Progressive Web App

The primary platform should be a responsive Progressive Web App.

Recommended:

- React
- TypeScript
- Vite or equivalent modern build tooling
- PWA support
- Responsive CSS
- Component-based architecture

The PWA should support:

- Desktop
- Laptop
- Tablet
- Mobile
- Offline/poor-connectivity fallback (where practical)
- Installability
- Responsive interaction

### 3. Frontend Stack

Recommended:

- React
- TypeScript
- Vite
- PWA
- Modern CSS

Potential frontend libraries:

- React Router
- TanStack Query
- Zod
- Accessible component libraries
- Map rendering library
- Charting library (where required)

The final library selection should remain minimal and should not introduce dependencies without a clear purpose.

### 4. Frontend Architecture

Suggested structure:

```
frontend/
├── src/
│   ├── components/
│   ├── layouts/
│   ├── pages/
│   ├── features/
│   │   ├── home/
│   │   ├── heritage/
│   │   ├── culture/
│   │   ├── map/
│   │   ├── offerings/
│   │   ├── documents/
│   │   ├── publications/
│   │   ├── authors/
│   │   ├── mous/
│   │   ├── media/
│   │   ├── events/
│   │   ├── search/
│   │   └── assistant/
│   ├── services/
│   ├── hooks/
│   ├── types/
│   ├── utils/
│   ├── assets/
│   └── styles/
├── public/
└── package.json
```

Each major feature should be modular.

### 5. UI Architecture

The interface contains:

- Home
- Explore Dashboard
- Persistent AI Assistant

- The Home Page contains discovery content.
- The Explore Dashboard contains deeper navigation.
- The AI Assistant is globally available.

The UI should use progressive disclosure so that a large amount of information does not make the interface overwhelming.

### 6. Mobile Application

A dedicated mobile application is part of the long-term architecture.

- The first implementation can use the responsive PWA as the mobile experience.
- A native/hybrid mobile application can be introduced later if required.

Potential technologies:

- React Native
- Flutter

The mobile application should consume the same backend APIs as the web platform.

### 7. Digital Museum Kiosk

The same platform can support museum kiosks.

Kiosk mode should provide:

- Large touch targets
- Full-screen interface
- Simplified navigation
- Visual discovery
- Map exploration
- Heritage timelines
- Museum collection browsing
- Accessibility

The kiosk should use the same content APIs.

### 8. Researcher Portal

The researcher portal provides advanced access to:

- Publications
- Manuscripts
- Archives
- Documents
- Research resources
- Cultural datasets
- Bibliographic information
- Institutional catalogues

The researcher interface can expose advanced filters and metadata.

### 9. Multilingual Architecture

The platform should support multilingual UI and content.

Language architecture should separate:

```
UI Translations
+
Content Translations
+
AI Translation
```

Adding a new language should not require restructuring the application.

### 10. Accessibility Technology

The frontend should follow modern accessibility standards.

Support:

- Semantic HTML
- ARIA (where required)
- Keyboard navigation
- Screen readers
- Focus management
- Accessible forms
- Alternative text
- Captions
- Transcripts
- Reduced motion
- Scalable text

Accessibility should be designed into components rather than added later.

### 11. Low-Bandwidth Architecture

The platform should optimize for unreliable and slow connections.

Techniques:

- Image compression
- Responsive image sizes
- Lazy loading
- Code splitting
- Caching
- Deferred loading
- Minimal autoplay
- Lightweight initial HTML
- Progressive enhancement

The low-bandwidth version should prioritize:

```
TEXT
 ↓
METADATA
 ↓
COMPRESSED MEDIA
 ↓
FULL MEDIA
```

---

## Part C — Application Layer

### 12. Application Layer

The application layer manages:

- Content
- APIs
- Authentication
- Users
- Moderation
- Notifications
- Analytics
- Search requests
- AI requests

### 13. Headless CMS

Drupal 10 is the target headless CMS.

Drupal manages structured content.

Potential content types:

- Heritage Site
- Cultural Practice
- Festival
- Event
- Institution
- Publication
- Author
- Document
- Award
- Scheme
- MoU
- Announcement
- Personality
- Historical Event
- Community Post

The frontend should consume Drupal content through APIs.

Architecture:

```
Drupal 10
   ↓
REST / GraphQL
   ↓
API Layer
   ↓
React PWA
```

### 14. REST and GraphQL APIs

The platform should support API-first architecture.

- REST is appropriate for straightforward resources.
- GraphQL can be used when clients need flexible related data.

Example REST endpoints:

```
GET  /api/heritage
GET  /api/heritage/{id}
GET  /api/states
GET  /api/states/{id}/cities
GET  /api/events
GET  /api/publications
GET  /api/authors
GET  /api/documents
GET  /api/institutions
GET  /api/awards
GET  /api/schemes
GET  /api/mous
GET  /api/search
POST /api/community/posts
POST /api/assistant/query
```

### 15. Backend Technology

Recommended backend language:

- Python

Recommended framework:

- FastAPI

Flask can be used where an existing service or simpler application requires it.

FastAPI is preferred for new services because it provides:

- Type validation
- Automatic API documentation
- Strong Python ecosystem integration
- Async support
- Clear service contracts

### 16. API Gateway

The API layer provides a unified interface between frontend, CMS, databases and intelligent services.

Responsibilities:

- Authentication
- Authorization
- Routing
- Rate limiting
- Request validation
- Response normalization
- Error handling
- Service communication

### 17. Authentication and Roles

Long-term authentication can support:

- Standard user accounts
- Government/SSO integration
- Researcher authentication
- ORCID
- Role-based access

Possible roles:

- PUBLIC USER
- REGISTERED USER
- RESEARCHER
- MODERATOR
- CONTENT ADMIN
- SYSTEM ADMIN

Authorization must be handled separately from authentication.

---

## Part D — Intelligence Layer

### 18. Search Architecture

The long-term platform uses hybrid search.

```
                 USER QUERY
                     │
          ┌──────────┴──────────┐
          ↓                     ↓
   KEYWORD SEARCH        SEMANTIC SEARCH
          │                     │
          └──────────┬──────────┘
                     ↓
              RESULT FUSION
                     ↓
              RANKED RESULTS
```

- Keyword search provides exact matching.
- Semantic search provides meaning-based matching.
- Metadata filters provide precision.

### 19. Search Engine

Potential production search technologies:

- OpenSearch
- Elasticsearch

The SIH prototype may initially use PostgreSQL search capabilities.

Do not introduce a separate search cluster unless required.

### 20. Vector Search

For semantic search and RAG, vector representations may be stored using:

- PostgreSQL + pgvector
- Dedicated vector database (if required later)

Initial implementation should prefer the simplest architecture that meets the prototype requirement.

### 21. Cultural Knowledge Graph

The platform should maintain a cultural knowledge graph.

Potential entities:

- Person
- Place
- State
- City
- Heritage Site
- Museum
- Institution
- Book
- Author
- Festival
- Tradition
- Artwork
- Manuscript
- Document
- Event
- Historical Event

Potential relationships:

```
Person          → associated with → Place
Person          → authored        → Book
Book            → discusses       → Heritage Site
Festival        → celebrated in   → Place
Heritage Site   → located in      → City
City            → located in      → State
Institution     → preserves       → Manuscript
```

The graph supports:

- Semantic discovery
- Recommendations
- AI retrieval
- Cultural relationship exploration

### 22. OCR / HTR

OCR extracts text from scanned documents. HTR can assist with handwritten historical material.

Pipeline:

```
SCAN
 ↓
OCR / HTR
 ↓
EXTRACTED TEXT
 ↓
VALIDATION
 ↓
SEARCH INDEX
```

OCR output must be treated as potentially imperfect.

### 23. Image Metadata AI

Computer vision can assist with image metadata.

Possible tasks:

- Object detection
- Image classification
- Image tagging
- Metadata suggestions
- Similar-image discovery
- Duplicate detection

AI-generated metadata should be reviewable.

### 24. Speech and Translation AI

Long-term AI services can provide:

- Speech-to-text
- Text-to-speech
- Translation
- Voice search
- Multilingual interaction

Indian language support should be expanded progressively.

### 25. RAG Architecture

The Cultural Assistant should use Retrieval-Augmented Generation.

```
USER QUESTION
    ↓
QUERY PROCESSING
    ↓
RETRIEVAL
    ↓
TRUSTED CULTURAL SOURCES
    ↓
RELEVANT CONTEXT
    ↓
LLM
    ↓
ANSWER
    ↓
SOURCE REFERENCES
```

The LLM should not be treated as the primary source of cultural truth. Retrieved and governed cultural data should be the primary knowledge source.

### 26. AI Cultural Assistant

The assistant should be able to answer:

- Heritage questions
- Historical questions
- Cultural questions
- Festival questions
- Book questions
- Author questions
- Document questions
- Scheme questions
- Event questions
- Institution questions

It should be context-aware. If a user is viewing a heritage site, the assistant can use that resource as additional context.

### 27. Recommendation Engine

Recommendations may suggest:

- Heritage sites
- Festivals
- Museums
- Events
- Books
- Authors
- Cultural practices

Possible signals:

- User-selected interests
- Search behaviour
- Saved items
- Viewed resources
- Approximate location

Recommendations should be privacy-conscious.

### 28. Conservation-Risk Computer Vision

This is an advanced future feature.

Computer vision may assist experts by identifying visible signs such as:

- Cracks
- Surface deterioration
- Water damage
- Vegetation growth
- Structural changes

The system should support conservation professionals rather than automatically making official conservation decisions.

---

## Part E — Data Layer

### 29. Database (PostgreSQL)

PostgreSQL is the primary relational database.

It stores:

- Users
- Heritage resources
- Cultural resources
- Geographic entities
- Events
- Schemes
- Awards
- Documents
- Publications
- Authors
- Institutions
- MoUs
- Community posts
- Metadata
- Provenance

### 30. PostGIS

PostGIS extends PostgreSQL with spatial capabilities.

Use PostGIS for:

- State boundaries
- District boundaries
- City coordinates
- Heritage coordinates
- Museum coordinates
- Event locations
- Geographic queries
- Nearby-resource search

Example:

```
User Location
    ↓
PostGIS
    ↓
Find heritage resources within radius
```

### 31. Object Storage

Large digital assets should not be stored directly inside PostgreSQL.

Object storage should contain:

- Images
- PDFs
- Audio
- Video
- Manuscripts
- Digitized documents
- Other digital assets

Database records should store metadata and object references.

```
PostgreSQL
   │
   ├── metadata
   └── object reference
             ↓
       Object Storage
```

### 32. IIIF

IIIF should be supported for high-resolution cultural images and manuscripts where applicable.

Use cases:

- Museum collections
- Manuscripts
- Artwork
- Historical documents
- Digitized books
- Archival images

IIIF allows efficient delivery and viewing of high-resolution cultural resources.

### 33. Metadata Standards

The platform should support interoperable cultural metadata.

- **JSON-LD** — used for structured linked data.
- **Dublin Core** — useful for digital resources and bibliographic metadata.
- **CIDOC CRM** — useful for representing cultural heritage concepts and relationships.

The platform should maintain mappings between internal data models and these standards where practical.

### 34. Data Sources

The Data Layer is the foundation of the platform.

Potential sources:

- Ministry of Culture
- Government of India
- data.gov.in
- Indian Culture Portal
- National Library
- IGNCA
- ASI
- Museums
- Archives
- Libraries
- Cultural institutions
- Official event sources
- Official publications

Official and authoritative sources should be prioritized.

### 35. Data Ingestion

The system should support:

- API
- JSON
- CSV
- XML
- PDF
- Official Web Pages
- Institutional Catalogues

Ingestion pipeline:

```
SOURCE
 ↓
API / DOWNLOAD
 ↓
RAW DATA
 ↓
PARSING
 ↓
CLEANING
 ↓
NORMALIZATION
 ↓
VALIDATION
 ↓
DEDUPLICATION
 ↓
PROVENANCE
 ↓
POSTGRESQL / OBJECT STORAGE
 ↓
SEARCH INDEX
 ↓
API
 ↓
FRONTEND / AI
```

### 36. Raw Data Storage

Raw source files should be preserved whenever permitted.

Suggested structure:

```
data/
├── raw/
├── processed/
├── normalized/
├── metadata/
└── provenance/
```

Raw data should not be silently overwritten during processing.

### 37. Provenance

Every important resource should maintain:

- source_id
- organization
- dataset_name
- source_url
- retrieved_at
- last_updated
- license
- rights_status
- verification_status

Rights status can include:

- OPEN_LICENSE
- PUBLIC_DOMAIN
- LINK_ONLY
- PERMISSION_REQUIRED
- UNKNOWN

The platform must not assume that a government-hosted resource is automatically free to redistribute.

### 38. Data Governance

Data should be:

- Validated
- Deduplicated
- Versioned (where required)
- Source-attributed
- Rights-aware
- Auditable
- Structured
- Searchable

Official data and community data must remain distinguishable.

---

## Part F — Operations Layer

### 39. Containerization

The production system should be containerized.

Recommended:

- Docker

Each service should have a reproducible environment.

### 40. Kubernetes

Kubernetes is the target production orchestration platform.

It can manage:

- Frontend services
- API services
- Background workers
- Search services
- AI services
- Data-processing services

Kubernetes is not required for the SIH prototype. For the prototype, Docker Compose is sufficient.

### 41. DevSecOps

Production deployment should include:

- Automated testing
- Continuous integration
- Continuous deployment
- Dependency scanning
- Container scanning
- Security testing
- Infrastructure validation

The exact CI/CD provider can be selected according to the deployment environment.

### 42. Security

Security controls should include:

- HTTPS
- Secure authentication
- Authorization
- Input validation
- Rate limiting
- Secure file upload
- Encryption (where appropriate)
- Audit logs
- Secret management
- API protection

### 43. WAF

A Web Application Firewall should protect production-facing services.

Potential protection:

- Malicious request filtering
- Common web attack mitigation
- Rate control
- Bot protection (where appropriate)

A WAF is a production requirement rather than an SIH prototype requirement.

### 44. SIEM

A Security Information and Event Management system can aggregate:

- Authentication events
- Security events
- Application logs
- Infrastructure events
- Suspicious activity

This belongs to the production security architecture.

### 45. Monitoring

Production monitoring should track:

- API latency
- API errors
- Database health
- CPU
- Memory
- Storage
- Search performance
- Queue health
- AI service performance
- Uptime

### 46. Logging

Logs should be centralized.

Important logs include:

- API requests
- Errors
- Authentication events
- Moderation actions
- Data ingestion
- AI requests
- System events

Sensitive information should not be unnecessarily logged.

### 47. Backup and Disaster Recovery

Critical systems require:

- Database backups
- Object storage backups
- Configuration backups
- Recovery procedures
- Disaster recovery plan
- Periodic recovery testing

### 48. AI Model Monitoring

AI services should be monitored for:

- Model drift
- Data drift
- Retrieval failures
- Accuracy degradation
- Unexpected outputs
- Bias
- Quality changes

Models should be replaceable without rebuilding the complete platform.

### 49. Notifications

Notification services can deliver:

- Event reminders
- New cultural resources
- Announcements
- Moderation results
- Saved-resource updates

The service should be asynchronous where appropriate.

### 50. Analytics

Analytics can measure:

- Page views
- Search queries
- Popular heritage resources
- Popular events
- Publication engagement
- AI Assistant usage
- Community activity

Analytics must follow privacy and data-governance requirements.

### 51. Caching

Caching should be used for:

- Frequently accessed public content
- Static assets
- Images
- API responses (where appropriate)
- Search results (where appropriate)

Potential technologies:

- Redis
- CDN caching
- Browser caching

The simplest suitable caching layer should be used first.

### 52. Background Workers

Background jobs can process:

- Data ingestion
- PDF extraction
- OCR
- Image processing
- Search indexing
- Notifications
- AI metadata generation
- Recommendation updates

Possible technologies:

- Celery
- Redis
- RabbitMQ
- Cloud-native queues

The initial prototype can use a simple background task mechanism.

### 53. API and Service Separation

The platform should be modular.

Recommended logical services:

- Frontend
- API
- CMS
- Database
- Search
- Object Storage
- AI
- Data Ingestion
- Notifications
- Analytics

Not every service needs to be deployed separately during the prototype. Logical separation should exist before physical infrastructure separation.

---

## Part G — Prototype & Production

### 54. Prototype Architecture

The first SIH implementation should remain manageable.

Recommended:

```
React + TypeScript
        ↓
FastAPI
        ↓
PostgreSQL + PostGIS
        ↓
Government / Institutional Data
```

Additional prototype components:

- PWA
- Basic Search
- Interactive India Map
- Object Storage
- Basic AI Assistant
- Docker

### 55. Prototype Feature Priority

The prototype should prioritize:

- Home Page
- Explore Dashboard
- Heritage & Culture
- Interactive India Map
- State → City → Resource navigation
- Documents
- Publications & Authors
- Events
- Media
- Search
- AI Assistant UI
- Government data integration

### 56. Production Architecture

The target production architecture is:

```
                         USERS
                           │
                           ▼
                    CDN / WAF / HTTPS
                           │
                           ▼
                  EXPERIENCE LAYER
                 React PWA / Mobile
                           │
                           ▼
                    API GATEWAY
                           │
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
       Drupal           Backend           Auth
       Headless         Services          / SSO
          │                │
          └────────────────┼────────────────┘
                           ↓
                   APPLICATION SERVICES
                           │
          ┌────────────────┼─────────────────┐
          ↓                ↓                 ↓
       Search          AI Services       Community
          │                │                 │
          └────────────────┼─────────────────┘
                           ↓
                       DATA LAYER
                           │
        ┌──────────────────┼──────────────────┐
        ↓                  ↓                  ↓
   PostgreSQL           Object            Search /
   + PostGIS            Storage            Vectors
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ↓
                  Data Ingestion / ETL
                           │
                           ↓
               Government + Institutional
                      Data Sources
```

### 57. Data ↔ Intelligence Dependency

The Intelligence Layer and Data Layer have a two-way dependency.

```
                 INTELLIGENCE
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
   Semantic       Knowledge        RAG /
    Search          Graph         Assistant
       │              │              │
       └──────────────┼──────────────┘
                      ↓
              CURATED CULTURAL DATA
                      ↑
                      │
       ┌──────────────┼──────────────┐
       ↓              ↓              ↓
  PostgreSQL       Documents       Images
  / PostGIS        / Records       / Media
       │              │              │
       └──────────────┼──────────────┘
                      ↑
                 AI PROCESSING
```

Data enables intelligence:

```
Cultural Data
 ↓
Search
 ↓
Knowledge Graph
 ↓
RAG
 ↓
AI
```

Intelligence improves data:

```
Scanned Documents        Images           Cultural Records
      ↓                     ↓                    ↓
   OCR / HTR           Computer Vision      Entity Extraction
      ↓                     ↓                    ↓
 Extracted Text           Metadata           Knowledge Graph
```

### 58. Repository Structure

Recommended repository structure:

```
heritage-platform/
│
├── README.md
├── STRUCTURE.md
├── FUNCTION.md
├── TECH_STACK.md
├── PRODUCT.md
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── app/
│   ├── api/
│   ├── models/
│   ├── services/
│   └── requirements.txt
│
├── data/
│   ├── raw/
│   ├── processed/
│   ├── normalized/
│   └── provenance/
│
├── scripts/
│
├── docker/
│
├── docs/
│
└── tests/
```

### 59. Technology Selection and Evolution

Technology should be selected according to actual requirements.

Avoid unnecessary infrastructure during the prototype.

The system should be:

- Modular
- API-first
- Scalable
- Secure
- Accessible
- Multilingual
- Data-governed
- AI-ready

The production architecture can progressively introduce:

```
PostgreSQL
 → PostGIS
 → pgvector
 → Search Engine
 → Knowledge Graph
 → OCR / HTR
 → RAG
 → Recommendations
 → Kubernetes
 → DevSecOps
 → WAF / SIEM
 → Advanced Monitoring
```

The SIH prototype should demonstrate the core product clearly before introducing production-scale infrastructure.