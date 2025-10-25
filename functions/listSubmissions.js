import { getStore } from '@netlify/blobs';

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Only GET' });
  const store = getStore({ name: 'avd-submissions' });
  const items = (await store.get('submissions.json', { type: 'json' })) || [];
  return json(200, { ok: true, items });
};

const json = (status, body) => ({
  statusCode: status,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  body: JSON.stringify(body)
});
