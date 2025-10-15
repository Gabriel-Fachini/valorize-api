/**
 * Prize (Reward) seed data
 * Sample prizes available in the reward catalog
 */

export const PRIZE_CATEGORIES = {
  ELECTRONICS: 'Electronics',
  GIFT_CARDS: 'Gift Cards',
  EXPERIENCES: 'Experiences',
  BOOKS: 'Books & Media',
  WELLNESS: 'Health & Wellness',
  FOOD: 'Food & Beverages',
  MERCHANDISE: 'Branded Merchandise',
  CHARITY: 'Charity Donations',
}

/**
 * Global prizes (available to all companies)
 */
export const GLOBAL_PRIZES = [
  {
    name: 'Amazon Gift Card $25',
    description: 'Redeem for anything on Amazon.com. Perfect for shopping, books, electronics, and more.',
    category: PRIZE_CATEGORIES.GIFT_CARDS,
    images: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500'],
    coinPrice: 250,
    brand: 'Amazon',
    stock: 100,
    specifications: {
      value: '$25 USD',
      format: 'Digital Code',
      expiration: 'No expiration',
      delivery: 'Instant email delivery',
    },
    variants: [
      { name: 'Value', value: '$25', stock: 100 },
    ],
  },
  {
    name: 'Amazon Gift Card $50',
    description: 'Double the value, double the possibilities. Shop for whatever you need on Amazon.',
    category: PRIZE_CATEGORIES.GIFT_CARDS,
    images: ['https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=500'],
    coinPrice: 500,
    brand: 'Amazon',
    stock: 50,
    specifications: {
      value: '$50 USD',
      format: 'Digital Code',
      expiration: 'No expiration',
      delivery: 'Instant email delivery',
    },
    variants: [
      { name: 'Value', value: '$50', stock: 50 },
    ],
  },
  {
    name: 'Spotify Premium - 3 Months',
    description: 'Enjoy ad-free music, offline listening, and unlimited skips with Spotify Premium.',
    category: PRIZE_CATEGORIES.GIFT_CARDS,
    images: ['https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=500'],
    coinPrice: 300,
    brand: 'Spotify',
    stock: 75,
    specifications: {
      duration: '3 months',
      format: 'Digital Code',
      features: 'Ad-free, offline listening, unlimited skips',
      delivery: 'Email within 24 hours',
    },
    variants: [
      { name: 'Duration', value: '3 months', stock: 75 },
    ],
  },
  {
    name: 'Wireless Bluetooth Headphones',
    description: 'High-quality wireless headphones with noise cancellation and 30-hour battery life.',
    category: PRIZE_CATEGORIES.ELECTRONICS,
    images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500'],
    coinPrice: 800,
    brand: 'SoundMax',
    stock: 20,
    specifications: {
      battery: '30 hours',
      connectivity: 'Bluetooth 5.0',
      features: 'Active Noise Cancellation, Foldable Design',
      warranty: '1 year',
    },
    variants: [
      { name: 'Color', value: 'Black', stock: 10 },
      { name: 'Color', value: 'Silver', stock: 10 },
    ],
  },
  {
    name: 'Starbucks Gift Card $25',
    description: 'Enjoy your favorite coffee, tea, or snacks at any Starbucks location.',
    category: PRIZE_CATEGORIES.FOOD,
    images: ['https://images.unsplash.com/photo-1559496417-e7f25c5fb10d?w=500'],
    coinPrice: 250,
    brand: 'Starbucks',
    stock: 150,
    specifications: {
      value: '$25 USD',
      format: 'Physical or Digital',
      locations: 'Valid at all Starbucks locations',
      expiration: 'No expiration',
    },
    variants: [
      { name: 'Format', value: 'Digital', stock: 100 },
      { name: 'Format', value: 'Physical Card', stock: 50 },
    ],
  },
  {
    name: 'Online Cooking Class',
    description: 'Learn to cook a new cuisine with professional chefs in this live online class.',
    category: PRIZE_CATEGORIES.EXPERIENCES,
    images: ['https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=500'],
    coinPrice: 400,
    brand: 'MasterClass',
    stock: 30,
    specifications: {
      duration: '2 hours',
      format: 'Live online session',
      includes: 'Recipe guide and ingredient list',
      scheduling: 'Multiple dates available',
    },
    variants: [
      { name: 'Cuisine', value: 'Italian', stock: 10 },
      { name: 'Cuisine', value: 'Japanese', stock: 10 },
      { name: 'Cuisine', value: 'French', stock: 10 },
    ],
  },
  {
    name: 'Kindle Paperwhite E-Reader',
    description: 'Waterproof e-reader with a glare-free display. Perfect for reading anywhere.',
    category: PRIZE_CATEGORIES.ELECTRONICS,
    images: ['https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=500'],
    coinPrice: 1200,
    brand: 'Amazon',
    stock: 15,
    specifications: {
      display: '6.8" glare-free',
      storage: '8GB or 16GB',
      waterproof: 'IPX8 rating',
      battery: 'Up to 10 weeks',
    },
    variants: [
      { name: 'Storage', value: '8GB', stock: 10 },
      { name: 'Storage', value: '16GB', stock: 5 },
    ],
  },
  {
    name: 'Yoga Mat Premium',
    description: 'Eco-friendly yoga mat with superior grip and cushioning. Includes carrying strap.',
    category: PRIZE_CATEGORIES.WELLNESS,
    images: ['https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=500'],
    coinPrice: 350,
    brand: 'ZenFit',
    stock: 40,
    specifications: {
      material: 'TPE eco-friendly',
      thickness: '6mm',
      size: '72" x 24"',
      includes: 'Carrying strap',
    },
    variants: [
      { name: 'Color', value: 'Purple', stock: 15 },
      { name: 'Color', value: 'Blue', stock: 15 },
      { name: 'Color', value: 'Green', stock: 10 },
    ],
  },
  {
    name: 'Bestseller Book Bundle',
    description: 'Collection of 3 bestselling books from various genres. Perfect for book lovers.',
    category: PRIZE_CATEGORIES.BOOKS,
    images: ['https://images.unsplash.com/photo-1512820790803-83ca734da794?w=500'],
    coinPrice: 450,
    brand: null,
    stock: 25,
    specifications: {
      quantity: '3 books',
      format: 'Hardcover or Paperback',
      genres: 'Fiction, Non-fiction, Biography',
      shipping: 'Free shipping',
    },
    variants: [
      { name: 'Genre Pack', value: 'Fiction Mix', stock: 10 },
      { name: 'Genre Pack', value: 'Business & Self-Help', stock: 10 },
      { name: 'Genre Pack', value: 'Mystery & Thriller', stock: 5 },
    ],
  },
  {
    name: 'Charity Donation - Education',
    description: 'Make a difference! Donate to educational programs for underprivileged children.',
    category: PRIZE_CATEGORIES.CHARITY,
    images: ['https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=500'],
    coinPrice: 200,
    brand: null,
    stock: 999,
    specifications: {
      amount: '$20 USD',
      organization: 'Global Education Fund',
      impact: 'Provides school supplies for 2 children',
      receipt: 'Tax-deductible receipt provided',
    },
    variants: [
      { name: 'Amount', value: '$20', stock: 999 },
    ],
  },
]

/**
 * Company-specific prizes (only for Valorize Corp)
 */
export const VALORIZE_COMPANY_PRIZES = [
  {
    name: 'Valorize Branded Hoodie',
    description: 'Premium quality hoodie with the Valorize logo. Comfortable and stylish.',
    category: PRIZE_CATEGORIES.MERCHANDISE,
    images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500'],
    coinPrice: 600,
    brand: 'Valorize',
    stock: 50,
    specifications: {
      material: '80% cotton, 20% polyester',
      fit: 'Unisex',
      care: 'Machine washable',
      logo: 'Embroidered Valorize logo',
    },
    variants: [
      { name: 'Size', value: 'S', stock: 5 },
      { name: 'Size', value: 'M', stock: 15 },
      { name: 'Size', value: 'L', stock: 20 },
      { name: 'Size', value: 'XL', stock: 10 },
    ],
  },
  {
    name: 'Team Lunch Voucher',
    description: 'Treat your team to lunch! Voucher for local restaurants (up to 5 people).',
    category: PRIZE_CATEGORIES.EXPERIENCES,
    images: ['https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=500'],
    coinPrice: 1000,
    brand: 'Valorize',
    stock: 10,
    specifications: {
      value: '$100 USD',
      capacity: 'Up to 5 people',
      restaurants: 'Partner restaurants list provided',
      validity: '3 months',
    },
    variants: [
      { name: 'Type', value: 'Standard', stock: 10 },
    ],
  },
  {
    name: 'Extra Day Off',
    description: 'Enjoy an extra paid day off! Perfect for a long weekend or personal time.',
    category: PRIZE_CATEGORIES.EXPERIENCES,
    images: ['https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=500'],
    coinPrice: 1500,
    brand: 'Valorize',
    stock: 20,
    specifications: {
      type: 'Paid time off',
      validity: '6 months from redemption',
      requirements: 'Manager approval required',
      restrictions: 'Cannot be used during blackout periods',
    },
    variants: [
      { name: 'Type', value: 'Single Day', stock: 20 },
    ],
  },
  {
    name: 'Valorize Water Bottle - Insulated',
    description: 'Keep your drinks hot or cold all day. Premium insulated water bottle.',
    category: PRIZE_CATEGORIES.MERCHANDISE,
    images: ['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500'],
    coinPrice: 200,
    brand: 'Valorize',
    stock: 100,
    specifications: {
      capacity: '32 oz (1L)',
      material: 'Stainless steel',
      insulation: 'Double-wall vacuum',
      temperature: 'Hot 12hrs, Cold 24hrs',
    },
    variants: [
      { name: 'Color', value: 'Black', stock: 40 },
      { name: 'Color', value: 'Blue', stock: 30 },
      { name: 'Color', value: 'Silver', stock: 30 },
    ],
  },
]

/**
 * Helper to identify which company a prize belongs to
 */
export const VALORIZE_COMPANY_ID = 'valorize-corp-id' // This will be replaced with actual ID during seeding
