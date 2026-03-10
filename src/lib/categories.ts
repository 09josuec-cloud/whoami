export const CATEGORIES = [
  'Food & Dining',
  'Shopping',
  'Transportation',
  'Entertainment',
  'Subscriptions',
  'Bills & Utilities',
  'Healthcare',
  'Personal Care',
  'Travel',
  'Education',
  'Home & Garden',
  'Income',
  'Transfer',
  'Other',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Dining': '#f59e0b',
  Shopping: '#8b5cf6',
  Transportation: '#3b82f6',
  Entertainment: '#ec4899',
  Subscriptions: '#a855f7',
  'Bills & Utilities': '#10b981',
  Healthcare: '#06b6d4',
  'Personal Care': '#f97316',
  Travel: '#14b8a6',
  Education: '#6366f1',
  'Home & Garden': '#84cc16',
  Income: '#22c55e',
  Transfer: '#78716c',
  Other: '#6b7280',
};

export const CATEGORY_ICONS: Record<string, string> = {
  'Food & Dining': '🍔',
  Shopping: '🛍️',
  Transportation: '🚗',
  Entertainment: '🎬',
  Subscriptions: '🔄',
  'Bills & Utilities': '💡',
  Healthcare: '🏥',
  'Personal Care': '💆',
  Travel: '✈️',
  Education: '📚',
  'Home & Garden': '🏡',
  Income: '💰',
  Transfer: '↔️',
  Other: '📦',
};

/**
 * Map Plaid's category array (e.g. ["Food and Drink", "Restaurants"])
 * to our simplified category set.
 */
export function getCategoryFromPlaid(plaidCategory: string | null | undefined): string {
  if (!plaidCategory) return 'Other';

  const lower = plaidCategory.toLowerCase();

  // Transfers & income first (most specific)
  if (lower.includes('transfer_in') || lower === 'transfer_in') return 'Income';
  if (lower.includes('transfer_out') || lower === 'transfer_out') return 'Transfer';
  if (lower.includes('transfer')) return 'Transfer';

  if (
    lower.includes('payroll') ||
    lower.includes('wages') ||
    lower === 'income' ||
    lower.includes('income_dividends') ||
    lower.includes('income_interest') ||
    lower.includes('tax_refund') ||
    lower.includes('interest earned')
  ) {
    return 'Income';
  }

  if (
    lower.includes('food') ||
    lower.includes('restaurant') ||
    lower.includes('dining') ||
    lower.includes('coffee') ||
    lower.includes('bakery') ||
    lower.includes('groceries') ||
    lower.includes('fast_food') ||
    lower.includes('alcohol') ||
    lower.includes('vending')
  ) {
    return 'Food & Dining';
  }

  // Subscriptions before entertainment
  if (
    lower.includes('subscription') ||
    lower.includes('streaming') ||
    lower.includes('tv_and_movies') ||
    lower.includes('music_and_audio') ||
    lower.includes('video_games') ||
    lower.includes('software') ||
    lower.includes('saas') ||
    lower.includes('digital_purchase')
  ) {
    return 'Subscriptions';
  }

  if (
    lower.includes('entertainment') ||
    lower.includes('recreation') ||
    lower.includes('arts') ||
    lower.includes('music') ||
    lower.includes('movie') ||
    lower.includes('games') ||
    lower.includes('sports') ||
    lower.includes('nightlife') ||
    lower.includes('gambling') ||
    lower.includes('live_entertainment')
  ) {
    return 'Entertainment';
  }

  if (
    lower.includes('shop') ||
    lower.includes('retail') ||
    lower.includes('merchandise') ||
    lower.includes('clothing') ||
    lower.includes('sporting') ||
    lower.includes('hobby') ||
    lower.includes('electronics') ||
    lower.includes('department') ||
    lower.includes('pet_supplies')
  ) {
    return 'Shopping';
  }

  if (
    lower.includes('gas_stations') ||
    lower.includes('parking') ||
    lower.includes('taxi') ||
    lower.includes('rideshare') ||
    lower.includes('transit') ||
    lower.includes('auto') ||
    lower.includes('tolls') ||
    lower.includes('bike')
  ) {
    return 'Transportation';
  }

  if (
    lower.includes('airlines') ||
    lower.includes('hotel') ||
    lower.includes('lodging') ||
    lower.includes('rental_car') ||
    lower.includes('travel') ||
    lower.includes('airbnb') ||
    lower.includes('vacation')
  ) {
    return 'Travel';
  }

  if (
    lower.includes('utilities') ||
    lower.includes('electric') ||
    lower.includes('internet') ||
    lower.includes('cable') ||
    lower.includes('water') ||
    lower.includes('rent') ||
    lower.includes('mortgage') ||
    lower.includes('insurance') ||
    lower.includes('phone') ||
    lower.includes('telecom')
  ) {
    return 'Bills & Utilities';
  }

  if (
    lower.includes('health') ||
    lower.includes('medical') ||
    lower.includes('pharmacy') ||
    lower.includes('doctor') ||
    lower.includes('dental') ||
    lower.includes('hospital') ||
    lower.includes('vision') ||
    lower.includes('veterinary') ||
    lower.includes('mental_health')
  ) {
    return 'Healthcare';
  }

  if (
    lower.includes('personal_care') ||
    lower.includes('spa') ||
    lower.includes('haircut') ||
    lower.includes('gym') ||
    lower.includes('fitness') ||
    lower.includes('laundry')
  ) {
    return 'Personal Care';
  }

  if (
    lower.includes('education') ||
    lower.includes('tuition') ||
    lower.includes('school') ||
    lower.includes('university') ||
    lower.includes('college') ||
    lower.includes('books') ||
    lower.includes('course')
  ) {
    return 'Education';
  }

  if (
    lower.includes('home_improvement') ||
    lower.includes('furniture') ||
    lower.includes('hardware') ||
    lower.includes('garden') ||
    lower.includes('home_security') ||
    lower.includes('pool') ||
    lower.includes('pest')
  ) {
    return 'Home & Garden';
  }

  if (
    lower.includes('bill') ||
    lower.includes('bank_fee') ||
    lower.includes('atm') ||
    lower.includes('overdraft') ||
    lower.includes('loan_payment') ||
    lower.includes('service_charge')
  ) {
    return 'Bills & Utilities';
  }

  return 'Other';
}
