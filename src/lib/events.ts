// Lightweight cross-component event helpers for invalidating data after
// mutations happen outside a page's own hooks (e.g. the global quick-add FAB).

export const TRANSACTIONS_CHANGED_EVENT = 'transactions:changed';
export const ASSETS_CHANGED_EVENT = 'assets:changed';

export function notifyTransactionsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(TRANSACTIONS_CHANGED_EVENT));
  }
}

export function notifyAssetsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(ASSETS_CHANGED_EVENT));
  }
}
