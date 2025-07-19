// Enhanced Popup Management System
class PopupManager {
  constructor() {
    this.elements = {};
    this.isInitialized = false;
    this.initialize();
  }
  
  async initialize() {
    if (this.isInitialized) return;
    
    // Wait for i18n to be ready
    await this.waitForI18n();
    
    this.cacheElements();
    this.clearTextarea();
    this.initializeTabs();
    this.initializeCharacterCounter();
    this.bindEvents();
    this.updateUnitToggleText();
    
    this.isInitialized = true;
  }
  
  async waitForI18n() {
    let retries = 0;
    const maxRetries = 50; // 5 seconds max
    
    while (!window.i18n && retries < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100));
      retries++;
    }
  }
  
  cacheElements() {
    this.elements = {
      generateButton: document.getElementById('generateButton'),
      copyButton: document.getElementById('copyButton'),
      lengthInput: document.getElementById('lengthInput'),
      unitToggle: document.getElementById('unitToggle'),
      removePunct: document.getElementById('removePunct'),
      removeSpace: document.getElementById('removeSpace'),
      resultText: document.getElementById('resultText'),
      counterText: document.getElementById('counterText'),
      characterCount: document.getElementById('characterCount'),
      tabButtons: document.querySelectorAll('.tab-button'),
      tabContents: document.querySelectorAll('.tab-content')
    };
  }
  
  bindEvents() {
    // Generator events
    this.elements.generateButton?.addEventListener('click', () => {
      this.handleGenerate();
    });
    
    this.elements.copyButton?.addEventListener('click', () => {
      this.handleCopy();
    });
    
    // Input validation
    this.elements.lengthInput?.addEventListener('input', (e) => {
      this.validateLengthInput(e.target);
    });
    
    // Enter key support for generation
    this.elements.lengthInput?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        this.handleGenerate();
      }
    });
    
    // Unit toggle functionality
    this.elements.unitToggle?.addEventListener('click', () => {
      this.toggleUnit();
    });

    // Listen for language changes
    window.addEventListener('languageChanged', () => {
      this.updateCharacterCount();
      this.updateUnitToggleText();
    });
  }
  
  handleGenerate() {
    const length = parseInt(this.elements.lengthInput?.value);
    const removePunct = this.elements.removePunct?.checked || false;
    const removeSpace = this.elements.removeSpace?.checked || false;
    const unit = this.elements.unitToggle?.getAttribute('data-unit') || 'characters';
    
    // Validation
    if (!this.validateLength(length)) {
      return;
    }
    
    try {
      // Show loading state
      this.setGenerateButtonState(true);
      
      let generatedText;
      
      if (unit === 'words') {
        // Generate by word count
        generatedText = this.generateByWords(length, removeSpace, removePunct);
      } else {
        // Generate by character count (default)
        generatedText = window.generateLoremIpsum(length, removeSpace, removePunct);
      }
      
      if (this.elements.resultText) {
        this.elements.resultText.value = generatedText;
      }
      
    } catch (error) {
      console.error('Generation error:', error);
      this.showFeedback(
        window.i18n?.translate('msg-loading-error') || 'Error generating text', 
        'error'
      );
    } finally {
      this.setGenerateButtonState(false);
    }
  }
  
  validateLength(length) {
    if (isNaN(length) || length <= 0) {
      this.showFeedback(
        window.i18n?.translate('msg-invalid-length') || 'Please enter a valid positive number for length', 
        'error'
      );
      this.clearTextarea();
      return false;
    }
    
    if (length > 999999) {
      this.showFeedback(
        window.i18n?.translate('msg-max-length') || 'Maximum length is 999,999 characters', 
        'error'
      );
      this.clearTextarea();
      return false;
    }
    
    return true;
  }
  
  validateLengthInput(input) {
    const value = parseInt(input.value);
    
    // Visual feedback for invalid input
    if (input.value && (isNaN(value) || value <= 0)) {
      input.style.borderColor = '#f44336';
    } else if (input.value && value > 999999) {
      input.style.borderColor = '#ff9800';
    } else {
      input.style.borderColor = '';
    }
  }
  
  setGenerateButtonState(loading) {
    if (!this.elements.generateButton) return;
    
    if (loading) {
      this.elements.generateButton.disabled = true;
      this.elements.generateButton.textContent = window.i18n?.translate('loading') || 'Loading...';
    } else {
      this.elements.generateButton.disabled = false;
      this.elements.generateButton.textContent = window.i18n?.translate('btn-generate') || 'Generate Text';
    }
  }
  
  handleCopy() {
    const resultText = this.elements.resultText?.value;
    
    if (!resultText || !resultText.trim()) {
      this.showFeedback(
        window.i18n?.translate('msg-no-text') || 'No text to copy', 
        'error'
      );
      return;
    }
    
    navigator.clipboard.writeText(resultText)
      .then(() => {
        this.showFeedback(
          window.i18n?.translate('msg-copied') || 'Copied to clipboard!', 
          'success'
        );
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        this.showFeedback(
          window.i18n?.translate('msg-copy-failed') || 'Failed to copy to clipboard', 
          'error'
        );
      });
  }
  
  initializeTabs() {
    this.elements.tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.switchTab(button);
      });
    });
  }
  
  switchTab(activeButton) {
    // Remove active class from all buttons and contents
    this.elements.tabButtons.forEach(btn => btn.classList.remove('active'));
    this.elements.tabContents.forEach(content => content.classList.remove('active'));
    
    // Add active class to clicked button and corresponding content
    activeButton.classList.add('active');
    const tabId = activeButton.getAttribute('data-tab');
    const targetContent = document.getElementById(tabId);
    
    if (targetContent) {
      targetContent.classList.add('active');
    }
    
    // Focus management for accessibility
    const firstFocusableElement = targetContent?.querySelector(
      'input, button, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (firstFocusableElement) {
      firstFocusableElement.focus();
    }
  }
  
  initializeCharacterCounter() {
    if (!this.elements.counterText || !this.elements.characterCount) return;
    
    const updateCount = () => {
      this.updateCharacterCount();
    };
    
    this.elements.counterText.addEventListener('input', updateCount);
    this.elements.counterText.addEventListener('paste', () => {
      // Update count after paste
      setTimeout(updateCount, 10);
    });
    
    // Initialize with empty state
    updateCount();
  }
  
  updateCharacterCount() {
    if (!this.elements.counterText || !this.elements.characterCount) return;
    
    const text = this.elements.counterText.value;
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    const lines = text.trim() === '' ? 0 : text.split('\n').length;
    
    // Count sentences (split by ., !, ?)
    const sentences = text.trim() === '' ? 0 : 
      text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
    
    // Count paragraphs (split by double newlines or more)
    const paragraphs = text.trim() === '' ? 0 : 
      text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
    
    // Update individual stat values
    const charCount = document.getElementById('charCount');
    const wordCount = document.getElementById('wordCount');
    const lineCount = document.getElementById('lineCount');
    const sentenceCount = document.getElementById('sentenceCount');
    const paragraphCount = document.getElementById('paragraphCount');
    
    if (charCount) charCount.textContent = chars.toLocaleString();
    if (wordCount) wordCount.textContent = words.toLocaleString();
    if (lineCount) lineCount.textContent = lines.toLocaleString();
    if (sentenceCount) sentenceCount.textContent = sentences.toLocaleString();
    if (paragraphCount) paragraphCount.textContent = paragraphs.toLocaleString();
  }
  
  toggleUnit() {
    if (!this.elements.unitToggle) return;
    
    const currentUnit = this.elements.unitToggle.getAttribute('data-unit');
    const newUnit = currentUnit === 'characters' ? 'words' : 'characters';
    
    this.elements.unitToggle.setAttribute('data-unit', newUnit);
    this.updateUnitToggleText();
  }
  
  updateUnitToggleText() {
    if (!this.elements.unitToggle) return;
    
    const unit = this.elements.unitToggle.getAttribute('data-unit');
    const unitLabel = this.elements.unitToggle.querySelector('.unit-label');
    
    if (unitLabel) {
      const key = unit === 'words' ? 'unit-words' : 'unit-characters';
      unitLabel.textContent = window.i18n?.translate(key) || (unit === 'words' ? 'Words' : 'Characters');
    }
  }
  
  generateByWords(wordCount, removeSpace, removePunct) {
    const LOREM_WORDS = [
      'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit',
      'sed', 'do', 'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore',
      'magna', 'aliqua', 'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud',
      'exercitation', 'ullamco', 'laboris', 'nisi', 'aliquip', 'ex', 'ea', 'commodo',
      'consequat', 'duis', 'aute', 'irure', 'in', 'reprehenderit', 'voluptate',
      'velit', 'esse', 'cillum', 'fugiat', 'nulla', 'pariatur', 'excepteur', 'sint',
      'occaecat', 'cupidatat', 'non', 'proident', 'sunt', 'culpa', 'qui', 'officia',
      'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum'
    ];
    
    let words = [];
    for (let i = 0; i < wordCount; i++) {
      words.push(LOREM_WORDS[i % LOREM_WORDS.length]);
    }
    
    let result = words.join(' ');
    
    // Apply transformations
    if (removePunct) {
      result = result.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    }
    
    if (removeSpace) {
      result = result.replace(/\s+/g, '');
    }
    
    return result;
  }

  clearTextarea() {
    if (this.elements.resultText) {
      this.elements.resultText.value = '';
    }
  }
  
  showFeedback(message, type) {
    // Remove existing feedback
    const existingFeedback = document.querySelector('.feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }
    
    const feedbackElement = document.createElement('div');
    feedbackElement.textContent = message;
    feedbackElement.className = `feedback ${type}`;
    feedbackElement.setAttribute('role', 'alert');
    feedbackElement.setAttribute('aria-live', 'polite');
    
    document.body.appendChild(feedbackElement);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      feedbackElement.remove();
    }, 3000);
    
    // Remove on click
    feedbackElement.addEventListener('click', () => {
      feedbackElement.remove();
    });
  }
}

// Legacy compatibility functions
function clearTextarea() {
  if (window.popupManager) {
    window.popupManager.clearTextarea();
  }
}

function showFeedback(message, type) {
  if (window.popupManager) {
    window.popupManager.showFeedback(message, type);
  }
}

function copyToClipboard() {
  if (window.popupManager) {
    window.popupManager.handleCopy();
  }
}

function initializeTabs() {
  // Handled by PopupManager
}

function initializeCharacterCounter() {
  // Handled by PopupManager
}

function initializeMiscTab() {
  // Handled by MiscDataGenerator
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
  window.popupManager = new PopupManager();
  
  // Handle runtime connection for popup clearing
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      const port = chrome.runtime.connect({ name: 'popup' });
      port.onDisconnect.addListener(() => {
        // Clean up when popup closes
        if (window.popupManager) {
          window.popupManager.clearTextarea();
        }
      });
    }
  } catch (error) {
    console.warn('Could not establish runtime connection:', error);
  }
});

// Handle popup being reopened
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && window.popupManager) {
    window.popupManager.clearTextarea();
  }
});
