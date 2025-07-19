// Enhanced Miscellaneous Data Generator with Multi-language Support
class MiscDataGenerator {
  constructor() {
    this.DATA = {
      tr: {
        maleNames: [],
        femaleNames: [],
        surnames: [],
        emails: [],
        addresses: [],
        passwords: []
      },
      en: {
        maleNames: [],
        femaleNames: [],
        surnames: [],
        emails: [],
        addresses: [],
        passwords: []
      }
    };
    
    this.isLoading = false;
    this.loadPromise = null;
    this.currentLanguage = 'en';
    
    this.initialize();
  }
  
  async initialize() {
    // Listen for language changes
    window.addEventListener('languageChanged', (e) => {
      this.currentLanguage = e.detail.language;
    });
    
    // Get current language from i18n
    if (window.i18n) {
      this.currentLanguage = window.i18n.getCurrentLanguage();
    }
    
    await this.loadAllData();
    this.initializeUI();
  }
  
  async loadAllData() {
    if (this.isLoading) {
      return this.loadPromise;
    }
    
    this.isLoading = true;
    this.showLoading(true);
    
    this.loadPromise = this.performDataLoad();
    
    try {
      await this.loadPromise;
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showFeedback(window.i18n?.translate('msg-loading-error') || 'Error loading data', 'error');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
    
    return this.loadPromise;
  }
  
  async performDataLoad() {
    const dataFiles = {
      tr: {
        maleNames: 'data/maleFirstName.json',
        femaleNames: 'data/femaleFirstName.json',
        surnames: 'data/surname.json',
        emails: 'data/email.json',
        addresses: 'data/address.json',
        passwords: 'data/password.json'
      },
      en: {
        maleNames: 'data/enMaleFirstName.json',
        femaleNames: 'data/enFemaleFirstName.json',
        surnames: 'data/enSurname.json',
        emails: 'data/email.json', // Shared
        addresses: 'data/enAddress.json',
        passwords: 'data/password.json' // Shared
      }
    };
    
    const loadLanguageData = async (lang) => {
      const files = dataFiles[lang];
      const results = await Promise.allSettled([
        this.loadJSONFile(files.maleNames),
        this.loadJSONFile(files.femaleNames),
        this.loadJSONFile(files.surnames),
        this.loadJSONFile(files.emails),
        this.loadJSONFile(files.addresses),
        this.loadJSONFile(files.passwords)
      ]);
      
      return {
        maleNames: results[0].status === 'fulfilled' ? results[0].value : [],
        femaleNames: results[1].status === 'fulfilled' ? results[1].value : [],
        surnames: results[2].status === 'fulfilled' ? results[2].value : [],
        emails: results[3].status === 'fulfilled' ? results[3].value : [],
        addresses: results[4].status === 'fulfilled' ? results[4].value : [],
        passwords: results[5].status === 'fulfilled' ? results[5].value : []
      };
    };
    
    // Load both languages in parallel
    const [trData, enData] = await Promise.all([
      loadLanguageData('tr'),
      loadLanguageData('en')
    ]);
    
    this.DATA.tr = trData;
    this.DATA.en = enData;
  }
  
  async loadJSONFile(path) {
    try {
      let url;
      
      // Use chrome.runtime.getURL for extension compatibility
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        url = chrome.runtime.getURL(path);
      } else {
        // Fallback for development - relative path
        url = path;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.warn(`Failed to load ${path}:`, error);
      return [];
    }
  }
  
  getCurrentData() {
    return this.DATA[this.currentLanguage] || this.DATA.en;
  }
  
  getRandomItem(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return '';
    }
    return array[Math.floor(Math.random() * array.length)];
  }
  
  generateFullName(gender) {
    const data = this.getCurrentData();
    const nameArray = gender === 'male' ? data.maleNames : data.femaleNames;
    const firstName = this.getRandomItem(nameArray);
    const surname = this.getRandomItem(data.surnames);
    return `${firstName} ${surname}`;
  }
  
  sanitizeEmailLocalPart(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[çğıöşü]/g, match => {
        const map = { 'ç': 'c', 'ğ': 'g', 'ı': 'i', 'ö': 'o', 'ş': 's', 'ü': 'u' };
        return map[match] || match;
      })
      .replace(/[^a-z0-9.]/g, '')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '');
  }
  
  generateEmail(domainType, customDomain) {
    const data = this.getCurrentData();
    
    if (domainType === 'random') {
      return this.getRandomItem(data.emails);
    }
    
    // Generate a structured email
    const gender = Math.random() > 0.5 ? 'male' : 'female';
    const fullName = this.generateFullName(gender);
    let localPart = fullName.toLowerCase().replace(/\s+/g, '.');
    localPart = this.sanitizeEmailLocalPart(localPart);
    
    // Fallback if sanitization results in empty string
    if (!localPart) {
      localPart = 'user' + Math.floor(Math.random() * 1000);
    }
    
    let domain;
    if (domainType === 'custom') {
      domain = customDomain?.trim();
      if (!domain || !this.isValidDomain(domain)) {
        domain = 'example.com';
      }
    } else {
      domain = domainType;
    }
    
    return `${localPart}@${domain}`;
  }
  
  isValidDomain(domain) {
    const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/;
    return domainRegex.test(domain) && domain.length <= 253;
  }
  
  generateAddress() {
    const data = this.getCurrentData();
    return this.getRandomItem(data.addresses);
  }
  
  generatePassword() {
    const data = this.getCurrentData();
    return this.getRandomItem(data.passwords);
  }
  
  initializeUI() {
    const dataType = document.getElementById('dataType');
    const nameOptions = document.getElementById('nameOptions');
    const emailOptions = document.getElementById('emailOptions');
    const emailDomain = document.getElementById('emailDomain');
    const customDomain = document.getElementById('customDomain');
    const generateButton = document.getElementById('generateMiscButton');
    const copyButton = document.getElementById('copyMiscButton');
    const resultText = document.getElementById('miscResultText');
    
    if (!dataType) return;
    
    // Data type change handler
    dataType.addEventListener('change', () => {
      this.updateOptionGroups();
    });
    
    // Email domain change handler
    emailDomain?.addEventListener('change', () => {
      const isCustom = emailDomain.value === 'custom';
      if (customDomain) {
        customDomain.style.display = isCustom ? 'block' : 'none';
        customDomain.required = isCustom;
      }
    });
    
    // Generate button handler
    generateButton?.addEventListener('click', () => {
      this.handleGenerate();
    });
    
    // Copy button handler
    copyButton?.addEventListener('click', () => {
      this.handleCopy();
    });
    
    // Initialize option groups visibility
    this.updateOptionGroups();
  }
  
  updateOptionGroups() {
    const dataType = document.getElementById('dataType');
    const nameOptions = document.getElementById('nameOptions');
    const emailOptions = document.getElementById('emailOptions');
    
    if (!dataType) return;
    
    const selectedType = dataType.value;
    
    if (nameOptions) {
      nameOptions.style.display = selectedType === 'name' ? 'flex' : 'none';
    }
    
    if (emailOptions) {
      emailOptions.style.display = selectedType === 'email' ? 'flex' : 'none';
    }
  }
  
  async handleGenerate() {
    // Ensure data is loaded
    if (this.isLoading) {
      await this.loadAllData();
    }
    
    const dataType = document.getElementById('dataType');
    const resultText = document.getElementById('miscResultText');
    const bulkCount = document.getElementById('bulkCount');
    const outputFormat = document.getElementById('outputFormat');
    
    if (!dataType || !resultText) return;
    
    const count = parseInt(bulkCount?.value) || 1;
    const format = outputFormat?.value || 'plain';
    
    if (count > 1000) {
      this.showFeedback('Maximum count is 1000', 'error');
      return;
    }
    
    try {
      const results = [];
      
      for (let i = 0; i < count; i++) {
        let singleResult = '';
        
        switch (dataType.value) {
          case 'name':
            const genderElement = document.querySelector('input[name="gender"]:checked');
            const gender = genderElement ? genderElement.value : 'male';
            singleResult = this.generateFullName(gender);
            break;
            
          case 'email':
            const emailDomain = document.getElementById('emailDomain');
            const customDomain = document.getElementById('customDomain');
            const domainValue = emailDomain ? emailDomain.value : 'random';
            const customValue = customDomain ? customDomain.value : '';
            singleResult = this.generateEmail(domainValue, customValue);
            break;
            
          case 'address':
            singleResult = this.generateAddress();
            break;
            
          case 'password':
            singleResult = this.generatePassword();
            break;
            
          default:
            this.showFeedback(window.i18n?.translate('msg-select-type') || 'Please select a data type', 'error');
            return;
        }
        
        if (!singleResult) {
          this.showFeedback(window.i18n?.translate('msg-loading-error') || 'Error generating data', 'error');
          return;
        }
        
        results.push(singleResult);
      }
      
      // Format output
      let finalResult = '';
      
      switch (format) {
        case 'plain':
          finalResult = results.join('\n');
          break;
          
        case 'json':
          finalResult = JSON.stringify(results, null, 2);
          break;
          
        case 'json-with-id':
          const dataWithIds = results.map((item, index) => ({
            id: index + 1,
            value: item
          }));
          finalResult = JSON.stringify(dataWithIds, null, 2);
          break;
          
        default:
          finalResult = results.join('\n');
      }
      
      resultText.value = finalResult;
      
    } catch (error) {
      console.error('Generation error:', error);
      this.showFeedback(window.i18n?.translate('msg-loading-error') || 'Error generating data', 'error');
    }
  }
  
  handleCopy() {
    const resultText = document.getElementById('miscResultText');
    
    if (!resultText || !resultText.value.trim()) {
      this.showFeedback(window.i18n?.translate('msg-no-text') || 'No text to copy', 'error');
      return;
    }
    
    navigator.clipboard.writeText(resultText.value)
      .then(() => {
        this.showFeedback(window.i18n?.translate('msg-copied') || 'Copied to clipboard!', 'success');
      })
      .catch((error) => {
        console.error('Copy failed:', error);
        this.showFeedback(window.i18n?.translate('msg-copy-failed') || 'Failed to copy to clipboard', 'error');
      });
  }
  
  showLoading(show) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
      loadingOverlay.style.display = show ? 'flex' : 'none';
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
    document.body.appendChild(feedbackElement);
    
    setTimeout(() => {
      feedbackElement.remove();
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.miscDataGenerator = new MiscDataGenerator();
});

// Legacy function for backward compatibility
function initializeMiscTab() {
  if (window.miscDataGenerator) {
    window.miscDataGenerator.initializeUI();
  }
}
