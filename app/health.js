/**
 * API Health & System Diagnostics Monitor
 * Location: /app/health.js
 * 
 * Provides comprehensive health status, latency benchmarks, and endpoint
 * availability checks for all website APIs and upstream data providers.
 */

export async function checkApiHealth(options = {}) {
  const startTime = Date.now();
  const baseUrl = options.baseUrl || `http://127.0.0.1:${process.env.PORT || 3000}`;
  
  // Environment & API Key detection
  const envCandidates = [
    ['ALPHAVANTAGE_API_KEY', process.env.ALPHAVANTAGE_API_KEY],
    ['ALPHA_VANTAGE_API_KEY', process.env.ALPHA_VANTAGE_API_KEY],
  ];

  let rawKey = '';
  let keySource = 'none';

  for (const [name, val] of envCandidates) {
    if (val && typeof val === 'string') {
      const trimmed = val.trim().replace(/^["']|["']$/g, '');
      if (trimmed.length > 0) {
        rawKey = trimmed;
        keySource = name;
        break;
      }
    }
  }

  const hasApiKey = Boolean(rawKey && rawKey.length > 0);
  const apiKey = hasApiKey ? rawKey : 'demo';
  const maskedKey = hasApiKey
    ? `${apiKey.slice(0, 3)}...${apiKey.slice(-4)} (${apiKey.length} chars, from ${keySource})`
    : 'Not configured (using demo / benchmark mode)';

  // 1. Check External Alpha Vantage Gateway Connectivity
  const externalChecks = {};
  const externalStart = Date.now();
  try {
    const alphaTestUrl = `https://www.alphavantage.co/query?function=CURRENCY_EXCHANGE_RATE&from_currency=USD&to_currency=SGD&apikey=${encodeURIComponent(apiKey)}`;
    const alphaRes = await fetch(alphaTestUrl, { signal: AbortSignal.timeout(6000) });
    const alphaLatency = Date.now() - externalStart;

    if (!alphaRes.ok) {
      externalChecks['AlphaVantage_Gateway'] = {
        status: 'DEGRADED',
        httpStatus: alphaRes.status,
        message: `HTTP ${alphaRes.status}: ${alphaRes.statusText}`,
        latencyMs: alphaLatency,
        isLive: false,
      };
    } else {
      const data = await alphaRes.json();
      if (data['Realtime Currency Exchange Rate']) {
        const rateInfo = data['Realtime Currency Exchange Rate'];
        externalChecks['AlphaVantage_Gateway'] = {
          status: 'HEALTHY',
          httpStatus: 200,
          message: 'Direct connection to Alpha Vantage live FX stream active.',
          latencyMs: alphaLatency,
          isLive: true,
          lastRefreshed: rateInfo['6. Last Refreshed'],
          samplePair: 'USD/SGD',
          sampleRate: parseFloat(rateInfo['5. Exchange Rate']),
        };
      } else if (data['Note']) {
        externalChecks['AlphaVantage_Gateway'] = {
          status: 'RATE_LIMITED',
          httpStatus: 200,
          message: data['Note'],
          latencyMs: alphaLatency,
          isLive: false,
          fallbackActive: true,
        };
      } else if (data['Information']) {
        externalChecks['AlphaVantage_Gateway'] = {
          status: 'NOTICE',
          httpStatus: 200,
          message: data['Information'],
          latencyMs: alphaLatency,
          isLive: false,
          fallbackActive: true,
        };
      } else if (data['Error Message']) {
        externalChecks['AlphaVantage_Gateway'] = {
          status: 'ERROR',
          httpStatus: 200,
          message: data['Error Message'],
          latencyMs: alphaLatency,
          isLive: false,
          fallbackActive: true,
        };
      } else {
        externalChecks['AlphaVantage_Gateway'] = {
          status: 'DEGRADED',
          httpStatus: 200,
          message: 'Unexpected payload structure received from gateway.',
          latencyMs: alphaLatency,
          isLive: false,
        };
      }
    }
  } catch (err) {
    externalChecks['AlphaVantage_Gateway'] = {
      status: 'UNREACHABLE',
      httpStatus: null,
      message: err.message || 'Connection timeout or network failure reaching Alpha Vantage.',
      latencyMs: Date.now() - externalStart,
      isLive: false,
      fallbackActive: true,
    };
  }

  // 2. Check Internal APIs
  const endpointChecks = [
    {
      name: 'Single Currency Exchange Rate',
      path: '/api/rates/exchange-rate?from=USD&to=EUR&nocache=true',
      expectedStatus: 200,
    },
    {
      name: 'All Market Rates Overview',
      path: '/api/rates/all',
      expectedStatus: 200,
    },
    {
      name: 'Historical Time Series FX',
      path: '/api/rates/time-series?from=USD&to=JPY',
      expectedStatus: 200,
    },
  ];

  const endpointsResult = {};

  for (const ep of endpointChecks) {
    const epStart = Date.now();
    try {
      const epRes = await fetch(`${baseUrl}${ep.path}`, { signal: AbortSignal.timeout(5000) });
      const epLatency = Date.now() - epStart;
      const contentType = epRes.headers.get('content-type') || '';
      let payloadSummary = null;

      if (contentType.includes('application/json')) {
        const json = await epRes.json();
        if (json.rates && Array.isArray(json.rates)) {
          payloadSummary = { totalRatesAvailable: json.rates.length, source: json.source };
        } else if (json.exchangeRate !== undefined) {
          payloadSummary = {
            from: json.from,
            to: json.to,
            rate: json.exchangeRate,
            isLive: json.isLive,
            source: json.source,
          };
        } else if (json.points && Array.isArray(json.points)) {
          payloadSummary = {
            symbol: json.symbol,
            historyPointsCount: json.points.length,
            currentRate: json.rate,
          };
        }
      }

      endpointsResult[ep.path] = {
        name: ep.name,
        status: epRes.status === ep.expectedStatus ? 'HEALTHY' : 'DEGRADED',
        httpStatus: epRes.status,
        latencyMs: epLatency,
        data: payloadSummary,
      };
    } catch (err) {
      endpointsResult[ep.path] = {
        name: ep.name,
        status: 'UNHEALTHY',
        httpStatus: null,
        latencyMs: Date.now() - epStart,
        error: err.message,
      };
    }
  }

  // 3. Aggregate Health Score
  const allEndpoints = Object.values(endpointsResult);
  const healthyEndpoints = allEndpoints.filter((e) => e.status === 'HEALTHY').length;
  const degradedEndpoints = allEndpoints.filter((e) => e.status === 'DEGRADED').length;
  const unhealthyEndpoints = allEndpoints.filter((e) => e.status === 'UNHEALTHY').length;

  let overallStatus = 'healthy';
  if (unhealthyEndpoints > 0) {
    overallStatus = 'unhealthy';
  } else if (degradedEndpoints > 0 || externalChecks['AlphaVantage_Gateway']?.status !== 'HEALTHY') {
    overallStatus = 'degraded';
  }

  const memoryUsage = process.memoryUsage();
  const uptimeSeconds = Math.round(process.uptime());

  return {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    executionTimeMs: Date.now() - startTime,
    uptime: {
      seconds: uptimeSeconds,
      formatted: formatUptime(uptimeSeconds),
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
      },
      environment: process.env.NODE_ENV || 'development',
    },
    apiKeyStatus: {
      configured: hasApiKey,
      maskedKey,
      source: keySource,
    },
    summary: {
      totalEndpoints: allEndpoints.length,
      healthy: healthyEndpoints,
      degraded: degradedEndpoints,
      unhealthy: unhealthyEndpoints,
    },
    endpoints: endpointsResult,
    externalGateways: externalChecks,
  };
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

/**
 * Express Request Handler for /api/health
 */
export default async function healthHandler(req, res) {
  try {
    const host = req.get('host');
    const protocol = req.protocol || 'http';
    const baseUrl = `${protocol}://${host}`;

    const healthData = await checkApiHealth({ baseUrl });
    const statusCode = healthData.status === 'unhealthy' ? 503 : 200;

    res.status(statusCode).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message || 'Internal error while performing health checks',
      timestamp: new Date().toISOString(),
    });
  }
}
