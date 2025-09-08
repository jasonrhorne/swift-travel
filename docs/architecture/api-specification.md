# API Specification

Based on the REST + Server-Sent Events API style from the Tech Stack, this specification defines all endpoints supporting the function chaining multi-agent architecture with real-time progress updates.

## REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Swift Travel API
  version: 1.0.0
  description: REST API for Swift Travel multi-agent itinerary generation platform
servers:
  - url: https://swift-travel.netlify.app/.netlify/functions
    description: Netlify Functions production endpoint
  - url: http://localhost:8888/.netlify/functions  
    description: Local development endpoint

paths:
  /auth/magic-link:
    post:
      summary: Send magic link for authentication
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
              required:
                - email
      responses:
        '200':
          description: Magic link sent successfully
        '429':
          description: Rate limit exceeded

  /auth/verify:
    post:
      summary: Verify magic link token
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                token:
                  type: string
              required:
                - token
      responses:
        '200':
          description: Authentication successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  sessionToken:
                    type: string

  /itineraries:
    post:
      summary: Initiate itinerary generation
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ItineraryRequest'
      responses:
        '202':
          description: Itinerary generation initiated
          content:
            application/json:
              schema:
                type: object
                properties:
                  requestId:
                    type: string
                    format: uuid
                  status:
                    type: string
                    enum: [initiated]
                  estimatedTime:
                    type: number
                    description: Estimated completion time in seconds
    get:
      summary: List user's itineraries
      security:
        - bearerAuth: []
      parameters:
        - name: status
          in: query
          schema:
            type: string
            enum: [processing, completed, failed, archived]
        - name: limit
          in: query
          schema:
            type: integer
            default: 20
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: Itineraries retrieved successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  itineraries:
                    type: array
                    items:
                      $ref: '#/components/schemas/Itinerary'
                  total:
                    type: integer

  /itineraries/{id}:
    get:
      summary: Get specific itinerary
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Itinerary retrieved successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Itinerary'
        '404':
          description: Itinerary not found

  /itineraries/{id}/progress:
    get:
      summary: Server-sent events for processing progress
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: SSE stream for real-time progress updates
          content:
            text/event-stream:
              schema:
                type: string
              examples:
                research_started:
                  value: |
                    event: progress
                    data: {"stage": "research-in-progress", "message": "Discovering unique experiences in Paris...", "progress": 25}
                
                research_completed:
                  value: |
                    event: progress  
                    data: {"stage": "research-completed", "message": "Research complete. Starting curation...", "progress": 50}
                
                completed:
                  value: |
                    event: completed
                    data: {"itineraryId": "uuid", "message": "Your personalized itinerary is ready!", "progress": 100}

  /itineraries/{id}/export/pdf:
    get:
      summary: Export itinerary as PDF
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: PDF export successful
          content:
            application/pdf:
              schema:
                type: string
                format: binary

  /itineraries/{id}/share:
    post:
      summary: Create shareable link
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                expiresAt:
                  type: string
                  format: date-time
                  nullable: true
                permissions:
                  type: string
                  enum: [read-only, comment]
      responses:
        '200':
          description: Shareable link created
          content:
            application/json:
              schema:
                type: object
                properties:
                  shareUrl:
                    type: string
                    format: uri
                  expiresAt:
                    type: string
                    format: date-time
                    nullable: true

  /shared/{token}:
    get:
      summary: Access shared itinerary
      parameters:
        - name: token
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Shared itinerary accessed
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Itinerary'
        '404':
          description: Share link not found or expired

  /agents/research:
    post:
      summary: Research agent function (internal)
      security:
        - internalAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                requestId:
                  type: string
                  format: uuid
                requirements:
                  $ref: '#/components/schemas/UserRequirements'
      responses:
        '200':
          description: Research completed, triggers curation

  /agents/curation:
    post:
      summary: Curation agent function (internal)
      security:
        - internalAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                requestId:
                  type: string
                  format: uuid
                researchResults:
                  type: object
      responses:
        '200':
          description: Curation completed, triggers validation

  /agents/validation:
    post:
      summary: Validation agent function (internal)
      security:
        - internalAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                requestId:
                  type: string
                  format: uuid
                curationResults:
                  type: object
      responses:
        '200':
          description: Validation completed, triggers response

  /agents/response:
    post:
      summary: Response agent function (internal)
      security:
        - internalAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                requestId:
                  type: string
                  format: uuid
                validationResults:
                  type: object
      responses:
        '200':
          description: Response completed, itinerary ready

components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
    internalAuth:
      type: apiKey
      in: header
      name: X-Internal-Token

  schemas:
    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        name:
          type: string
          nullable: true
        preferences:
          $ref: '#/components/schemas/UserPreferences'
        createdAt:
          type: string
          format: date-time
        lastActiveAt:
          type: string
          format: date-time

    UserPreferences:
      type: object
      properties:
        defaultPersona:
          type: string
          enum: [photography, food-forward, architecture, family]
          nullable: true
        budgetRange:
          type: string
          enum: [budget, mid-range, luxury, no-limit]
        accessibilityNeeds:
          type: array
          items:
            type: string
        dietaryRestrictions:
          type: array
          items:
            type: string
        travelStyle:
          type: string
          enum: [relaxed, packed, balanced]

    Itinerary:
      type: object
      properties:
        id:
          type: string
          format: uuid
        userId:
          type: string
          format: uuid
        destination:
          $ref: '#/components/schemas/Destination'
        persona:
          type: string
          enum: [photography, food-forward, architecture, family]
        status:
          type: string
          enum: [processing, completed, failed, archived]
        activities:
          type: array
          items:
            $ref: '#/components/schemas/Activity'
        metadata:
          $ref: '#/components/schemas/ItineraryMetadata'
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time

    Destination:
      type: object
      properties:
        name:
          type: string
        city:
          type: string
        region:
          type: string
        country:
          type: string
        coordinates:
          type: object
          properties:
            lat:
              type: number
            lng:
              type: number
        timeZone:
          type: string

    Activity:
      type: object
      properties:
        id:
          type: string
          format: uuid
        itineraryId:
          type: string
          format: uuid
        name:
          type: string
        description:
          type: string
        category:
          type: string
          enum: [dining, sightseeing, culture, nature, shopping, nightlife, transport]
        timing:
          $ref: '#/components/schemas/ActivityTiming'
        location:
          $ref: '#/components/schemas/ActivityLocation'

    ActivityTiming:
      type: object
      properties:
        dayNumber:
          type: integer
          minimum: 1
        startTime:
          type: string
          format: time
        duration:
          type: integer
          minimum: 0
        flexibility:
          type: string
          enum: [fixed, flexible, weather-dependent]
        bufferTime:
          type: integer
          minimum: 0

    ActivityLocation:
      type: object
      properties:
        name:
          type: string
        address:
          type: string
        coordinates:
          type: object
          properties:
            lat:
              type: number
            lng:
              type: number
        neighborhood:
          type: string
        googlePlaceId:
          type: string
          nullable: true

    ItineraryMetadata:
      type: object
      properties:
        processingTimeSeconds:
          type: number
        qualityScore:
          type: number
          minimum: 0
          maximum: 10
        costEstimate:
          type: object
          properties:
            currency:
              type: string
            total:
              type: number
            breakdown:
              type: object

    UserRequirements:
      type: object
      properties:
        destination:
          type: string
        persona:
          type: string
          enum: [photography, food-forward, architecture, family]
        dates:
          type: object
          properties:
            startDate:
              type: string
              format: date
            endDate:
              type: string
              format: date
        budgetRange:
          type: string
          enum: [budget, mid-range, luxury, no-limit]
        groupSize:
          type: integer
          minimum: 1
        specialRequests:
          type: array
          items:
            type: string
        accessibilityNeeds:
          type: array
          items:
            type: string
```
