// Shapes mirror data/recipe.schema.json and the lookup files.

export type Unit = 'g' | 'kg' | 'ml' | 'L' | 'tsp' | 'tbsp' | 'cup' | 'pinch';
export type Appliance = 'thermomix' | 'air-fryer' | 'oven' | 'stovetop' | 'none';
export type ConfidenceLevel = 'tested' | 'sourced' | 'estimated' | 'gated' | 'guidance' | 'draft';

export const CATEGORIES = [
  'Asian',
  'Mexican',
  'Mediterranean & Middle Eastern',
  'Fish & Seafood',
  'Salads & Sides',
  'Light Meals',
  'Easy & Healthy',
  'Baking & Sweets',
  'Basics & Blends',
  'Drafts to finish'
] as const;
export type Category = (typeof CATEGORIES)[number];

export interface Ingredient {
  id: string;
  qty?: number | null;
  qtyMax?: number;
  unit?: Unit;
  item: string;
  prep?: string;
  note?: string;
  optional?: boolean;
  recipeRef?: string;
  aisle?: string;
}

export interface IngredientGroup {
  title?: string;
  items: Ingredient[];
}

export interface StepSettings {
  appliance: Appliance;
  time?: string;
  timerSeconds?: number;
  temp?: string;
  speed?: string;
  reverse?: boolean;
  accessory?: string;
}

export interface Step {
  title?: string;
  text: string;
  settings?: StepSettings;
}

export interface Credit {
  name: string;
  url?: string;
  source: string;
}

export interface Recipe {
  schemaVersion: 1;
  id: string;
  title: string;
  description?: string;
  category: Category;
  tags?: string[];
  yield: { qty: number; unit: string; note?: string };
  time: { label: string; totalMinutes?: number };
  appliances: Appliance[];
  source?: { name: string; url?: string; note?: string };
  confidence: { level: ConfidenceLevel; note: string };
  methodLabel?: string;
  image?: string;
  imageCredit?: Credit;
  ingredientGroups: IngredientGroup[];
  steps: Step[];
  notes?: { title: string; text?: string; items?: string[] }[];
  version: number;
  updated: string;
  added?: string;
  nutrition?: {
    basis: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    fibre?: number;
    note?: string;
  };
  pairings?: string[];
}

export interface IndexEntry {
  id: string;
  title: string;
  category: Category;
  version: number;
  updated: string;
  added?: string;
  image?: string;
}

export interface RecipeIndex {
  schemaVersion: 1;
  generated: string;
  recipes: IndexEntry[];
}

export interface Pattern {
  pattern: string;
  flags?: string;
}

export interface AislesFile {
  order: string[];
  fallback: string;
  rules: (Pattern & { aisle: string })[];
  notShoppable: (Pattern & { reason: string })[];
  notShoppableGroups: Pattern & { reason: string };
}

export interface HaveKeysFile {
  groups: string[];
  keys: (Pattern & { label: string; group: string })[];
}

export interface PantryBasicsFile {
  assumed: string[];
  assumedPattern: Pattern;
  optionalLinePattern: Pattern;
}

export interface CategoriesFile {
  covers: Record<string, { recipe?: string; image?: string; imageCredit?: Credit }>;
}

export interface IdeasFile {
  description?: string;
  ideas: { title: string; group?: string; note?: string }[];
}

export interface LookupFiles {
  aisles: AislesFile;
  haveKeys: HaveKeysFile;
  pantryBasics: PantryBasicsFile;
  categories: CategoriesFile;
}
