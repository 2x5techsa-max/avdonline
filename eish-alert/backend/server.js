const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const {
    createIncident,
    getIncidents,
    getIncidentById,
    updateIncident,
    getAuditLog,
    generateId
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static frontend files
app.use('/reporter', express.static(path.join(__dirname, '../reporter')));
app.use('/monitor', express.static(path.join(__dirname, '../monitor')));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        cb(null, uniqueName + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max upload
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);

        if (extname && mimetype) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Compress image to max 500KB
async function compressImage(inputPath, maxSizeKB = 500) {
    const compressedPath = inputPath.replace(/\.[^.]+$/, '-compressed.jpg');

    try {
        let quality = 80;
        let compressed = false;

        while (!compressed && quality >= 30) {
            await sharp(inputPath)
                .resize(1200, null, {
                    fit: 'inside',
                    withoutEnlargement: true
                })
                .jpeg({ quality })
                .toFile(compressedPath);

            const stats = fs.statSync(compressedPath);
            const sizeKB = stats.size / 1024;

            if (sizeKB <= maxSizeKB) {
                compressed = true;
            } else {
                quality -= 10;
                fs.unlinkSync(compressedPath);
            }
        }

        // Delete original, keep compressed
        fs.unlinkSync(inputPath);
        return compressedPath;

    } catch (error) {
        console.error('Image compression error:', error);
        // If compression fails, return original
        return inputPath;
    }
}

// API Routes

// POST /api/incidents - Create new incident
app.post('/api/incidents', upload.single('photo'), async (req, res) => {
    try {
        const { location, language, deviceId, phone } = req.body;

        let locationData = {};
        if (location) {
            try {
                locationData = typeof location === 'string' ? JSON.parse(location) : location;
            } catch (e) {
                console.error('Error parsing location:', e);
            }
        }

        const incidentId = generateId();
        let photoPath = null;

        // Handle photo upload and compression
        if (req.file) {
            const compressedPath = await compressImage(req.file.path);
            photoPath = path.basename(compressedPath);
        }

        const incidentData = {
            id: incidentId,
            device_id: deviceId || null,
            phone: phone || null,
            timestamp: new Date().toISOString(),
            latitude: locationData.latitude || null,
            longitude: locationData.longitude || null,
            accuracy: locationData.accuracy || null,
            language: language || 'eng',
            transmission_type: 'app',
            photo_path: photoPath
        };

        const incident = createIncident(incidentData);

        res.status(201).json({
            success: true,
            incidentId: incident.id,
            message: 'Incident reported successfully'
        });

    } catch (error) {
        console.error('Error creating incident:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create incident',
            message: error.message
        });
    }
});

// GET /api/incidents - Get all incidents
app.get('/api/incidents', (req, res) => {
    try {
        const { status, limit } = req.query;

        const filters = {};
        if (status) {
            filters.status = status;
        }

        let incidents = getIncidents(filters);

        if (limit) {
            incidents = incidents.slice(0, parseInt(limit));
        }

        res.json({
            success: true,
            count: incidents.length,
            incidents
        });

    } catch (error) {
        console.error('Error fetching incidents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch incidents',
            message: error.message
        });
    }
});

// GET /api/incidents/:id - Get specific incident
app.get('/api/incidents/:id', (req, res) => {
    try {
        const incident = getIncidentById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                success: false,
                error: 'Incident not found'
            });
        }

        // Include audit log
        const auditLog = getAuditLog(req.params.id);

        res.json({
            success: true,
            incident,
            auditLog
        });

    } catch (error) {
        console.error('Error fetching incident:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch incident',
            message: error.message
        });
    }
});

// PATCH /api/incidents/:id - Update incident
app.patch('/api/incidents/:id', (req, res) => {
    try {
        const { status, notes, actor } = req.body;

        const incident = getIncidentById(req.params.id);
        if (!incident) {
            return res.status(404).json({
                success: false,
                error: 'Incident not found'
            });
        }

        const updates = {};
        if (status) updates.status = status;
        if (notes) updates.notes = notes;

        const updatedIncident = updateIncident(req.params.id, updates, actor || 'operator');

        res.json({
            success: true,
            incident: updatedIncident
        });

    } catch (error) {
        console.error('Error updating incident:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update incident',
            message: error.message
        });
    }
});

// GET /api/incidents/:id/photo - Get incident photo
app.get('/api/incidents/:id/photo', (req, res) => {
    try {
        const incident = getIncidentById(req.params.id);

        if (!incident) {
            return res.status(404).json({
                success: false,
                error: 'Incident not found'
            });
        }

        if (!incident.photo_path) {
            return res.status(404).json({
                success: false,
                error: 'No photo available for this incident'
            });
        }

        const photoPath = path.join(uploadsDir, incident.photo_path);

        if (!fs.existsSync(photoPath)) {
            return res.status(404).json({
                success: false,
                error: 'Photo file not found'
            });
        }

        res.sendFile(photoPath);

    } catch (error) {
        console.error('Error fetching photo:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch photo',
            message: error.message
        });
    }
});

// GET /api/audit/:incidentId - Get audit log for incident
app.get('/api/audit/:incidentId', (req, res) => {
    try {
        const auditLog = getAuditLog(req.params.incidentId);

        res.json({
            success: true,
            count: auditLog.length,
            auditLog
        });

    } catch (error) {
        console.error('Error fetching audit log:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch audit log',
            message: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// Root redirect
app.get('/', (req, res) => {
    res.send(`
        <html>
            <head>
                <title>EishAlert Fire Reporting System</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: 50px auto;
                        padding: 20px;
                        background: #f5f5f5;
                    }
                    h1 { color: #d32f2f; }
                    a {
                        display: block;
                        margin: 10px 0;
                        padding: 15px;
                        background: #fff;
                        text-decoration: none;
                        color: #333;
                        border-radius: 5px;
                        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    }
                    a:hover { background: #e3f2fd; }
                </style>
            </head>
            <body>
                <h1>🚨 EishAlert Fire Reporting System</h1>
                <p>Choose your interface:</p>
                <a href="/reporter/">📱 Reporter App (Mobile)</a>
                <a href="/monitor/">🖥️ Monitor Dashboard (Desktop)</a>
                <a href="/api/health">🔍 API Health Check</a>
            </body>
        </html>
    `);
});

// Error handling middleware
app.use((error, req, res, next) => {
    console.error('Server error:', error);
    res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚨 EishAlert Backend running on http://localhost:${PORT}`);
    console.log(`📱 Reporter App: http://localhost:${PORT}/reporter/`);
    console.log(`🖥️  Monitor Dashboard: http://localhost:${PORT}/monitor/`);
});

module.exports = app;
