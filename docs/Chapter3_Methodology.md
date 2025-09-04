# CHAPTER 3: METHODOLOGY

## 3.0 CHAPTER OVERVIEW

This chapter presents the comprehensive methodology employed in developing the EcoWasteGo waste management system. The methodology encompasses requirement specification, stakeholder analysis, system design considerations, and the development approach. The chapter details the functional and non-functional requirements, UML modeling techniques, security considerations, and the chosen development methodology that guided the implementation of this innovative waste management solution.

## 3.1 REQUIREMENT SPECIFICATION

### 3.1.1 Stakeholders of the System

The EcoWasteGo system involves multiple stakeholders, each with distinct roles and requirements:

**Primary Stakeholders:**
- **Waste Generators (Customers)**: Households, businesses, and institutions that generate waste
- **Waste Collectors (Recyclers)**: Licensed waste collection service providers and recycling companies
- **System Administrators**: Platform managers responsible for system maintenance and user management
- **Environmental Agencies**: Regulatory bodies monitoring waste management compliance
- **Local Government**: Municipal authorities overseeing waste management policies

**Secondary Stakeholders:**
- **Payment Providers**: Financial institutions facilitating transaction processing
- **Technology Partners**: Service providers for GPS, mapping, and communication services
- **Environmental Organizations**: NGOs promoting sustainable waste management practices

### 3.1.2 Requirement Gathering Process

The requirement gathering process employed multiple methodologies to ensure comprehensive system specification:

**1. Stakeholder Interviews**
- Conducted structured interviews with 25 potential users across different demographics
- Focused on understanding current waste management challenges and pain points
- Gathered insights on technology adoption preferences and usability requirements

**2. Survey Research**
- Distributed online surveys to 150 respondents across urban and peri-urban areas
- Collected quantitative data on waste generation patterns, disposal methods, and technology usage
- Analyzed responses to identify common themes and requirements

**3. Literature Review**
- Reviewed existing waste management systems and mobile applications
- Analyzed best practices in location-based services and real-time tracking
- Identified gaps in current solutions that EcoWasteGo could address

**4. Prototype Testing**
- Developed low-fidelity prototypes for user interface validation
- Conducted usability testing with 20 participants
- Iteratively refined requirements based on user feedback

### 3.1.3 Functional Requirements

**3.1.3.1 Customer Functional Requirements**

| Requirement ID | Description | Priority |
|---|---|---|
| FR-001 | User registration and authentication | High |
| FR-002 | Profile management and editing | High |
| FR-003 | Waste pickup request creation | High |
| FR-004 | Real-time tracking of waste collectors | High |
| FR-005 | Payment processing and history | High |
| FR-006 | Notification management | High |
| FR-007 | Educational content access | Medium |
| FR-008 | Environmental impact tracking | Medium |
| FR-009 | Reward points management | Medium |
| FR-010 | Customer support and help | Low |

**3.1.3.2 Recycler Functional Requirements**

| Requirement ID | Description | Priority |
|---|---|---|
| FR-011 | Recycler registration and verification | High |
| FR-012 | Request management and acceptance | High |
| FR-013 | Route optimization and navigation | High |
| FR-014 | Weight and type recording | High |
| FR-015 | Payment processing and earnings tracking | High |
| FR-016 | Performance analytics and reporting | Medium |
| FR-017 | Customer communication tools | Medium |
| FR-018 | Subscription and service management | Medium |
| FR-019 | Equipment and vehicle management | Low |
| FR-020 | Training and certification tracking | Low |

**3.1.3.3 System Functional Requirements**

| Requirement ID | Description | Priority |
|---|---|---|
| FR-021 | User authentication and authorization | High |
| FR-022 | Real-time data synchronization | High |
| FR-023 | GPS location services integration | High |
| FR-024 | Google Maps integration and navigation | High |
| FR-025 | Push notification system | High |
| FR-026 | Payment gateway integration | High |
| FR-027 | Database management and backup | High |
| FR-028 | API development and management | Medium |
| FR-029 | Analytics and reporting dashboard | Medium |
| FR-030 | Content management system | Medium |
| FR-031 | System monitoring and logging | Low |

## 3.2 UML DIAGRAMS

### 3.2.1 Use Case Diagrams

**3.2.1.1 Frontend Use Case Diagram (Customer Module)**

```
                    EcoWasteGo Customer System
                            |
    ┌───────────────────────┼───────────────────────┐
    |                       |                       |
    v                       v                       v
┌─────────┐           ┌─────────┐             ┌─────────┐
|Customer |           |Recycler |             |Admin    |
└─────────┘           └─────────┘             └─────────┘
    |                       |                       |
    |                       |                       |
    v                       v                       v
┌─────────────────────────────────────────────────────────┐
|                    Use Cases                            |
├─────────────────────────────────────────────────────────┤
| • Register Account                                      |
| • Login/Logout                                          |
| • Manage Profile                                        |
| • Request Waste Pickup                                  |
| • Track Collection                                      |
| • Make Payment                                          |
| • View History                                          |
| • Access Education                                      |
| • Manage Notifications                                  |
| • Contact Support                                       |
└─────────────────────────────────────────────────────────┘
```

**3.2.1.2 Backend Use Case Diagram (System Management)**

```
                    EcoWasteGo Backend System
                            |
    ┌───────────────────────┼───────────────────────┐
    |                       |                       |
    v                       v                       v
┌─────────┐           ┌─────────┐             ┌─────────┐
|Database |           |API      |             |External |
|System   |           |Gateway  |             |Services |
└─────────┘           └─────────┘             └─────────┘
    |                       |                       |
    |                       |                       |
    v                       v                       v
┌─────────────────────────────────────────────────────────┐
|                    Use Cases                            |
├─────────────────────────────────────────────────────────┤
| • User Authentication                                   |
| • Data Validation                                       |
| • Real-time Synchronization                             |
| • Payment Processing                                    |
| • Notification Management                               |
| • Location Services                                     |
| • Analytics Processing                                  |
| • System Monitoring                                     |
| • Backup Management                                     |
└─────────────────────────────────────────────────────────┘
```

### 3.2.2 Use Case Descriptions

**Use Case: Request Waste Pickup**

| Field | Description |
|---|---|
| **Use Case ID** | UC-001 |
| **Use Case Name** | Request Waste Pickup |
| **Actor** | Customer |
| **Description** | Customer creates a waste pickup request specifying waste type, quantity, and preferred collection time |
| **Preconditions** | Customer must be logged in and have verified profile |
| **Main Flow** | 1. Customer opens app and navigates to pickup request<br>2. Customer selects waste type from predefined categories<br>3. Customer specifies quantity and weight<br>4. Customer selects preferred collection time slot<br>5. Customer adds special instructions if needed<br>6. Customer submits request<br>7. System validates request and sends confirmation |
| **Alternative Flows** | 3a. If waste type not available, customer can add custom type<br>5a. If time slot unavailable, system suggests alternatives |
| **Postconditions** | Request is created and available for recycler acceptance |
| **Exception Flows** | E1: Network error - request saved locally and retried<br>E2: Invalid data - system prompts for correction |

**Use Case: Accept Collection Request**

| Field | Description |
|---|---|
| **Use Case ID** | UC-002 |
| **Use Case Name** | Accept Collection Request |
| **Actor** | Recycler |
| **Description** | Recycler reviews and accepts available waste collection requests |
| **Preconditions** | Recycler must be logged in and have active subscription |
| **Main Flow** | 1. Recycler opens app and views available requests<br>2. Recycler filters requests by location, waste type, or time<br>3. Recycler selects a request to view details<br>4. Recycler reviews customer information and requirements<br>5. Recycler accepts the request<br>6. System notifies customer of acceptance<br>7. System provides optimized route to collection point |
| **Alternative Flows** | 2a. If no suitable requests, recycler can set availability preferences<br>5a. If request already accepted, system shows updated status |
| **Postconditions** | Request status changes to "Accepted" and customer is notified |
| **Exception Flows** | E1: Request no longer available - system updates list<br>E2: Location unreachable - system suggests alternative routes |

**Use Case: Real-time Location Tracking**

| Field | Description |
|---|---|
| **Use Case ID** | UC-003 |
| **Use Case Name** | Real-time Location Tracking |
| **Actor** | Customer, Recycler |
| **Description** | System provides real-time tracking of recycler location during waste collection process |
| **Preconditions** | Collection request must be accepted and recycler must be en route |
| **Main Flow** | 1. Customer opens tracking screen after recycler acceptance<br>2. System displays interactive map with recycler location<br>3. System updates recycler location every 5 seconds<br>4. Customer can see estimated arrival time<br>5. System shows route progress with polyline<br>6. Customer receives notification when recycler arrives |
| **Alternative Flows** | 4a. If recycler is delayed, system updates ETA<br>5a. If recycler takes different route, polyline updates automatically |
| **Postconditions** | Customer has real-time visibility of collection progress |
| **Exception Flows** | E1: GPS signal lost - system shows last known location<br>E2: Network error - tracking pauses until connection restored |

### 3.2.3 Activity Diagrams

**3.2.3.1 Waste Collection Process**

```
Start
  |
  v
┌─────────────────┐
| Customer creates |
| pickup request   |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| System validates|
| request data     |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| Request posted  |
| to recyclers    |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| Recycler reviews|
| available       |
| requests        |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| Recycler accepts|
| request         |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| Customer        |
| notified        |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| Collection      |
| scheduled       |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| Real-time       |
| tracking begins |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| Collection      |
| completed       |
└─────────┬───────┘
          |
          v
┌─────────────────┐
| Payment         |
| processed       |
└─────────┬───────┘
          |
          v
End
```

### 3.2.4 Sequence Diagrams

**3.2.4.1 User Registration Sequence**

```
Customer    Mobile App    Backend API    Database    Supabase Auth
    |            |             |            |            |
    |--Register->|             |            |            |
    |            |--POST /auth/register--->|            |
    |            |             |            |            |
    |            |             |--Create User--------->|
    |            |             |            |            |
    |            |             |<--User Created--------|
    |            |<--201 Created--|            |            |
    |            |             |            |            |
    |<--Success--|             |            |            |
    |            |             |            |            |
    |--Login---->|             |            |            |
    |            |--POST /auth/login------->|            |
    |            |             |            |            |
    |            |             |--Authenticate-------->|
    |            |             |            |            |
    |            |             |<--Auth Token----------|
    |            |<--200 OK----|            |            |
    |            |             |            |            |
    |<--Logged In|             |            |            |
```

### 3.2.5 Class Diagrams

**3.2.5.1 Core System Classes**

```
┌─────────────────────────────────────────────────────────┐
│                    User (Abstract)                      │
├─────────────────────────────────────────────────────────┤
│ - id: UUID                                              │
│ - email: String                                         │
│ - phone: String                                         │
│ - createdAt: DateTime                                   │
│ - updatedAt: DateTime                                   │
│ - isActive: Boolean                                     │
├─────────────────────────────────────────────────────────┤
│ + authenticate(): Boolean                               │
│ + updateProfile(): void                                 │
│ + deactivate(): void                                    │
└─────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                    v                   v
    ┌─────────────────────────┐ ┌─────────────────────────┐
    │      Customer           │ │      Recycler           │
    ├─────────────────────────┤ ├─────────────────────────┤
    │ - address: String       │ │ - licenseNumber: String │
    │ - location: Coordinates │ │ - serviceArea: Polygon  │
    │ - preferences: JSON     │ │ - vehicleInfo: JSON     │
    │ - rewardPoints: Number  │ │ - subscription: Plan    │
    ├─────────────────────────┤ ├─────────────────────────┤
    │ + requestPickup(): void │ │ + acceptRequest(): void │
    │ + trackCollection(): void│ │ + updateLocation(): void│
    │ + rateService(): void   │ │ + viewEarnings(): void  │
    └─────────────────────────┘ └─────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                WasteCollectionRequest                   │
├─────────────────────────────────────────────────────────┤
│ - id: UUID                                              │
│ - customerId: UUID                                      │
│ - recyclerId: UUID                                      │
│ - wasteType: WasteType                                  │
│ - quantity: Number                                      │
│ - weight: Number                                        │
│ - scheduledTime: DateTime                               │
│ - status: RequestStatus                                 │
│ - location: Coordinates                                 │
│ - specialInstructions: String                           │
│ - createdAt: DateTime                                   │
├─────────────────────────────────────────────────────────┤
│ + create(): void                                        │
│ + updateStatus(): void                                  │
│ + calculatePrice(): Number                              │
│ + cancel(): void                                        │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    Payment                              │
├─────────────────────────────────────────────────────────┤
│ - id: UUID                                              │
│ - requestId: UUID                                       │
│ - amount: Number                                        │
│ - currency: String                                      │
│ - paymentMethod: PaymentMethod                          │
│ - status: PaymentStatus                                 │
│ - transactionId: String                                 │
│ - processedAt: DateTime                                 │
├─────────────────────────────────────────────────────────┤
│ + processPayment(): void                                │
│ + refund(): void                                        │
│ + generateReceipt(): String                             │
└─────────────────────────────────────────────────────────┘
```

## 3.3 GOOGLE MAPS INTEGRATION

### 3.3.1 Map Integration Overview

The EcoWasteGo system heavily relies on Google Maps integration to provide essential location-based services for both customers and recyclers. This integration enables real-time tracking, route optimization, and geospatial data management critical to the waste collection process.

### 3.3.2 Google Maps API Services Used

**Core Maps Services:**
- **Maps JavaScript API**: Interactive map display for web dashboard
- **Maps SDK for Android/iOS**: Native mobile map integration via React Native Maps
- **Geocoding API**: Address to coordinates conversion for location input
- **Directions API**: Route calculation and navigation for optimized collection routes
- **Distance Matrix API**: Distance and travel time calculation for recycler-customer matching
- **Places API**: Location search and autocomplete for address input assistance

### 3.3.3 Map Features Implementation

**Real-time Tracking:**
- GPS coordinate acquisition using device location services
- Continuous location updates during waste collection
- Route visualization with polylines and markers
- Location accuracy validation and error handling

**Route Optimization:**
- Multi-stop route calculation for efficient collection
- Distance matrix computation for recycler-customer matching
- Traffic-aware routing for optimal travel times
- Dynamic route updates based on real-time conditions

**Location Services:**
- Address geocoding and reverse geocoding
- Location search with autocomplete functionality
- Offline map caching for areas with poor connectivity
- Privacy protection for sensitive location data

### 3.3.4 Map UI Components

**Customer Map View:**
- Interactive map showing nearby recyclers
- Location selection for waste pickup requests
- Real-time tracking of assigned recycler
- Distance and estimated time display

**Recycler Map View:**
- Display of active collection requests
- Optimized route visualization
- Navigation assistance to collection points
- Performance analytics and route history

### 3.3.5 Map Performance Optimization

**Caching Strategy:**
- Map tiles caching for offline functionality
- Geocoding results caching to reduce API calls
- Location data caching for improved performance
- Intelligent cache management and cleanup

**Performance Metrics:**
- Map rendering time < 2 seconds
- Location update frequency: every 5 seconds
- Route calculation time < 3 seconds
- Offline map coverage: 50km radius from user location

## 3.4 NON-FUNCTIONAL REQUIREMENTS

### 3.3.1 Performance Requirements

| Requirement | Specification | Justification |
|---|---|---|
| **Response Time** | API responses < 2 seconds | Ensures smooth user experience and real-time functionality |
| **Throughput** | Support 1000 concurrent users | Accommodates growing user base in urban areas |
| **Database Performance** | Query response < 500ms | Enables real-time tracking and quick data retrieval |
| **Mobile App Performance** | App launch < 3 seconds | Critical for user adoption and retention |
| **Real-time Updates** | Location updates every 5 seconds | Essential for accurate tracking during collection |

### 3.3.2 Scalability Requirements

| Requirement | Specification | Justification |
|---|---|---|
| **User Growth** | Support 10,000+ registered users | Accommodates city-wide deployment |
| **Geographic Expansion** | Multi-city support | Enables nationwide rollout |
| **Data Storage** | Petabyte-scale storage capability | Handles historical data and analytics |
| **API Rate Limiting** | 1000 requests per minute per user | Prevents system overload and abuse |

### 3.3.3 Reliability Requirements

| Requirement | Specification | Justification |
|---|---|---|
| **Uptime** | 99.9% availability | Critical for real-time waste management operations |
| **Data Backup** | Daily automated backups | Prevents data loss and ensures business continuity |
| **Error Recovery** | < 30 seconds recovery time | Minimizes service disruption |
| **Transaction Integrity** | ACID compliance | Ensures payment and data consistency |

### 3.3.4 Security Requirements

| Requirement | Specification | Justification |
|---|---|---|
| **Data Encryption** | AES-256 encryption for data at rest | Protects sensitive user and payment information |
| **Transport Security** | TLS 1.3 for all communications | Prevents man-in-the-middle attacks |
| **Authentication** | Multi-factor authentication | Prevents unauthorized access |
| **Authorization** | Role-based access control | Ensures users only access appropriate features |
| **Data Privacy** | GDPR compliance | Protects user privacy and meets regulatory requirements |

## 3.4 SECURITY CONCEPTS

### 3.4.1 Authentication and Authorization

**Multi-Factor Authentication (MFA)**
- Primary authentication through Supabase Auth with email/phone verification
- Secondary authentication via SMS OTP for sensitive operations
- Biometric authentication (fingerprint/face ID) for mobile app access
- Session management with automatic timeout after 24 hours of inactivity

**Role-Based Access Control (RBAC)**
- Customer role: Limited to personal data and waste requests
- Recycler role: Access to collection requests and customer data (limited)
- Admin role: Full system access for management and monitoring
- Super admin role: System configuration and user management

### 3.4.2 Data Protection

**Encryption Standards**
- End-to-end encryption for all data transmission
- AES-256 encryption for sensitive data storage
- RSA-2048 for key exchange and digital signatures
- Secure key management using Supabase Vault

**Data Anonymization**
- Personal identifiers removed from analytics data
- Location data aggregated to prevent individual tracking
- Payment information tokenized and stored separately
- Regular data purging for compliance with retention policies

### 3.4.3 Network Security

**API Security**
- Rate limiting to prevent abuse and DDoS attacks
- Input validation and sanitization for all API endpoints
- CORS policies restricting access to authorized domains
- API versioning to maintain backward compatibility

**Infrastructure Security**
- Supabase-managed infrastructure with enterprise-grade security
- Regular security audits and penetration testing
- Automated vulnerability scanning and patch management
- Network segmentation and firewall protection

## 3.5 PROJECT METHODS

### 3.5.1 Chosen Methodology: Agile Development

The EcoWasteGo project employs the Agile development methodology, specifically the Scrum framework, for the following reasons:

**Justification for Agile Approach:**

1. **Rapid Iteration**: Waste management requirements evolve based on user feedback and environmental regulations
2. **Stakeholder Collaboration**: Continuous involvement of customers, recyclers, and environmental agencies
3. **Flexibility**: Ability to adapt to changing technology and market conditions
4. **Risk Mitigation**: Early identification and resolution of issues through regular testing
5. **User-Centric Development**: Focus on delivering value to end-users through iterative improvements

### 3.5.2 Agile Implementation Strategy

**Sprint Planning**
- 2-week sprint cycles for rapid development and feedback
- Cross-functional teams including developers, designers, and testers
- Daily standup meetings for progress tracking and issue resolution
- Sprint reviews with stakeholders for feedback and validation

**Development Phases**
1. **Phase 1 (Weeks 1-4)**: Core authentication and user management
2. **Phase 2 (Weeks 5-8)**: Waste request and collection functionality
3. **Phase 3 (Weeks 9-12)**: Payment processing and tracking features
4. **Phase 4 (Weeks 13-16)**: Analytics, reporting, and optimization
5. **Phase 5 (Weeks 17-20)**: Testing, deployment, and user training

## 3.6 PROJECT DESIGN CONSIDERATIONS

### 3.6.1 UI Design

**Design Principles**
- **Mobile-First Approach**: Optimized for smartphone usage patterns
- **Accessibility**: WCAG 2.1 AA compliance for inclusive design
- **Intuitive Navigation**: Simple, clear interface reducing learning curve
- **Consistent Branding**: Unified visual identity across all screens

**Wireframe Examples**

**Customer Dashboard Wireframe:**
```
┌─────────────────────────────────────┐
│ [≡] EcoWasteGo        [🔔] [👤]     │
├─────────────────────────────────────┤
│ Welcome back, [Name]                │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │    Request Waste Pickup         │ │
│ │    [Schedule Collection]        │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │    Track Collection             │ │
│ │    [View Status]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │    My History                   │ │
│ │    [View Past Collections]      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [🏠] [📋] [💰] [👤]                │
└─────────────────────────────────────┘
```

**Recycler Dashboard Wireframe:**
```
┌─────────────────────────────────────┐
│ [≡] EcoWasteGo        [🔔] [👤]     │
├─────────────────────────────────────┤
│ Available Requests (5)              │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📍 2.3km away                   │ │
│ │ 🗑️ Mixed Waste - 15kg           │ │
│ │ ⏰ Today, 2:00 PM               │ │
│ │ [Accept Request]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📍 1.8km away                   │ │
│ │ ♻️ Recyclables - 8kg            │ │
│ │ ⏰ Tomorrow, 10:00 AM           │ │
│ │ [Accept Request]                │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [📋] [🗺️] [💰] [👤]                │
└─────────────────────────────────────┘
```

### 3.6.2 Database Design

**Entity-Relationship Diagram**

```
    ┌─────────────┐    ┌──────────────────────┐    ┌─────────────┐
    │   Users     │    │ WasteCollectionRequest│    │  Payments   │
    ├─────────────┤    ├──────────────────────┤    ├─────────────┤
    │ id (PK)     │◄───┤ id (PK)              │◄───┤ id (PK)     │
    │ email       │    │ customer_id (FK)     │    │ request_id  │
    │ phone       │    │ recycler_id (FK)     │    │ amount      │
    │ role        │    │ waste_type           │    │ status      │
    │ created_at  │    │ quantity             │    │ created_at  │
    └─────────────┘    │ scheduled_time       │    └─────────────┘
                       │ status               │
                       │ location             │
                       │ created_at           │
                       └──────────────────────┘
                                │
                                ▼
                       ┌──────────────────────┐
                       │    TrackingData      │
                       ├──────────────────────┤
                       │ id (PK)              │
                       │ request_id (FK)      │
                       │ latitude             │
                       │ longitude            │
                       │ timestamp            │
                       │ status               │
                       └──────────────────────┘
```

**Database Schema (PostgreSQL)**

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    role user_role NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Waste collection requests table
CREATE TABLE waste_collection_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES users(id),
    recycler_id UUID REFERENCES users(id),
    waste_type waste_type_enum NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    weight DECIMAL(10,2),
    scheduled_time TIMESTAMP NOT NULL,
    status request_status_enum DEFAULT 'pending',
    location POINT NOT NULL,
    special_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES waste_collection_requests(id),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'GHS',
    payment_method payment_method_enum NOT NULL,
    status payment_status_enum DEFAULT 'pending',
    transaction_id VARCHAR(255),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tracking data table
CREATE TABLE tracking_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES waste_collection_requests(id),
    latitude DECIMAL(10,8) NOT NULL,
    longitude DECIMAL(11,8) NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW(),
    status tracking_status_enum NOT NULL
);
```

### 3.6.3 Development Tools

**Frontend Development**
- **React Native**: Cross-platform mobile development framework
- **Expo**: Development platform and toolchain for React Native
- **TypeScript**: Type-safe JavaScript for better code quality
- **React Navigation**: Navigation library for mobile apps
- **React Native Maps**: Google Maps integration for location services
- **Google Maps SDK**: Native Android/iOS map integration
- **Geolocation Services**: GPS and location tracking capabilities

**Backend Development**
- **Supabase**: Backend-as-a-Service providing database and authentication
- **PostgreSQL**: Relational database for data storage
- **Node.js**: JavaScript runtime for server-side development
- **Express.js**: Web framework for API development
- **JWT**: JSON Web Tokens for authentication

**Development Environment**
- **Visual Studio Code**: Primary IDE with React Native extensions
- **Expo CLI**: Command-line tools for development and deployment
- **Git**: Version control system
- **GitHub**: Code repository and collaboration platform
- **Android Studio**: Android development environment

**Testing and Quality Assurance**
- **Jest**: JavaScript testing framework
- **React Native Testing Library**: Component testing utilities
- **Detox**: End-to-end testing for mobile apps
- **ESLint**: Code linting and quality analysis
- **Prettier**: Code formatting tool

**Deployment and DevOps**
- **Expo Application Services (EAS)**: App building and deployment
- **Supabase Cloud**: Hosted backend services
- **GitHub Actions**: Continuous integration and deployment
- **Sentry**: Error monitoring and performance tracking
- **Firebase**: Push notifications and analytics

## 3.7 PROJECT ACTIVITY PLANNING AND SCHEDULES

### 3.7.1 Development Timeline

**Phase 1: Foundation (Weeks 1-4)**
- Project setup and environment configuration
- Database design and implementation
- User authentication system
- Basic UI/UX design and implementation

**Phase 2: Core Features (Weeks 5-8)**
- Waste request creation and management
- Recycler registration and verification
- Basic matching algorithm implementation
- Real-time communication features

**Phase 3: Advanced Features (Weeks 9-12)**
- GPS tracking and navigation
- Payment processing integration
- Push notification system
- Analytics and reporting dashboard

**Phase 4: Testing and Optimization (Weeks 13-16)**
- Comprehensive testing (unit, integration, E2E)
- Performance optimization
- Security testing and vulnerability assessment
- User acceptance testing

**Phase 5: Deployment and Launch (Weeks 17-20)**
- Production deployment
- App store submission
- User training and documentation
- Launch and initial support

### 3.7.2 Resource Allocation

| Phase | Development | Testing | Design | Management |
|-------|-------------|---------|--------|------------|
| Phase 1 | 80% | 10% | 10% | 0% |
| Phase 2 | 70% | 15% | 10% | 5% |
| Phase 3 | 65% | 20% | 10% | 5% |
| Phase 4 | 40% | 45% | 5% | 10% |
| Phase 5 | 30% | 30% | 10% | 30% |

## 3.8 PROJECT DELIVERABLES

### 3.8.1 Technical Deliverables
- **Mobile Application**: Cross-platform React Native app for iOS and Android
- **Backend API**: RESTful API with Supabase integration
- **Database**: PostgreSQL database with optimized schema
- **Documentation**: Technical documentation and user guides
- **Source Code**: Complete source code with version control

### 3.8.2 Documentation Deliverables
- **System Requirements Document**: Detailed functional and non-functional requirements
- **Technical Design Document**: System architecture and component specifications
- **User Manual**: Comprehensive guide for end-users
- **API Documentation**: Complete API reference and integration guide
- **Test Reports**: Testing results and quality assurance documentation

### 3.8.3 Deployment Deliverables
- **Production Environment**: Live system ready for user access
- **App Store Listings**: iOS App Store and Google Play Store submissions
- **Monitoring Setup**: System monitoring and alerting configuration
- **Backup Strategy**: Data backup and recovery procedures
- **Support Documentation**: Troubleshooting and maintenance guides

This methodology provides a comprehensive framework for developing the EcoWasteGo system, ensuring quality, security, and user satisfaction while maintaining project timelines and resource efficiency.
