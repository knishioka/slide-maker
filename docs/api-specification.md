# Google Slides API Specification

## Overview

RESTful API for Google Slides content generation service built on Google Apps Script. Provides programmatic access to slide creation, content management, and presentation manipulation.

## Base URL

```
https://script.google.com/macros/s/{SCRIPT_ID}/exec
```

## Authentication

### API Key Authentication

Include API key in request header:

```http
X-API-Key: gas_your_api_key_here
```

Or as query parameter:

```http
GET /presentations?api_key=gas_your_api_key_here
```

### OAuth 2.0

For user-specific operations, use OAuth 2.0 with required scopes:

```
https://www.googleapis.com/auth/presentations
https://www.googleapis.com/auth/drive.file
```

## Request/Response Format

### Request Headers

```http
Content-Type: application/json
X-API-Key: your_api_key
```

### Response Format

All responses follow this structure:

```json
{
  "success": true|false,
  "statusCode": 200,
  "data": {...},
  "error": {...},
  "timestamp": "2025-01-11T10:30:00.000Z"
}
```

### Error Response Format

```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {...}
  },
  "timestamp": "2025-01-11T10:30:00.000Z"
}
```

## Rate Limiting

- **Authenticated users**: 100 requests/hour
- **API key users**: Based on key configuration
- **Anonymous users**: 10 requests/hour

Rate limit headers are included in responses:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1673431800
```

## Endpoints

### Health Check

#### GET /health

Check API service health and status.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "status": "healthy",
    "timestamp": "2025-01-11T10:30:00.000Z",
    "version": "1.0.0",
    "services": {
      "slides": {"status": "available"},
      "logger": {"status": "available"},
      "validation": {"status": "available"}
    }
  }
}
```

### Presentations

#### POST /presentations

Create a new presentation with slides.

**Request Body:**
```json
{
  "title": "My Presentation",
  "slides": [
    {
      "type": "title",
      "content": "Welcome to Our Presentation",
      "style": {
        "fontSize": 44,
        "fontFamily": "Arial",
        "color": "#1a73e8"
      }
    },
    {
      "type": "content",
      "content": "Main content text",
      "style": {
        "fontSize": 24,
        "fontFamily": "Arial",
        "color": "#202124"
      }
    }
  ],
  "theme": {
    "primaryColor": "#1a73e8",
    "backgroundColor": "#ffffff",
    "fontFamily": "Arial"
  },
  "layout": "single-column"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "presentationId": "1BxAB2CyDzE...",
    "title": "My Presentation",
    "slideCount": 2,
    "url": "https://docs.google.com/presentation/d/1BxAB2CyDzE...",
    "slides": [
      {
        "slideId": "slide1",
        "slideIndex": 0,
        "type": "title"
      },
      {
        "slideId": "slide2", 
        "slideIndex": 1,
        "type": "content"
      }
    ]
  }
}
```

#### GET /presentations/:id

Get presentation details.

**Parameters:**
- `id` (string): Presentation ID

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": "1BxAB2CyDzE...",
    "title": "My Presentation",
    "slideCount": 5,
    "url": "https://docs.google.com/presentation/d/1BxAB2CyDzE...",
    "lastModified": "2025-01-11T10:30:00.000Z"
  }
}
```

#### PUT /presentations/:id

Update presentation properties.

**Request Body:**
```json
{
  "title": "Updated Title",
  "theme": {
    "primaryColor": "#ff6900",
    "backgroundColor": "#f8f9fa"
  }
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "presentationId": "1BxAB2CyDzE...",
    "updated": true,
    "changes": ["title", "theme"]
  }
}
```

#### DELETE /presentations/:id

Delete a presentation.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "deleted": true,
    "id": "1BxAB2CyDzE..."
  }
}
```

### Slides

#### POST /presentations/:id/slides

Add a slide to existing presentation.

**Request Body:**
```json
{
  "type": "content",
  "title": "New Slide Title",
  "content": [
    {
      "type": "text",
      "text": "Slide content text",
      "style": {
        "fontSize": 24,
        "fontFamily": "Arial",
        "color": "#202124"
      },
      "position": {
        "x": 100,
        "y": 200,
        "width": 600,
        "height": 100
      }
    }
  ],
  "layout": "single-column"
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "slideId": "slide3",
    "slideIndex": 2,
    "presentationId": "1BxAB2CyDzE...",
    "type": "content"
  }
}
```

#### PUT /presentations/:id/slides/:slideId

Update slide content.

**Request Body:**
```json
{
  "title": "Updated Slide Title",
  "content": [
    {
      "type": "text", 
      "text": "Updated content",
      "style": {"fontSize": 26}
    }
  ]
}
```

#### DELETE /presentations/:id/slides/:slideId

Delete a slide from presentation.

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "deleted": true,
    "slideId": "slide3",
    "presentationId": "1BxAB2CyDzE..."
  }
}
```

### Content Validation

#### POST /validate

Validate slide content before creation.

**Request Body:**
```json
{
  "type": "text",
  "content": "Text to validate",
  "style": {
    "fontSize": 24,
    "fontFamily": "Arial"
  },
  "position": {
    "x": 100,
    "y": 200,
    "width": 600,
    "height": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "isValid": true,
    "errors": [],
    "warnings": ["Font size below recommended minimum"],
    "sanitized": {
      "type": "text",
      "content": "Sanitized text content",
      "style": {
        "fontSize": 24,
        "fontFamily": "Arial"
      }
    }
  }
}
```

### Batch Operations

#### POST /presentations/batch

Create multiple presentations in a single request.

**Request Body:**
```json
{
  "presentations": [
    {
      "title": "Presentation 1",
      "slides": [...],
      "options": {
        "theme": {...},
        "layout": "single-column"
      }
    },
    {
      "title": "Presentation 2", 
      "slides": [...],
      "options": {
        "theme": {...},
        "layout": "double-column"
      }
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "successful": [
      {
        "index": 0,
        "presentationId": "1BxAB2CyDzE...",
        "title": "Presentation 1"
      }
    ],
    "failed": [
      {
        "index": 1,
        "error": "Validation failed"
      }
    ],
    "summary": {
      "total": 2,
      "successful": 1,
      "failed": 1
    }
  }
}
```

## Content Types

### Text Content

```json
{
  "type": "text",
  "content": "Text content",
  "style": {
    "fontSize": 24,
    "fontFamily": "Arial",
    "color": "#000000",
    "bold": false,
    "italic": false
  },
  "position": {
    "x": 100,
    "y": 200,
    "width": 600,
    "height": 100
  }
}
```

### Image Content

```json
{
  "type": "image",
  "url": "https://example.com/image.jpg",
  "alt": "Image description",
  "position": {
    "x": 200,
    "y": 300,
    "width": 400,
    "height": 300
  }
}
```

### Mermaid Diagram

```json
{
  "type": "mermaid",
  "content": "graph TD\n  A[Start] --> B[Process]\n  B --> C[End]",
  "style": {
    "theme": "default",
    "backgroundColor": "#ffffff"
  },
  "position": {
    "x": 100,
    "y": 100,
    "width": 700,
    "height": 400
  }
}
```

### Table Content

```json
{
  "type": "table",
  "headers": ["Column 1", "Column 2", "Column 3"],
  "rows": [
    ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
    ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
  ],
  "style": {
    "headerStyle": {
      "fontSize": 18,
      "bold": true,
      "backgroundColor": "#f1f3f4"
    },
    "cellStyle": {
      "fontSize": 16,
      "color": "#202124"
    }
  },
  "position": {
    "x": 100,
    "y": 200,
    "width": 700,
    "height": 300
  }
}
```

## Layout Options

### Single Column Layout

```json
{
  "layout": "single-column",
  "options": {
    "margin": 60,
    "itemSpacing": 20,
    "maxItemsPerSlide": 5
  }
}
```

### Double Column Layout

```json
{
  "layout": "double-column",
  "options": {
    "margin": 60,
    "columnGap": 40,
    "itemSpacing": 15,
    "maxItemsPerSlide": 8
  }
}
```

### Title and Content Layout

```json
{
  "layout": "title-content",
  "options": {
    "titleHeight": 120,
    "contentMargin": 80,
    "titleStyle": {
      "fontSize": 44,
      "fontFamily": "Arial"
    },
    "contentStyle": {
      "fontSize": 24,
      "fontFamily": "Arial"
    }
  }
}
```

## Theme Configuration

```json
{
  "theme": {
    "primaryColor": "#1a73e8",
    "secondaryColor": "#34a853", 
    "backgroundColor": "#ffffff",
    "textColor": "#202124",
    "fontFamily": "Arial",
    "titleFontSize": 44,
    "bodyFontSize": 24,
    "captionFontSize": 18
  }
}
```

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_FAILED` | 400 | Request validation failed |
| `UNAUTHORIZED` | 401 | Authentication required |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Internal server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily unavailable |

## Limits and Quotas

### Content Limits

- Maximum slides per presentation: 300
- Maximum text content per slide: 50,000 characters
- Maximum image size: 25MB
- Maximum table size: 20x20 cells

### API Quotas

- Presentations created per day: 100 (per API key)
- Slides created per day: 1,000 (per API key) 
- API requests per hour: 100 (per API key)

### Google Apps Script Limits

- Script execution time: 6 minutes maximum
- Trigger execution time: 30 seconds maximum
- Memory usage: Limited by Google Apps Script runtime

## SDK Examples

### JavaScript/Node.js

```javascript
const SlidesAPI = require('@google-slides-api/client');

const client = new SlidesAPI({
  apiKey: 'your_api_key',
  baseURL: 'https://script.google.com/macros/s/{SCRIPT_ID}/exec'
});

// Create presentation
const presentation = await client.presentations.create({
  title: 'My Presentation',
  slides: [
    {
      type: 'title',
      content: 'Welcome',
      style: { fontSize: 44 }
    }
  ]
});

console.log('Created:', presentation.data.presentationId);
```

### Python

```python
import requests

class SlidesAPI:
    def __init__(self, api_key, base_url):
        self.api_key = api_key
        self.base_url = base_url
        
    def create_presentation(self, data):
        headers = {
            'Content-Type': 'application/json',
            'X-API-Key': self.api_key
        }
        
        response = requests.post(
            f"{self.base_url}/presentations",
            json=data,
            headers=headers
        )
        
        return response.json()

# Usage
api = SlidesAPI('your_api_key', 'https://script.google.com/macros/s/{SCRIPT_ID}/exec')

result = api.create_presentation({
    'title': 'My Presentation',
    'slides': [{
        'type': 'title',
        'content': 'Welcome',
        'style': {'fontSize': 44}
    }]
})

print(f"Created: {result['data']['presentationId']}")
```

### cURL

```bash
# Create presentation
curl -X POST \
  https://script.google.com/macros/s/{SCRIPT_ID}/exec \
  -H 'Content-Type: application/json' \
  -H 'X-API-Key: your_api_key' \
  -d '{
    "path": "/presentations",
    "method": "POST",
    "body": "{\"title\":\"My Presentation\",\"slides\":[{\"type\":\"title\",\"content\":\"Welcome\"}]}"
  }'

# Get presentation
curl -X GET \
  "https://script.google.com/macros/s/{SCRIPT_ID}/exec?path=/presentations/1BxAB2CyDzE&method=GET&api_key=your_api_key"
```

## Webhooks (Future Feature)

### Event Types

- `presentation.created`
- `presentation.updated`
- `presentation.deleted`
- `slide.added`
- `slide.updated`
- `slide.deleted`

### Webhook Payload

```json
{
  "event": "presentation.created",
  "timestamp": "2025-01-11T10:30:00.000Z",
  "data": {
    "presentationId": "1BxAB2CyDzE...",
    "title": "My Presentation",
    "userId": "user123"
  }
}
```

## Support and Resources

- **Documentation**: [API Docs](https://docs.google.com/document/d/{DOC_ID})
- **Support Email**: support@yourapp.com
- **Status Page**: https://status.yourapp.com
- **GitHub Issues**: https://github.com/yourorg/slides-api/issues

## Changelog

### v1.0.0 (2025-01-11)
- Initial API release
- Basic presentation and slide operations
- Authentication and rate limiting
- Content validation
- Batch operations support