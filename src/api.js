const BASE=import.meta.env.VITE_API_URL||'http://localhost:5050/api';
export async function api(path,options={}){const token=localStorage.getItem('token');const isForm=options.body instanceof FormData;const res=await fetch(BASE+path,{...options,headers:{...(isForm?{}:{'Content-Type':'application/json'}),...(token?{Authorization:`Bearer ${token}`}:{ }),...options.headers}});if(!res.ok){const e=await res.json().catch(()=>({message:'Request failed'}));throw new Error(e.message)}if(res.status===204)return null;return res.json()}
export async function download(path,fallback='interviews.xlsx'){
  const res=await fetch(BASE+path,{headers:{Authorization:`Bearer ${localStorage.getItem('token')}`}});
  if(!res.ok){
    const error=await res.json().catch(()=>({message:`Download failed (${res.status})`}));
    throw new Error(error.message||'Download failed');
  }
  const blob=await res.blob();
  if(!blob.size)throw new Error('The server returned an empty file');
  const disposition=res.headers.get('content-disposition')||'';
  const match=disposition.match(/filename\*?=(?:UTF-8''|)["']?([^"';]+)["']?/i);
  const filename=match?.[1]?decodeURIComponent(match[1]):fallback;
  const url=URL.createObjectURL(blob),a=document.createElement('a');
  a.href=url;a.download=filename;a.style.display='none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoking immediately can cancel the download in Safari and Firefox.
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
