import { useEffect, useState } from 'react';
import { subscribeTags } from '../lib/tags';
import type { Tag } from '../types/models';

export function useTags(): Tag[] {
  const [tags, setTags] = useState<Tag[]>([]);
  useEffect(() => subscribeTags(setTags), []);
  return tags;
}
