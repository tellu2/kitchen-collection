import { useEffect } from 'react';
import { Check, Heart, House, List, UtensilsCrossed } from 'lucide-react';
import { AppProvider, useApp } from './data/store';
import { TimerProvider, TimerTray, ToastProvider } from './ui/feedback';
import { href, type Route, useRoute } from './ui/router';
import { Home } from './screens/Home';
import { CategoryScreen } from './screens/CategoryScreen';
import { RecipeScreen } from './screens/RecipeScreen';
import { CookingScreen } from './screens/CookingScreen';
import { HaveScreen } from './screens/HaveScreen';
import { ListScreen } from './screens/ListScreen';
import { IdeasScreen, MealScreen, SavedScreen, SettingsScreen } from './screens/OtherScreens';

const TABS = [
  { route: 'home', path: href(), label: 'Recipes', Icon: House },
  { route: 'have', path: href('have'), label: 'Have', Icon: Check },
  { route: 'saved', path: href('saved'), label: 'Saved', Icon: Heart },
  { route: 'meal', path: href('meal'), label: 'Meal', Icon: UtensilsCrossed },
  { route: 'list', path: href('list'), label: 'List', Icon: List }
] as const;

function activeTab(route: Route): string {
  if (['home', 'category', 'recipe', 'ideas', 'settings'].includes(route.name)) return 'home';
  return route.name;
}

function BottomNav({ route }: { route: Route }) {
  const { prefs } = useApp();
  const open = new Set(prefs.shop.filter(i => !i.done).map(i => i.key)).size;
  const active = activeTab(route);
  return (
    <nav className="bottom-nav" aria-label="Main">
      {TABS.map(({ route: r, path, label, Icon }) => (
        <a key={r} href={path} className={active === r ? 'on' : ''} aria-current={active === r ? 'page' : undefined}>
          <span className="nav-icon">
            <Icon size={24} strokeWidth={1.9} aria-hidden="true" />
            {r === 'list' && open > 0 && <span className="nav-badge">{open}</span>}
          </span>
          {label}
        </a>
      ))}
    </nav>
  );
}

function Screen({ route }: { route: Route }) {
  switch (route.name) {
    case 'category': return <CategoryScreen name={route.category} />;
    case 'recipe': return <RecipeScreen id={route.id} />;
    case 'cook': return <CookingScreen id={route.id} step={route.step} />;
    case 'have': return <HaveScreen />;
    case 'list': return <ListScreen />;
    case 'meal': return <MealScreen />;
    case 'saved': return <SavedScreen />;
    case 'ideas': return <IdeasScreen />;
    case 'settings': return <SettingsScreen />;
    default: return <Home />;
  }
}

function Shell() {
  const route = useRoute();
  const cooking = route.name === 'cook';
  const key = route.name === 'cook' ? 'cook' : JSON.stringify(route);
  useEffect(() => {
    if (route.name !== 'cook') window.scrollTo(0, 0);
  }, [key, route.name]);
  return (
    <div className={`app ${cooking ? 'is-cooking' : ''}`}>
      <Screen key={key} route={route} />
      <TimerTray />
      {!cooking && <BottomNav route={route} />}
    </div>
  );
}

export function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <TimerProvider>
          <Shell />
        </TimerProvider>
      </ToastProvider>
    </AppProvider>
  );
}
