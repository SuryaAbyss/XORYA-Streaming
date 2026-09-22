import crypto from 'crypto';
import { URL } from 'url';

// 30-byte secret key reverse-engineered from MovieBox APK
const DEFAULT_SECRET_BYTES = Buffer.from([
    0xef, 0xa8, 0x91, 0x97, 0x4e, 0xec, 0xd3, 0x14, 0x8d, 0xf6, 0x3a, 0xa6, 0x11, 0x60, 0x2d, 0xef,
    0xd1, 0x01, 0x25, 0x9b, 0xa5, 0x21, 0x02, 0x2c, 0x57, 0xae, 0x05, 0x66, 0xbd, 0x8e
]);

const SIGNATURE_BODY_MAX_BYTES = 102400;

function md5Hex(data) {
    return crypto.createHash('md5').update(data).digest('hex');
}

function b64Encode(buffer) {
    return buffer.toString('base64');
}

export function generateXClientToken(ts) {
    const tsStr = String(ts);
    const reversedTs = tsStr.split('').reverse().join('');
    const hashVal = md5Hex(Buffer.from(reversedTs, 'utf8'));
    return `${tsStr},${hashVal}`;
}

function sortedQueryString(urlString) {
    try {
        const parsed = new URL(urlString);
        const params = [];
        for (const [k, v] of parsed.searchParams.entries()) {
            params.push([k, v]);
        }
        params.sort((a, b) => a[0].localeCompare(b[0]));
        return params.map(([k, v]) => `${k}=${v}`).join('&');
    } catch {
        return '';
    }
}

function buildCanonicalString(method, accept, contentType, urlString, body, timestampMs) {
    let canonicalUrl;
    try {
        const parsed = new URL(urlString);
        const query = sortedQueryString(urlString);
        canonicalUrl = query ? `${parsed.pathname}?${query}` : parsed.pathname;
    } catch {
        canonicalUrl = urlString;
    }

    let bodyHash = '';
    let bodyLength = '';
    if (body) {
        const buf = Buffer.isBuffer(body) ? body : Buffer.from(typeof body === 'string' ? body : JSON.stringify(body), 'utf8');
        const truncated = buf.length > SIGNATURE_BODY_MAX_BYTES ? buf.subarray(0, SIGNATURE_BODY_MAX_BYTES) : buf;
        bodyHash = md5Hex(truncated);
        bodyLength = String(buf.length);
    }

    return [
        method.toUpperCase(),
        accept || '',
        contentType || '',
        bodyLength,
        String(timestampMs),
        bodyHash,
        canonicalUrl
    ].join('\n');
}

export function generateXTrSignature(method, accept, contentType, urlString, body, timestampMs) {
    const canonical = buildCanonicalString(method, accept, contentType, urlString, body, timestampMs);
    const hmac = crypto.createHmac('md5', DEFAULT_SECRET_BYTES);
    hmac.update(Buffer.from(canonical, 'utf8'));
    const sigB64 = b64Encode(hmac.digest());
    return `${timestampMs}|2|${sigB64}`;
}

export function generateClientInfoAndUa() {
    const androidVersions = [
        ["9", "PQ3A.190605.03081104"],
        ["10", "QP1A.191005.007.A3"],
        ["11", "RP1A.200720.011"],
        ["12", "S1B.220414.015"],
        ["13", "TQ2A.230405.003"],
    ];
    const redmiDevices = [
        ["23078RKD5C", "Redmi"],
        ["2201117TY", "Redmi"],
        ["2201117TG", "Redmi"],
        ["22101316G", "Redmi"],
        ["21121210G", "Redmi"],
        ["M2012K11AG", "Redmi"],
        ["M2007J20CG", "Redmi"],
    ];
    const versionCodes = [50020117, 50020118, 50020119, 50020120, 50020121];
    const networkTypes = ["NETWORK_WIFI", "NETWORK_MOBILE"];
    const timezones = [
        "Asia/Kolkata",
        "Asia/Shanghai",
        "Asia/Tokyo",
        "America/New_York",
        "Europe/London",
    ];

    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    const android = pick(androidVersions);
    const device = pick(redmiDevices);
    const versionCode = pick(versionCodes);
    const network = pick(networkTypes);
    const timezone = pick(timezones);

    const randomHex = (len) => crypto.randomBytes(Math.ceil(len / 2)).toString('hex').slice(0, len);
    const gaid = `${randomHex(8)}-${randomHex(4)}-${randomHex(4)}-${randomHex(4)}-${randomHex(12)}`;
    const deviceId = randomHex(32);

    const userAgent = `com.community.oneroom/${versionCode} (Linux; U; Android ${android[0]}; en_US; ${device[0]}; Build/${android[1]}; Cronet/135.0.7012.3)`;

    const clientInfo = JSON.stringify({
        package_name: "com.community.oneroom",
        version_name: "4.0.01.0813.03",
        version_code: versionCode,
        os: "android",
        os_version: android[0],
        install_ch: "ps",
        device_id: deviceId,
        install_store: "ps",
        gaid,
        brand: device[1],
        model: device[0],
        system_language: "en",
        net: network,
        region: "US",
        timezone,
        sp_code: "40401",
        "X-Play-Mode": "2"
    });

    return { userAgent, clientInfo };
}

export function randomSpoofedIp() {
    const prefixes = [
        "103.241", "49.36", "117.195", "106.198", "122.162", "157.32", "182.70", "103.58", "27.60", "59.90"
    ];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const c = Math.floor(Math.random() * 253) + 1;
    const d = Math.floor(Math.random() * 253) + 1;
    return `${prefix}.${c}.${d}`;
}

export function buildSignedHeaders(method, urlString, body, authToken, userAgent, clientInfo, spoofedIp) {
    const ts = Date.now();
    const accept = 'application/json';
    const contentType = 'application/json';

    const clientToken = generateXClientToken(ts);
    const signature = generateXTrSignature(method, accept, contentType, urlString, body, ts);

    const headers = {
        'User-Agent': userAgent,
        'Accept': accept,
        'Content-Type': contentType,
        'Connection': 'keep-alive',
        'x-client-token': clientToken,
        'x-tr-signature': signature,
        'x-client-info': clientInfo,
        'x-client-status': '0',
        'x-forwarded-for': spoofedIp,
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    return headers;
}
