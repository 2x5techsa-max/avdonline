const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize database
const dbPath = path.join(__dirname, 'eish-alert.db');
const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Create tables
db.exec(`
    CREATE TABLE IF NOT EXISTS incidents (
        id TEXT PRIMARY KEY,
        device_id TEXT,
        phone TEXT,
        timestamp TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        accuracy INTEGER,
        language TEXT,
        transmission_type TEXT DEFAULT 'app',
        photo_path TEXT,
        status TEXT DEFAULT 'unverified',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        incident_id TEXT NOT NULL,
        action TEXT NOT NULL,
        actor TEXT DEFAULT 'system',
        notes TEXT,
        timestamp TEXT NOT NULL,
        FOREIGN KEY(incident_id) REFERENCES incidents(id)
    );

    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_log_incident_id ON audit_log(incident_id);
`);

// Prepared statements for better performance
const statements = {
    createIncident: db.prepare(`
        INSERT INTO incidents (
            id, device_id, phone, timestamp, latitude, longitude,
            accuracy, language, transmission_type, photo_path,
            status, created_at, updated_at
        ) VALUES (
            @id, @device_id, @phone, @timestamp, @latitude, @longitude,
            @accuracy, @language, @transmission_type, @photo_path,
            @status, @created_at, @updated_at
        )
    `),

    getIncidents: db.prepare(`
        SELECT * FROM incidents
        ORDER BY created_at DESC
    `),

    getIncidentsByStatus: db.prepare(`
        SELECT * FROM incidents
        WHERE status = ?
        ORDER BY created_at DESC
    `),

    getIncidentById: db.prepare(`
        SELECT * FROM incidents
        WHERE id = ?
    `),

    updateIncidentStatus: db.prepare(`
        UPDATE incidents
        SET status = @status, updated_at = @updated_at
        WHERE id = @id
    `),

    addAuditLog: db.prepare(`
        INSERT INTO audit_log (incident_id, action, actor, notes, timestamp)
        VALUES (@incident_id, @action, @actor, @notes, @timestamp)
    `),

    getAuditLog: db.prepare(`
        SELECT * FROM audit_log
        WHERE incident_id = ?
        ORDER BY timestamp DESC
    `)
};

// Helper functions
function createIncident(data) {
    const now = new Date().toISOString();
    const incident = {
        id: data.id || generateId(),
        device_id: data.device_id || null,
        phone: data.phone || null,
        timestamp: data.timestamp,
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        accuracy: data.accuracy || null,
        language: data.language || 'eng',
        transmission_type: data.transmission_type || 'app',
        photo_path: data.photo_path || null,
        status: 'unverified',
        created_at: now,
        updated_at: now
    };

    statements.createIncident.run(incident);

    // Add audit log entry
    statements.addAuditLog.run({
        incident_id: incident.id,
        action: 'created',
        actor: 'system',
        notes: `Incident created via ${incident.transmission_type}`,
        timestamp: now
    });

    return incident;
}

function getIncidents(filters = {}) {
    if (filters.status) {
        return statements.getIncidentsByStatus.all(filters.status);
    }
    return statements.getIncidents.all();
}

function getIncidentById(id) {
    return statements.getIncidentById.get(id);
}

function updateIncident(id, updates, actor = 'operator') {
    const now = new Date().toISOString();

    if (updates.status) {
        statements.updateIncidentStatus.run({
            id,
            status: updates.status,
            updated_at: now
        });

        // Add audit log
        statements.addAuditLog.run({
            incident_id: id,
            action: 'status_changed',
            actor,
            notes: updates.notes || `Status changed to ${updates.status}`,
            timestamp: now
        });
    }

    return getIncidentById(id);
}

function getAuditLog(incidentId) {
    return statements.getAuditLog.all(incidentId);
}

function generateId() {
    return 'INC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

module.exports = {
    db,
    createIncident,
    getIncidents,
    getIncidentById,
    updateIncident,
    getAuditLog,
    generateId
};
