CISA E-Learning Application
============================

KNOWN MISSING SECTIONS (OCR extraction limitations):
----------------------------------------------------
Domain 1 - Information System Auditing Process:
  - 1.8.1 Computer-Assisted Audit Techniques (content merged into 1.8)
  - 1.10.1 Audit Committee Oversight (content merged into 1.10)
  - 1.10.4 Monitoring (content merged into 1.10)

Domain 2 - Governance and Management of IT:
  - 2.2.4 Information Security Governance
  - 2.2.5 Information Systems Strategy
  - 2.8.5 Enterprise Change Management
  - 2.8.7 Information Security Management

Domain 3 - IS Acquisition, Development and Implementation:
  - 3.1.10 Project Planning (content merged into 3.1)
  - 3.3.3 SDLC Phases (content merged into 3.3)
  - 3.4.2 Output Controls

Domain 4 - IS Operations and Business Resilience:
  - 4.7.3 Detection, Documentation, Control, Resolution and Reporting
  - 4.15.10 Business Continuity Management Good Practices
  - 4.15.11 Auditing Business Continuity
  - 4.16.5 Disaster Recovery Testing Methods

Domain 5 - Protection of Information Assets:
  - 5.3.15 Remote Access Security
  - 5.3.16 Biometrics
  - 5.6.10 Applications of Cryptographic Systems
  - 5.6.12 Secure Shell
  - 5.7.2 Key Management
  - 5.9.6 Internet Access on Mobile Devices (partially recovered)
  - 5.13.4 Honeypots and Honeynets
  - 5.15 Evidence Collection and Forensics
  - 5.15.1 Digital Forensics
  - 5.15.2 Evidence Life Cycle
  - 5.15.3 Chain of Custody

Total: ~32 sections missing from 336 total (~9.5%)
Content for these sections may be partially present within adjacent sections.
To fix: manually edit the MD files in Books/domains/ then run generate-data.py
----------------------------------------------------

How to use:
  Double-click index.html to start

Login credentials:
  Username: hoannd    Password: Cisa2024!
  Username: anhnv31   Password: Cisa2024!
  Username: chinhpt6  Password: Cisa2024!

Features:
  - 5 CISA Domains with exam weights
  - 60 chapters, 304 sections (knowledge cards)
  - Key Takeaways for each section
  - Mark sections as complete (saved in browser)
  - Progress tracking per domain
  - Pre-Test and Post-Test per domain
  - Previous/Next navigation between sections
  - Mobile-friendly responsive design
  - Google Login (optional, requires Firebase setup)

No server, Node.js, or internet connection required.
All data is stored locally in your browser (localStorage).
