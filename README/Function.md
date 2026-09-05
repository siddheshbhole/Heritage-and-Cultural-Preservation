# Ministry of Culture — Platform Functionality

This document defines how the platform works: how users interact with it, how information flows through the system, and how each major feature behaves.

The platform is not only an informational website. It is a cultural discovery, preservation, research, community and intelligent-assistance platform.

---

## Contents

- **Part A — Core User Experience**
  - 1. Primary Interaction Flow
  - 2. User Accounts
  - 3. Home Page Behaviour
- **Part B — Home Page Components**
  - 4. Culture Applications Carousel
  - 5. Announcement Ticker
  - 6. Festival & Event System
- **Part C — Exploration & Discovery**
  - 7. Explore Dashboard Behaviour
  - 8. About Us Functionality
  - 9. Interactive India Map
  - 10. State Map Behaviour
  - 11. City / District Map Behaviour
  - 12. Dynamic Category Rule
  - 13. Heritage Detail Functionality
  - 14. Heritage Search
- **Part D — Ministry Content Modules**
  - 15. Offerings — Schemes
  - 16. Offerings — Awards
  - 17. Commemoration
  - 18. Documents
  - 19. Document Viewer
  - 20. Publications
  - 21. Author Functionality
  - 22. MoU Functionality
- **Part E — Community Platform**
  - 23. Community Profiles
  - 24. Community Contributions
  - 25. Photo Upload
  - 26. Reviews & Experiences
  - 27. Community Feed
  - 28. Event Discovery
- **Part F — Search & Intelligence**
  - 29. Search Architecture Behaviour
  - 30. AI Cultural Assistant
  - 31. AI Source Grounding
  - 32. AI Contextual Assistance
  - 33. Recommendations
- **Part G — Language, Accessibility & Connectivity**
  - 34. Multilingual Functionality
  - 35. Accessibility
  - 36. Low-Bandwidth Functionality
- **Part H — Data & Content Governance**
  - 37. Data Provenance
  - 38. Content Trust Levels
  - 39. Notifications
  - 40. Admin & Moderation Workflow
  - 41. Data Ingestion Workflow
  - 42. AI and Data Two-Way Dependency
- **Part I — Non-Functional Behaviour**
  - 43. Error Handling
  - 44. Loading States
  - 45. Performance
  - 46. Security Behaviour
  - 47. Overall Functional Flow

---

## Part A — Core User Experience

### 1. Primary Interaction Flow

The main interaction model is:

```
OPEN PLATFORM
    ↓
HOME PAGE
    ↓
DISCOVER / SEARCH / EXPLORE
    ↓
SELECT RESOURCE
    ↓
DETAILED INFORMATION
    ↓
RELATED RESOURCES
    ↓
SAVE / SHARE / CONTRIBUTE / RESEARCH
```

The user should be able to discover cultural information without already knowing the exact name of the resource.

### 2. User Accounts

Users can browse public cultural information without necessarily creating an account.

An account becomes useful for:

- Creating a profile
- Saving resources
- Posting content
- Uploading photographs
- Writing experiences
- Writing reviews
- Following interests
- Receiving notifications
- Personalizing recommendations

Researchers may have additional access through researcher-oriented authentication, such as ORCID integration, in the production architecture.

### 3. Home Page Behaviour

The Home Page is dynamic. It should display changing content rather than static information only.

Dynamic sections include:

- Featured cultural applications
- Featured heritage
- Latest announcements
- Current events
- Upcoming festivals
- Cultural activities

The Home Page should fetch this information from backend APIs rather than hardcoding it into the frontend.

---

## Part B — Home Page Components

### 4. Culture Applications Carousel

The carousel automatically displays selected government cultural applications and platforms.

Each item has:

- Title
- Description
- Image
- Category
- Official source
- Action

Clicking an item opens its information or official destination.

The carousel should support:

- Automatic sliding
- Manual navigation
- Touch/swipe
- Pause on interaction
- Responsive sizing

### 5. Announcement Ticker

The announcement ticker retrieves recent announcements.

Each announcement contains:

- Title
- Date
- Source
- Summary
- Official URL/document

The ticker moves horizontally. Clicking an announcement opens the detailed announcement.

Announcements should be ordered by date, with the most relevant/recent information first.

### 6. Festival & Event System

The platform maintains event records.

An event can have:

- Name
- Category
- Start date
- End date
- Location
- State
- City
- Description
- Image
- Organizer
- Official source
- Registration link (where available)

Event states:

```
UPCOMING
ONGOING
COMPLETED
```

The Home Page primarily highlights UPCOMING and ONGOING events. The full Events section can contain historical events as well.

---

## Part C — Exploration & Discovery

### 7. Explore Dashboard Behaviour

The Explore Dashboard is hidden or minimized by default.

- When the user activates it on desktop, it expands from the right side.
- On mobile it becomes a drawer or full-height navigation panel.

The first level contains:

- About Us
- Heritage & Culture
- Offerings
- Documents
- Publications & Authors
- MoUs
- Media

Clicking a category reveals its children. The system should use progressive disclosure.

Example:

```
Explore
  ↓
Heritage & Culture
  ↓
Interactive India Map
  ↓
Maharashtra
  ↓
Pune
  ↓
Heritage Sites
  ↓
Shaniwar Wada
```

The user should always be able to go backward one level.

### 8. About Us Functionality

About Us displays official Ministry information.

- **Mission** — displays official mission information.
- **Presentation** — displays a visual introduction/presentation.
- **Objectives** — listed as expandable items; clicking an objective opens detailed information.
- **Functions** — displays Ministry responsibilities.
- **Our Team** — displays leadership/team information.
- **Supporting Bodies** — organizations displayed in searchable/filterable form.

When a user selects an organization, they can see:

- Organization name
- Type
- Location
- Description
- Responsibilities
- Official website
- Related resources

### 9. Interactive India Map

The map is one of the core functional features.

The geographic hierarchy is:

```
India
 ↓
State
 ↓
City / District
 ↓
Category
 ↓
Resource
```

The map should support:

- State selection
- Zoom
- Pan
- Hover information
- Click interaction
- Markers (where appropriate)
- Search
- Geographic filtering

### 10. State Map Behaviour

When the user clicks a state:

- The map focuses/zooms into the state.
- State information is loaded.
- Relevant cities/districts become available.
- Relevant cultural/heritage information is shown.
- The state overview can be opened.

The state page can display:

- History
- Heritage Sites
- Culture
- Rituals & Traditions
- Handloom / Handicrafts
- Famous Food
- Festivals
- Iconic Battles

Only categories with available information should appear.

### 11. City / District Map Behaviour

When the user selects a city or district:

- The map zooms to the selected area.
- City/district information is loaded.
- Relevant resources are displayed.
- Available cultural categories are shown.
- Users can open individual resources.

Example:

```
India
 ↓
Maharashtra
 ↓
Pune
 ↓
Heritage Sites
 ↓
Specific Site
```

### 12. Dynamic Category Rule

This is an important platform rule: **the system must not show empty categories.**

For example, if a city has:

- History
- Heritage
- Festivals
- Food

...but no documented iconic battle, then the UI must show only:

```
History
Heritage
Festivals
Food
```

...and must **not** show `Iconic Battles`.

The frontend should render categories based on actual backend data.

### 13. Heritage Detail Functionality

A heritage resource can include:

- Title
- Description
- History
- Location
- Coordinates
- Images
- Historical period
- Architectural information
- Cultural significance
- Related people
- Related events
- Related publications
- Related documents
- Nearby resources
- Official sources
- Community experiences

The page should provide a clear source/provenance section.

### 14. Heritage Search

Users can search:

- Heritage sites
- Monuments
- Museums
- Cities
- States
- Historical places
- Cultural resources

Search should support filters such as:

- State
- City
- Category
- Time period
- Resource type

Long-term semantic search should allow natural language queries, for example:

```
"Historical forts near Pune"
```

The system should return relevant resources even if their exact text does not match the query.

---

## Part D — Ministry Content Modules

### 15. Offerings — Schemes

Schemes are stored as structured records.

Each scheme may contain:

- Name
- Description
- Category
- Eligibility
- Benefits
- Application information
- Year
- Organization
- Official source
- Documents

Users should be able to search and filter schemes.

### 16. Offerings — Awards

Awards are stored chronologically.

Each award record may contain:

- Award name
- Year
- Recipient
- Field
- Citation
- Description
- Official source

Historical years must remain searchable.

The system should support:

```
Award
 ↓
Year
 ↓
Recipient
 ↓
Details
```

### 17. Commemoration

Commemoration is used for historically important people, contributions, achievements and commemorative events.

Each entry may contain:

- Name
- Period
- Field
- Contribution
- Historical significance
- Associated locations
- Associated people
- Related events
- Related publications
- Sources

### 18. Documents

Documents are searchable resources.

The system should support filtering by:

- Category
- Year
- Organization
- Document type

Document types include:

- Reports
- Acts
- Policies
- Rules
- Notifications
- Orders
- Circulars
- Surveys
- Research documents

Each document record should include:

- Title
- Date/year
- Organization
- Description
- Document type
- Source URL
- File URL (where permitted)
- Rights/provenance information

### 19. Document Viewer

Where rights and technical conditions allow, documents may open inside an embedded viewer. Otherwise the user should be directed to the official source.

The platform should not assume that every government-hosted PDF can be redistributed.

### 20. Publications

Publications can be searched by:

- Title
- Author
- Subject
- Language
- Year
- Publisher
- Institution

A publication record may contain:

- Title
- Author
- Publisher
- Year
- Language
- Subject
- ISBN/catalogue ID
- Description
- Library/institution
- Official catalogue URL
- Digital resource URL (where available)

The platform should link to official catalogues and digital collections rather than unlawfully redistributing copyrighted books.

### 21. Author Functionality

Author profiles connect authors to their work.

An author record may contain:

- Name
- Biography
- Field
- Period
- Publications
- Institutions
- Research
- Related cultural topics

The relationship should be navigable:

```
Author
 ↓
Books / Publications
 ↓
Subjects
 ↓
Related Heritage & Culture
```

### 22. MoU Functionality

MoUs are searchable historical records.

Filters:

- Year
- Organization
- Institution
- Category

Each MoU may contain:

- Parties
- Date
- Purpose
- Description
- Institution
- Document
- Official source

Historical MoUs remain available.

---

## Part E — Community Platform

### 23. Community Profiles

Users can create profiles.

A profile may contain:

- Display name
- Profile image
- Biography
- Cultural interests
- Contributions
- Posts
- Reviews
- Saved resources

Users should be able to edit their own profile.

### 24. Community Contributions

Users can submit:

- Photos
- Experiences
- Reviews
- Cultural stories
- Local information

Submission process:

```
USER
 ↓
CREATE CONTENT
 ↓
UPLOAD
 ↓
VALIDATION
 ↓
MODERATION
 ↓
APPROVED / REJECTED
 ↓
PUBLISHED
```

Community content must remain distinguishable from official content.

### 25. Photo Upload

Users can upload images from:

- Device storage
- Camera

The system should collect metadata where available:

- Upload time
- User
- Location (if explicitly provided/allowed)
- Caption
- Category
- Related heritage site
- Related event

Privacy-sensitive information should not be exposed unnecessarily.

### 26. Reviews & Experiences

Users can write:

- Heritage experiences
- Museum experiences
- Festival experiences
- Cultural reviews

Reviews may be associated with a resource, for example:

```
Heritage Site
 ↓
Community Experiences
 ↓
User Review
```

Moderation and abuse reporting should be available.

### 27. Community Feed

The feed displays approved community content.

Possible interactions:

- Like
- Comment
- Share
- Save
- Report

The feed should prioritize relevant cultural content rather than becoming a generic social network.

### 28. Event Discovery

Users can browse events by:

- State
- City
- Date
- Category
- Event type

Example:

```
Events
 ↓
Maharashtra
 ↓
September
 ↓
Cultural Festivals
```

---

## Part F — Search & Intelligence

### 29. Search Architecture Behaviour

Search should eventually combine:

```
Keyword Search
       +
Semantic Search
       +
Metadata Filters
       ↓
Ranked Results
```

- Keyword search is useful for exact terms.
- Semantic search is useful for meaning-based discovery.
- Metadata filtering provides precision.

### 30. AI Cultural Assistant

The AI Assistant is always accessible. It should be available through a floating button.

The basic workflow is:

```
User Question
    ↓
Query Understanding
    ↓
Search / Retrieval
    ↓
Relevant Cultural Data
    ↓
AI Processing
    ↓
Answer
    ↓
Sources
```

The assistant should answer questions using retrieved cultural information.

### 31. AI Source Grounding

The assistant should prioritize:

- Official Government sources
- Government cultural institutions
- Verified institutional sources
- Authorized cultural resources

When an answer is generated from retrieved information, the assistant should show source references.

If reliable information cannot be found, it should say so instead of inventing an answer.

### 32. AI Contextual Assistance

The assistant can understand the page the user is currently viewing.

For example, if the user is viewing a heritage site, they can ask:

- "What else is nearby?"
- "Who built this?"
- "What books discuss this place?"
- "What festivals are associated with this region?"

The assistant can use the current page/resource as context.

### 33. Recommendations

The platform can recommend:

- Heritage sites
- Books
- Festivals
- Museums
- Events
- Cultural traditions

Recommendations may consider:

- Selected interests
- Location
- Search behaviour
- Saved resources
- Viewed content

Recommendations must respect user privacy.

---

## Part G — Language, Accessibility & Connectivity

### 34. Multilingual Functionality

The platform should support multilingual content.

Language selection should affect:

- Navigation
- UI
- Search
- Content (where translations exist)
- AI Assistant
- Voice interaction

The system should be designed so additional Indian languages can be added later.

### 35. Accessibility

Accessibility functionality includes:

- Keyboard navigation
- Screen-reader compatibility
- Alt text
- Accessible buttons
- Appropriate contrast
- Scalable text
- Captions
- Transcripts
- Reduced motion
- Accessible forms

### 36. Low-Bandwidth Functionality

The platform should provide a low-bandwidth experience.

When enabled:

- Images are compressed
- Large media is deferred
- Videos do not autoplay
- Heavy animations are reduced
- Text and metadata load first

Priority:

```
TEXT
 ↓
METADATA
 ↓
COMPRESSED IMAGE
 ↓
HIGH-RESOLUTION MEDIA
```

---

## Part H — Data & Content Governance

### 37. Data Provenance

Every important resource should retain source information.

Minimum provenance:

- Organization
- Dataset / Resource
- Source URL
- Retrieved Date
- Last Updated
- License
- Rights Status
- Verification Status

This allows users and administrators to understand where information came from.

### 38. Content Trust Levels

The platform distinguishes between:

- **OFFICIAL** — Government / institutional source
- **VERIFIED** — Reviewed cultural information
- **COMMUNITY** — User-generated content
- **AI-GENERATED** — Generated response based on retrieved sources

These labels should be visible where appropriate.

### 39. Notifications

Notifications can inform users about:

- Upcoming events
- New resources
- Saved-resource updates
- Community moderation status
- New publications
- Important cultural announcements

Users should have notification controls.

### 40. Admin & Moderation Workflow

Administrators can:

- Review submissions
- Approve/reject content
- Edit metadata
- Manage users
- Manage events
- Manage announcements
- Manage featured content
- Manage source records
- Review reports
- Manage AI knowledge sources

### 41. Data Ingestion Workflow

Government and institutional data can enter the platform through:

- API
- JSON
- CSV
- XML
- PDF
- Official Web Page
- Institutional Catalogue

Processing:

```
SOURCE
 ↓
INGEST
 ↓
RAW DATA
 ↓
PARSE
 ↓
CLEAN
 ↓
NORMALIZE
 ↓
VALIDATE
 ↓
DEDUPLICATE
 ↓
ADD PROVENANCE
 ↓
DATABASE
 ↓
SEARCH INDEX
 ↓
FRONTEND / AI
```

### 42. AI and Data Two-Way Dependency

The Intelligence Layer depends on the Data Layer:

```
Curated Data
 ↓
Search
 ↓
Knowledge Graph
 ↓
RAG
 ↓
AI Assistant
```

But intelligence can also improve the data:

```
Images            Documents          Cultural Records
 ↓                  ↓                      ↓
Computer Vision    OCR / HTR          Entity Extraction
 ↓                  ↓                      ↓
Metadata           Extracted Text     Knowledge Graph
```

Therefore:

```
DATA ↔ INTELLIGENCE
```

The quality of AI output depends heavily on the quality, governance and provenance of cultural data.

---

## Part I — Non-Functional Behaviour

### 43. Error Handling

The platform should handle:

- Missing data
- Invalid records
- Failed API requests
- Search failures
- Image loading failures
- Document loading failures
- AI service failures

The frontend should show useful error messages rather than blank screens.

### 44. Loading States

Use appropriate loading states for:

- Map loading
- Search
- API content
- Images
- Documents
- AI responses

Skeleton loaders can be used for major content sections.

### 45. Performance

The application should:

- Lazy-load heavy components
- Lazy-load images
- Cache appropriate data
- Paginate large datasets
- Avoid loading all map resources simultaneously
- Avoid rendering thousands of markers at once
- Optimize API responses

### 46. Security Behaviour

The application should validate:

- Authentication
- Authorization
- Uploaded files
- API input
- User-generated content
- File types
- Request rates

Community uploads should be scanned and validated before publication.

### 47. Overall Functional Flow

The complete platform works as:

```
                       USER
                         │
         ┌───────────────┼───────────────┐
         ↓               ↓               ↓
       HOME           EXPLORE          SEARCH
         │               │               │
         └───────────────┼───────────────┘
                         ↓
                  CULTURAL RESOURCES
                         │
        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
    HERITAGE         DOCUMENTS       PUBLICATIONS
        │                │                │
        └────────────────┼────────────────┘
                         ↓
                   RELATED DATA
                         ↓
              AI CULTURAL ASSISTANT
                         ↓
                 ANSWER + SOURCES
```