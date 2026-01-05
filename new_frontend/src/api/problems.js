export async function fetchSheetProblems(sheetId, { difficulty, page = 1, limit = 10 } = {}) {
  const params = new URLSearchParams();
  if (difficulty) params.append('difficulty', difficulty);
  params.append('page', page);
  params.append('limit', limit);

  const base = process.env.REACT_APP_API_BASE || 'http://localhost:5000';
  const res = await fetch(`${base}/problems/sheet/${sheetId}?${params.toString()}`, {
    headers: { 'Accept': 'application/json' }
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => res.statusText);
    throw new Error(errText || 'Failed to fetch problems');
  }
  return res.json();
}