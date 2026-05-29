// Vercel Serverless Function: jsonblob.com へのプロキシ
// ブラウザからの同一オリジンリクエストを受け、サーバー側でjsonblob.comを呼び出す
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;
  const url = id
    ? `https://jsonblob.com/api/jsonBlob/${id}`
    : 'https://jsonblob.com/api/jsonBlob';

  try {
    const opts = {
      method: req.method,
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    };
    if (req.method !== 'GET') {
      opts.body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    }

    const upstream = await fetch(url, opts);

    // POST (新規作成) → Location ヘッダーから UUID を返す
    if (req.method === 'POST' && upstream.status === 201) {
      const location = upstream.headers.get('Location') || '';
      const uuid = location.split('/').pop();
      res.status(200).json({ uuid });
      return;
    }

    // GET / PUT → レスポンスボディをそのまま返す
    const text = await upstream.text();
    res.status(upstream.ok ? 200 : upstream.status)
       .setHeader('Content-Type', 'application/json')
       .send(text);

  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
