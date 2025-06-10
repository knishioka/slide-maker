/**
 * Enhanced Google Apps Script Mocks
 * Provides comprehensive mocking for Google Apps Script APIs
 */

class EnhancedGASMocks {
  constructor() {
    this.presentations = new Map();
    this.slides = new Map();
    this.files = new Map();
    this.properties = new Map();
    this.logs = [];
    this.setupSlidesAppMock();
    this.setupDriveAppMock();
    this.setupUtilitiesMock();
    this.setupPropertiesServiceMock();
    this.setupUrlFetchAppMock();
    this.setupHtmlServiceMock();
    this.setupLoggerMock();
  }
  
  setupSlidesAppMock() {
    const self = this;
    
    global.SlidesApp = {
      create: jest.fn((title) => {
        if (!title || typeof title !== 'string') {
          throw new Error('Title is required');
        }
        const id = `presentation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const presentation = self.createMockPresentation(id, title);
        self.presentations.set(id, presentation);
        return presentation;
      }),
      
      openById: jest.fn((id) => {
        const presentation = self.presentations.get(id);
        if (!presentation) {
          throw new Error(`Presentation not found: ${id}`);
        }
        return presentation;
      }),
      
      getActivePresentation: jest.fn(() => {
        const presentations = Array.from(self.presentations.values());
        return presentations.length > 0 ? presentations[0] : null;
      }),
      
      newPresentation: jest.fn(() => {
        return global.SlidesApp.create('Untitled Presentation');
      })
    };
  }
  
  createMockPresentation(id, title) {
    const self = this;
    
    return {
      getId: () => id,
      getTitle: () => title,
      setTitle: jest.fn((newTitle) => { 
        title = newTitle;
        return this;
      }),
      
      getSlides: jest.fn(() => {
        return Array.from(self.slides.values())
          .filter(slide => slide.presentationId === id)
          .sort((a, b) => a.index - b.index);
      }),
      
      appendSlide: jest.fn((layout = 'BLANK') => {
        const slideId = `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const slideIndex = self.getSlideCount(id);
        const slide = self.createMockSlide(slideId, id, layout, slideIndex);
        self.slides.set(slideId, slide);
        return slide;
      }),
      
      insertSlide: jest.fn((index, layout = 'BLANK') => {
        const slideId = `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const slide = self.createMockSlide(slideId, id, layout, index);
        
        // Adjust indices of existing slides
        Array.from(self.slides.values())
          .filter(s => s.presentationId === id && s.index >= index)
          .forEach(s => s.index++);
        
        self.slides.set(slideId, slide);
        return slide;
      }),
      
      removeSlide: jest.fn((slide) => {
        const slideId = typeof slide === 'string' ? slide : slide.getId();
        self.slides.delete(slideId);
      }),
      
      getUrl: jest.fn(() => `https://docs.google.com/presentation/d/${id}/edit`),
      
      saveAndClose: jest.fn(() => {
        // Mock save operation
        return true;
      })
    };
  }
  
  createMockSlide(id, presentationId, layout, index = 0) {
    const self = this;
    
    return {
      getId: () => id,
      presentationId,
      layout,
      index,
      elements: [],
      
      getLayout: jest.fn(() => layout),
      
      insertTextBox: jest.fn((text, left = 0, top = 0, width = 100, height = 50) => {
        const textBoxId = `textbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const textBox = self.createMockTextBox(textBoxId, text, left, top, width, height);
        this.elements.push(textBox);
        return textBox;
      }),
      
      insertImage: jest.fn((imageUrl, left = 0, top = 0, width = 100, height = 100) => {
        const imageId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const image = self.createMockImage(imageId, imageUrl, left, top, width, height);
        this.elements.push(image);
        return image;
      }),
      
      insertShape: jest.fn((shapeType, left = 0, top = 0, width = 100, height = 100) => {
        const shapeId = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const shape = self.createMockShape(shapeId, shapeType, left, top, width, height);
        this.elements.push(shape);
        return shape;
      }),
      
      getPageElements: jest.fn(() => this.elements),
      
      remove: jest.fn(() => {
        self.slides.delete(id);
      }),
      
      duplicate: jest.fn(() => {
        const duplicateId = `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const duplicate = self.createMockSlide(duplicateId, presentationId, layout, index + 1);
        
        // Copy elements
        this.elements.forEach(element => {
          const elementCopy = { ...element };
          elementCopy.getId = () => `${element.getId()}-copy`;
          duplicate.elements.push(elementCopy);
        });
        
        self.slides.set(duplicateId, duplicate);
        return duplicate;
      })
    };
  }
  
  createMockTextBox(id, text, left, top, width, height) {
    let currentText = text || '';
    const currentStyle = {
      fontSize: 24,
      fontFamily: 'Arial',
      color: '#000000',
      bold: false,
      italic: false,
      underline: false
    };
    const position = { left, top, width, height };
    
    return {
      getId: () => id,
      
      getText: () => ({
        asString: () => currentText,
        setText: jest.fn((newText) => { 
          currentText = newText;
          return this;
        }),
        appendText: jest.fn((appendText) => {
          currentText += appendText;
          return this;
        })
      }),
      
      setText: jest.fn((newText) => { 
        currentText = newText;
        return this;
      }),
      
      getTextStyle: jest.fn(() => ({
        setFontSize: jest.fn((size) => { 
          currentStyle.fontSize = size;
          return this;
        }),
        setFontFamily: jest.fn((family) => { 
          currentStyle.fontFamily = family;
          return this;
        }),
        setForegroundColor: jest.fn((color) => { 
          currentStyle.color = color;
          return this;
        }),
        setBold: jest.fn((bold) => { 
          currentStyle.bold = bold;
          return this;
        }),
        setItalic: jest.fn((italic) => { 
          currentStyle.italic = italic;
          return this;
        }),
        setUnderline: jest.fn((underline) => { 
          currentStyle.underline = underline;
          return this;
        }),
        getFontSize: () => currentStyle.fontSize,
        getFontFamily: () => currentStyle.fontFamily,
        getForegroundColor: () => currentStyle.color,
        isBold: () => currentStyle.bold,
        isItalic: () => currentStyle.italic,
        isUnderline: () => currentStyle.underline
      })),
      
      setLeft: jest.fn((newLeft) => { 
        position.left = newLeft;
        return this;
      }),
      setTop: jest.fn((newTop) => { 
        position.top = newTop;
        return this;
      }),
      setWidth: jest.fn((newWidth) => { 
        position.width = newWidth;
        return this;
      }),
      setHeight: jest.fn((newHeight) => { 
        position.height = newHeight;
        return this;
      }),
      
      getLeft: () => position.left,
      getTop: () => position.top,
      getWidth: () => position.width,
      getHeight: () => position.height,
      
      remove: jest.fn(() => {
        // Remove from parent slide's elements
        return true;
      })
    };
  }
  
  createMockImage(id, imageUrl, left, top, width, height) {
    const position = { left, top, width, height };
    let currentImageUrl = imageUrl;
    
    return {
      getId: () => id,
      
      getImageUrl: () => currentImageUrl,
      setImageUrl: jest.fn((url) => {
        currentImageUrl = url;
        return this;
      }),
      
      setLeft: jest.fn((newLeft) => { 
        position.left = newLeft;
        return this;
      }),
      setTop: jest.fn((newTop) => { 
        position.top = newTop;
        return this;
      }),
      setWidth: jest.fn((newWidth) => { 
        position.width = newWidth;
        return this;
      }),
      setHeight: jest.fn((newHeight) => { 
        position.height = newHeight;
        return this;
      }),
      
      getLeft: () => position.left,
      getTop: () => position.top,
      getWidth: () => position.width,
      getHeight: () => position.height,
      
      replace: jest.fn((imageUrl) => {
        currentImageUrl = imageUrl;
        return this;
      }),
      
      remove: jest.fn(() => {
        return true;
      })
    };
  }
  
  createMockShape(id, shapeType, left, top, width, height) {
    const position = { left, top, width, height };
    const currentShapeType = shapeType || 'RECTANGLE';
    let fillColor = '#FFFFFF';
    const borderColor = '#000000';
    let borderWidth = 1;
    
    return {
      getId: () => id,
      
      getShapeType: () => currentShapeType,
      
      getFill: jest.fn(() => ({
        setSolidFill: jest.fn((color) => {
          fillColor = color;
          return this;
        }),
        getSolidFill: jest.fn(() => ({
          getColor: () => fillColor
        }))
      })),
      
      getBorder: jest.fn(() => ({
        setDashStyle: jest.fn(() => this),
        setTransparency: jest.fn(() => this),
        setWeight: jest.fn((weight) => {
          borderWidth = weight;
          return this;
        }),
        getWeight: () => borderWidth
      })),
      
      setLeft: jest.fn((newLeft) => { 
        position.left = newLeft;
        return this;
      }),
      setTop: jest.fn((newTop) => { 
        position.top = newTop;
        return this;
      }),
      setWidth: jest.fn((newWidth) => { 
        position.width = newWidth;
        return this;
      }),
      setHeight: jest.fn((newHeight) => { 
        position.height = newHeight;
        return this;
      }),
      
      getLeft: () => position.left,
      getTop: () => position.top,
      getWidth: () => position.width,
      getHeight: () => position.height,
      
      remove: jest.fn(() => {
        return true;
      })
    };
  }
  
  setupDriveAppMock() {
    const self = this;
    
    global.DriveApp = {
      createFile: jest.fn((name, content, mimeType) => {
        const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const file = self.createMockFile(id, name, content, mimeType);
        self.files.set(id, file);
        return file;
      }),
      
      getFileById: jest.fn((id) => {
        const file = self.files.get(id);
        if (!file) {
          throw new Error(`File not found: ${id}`);
        }
        return file;
      }),
      
      getFiles: jest.fn(() => ({
        hasNext: () => self.files.size > 0,
        next: () => Array.from(self.files.values())[0]
      })),
      
      getFolderById: jest.fn((id) => ({
        getId: () => id,
        getName: () => 'Mock Folder',
        getFiles: () => global.DriveApp.getFiles()
      }))
    };
  }
  
  createMockFile(id, name, content, mimeType) {
    const self = this;
    const currentContent = content || '';
    let currentName = name || 'Untitled';
    let trashed = false;
    
    return {
      getId: () => id,
      getName: () => currentName,
      setName: jest.fn((newName) => {
        currentName = newName;
        return this;
      }),
      
      getBlob: jest.fn(() => ({
        getBytes: () => new Uint8Array(Buffer.from(currentContent)),
        getContentType: () => mimeType || 'text/plain',
        setContentType: jest.fn((type) => {
          mimeType = type;
          return this;
        })
      })),
      
      getContentType: () => mimeType || 'text/plain',
      
      setTrashed: jest.fn((shouldTrash) => {
        trashed = shouldTrash;
        if (trashed) {
          self.files.delete(id);
        }
        return this;
      }),
      
      isTrashed: () => trashed,
      
      getUrl: jest.fn(() => `https://drive.google.com/file/d/${id}/view`),
      
      getDownloadUrl: jest.fn(() => `https://drive.google.com/uc?id=${id}&export=download`),
      
      makeCopy: jest.fn((newName) => {
        const copyId = `file-${Date.now()}-copy`;
        const copy = self.createMockFile(copyId, newName || `Copy of ${currentName}`, currentContent, mimeType);
        self.files.set(copyId, copy);
        return copy;
      })
    };
  }
  
  setupUtilitiesMock() {
    global.Utilities = {
      sleep: jest.fn((milliseconds) => {
        // Mock sleep - in real tests, this would pause execution
        return;
      }),
      
      base64Encode: jest.fn((data) => {
        if (typeof data === 'string') {
          return Buffer.from(data).toString('base64');
        }
        return Buffer.from(data).toString('base64');
      }),
      
      base64Decode: jest.fn((encoded) => {
        return Buffer.from(encoded, 'base64').toString();
      }),
      
      formatDate: jest.fn((date, timeZone, format) => {
        if (!date) {
          return '';
        }
        return date.toISOString();
      }),
      
      formatString: jest.fn((template, ...args) => {
        return template.replace(/%s/g, () => args.shift() || '');
      }),
      
      getUuid: jest.fn(() => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }),
      
      jsonParse: jest.fn((jsonString) => {
        return JSON.parse(jsonString);
      }),
      
      jsonStringify: jest.fn((object) => {
        return JSON.stringify(object);
      })
    };
  }
  
  setupPropertiesServiceMock() {
    const self = this;
    
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: jest.fn((key) => self.properties.get(key)),
        setProperty: jest.fn((key, value) => {
          self.properties.set(key, value);
          return this;
        }),
        getProperties: jest.fn(() => Object.fromEntries(self.properties)),
        deleteProperty: jest.fn((key) => {
          self.properties.delete(key);
          return this;
        }),
        setProperties: jest.fn((properties) => {
          Object.entries(properties).forEach(([key, value]) => {
            self.properties.set(key, value);
          });
          return this;
        })
      }),
      
      getUserProperties: () => ({
        getProperty: jest.fn((key) => self.properties.get(`user_${key}`)),
        setProperty: jest.fn((key, value) => {
          self.properties.set(`user_${key}`, value);
          return this;
        }),
        getProperties: jest.fn(() => {
          const userProps = {};
          self.properties.forEach((value, key) => {
            if (key.startsWith('user_')) {
              userProps[key.substring(5)] = value;
            }
          });
          return userProps;
        }),
        deleteProperty: jest.fn((key) => {
          self.properties.delete(`user_${key}`);
          return this;
        })
      })
    };
  }
  
  setupUrlFetchAppMock() {
    global.UrlFetchApp = {
      fetch: jest.fn((url, params = {}) => {
        // Mock different URL responses
        let responseContent = '{"status": "success"}';
        let responseCode = 200;
        
        if (url.includes('error')) {
          responseCode = 500;
          responseContent = '{"error": "Server error"}';
        } else if (url.includes('notfound')) {
          responseCode = 404;
          responseContent = '{"error": "Not found"}';
        }
        
        return {
          getContentText: jest.fn(() => responseContent),
          getResponseCode: jest.fn(() => responseCode),
          getHeaders: jest.fn(() => ({
            'Content-Type': 'application/json'
          })),
          getBlob: jest.fn(() => ({
            getBytes: () => new Uint8Array(Buffer.from(responseContent))
          }))
        };
      }),
      
      fetchAll: jest.fn((requests) => {
        return requests.map(request => 
          global.UrlFetchApp.fetch(request.url || request, request.params));
      })
    };
  }
  
  setupHtmlServiceMock() {
    global.HtmlService = {
      createHtmlOutput: jest.fn((html) => ({
        setTitle: jest.fn((title) => this),
        setWidth: jest.fn((width) => this),
        setHeight: jest.fn((height) => this),
        getContent: jest.fn(() => html || ''),
        append: jest.fn((content) => {
          html += content;
          return this;
        })
      })),
      
      createHtmlOutputFromFile: jest.fn((filename) => ({
        setTitle: jest.fn((title) => this),
        setWidth: jest.fn((width) => this),
        setHeight: jest.fn((height) => this),
        getContent: jest.fn(() => `<html><body>Mock content from ${filename}</body></html>`)
      })),
      
      createTemplate: jest.fn((html) => ({
        evaluate: jest.fn(() => global.HtmlService.createHtmlOutput(html)),
        getCode: jest.fn(() => html || ''),
        getRawContent: jest.fn(() => html || '')
      }))
    };
  }
  
  setupLoggerMock() {
    const self = this;
    
    global.Logger = {
      log: jest.fn((message, ...args) => {
        const logEntry = {
          message,
          args,
          timestamp: new Date().toISOString()
        };
        self.logs.push(logEntry);
        console.log(`[GAS Logger] ${message}`, ...args);
      }),
      
      clear: jest.fn(() => {
        self.logs = [];
      }),
      
      getLog: jest.fn(() => {
        return self.logs.map(entry => 
          `${entry.timestamp}: ${entry.message} ${entry.args.join(' ')}`).join('\n');
      })
    };
  }
  
  // Utility methods for test setup and verification
  reset() {
    this.presentations.clear();
    this.slides.clear();
    this.files.clear();
    this.properties.clear();
    this.logs = [];
    jest.clearAllMocks();
  }
  
  createTestPresentation(title = 'Test Presentation') {
    return global.SlidesApp.create(title);
  }
  
  createTestSlide(presentationId, layout = 'BLANK') {
    const presentation = this.presentations.get(presentationId);
    if (presentation) {
      return presentation.appendSlide(layout);
    }
    throw new Error(`Presentation not found: ${presentationId}`);
  }
  
  getSlideCount(presentationId) {
    return Array.from(this.slides.values())
      .filter(slide => slide.presentationId === presentationId).length;
  }
  
  getAllPresentations() {
    return Array.from(this.presentations.values());
  }
  
  getAllSlides() {
    return Array.from(this.slides.values());
  }
  
  getAllFiles() {
    return Array.from(this.files.values());
  }
  
  getProperties() {
    return Object.fromEntries(this.properties);
  }
  
  getLogs() {
    return [...this.logs];
  }
  
  // Simulation methods for testing error conditions
  simulateRateLimit() {
    const originalCreate = global.SlidesApp.create;
    let callCount = 0;
    
    global.SlidesApp.create = jest.fn((title) => {
      callCount++;
      if (callCount <= 2) {
        throw new Error('Rate limit exceeded');
      }
      return originalCreate.call(this, title);
    });
    
    return () => {
      global.SlidesApp.create = originalCreate;
    };
  }
  
  simulateNetworkError() {
    const originalFetch = global.UrlFetchApp.fetch;
    
    global.UrlFetchApp.fetch = jest.fn(() => {
      throw new Error('Network timeout');
    });
    
    return () => {
      global.UrlFetchApp.fetch = originalFetch;
    };
  }
  
  simulateQuotaExceeded() {
    const originalCreate = global.SlidesApp.create;
    
    global.SlidesApp.create = jest.fn(() => {
      throw new Error('Quota exceeded');
    });
    
    return () => {
      global.SlidesApp.create = originalCreate;
    };
  }
}

// Export for use in tests
module.exports = EnhancedGASMocks;

// Also make it available globally for easy access
global.EnhancedGASMocks = EnhancedGASMocks;