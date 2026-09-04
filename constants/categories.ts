/**
 * Food Categories for "What's on your mind?"
 * Features high-resolution culinary photography and curated descriptors.
 */

export interface FoodCategory {
  id: string;
  name: string;
  subtitle: string;
  imageUrl: string;
  query: string;
}

export const WHAT_ON_YOUR_MIND: FoodCategory[] = [
  {
    id: 'biryani',
    name: 'Biryani',
    subtitle: 'Fragrant Dum',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=400&q=80',
    query: 'authentic fragrant dum biryani recipes',
  },
  {
    id: 'paneer',
    name: 'Paneer',
    subtitle: 'Rich & Velvety',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=400&q=80',
    query: 'paneer butter masala tikka recipes',
  },
  {
    id: 'chicken',
    name: 'Chicken',
    subtitle: 'Tender & Spiced',
    imageUrl: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?auto=format&fit=crop&w=400&q=80',
    query: 'tender spiced chicken curry dishes',
  },
  {
    id: 'dosa',
    name: 'Dosa',
    subtitle: 'Crispy & Golden',
    imageUrl: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=400&q=80',
    query: 'crispy fermented masala dosa idli sambar',
  },
  {
    id: 'pasta',
    name: 'Pasta',
    subtitle: 'Artisanal Italian',
    imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3d5d6281292?auto=format&fit=crop&w=400&q=80',
    query: 'authentic italian pasta al dente sauces',
  },
  {
    id: 'breakfast',
    name: 'Breakfast',
    subtitle: 'Morning Fuel',
    imageUrl: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=400&q=80',
    query: 'healthy high protein morning breakfast',
  },
  {
    id: 'desserts',
    name: 'Desserts',
    subtitle: 'Decadent Treats',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=400&q=80',
    query: 'decadent artisanal desserts cakes pastries',
  },
  {
    id: 'healthy',
    name: 'Healthy',
    subtitle: 'Nourish & Glow',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=400&q=80',
    query: 'fresh balanced nutritious healthy bowls',
  },
  {
    id: 'goan',
    name: 'Goan',
    subtitle: 'Coastal Seafood',
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=400&q=80',
    query: 'authentic goan coastal fish curry balchao',
  },
  {
    id: 'quick-meals',
    name: 'Quick Meals',
    subtitle: 'Under 25 Mins',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80',
    query: 'quick delicious weeknight meals under 25 minutes',
  },
];

export const CUISINE_SECTIONS = [
  {
    id: 'indian',
    name: 'Indian Classics',
    subtitle: 'Royal thalis & spiced curries',
    query: 'Authentic Indian regional delicacies',
    imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'goan',
    name: 'Goan Coastal',
    subtitle: 'Coconut, kokum & fresh catch',
    query: 'Authentic Goan seafood curries and coastal delicacies',
    imageUrl: 'https://images.unsplash.com/photo-1559847844-5315695dadae?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'italian',
    name: 'Italian Trattoria',
    subtitle: 'Hand-crafted pasta & slow sauces',
    query: 'Artisanal regional Italian pasta and risotto',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'asian',
    name: 'Pan-Asian Flavors',
    subtitle: 'Wok stir-fries, ramen & dim sum',
    query: 'Pan Asian noodles ramen stir fries',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'mexican',
    name: 'Mexican Street',
    subtitle: 'Charred salsas, tacos & moles',
    query: 'Traditional Mexican tacos and moles',
    imageUrl: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=600&q=80',
  },
];

export const DISCOVERY_CHANNELS = [
  'Fresh picks for you',
  'Quick Meals',
  'Trending Dishes',
  'Indian Classics',
  'Goan Favourites',
  'High Protein',
  'Healthy & Clean',
  'Desserts & Bakes',
  'Weekend Cooking',
];

export const NATURAL_SEARCH_SUGGESTIONS = [
  'spicy chicken under 30 minutes',
  'easy paneer dinner',
  'high protein breakfast',
  'Goan seafood',
  'dinner using potato onion and eggs',
];
