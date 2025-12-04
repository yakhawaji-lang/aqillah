# 📁 هيكل المشروع - عَقِلْها

```
Aqqilha/
├── app/
│   ├── user/                    # نسخة المستخدم
│   │   ├── page.tsx            # الصفحة الرئيسية
│   │   ├── map/                # خريطة تفاعلية
│   │   ├── route/              # حساب المسار
│   │   ├── alerts/             # التنبيهات
│   │   └── settings/           # الإعدادات
│   │
│   ├── government/              # نسخة الحكومة
│   │   ├── page.tsx            # لوحة التحكم
│   │   ├── reports/            # التقارير
│   │   ├── alerts/             # إدارة التنبيهات
│   │   ├── rules/               # قواعد التنبيه
│   │   ├── monitoring/         # المراقبة
│   │   └── users/              # إدارة المستخدمين
│   │
│   └── api/                     # API Routes
│       ├── routes/              # Routes Service
│       ├── weather/             # Weather Service
│       ├── risk/                # Risk Engine
│       ├── notifications/       # Notification Service
│       └── admin/               # Admin Service
│
├── lib/
│   ├── services/
│   │   ├── routes.ts           # Routes Service
│   │   ├── weather.ts          # Weather Service
│   │   ├── risk-engine.ts      # Risk Engine
│   │   ├── notifications.ts    # Notification Service
│   │   └── google-maps.ts      # Google Maps Integration
│   │
│   ├── engines/
│   │   ├── risk-engine.ts      # محرك المخاطر
│   │   ├── prediction.ts       # ML Predictions
│   │   └── rules.ts            # Rule Engine
│   │
│   └── utils/
│       ├── geolocation.ts      # Geolocation Utils
│       └── validation.ts       # Validation
│
├── components/
│   ├── user/                    # مكونات المستخدم
│   │   ├── InteractiveMap.tsx
│   │   ├── RoutePlanner.tsx
│   │   ├── AlertCard.tsx
│   │   └── WeatherLayer.tsx
│   │
│   └── government/              # مكونات الحكومة
│       ├── Dashboard.tsx
│       ├── Reports.tsx
│       ├── AlertRules.tsx
│       └── Monitoring.tsx
│
├── prisma/
│   └── schema.prisma           # Database Schema
│
├── config/
│   ├── google-maps.ts          # Google Maps Config
│   ├── weather.ts              # Weather API Config
│   └── notifications.ts        # Notifications Config
│
└── docs/
    ├── API.md                  # API Documentation
    ├── DEPLOYMENT.md           # Deployment Guide
    └── INTEGRATION.md          # Integration Guide
```

