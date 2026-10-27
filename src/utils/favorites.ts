import { useState, useEffect, useCallback } from 'react';

const FAVORITES_KEY = 'highlanderstay_favorite_properties';
const FAVORITES_EVENT = 'hs-favorites-changed';

export function getFavoriteIds(): number[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(Number).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function isPropertyFavorited(propertyId: number): boolean {
  if (!propertyId) return false;
  return getFavoriteIds().includes(Number(propertyId));
}

export function toggleFavoriteProperty(propertyId: number): boolean {
  if (!propertyId) return false;
  const numId = Number(propertyId);
  const current = getFavoriteIds();
  const exists = current.includes(numId);
  const updated = exists ? current.filter((id) => id !== numId) : [...current, numId];

  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save favorites to localStorage:', e);
  }

  // Dispatch custom event for real-time reactivity across components
  window.dispatchEvent(
    new CustomEvent(FAVORITES_EVENT, {
      detail: { favoriteIds: updated, toggledId: numId, isFavorited: !exists },
    })
  );

  return !exists;
}

export function useFavorites() {
  const [favoriteIds, setFavoriteIds] = useState<number[]>(() => getFavoriteIds());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      if (e?.detail?.favoriteIds) {
        setFavoriteIds(e.detail.favoriteIds);
      } else {
        setFavoriteIds(getFavoriteIds());
      }
    };

    window.addEventListener(FAVORITES_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener(FAVORITES_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const toggle = useCallback((id: number) => {
    return toggleFavoriteProperty(id);
  }, []);

  const isFavorited = useCallback(
    (id: number) => {
      return favoriteIds.includes(Number(id));
    },
    [favoriteIds]
  );

  return {
    favoriteIds,
    favoritesCount: favoriteIds.length,
    toggle,
    isFavorited,
  };
}
