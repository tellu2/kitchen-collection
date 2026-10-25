// The data/ folder as it was when the app was built: the first-launch
// fallback, and the baseline that synced data is merged over.
import type { IdeasFile, LookupFiles, Recipe } from '../types';
import aisles from '../../data/lookups/aisles.json';
import haveKeys from '../../data/lookups/have-keys.json';
import pantryBasics from '../../data/lookups/pantry-basics.json';
import categories from '../../data/lookups/categories.json';
import ideas from '../../data/ideas.json';

const recipeModules = import.meta.glob<Recipe>('../../data/recipes/*.json', { eager: true, import: 'default' });
const imageModules = import.meta.glob<string>('../../data/images/*.jpg', { eager: true, query: '?url', import: 'default' });

export const bundledRecipes: Recipe[] = Object.values(recipeModules);

export const bundledLookups: LookupFiles = {
  aisles: aisles as LookupFiles['aisles'],
  haveKeys: haveKeys as LookupFiles['haveKeys'],
  pantryBasics: pantryBasics as LookupFiles['pantryBasics'],
  categories: categories as LookupFiles['categories']
};

export const bundledIdeas = ideas as IdeasFile;

/** URL of a bundled image for a data-relative path such as "images/massaman.jpg". */
export function bundledImage(path: string): string | undefined {
  return imageModules[`../../data/${path}`];
}

export const BUILD_TIME: string = __BUILD_TIME__;
export const APP_VERSION: string = __APP_VERSION__;
