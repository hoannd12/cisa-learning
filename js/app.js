// CISA E-Learning Application - Main Application Logic

const App = {
  currentAnswers: {},

  // Initialize the application
  init() {
    window.addEventListener('hashchange', () => this.route());
    this.route();
  },

  // Router - handles hash-based navigation
  route() {
    const hash = location.hash.slice(1) || '';
    const user = localStorage.getItem('cisa_user');

    // If not logged in, show login
    if (!user && hash !== 'login') {
      location.hash = '#login';
      return;
    }

    // Parse the route
    const app = document.getElementById('app');
    let content = '';

    if (!user || hash === 'login') {
      content = Components.renderLogin();
    } else if (hash === '' || hash === 'domains') {
      content = Components.renderHeader() + Components.renderDomains();
    } else if (hash.startsWith('domain/')) {
      const id = hash.split('/')[1];
      content = Components.renderHeader() + Components.renderDomain(id);
    } else if (hash.startsWith('chapter/')) {
      const id = hash.split('/')[1];
      content = Components.renderHeader() + Components.renderChapter(id);
    } else if (hash.startsWith('section/')) {
      const id = hash.replace('section/', '');
      content = Components.renderHeader() + Components.renderSection(id);
    } else if (hash.startsWith('pretest/')) {
      const id = hash.split('/')[1];
      this.currentAnswers = {};
      content = Components.renderHeader() + Components.renderQuiz('pretest', id);
    } else if (hash.startsWith('posttest/')) {
      const id = hash.split('/')[1];
      this.currentAnswers = {};
      content = Components.renderHeader() + Components.renderQuiz('posttest', id);
    } else {
      content = Components.renderHeader() + Components.renderDomains();
    }

    app.innerHTML = content;
    window.scrollTo(0, 0);
  },

  // Navigate to a route
  navigate(route) {
    location.hash = '#' + route;
  },

  // Handle login
  handleLogin() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('loginError');

    if (username === 'hoannd' && password === 'Cisa2024!') {
      localStorage.setItem('cisa_user', username);
      location.hash = '#domains';
    } else {
      errorEl.classList.add('visible');
      setTimeout(() => errorEl.classList.remove('visible'), 3000);
    }
  },

  // Logout
  logout() {
    localStorage.removeItem('cisa_user');
    location.hash = '#login';
  },

  // Get progress from localStorage
  getProgress() {
    try {
      return JSON.parse(localStorage.getItem('cisa_progress') || '{}');
    } catch {
      return {};
    }
  },

  // Toggle section completion
  toggleComplete(sectionId) {
    const progress = this.getProgress();
    if (progress[sectionId]) {
      delete progress[sectionId];
    } else {
      progress[sectionId] = true;
    }
    localStorage.setItem('cisa_progress', JSON.stringify(progress));
    this.route(); // Re-render
  },

  // Get all sections for a domain
  getAllSections(domain) {
    const sections = [];
    for (const part of domain.parts) {
      for (const chapter of part.chapters) {
        for (const section of chapter.sections) {
          sections.push(section);
        }
      }
    }
    return sections;
  },

  // Find chapter by ID
  findChapter(chapterId) {
    for (const domain of DOMAINS) {
      for (const part of domain.parts) {
        for (const chapter of part.chapters) {
          if (chapter.id === chapterId) {
            return { domain, part, chapter };
          }
        }
      }
    }
    return { domain: null, part: null, chapter: null };
  },

  // Find section by ID with prev/next navigation
  findSection(sectionId) {
    // Build flat list of all sections across the domain
    for (const domain of DOMAINS) {
      const allSections = this.getAllSections(domain);
      const idx = allSections.findIndex(s => s.id === sectionId);
      if (idx !== -1) {
        // Find the chapter containing this section
        let foundChapter = null;
        for (const part of domain.parts) {
          for (const chapter of part.chapters) {
            if (chapter.sections.some(s => s.id === sectionId)) {
              foundChapter = chapter;
              break;
            }
          }
          if (foundChapter) break;
        }
        return {
          domain,
          chapter: foundChapter,
          section: allSections[idx],
          prevSection: idx > 0 ? allSections[idx - 1] : null,
          nextSection: idx < allSections.length - 1 ? allSections[idx + 1] : null
        };
      }
    }
    return { domain: null, chapter: null, section: null, prevSection: null, nextSection: null };
  },

  // Quiz answer selection
  selectAnswer(questionId, key) {
    this.currentAnswers[questionId] = key;
    // Visual feedback
    const options = document.querySelectorAll(`[data-question="${questionId}"]`);
    options.forEach(opt => {
      opt.classList.remove('selected');
      if (opt.dataset.key === key) {
        opt.classList.add('selected');
      }
    });
  },

  // Submit quiz
  submitQuiz(type, domainId) {
    const domain = DOMAINS.find(d => d.id === parseInt(domainId));
    if (!domain) return;

    const questions = domain.preTestQuestions || [];
    let correct = 0;

    for (const q of questions) {
      const answer = this.currentAnswers[q.id];
      const optionEls = document.querySelectorAll(`[data-question="${q.id}"]`);
      
      optionEls.forEach(opt => {
        opt.style.pointerEvents = 'none';
        if (opt.dataset.key === q.correct) {
          opt.classList.add('correct');
        }
        if (answer && opt.dataset.key === answer && answer !== q.correct) {
          opt.classList.add('incorrect');
        }
      });

      // Show explanation
      const expEl = document.getElementById('exp-' + q.id);
      if (expEl) expEl.classList.add('visible');

      if (answer === q.correct) correct++;
    }

    const score = Math.round((correct / questions.length) * 100);
    const passed = score >= 70;

    // Save result
    const resultKey = `cisa_${type}_${domainId}`;
    const result = { score, answers: this.currentAnswers, date: new Date().toISOString() };
    localStorage.setItem(resultKey, JSON.stringify(result));

    // Show results
    const resultsEl = document.getElementById('quizResults');
    resultsEl.innerHTML = `
      <div class="quiz-score ${passed ? 'pass' : 'fail'}">${score}%</div>
      <p>${correct} out of ${questions.length} correct</p>
      <p>${passed ? '✓ Passed! Great job!' : '✗ Keep studying and try again.'}</p>
    `;
    resultsEl.classList.remove('hidden');

    // Hide submit button
    document.getElementById('btnSubmitQuiz').style.display = 'none';
  },

  // Get test result from localStorage
  getTestResult(type, domainId) {
    try {
      const key = `cisa_${type}_${domainId}`;
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());

// Also handle Enter key on login
document.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    const pwField = document.getElementById('password');
    if (pwField && document.activeElement === pwField) {
      App.handleLogin();
    }
  }
});
