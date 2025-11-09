# EishAlert Fire Reporting System
## Functional Specification

**Version:** 1.0
**Date:** November 2025
**Purpose:** Simple, fast fire incident reporting for South African communities

---

## The Problem

When someone sees a fire, every second counts. But current reporting methods are slow and inefficient:

- **Calling emergency services** takes time to explain location
- **Language barriers** delay communication
- **No visual evidence** means operators can't assess severity
- **Uncertain locations** waste time finding the fire
- **No tracking** means duplicate reports and confusion

**Result:** Delayed response, wasted resources, lives and property at risk.

---

## The Solution

**EishAlert:** Three simple steps to report a fire.

### For Citizens (Mobile App)

```
1. See a fire
2. Take a photo
3. Send it
```

**That's it.**

The system automatically captures:
- GPS location (latitude, longitude, accuracy)
- Phone number (for callback)
- Timestamp
- Photo evidence

Available in **4 languages**: English, Afrikaans, Zulu, Xhosa

---

## For Emergency Operators (Desktop Dashboard)

**Real-time incident monitoring:**

1. **See new fire reports** as they arrive
2. **View photo, location, and details** instantly
3. **Verify or reject** with one click
4. **Forward to fire department** if verified

**Complete tracking:**
- Who did what, when
- Status of every incident
- Statistics and reporting

---

## What Must Happen

### When Someone Reports a Fire

**Input:**
- Photo of the fire (required)
- GPS coordinates (automatic)
- Phone number (automatic)
- Language preference

**Output:**
- Incident created in system
- Unique incident ID assigned
- Confirmation shown to reporter
- Alert sent to operator dashboard

**Time:** Under 60 seconds

---

### When Operator Reviews Report

**Input:**
- New unverified incident

**Actions Available:**
1. **Verify** - Confirm it's a real fire
2. **Reject** - Mark as false alarm

**Output:**
- Status updated
- Action logged with timestamp
- Statistics updated

**Time:** 10-30 seconds per incident

---

### When Operator Forwards to Fire Department

**Input:**
- Verified incident

**Action:**
- Forward to fire department

**Output:**
- Status updated to "Forwarded"
- Fire department receives notification (future phase)
- Incident moved to completed queue

**Time:** 5-15 seconds

---

## Core Requirements

### Mobile Reporter App

**MUST HAVE:**
1. Camera access for photo capture
2. GPS location capture (mandatory)
3. Show location name (village/town) to user
4. Phone number capture
5. Language selection (4 languages)
6. Simple one-button submission
7. Confirmation with incident ID
8. Work on any mobile browser (no app store needed)

**MUST NOT:**
- Require user login/registration
- Be complicated or have multiple screens
- Require internet connection for GPS (uses device GPS)
- Allow submission without photo AND GPS

### Desktop Monitor Dashboard

**MUST HAVE:**
1. Live list of all incidents
2. Filter by status (All/New/Verified/Forwarded/False Alarm)
3. Click incident to see full details:
   - Photo (full size)
   - GPS coordinates
   - Link to view on map
   - Phone number
   - Timestamp
   - Language used
4. One-click status changes (no popups or forms)
5. Complete audit trail showing all actions
6. Live statistics (counts by status)
7. Auto-refresh every 5 seconds

**MUST NOT:**
- Require page refresh to see new incidents
- Have complicated workflows
- Require multiple clicks to complete actions
- Allow incidents to be deleted (audit trail integrity)

---

## Data Requirements

### What Gets Stored

**Per Incident:**
- Unique incident ID (system generated)
- Photo file
- GPS latitude and longitude
- GPS accuracy (meters)
- Phone number
- Device ID (for tracking repeat reporters)
- Language selected
- Report timestamp
- Current status
- Created and last updated timestamps

**Per Status Change:**
- Incident ID
- Action taken (created/verified/forwarded/rejected)
- Who did it (system or operator name)
- When it happened
- Optional notes

### What Gets Displayed

**Mobile App Shows:**
- GPS status (searching/locked/error)
- Location name (village/town)
- Language selection
- Photo preview
- Success confirmation with incident ID

**Desktop Dashboard Shows:**
- All incidents with key info (ID, time, location, status)
- Statistics (count by status)
- Full incident details when selected
- Complete audit trail
- Photo at full resolution

---

## User Workflows

### Workflow 1: Report a Fire

```
Citizen:
├─ Opens mobile browser to reporter URL
├─ GPS automatically activates
├─ Selects language (if not English)
├─ Waits for GPS lock (sees village name)
├─ Taps "Open Camera"
├─ Takes photo of fire
├─ Reviews photo
├─ Taps "Submit Fire Report"
└─ Sees success with incident ID

Time: 30-60 seconds
```

### Workflow 2: Triage New Report

```
Operator:
├─ Sees new incident appear on dashboard
├─ Clicks incident to view details
├─ Reviews photo and location
├─ Opens map link if needed
├─ Makes decision:
│  ├─ REAL FIRE → Click "Verify Fire"
│  └─ FALSE ALARM → Click "False Alarm"
└─ Incident status updates immediately

Time: 10-30 seconds
```

### Workflow 3: Forward to Fire Department

```
Operator:
├─ Views verified incidents
├─ Clicks verified incident
├─ Reviews severity
├─ Clicks "Forward to Fire Department"
└─ Status changes to "Forwarded"

Time: 5-15 seconds
```

---

## Status Lifecycle

```
UNVERIFIED (orange)
    ↓
    ├─ Verify → VERIFIED (green)
    │               ↓
    │               └─ Forward → FORWARDED (blue) [FINAL]
    │
    └─ Reject → FALSE ALARM (grey) [FINAL]
```

**Status Definitions:**

| Status | Meaning | Actions Available |
|--------|---------|-------------------|
| **Unverified** | New report, not yet reviewed | Verify, Reject |
| **Verified** | Confirmed real fire by operator | Forward, Reject |
| **Forwarded** | Sent to fire department | (none - final) |
| **False Alarm** | Not a real fire | (none - final) |

---

## Geographic Coverage

**Designed for South Africa:**
- Supports SA mobile networks (all carriers)
- GPS works nationwide
- Reverse geocoding shows SA place names
- Languages cover major SA languages
- Can expand to other African countries

---

## Performance Requirements

| Metric | Target | Critical? |
|--------|--------|-----------|
| Mobile app load time | < 3 seconds | Yes |
| GPS lock time | < 10 seconds | Yes |
| Photo upload time | < 5 seconds | Yes |
| Dashboard refresh | < 1 second | No |
| Concurrent reporters | 50+ | Phase 2 |
| Photo size | < 500KB (compressed) | Yes |
| Dashboard capacity | 1000+ incidents | No |

---

## Constraints & Limitations

### What This System Does NOT Do

❌ Does not dispatch fire trucks (operators do that)
❌ Does not replace 10111 or emergency numbers
❌ Does not provide real-time navigation to fire
❌ Does not predict fires or provide early warning
❌ Does not store personal information beyond phone number
❌ Does not require user accounts or passwords
❌ Does not work offline (needs data for photo upload)

### Known Limitations (POC)

- No operator authentication (anyone can access dashboard)
- No SMS/USSD reporting option yet
- No notifications to fire department (manual process)
- No analytics or reporting features yet
- Phone number captured but not used for callbacks yet
- Single operator view (no multi-operator coordination)

---

## Success Criteria

### For Citizens
✓ Can report fire in under 60 seconds
✓ GPS automatically captures location
✓ Can use in their own language
✓ Gets confirmation their report was received
✓ No need to explain location or situation

### For Operators
✓ See all new fires immediately
✓ Can view photo evidence instantly
✓ Can verify/reject in 10-30 seconds
✓ Full audit trail of all actions
✓ Never miss a report

### For Fire Departments
✓ Receive verified incidents only (no false alarms)
✓ Get exact GPS coordinates
✓ Have photo evidence of severity
✓ Can plan response based on visual information
✓ Know language of reporter for callbacks

---

## Future Enhancements (Phase 2+)

### Short Term (3-6 months)
- Operator login and authentication
- SMS/USSD reporting option (for feature phones)
- Email notifications to fire department
- WhatsApp integration for updates
- Basic analytics and reporting

### Medium Term (6-12 months)
- Mobile native apps (Android/iOS)
- Push notifications
- Interactive map view
- Fire department integration (API)
- Multi-operator coordination

### Long Term (12+ months)
- AI photo analysis (severity detection)
- Predictive fire risk mapping
- Public alert system
- Integration with weather data
- Drone coordination

---

## Non-Functional Requirements

### Usability
- No training required for citizens
- Minimal training for operators (< 30 minutes)
- Works on any smartphone (Android/iOS)
- Works on any desktop browser
- Accessible in poor lighting (photo flash)

### Reliability
- 99% uptime during operating hours
- No data loss (all incidents saved)
- Automatic backup of database
- Photo storage redundancy

### Security
- GPS and phone data kept private
- Photos only accessible via incident ID
- Audit trail immutable (cannot be altered)
- No public access to incident details

### Scalability
- Start with single municipality
- Expand to multiple municipalities
- Eventually province-wide
- National rollout possible

---

## Key Assumptions

1. **Citizens have smartphones** with camera and GPS
2. **Citizens have data connection** to upload photo
3. **Operators have desktop computers** with internet
4. **Fire departments** will be trained to receive digital reports
5. **GPS accuracy** of 10-50 meters is acceptable
6. **Photo quality** sufficient even when compressed
7. **Response time** measured from report to operator verification, not full fire response

---

## Out of Scope (Not Part of This System)

- Emergency call center operations
- Fire truck dispatch systems
- Firefighter coordination tools
- Equipment inventory management
- Training and certification systems
- Public education campaigns
- Fire prevention programs
- Insurance claim processing
- Post-fire investigation tools

---

## Integration Points (Future)

**This system must be able to integrate with:**

1. **Emergency Services Systems** - Send incidents to existing CAD (Computer-Aided Dispatch) systems
2. **GIS Systems** - Export locations to municipal GIS for mapping
3. **Communication Systems** - Send alerts via SMS, email, WhatsApp
4. **Weather Services** - Pull wind and weather data
5. **Fire Department Records** - Log incidents in official records

**Standard export formats:**
- CSV (for spreadsheets)
- JSON (for APIs)
- GeoJSON (for mapping)
- PDF (for reports)

---

## Glossary

| Term | Definition |
|------|------------|
| **Incident** | A single fire report with photo, location, and metadata |
| **Reporter** | Person who sees fire and submits report via mobile app |
| **Operator** | Emergency services personnel who triage reports |
| **GPS Lock** | When device has acquired accurate location |
| **Reverse Geocoding** | Converting GPS coordinates to place names |
| **Audit Trail** | Complete history of all actions on an incident |
| **Status** | Current state of incident (unverified/verified/forwarded/false alarm) |
| **False Alarm** | Report that is not a real fire |
| **Forwarded** | Verified fire sent to fire department |

---

## Acceptance Criteria

### This system is complete when:

**Mobile App:**
- [ ] Anyone can access URL and report fire without login
- [ ] GPS automatically captures and shows location name
- [ ] Photo uploads successfully with compression
- [ ] Phone number captured automatically
- [ ] All 4 languages work correctly
- [ ] Confirmation shown with incident ID
- [ ] Works on iPhone and Android devices

**Desktop Dashboard:**
- [ ] All incidents appear in real-time
- [ ] Can filter by status
- [ ] Clicking incident shows full details
- [ ] Photos display at full resolution
- [ ] GPS links to Google Maps
- [ ] One-click verify/forward/reject works
- [ ] Audit trail shows all changes
- [ ] Statistics update automatically
- [ ] Auto-refresh every 5 seconds works

**System:**
- [ ] No data loss under any conditions
- [ ] All incidents have complete audit trail
- [ ] Photos stored securely
- [ ] System can handle 50+ concurrent users
- [ ] Response time under 3 seconds
- [ ] Works 24/7 without manual intervention

---

## Document Approval

**This specification must be approved by:**

- [ ] Emergency Services Management
- [ ] Fire Department Chief
- [ ] Municipal IT Department
- [ ] Community Safety Director
- [ ] Privacy Officer
- [ ] Project Sponsor

**Signature:**

---

**Version Control:**

| Version | Date | Changes | Approved By |
|---------|------|---------|-------------|
| 1.0 | 2025-11-08 | Initial functional specification | Pending |

---

**End of Functional Specification**
