// CISA E-Learning Application - UI Components

const Components = {
  // Format content text: convert markdown-style bullets and numbered lists to HTML
  formatContent(text) {
    if (!text) return '';
    const paragraphs = text.split('\n\n');
    let html = '';
    
    for (const para of paragraphs) {
      const lines = para.split('\n');
      let inUl = false;
      let inOl = false;
      let listHtml = '';
      let paraHtml = '';

      for (const line of lines) {
        const trimmed = line.trim();
        // Bullet point
        if (/^[-•]\s+/.test(trimmed)) {
          if (!inUl) { 
            if (paraHtml) { html += '<p>' + paraHtml + '</p>'; paraHtml = ''; }
            inUl = true; listHtml = '<ul>'; 
          }
          listHtml += '<li>' + trimmed.replace(/^[-•]\s+/, '') + '</li>';
        }
        // Numbered list
        else if (/^\d+\.\s+/.test(trimmed)) {
          if (!inOl) { 
            if (paraHtml) { html += '<p>' + paraHtml + '</p>'; paraHtml = ''; }
            inOl = true; listHtml = '<ol>'; 
          }
          listHtml += '<li>' + trimmed.replace(/^\d+\.\s+/, '') + '</li>';
        }
        // Sub-bullet (indented)
        else if (/^\s+[-•]\s+/.test(line)) {
          if (inUl || inOl) {
            listHtml += '<li>' + line.trim().replace(/^[-•]\s+/, '') + '</li>';
          }
        }
        else {
          if (inUl) { listHtml += '</ul>'; html += listHtml; inUl = false; listHtml = ''; }
          if (inOl) { listHtml += '</ol>'; html += listHtml; inOl = false; listHtml = ''; }
          if (trimmed) {
            paraHtml += (paraHtml ? ' ' : '') + trimmed;
          }
        }
      }
      if (inUl) { listHtml += '</ul>'; html += listHtml; }
      if (inOl) { listHtml += '</ol>'; html += listHtml; }
      if (paraHtml) { html += '<p>' + paraHtml + '</p>'; }
    }
    return html;
  },

  // Render the header bar
  renderHeader() {
    const user = localStorage.getItem('cisa_user');
    if (!user) return '';
    return `
      <header class="header">
        <h1 onclick="App.navigate('domains')">CISA E-Learning</h1>
        <div class="header-right">
          <span class="header-user">Welcome, ${user}</span>
          <button class="btn-logout" onclick="App.logout()">Logout</button>
        </div>
      </header>
    `;
  },

  // Render login page
  renderLogin() {
    return `
      <div class="login-page">
        <div class="login-card">
          <h2>CISA E-Learning</h2>
          <p>Sign in to access your study materials</p>
          <div class="form-group">
            <label for="username">Username</label>
            <input type="text" id="username" placeholder="Enter username" autocomplete="username">
          </div>
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" placeholder="Enter password" autocomplete="current-password">
          </div>
          <div class="login-error" id="loginError">Invalid username or password</div>
          <button class="btn-primary" onclick="App.handleLogin()">Sign In</button>
        </div>
      </div>
    `;
  },

  // Render domains list page
  renderDomains() {
    const progress = App.getProgress();
    let cards = '';
    for (const domain of DOMAINS) {
      const sections = App.getAllSections(domain);
      const completed = sections.filter(s => progress[s.id]).length;
      const total = sections.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
      cards += `
        <div class="domain-card" onclick="App.navigate('domain/${domain.id}')">
          <div class="domain-card-header">
            <div class="domain-card-title">Domain ${domain.id}: ${domain.title}</div>
            <span class="domain-weight">${domain.weight}%</span>
          </div>
          <div class="domain-card-desc">${domain.description}</div>
          <div class="domain-progress">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
            <div class="progress-text">${completed}/${total} sections completed (${pct}%)</div>
          </div>
        </div>
      `;
    }
    return `
      <div class="main-content">
        <h2 class="page-title">CISA Study Domains</h2>
        <p class="page-subtitle">Select a domain to begin studying. Complete all sections and take tests to track your progress.</p>
        <div class="domain-grid">${cards}</div>
      </div>
    `;
  },

  // Render domain detail page
  renderDomain(domainId) {
    const domain = DOMAINS.find(d => d.id === parseInt(domainId));
    if (!domain) return '<div class="main-content"><p>Domain not found.</p></div>';
    
    const progress = App.getProgress();
    const sections = App.getAllSections(domain);
    const completed = sections.filter(s => progress[s.id]).length;
    const total = sections.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Check for test scores
    const preTest = App.getTestResult('pretest', domain.id);
    const postTest = App.getTestResult('posttest', domain.id);

    let partsHtml = '';
    for (const part of domain.parts) {
      let chaptersHtml = '';
      for (const chapter of part.chapters) {
        const chSections = chapter.sections || [];
        const chCompleted = chSections.filter(s => progress[s.id]).length;
        const allDone = chSections.length > 0 && chCompleted === chSections.length;
        const statusIcon = allDone ? '<span class="check-complete">✓</span>' : '<span class="check-incomplete">○</span>';
        chaptersHtml += `
          <div class="chapter-item" onclick="App.navigate('chapter/${chapter.id}')">
            <div class="chapter-item-left">
              <span class="chapter-id">${chapter.id}</span>
              <span class="chapter-title">${chapter.title}</span>
            </div>
            ${statusIcon}
          </div>
        `;
      }
      partsHtml += `
        <div class="part-section">
          <div class="part-title">${part.label}: ${part.title}</div>
          <div class="chapter-list">${chaptersHtml}</div>
        </div>
      `;
    }

    return `
      <div class="main-content">
        <div class="breadcrumb">
          <a href="#domains">All Domains</a> &rsaquo; Domain ${domain.id}
        </div>
        <div class="domain-header">
          <h2>Domain ${domain.id}: ${domain.title}</h2>
          <div class="domain-progress" style="margin-top:12px">
            <div class="progress-bar-bg">
              <div class="progress-bar-fill" style="width: ${pct}%"></div>
            </div>
            <div class="progress-text">${completed}/${total} sections completed (${pct}%)</div>
          </div>
        </div>
        <div class="test-buttons">
          <div>
            <button class="btn-test btn-pretest" onclick="App.navigate('pretest/${domain.id}')">Pre-Test</button>
            ${preTest ? '<div class="test-score">Last score: ' + preTest.score + '%</div>' : ''}
          </div>
          <div>
            <button class="btn-test btn-posttest" onclick="App.navigate('posttest/${domain.id}')">Post-Test</button>
            ${postTest ? '<div class="test-score">Last score: ' + postTest.score + '%</div>' : ''}
          </div>
        </div>
        ${partsHtml}
      </div>
    `;
  },

  // Render chapter page (list of sections)
  renderChapter(chapterId) {
    const { domain, chapter } = App.findChapter(chapterId);
    if (!chapter) return '<div class="main-content"><p>Chapter not found.</p></div>';

    const progress = App.getProgress();
    let sectionsHtml = '';
    for (const section of chapter.sections) {
      const done = progress[section.id];
      const icon = done ? '<span class="check-complete">✓</span>' : '<span class="check-incomplete">○</span>';
      sectionsHtml += `
        <div class="section-item" onclick="App.navigate('section/${section.id}')">
          <div>
            <span style="font-weight:500;color:var(--secondary);margin-right:8px">${section.id}</span>
            <span>${section.title}</span>
          </div>
          ${icon}
        </div>
      `;
    }

    return `
      <div class="main-content">
        <div class="breadcrumb">
          <a href="#domains">All Domains</a> &rsaquo; 
          <a href="#domain/${domain.id}">Domain ${domain.id}</a> &rsaquo; 
          Chapter ${chapter.id}
        </div>
        <div class="section-content">
          <h3>${chapter.id} ${chapter.title}</h3>
          <div class="section-list">${sectionsHtml}</div>
        </div>
      </div>
    `;
  },

  // Render section page (content view)
  renderSection(sectionId) {
    const { domain, chapter, section, prevSection, nextSection } = App.findSection(sectionId);
    if (!section) return '<div class="main-content"><p>Section not found.</p></div>';

    const progress = App.getProgress();
    const isComplete = progress[section.id];
    const contentHtml = this.formatContent(section.content);

    let takeawaysHtml = '';
    if (section.keyTakeaways && section.keyTakeaways.length) {
      takeawaysHtml = `
        <div class="key-takeaways">
          <h4>💡 Key Takeaways</h4>
          <ul>
            ${section.keyTakeaways.map(t => '<li>' + t + '</li>').join('')}
          </ul>
        </div>
      `;
    }

    const prevBtn = prevSection 
      ? `<a class="btn-nav" href="#section/${prevSection.id}">← Previous</a>`
      : `<span class="btn-nav disabled">← Previous</span>`;
    const nextBtn = nextSection
      ? `<a class="btn-nav" href="#section/${nextSection.id}">Next →</a>`
      : `<span class="btn-nav disabled">Next →</span>`;

    return `
      <div class="main-content">
        <div class="breadcrumb">
          <a href="#domains">All Domains</a> &rsaquo; 
          <a href="#domain/${domain.id}">Domain ${domain.id}</a> &rsaquo; 
          <a href="#chapter/${chapter.id}">Chapter ${chapter.id}</a> &rsaquo; 
          ${section.id}
        </div>
        <div class="section-content">
          <h3>${section.id} ${section.title}</h3>
          <div class="section-body">${contentHtml}</div>
          ${takeawaysHtml}
        </div>
        <div class="section-nav">
          ${prevBtn}
          ${nextBtn}
        </div>
      </div>
      <div class="sticky-bar">
        <button class="btn-complete ${isComplete ? 'completed' : 'incomplete'}" 
                onclick="App.toggleComplete('${section.id}')">
          ${isComplete ? '✓ Completed' : 'Mark as Complete'}
        </button>
      </div>
    `;
  },

  // Render quiz (pre-test or post-test)
  renderQuiz(type, domainId) {
    const domain = DOMAINS.find(d => d.id === parseInt(domainId));
    if (!domain) return '<div class="main-content"><p>Domain not found.</p></div>';
    
    const questions = domain.preTestQuestions || [];
    if (questions.length === 0) {
      return `
        <div class="main-content">
          <div class="breadcrumb">
            <a href="#domains">All Domains</a> &rsaquo; 
            <a href="#domain/${domain.id}">Domain ${domain.id}</a> &rsaquo; 
            ${type === 'pretest' ? 'Pre-Test' : 'Post-Test'}
          </div>
          <div class="empty-state">
            <h3>No questions available yet</h3>
            <p>Test questions for this domain are coming soon.</p>
          </div>
        </div>
      `;
    }

    const title = type === 'pretest' ? 'Pre-Test' : 'Post-Test';
    let questionsHtml = '';
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      let optionsHtml = '';
      for (const opt of q.options) {
        optionsHtml += `
          <div class="option-item" data-question="${q.id}" data-key="${opt.key}" 
               onclick="App.selectAnswer('${q.id}', '${opt.key}')">
            <span class="option-key">${opt.key}.</span>
            <span>${opt.text}</span>
          </div>
        `;
      }
      questionsHtml += `
        <div class="question-card" id="qcard-${q.id}">
          <div class="question-text">
            <span class="question-number">Q${i + 1}.</span> ${q.text}
          </div>
          <div class="options-list">${optionsHtml}</div>
          <div class="explanation" id="exp-${q.id}">${q.explanation}</div>
        </div>
      `;
    }

    return `
      <div class="main-content">
        <div class="breadcrumb">
          <a href="#domains">All Domains</a> &rsaquo; 
          <a href="#domain/${domain.id}">Domain ${domain.id}</a> &rsaquo; 
          ${title}
        </div>
        <div class="quiz-container">
          <div class="quiz-header">
            <h3>Domain ${domain.id}: ${title}</h3>
            <div class="quiz-progress">${questions.length} questions</div>
          </div>
          <div id="quizQuestions">${questionsHtml}</div>
          <div id="quizResults" class="hidden"></div>
          <button class="btn-submit-quiz" id="btnSubmitQuiz" 
                  onclick="App.submitQuiz('${type}', ${domain.id})">
            Submit Answers
          </button>
        </div>
      </div>
    `;
  }
};
