export async function processData(text) {
  const res = await fetch('/api/process', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ type:'text', content:text })
  });
  return await res.json();
}
