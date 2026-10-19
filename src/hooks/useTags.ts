import { useEffect, useMemo, useState } from 'react';
import { subscribeTags } from '../lib/tags';
import { comCoresResolvidas } from '../lib/cores';
import type { Tag } from '../types/models';

/** Tags ordenadas por nome, sempre com `cor` preenchida. */
export function useTags(): Tag[] {
  const [brutas, setBrutas] = useState<Tag[]>([]);
  useEffect(() => subscribeTags(setBrutas), []);
  return useMemo(() => comCoresResolvidas(brutas), [brutas]);
}
