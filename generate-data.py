"""
Parse CISA domain MD files and generate js/data.js for the HTML app.
Reads from Books/domains/ and outputs structured JavaScript data.

Usage: python generate-data.py
"""
import os
import re
import json

DOMAINS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'Books', 'domains')
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'js', 'data.js')

DOMAIN_INFO = [
    {"number": 1, "file": "Domain1_IS_Auditing_Process.md", "title": "Information System Auditing Process", "weight": 18,
     "partA": "Planning", "partB": "Execution"},
    {"number": 2, "file": "Domain2_Governance_Management_IT.md", "title": "Governance and Management of IT", "weight": 18,
     "partA": "IT Governance", "partB": "IT Management"},
    {"number": 3, "file": "Domain3_IS_Acquisition_Development.md", "title": "Information Systems Acquisition, Development and Implementation", "weight": 12,
     "partA": "IS Acquisition and Development", "partB": "IS Implementation"},
    {"number": 4, "file": "Domain4_IS_Operations_Resilience.md", "title": "Information Systems Operations and Business Resilience", "weight": 26,
     "partA": "IS Operations", "partB": "Business Resilience"},
    {"number": 5, "file": "Domain5_Protection_Information_Assets.md", "title": "Protection of Information Assets", "weight": 26,
     "partA": "Information Asset Security", "partB": "Security Management"},
]


def clean_text(text):
    """Clean OCR artifacts and normalize text."""
    text = re.sub(r'©ISACA.*?Reserved\.?\s*\|?\s*\d*', '', text)
    text = re.sub(r'CISA[°"]?\s*Official Review Manual.*?Chapter\s*\d+', '', text)
    text = re.sub(r'\d+\s*\|\s*©ISACA.*', '', text)
    text = text.replace('  ', ' ')
    return text.strip()


def extract_key_takeaways(content, max_items=4):
    """Extract key points from content as takeaways."""
    takeaways = []
    
    # Try bullet points first
    bullets = re.findall(r'^[-•·]\s+(.+)', content, re.MULTILINE)
    if bullets and len(bullets) >= 3:
        for b in bullets[:max_items]:
            t = b.strip()
            if 20 < len(t) < 200:
                takeaways.append(t)
        if takeaways:
            return takeaways
    
    # Try numbered items
    numbered = re.findall(r'^\d+[.)]\s+(.+)', content, re.MULTILINE)
    if numbered and len(numbered) >= 3:
        for n in numbered[:max_items]:
            t = n.strip()
            if 20 < len(t) < 200:
                takeaways.append(t)
        if takeaways:
            return takeaways
    
    # Fall back to first meaningful sentences
    sentences = re.split(r'[.!?]\s+', content)
    for s in sentences:
        s = s.strip()
        if 30 < len(s) < 180 and not s.startswith('Figure') and not s.startswith('Source'):
            takeaways.append(s + '.')
            if len(takeaways) >= max_items:
                break
    
    return takeaways if takeaways else ["Review this section for key concepts."]


def parse_domain_md(filepath, domain_number):
    """Parse a domain MD file into structured chapters and sections."""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove header (title, weight line, separator)
    lines = content.split('\n')
    start_idx = 0
    for i, line in enumerate(lines):
        if line.strip() == '---' and i > 3:
            start_idx = i + 1
            break
    
    body = '\n'.join(lines[start_idx:])
    
    # Find chapter-level sections (X.Y pattern) - also handle OCR 's' instead of digit
    chapter_pattern = re.compile(
        r'^(?:#{1,3}\s*)?([0-9s]\.\d+)\s+([A-Z][^\n]+)',
        re.MULTILINE
    )
    
    chapters = []
    matches = list(chapter_pattern.finditer(body))
    
    for i, match in enumerate(matches):
        ch_id = match.group(1).replace('s.', f'{domain_number}.')
        ch_title = match.group(2).strip()
        
        # Skip TOC lines (contain dots like ........)
        if '...' in ch_title:
            continue
        
        # Get content until next chapter
        start = match.end()
        end = matches[i + 1].start() if i < len(matches) - 1 else len(body)
        ch_content = body[start:end].strip()
        
        # Parse sub-sections (X.Y.Z pattern) - handle OCR errors, spaces in numbers
        sub_pattern = re.compile(
            r'^(?:#{1,4}\s*)?([0-9s]\.\d+\.?\s*\d+)\s+([A-Z][^\n]+)',
            re.MULTILINE
        )
        sub_matches = list(sub_pattern.finditer(ch_content))
        
        sections = []
        
        if sub_matches:
            for j, sub in enumerate(sub_matches):
                sec_id = sub.group(1).replace('s.', f'{domain_number}.').replace(' ', '')
                sec_title = sub.group(2).strip()
                
                if '...' in sec_title:
                    continue
                
                sec_start = sub.end()
                sec_end = sub_matches[j + 1].start() if j < len(sub_matches) - 1 else len(ch_content)
                sec_content = clean_text(ch_content[sec_start:sec_end])
                
                if len(sec_content) < 50:
                    continue
                
                # Truncate very long sections to ~2000 chars
                if len(sec_content) > 3000:
                    sec_content = sec_content[:2800] + '\n\n[Content continues...]'
                
                sections.append({
                    "id": sec_id,
                    "title": sec_title,
                    "content": sec_content,
                    "keyTakeaways": extract_key_takeaways(sec_content),
                })
        else:
            # No sub-sections — create one section from chapter content
            sec_content = clean_text(ch_content)
            if len(sec_content) > 3000:
                sec_content = sec_content[:2800] + '\n\n[Content continues...]'
            
            if len(sec_content) > 50:
                sections.append({
                    "id": f"{ch_id}.1",
                    "title": ch_title,
                    "content": sec_content,
                    "keyTakeaways": extract_key_takeaways(sec_content),
                })
        
        if sections:
            chapters.append({
                "id": ch_id,
                "title": ch_title,
                "sections": sections,
            })
    
    return chapters


def assign_parts(chapters, domain_number):
    """Split chapters into Part A and Part B based on domain conventions."""
    # Heuristic: first ~40% chapters = Part A, rest = Part B
    # Or based on known structure
    part_b_starts = {
        1: "1.5",   # Part B starts at 1.5
        2: "2.4",   # Approximate
        3: "3.5",   # Part B: Implementation
        4: "4.5",   # Approximate
        5: "5.5",   # Approximate
    }
    
    split_id = part_b_starts.get(domain_number, f"{domain_number}.5")
    
    part_a = []
    part_b = []
    
    for ch in chapters:
        # Compare X.Y numbers
        try:
            ch_num = float(ch["id"])
            split_num = float(split_id)
            if ch_num < split_num:
                part_a.append(ch)
            else:
                part_b.append(ch)
        except ValueError:
            part_a.append(ch)
    
    # If split didn't work well, use midpoint
    if not part_a and chapters:
        mid = len(chapters) // 2
        part_a = chapters[:mid]
        part_b = chapters[mid:]
    
    return part_a, part_b


def generate_pretest_questions(domain_number):
    """Generate placeholder pre-test questions for each domain."""
    # Domain 1 has real questions from the book
    if domain_number == 1:
        return [
            {"id": "q1_1", "text": "Which of the following outlines the overall authority to perform an IS audit?",
             "options": [{"key": "A", "text": "The audit scope with goals and objectives"}, {"key": "B", "text": "A request from management to perform an audit"}, {"key": "C", "text": "The approved audit charter"}, {"key": "D", "text": "The approved audit schedule"}],
             "correct": "C", "explanation": "The approved audit charter outlines the auditor's responsibility, authority and accountability."},
            {"id": "q1_2", "text": "What is the KEY benefit of a control self-assessment (CSA)?",
             "options": [{"key": "A", "text": "Management ownership of internal controls is reinforced"}, {"key": "B", "text": "Audit expenses are reduced"}, {"key": "C", "text": "Fraud detection is improved"}, {"key": "D", "text": "Internal auditors shift to consultative approach"}],
             "correct": "A", "explanation": "The primary objective of CSA is to have business managers become more aware of internal control and their responsibility."},
            {"id": "q1_3", "text": "An IS auditor developing a risk-based audit program would MOST likely focus on:",
             "options": [{"key": "A", "text": "Business processes"}, {"key": "B", "text": "Administrative controls"}, {"key": "C", "text": "Environmental controls"}, {"key": "D", "text": "Business strategies"}],
             "correct": "A", "explanation": "A risk-based audit approach focuses on understanding business processes and identifying/categorizing risk."},
            {"id": "q1_4", "text": "Which type of audit risk assumes an absence of compensating controls?",
             "options": [{"key": "A", "text": "Control risk"}, {"key": "B", "text": "Detection risk"}, {"key": "C", "text": "Inherent risk"}, {"key": "D", "text": "Sampling risk"}],
             "correct": "C", "explanation": "Inherent risk is the risk level before considering any compensating controls."},
            {"id": "q1_5", "text": "The MOST important reason for reviewing audit planning at periodic intervals is:",
             "options": [{"key": "A", "text": "To plan deployment of audit resources"}, {"key": "B", "text": "To consider changes to the risk environment"}, {"key": "C", "text": "To document the audit charter"}, {"key": "D", "text": "To identify applicable IS audit standards"}],
             "correct": "B", "explanation": "Risk environments change, requiring periodic review to ensure audit plans remain relevant."},
            {"id": "q1_6", "text": "The MOST critical step when planning an IS audit is:",
             "options": [{"key": "A", "text": "Review of prior audit findings"}, {"key": "B", "text": "Executive management approval"}, {"key": "C", "text": "Review of security policies"}, {"key": "D", "text": "Performance of a risk assessment"}],
             "correct": "D", "explanation": "Risk assessment is required by ISACA Standard 1201 and identifies high-risk areas for evaluation."},
            {"id": "q1_7", "text": "IS audit coverage planning should be based on:",
             "options": [{"key": "A", "text": "Risk"}, {"key": "B", "text": "Materiality"}, {"key": "C", "text": "Fraud monitoring"}, {"key": "D", "text": "Sufficiency of evidence"}],
             "correct": "A", "explanation": "Audit planning requires a risk-based approach per ISACA standards."},
            {"id": "q1_8", "text": "Daily backup stored offsite for restoration is an example of:",
             "options": [{"key": "A", "text": "Preventive control"}, {"key": "B", "text": "Management control"}, {"key": "C", "text": "Corrective control"}, {"key": "D", "text": "Detective control"}],
             "correct": "C", "explanation": "A corrective control minimizes impact of a problem. Backup restores files after disruption."},
            {"id": "q1_9", "text": "An IS auditor finds a weakness in system software outside the application review scope. The auditor should:",
             "options": [{"key": "A", "text": "Disregard it — outside scope"}, {"key": "B", "text": "Conduct a detailed system software review"}, {"key": "C", "text": "State the audit was limited to application controls"}, {"key": "D", "text": "Review relevant controls and recommend a detailed review"}],
             "correct": "D", "explanation": "The auditor should review relevant system software controls and recommend a detailed review."},
            {"id": "q1_10", "text": "Which of the following BEST describes the purpose of compliance testing?",
             "options": [{"key": "A", "text": "To verify data accuracy and completeness"}, {"key": "B", "text": "To determine if controls operate as designed"}, {"key": "C", "text": "To identify fraud in transactions"}, {"key": "D", "text": "To evaluate system performance"}],
             "correct": "B", "explanation": "Compliance testing (tests of controls) determines whether controls are operating as designed."},
        ]
    else:
        # Placeholder for other domains
        return [
            {"id": f"q{domain_number}_1", "text": f"Sample question for Domain {domain_number} - Question 1",
             "options": [{"key": "A", "text": "Option A"}, {"key": "B", "text": "Option B"}, {"key": "C", "text": "Option C"}, {"key": "D", "text": "Option D"}],
             "correct": "A", "explanation": "Detailed questions will be added from the official review manual."}
        ]


def main():
    print("Generating CISA data.js from MD files...\n")
    
    domains_data = []
    total_chapters = 0
    total_sections = 0
    
    for dinfo in DOMAIN_INFO:
        filepath = os.path.join(DOMAINS_DIR, dinfo["file"])
        
        if not os.path.exists(filepath):
            print(f"  SKIP: {dinfo['file']} not found")
            domains_data.append({
                "id": dinfo["number"],
                "title": dinfo["title"],
                "weight": dinfo["weight"],
                "description": f"Domain {dinfo['number']} content.",
                "parts": [],
                "preTestQuestions": [],
            })
            continue
        
        print(f"Domain {dinfo['number']}: {dinfo['file']}")
        chapters = parse_domain_md(filepath, dinfo["number"])
        part_a, part_b = assign_parts(chapters, dinfo["number"])
        
        sec_count = sum(len(ch["sections"]) for ch in chapters)
        total_chapters += len(chapters)
        total_sections += sec_count
        print(f"  Chapters: {len(chapters)}, Sections: {sec_count}")
        print(f"  Part A: {len(part_a)} chapters, Part B: {len(part_b)} chapters")
        
        domain_obj = {
            "id": dinfo["number"],
            "title": dinfo["title"],
            "weight": dinfo["weight"],
            "description": f"This domain represents {dinfo['weight']}% of the CISA exam (approximately {round(150 * dinfo['weight'] / 100)} questions).",
            "parts": [
                {"label": "Part A", "title": dinfo["partA"], "chapters": part_a},
                {"label": "Part B", "title": dinfo["partB"], "chapters": part_b},
            ],
            "preTestQuestions": generate_pretest_questions(dinfo["number"]),
        }
        
        domains_data.append(domain_obj)
    
    # Write data.js
    js_content = "// CISA E-Learning Application - Data Module\n"
    js_content += "// Auto-generated from CISA Official Review Manual\n"
    js_content += f"// Total: {total_chapters} chapters, {total_sections} sections\n\n"
    js_content += "const DOMAINS = "
    js_content += json.dumps(domains_data, indent=2, ensure_ascii=False)
    js_content += ";\n"
    
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write(js_content)
    
    file_size = os.path.getsize(OUTPUT_FILE)
    print(f"\n{'='*50}")
    print(f"Generated: js/data.js ({file_size // 1024} KB)")
    print(f"Total: {total_chapters} chapters, {total_sections} sections")
    print(f"{'='*50}")


if __name__ == "__main__":
    main()
