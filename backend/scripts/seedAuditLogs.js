const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', 'config.env') });

const AuditLog = require('../models/auditLogModel');
const User = require('../models/userModel');

const seedAuditLogs = async () => {
  try {
    console.log('🔄 Connecting to database for audit trail bootstrapping...');
    await mongoose.connect(process.env.DATABASE);

    const admin = await User.findOne({ role: 'admin' });
    const seller = await User.findOne({ role: 'seller' });

    const adminId = admin ? admin._id : null;
    const adminEmail = admin ? admin.email : 'admin@apexmart.com';
    const sellerId = seller ? seller._id : null;
    const sellerEmail = seller ? seller.email : 'seller@apexmart.com';

    const now = Date.now();
    const minutesAgo = (m) => new Date(now - m * 60 * 1000);

    const initialLogs = [
      {
        user: adminId,
        action: 'PLATFORM_BOOTSTRAP_INITIALIZED',
        entity: 'System',
        entityId: 'CORE_RUNTIME',
        details: {
          environment: process.env.NODE_ENV || 'development',
          securityCiphers: 'TLSv1.3_AES_GCM',
          rateLimiting: 'Tiered 100/15min',
          immutableAuditTrail: 'Active',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'ApexMart-PlatformDaemon/1.0',
        severity: 'info',
        createdAt: minutesAgo(180),
      },
      {
        user: adminId,
        action: 'CATALOG_INDEX_SYNCHRONIZED',
        entity: 'Product',
        entityId: 'CATALOG_ROOT',
        details: {
          totalProductsIndexed: 12,
          searchFields: ['name', 'description', 'brand', 'category'],
          cacheTTL: '300s',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'ApexMart-CatalogWorker/2.4',
        severity: 'info',
        createdAt: minutesAgo(120),
      },
      {
        user: adminId,
        action: 'USER_ROLE_UPDATED',
        entity: 'User',
        entityId: sellerId ? sellerId.toString() : 'SYSTEM',
        details: {
          targetUserEmail: sellerEmail,
          previousRole: 'user',
          newRole: 'seller',
          promotedBy: adminEmail,
          verificationStatus: 'Store verified with tax ID',
        },
        ipAddress: '192.168.1.105',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        severity: 'warning',
        createdAt: minutesAgo(75),
      },
      {
        user: null,
        action: 'RATE_LIMIT_TRIGGERED',
        entity: 'Security',
        entityId: 'ENDPOINT_AUTH_LOGIN',
        details: {
          reason: 'Excessive consecutive authentication requests from same subnet',
          blockedIp: '203.0.113.42',
          threshold: '10 attempts/hour',
          mitigation: 'HTTP 429 Too Many Requests sent',
        },
        ipAddress: '203.0.113.42',
        userAgent: 'Go-http-client/1.1 (Automated Scanner)',
        severity: 'warning',
        createdAt: minutesAgo(40),
      },
      {
        user: adminId,
        action: 'SECURITY_AUDIT_POLICY_ENFORCED',
        entity: 'Security',
        entityId: 'OWASP_GOVERNANCE',
        details: {
          complianceFramework: 'OWASP Top 10 + SOC2 Type II',
          idorProtection: 'Strict object-level ownership checks',
          csrfTokenHandling: 'SameSite=Strict HttpOnly cookies',
          nosqlInjectionShield: 'Express Mongo Sanitize active',
        },
        ipAddress: '127.0.0.1',
        userAgent: 'ApexMart-SecurityScanner/1.0',
        severity: 'info',
        createdAt: minutesAgo(20),
      },
      {
        user: adminId,
        action: 'ADMIN_PRIVILEGE_ELEVATION',
        entity: 'User',
        entityId: adminId ? adminId.toString() : 'ROOT',
        details: {
          adminEmail: adminEmail,
          privilegeLevel: 'Tier 0 Platform Superuser',
          mfaStatus: 'Verified',
        },
        ipAddress: '192.168.1.100',
        userAgent:
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        severity: 'critical',
        createdAt: minutesAgo(5),
      },
    ];

    console.log(`📝 Inserting ${initialLogs.length} initial audit records...`);
    // Insert using insertMany (which bypasses single-document update pre-hooks)
    await AuditLog.insertMany(initialLogs);
    console.log('✅ Audit trail bootstrap records successfully inserted!');

    await mongoose.disconnect();
    console.log('👋 Database connection closed.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to seed audit logs:', err.message);
    process.exit(1);
  }
};

seedAuditLogs();
