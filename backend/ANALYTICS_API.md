# Analytics API Documentation

## Overview

The Analytics API provides comprehensive data analysis for recyclers in the EcoWasteGo platform. It includes performance metrics, environmental impact calculations, and detailed analytics for different time periods.

## Base URL

```
http://localhost:5000/api/analytics
```

## Authentication

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Get Complete Analytics Data

**GET** `/api/analytics`

Retrieves complete analytics data including performance metrics and environmental impact for the authenticated recycler.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `week` | Time period: `week`, `month`, or `year` |

#### Example Request

```bash
curl -X GET "http://localhost:5000/api/analytics?period=week" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "performance": {
      "totalPickups": 15,
      "totalEarnings": 225.50,
      "averagePickupValue": 15.03,
      "efficiency": 85,
      "dailyPerformance": [
        {
          "day": "Mon",
          "pickups": 8,
          "earnings": 120
        },
        {
          "day": "Tue",
          "pickups": 12,
          "earnings": 180
        }
      ]
    },
    "environmentalImpact": {
      "wasteDiverted": 180,
      "co2Reduced": 450,
      "treesEquivalent": 22,
      "landfillSpaceSaved": 126,
      "energySaved": 252
    },
    "period": "week"
  },
  "message": "Analytics data retrieved successfully"
}
```

### 2. Get Performance Data Only

**GET** `/api/analytics/performance`

Retrieves only performance metrics for the authenticated recycler.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `week` | Time period: `week`, `month`, or `year` |

#### Example Request

```bash
curl -X GET "http://localhost:5000/api/analytics/performance?period=month" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "totalPickups": 45,
    "totalEarnings": 675.25,
    "averagePickupValue": 15.01,
    "efficiency": 87,
    "dailyPerformance": [
      {
        "day": "Week 1",
        "pickups": 15,
        "earnings": 225
      },
      {
        "day": "Week 2",
        "pickups": 18,
        "earnings": 270
      }
    ]
  },
  "message": "Performance data retrieved successfully"
}
```

### 3. Get Environmental Impact Data Only

**GET** `/api/analytics/environmental-impact`

Retrieves only environmental impact metrics for the authenticated recycler.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `week` | Time period: `week`, `month`, or `year` |

#### Example Request

```bash
curl -X GET "http://localhost:5000/api/analytics/environmental-impact?period=year" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "wasteDiverted": 2160,
    "co2Reduced": 5400,
    "treesEquivalent": 270,
    "landfillSpaceSaved": 1512,
    "energySaved": 3024
  },
  "message": "Environmental impact data retrieved successfully"
}
```

### 4. Get Analytics Summary

**GET** `/api/analytics/summary`

Retrieves high-level analytics summary for the authenticated recycler.

#### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `period` | string | No | `week` | Time period: `week`, `month`, or `year` |

#### Example Request

```bash
curl -X GET "http://localhost:5000/api/analytics/summary?period=week" \
  -H "Authorization: Bearer <your-jwt-token>"
```

#### Response

```json
{
  "success": true,
  "data": {
    "totalPickups": 15,
    "totalEarnings": 225.50,
    "efficiency": 85,
    "wasteDiverted": 180,
    "co2Reduced": 450,
    "treesEquivalent": 22
  },
  "message": "Analytics summary retrieved successfully"
}
```

## Data Models

### RecyclerPerformance

```typescript
interface RecyclerPerformance {
  totalPickups: number;        // Total number of completed pickups
  totalEarnings: number;       // Total earnings in GHS
  averagePickupValue: number;  // Average earnings per pickup
  efficiency: number;          // Efficiency percentage (0-100)
  dailyPerformance: DailyPerformance[];
}
```

### DailyPerformance

```typescript
interface DailyPerformance {
  day: string;     // Day name (Mon, Tue, etc.) or period name
  pickups: number; // Number of pickups for that day
  earnings: number; // Earnings for that day in GHS
}
```

### EnvironmentalImpact

```typescript
interface EnvironmentalImpact {
  wasteDiverted: number;        // Total waste diverted in kg
  co2Reduced: number;          // CO2 reduced in kg
  treesEquivalent: number;      // Number of trees equivalent
  landfillSpaceSaved: number;   // Landfill space saved in m³
  energySaved: number;          // Energy saved in kWh
}
```

## Calculations

### Earnings Calculation

Earnings are calculated based on waste type and weight:

- **Plastic**: 2.5 GHS per kg
- **Paper**: 1.8 GHS per kg
- **Glass**: 0.3 GHS per kg
- **Metal**: 4.0 GHS per kg
- **Organic**: 0.5 GHS per kg
- **Electronics**: 8.0 GHS per kg
- **Mixed**: 1.5 GHS per kg

### Environmental Impact Calculation

- **CO2 Reduction**: Based on waste type and weight
- **Trees Equivalent**: CO2 reduced ÷ 20 kg (20kg CO2 per tree)
- **Landfill Space Saved**: Waste weight × 0.7 m³
- **Energy Saved**: Waste weight × 1.4 kWh

### Efficiency Calculation

Efficiency is calculated based on the percentage of pickups completed within 24 hours of the scheduled time.

## Error Responses

### 401 Unauthorized

```json
{
  "success": false,
  "error": "User not authenticated"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "error": "Access denied. Recycler role required."
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": "Failed to retrieve analytics data"
}
```

## Rate Limiting

All analytics endpoints are subject to rate limiting:
- **Limit**: 100 requests per 15 minutes per IP
- **Response**: 429 Too Many Requests

## Notes

1. **Authentication Required**: All endpoints require a valid JWT token
2. **Recycler Role Only**: Only users with `recycler` role can access analytics
3. **Period Support**: Supports `week`, `month`, and `year` periods
4. **Real-time Data**: All calculations are based on actual completed waste collections
5. **Performance**: Data is calculated in real-time from the database

## Frontend Integration

To integrate with the React Native frontend:

```typescript
// Example API call
const fetchAnalytics = async (period: 'week' | 'month' | 'year') => {
  try {
    const response = await fetch(
      `http://localhost:5000/api/analytics?period=${period}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching analytics:', error);
    throw error;
  }
};
``` 