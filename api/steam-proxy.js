// Vercel Serverless函数 - Steam API代理
// 免费额度：100GB带宽/月，100万次调用/月

export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { url, method = 'GET' } = req.query;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter is required' });
    }

    // 验证URL是否为Steam域名
    const steamDomains = [
      'store.steampowered.com',
      'api.steampowered.com',
      'steamcommunity.com'
    ];
    
    const targetUrl = new URL(decodeURIComponent(url));
    if (!steamDomains.some(domain => targetUrl.hostname.includes(domain))) {
      return res.status(403).json({ error: 'Only Steam API domains are allowed' });
    }

    // 添加请求限制
    const userAgent = 'Steam-Price-Monitor/1.0 (+https://your-domain.vercel.app)';
    
    const response = await fetch(targetUrl.toString(), {
      method: method.toUpperCase(),
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // 设置超时
      signal: AbortSignal.timeout(10000), // 10秒超时
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // 设置缓存头（减少重复请求）
    res.setHeader('Cache-Control', 'public, max-age=300'); // 5分钟缓存
    
    return res.status(200).json(data);
    
  } catch (error) {
    console.error('Proxy error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
} 