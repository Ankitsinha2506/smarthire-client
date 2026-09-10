import {useCallback, useEffect, useState} from 'react';
import {api} from '../api';
export default function usePagedData(path, search = '') {
  const [page, setPage] = useState(1), [limit, setLimit] = useState(25);
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState({items: [], rows: [], headers: [], total: 0, page: 1, pages: 1});
  const [loading, setLoading] = useState(true), [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    const timer = setTimeout(() => {
      api(`${path}${path.includes('?') ? '&' : '?'}${new URLSearchParams({page, limit, search})}`, {signal: controller.signal})
        .then(data => {if (!controller.signal.aborted) setResult(data)})
        .catch(error => {if (!controller.signal.aborted) setError(error.message)})
        .finally(() => {if (!controller.signal.aborted) setLoading(false)});
    }, search ? 250 : 0);
    return () => {clearTimeout(timer); controller.abort()};
  }, [path, search, page, limit, revision]);
  const load = useCallback(() => setRevision(n => n + 1), []);
  return {result, loading, error, page: result.page, pages: result.pages, limit, setPage,
    setLimit: value => {setLimit(value); setPage(1)}, load};
}
