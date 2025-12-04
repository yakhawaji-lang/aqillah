# وثائق واجهات API - عَقِلْها

## نظرة عامة

جميع واجهات API تستخدم JSON وتدعم اللغة العربية.

**Base URL**: `https://api.aqillah.sa` (الإنتاج) أو `http://localhost:3000` (التطوير)

## المصادقة

جميع الطلبات تتطلب:
- `Content-Type: application/json`
- `Authorization: Bearer <token>` (للواجهات المحمية)

## واجهات API

### 1. استقبال البيانات (Data Ingestion)

#### `POST /api/ingestion`

استقبال بيانات مجمعة من مزودي الاتصالات.

**Request Body**:
```json
{
  "segmentId": "segment-123",
  "devices": [
    {
      "lat": 24.7136,
      "lng": 46.6753,
      "speed": 45.5,
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "trafficDataId": "data-123",
    "congestionIndex": 65,
    "delayMinutes": 8.5,
    "timestamp": "2024-01-01T10:00:00Z"
  }
}
```

**Errors**:
- `400`: بيانات غير صحيحة أو k-anonymity < 30
- `404`: المقطع غير موجود
- `500`: خطأ في الخادم

---

### 2. بيانات المرور

#### `GET /api/traffic`

جلب بيانات المرور الحالية.

**Query Parameters**:
- `city` (optional): اسم المدينة
- `limit` (optional): عدد النتائج (default: 50)

**Response**:
```json
{
  "data": [
    {
      "id": "segment-123",
      "roadName": "طريق الملك فهد",
      "city": "الرياض",
      "direction": "شمال",
      "position": [24.7136, 46.6753],
      "congestionIndex": 65,
      "deviceCount": 150,
      "avgSpeed": 35.5,
      "timestamp": "2024-01-01T10:00:00Z"
    }
  ]
}
```

---

### 3. التنبؤات

#### `GET /api/predictions`

جلب التنبؤات المستقبلية.

**Query Parameters**:
- `segmentId` (optional): معرف المقطع
- `minutesAhead` (optional): عدد الدقائق المستقبلية (default: 20)

**Response**:
```json
{
  "data": [
    {
      "id": "pred-123",
      "segmentId": "segment-123",
      "roadName": "طريق الملك فهد",
      "predictedIndex": 75,
      "confidence": 0.85,
      "predictedFor": "2024-01-01T10:20:00Z",
      "factors": {
        "currentCongestion": 65,
        "trend": "increasing"
      }
    }
  ]
}
```

---

### 4. نقاط الازدحام (Bottlenecks)

#### `GET /api/bottlenecks`

جلب نقاط الازدحام المكتشفة.

**Query Parameters**:
- `segmentId` (optional): معرف المقطع
- `activeOnly` (optional): النشطة فقط (default: true)

**Response**:
```json
{
  "data": [
    {
      "id": "bottleneck-123",
      "segmentId": "segment-123",
      "detectedAt": "2024-01-01T10:00:00Z",
      "severity": "high",
      "speedDrop": 0.45,
      "backwardExtent": 2.5,
      "isResolved": false
    }
  ]
}
```

#### `POST /api/bottlenecks`

كشف نقطة ازدحام جديدة.

**Request Body**:
```json
{
  "segmentId": "segment-123"
}
```

---

### 5. القرارات المرورية

#### `GET /api/decisions`

جلب القرارات المرورية.

**Query Parameters**:
- `segmentId` (optional): معرف المقطع
- `status` (optional): حالة القرار (pending, approved, implemented, rejected)

**Response**:
```json
{
  "data": [
    {
      "id": "decision-123",
      "segmentId": "segment-123",
      "decisionType": "diversion",
      "expectedDelayReduction": 12.5,
      "expectedBenefitScore": 85,
      "status": "pending",
      "recommendedAt": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### `POST /api/decisions`

توليد قرارات مرورية جديدة.

**Request Body**:
```json
{
  "segmentId": "segment-123"
}
```

---

### 6. الإشارات الذكية

#### `GET /api/signals`

جلب توصيات الإشارات الذكية.

**Query Parameters**:
- `segmentId` (optional): معرف المقطع
- `implemented` (optional): المنفذة فقط

**Response**:
```json
{
  "data": [
    {
      "id": "signal-123",
      "segmentId": "segment-123",
      "greenTimeSeconds": 45,
      "cycleTimeSeconds": 110,
      "priority": "high",
      "expectedImpact": {
        "delayReduction": 5.2,
        "throughputIncrease": 20
      },
      "implemented": false
    }
  ]
}
```

---

### 7. مسارات الطوارئ

#### `POST /api/emergency-route`

حساب أو تحديث مسار طوارئ.

**Request Body**:
```json
{
  "originLat": 24.7136,
  "originLng": 46.6753,
  "destinationLat": 24.7500,
  "destinationLng": 46.7000,
  "routeId": "route-123" // للتحديث
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "route-123",
    "route": [[24.7136, 46.6753], [24.7500, 46.7000]],
    "distance": 5.2,
    "estimatedTime": 12.5,
    "lastUpdate": "2024-01-01T10:00:00Z",
    "congestionAlongRoute": [
      {
        "segmentId": "segment-123",
        "congestionIndex": 65,
        "delayMinutes": 8.5
      }
    ]
  }
}
```

#### `GET /api/emergency-route`

جلب مسارات الطوارئ.

**Query Parameters**:
- `routeId` (optional): معرف المسار

---

### 8. التنبيهات

#### `GET /api/alerts`

جلب التنبيهات النشطة.

**Query Parameters**:
- `city` (optional): اسم المدينة
- `activeOnly` (optional): النشطة فقط (default: true)

---

### 9. الإحصائيات

#### `GET /api/stats`

جلب الإحصائيات العامة.

**Response**:
```json
{
  "totalSegments": 150,
  "activeAlerts": 12,
  "avgCongestion": 45,
  "highCongestionCount": 25,
  "activePredictions": 80,
  "lastUpdate": "2024-01-01T10:00:00Z"
}
```

---

## رموز الحالة

- `200`: نجاح
- `400`: طلب غير صحيح
- `401`: غير مصرح
- `404`: غير موجود
- `500`: خطأ في الخادم

## معدلات الاستخدام (Rate Limiting)

- **عام**: 1000 طلب/ساعة
- **استقبال البيانات**: 10000 طلب/ساعة
- **مسارات الطوارئ**: 100 طلب/ساعة

## الدعم

للدعم الفني:
- 📧 البريد: api-support@aqillah.sa
- 📞 الهاتف: 1999
- 📚 الوثائق: https://docs.aqillah.sa

---

**عَقِلْها** - واجهات API موثوقة وآمنة 🔒

