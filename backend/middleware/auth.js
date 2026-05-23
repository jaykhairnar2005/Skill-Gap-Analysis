require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    console.error('[CRITICAL] JWT_SECRET is missing from environment variables.');
    console.error('Create a .env file with JWT_SECRET=your_new_secure_key');
    // We don't throw here to avoid crashing immediately on require, but auth will fail.
} else {
    console.log('JWT auth middleware initialized');
}

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // Debug logging
    console.log(`[Auth] Verifying request to: ${req.method} ${req.originalUrl}`);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn('[Auth] Missing or malformed Authorization header');
        return res.status(401).json({ error: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1];

    if (!token || token === 'null' || token === 'undefined') {
        console.warn('[Auth] Token is explicitly null or undefined');
        return res.status(401).json({ error: 'No valid token provided' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.error('[Auth] Verification failed:', err.message);
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = decoded;
        next();
    });
};

// Middleware to generate JWT token
const generateToken = (userId, email) => {
    return jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};

// Error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
    verifyToken,
    generateToken,
    asyncHandler
};
