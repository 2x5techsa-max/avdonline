# EishAlert Fire Reporting System
## Comprehensive Technical Specification

**Version:** 2.0.3
**Date:** November 2025
**Status:** Proof of Concept - Operational

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Overview](#system-overview)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [User Interfaces](#user-interfaces)
7. [User Workflows](#user-workflows)
8. [Technical Stack](#technical-stack)
9. [Security & Privacy](#security--privacy)
10. [Deployment Guide](#deployment-guide)
11. [Testing](#testing)
12. [Future Enhancements](#future-enhancements)

---

## Executive Summary

EishAlert is a real-time fire incident reporting and management system designed for South African communities. It enables citizens to quickly report fire emergencies from their mobile phones with GPS location and photo evidence, while operators monitor and triage incidents from a desktop dashboard.

### Key Features
- 📱 **Mobile Reporter App**: GPS-enabled fire reporting with camera integration
- 🖥️ **Desktop Monitor Dashboard**: Real-time incident management and triage
- 🌍 **Multilingual Support**: English, Afrikaans, Zulu, and Xhosa
- 📍 **Location Services**: GPS coordinates with reverse geocoding to village/town names
- 📷 **Photo Evidence**: Automatic image compression (max 500KB)
- 📊 **Live Statistics**: Real-time incident counts by status
- 🔄 **Audit Trail**: Complete history of all status changes
- ⚡ **Auto-Refresh**: Dashboard updates every 5 seconds

### Target Users
1. **Reporters**: Community members who witness fires
2. **Operators**: Emergency services personnel who triage reports
3. **Fire Departments**: Receive forwarded verified incidents

---

## System Overview

### Problem Statement
Traditional fire reporting relies on phone calls which can be:
- Slow and inefficient during emergencies
- Lacking visual evidence
- Missing precise location data
- Language barriers for non-English speakers
- No tracking of incident status

### Solution
EishAlert provides a streamlined mobile-first reporting system with:
- One-tap fire reporting with automatic GPS capture
- Visual evidence through smartphone cameras
- Multilingual interface for accessibility
- Real-time operator dashboard for triage
- Complete audit trail for accountability

### System Components

```
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐
│  Mobile Device  │────────▶│  Node.js/Express│────────▶│  SQLite Database│
│  Reporter App   │         │     Backend     │         │                 │
└─────────────────┘         └─────────────────┘         └─────────────────┘
                                     │
                                     ▼
                            ┌─────────────────┐
                            │  Desktop Browser│
                            │  Monitor Dash   │
                            └─────────────────┘
```

---

## Architecture

### High-Level Architecture

**Client-Server Model**
- **Frontend**: Single-page HTML applications (no framework)
- **Backend**: Node.js with Express REST API
- **Database**: SQLite3 (file-based, no external dependencies)
- **Storage**: Local filesystem for photo uploads

### Directory Structure

```
Eish/
├── backend/
│   ├── server.js              # Express API server
│   ├── database.js            # SQLite database functions
│   ├── package.json           # Node dependencies
│   ├── eish-alert.db          # SQLite database file
│   └── uploads/               # Photo storage
│       └── [incident-photos]
├── reporter/
│   └── index.html             # Mobile reporter app
└── monitor/
    └── index.html             # Desktop monitor dashboard
```

### Technology Decisions

| Component | Technology | Rationale |
|-----------|-----------|-----------|
| Backend Language | Node.js | Async I/O, JavaScript everywhere, npm ecosystem |
| Web Framework | Express.js | Lightweight, flexible routing, middleware support |
| Database | SQLite3 | No setup required, file-based, perfect for POC |
| Frontend | Vanilla HTML/JS | No build step, fast prototyping, easy debugging |
| Image Processing | Sharp | Fast compression, good quality, native performance |
| Upload Handling | Multer | Standard Express middleware, good file validation |

---

## Database Schema

### Tables

#### `incidents` Table

Stores all fire incident reports with location and metadata.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | TEXT | Unique incident ID (e.g., INC-1762623248908-kg3jdel9r) | PRIMARY KEY |
| `device_id` | TEXT | Unique device identifier from reporter | NULL |
| `phone` | TEXT | Reporter phone number (optional) | NULL |
| `timestamp` | TEXT | ISO 8601 datetime of report | NOT NULL |
| `latitude` | REAL | GPS latitude coordinate | NULL |
| `longitude` | REAL | GPS longitude coordinate | NULL |
| `accuracy` | INTEGER | GPS accuracy in meters | NULL |
| `language` | TEXT | Reporter's selected language (eng/afr/zul/xho) | DEFAULT 'eng' |
| `transmission_type` | TEXT | How report was submitted (app/sms/ussd) | DEFAULT 'app' |
| `photo_path` | TEXT | Filename of uploaded photo | NULL |
| `status` | TEXT | Current status (unverified/verified/forwarded/false_alarm) | DEFAULT 'unverified' |
| `created_at` | TEXT | ISO 8601 datetime of creation | NOT NULL |
| `updated_at` | TEXT | ISO 8601 datetime of last update | NOT NULL |

**Indexes:**
- `idx_incidents_status` on `status`
- `idx_incidents_created_at` on `created_at DESC`

#### `audit_log` Table

Tracks all changes to incidents for accountability and transparency.

| Column | Type | Description | Constraints |
|--------|------|-------------|-------------|
| `id` | INTEGER | Auto-increment primary key | PRIMARY KEY AUTOINCREMENT |
| `incident_id` | TEXT | Foreign key to incidents table | NOT NULL, FOREIGN KEY |
| `action` | TEXT | Type of action (created/status_changed/verified/forwarded/false_alarm) | NOT NULL |
| `actor` | TEXT | Who performed the action (system/operator) | DEFAULT 'system' |
| `notes` | TEXT | Additional notes about the action | NULL |
| `timestamp` | TEXT | ISO 8601 datetime of action | NOT NULL |

**Indexes:**
- `idx_audit_log_incident_id` on `incident_id`

### Status Workflow

```
┌─────────────┐    Operator     ┌──────────┐    Operator      ┌───────────┐
│ unverified  │────Verifies────▶│ verified │────Forwards─────▶│ forwarded │
└─────────────┘                 └──────────┘                  └───────────┘
      │                                │
      │ Operator                       │ Operator
      │ Marks as                       │ Marks as
      │ False Alarm                    │ False Alarm
      ▼                                ▼
┌─────────────┐                 ┌─────────────┐
│ false_alarm │                 │ false_alarm │
└─────────────┘                 └─────────────┘
```

---

## API Endpoints

### Base URL
```
http://localhost:3000
```

### Endpoints

#### 1. Health Check
```http
GET /api/health
```

**Response:**
```json
{
  "success": true,
  "status": "healthy",
  "timestamp": "2025-11-08T17:34:08.920Z"
}
```

---

#### 2. Create Incident (Report Fire)
```http
POST /api/incidents
Content-Type: multipart/form-data
```

**Request Body:**
- `photo` (file): Image file (JPEG/PNG, max 10MB)
- `location` (JSON string): `{"latitude": -26.1234, "longitude": 28.5678, "accuracy": 15}`
- `language` (string): `eng`, `afr`, `zul`, or `xho`
- `deviceId` (string): Unique device identifier
- `phone` (string): Optional phone number

**Response:**
```json
{
  "success": true,
  "incidentId": "INC-1762623248908-kg3jdel9r",
  "message": "Incident reported successfully"
}
```

**Processing:**
1. Validates photo file type and size
2. Compresses photo to max 500KB using Sharp
3. Stores compressed photo with unique filename
4. Creates incident record in database
5. Creates initial audit log entry
6. Returns incident ID

---

#### 3. Get All Incidents
```http
GET /api/incidents
GET /api/incidents?status=unverified
GET /api/incidents?limit=10
```

**Query Parameters:**
- `status` (optional): Filter by status (unverified/verified/forwarded/false_alarm)
- `limit` (optional): Limit number of results

**Response:**
```json
{
  "success": true,
  "count": 5,
  "incidents": [
    {
      "id": "INC-1762623248908-kg3jdel9r",
      "device_id": "DEV-1762623245123-abc123",
      "phone": null,
      "timestamp": "2025-11-08T17:34:08.920Z",
      "latitude": -26.123456,
      "longitude": 28.567890,
      "accuracy": 15,
      "language": "eng",
      "transmission_type": "app",
      "photo_path": "1762623248902-4510zjm0z-compressed.jpg",
      "status": "unverified",
      "created_at": "2025-11-08T17:34:08.921Z",
      "updated_at": "2025-11-08T17:34:08.921Z"
    }
  ]
}
```

---

#### 4. Get Single Incident
```http
GET /api/incidents/:id
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "id": "INC-1762623248908-kg3jdel9r",
    "device_id": "DEV-1762623245123-abc123",
    "phone": null,
    "timestamp": "2025-11-08T17:34:08.920Z",
    "latitude": -26.123456,
    "longitude": 28.567890,
    "accuracy": 15,
    "language": "eng",
    "transmission_type": "app",
    "photo_path": "1762623248902-4510zjm0z-compressed.jpg",
    "status": "unverified",
    "created_at": "2025-11-08T17:34:08.921Z",
    "updated_at": "2025-11-08T17:34:08.921Z"
  },
  "auditLog": [
    {
      "id": 17,
      "incident_id": "INC-1762623248908-kg3jdel9r",
      "action": "created",
      "actor": "system",
      "notes": "Incident created via app",
      "timestamp": "2025-11-08T17:34:08.921Z"
    }
  ]
}
```

---

#### 5. Update Incident Status
```http
PATCH /api/incidents/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "verified",
  "notes": "Fire confirmed by operator",
  "actor": "operator"
}
```

**Response:**
```json
{
  "success": true,
  "incident": {
    "id": "INC-1762623248908-kg3jdel9r",
    "status": "verified",
    "updated_at": "2025-11-08T17:45:12.345Z"
  }
}
```

**Processing:**
1. Validates incident exists
2. Updates status in incidents table
3. Creates audit log entry with actor and notes
4. Returns updated incident

---

#### 6. Get Incident Photo
```http
GET /api/incidents/:id/photo
```

**Response:**
- Returns JPEG/PNG image file
- 404 if no photo exists

---

#### 7. Get Audit Log
```http
GET /api/audit/:incidentId
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "auditLog": [
    {
      "id": 19,
      "incident_id": "INC-1762623248908-kg3jdel9r",
      "action": "status_changed",
      "actor": "operator",
      "notes": "Status changed to verified",
      "timestamp": "2025-11-08T17:45:12.345Z"
    },
    {
      "id": 17,
      "incident_id": "INC-1762623248908-kg3jdel9r",
      "action": "created",
      "actor": "system",
      "notes": "Incident created via app",
      "timestamp": "2025-11-08T17:34:08.921Z"
    }
  ]
}
```

---

## User Interfaces

### 1. Mobile Reporter App (`/reporter/`)

**Purpose:** Allow citizens to quickly report fire incidents from their mobile phones.

**Version:** v2.0.2 - GPS + LOCATION

#### Key Features

1. **GPS Location Tracking**
   - Automatically requests GPS permission on load
   - Shows visual status: Green (locked), Orange (searching), Red (error)
   - Displays village/town name via reverse geocoding (OpenStreetMap Nominatim)
   - Shows coordinates and accuracy for verification
   - **REQUIRED**: Won't allow submission without GPS lock

2. **Multilingual Support**
   - English, Afrikaans, Zulu, Xhosa
   - All UI text translates based on selection
   - Button labels, error messages, success messages all localized

3. **Camera Integration**
   - Native camera access via file input with `capture="environment"`
   - Shows photo preview before submission
   - **REQUIRED**: Won't allow submission without photo

4. **Smart Submit Button**
   - Disabled until BOTH GPS and photo are ready
   - Shows current requirement ("Waiting for GPS..." or "Please take photo first")
   - Changes to "🚨 Submit Fire Report" when ready
   - Shows spinner during submission

5. **Success Feedback**
   - Displays incident ID after successful submission
   - Auto-resets form after 5 seconds
   - Ready for next report

#### UI Components

**GPS Status Card:**
```
┌─────────────────────────────────────────┐
│ 📍 Location Status                      │
│ Location Found ✓                        │
│ Midrand, Gauteng                        │
│ -26.012345, 28.123456                   │
└─────────────────────────────────────────┘
```

**Language Selection:**
```
┌──────────┬──────────┐
│ English  │Afrikaans │
├──────────┼──────────┤
│   Zulu   │  Xhosa   │
└──────────┴──────────┘
```

**Submit Button States:**
- `Waiting for GPS...` (disabled, grey)
- `Please take a photo first` (disabled, grey)
- `🚨 Submit Fire Report` (enabled, red gradient)
- `⏳ Submitting...` (disabled, shows spinner)

#### Screenshots Needed

**[SCREENSHOT 1: Reporter App - Initial Load]**
- GPS searching state
- Language buttons
- Camera button
- Disabled submit button

**[SCREENSHOT 2: Reporter App - GPS Locked]**
- Green GPS status with location name
- Coordinates visible

**[SCREENSHOT 3: Reporter App - Photo Taken]**
- Photo preview shown
- Enabled submit button

**[SCREENSHOT 4: Reporter App - Success]**
- Success message with incident ID

---

### 2. Desktop Monitor Dashboard (`/monitor/`)

**Purpose:** Allow emergency operators to view, triage, and manage fire incident reports.

**Version:** v2.0.3 - NO PROMPTS

#### Key Features

1. **Live Statistics Bar**
   - Real-time counts of incidents by status
   - Color-coded cards: Orange (unverified), Green (verified), Blue (forwarded), Grey (false alarms)
   - Updates every 5 seconds

2. **Filterable Incident List**
   - Tabs: All / New / Verified
   - Sidebar with scrollable incident cards
   - Shows incident ID, timestamp, location, photo indicator
   - Click to select and view details

3. **Detailed Incident View**
   - Full incident information
   - Location with Google Maps link
   - Photo evidence (full size)
   - Complete audit trail
   - Device and reporter info

4. **One-Click Actions**
   - Verify Fire (green button)
   - Forward to Fire Dept (blue button)
   - Mark as False Alarm (red button)
   - **NO PROMPTS** - instant action on click
   - Buttons disabled after final status reached

5. **Auto-Refresh**
   - Dashboard refreshes every 5 seconds
   - Selected incident stays selected
   - No manual refresh needed

6. **Audit Trail**
   - Shows complete history of incident
   - Who did what and when
   - All status changes logged

#### UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  🚨 EishAlert - Fire Incident Monitor       v2.0.3 - NO PROMPTS │
├─────────────────────────────────────────────────────────────────┤
│  Unverified: 5  │  Verified: 3  │  Forwarded: 8  │  False: 2   │
├───────────────────┬─────────────────────────────────────────────┤
│  Fire Incidents   │                                             │
│  ┌─────────────┐  │  Incident Detail Panel                      │
│  │ All │New│Ver│  │                                             │
│  └─────────────┘  │  [Full incident info, photo, audit trail]  │
│                   │                                             │
│  ┌─────────────┐  │                                             │
│  │ INC-123...  │  │                                             │
│  │ 2025-11-08  │  │                                             │
│  │ 📍 GPS ✓    │  │                                             │
│  └─────────────┘  │                                             │
│                   │                                             │
│  [More incidents] │                                             │
│                   │                                             │
│                   ├─────────────────────────────────────────────┤
│                   │  [✓ Verify]  [→ Forward]  [✗ False Alarm] │
└───────────────────┴─────────────────────────────────────────────┘
```

#### Action Button Logic

| Current Status | Available Actions |
|---------------|-------------------|
| **unverified** | ✓ Verify Fire, ✗ False Alarm |
| **verified** | → Forward to Fire Dept, ✗ False Alarm |
| **forwarded** | (no actions - final state) |
| **false_alarm** | (no actions - final state) |

#### Screenshots Needed

**[SCREENSHOT 5: Monitor Dashboard - Overview]**
- Full dashboard with statistics
- Incident list in sidebar
- Empty detail panel

**[SCREENSHOT 6: Monitor Dashboard - Selected Incident]**
- Incident list with one selected
- Detail panel showing incident info
- Photo visible
- Action buttons at bottom

**[SCREENSHOT 7: Monitor Dashboard - Audit Trail]**
- Scroll down to show audit trail section
- Multiple audit entries visible

**[SCREENSHOT 8: Monitor Dashboard - After Verification]**
- Updated status shown
- New action buttons (Forward/False Alarm)
- Audit trail updated

---

## User Workflows

### Workflow 1: Citizen Reports Fire

```
1. Citizen witnesses fire
   ↓
2. Opens mobile browser → http://[server]/reporter/
   ↓
3. Grants GPS permission
   ↓
4. Waits for GPS lock (shows village/town name)
   ↓
5. Selects language (if not English)
   ↓
6. Taps "Open Camera"
   ↓
7. Takes photo of fire
   ↓
8. Reviews photo preview
   ↓
9. Taps "🚨 Submit Fire Report"
   ↓
10. Sees success message with incident ID
    ↓
11. Form auto-resets after 5 seconds
```

**Time to Complete:** 30-60 seconds

---

### Workflow 2: Operator Triages New Incident

```
1. Operator monitoring dashboard
   ↓
2. Dashboard auto-refreshes, new incident appears
   ↓
3. Unverified count increases
   ↓
4. Operator clicks "New" tab to filter
   ↓
5. Clicks incident card to view details
   ↓
6. Reviews:
   - Photo of fire
   - GPS location (opens Google Maps if needed)
   - Reporter device info
   - Timestamp
   ↓
7. Makes decision:
   ├─ Real fire → Clicks "✓ Verify Fire"
   │  ↓
   │  Status changes to "verified"
   │  Audit trail updated
   │  Statistics update
   │
   └─ False alarm → Clicks "✗ False Alarm"
      ↓
      Status changes to "false_alarm"
      Incident removed from active queue
```

**Time to Complete:** 10-30 seconds per incident

---

### Workflow 3: Operator Forwards Verified Fire

```
1. Operator reviews verified incidents
   ↓
2. Clicks "Verified" tab
   ↓
3. Selects verified incident
   ↓
4. Confirms fire location and severity from photo
   ↓
5. Clicks "→ Forward to Fire Dept"
   ↓
6. Status changes to "forwarded"
   ↓
7. Incident moves to "Forwarded" status
   ↓
8. Fire department receives notification (future feature)
```

**Time to Complete:** 5-15 seconds per incident

---

## Technical Stack

### Backend Dependencies

```json
{
  "name": "eish-alert-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "sqlite3": "^5.1.7",
    "multer": "^1.4.5-lts.1",
    "sharp": "^0.33.0",
    "cors": "^2.8.5"
  }
}
```

### Backend Libraries

| Library | Version | Purpose |
|---------|---------|---------|
| **express** | 4.18.2 | Web framework for REST API |
| **sqlite3** | 5.1.7 | Database driver (callback-based, Windows compatible) |
| **multer** | 1.4.5 | Multipart form data handling for file uploads |
| **sharp** | 0.33.0 | Fast image compression and processing |
| **cors** | 2.8.5 | Cross-Origin Resource Sharing middleware |

### Frontend Technologies

| Technology | Usage |
|------------|-------|
| **HTML5** | Structure and semantics |
| **CSS3** | Styling with gradients, flexbox, grid |
| **JavaScript (ES6+)** | Async/await, fetch API, geolocation API |
| **Geolocation API** | GPS coordinate capture |
| **File Input API** | Camera access and photo capture |
| **LocalStorage** | Device ID persistence |

### External APIs

| API | Purpose | Endpoint |
|-----|---------|----------|
| **OpenStreetMap Nominatim** | Reverse geocoding (coords → place name) | `https://nominatim.openstreetmap.org/reverse` |
| **Google Maps** | View location links | `https://www.google.com/maps?q=lat,lon` |

---

## Security & Privacy

### Data Privacy Considerations

1. **GPS Data**
   - GPS permission requested explicitly
   - Users can deny permission (but can't submit without it)
   - Accuracy level shown to user
   - Raw coordinates stored, never shared publicly

2. **Photos**
   - Stored locally on server filesystem
   - No cloud storage (privacy-first approach)
   - Compressed to 500KB max (reduces storage and bandwidth)
   - Only accessible via API with incident ID

3. **Personal Information**
   - Phone numbers are optional
   - Device IDs are random, not tied to personal info
   - No user accounts or authentication required (for reporters)
   - Anonymous reporting supported

4. **Audit Trail**
   - All actions logged with timestamp
   - Actor identified (system vs operator)
   - Immutable log (no deletions)
   - Provides accountability

### Security Measures

#### Input Validation

1. **File Uploads**
   - File type validation (only images allowed)
   - File size limit (10MB max)
   - File extension whitelist (jpeg, jpg, png, gif, webp)
   - MIME type verification

2. **API Requests**
   - JSON schema validation on PATCH requests
   - SQL injection prevention via parameterized queries
   - Status value whitelist enforcement

3. **GPS Data**
   - Latitude range: -90 to 90
   - Longitude range: -180 to 180
   - Accuracy must be positive integer

#### CORS Configuration

```javascript
app.use(cors()); // Allow all origins for POC
```

**Production Recommendation:** Restrict to specific domains
```javascript
app.use(cors({
  origin: ['https://eish-alert.gov.za', 'https://admin.eish-alert.gov.za']
}));
```

#### Rate Limiting

**Current:** No rate limiting (POC only)

**Production Recommendation:**
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Max 10 submissions per IP per 15 minutes
  message: 'Too many reports from this device. Please try again later.'
});

app.use('/api/incidents', limiter);
```

### Known Security Limitations (POC)

1. ❌ No operator authentication (anyone can access monitor dashboard)
2. ❌ No HTTPS (traffic not encrypted)
3. ❌ No rate limiting (vulnerable to spam)
4. ❌ No CSRF protection
5. ❌ No input sanitization for XSS
6. ❌ Photos stored with predictable filenames
7. ❌ No backup strategy
8. ❌ No database encryption at rest

**These must be addressed before production deployment.**

---

## Deployment Guide

### System Requirements

- **Operating System:** Windows, macOS, or Linux
- **Node.js:** v16.x or higher
- **RAM:** 512MB minimum
- **Storage:** 1GB minimum (for app + photo storage)
- **Network:** HTTP server accessible to mobile devices

### Installation Steps

#### 1. Install Node.js
```bash
# Download from https://nodejs.org/
# Verify installation
node --version
npm --version
```

#### 2. Setup Project
```bash
# Navigate to backend directory
cd C:\dev\Eish\backend

# Install dependencies
npm install
```

#### 3. Initialize Database
Database is automatically created on first run with tables and indexes.

#### 4. Start Server
```bash
node server.js
```

Expected output:
```
Connected to SQLite database
🚨 EishAlert Backend running on http://localhost:3000
📱 Reporter App: http://localhost:3000/reporter/
🖥️  Monitor Dashboard: http://localhost:3000/monitor/
```

#### 5. Access Applications

**Desktop (localhost):**
- Reporter: `http://localhost:3000/reporter/`
- Monitor: `http://localhost:3000/monitor/`

**Mobile (network access):**
1. Find server IP address:
   ```bash
   ipconfig           # Windows
   ifconfig           # macOS/Linux
   ip addr show       # Linux alternative
   ```

2. Access from mobile browser:
   ```
   http://[SERVER_IP]:3000/reporter/

   Example: http://192.168.1.100:3000/reporter/
   ```

### Production Deployment Considerations

#### 1. Process Management
Use PM2 to keep server running:
```bash
npm install -g pm2
pm2 start server.js --name eish-alert
pm2 save
pm2 startup
```

#### 2. Reverse Proxy (Nginx)
```nginx
server {
    listen 80;
    server_name eish-alert.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. HTTPS/SSL
```bash
# Use Let's Encrypt for free SSL certificates
certbot --nginx -d eish-alert.example.com
```

#### 4. Firewall
```bash
# Ubuntu/Debian
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

#### 5. Database Backups
```bash
# Automated backup script
#!/bin/bash
cp /path/to/eish-alert.db /backups/eish-alert-$(date +%Y%m%d-%H%M%S).db
find /backups/ -name "eish-alert-*.db" -mtime +7 -delete
```

Add to crontab:
```
0 2 * * * /path/to/backup-script.sh
```

---

## Testing

### Manual Testing Checklist

#### Reporter App Testing

**GPS Functionality:**
- [ ] GPS permission prompt appears
- [ ] GPS status shows "Searching..." initially
- [ ] GPS status turns green when lock acquired
- [ ] Village/town name displays correctly
- [ ] Coordinates display with accuracy
- [ ] Submit button disabled without GPS

**Camera Functionality:**
- [ ] Camera button opens device camera
- [ ] Photo preview displays after capture
- [ ] Photo is compressed before upload
- [ ] Submit button disabled without photo

**Language Selection:**
- [ ] All 4 languages display correctly
- [ ] Language selection changes button text
- [ ] Error messages translate

**Submission:**
- [ ] Submit button enables when ready
- [ ] Spinner shows during submission
- [ ] Success message displays with incident ID
- [ ] Form resets after 5 seconds

**Error Handling:**
- [ ] GPS denied shows error
- [ ] Network error shows message
- [ ] Large photos are compressed
- [ ] Timeout handling works

#### Monitor Dashboard Testing

**Dashboard Load:**
- [ ] Statistics load correctly
- [ ] All incidents display in sidebar
- [ ] Filters work (All/New/Verified)
- [ ] Auto-refresh works every 5 seconds

**Incident Selection:**
- [ ] Clicking incident loads details
- [ ] Photo displays correctly
- [ ] GPS coordinates shown
- [ ] Audit trail displays
- [ ] Selected card highlights

**Status Updates:**
- [ ] Verify button works
- [ ] Forward button works
- [ ] False Alarm button works
- [ ] Audit trail updates immediately
- [ ] Statistics update
- [ ] No prompt appears

**Edge Cases:**
- [ ] No GPS data displays "Unknown"
- [ ] No photo displays placeholder
- [ ] Empty audit log shows message
- [ ] 404 photo shows error

### API Testing

Use curl or Postman:

```bash
# Health check
curl http://localhost:3000/api/health

# Get all incidents
curl http://localhost:3000/api/incidents

# Get filtered incidents
curl http://localhost:3000/api/incidents?status=unverified

# Get single incident
curl http://localhost:3000/api/incidents/INC-123456

# Update incident status
curl -X PATCH http://localhost:3000/api/incidents/INC-123456 \
  -H "Content-Type: application/json" \
  -d '{"status":"verified","notes":"Fire confirmed","actor":"operator"}'

# Get audit log
curl http://localhost:3000/api/audit/INC-123456
```

### Performance Testing

**Load Test Scenarios:**

1. **Concurrent Reports:** 10 users submitting reports simultaneously
2. **Dashboard Load:** Monitor dashboard with 100+ incidents
3. **Photo Upload:** Upload 10MB photo (should compress to 500KB)
4. **Database Growth:** Test with 1000+ incidents
5. **Auto-Refresh:** Dashboard running for 1 hour continuous

**Expected Performance:**
- API response time: < 200ms
- Photo upload: < 3 seconds
- Dashboard refresh: < 500ms
- Database queries: < 50ms

---

## Future Enhancements

### Phase 2: Enhanced Functionality

#### 1. Operator Authentication
- Login system for operators
- Role-based access control (viewer, operator, admin)
- Session management
- Audit log includes operator names

#### 2. SMS Integration
- Report fires via USSD (*120*FIRE#)
- SMS notifications to reporters on status changes
- SMS alerts to operators for new reports

#### 3. Email Notifications
- Email to fire department on "forward" action
- Include photo, location, and report details
- Configurable email templates

#### 4. Advanced Location Features
- Show all incidents on interactive map
- Cluster nearby incidents
- Calculate distance from fire stations
- Show jurisdiction boundaries

#### 5. Reporting & Analytics
- Daily/weekly/monthly incident reports
- Response time analytics
- False alarm rate tracking
- Heat maps of fire-prone areas
- Export to CSV/PDF

### Phase 3: Mobile Native Apps

#### 6. Android App
- Native GPS integration (faster, more reliable)
- Push notifications
- Offline mode with sync
- Better camera integration

#### 7. iOS App
- Same features as Android
- Apple Maps integration

### Phase 4: Integration & Automation

#### 8. Fire Department Integration
- API for fire department systems
- Real-time incident push
- Status updates from fire department
- Incident closure workflow

#### 9. Weather Integration
- Pull weather data for incidents
- Show wind direction/speed
- Fire danger rating

#### 10. Drone Integration
- Link to drone footage
- Aerial view of fire
- Damage assessment

### Phase 5: AI & Machine Learning

#### 11. Photo Analysis
- AI detection of real fire vs false alarm
- Severity estimation from photo
- Automatic tagging (veld fire, building fire, etc.)

#### 12. Predictive Analytics
- Predict high-risk areas based on historical data
- Seasonal pattern analysis
- Resource allocation recommendations

### Phase 6: Community Features

#### 13. Public Dashboard
- Read-only public view of active fires
- Safety alerts for nearby residents
- Evacuation route suggestions

#### 14. Community Reporting
- Allow status updates from community ("fire extinguished")
- Upvote/verify reports
- Community safety ratings

### Technical Debt & Improvements

#### Short Term
- [ ] Add operator authentication
- [ ] Implement HTTPS/SSL
- [ ] Add rate limiting
- [ ] Input sanitization for XSS
- [ ] CSRF protection
- [ ] Automated tests (Jest/Mocha)
- [ ] Error logging (Winston)
- [ ] Environment variables for config

#### Medium Term
- [ ] Migrate to PostgreSQL (better scalability)
- [ ] Implement caching (Redis)
- [ ] CDN for photo delivery
- [ ] WebSocket for real-time updates
- [ ] Progressive Web App (PWA)
- [ ] Offline support

#### Long Term
- [ ] Microservices architecture
- [ ] Kubernetes deployment
- [ ] Multi-tenancy support
- [ ] API versioning
- [ ] GraphQL API

---

## Appendix

### A. Incident ID Format

Format: `INC-[timestamp]-[random]`

Example: `INC-1762623248908-kg3jdel9r`

- `INC`: Prefix for "incident"
- `1762623248908`: Unix timestamp in milliseconds
- `kg3jdel9r`: Random alphanumeric string (9 chars)

### B. Device ID Format

Format: `DEV-[timestamp]-[random]`

Example: `DEV-1762623245123-abc123`

- Stored in localStorage
- Persists across sessions
- Used to track repeated reports from same device

### C. Photo Compression Settings

```javascript
sharp(inputPath)
  .resize(1200, null, {
    fit: 'inside',
    withoutEnlargement: true
  })
  .jpeg({ quality: 80 }) // Start at 80%, reduce if needed
  .toFile(compressedPath)
```

- Max width: 1200px (maintains aspect ratio)
- JPEG format for best compression
- Quality reduced iteratively until < 500KB
- Minimum quality: 30%

### D. Supported Languages

| Code | Language | Native Name |
|------|----------|-------------|
| eng | English | English |
| afr | Afrikaans | Afrikaans |
| zul | Zulu | isiZulu |
| xho | Xhosa | isiXhosa |

### E. Status Values

| Status | Description | Can Transition To |
|--------|-------------|-------------------|
| unverified | New report, not yet reviewed | verified, false_alarm |
| verified | Confirmed as real fire by operator | forwarded, false_alarm |
| forwarded | Sent to fire department | (terminal state) |
| false_alarm | Not a real fire | (terminal state) |

### F. Browser Compatibility

**Reporter App (Mobile):**
- Chrome/Safari iOS 14+
- Chrome Android 10+
- Samsung Internet 14+

**Monitor Dashboard (Desktop):**
- Chrome 90+
- Firefox 88+
- Edge 90+
- Safari 14+

**Required Features:**
- Geolocation API
- File Input API
- Fetch API
- LocalStorage
- ES6+ JavaScript

### G. File Size Limits

| Item | Limit | Rationale |
|------|-------|-----------|
| Upload size | 10 MB | Multer setting |
| Compressed photo | 500 KB | Sharp processing |
| Database file | No limit | SQLite scales well |
| Total storage | Depends on disk | Photos are main concern |

**Storage Calculation:**
- Average compressed photo: 300 KB
- 1000 incidents: ~300 MB
- 10,000 incidents: ~3 GB

---

## Contact & Support

**Project:** EishAlert Fire Reporting System
**Version:** 2.0.3
**Status:** Proof of Concept - Operational
**Date:** November 2025

---

## Document Revision History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-11-08 | Initial POC specification | Development Team |
| 2.0 | 2025-11-09 | Updated with GPS requirements and location names | Development Team |
| 2.1 | 2025-11-09 | Removed notes prompts, updated UI versions | Development Team |

---

**End of Specification**
