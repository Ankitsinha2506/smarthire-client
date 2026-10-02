import {useEffect, useSyncExternalStore} from 'react';

let snapshot = {revision: 0, refreshing: false};
let requests = 0;
let settleTimer;
const listeners = new Set();
const subscribe = listener => {listeners.add(listener); return () => listeners.delete(listener)};
const getSnapshot = () => snapshot;
function publish(next) {
  snapshot = next;
  listeners.forEach(listener => listener());
}
function settle() {
  clearTimeout(settleTimer);
  // Allow debounced page loaders to start before declaring refresh finished.
  if (snapshot.refreshing && requests === 0) {
    settleTimer = setTimeout(() => {
      if (requests === 0) publish({...snapshot, refreshing: false});
    }, 350);
  }
}
export function beginWorkspaceRequest() {
  requests += 1;
  clearTimeout(settleTimer);
  return () => {requests -= 1; settle()};
}
export function refreshWorkspace() {
  if (snapshot.refreshing) return;
  publish({revision: snapshot.revision + 1, refreshing: true});
  settle();
}
export function useWorkspaceRefresh() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
// Rerun only data effects; component state and unsaved forms stay mounted.
export function useRefreshEffect(effect, dependencies) {
  const {revision} = useWorkspaceRefresh();
  useEffect(effect, [...dependencies, revision]);
}
