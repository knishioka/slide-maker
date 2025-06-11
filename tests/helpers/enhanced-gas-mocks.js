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
    this.mockFn = global.mockFn || this.createMockFn;
    this.setupSlidesAppMock();
    this.setupDriveAppMock();
    this.setupUtilitiesMock();
    this.setupPropertiesServiceMock();
    this.setupUrlFetchAppMock();
    this.setupHtmlServiceMock();
    this.setupLoggerMock();
  }

  createMockFn(implementation) {
    const mockData = {
      calls: [],
      results: [],
      instances: [],
      implementation: implementation || (() => {}),
      returnValue: undefined,
      hasReturnValue: false
    };
    
    const mockFunction = function (...args) {
      mockData.calls.push([...args]);
      mockData.instances.push(this);
      
      try {
        let result;
        if (mockData.hasReturnValue) {
          result = mockData.returnValue;
        } else {
          result = mockData.implementation.apply(this, args);
        }
        
        mockData.results.push({ type: 'return', value: result });
        return result;
      } catch (error) {
        mockData.results.push({ type: 'throw', value: error });
        throw error;
      }
    };
    
    mockFunction.mock = mockData;
    mockFunction.mockReturnValue = (value) => {
      mockData.returnValue = value;
      mockData.hasReturnValue = true;
      return mockFunction;
    };
    
    mockFunction.mockImplementation = (impl) => {
      mockData.implementation = impl;
      mockData.hasReturnValue = false;
      return mockFunction;
    };
    
    return mockFunction;
  }
  
  setupSlidesAppMock() {
    const self = this;
    
    global.SlidesApp = {
      create: this.mockFn((title) => {
        if (!title || typeof title !== 'string') {
          throw new Error('Title is required');
        }
        const id = `presentation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const presentation = self.createMockPresentation(id, title);
        self.presentations.set(id, presentation);
        return presentation;
      }),
      
      openById: this.mockFn((id) => {
        const presentation = self.presentations.get(id);
        if (!presentation) {
          throw new Error(`Presentation not found: ${id}`);
        }
        return presentation;
      }),
      
      getActivePresentation: this.mockFn(() => {
        const presentations = Array.from(self.presentations.values());
        return presentations.length > 0 ? presentations[0] : null;
      }),
      
      newPresentation: this.mockFn(() => {
        return global.SlidesApp.create('Untitled Presentation');
      })
    };
  }
  
  createMockPresentation(id, title) {
    const self = this;
    
    return {
      getId: () => id,
      getTitle: () => title,
      setTitle: this.mockFn((newTitle) => { 
        title = newTitle;
        return this;
      }),
      
      getSlides: this.mockFn(() => {
        return Array.from(self.slides.values())
          .filter(slide => slide.presentationId === id)
          .sort((a, b) => a.index - b.index);
      }),
      
      appendSlide: this.mockFn((layout = 'BLANK') => {
        const slideId = `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const slideIndex = self.getSlideCount(id);
        const slide = self.createMockSlide(slideId, id, layout, slideIndex);
        self.slides.set(slideId, slide);
        return slide;
      }),
      
      insertSlide: this.mockFn((index, layout = 'BLANK') => {
        const slideId = `slide-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const slide = self.createMockSlide(slideId, id, layout, index);
        
        // Adjust indices of existing slides
        Array.from(self.slides.values())
          .filter(s => s.presentationId === id && s.index >= index)
          .forEach(s => s.index++);
        
        self.slides.set(slideId, slide);
        return slide;
      }),
      
      removeSlide: this.mockFn((slide) => {
        const slideId = typeof slide === 'string' ? slide : slide.getId();
        self.slides.delete(slideId);
      }),
      
      getUrl: this.mockFn(() => `https://docs.google.com/presentation/d/${id}/edit`),
      
      saveAndClose: this.mockFn(() => {
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
      
      getLayout: this.mockFn(() => layout),
      
      insertTextBox: this.mockFn((text, left = 0, top = 0, width = 100, height = 50) => {
        const textBoxId = `textbox-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const textBox = self.createMockTextBox(textBoxId, text, left, top, width, height);
        this.elements.push(textBox);
        return textBox;
      }),
      
      insertImage: this.mockFn((imageUrl, left = 0, top = 0, width = 100, height = 100) => {
        const imageId = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const image = self.createMockImage(imageId, imageUrl, left, top, width, height);
        this.elements.push(image);
        return image;
      }),
      
      insertShape: this.mockFn((shapeType, left = 0, top = 0, width = 100, height = 100) => {
        const shapeId = `shape-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const shape = self.createMockShape(shapeId, shapeType, left, top, width, height);
        this.elements.push(shape);
        return shape;
      }),
      
      getPageElements: this.mockFn(() => this.elements),
      
      remove: this.mockFn(() => {
        self.slides.delete(id);
      }),
      
      duplicate: this.mockFn(() => {
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
        setText: this.mockFn((newText) => { 
          currentText = newText;
          return this;
        }),
        appendText: this.mockFn((appendText) => {
          currentText += appendText;
          return this;
        })
      }),
      
      setText: this.mockFn((newText) => { 
        currentText = newText;
        return this;
      }),
      
      getTextStyle: this.mockFn(() => ({
        setFontSize: this.mockFn((size) => { 
          currentStyle.fontSize = size;
          return this;
        }),
        setFontFamily: this.mockFn((family) => { 
          currentStyle.fontFamily = family;
          return this;
        }),
        setForegroundColor: this.mockFn((color) => { 
          currentStyle.color = color;
          return this;
        }),
        setBold: this.mockFn((bold) => { 
          currentStyle.bold = bold;
          return this;
        }),
        setItalic: this.mockFn((italic) => { 
          currentStyle.italic = italic;
          return this;
        }),
        setUnderline: this.mockFn((underline) => { 
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
      
      setLeft: this.mockFn((newLeft) => { 
        position.left = newLeft;
        return this;
      }),
      setTop: this.mockFn((newTop) => { 
        position.top = newTop;
        return this;
      }),
      setWidth: this.mockFn((newWidth) => { 
        position.width = newWidth;
        return this;
      }),
      setHeight: this.mockFn((newHeight) => { 
        position.height = newHeight;
        return this;
      }),
      
      getLeft: () => position.left,
      getTop: () => position.top,
      getWidth: () => position.width,
      getHeight: () => position.height,
      
      remove: this.mockFn(() => {
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
      setImageUrl: this.mockFn((url) => {
        currentImageUrl = url;
        return this;
      }),
      
      setLeft: this.mockFn((newLeft) => { 
        position.left = newLeft;
        return this;
      }),
      setTop: this.mockFn((newTop) => { 
        position.top = newTop;
        return this;
      }),
      setWidth: this.mockFn((newWidth) => { 
        position.width = newWidth;
        return this;
      }),
      setHeight: this.mockFn((newHeight) => { 
        position.height = newHeight;
        return this;
      }),
      
      getLeft: () => position.left,
      getTop: () => position.top,
      getWidth: () => position.width,
      getHeight: () => position.height,
      
      replace: this.mockFn((imageUrl) => {
        currentImageUrl = imageUrl;
        return this;
      }),
      
      remove: this.mockFn(() => {
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
      
      getFill: this.mockFn(() => ({
        setSolidFill: this.mockFn((color) => {
          fillColor = color;
          return this;
        }),
        getSolidFill: this.mockFn(() => ({
          getColor: () => fillColor
        }))
      })),
      
      getBorder: this.mockFn(() => ({
        setDashStyle: this.mockFn(() => this),
        setTransparency: this.mockFn(() => this),
        setWeight: this.mockFn((weight) => {
          borderWidth = weight;
          return this;
        }),
        getWeight: () => borderWidth
      })),
      
      setLeft: this.mockFn((newLeft) => { 
        position.left = newLeft;
        return this;
      }),
      setTop: this.mockFn((newTop) => { 
        position.top = newTop;
        return this;
      }),
      setWidth: this.mockFn((newWidth) => { 
        position.width = newWidth;
        return this;
      }),
      setHeight: this.mockFn((newHeight) => { 
        position.height = newHeight;
        return this;
      }),
      
      getLeft: () => position.left,
      getTop: () => position.top,
      getWidth: () => position.width,
      getHeight: () => position.height,
      
      remove: this.mockFn(() => {
        return true;
      })
    };
  }
  
  setupDriveAppMock() {
    const self = this;
    
    global.DriveApp = {
      createFile: this.mockFn((name, content, mimeType) => {
        const id = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const file = self.createMockFile(id, name, content, mimeType);
        self.files.set(id, file);
        return file;
      }),
      
      getFileById: this.mockFn((id) => {
        const file = self.files.get(id);
        if (!file) {
          throw new Error(`File not found: ${id}`);
        }
        return file;
      }),
      
      getFiles: this.mockFn(() => ({
        hasNext: () => self.files.size > 0,
        next: () => Array.from(self.files.values())[0]
      })),
      
      getFolderById: this.mockFn((id) => ({
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
      setName: this.mockFn((newName) => {
        currentName = newName;
        return this;
      }),
      
      getBlob: this.mockFn(() => ({
        getBytes: () => new Uint8Array(Buffer.from(currentContent)),
        getContentType: () => mimeType || 'text/plain',
        setContentType: this.mockFn((type) => {
          mimeType = type;
          return this;
        })
      })),
      
      getContentType: () => mimeType || 'text/plain',
      
      setTrashed: this.mockFn((shouldTrash) => {
        trashed = shouldTrash;
        if (trashed) {
          self.files.delete(id);
        }
        return this;
      }),
      
      isTrashed: () => trashed,
      
      getUrl: this.mockFn(() => `https://drive.google.com/file/d/${id}/view`),
      
      getDownloadUrl: this.mockFn(() => `https://drive.google.com/uc?id=${id}&export=download`),
      
      makeCopy: this.mockFn((newName) => {
        const copyId = `file-${Date.now()}-copy`;
        const copy = self.createMockFile(copyId, newName || `Copy of ${currentName}`, currentContent, mimeType);
        self.files.set(copyId, copy);
        return copy;
      })
    };
  }
  
  setupUtilitiesMock() {
    global.Utilities = {
      sleep: this.mockFn((milliseconds) => {
        // Mock sleep - in real tests, this would pause execution
        return;
      }),
      
      base64Encode: this.mockFn((data) => {
        if (typeof data === 'string') {
          return Buffer.from(data).toString('base64');
        }
        return Buffer.from(data).toString('base64');
      }),
      
      base64Decode: this.mockFn((encoded) => {
        return Buffer.from(encoded, 'base64').toString();
      }),
      
      formatDate: this.mockFn((date, timeZone, format) => {
        if (!date) {
          return '';
        }
        return date.toISOString();
      }),
      
      formatString: this.mockFn((template, ...args) => {
        return template.replace(/%s/g, () => args.shift() || '');
      }),
      
      getUuid: this.mockFn(() => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }),
      
      jsonParse: this.mockFn((jsonString) => {
        return JSON.parse(jsonString);
      }),
      
      jsonStringify: this.mockFn((object) => {
        return JSON.stringify(object);
      })
    };
  }
  
  setupPropertiesServiceMock() {
    const self = this;
    
    global.PropertiesService = {
      getScriptProperties: () => ({
        getProperty: this.mockFn((key) => self.properties.get(key)),
        setProperty: this.mockFn((key, value) => {
          self.properties.set(key, value);
          return this;
        }),
        getProperties: this.mockFn(() => Object.fromEntries(self.properties)),
        deleteProperty: this.mockFn((key) => {
          self.properties.delete(key);
          return this;
        }),
        setProperties: this.mockFn((properties) => {
          Object.entries(properties).forEach(([key, value]) => {
            self.properties.set(key, value);
          });
          return this;
        })
      }),
      
      getUserProperties: () => ({
        getProperty: this.mockFn((key) => self.properties.get(`user_${key}`)),
        setProperty: this.mockFn((key, value) => {
          self.properties.set(`user_${key}`, value);
          return this;
        }),
        getProperties: this.mockFn(() => {
          const userProps = {};
          self.properties.forEach((value, key) => {
            if (key.startsWith('user_')) {
              userProps[key.substring(5)] = value;
            }
          });
          return userProps;
        }),
        deleteProperty: this.mockFn((key) => {
          self.properties.delete(`user_${key}`);
          return this;
        })
      })
    };
  }
  
  setupUrlFetchAppMock() {
    global.UrlFetchApp = {
      fetch: this.mockFn((url, params = {}) => {
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
          getContentText: this.mockFn(() => responseContent),
          getResponseCode: this.mockFn(() => responseCode),
          getHeaders: this.mockFn(() => ({
            'Content-Type': 'application/json'
          })),
          getBlob: this.mockFn(() => ({
            getBytes: () => new Uint8Array(Buffer.from(responseContent))
          }))
        };
      }),
      
      fetchAll: this.mockFn((requests) => {
        return requests.map(request => 
          global.UrlFetchApp.fetch(request.url || request, request.params));
      })
    };
  }
  
  setupHtmlServiceMock() {
    global.HtmlService = {
      createHtmlOutput: this.mockFn((html) => ({
        setTitle: this.mockFn((title) => this),
        setWidth: this.mockFn((width) => this),
        setHeight: this.mockFn((height) => this),
        getContent: this.mockFn(() => html || ''),
        append: this.mockFn((content) => {
          html += content;
          return this;
        })
      })),
      
      createHtmlOutputFromFile: this.mockFn((filename) => ({
        setTitle: this.mockFn((title) => this),
        setWidth: this.mockFn((width) => this),
        setHeight: this.mockFn((height) => this),
        getContent: this.mockFn(() => `<html><body>Mock content from ${filename}</body></html>`)
      })),
      
      createTemplate: this.mockFn((html) => ({
        evaluate: this.mockFn(() => global.HtmlService.createHtmlOutput(html)),
        getCode: this.mockFn(() => html || ''),
        getRawContent: this.mockFn(() => html || '')
      }))
    };
  }
  
  setupLoggerMock() {
    const self = this;
    
    global.Logger = {
      log: this.mockFn((message, ...args) => {
        const logEntry = {
          message,
          args,
          timestamp: new Date().toISOString()
        };
        self.logs.push(logEntry);
        console.log(`[GAS Logger] ${message}`, ...args);
      }),
      
      clear: this.mockFn(() => {
        self.logs = [];
      }),
      
      getLog: this.mockFn(() => {
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
    
    global.SlidesApp.create = this.mockFn((title) => {
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
    
    global.UrlFetchApp.fetch = this.mockFn(() => {
      throw new Error('Network timeout');
    });
    
    return () => {
      global.UrlFetchApp.fetch = originalFetch;
    };
  }
  
  simulateQuotaExceeded() {
    const originalCreate = global.SlidesApp.create;
    
    global.SlidesApp.create = this.mockFn(() => {
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