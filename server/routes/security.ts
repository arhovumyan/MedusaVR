import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';

const router = Router();

interface CSPViolationReport {
  'csp-report': {
    'document-uri': string;
    referrer: string;
    'violated-directive': string;
    'effective-directive': string;
    'original-policy': string;
    disposition: string;
    'blocked-uri': string;
    'line-number'?: number;
    'column-number'?: number;
    'source-file'?: string;
    'status-code': number;
    'script-sample'?: string;
  };
}

interface ModernCSPViolationReport {
  age: number;
  body: {
    blockedURL: string;
    columnNumber?: number;
    disposition: string;
    documentURL: string;
    effectiveDirective: string;
    lineNumber?: number;
    originalPolicy: string;
    referrer: string;
    sample?: string;
    sourceFile?: string;
    statusCode: number;
  };
  type: 'csp-violation';
  url: string;
  user_agent: string;
}

// CSP violation reporting endpoint
router.post('/csp-report', async (req: Request, res: Response) => {
  try {
    const contentType = req.headers['content-type'];
    
    // Handle both legacy and modern CSP report formats
    let violation: any;
    
    if (contentType?.includes('application/csp-report')) {
      // Legacy CSP report format
      violation = req.body as CSPViolationReport;
      console.warn('🚨 CSP Violation (Legacy Format):', {
        documentUri: violation['csp-report']['document-uri'],
        violatedDirective: violation['csp-report']['violated-directive'],
        blockedUri: violation['csp-report']['blocked-uri'],
        sourceFile: violation['csp-report']['source-file'],
        lineNumber: violation['csp-report']['line-number'],
        columnNumber: violation['csp-report']['column-number'],
        scriptSample: violation['csp-report']['script-sample'],
        userAgent: req.headers['user-agent'],
        timestamp: new Date().toISOString(),
        ip: req.ip
      });
    } else if (contentType?.includes('application/reports+json')) {
      // Modern CSP report format
      const reports = req.body as ModernCSPViolationReport[];
      
      reports.forEach((report) => {
        if (report.type === 'csp-violation') {
          console.warn('🚨 CSP Violation (Modern Format):', {
            documentURL: report.body.documentURL,
            effectiveDirective: report.body.effectiveDirective,
            blockedURL: report.body.blockedURL,
            sourceFile: report.body.sourceFile,
            lineNumber: report.body.lineNumber,
            columnNumber: report.body.columnNumber,
            sample: report.body.sample,
            userAgent: report.user_agent,
            timestamp: new Date().toISOString(),
            ip: req.ip,
            age: report.age
          });
        }
      });
    } else {
      console.warn('🚨 Unknown CSP report format:', {
        contentType,
        body: req.body,
        timestamp: new Date().toISOString(),
        ip: req.ip
      });
    }

    // In production, you might want to:
    // 1. Store violations in a database
    // 2. Send alerts for critical violations
    // 3. Aggregate violation statistics
    // 4. Filter out false positives
    
    // For now, just log and return success
    res.status(204).send(); // No Content response as per CSP spec
    
  } catch (error) {
    console.error('Error processing CSP violation report:', error);
    res.status(400).json({ error: 'Invalid CSP report format' });
  }
});

// CSP report-only endpoint for testing
router.post('/csp-report-only', async (req: Request, res: Response) => {
  try {
    console.log('📊 CSP Report-Only Violation:', {
      body: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString(),
      ip: req.ip
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Error processing CSP report-only:', error);
    res.status(400).json({ error: 'Invalid CSP report format' });
  }
});

// Security headers test endpoint
router.get('/test-headers', (req: Request, res: Response) => {
  res.json({
    message: 'Security headers test endpoint',
    headers: req.headers,
    timestamp: new Date().toISOString(),
    cspNonce: res.locals.nonce || 'not-set',
    securityHeaders: {
      'content-security-policy': res.get('Content-Security-Policy'),
      'x-frame-options': res.get('X-Frame-Options'),
      'x-content-type-options': res.get('X-Content-Type-Options'),
      'cross-origin-embedder-policy': res.get('Cross-Origin-Embedder-Policy'),
      'cross-origin-opener-policy': res.get('Cross-Origin-Opener-Policy')
    }
  });
});

export default router;
