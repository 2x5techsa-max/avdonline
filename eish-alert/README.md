# 🚨 EishAlert - Fire Reporting System

A mobile-first fire reporting system for South African communities, enabling citizens to report fires with photos and GPS location directly to emergency services.

## Features

### 📱 Mobile Reporter App
- **Multi-language support**: English, Afrikaans, isiXhosa, isiZulu
- **Photo capture**: Simple file picker for quick photo uploads
- **GPS location**: Automatic location capture with high accuracy
- **Image compression**: Auto-compresses photos to max 500KB for fast uploads
- **Offline support**: Queue reports when offline, auto-send when connection restored
- **Mobile-optimized**: Large buttons, simple interface, works on all mobile devices

### 🖥️ Operator Dashboard
- **Real-time monitoring**: Auto-refresh every 5 seconds
- **Status filtering**: View incidents by status (unverified, verified, forwarded, false alarm)
- **Quick actions**: Verify fires, mark false alarms, forward to fire stations
- **Area detection**: Automatically categorizes incidents by region (Cape Metro, Swartland, etc.)
- **Audit trail**: Complete history of all actions taken on each incident
- **Photo viewing**: View compressed incident photos inline

### 🔧 Backend
- **Node.js + Express**: Simple, fast, and reliable API
- **SQLite database**: File-based, no setup required, perfect for deployment
- **Image compression**: Server-side compression using Sharp
- **RESTful API**: Clean endpoints for all operations
- **Audit logging**: Track all changes to incidents

## Project Structure

```
eish-alert/
├── backend/
│   ├── server.js          # Express API server
│   ├── database.js        # SQLite database setup and queries
│   ├── package.json       # Node.js dependencies
│   └── uploads/           # Photo storage (auto-created)
├── reporter/
│   └── index.html         # Mobile reporter app (single file)
├── monitor/
│   └── index.html         # Operator dashboard (single file)
└── README.md
```

## Installation

### Prerequisites
- Node.js 18+ (install from https://nodejs.org)
- Git (for deployment)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd eish-alert
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Start the server**
   ```bash
   npm start
   ```

4. **Access the apps**
   - Server: http://localhost:3000
   - Reporter App: http://localhost:3000/reporter/
   - Monitor Dashboard: http://localhost:3000/monitor/

## API Endpoints

### POST /api/incidents
Create a new fire incident report.

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body:
  - `photo` (file): Photo of the fire
  - `location` (JSON string): `{"latitude": -33.9, "longitude": 18.4, "accuracy": 10}`
  - `language` (string): `eng`, `afr`, `xho`, or `zul`
  - `deviceId` (string): Unique device identifier

**Response:**
```json
{
  "success": true,
  "incidentId": "INC-1234567890-abc123",
  "message": "Incident reported successfully"
}
```

### GET /api/incidents
Get all incidents, optionally filtered by status.

**Query Parameters:**
- `status` (optional): Filter by status (`unverified`, `verified`, `forwarded`, `false_alarm`)
- `limit` (optional): Limit number of results

**Response:**
```json
{
  "success": true,
  "count": 10,
  "incidents": [...]
}
```

### GET /api/incidents/:id
Get a specific incident with full details and audit log.

**Response:**
```json
{
  "success": true,
  "incident": {...},
  "auditLog": [...]
}
```

### PATCH /api/incidents/:id
Update an incident's status.

**Request:**
```json
{
  "status": "verified",
  "notes": "Fire confirmed by operator",
  "actor": "operator"
}
```

### GET /api/incidents/:id/photo
Get the compressed photo for an incident.

**Response:** Image file (JPEG)

## Database Schema

### incidents table
```sql
CREATE TABLE incidents (
    id TEXT PRIMARY KEY,              -- INC-timestamp-random
    device_id TEXT,                   -- Unique device identifier
    phone TEXT,                       -- Phone number (for SMS reports)
    timestamp TEXT NOT NULL,          -- Report timestamp
    latitude REAL,                    -- GPS latitude
    longitude REAL,                   -- GPS longitude
    accuracy INTEGER,                 -- GPS accuracy in meters
    language TEXT,                    -- UI language used
    transmission_type TEXT,           -- 'app' or 'sms'
    photo_path TEXT,                  -- Filename of compressed photo
    status TEXT DEFAULT 'unverified', -- Incident status
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

### audit_log table
```sql
CREATE TABLE audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    incident_id TEXT NOT NULL,
    action TEXT NOT NULL,             -- 'created', 'status_changed', etc.
    actor TEXT DEFAULT 'system',      -- Who performed the action
    notes TEXT,                       -- Additional notes
    timestamp TEXT NOT NULL,
    FOREIGN KEY(incident_id) REFERENCES incidents(id)
);
```

## Deployment

### Option 1: Render.com (Recommended - FREE)

1. **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Initial EishAlert deployment"
   git push origin main
   ```

2. **Create Render account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create new Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Settings:
     - **Name**: `eish-alert`
     - **Environment**: `Node`
     - **Build Command**: `cd backend && npm install`
     - **Start Command**: `cd backend && node server.js`
     - **Instance Type**: Free

4. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment (2-3 minutes)
   - Your app will be live at `https://eish-alert.onrender.com`

5. **Access apps**
   - Reporter: `https://eish-alert.onrender.com/reporter/`
   - Monitor: `https://eish-alert.onrender.com/monitor/`

### Option 2: Railway.app (Alternative)

1. Install Railway CLI
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy
   ```bash
   railway login
   cd eish-alert/backend
   railway init
   railway up
   ```

### Option 3: VPS (DigitalOcean, AWS, etc.)

1. SSH into your server
2. Install Node.js 18+
3. Clone repository
4. Install dependencies and start with PM2:
   ```bash
   npm install -g pm2
   cd eish-alert/backend
   npm install
   pm2 start server.js --name eish-alert
   pm2 save
   pm2 startup
   ```

5. Configure nginx reverse proxy (optional)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

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

## Testing

### Mobile Reporter Testing
1. Open http://localhost:3000/reporter/ on your phone (ensure phone is on same network)
2. Select language
3. Grant GPS permissions
4. Take a photo of any fire or simulated fire
5. Click "Send Alert"
6. Verify success message

### Monitor Dashboard Testing
1. Open http://localhost:3000/monitor/ on desktop
2. Verify incident appears in list
3. Click incident to view details
4. Test "Verify Fire" button
5. Test "Forward to Fire Station" feature
6. Check audit trail

### Offline Testing (Reporter)
1. Open reporter app
2. Turn on airplane mode
3. Submit a report
4. Check browser console - should see offline queue message
5. Turn off airplane mode
6. Report should auto-send within 5 seconds

## Configuration

### Change Port
Edit `backend/server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Add Fire Stations
Edit `monitor/index.html` - find `fireStations` object:
```javascript
const fireStations = {
    'Cape Metro': [
        { name: 'New Station', contact: '+27211234599' }
    ]
};
```

### Adjust Image Compression
Edit `backend/server.js` - find `compressImage` function:
```javascript
async function compressImage(inputPath, maxSizeKB = 500) {
    // Change maxSizeKB to desired size
}
```

## Troubleshooting

### Photos not uploading
- Check `backend/uploads/` directory exists and is writable
- Verify file size is under 10MB
- Check browser console for errors

### GPS not working
- Ensure HTTPS is enabled (required for GPS on mobile)
- Check browser permissions for location access
- Test on actual device, not emulator

### Database errors
- Delete `backend/eish-alert.db` and restart server to reset database
- Check file permissions on database file

### Server won't start
```bash
# Check if port 3000 is in use
lsof -i :3000

# Kill process if needed
kill -9 <PID>

# Or use different port
PORT=8080 node server.js
```

## Future Enhancements

- [ ] SMS gateway integration (Twilio / Africa's Talking)
- [ ] WhatsApp Business API for automatic forwarding
- [ ] Push notifications for operators
- [ ] User authentication and roles
- [ ] Multi-category support (medical, police, etc.)
- [ ] AI-powered smoke detection
- [ ] Public incident map
- [ ] Analytics dashboard
- [ ] Mobile app (React Native)

## Technology Stack

- **Backend**: Node.js, Express, SQLite, Multer, Sharp
- **Frontend**: Vanilla HTML/CSS/JavaScript (no frameworks)
- **Database**: SQLite3 (better-sqlite3)
- **Image Processing**: Sharp
- **Storage**: File system (local or cloud)

## License

MIT License - feel free to use and modify for your community!

## Support

For issues or questions:
1. Check this README first
2. Review the code comments
3. Test on different devices
4. Check browser console for errors

## Credits

Built with ❤️ for South African communities to improve emergency response times and save lives.
