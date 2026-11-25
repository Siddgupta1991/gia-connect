import type { CategoryId } from './types';

/** Feather icon names used by categories. Kept as plain strings so domain code has no UI imports. */
export type CategoryIcon = 'map' | 'droplet' | 'alert-triangle' | 'truck' | 'more-horizontal';

export interface CategoryDef {
  id: CategoryId;
  name: string;
  icon: CategoryIcon;
  subCategories: string[];
}

/** Edit this list to change the categories shown in the app. */
export const CATEGORIES: CategoryDef[] = [
  {
    id: 'road',
    name: 'Road',
    icon: 'map',
    subCategories: ['Pothole', 'Broken road edge', 'Waterlogging', 'Broken drain cover', 'Street light not working'],
  },
  {
    id: 'water',
    name: 'Water',
    icon: 'droplet',
    subCategories: ['No supply', 'Low pressure', 'Pipe leakage', 'Dirty water'],
  },
  {
    id: 'dead_animal',
    name: 'Dead animal',
    icon: 'alert-triangle',
    subCategories: ['On the road', 'In a drain', 'Near a gate'],
  },
  {
    id: 'parking',
    name: 'Parking',
    icon: 'truck',
    subCategories: ['Wrong parking', 'Blocking a gate', 'Heavy vehicle on road'],
  },
  {
    id: 'other',
    name: 'Other',
    icon: 'more-horizontal',
    subCategories: ['General issue'],
  },
];

export function getCategory(id: CategoryId): CategoryDef {
  const found = CATEGORIES.find((c) => c.id === id);
  if (!found) throw new Error(`Unknown category ${id}`);
  return found;
}
