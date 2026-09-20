export type Rarity = 'glow' | 'rare' | 'hot' | 'live';

export interface CaseItem {
  id: string;
  name: string;
  rarity: Rarity;
  rarityLabel: string;
  odds: string;
  price: number;
  category: CategoryId;
  lead?: boolean;
  drops: string[];
}

export type CategoryId =
  | 'all'
  | 'cheap'
  | 'knives'
  | 'snipers'
  | 'pistols'
  | 'premium';

export const categories: { id: CategoryId; label: string; icon: string; count?: string }[] = [
  { id: 'all', label: 'Все кейсы', icon: 'Package', count: '48' },
  { id: 'cheap', label: 'До 200 ₽', icon: 'PiggyBank', count: '14' },
  { id: 'knives', label: 'Ножи', icon: 'Swords', count: '9' },
  { id: 'snipers', label: 'Снайперские', icon: 'Crosshair', count: '7' },
  { id: 'pistols', label: 'Пистолеты', icon: 'Target', count: '11' },
  { id: 'premium', label: 'Премиум', icon: 'Crown', count: '7' },
];

export const rarityArt: Record<Rarity, string> = {
  glow: 'https://cdn.poehali.dev/projects/0b443350-d3d4-41fe-b9ec-80fe1148da82/files/2bea2714-843e-4fd5-aba1-6027ecd932f2.jpg',
  rare: 'https://cdn.poehali.dev/projects/0b443350-d3d4-41fe-b9ec-80fe1148da82/files/09c2b241-fb01-4ad2-8a9f-84118142e3ae.jpg',
  hot: 'https://cdn.poehali.dev/projects/0b443350-d3d4-41fe-b9ec-80fe1148da82/files/924b1338-c774-417c-bdd9-e9dff7c34378.jpg',
  live: 'https://cdn.poehali.dev/projects/0b443350-d3d4-41fe-b9ec-80fe1148da82/files/44a8b1ca-2337-4c58-9c60-dd5c26619526.jpg',
};

/** Цвет рамки предмета по редкости Steam. */
export const rarityColor = (steamRarity?: string): string => {
  const r = (steamRarity || '').toLowerCase();
  if (r.includes('contraband')) return '44 92% 50%';
  if (r.includes('covert') || r.includes('extraordinary')) return '0 72% 55%';
  if (r.includes('classified') || r.includes('remarkable')) return '295 60% 58%';
  if (r.includes('restricted') || r.includes('exotic')) return '260 60% 62%';
  if (r.includes('mil-spec') || r.includes('high grade')) return '220 72% 58%';
  if (r.includes('industrial')) return '200 55% 62%';
  return '0 0% 62%';
};

export const rarityVar: Record<Rarity, string> = {
  glow: 'var(--glow)',
  rare: 'var(--rare)',
  hot: 'var(--hot)',
  live: 'var(--live)',
};

export const cases: CaseItem[] = [
  {
    id: 'gold-vault',
    name: 'Gold Vault',
    rarity: 'glow',
    rarityLabel: 'Золото',
    odds: 'шанс ножа 4.2%',
    price: 349,
    category: 'premium',
    lead: true,
    drops: ['Karambit · Fade', 'AK-47 · Fire Serpent', 'Desert Eagle · Blaze', 'USP-S · Kill Confirmed'],
  },
  {
    id: 'night-ops',
    name: 'Night Ops',
    rarity: 'rare',
    rarityLabel: 'Ковенант',
    odds: 'шанс ножа 2.1%',
    price: 199,
    category: 'cheap',
    drops: ['M4A1-S · Printstream', 'Glock · Fade', 'MP9 · Starlight', 'P250 · Asiimov'],
  },
  {
    id: 'blaze-drop',
    name: 'Blaze Drop',
    rarity: 'hot',
    rarityLabel: 'Огонь',
    odds: 'шанс ножа 3.4%',
    price: 129,
    category: 'cheap',
    drops: ['Desert Eagle · Blaze', 'AK-47 · Redline', 'Nova · Hyper Beast', 'Five-SeveN · Monkey Business'],
  },
  {
    id: 'rookie',
    name: 'Rookie',
    rarity: 'live',
    rarityLabel: 'Старт',
    odds: 'шанс ножа 0.8%',
    price: 49,
    category: 'cheap',
    drops: ['P90 · Asiimov', 'MP7 · Bloodsport', 'Tec-9 · Fuel Injector', 'UMP-45 · Primal Saber'],
  },
  {
    id: 'knife-only',
    name: 'Knife Only',
    rarity: 'glow',
    rarityLabel: 'Ножевой',
    odds: 'шанс ножа 9.5%',
    price: 899,
    category: 'knives',
    drops: ['Butterfly · Doppler', 'Karambit · Fade', 'Bayonet · Tiger Tooth', 'Talon · Marble Fade'],
  },
  {
    id: 'dragon-case',
    name: 'Dragon Case',
    rarity: 'rare',
    rarityLabel: 'Снайпер',
    odds: 'шанс AWP 12%',
    price: 459,
    category: 'snipers',
    drops: ['AWP · Dragon Lore', 'AWP · Asiimov', 'SSG 08 · Blood in the Water', 'SCAR-20 · Emerald'],
  },
  {
    id: 'pistol-run',
    name: 'Pistol Run',
    rarity: 'live',
    rarityLabel: 'Пистолеты',
    odds: 'шанс Deagle 18%',
    price: 89,
    category: 'pistols',
    drops: ['Glock · Fade', 'USP-S · Neo-Noir', 'P250 · See Ya Later', 'CZ75-Auto · Yellow Jacket'],
  },
  {
    id: 'vertigo',
    name: 'Vertigo',
    rarity: 'hot',
    rarityLabel: 'Редкий',
    odds: 'шанс ножа 5.6%',
    price: 279,
    category: 'knives',
    drops: ['Falchion · Doppler', 'Shadow Daggers · Fade', 'AK-47 · Vulcan', 'M4A4 · Neo-Noir'],
  },
  {
    id: 'sniper-elite',
    name: 'Sniper Elite',
    rarity: 'glow',
    rarityLabel: 'Снайпер',
    odds: 'шанс AWP 21%',
    price: 649,
    category: 'snipers',
    drops: ['AWP · Gungnir', 'AWP · Medusa', 'AWP · Wildfire', 'G3SG1 · Chronos'],
  },
  {
    id: 'street-money',
    name: 'Street Money',
    rarity: 'rare',
    rarityLabel: 'Пистолеты',
    odds: 'шанс Deagle 9%',
    price: 159,
    category: 'pistols',
    drops: ['Deagle · Code Red', 'R8 · Fade', 'Dual Berettas · Cobra', 'P2000 · Fire Elemental'],
  },
  {
    id: 'royal',
    name: 'Royal Drop',
    rarity: 'glow',
    rarityLabel: 'Премиум',
    odds: 'шанс ножа 14%',
    price: 1290,
    category: 'premium',
    drops: ['Karambit · Doppler Sapphire', 'AWP · Dragon Lore', 'M9 Bayonet · Crimson Web', 'AK-47 · Wild Lotus'],
  },
  {
    id: 'clutch',
    name: 'Clutch',
    rarity: 'hot',
    rarityLabel: 'Огонь',
    odds: 'шанс ножа 1.4%',
    price: 99,
    category: 'cheap',
    drops: ['M4A4 · Howl', 'AK-47 · Bloodsport', 'MAC-10 · Neon Rider', 'Galil · Chatterbox'],
  },
];

export const liveDrops = [
  { user: 'shrek_1337', item: 'Karambit · Fade', rarity: 'hot' as Rarity, price: 24900 },
  { user: 'nemo', item: 'AWP · Dragon Lore', rarity: 'glow' as Rarity, price: 41200 },
  { user: 'valk', item: 'M4A1-S · Printstream', rarity: 'rare' as Rarity, price: 5400 },
  { user: 'kotleta', item: 'Desert Eagle · Blaze', rarity: 'glow' as Rarity, price: 3100 },
  { user: 'zaza', item: 'Glock · Fade', rarity: 'live' as Rarity, price: 1780 },
  { user: 'mira', item: 'Butterfly · Doppler', rarity: 'hot' as Rarity, price: 33500 },
  { user: 'sanya_afk', item: 'AK-47 · Vulcan', rarity: 'rare' as Rarity, price: 2650 },
  { user: 'dodik', item: 'USP-S · Kill Confirmed', rarity: 'glow' as Rarity, price: 4120 },
];

export const topPlayers = [
  { place: 1, name: 'shrek_1337', cases: 1284, best: 'Karambit · Fade', total: 412900 },
  { place: 2, name: 'nemo', cases: 1109, best: 'AWP · Dragon Lore', total: 388400 },
  { place: 3, name: 'mira', cases: 964, best: 'Butterfly · Doppler', total: 341000 },
  { place: 4, name: 'valk', cases: 812, best: 'M9 Bayonet · Doppler', total: 276500 },
  { place: 5, name: 'kotleta', cases: 744, best: 'Talon · Marble Fade', total: 219800 },
  { place: 6, name: 'zaza', cases: 690, best: 'AK-47 · Wild Lotus', total: 188300 },
  { place: 7, name: 'dodik', cases: 611, best: 'AWP · Medusa', total: 164700 },
  { place: 8, name: 'sanya_afk', cases: 558, best: 'Glock · Fade', total: 132400 },
];

export const promos = [
  { code: 'NICE15', title: '+15% к пополнению', text: 'Первое пополнение от 300 ₽ — бонус падает на баланс сразу.', badge: 'Новичкам' },
  { code: 'DROP50', title: '50 ₽ бесплатно', text: 'Подпишись на наш Telegram и активируй код — кейс Rookie за наш счёт.', badge: 'Telegram' },
  { code: 'GOLD25', title: '+25% от 2 000 ₽', text: 'Крупное пополнение — крупный бонус. Действует до конца недели.', badge: 'VIP' },
];

export const topUpMethods = [
  { id: 'card', label: 'Банковская карта', icon: 'CreditCard', hint: 'Visa / MIR / MC' },
  { id: 'sbp', label: 'СБП', icon: 'Smartphone', hint: 'по номеру телефона' },
  { id: 'crypto', label: 'Криптовалюта', icon: 'Bitcoin', hint: 'BTC / USDT / TON' },
  { id: 'steam', label: 'Скины Steam', icon: 'Gamepad2', hint: 'обмен трейдом' },
];

export const faq = [
  {
    q: 'Как открыть кейс на Nicedrop?',
    a: 'Пополните баланс любым удобным способом, выберите кейс в каталоге и нажмите «Открыть». Предмет сразу попадёт в ваш инвентарь на сайте.',
  },
  {
    q: 'Как быстро приходит вывод в Steam?',
    a: 'В среднем 2 минуты. В часы пик очередь может занять до 15 минут — статус обмена виден в инвентаре.',
  },
  {
    q: 'Дроп честный?',
    a: 'Да. Мы используем provably fair: хеш раунда публикуется до открытия кейса, и после открытия вы можете проверить результат вручную.',
  },
  {
    q: 'Можно ли продать выпавший предмет обратно?',
    a: 'Да, любой предмет из инвентаря продаётся обратно в один клик — деньги моментально возвращаются на баланс сайта.',
  },
  {
    q: 'Где вводить промокод?',
    a: 'В разделе «Бонусы и промокоды» — введите код в поле активации. Бонус начислится на баланс сразу после подтверждения.',
  },
  {
    q: 'С какого возраста можно играть?',
    a: 'Открывать кейсы могут пользователи старше 18 лет, подтвердившие согласие с пользовательским соглашением.',
  },
];

export const navLinks = [
  { id: 'cases', label: 'Кейсы' },
  { id: 'top', label: 'Топ игроков' },
  { id: 'topup', label: 'Пополнение' },
  { id: 'bonuses', label: 'Бонусы' },
  { id: 'faq', label: 'Поддержка' },
];