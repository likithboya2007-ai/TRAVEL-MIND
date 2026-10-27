export interface Attraction {
  id: string;
  name: string;
  category: 'Adventure' | 'Culture' | 'Nature' | 'Food' | 'Relaxation' | 'Photography';
  durationHours: number;
  estimatedCostInr: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'sunset';
  lat: number;
  lng: number;
  description: string;
  highlight: string;
  bestFor: string[];
  isAIGenerated?: boolean; // Flag for AI-generated attractions
}

export interface Hotel {
  id: string;
  name: string;
  location: string;
  pricePerNightInr: number;
  rating: number;
  description: string;
  type: 'budget' | 'balanced' | 'comfortable';
  lat: number;
  lng: number;
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  cuisine: string;
  specialties: string[];
  averageCostInr: number;
  description: string;
  lat: number;
  lng: number;
}

export interface FamousDish {
  name: string;
  description: string;
  whereToTry: string;
  estimatedPrice: number;
  category: 'Main Course' | 'Dessert' | 'Snack' | 'Beverage' | 'Street Food';
  spiceLevel?: 'Mild' | 'Medium' | 'Spicy' | 'Very Spicy';
  vegetarian?: boolean;
  mustTry: boolean;
  image?: string;
}

export interface Destination {
  id: string;
  name: string;
  state: string;
  tagline: string;
  description: string;
  editorialQuote: string;
  image: string;
  lat: number;
  lng: number;
  defaultDays: number;
  suggestedBudgetInr: number;
  costTier: 'metro' | 'tier-2' | 'hill' | 'beach';
  costMultiplier: number;
  categories: Array<'Adventure' | 'Culture' | 'Nature' | 'Food' | 'Relaxation' | 'Photography'>;
  bestMonths: string;
  temperature: string;
  attractions: Attraction[];
  highlights: string[];
  localFood: string[];
  hotels?: Hotel[];
  restaurants?: Restaurant[];
  famousDishes?: FamousDish[];
}

export const DESTINATIONS: Destination[] = [
  {
    id: 'goa',
    name: 'Goa',
    state: 'Goa',
    tagline: 'Golden beaches, crimson sunsets, and coastal serenades.',
    description: 'Beyond its celebrated shores lies a tapestry of Portuguese baroque architecture, spice plantation aromas, and quiet estuaries where kingfishers dart across backwaters.',
    editorialQuote: 'Where time slows to the cadence of the Arabian Sea tide and sunset is an evening ritual.',
    image: '/src/assets/images/dest_goa_1792602056666.jpg',
    lat: 15.2993,
    lng: 74.124,
    defaultDays: 4,
    suggestedBudgetInr: 28000,
    costTier: 'beach',
    costMultiplier: 1.2,
    categories: ['Relaxation', 'Food', 'Adventure', 'Photography'],
    bestMonths: 'November – March',
    temperature: '24°C – 32°C',
    highlights: ['Palolem Crescent Beach', 'Fontainhas Latin Quarter', 'Aguada Coastal Fort', 'Divar Island Trails'],
    localFood: ['Goan Fish Curry', 'Poi Bread with Chorizo', 'Bebinca', 'Prawn Balchão'],
    hotels: [
      {
        id: 'goa-hotel-1',
        name: 'Casa Vagator',
        location: 'Vagator Beach, North Goa',
        pricePerNightInr: 2500,
        rating: 4.2,
        description: 'Cozy guesthouse with sea views, walking distance to beach',
        type: 'budget',
        lat: 15.5992,
        lng: 73.7346
      },
      {
        id: 'goa-hotel-2',
        name: 'The Fern Kadamba',
        location: 'Kadamba Plateau, Panjim',
        pricePerNightInr: 4500,
        rating: 4.5,
        description: 'Eco-friendly hotel with rooftop pool and city views',
        type: 'balanced',
        lat: 15.4909,
        lng: 73.8278
      },
      {
        id: 'goa-hotel-3',
        name: 'Palolem Beach Resort',
        location: 'Palolem Beach, South Goa',
        pricePerNightInr: 3200,
        rating: 4.3,
        description: 'Beach-side cottages with direct beach access',
        type: 'balanced',
        lat: 15.0104,
        lng: 74.0232
      },
      {
        id: 'goa-hotel-4',
        name: 'Taj Fort Aguada',
        location: 'Sinquerim Beach, Candolim',
        pricePerNightInr: 8500,
        rating: 4.7,
        description: 'Luxury resort with private beach, spa, and multiple dining options',
        type: 'comfortable',
        lat: 15.4926,
        lng: 73.7737
      }
    ],
    restaurants: [
      {
        id: 'goa-rest-1',
        name: 'Fisherman\'s Wharf',
        location: 'Panaji',
        cuisine: 'Goan, Seafood',
        specialties: ['Goan Fish Curry', 'Prawn Balchão', 'Bebinca'],
        averageCostInr: 800,
        description: 'Waterfront restaurant serving authentic Goan cuisine',
        lat: 15.4909,
        lng: 73.8278
      },
      {
        id: 'goa-rest-2',
        name: 'Viva Panjim',
        location: 'Fontainhas, Panaji',
        cuisine: 'Goan, Portuguese',
        specialties: ['Prawn Rissois', 'Chorizo Pao', 'Chicken Cafreal'],
        averageCostInr: 600,
        description: 'Heritage Portuguese-Goan home restaurant in Latin Quarter',
        lat: 15.4989,
        lng: 73.8278
      },
      {
        id: 'goa-rest-3',
        name: 'Pousada by the Beach',
        location: 'Calangute',
        cuisine: 'Continental, Goan',
        specialties: ['Goan Sausage Pulao', 'Fish Recheado', 'Bebinca'],
        averageCostInr: 900,
        description: 'Beachfront dining with live music and ocean views',
        lat: 15.5412,
        lng: 73.7550
      },
      {
        id: 'goa-rest-4',
        name: 'Martin\'s Corner',
        location: 'Betalbatim',
        cuisine: 'Goan, Seafood',
        specialties: ['Crab Xec Xec', 'Pomfret Fry', 'Sorpotel'],
        averageCostInr: 700,
        description: 'Famous family-run restaurant with traditional Goan dishes',
        lat: 15.2644,
        lng: 73.9281
      },
      {
        id: 'goa-rest-5',
        name: 'Cafe Tato',
        location: 'Panaji',
        cuisine: 'Goan, Snacks',
        specialties: ['Poi with Chorizo', 'Goan Vada', 'Bebinca'],
        averageCostInr: 300,
        description: 'Local favorite for breakfast and traditional Goan snacks',
        lat: 15.4835,
        lng: 73.8272
      }
    ],
    attractions: [
      {
        id: 'goa-1',
        name: 'Palolem Beach & Kayak Bay',
        category: 'Relaxation',
        durationHours: 3.5,
        estimatedCostInr: 600,
        timeOfDay: 'sunset',
        lat: 15.0104,
        lng: 74.0232,
        description: 'A serene crescent of golden sand flanked by coconut groves and gentle waters ideal for paddling.',
        highlight: 'Silhouetted palms and amber surf at dusk',
        bestFor: ['Romantic', 'Relaxed', 'Solo', 'Couple']
      },
      {
        id: 'goa-2',
        name: 'Fontainhas Latin Quarter Heritage Walk',
        category: 'Culture',
        durationHours: 2.5,
        estimatedCostInr: 400,
        timeOfDay: 'morning',
        lat: 15.4989,
        lng: 73.8278,
        description: 'Vibrant ochre, terracotta, and indigo Portuguese-era villas with ornate balconies and heritage bakeries.',
        highlight: 'Architectural photography and artisanal feni tastings',
        bestFor: ['Culture', 'Photography', 'Couple']
      },
      {
        id: 'goa-3',
        name: 'Fort Aguada & Lighthouse Promontory',
        category: 'Photography',
        durationHours: 2,
        estimatedCostInr: 300,
        timeOfDay: 'morning',
        lat: 15.4926,
        lng: 73.7737,
        description: '17th-century Portuguese fortress commanding panoramic views over the confluence of the Mandovi River and sea.',
        highlight: 'Vast ocean vistas and weathered red laterite ramparts',
        bestFor: ['Photography', 'Friends', 'Family']
      },
      {
        id: 'goa-4',
        name: 'Divar Island Bicycle & Estuary Trail',
        category: 'Adventure',
        durationHours: 4,
        estimatedCostInr: 850,
        timeOfDay: 'afternoon',
        lat: 15.5126,
        lng: 73.9056,
        description: 'Ferry ride across misty waters into sleepy villages, paddy fields, and riverside heritage churches.',
        highlight: 'Offbeat cycling through untouched coastal countryside',
        bestFor: ['Adventure', 'Active', 'Friends']
      },
      {
        id: 'goa-5',
        name: 'Assagao Garden Cafes & Culinary Trail',
        category: 'Food',
        durationHours: 2.5,
        estimatedCostInr: 1200,
        timeOfDay: 'evening',
        lat: 15.5894,
        lng: 73.7788,
        description: 'Charming restored Portuguese villas transformed into world-class farm-to-table eateries and listening bars.',
        highlight: 'Gourmet coastal fusion and artisan cocktails',
        bestFor: ['Food', 'Couple', 'Friends']
      }
    ],
    famousDishes: [
      {
        name: 'Goan Fish Curry',
        description: 'A tangy and spicy coconut-based curry made with fresh local fish, tamarind, and aromatic spices. The signature dish of Goan cuisine, best enjoyed with steamed rice.',
        whereToTry: 'Fisherman\'s Wharf (Panaji), Martin\'s Corner (Betalbatim)',
        estimatedPrice: 350,
        category: 'Main Course',
        spiceLevel: 'Medium',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Bebinca',
        description: 'A traditional Goan layered dessert made with coconut milk, eggs, sugar, and ghee. This multi-layered sweet pudding is a Portuguese-Goan specialty that melts in your mouth.',
        whereToTry: 'Cafe Tato (Panaji), Pousada by the Beach (Calangute)',
        estimatedPrice: 150,
        category: 'Dessert',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Prawn Balchão',
        description: 'Fiery pickled prawns cooked in a tangy tomato-based sauce with red chilies and vinegar. A Portuguese-influenced dish that\'s bold, spicy, and utterly addictive.',
        whereToTry: 'Viva Panjim (Fontainhas), Fisherman\'s Wharf',
        estimatedPrice: 450,
        category: 'Main Course',
        spiceLevel: 'Spicy',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Poi Bread with Chorizo',
        description: 'Soft, fluffy Goan bread served with spicy local chorizo sausage. A beloved breakfast staple that combines Portuguese baking with Indian spices.',
        whereToTry: 'Cafe Tato (Panaji), Local bakeries across Goa',
        estimatedPrice: 80,
        category: 'Street Food',
        spiceLevel: 'Medium',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Chicken Cafreal',
        description: 'Grilled chicken marinated in a vibrant green paste of coriander, mint, chilies, and spices. An African-Portuguese fusion that\'s become quintessentially Goan.',
        whereToTry: 'Viva Panjim (Fontainhas), Martin\'s Corner',
        estimatedPrice: 380,
        category: 'Main Course',
        spiceLevel: 'Spicy',
        vegetarian: false,
        mustTry: false
      },
      {
        name: 'Feni (Cashew or Coconut)',
        description: 'Goa\'s famous local spirit distilled from cashew apples or coconut sap. This potent drink is an integral part of Goan culture and celebrations.',
        whereToTry: 'Fontainhas heritage walks, Local taverns',
        estimatedPrice: 100,
        category: 'Beverage',
        vegetarian: true,
        mustTry: false
      }
    ]
  },
  {
    id: 'hampi',
    name: 'Hampi',
    state: 'Karnataka',
    tagline: 'Monumental stone ruins amidst timeless boulder-strewn hills.',
    description: 'The storied capital of the Vijayanagara Empire carved out of granite, standing proudly by the sacred Tungabhadra river under glowing dawn skies.',
    editorialQuote: 'A mythic landscape sculpted by demigods, where monolithic stone chariots whisper stories of vanished emperors.',
    image: '/src/assets/images/dest_hampi_1792602057382.jpg',
    lat: 15.335,
    lng: 76.46,
    defaultDays: 3,
    suggestedBudgetInr: 19500,
    costTier: 'tier-2',
    costMultiplier: 0.7,
    categories: ['Culture', 'Photography', 'Adventure'],
    bestMonths: 'October – February',
    temperature: '19°C – 30°C',
    highlights: ['Vittala Temple Stone Chariot', 'Virupaksha Riverside Sanctum', 'Matanga Hill Dawn Trek', 'Coracle Ride Tungabhadra'],
    localFood: ['South Indian Thali', 'Bisi Bele Bath', 'Fresh Sugarcane & Lime', 'Millet Dosas'],
    hotels: [
      {
        id: 'hampi-hotel-1',
        name: 'Gowri Resort',
        location: 'Hospet Road, Hampi',
        pricePerNightInr: 2200,
        rating: 4.1,
        description: 'Budget-friendly guesthouse with garden views near the ruins',
        type: 'budget',
        lat: 15.3350,
        lng: 76.4620
      },
      {
        id: 'hampi-hotel-2',
        name: 'Heritage Resort Hampi',
        location: 'Kamalapura, Hampi',
        pricePerNightInr: 4200,
        rating: 4.4,
        description: 'Mid-range resort with pool and traditional Karnataka architecture',
        type: 'balanced',
        lat: 15.3200,
        lng: 76.4700
      },
      {
        id: 'hampi-hotel-3',
        name: 'Evolve Back Kamalapura Palace',
        location: 'Kamalapura, Hampi',
        pricePerNightInr: 9500,
        rating: 4.8,
        description: 'Luxury heritage hotel with vintage décor and boulder landscape views',
        type: 'comfortable',
        lat: 15.3180,
        lng: 76.4720
      },
      {
        id: 'hampi-hotel-4',
        name: 'Clarks Inn Hampi',
        location: 'Near Vittala Temple, Hampi',
        pricePerNightInr: 3800,
        rating: 4.3,
        description: 'Comfortable hotel with modern amenities and temple views',
        type: 'balanced',
        lat: 15.3364,
        lng: 76.4750
      }
    ],
    restaurants: [
      {
        id: 'hampi-rest-1',
        name: 'Mango Tree Restaurant',
        location: 'Near Virupaksha Temple, Hampi',
        cuisine: 'South Indian, Continental',
        specialties: ['South Indian Thali', 'Bisi Bele Bath', 'Millet Dosas'],
        averageCostInr: 450,
        description: 'Riverside restaurant with traditional South Indian meals',
        lat: 15.3350,
        lng: 76.4610
      },
      {
        id: 'hampi-rest-2',
        name: 'Laughing Buddha',
        location: 'Hampi Bazaar',
        cuisine: 'Indian, Multi-cuisine',
        specialties: ['South Indian Thali', 'Fresh Sugarcane & Lime', 'Banana Leaf Meals'],
        averageCostInr: 400,
        description: 'Popular rooftop café with boulder views and relaxed vibe',
        lat: 15.3340,
        lng: 76.4600
      },
      {
        id: 'hampi-rest-3',
        name: 'Gopi Guesthouse Restaurant',
        location: 'Virupapur Gaddi, Hampi',
        cuisine: 'South Indian, Israeli',
        specialties: ['Millet Dosas', 'Ragi Mudde', 'Jolada Rotti'],
        averageCostInr: 350,
        description: 'Peaceful riverside eatery known for healthy millet-based dishes',
        lat: 15.3395,
        lng: 76.4625
      },
      {
        id: 'hampi-rest-4',
        name: 'Kamalapura Palace Restaurant',
        location: 'Evolve Back Resort, Hampi',
        cuisine: 'Karnataka, North Indian',
        specialties: ['Bisi Bele Bath', 'Kadubu', 'Obbattu'],
        averageCostInr: 1200,
        description: 'Fine dining with royal ambiance and traditional Karnataka cuisine',
        lat: 15.3180,
        lng: 76.4720
      },
      {
        id: 'hampi-rest-5',
        name: 'Ravi Rose Restaurant',
        location: 'Hospet Road, Hampi',
        cuisine: 'South Indian, North Indian',
        specialties: ['South Indian Thali', 'Bisi Bele Bath', 'Filter Coffee'],
        averageCostInr: 380,
        description: 'Family-run restaurant serving authentic local meals',
        lat: 15.3360,
        lng: 76.4640
      }
    ],
    famousDishes: [
      {
        name: 'South Indian Thali',
        description: 'A complete meal served on a banana leaf with sambar, rasam, multiple vegetable curries, rice, roti, papad, and payasam. A symphony of flavors showcasing Karnataka\'s culinary heritage.',
        whereToTry: 'Mango Tree Restaurant, Ravi Rose Restaurant',
        estimatedPrice: 200,
        category: 'Main Course',
        spiceLevel: 'Medium',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Bisi Bele Bath',
        description: 'A hearty one-pot meal of rice, lentils, vegetables, and aromatic spices. This comfort food is Karnataka\'s signature dish, served piping hot with ghee and boondi.',
        whereToTry: 'Kamalapura Palace Restaurant, Mango Tree',
        estimatedPrice: 120,
        category: 'Main Course',
        spiceLevel: 'Mild',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Millet Dosa',
        description: 'Crispy dosas made from nutritious ragi (finger millet) or jowar flour. A healthy alternative to regular dosas, popular in the Hampi region.',
        whereToTry: 'Gopi Guesthouse Restaurant, Laughing Buddha',
        estimatedPrice: 80,
        category: 'Street Food',
        spiceLevel: 'Mild',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Jolada Rotti with Ennegai',
        description: 'Thick flatbread made from jowar (sorghum) served with stuffed brinjal curry. A traditional rural Karnataka meal that\'s both filling and flavorful.',
        whereToTry: 'Local dhabas, Gopi Guesthouse Restaurant',
        estimatedPrice: 100,
        category: 'Main Course',
        spiceLevel: 'Medium',
        vegetarian: true,
        mustTry: false
      },
      {
        name: 'Fresh Sugarcane Juice',
        description: 'Freshly pressed sugarcane juice with a splash of lime and ginger. A refreshing drink perfect for Hampi\'s warm climate.',
        whereToTry: 'Street vendors across Hampi Bazaar',
        estimatedPrice: 30,
        category: 'Beverage',
        vegetarian: true,
        mustTry: false
      },
      {
        name: 'Obbattu (Holige)',
        description: 'Sweet flatbread stuffed with jaggery and lentils, flavored with cardamom. A Karnataka festival special that\'s irresistible.',
        whereToTry: 'Kamalapura Palace Restaurant, Local shops',
        estimatedPrice: 60,
        category: 'Dessert',
        vegetarian: true,
        mustTry: false
      }
    ],
    attractions: [
      {
        id: 'hampi-1',
        name: 'Vittala Temple Complex & Stone Chariot',
        category: 'Culture',
        durationHours: 3,
        estimatedCostInr: 500,
        timeOfDay: 'morning',
        lat: 15.3364,
        lng: 76.4789,
        description: 'Architectural masterpiece famous for its monolithic stone chariot, musical pillars, and intricate Dravidian carvings.',
        highlight: 'The iconic Stone Chariot in morning golden light',
        bestFor: ['Culture', 'Photography', 'Family', 'Solo']
      },
      {
        id: 'hampi-2',
        name: 'Matanga Hill Sunrise Ascent',
        category: 'Adventure',
        durationHours: 2.5,
        estimatedCostInr: 200,
        timeOfDay: 'morning',
        lat: 15.3312,
        lng: 76.4678,
        description: 'A moderate stair climb leading to the highest point in Hampi, offering 360-degree views across temple spires and boulder fields.',
        highlight: 'Panoramic sunrise over the Vijayanagara ruins',
        bestFor: ['Adventure', 'Photography', 'Active', 'Couple']
      },
      {
        id: 'hampi-3',
        name: 'Coracle Ride across Tungabhadra River',
        category: 'Adventure',
        durationHours: 1.5,
        estimatedCostInr: 450,
        timeOfDay: 'afternoon',
        lat: 15.3395,
        lng: 76.4625,
        description: 'Navigate ancient circular woven reed boats through dramatic river gorges and boulder formations.',
        highlight: 'Gliding past carved rock pillars along the sacred river',
        bestFor: ['Adventure', 'Friends', 'Couple']
      },
      {
        id: 'hampi-4',
        name: 'Lotus Mahal & Royal Enclosure',
        category: 'Culture',
        durationHours: 2.5,
        estimatedCostInr: 500,
        timeOfDay: 'afternoon',
        lat: 15.321,
        lng: 76.471,
        description: 'Indo-Islamic secular architecture with symmetrical arches, elephant stables, and stepwells.',
        highlight: 'The air-cooled arches of the Queen’s summer pavilion',
        bestFor: ['Culture', 'Family', 'Relaxed']
      },
      {
        id: 'hampi-5',
        name: 'Sanapur Lake Boulder Sunset Viewpoint',
        category: 'Relaxation',
        durationHours: 2,
        estimatedCostInr: 300,
        timeOfDay: 'sunset',
        lat: 15.3582,
        lng: 76.4475,
        description: 'Peaceful turquoise reservoir surrounded by colossal granite rock piles on the quieter Anegundi side.',
        highlight: 'Reflected twilight skies and cliffside meditation',
        bestFor: ['Romantic', 'Peaceful', 'Solo']
      }
    ]
  },
  {
    id: 'jaipur',
    name: 'Jaipur',
    state: 'Rajasthan',
    tagline: 'The Pink City of regal courtyards, hill forts, and royal splendor.',
    description: 'A planned medieval royal capital wrapped in terracotta walls, crowned by fortress ramparts and illuminated by gem-cutter bazaars.',
    editorialQuote: 'A kingdom carved in pink stone, where every courtyard was engineered for celebration, astrology, and royal defiance.',
    image: '/src/assets/images/dest_jaipur_1792602057548.jpg',
    lat: 26.9124,
    lng: 75.7873,
    defaultDays: 3,
    suggestedBudgetInr: 32000,
    costTier: 'metro',
    costMultiplier: 1.3,
    categories: ['Culture', 'Photography', 'Food'],
    bestMonths: 'October – March',
    temperature: '15°C – 28°C',
    highlights: ['Amber Fort Ramparts', 'Hawa Mahal Lattice Windows', 'City Palace Royal Quarters', 'Nahargarh Fort Dusk View'],
    localFood: ['Dal Baati Churma', 'Pyaaz Kachori', 'Laal Maas', 'Ghevar Sweet'],
    hotels: [
      {
        id: 'jaipur-hotel-1',
        name: 'Hotel Kalyan',
        location: 'MI Road, Jaipur',
        pricePerNightInr: 2800,
        rating: 4.0,
        description: 'Budget hotel near railway station with clean rooms and rooftop restaurant',
        type: 'budget',
        lat: 26.9124,
        lng: 75.7873
      },
      {
        id: 'jaipur-hotel-2',
        name: 'Alsisar Haveli',
        location: 'Sansar Chandra Road, Jaipur',
        pricePerNightInr: 5200,
        rating: 4.5,
        description: 'Heritage haveli hotel with traditional Rajasthani architecture and courtyard',
        type: 'balanced',
        lat: 26.9196,
        lng: 75.8243
      },
      {
        id: 'jaipur-hotel-3',
        name: 'The Raj Palace',
        location: 'Amer Road, Jaipur',
        pricePerNightInr: 10500,
        rating: 4.8,
        description: 'Luxury palace hotel with museum, spa, and royal Rajput décor',
        type: 'comfortable',
        lat: 26.9855,
        lng: 75.8513
      },
      {
        id: 'jaipur-hotel-4',
        name: 'Samode Haveli',
        location: 'Gangapole, Jaipur',
        pricePerNightInr: 6800,
        rating: 4.6,
        description: '475-year-old haveli with hand-painted frescoes and marble fountains',
        type: 'balanced',
        lat: 26.9300,
        lng: 75.8200
      }
    ],
    restaurants: [
      {
        id: 'jaipur-rest-1',
        name: 'Laxmi Misthan Bhandar (LMB)',
        location: 'Johari Bazaar, Jaipur',
        cuisine: 'Rajasthani, Vegetarian',
        specialties: ['Dal Baati Churma', 'Pyaaz Kachori', 'Ghevar', 'Mirchi Vada'],
        averageCostInr: 550,
        description: 'Iconic 1954 sweet shop and restaurant serving authentic Rajasthani thalis',
        lat: 26.9204,
        lng: 75.8236
      },
      {
        id: 'jaipur-rest-2',
        name: 'Chokhi Dhani Restaurant',
        location: 'Tonk Road, Jaipur',
        cuisine: 'Rajasthani, Traditional',
        specialties: ['Dal Baati Churma', 'Ker Sangri', 'Gatte ki Sabzi', 'Ghevar'],
        averageCostInr: 900,
        description: 'Ethnic village resort with cultural performances and unlimited thali',
        lat: 26.8054,
        lng: 75.8397
      },
      {
        id: 'jaipur-rest-3',
        name: 'Handi Restaurant',
        location: 'Maya Bazaar, MI Road, Jaipur',
        cuisine: 'Rajasthani, Mughlai',
        specialties: ['Laal Maas', 'Handi Mutton', 'Safed Maas'],
        averageCostInr: 800,
        description: 'Famous for clay pot cooking and authentic Laal Maas',
        lat: 26.9124,
        lng: 75.7900
      },
      {
        id: 'jaipur-rest-4',
        name: 'Rawat Mishtan Bhandar',
        location: 'Sindhi Camp, Jaipur',
        cuisine: 'Rajasthani, Snacks',
        specialties: ['Pyaaz Kachori', 'Mirchi Vada', 'Mawa Kachori'],
        averageCostInr: 300,
        description: 'Legendary breakfast spot famous for crispy kachoris since 1970',
        lat: 26.9100,
        lng: 75.7950
      },
      {
        id: 'jaipur-rest-5',
        name: 'Peacock Rooftop Restaurant',
        location: 'Hathroi Fort, Jaipur',
        cuisine: 'Rajasthani, Multi-cuisine',
        specialties: ['Dal Baati Churma', 'Gatte ki Sabzi', 'Ker Sangri'],
        averageCostInr: 700,
        description: 'Rooftop dining with panoramic city views and live folk music',
        lat: 26.9196,
        lng: 75.8200
      }
    ],
    famousDishes: [
      {
        name: 'Dal Baati Churma',
        description: 'Rajasthan\'s most iconic dish — baked wheat dough balls (baati) smothered in ghee, served with spiced lentil dal and sweet crumbled churma. A hearty, deeply satisfying meal that embodies royal Rajasthani cooking.',
        whereToTry: 'Chokhi Dhani Restaurant, Laxmi Misthan Bhandar (LMB)',
        estimatedPrice: 350,
        category: 'Main Course',
        spiceLevel: 'Medium',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Ghevar',
        description: 'A disc-shaped sweet made from flour, ghee, and sugar syrup, garnished with rabri and saffron. This quintessential Rajasthani festival dessert has a honeycomb texture that soaks up rich milk cream beautifully.',
        whereToTry: 'Laxmi Misthan Bhandar (LMB), Rawat Mishtan Bhandar',
        estimatedPrice: 120,
        category: 'Dessert',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Laal Maas',
        description: 'A fiery Rajasthani mutton curry made with mathē laal dried red chilies from Mathania and yogurt. Originally a royal hunting camp recipe, this deep red curry is intensely spiced and best eaten with missi roti.',
        whereToTry: 'Handi Restaurant, Peacock Rooftop Restaurant',
        estimatedPrice: 550,
        category: 'Main Course',
        spiceLevel: 'Very Spicy',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Pyaaz Kachori',
        description: 'Flaky deep-fried pastry stuffed with a spiced onion and lentil filling, served with tangy tamarind chutney. Jaipur\'s beloved breakfast snack that has been perfected over generations.',
        whereToTry: 'Rawat Mishtan Bhandar, Laxmi Misthan Bhandar (LMB)',
        estimatedPrice: 60,
        category: 'Street Food',
        spiceLevel: 'Spicy',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Ker Sangri',
        description: 'A traditional desert vegetable dish made from dried ker berries and sangri beans cooked with spices and dried red chilies. A uniquely Rajasthani preparation that showcases the ingenuity of desert cuisine.',
        whereToTry: 'Chokhi Dhani Restaurant, Peacock Rooftop Restaurant',
        estimatedPrice: 220,
        category: 'Main Course',
        spiceLevel: 'Medium',
        vegetarian: true,
        mustTry: false
      },
      {
        name: 'Rajasthani Lassi',
        description: 'Thick, creamy yogurt-based drink topped with a generous layer of malai (clotted cream) and sometimes flavored with rose water or cardamom. Jaipur lassi is famous for its richness and the generous malai crown.',
        whereToTry: 'Local shops in Johari Bazaar, Rawat Mishtan Bhandar',
        estimatedPrice: 80,
        category: 'Beverage',
        vegetarian: true,
        mustTry: false
      }
    ],
    attractions: [
      {
        id: 'jaipur-1',
        name: 'Amber Fort & Sheesh Mahal',
        category: 'Culture',
        durationHours: 3.5,
        estimatedCostInr: 750,
        timeOfDay: 'morning',
        lat: 26.9855,
        lng: 75.8513,
        description: 'Sprawling hilltop fortress with mirrored palaces, Mughal courtyards, and sweeping ramparts over Maota Lake.',
        highlight: 'Gleaming mirror mosaics in the Hall of Mirrors',
        bestFor: ['Culture', 'Photography', 'Family', 'Couple']
      },
      {
        id: 'jaipur-2',
        name: 'Hawa Mahal Palace of Winds',
        category: 'Photography',
        durationHours: 1.5,
        estimatedCostInr: 350,
        timeOfDay: 'morning',
        lat: 26.9239,
        lng: 75.8267,
        description: 'Iconic five-story honeycomb facade boasting 953 jharokhas designed for royal women to observe street processions.',
        highlight: 'Warm morning sun lighting the pink sandstone jharokhas',
        bestFor: ['Photography', 'Culture', 'Solo']
      },
      {
        id: 'jaipur-3',
        name: 'Nahargarh Fort Sunset Skyline',
        category: 'Photography',
        durationHours: 2.5,
        estimatedCostInr: 500,
        timeOfDay: 'sunset',
        lat: 26.9376,
        lng: 75.8155,
        description: 'Perched on the edge of the Aravalli hills overlooking the entirety of the glowing illuminated city below.',
        highlight: 'Sunset panoramic view across the Pink City expanse',
        bestFor: ['Romantic', 'Friends', 'Photography']
      },
      {
        id: 'jaipur-4',
        name: 'Old Bazaar Heritage Food Walk',
        category: 'Food',
        durationHours: 2.5,
        estimatedCostInr: 650,
        timeOfDay: 'evening',
        lat: 26.9204,
        lng: 75.8236,
        description: 'Sensory journey through Johari and Bapu Bazaars tasting piping-hot kachoris, lassi, and traditional sweets.',
        highlight: 'Authentic century-old recipe tastings in vibrant alleys',
        bestFor: ['Food', 'Friends', 'Culture']
      },
      {
        id: 'jaipur-5',
        name: 'Jantar Mantar Astronomical Observatory',
        category: 'Culture',
        durationHours: 2,
        estimatedCostInr: 300,
        timeOfDay: 'afternoon',
        lat: 26.9196,
        lng: 75.8243,
        description: 'UNESCO World Heritage collection of nineteen architectural astronomical instruments built by Sawai Jai Singh II.',
        highlight: 'The world’s largest stone sundial with 2-second accuracy',
        bestFor: ['Culture', 'Family', 'Solo']
      }
    ]
  },
  {
    id: 'kerala',
    name: 'Kerala',
    state: 'Kerala',
    tagline: 'Lush backwaters, emerald tea gardens, and spice-scented tranquility.',
    description: 'A serene coastal strip where serpentine canals flow through rice paddies and the misty Western Ghats harbor tea plantations and wildlife.',
    editorialQuote: 'A kingdom of water and foliage, where the day begins with mist over the lagoons and ends with the whisper of oars.',
    image: '/src/assets/images/dest_kerala_1792602058604.jpg',
    lat: 9.9312,
    lng: 76.2673,
    defaultDays: 4,
    suggestedBudgetInr: 34000,
    costTier: 'beach',
    costMultiplier: 1.1,
    categories: ['Relaxation', 'Nature', 'Food', 'Culture'],
    bestMonths: 'September – March',
    temperature: '22°C – 31°C',
    highlights: ['Alleppey Houseboat Cruise', 'Munnar High-Range Tea Estates', 'Fort Kochi Colonial Heritage', 'Periyar Spice Sanctuary'],
    localFood: ['Karimeen Pollichathu', 'Appam with Stew', 'Malabar Parotta', 'Banana Halwa'],
    hotels: [
      {
        id: 'kerala-hotel-1',
        name: 'Backwater Ripples',
        location: 'Alleppey Backwaters',
        pricePerNightInr: 3000,
        rating: 4.2,
        description: 'Budget homestay with traditional Kerala architecture and backwater views',
        type: 'budget',
        lat: 9.4981,
        lng: 76.3388
      },
      {
        id: 'kerala-hotel-2',
        name: 'Tea Valley Resort',
        location: 'Munnar Hills',
        pricePerNightInr: 4800,
        rating: 4.5,
        description: 'Hillside resort surrounded by tea plantations with valley views',
        type: 'balanced',
        lat: 10.0889,
        lng: 77.0595
      },
      {
        id: 'kerala-hotel-3',
        name: 'Brunton Boatyard',
        location: 'Fort Kochi',
        pricePerNightInr: 9200,
        rating: 4.7,
        description: 'Luxury heritage hotel on the waterfront with colonial charm',
        type: 'comfortable',
        lat: 9.9658,
        lng: 76.2425
      },
      {
        id: 'kerala-hotel-4',
        name: 'Spice Village Periyar',
        location: 'Thekkady, Periyar',
        pricePerNightInr: 5500,
        rating: 4.6,
        description: 'Eco-resort with spice plantation tours and wildlife experiences',
        type: 'balanced',
        lat: 9.6031,
        lng: 77.1615
      }
    ],
    restaurants: [
      {
        id: 'kerala-rest-1',
        name: 'Thaff Restaurant',
        location: 'Fort Kochi',
        cuisine: 'Kerala, Seafood',
        specialties: ['Karimeen Pollichathu', 'Appam with Stew', 'Meen Moilee'],
        averageCostInr: 700,
        description: 'Family restaurant known for authentic Kerala fish preparations',
        lat: 9.9658,
        lng: 76.2425
      },
      {
        id: 'kerala-rest-2',
        name: 'Dhe Puttu',
        location: 'Panampilly Nagar, Kochi',
        cuisine: 'Kerala, Traditional',
        specialties: ['Kerala Puttu Varieties', 'Appam with Stew', 'Ela Ada'],
        averageCostInr: 500,
        description: 'Specialized in traditional Kerala breakfast with 20+ puttu varieties',
        lat: 9.9670,
        lng: 76.2820
      },
      {
        id: 'kerala-rest-3',
        name: 'Paragon Restaurant',
        location: 'Calicut',
        cuisine: 'Malabar, Seafood',
        specialties: ['Malabar Parotta', 'Chicken Biryani', 'Fish Mappas'],
        averageCostInr: 650,
        description: 'Iconic restaurant chain famous for Malabar cuisine and biryani',
        lat: 11.2588,
        lng: 75.7804
      },
      {
        id: 'kerala-rest-4',
        name: 'Rapsy Restaurant',
        location: 'Alleppey',
        cuisine: 'Kerala, Seafood',
        specialties: ['Karimeen Pollichathu', 'Prawn Curry', 'Kerala Meals'],
        averageCostInr: 600,
        description: 'Waterfront restaurant serving fresh catch from the backwaters',
        lat: 9.4981,
        lng: 76.3388
      },
      {
        id: 'kerala-rest-5',
        name: 'Saravana Bhavan',
        location: 'Multiple locations, Kerala',
        cuisine: 'South Indian, Vegetarian',
        specialties: ['Appam with Stew', 'Kerala Sadya', 'Filter Coffee'],
        averageCostInr: 400,
        description: 'Famous South Indian chain with Kerala specialties',
        lat: 9.9312,
        lng: 76.2673
      }
    ],
    famousDishes: [
      {
        name: 'Appam with Stew',
        description: 'Soft, lacy rice pancakes with a thick spongy center served alongside a mild, coconut-milk-based vegetable or meat stew. The contrast of the crispy edges and pillowy center with the aromatic stew is a hallmark of Kerala breakfast.',
        whereToTry: 'Dhe Puttu, Thaff Restaurant',
        estimatedPrice: 150,
        category: 'Main Course',
        spiceLevel: 'Mild',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Kerala Sadya',
        description: 'A grand vegetarian feast of 20+ dishes served on a banana leaf during festivals — rice, sambar, rasam, avial, thoran, pachadi, pickles, and payasam. Each morsel is a different flavor universe.',
        whereToTry: 'Saravana Bhavan, Dhe Puttu',
        estimatedPrice: 350,
        category: 'Main Course',
        spiceLevel: 'Mild',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Karimeen Pollichathu (Pearl Spot Fish)',
        description: 'Pearl spot fish marinated in a fiery red spice paste, wrapped in banana leaf and slow-cooked over an open flame. The banana leaf imparts an earthy aroma that perfectly complements the tangy fish.',
        whereToTry: 'Thaff Restaurant (Fort Kochi), Rapsy Restaurant (Alleppey)',
        estimatedPrice: 450,
        category: 'Main Course',
        spiceLevel: 'Spicy',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Kerala Banana Chips',
        description: 'Thin, crispy chips made from raw nendran bananas, fried in coconut oil and seasoned with salt or chili. A ubiquitous snack found across Kerala, with an irresistible crunch and subtle sweetness.',
        whereToTry: 'Local street vendors, markets across Kerala',
        estimatedPrice: 50,
        category: 'Snack',
        vegetarian: true,
        mustTry: false
      },
      {
        name: 'Payasam',
        description: 'Kerala\'s beloved dessert — a sweetened milk pudding made with rice, vermicelli, or lentils, flavored with cardamom, cashews, and raisins. The Palada Payasam from Ambalapuzha temple is legendary.',
        whereToTry: 'Saravana Bhavan, Dhe Puttu',
        estimatedPrice: 120,
        category: 'Dessert',
        vegetarian: true,
        mustTry: false
      },
      {
        name: 'Fish Molee (Meen Moilee)',
        description: 'A delicate, golden coconut-milk fish curry fragrant with turmeric, green chilies, and ginger. One of Kerala\'s most subtle curries, this pairs beautifully with appam or bread and is a staple of Syrian Christian cooking.',
        whereToTry: 'Thaff Restaurant (Fort Kochi), Rapsy Restaurant',
        estimatedPrice: 380,
        category: 'Main Course',
        spiceLevel: 'Mild',
        vegetarian: false,
        mustTry: false
      }
    ],
    attractions: [
      {
        id: 'kerala-1',
        name: 'Alleppey Kettuvallam Backwater Cruise',
        category: 'Relaxation',
        durationHours: 5,
        estimatedCostInr: 2500,
        timeOfDay: 'morning',
        lat: 9.4981,
        lng: 76.3388,
        description: 'Drift along palm-fringed lagoons on a traditional thatched houseboat while enjoying fresh local cuisine.',
        highlight: 'Pristine canal reflections and serene village pace',
        bestFor: ['Romantic', 'Relaxed', 'Couple', 'Family']
      },
      {
        id: 'kerala-2',
        name: 'Munnar Tea Estate Mist Walk',
        category: 'Nature',
        durationHours: 3.5,
        estimatedCostInr: 500,
        timeOfDay: 'morning',
        lat: 10.0889,
        lng: 77.0595,
        description: 'Wander through undulating emerald tea carpets shrouded in mountain cloud forests with crisp alpine air.',
        highlight: 'Endless rolling emerald green valleys and tea tastings',
        bestFor: ['Nature', 'Photography', 'Peaceful']
      },
      {
        id: 'kerala-3',
        name: 'Fort Kochi Chinese Fishing Nets & Spice Market',
        category: 'Culture',
        durationHours: 3,
        estimatedCostInr: 400,
        timeOfDay: 'sunset',
        lat: 9.9658,
        lng: 76.2425,
        description: 'Cantilevered shore-operated fishing nets silhouetted against sea sunsets, flanked by historic Dutch and Jewish quarters.',
        highlight: 'Sunset silhouettes of ancient fishing nets along the harbor',
        bestFor: ['Culture', 'Photography', 'Solo', 'Couple']
      },
      {
        id: 'kerala-4',
        name: 'Periyar Organic Spice Plantation Tour',
        category: 'Food',
        durationHours: 2.5,
        estimatedCostInr: 600,
        timeOfDay: 'afternoon',
        lat: 9.6031,
        lng: 77.1615,
        description: 'Walk through cardamoms, cinnamon, nutmeg, and black pepper groves guided by veteran botanists.',
        highlight: 'Aromas of raw spices and Ayurvedic medicinal insights',
        bestFor: ['Food', 'Family', 'Nature']
      },
      {
        id: 'kerala-5',
        name: 'Marari Coastal Village & Hammock Cove',
        category: 'Relaxation',
        durationHours: 3,
        estimatedCostInr: 450,
        timeOfDay: 'evening',
        lat: 9.5986,
        lng: 76.3025,
        description: 'Quiet, undiscovered stretch of powdery white sands where local fishermen launch colorful wooden catamarans.',
        highlight: 'Unspoiled coastal solitude under swaying coconut palms',
        bestFor: ['Peaceful', 'Relaxed', 'Romantic']
      }
    ]
  },
  {
    id: 'meghalaya',
    name: 'Meghalaya',
    state: 'Meghalaya',
    tagline: 'The Abode of Clouds: dramatic waterfalls, mystical gorges, and living roots.',
    description: 'A rain-blessed plateau of deep limestone gorges, sacred forests, crystal-clear mountain rivers, and bio-engineered living root bridges.',
    editorialQuote: 'A secret realm above the clouds where ancient trees weave bridges across torrential jungle rivers.',
    image: '/src/assets/images/dest_meghalaya_1792602058038.jpg',
    lat: 25.5788,
    lng: 91.8933,
    defaultDays: 4,
    suggestedBudgetInr: 26000,
    costTier: 'hill',
    costMultiplier: 0.9,
    categories: ['Adventure', 'Nature', 'Photography'],
    bestMonths: 'October – April',
    temperature: '12°C – 23°C',
    highlights: ['Nohkalikai Waterfall Abyss', 'Nongriat Double Decker Living Root Bridge', 'Dawki Umngot Crystal Waters', 'Mawlynnong Cleanest Village'],
    localFood: ['Jadoh Rice with Herbs', 'Dohneiiong Pork in Black Sesame', 'Tungrymbai Fermented Soy', 'Wild Berry Preserve'],
    hotels: [
      {
        id: 'meghalaya-hotel-1',
        name: 'Polo Orchid Resort',
        location: 'Cherrapunji',
        pricePerNightInr: 3500,
        rating: 4.3,
        description: 'Comfortable resort with waterfall views and local hospitality',
        type: 'budget',
        lat: 25.2764,
        lng: 91.6845
      },
      {
        id: 'meghalaya-hotel-2',
        name: 'Hotel Centre Point',
        location: 'Police Bazaar, Shillong',
        pricePerNightInr: 4200,
        rating: 4.4,
        description: 'Mid-range hotel in the heart of Shillong with modern amenities',
        type: 'balanced',
        lat: 25.5788,
        lng: 91.8933
      },
      {
        id: 'meghalaya-hotel-3',
        name: 'Ri Kynjai Resort',
        location: 'Umiam Lake, Shillong',
        pricePerNightInr: 8500,
        rating: 4.7,
        description: 'Luxury lakeside resort with traditional Khasi architecture and spa',
        type: 'comfortable',
        lat: 25.6625,
        lng: 91.9125
      },
      {
        id: 'meghalaya-hotel-4',
        name: 'Living Root Bridge Homestay',
        location: 'Nongriat Village',
        pricePerNightInr: 2000,
        rating: 4.0,
        description: 'Authentic tribal homestay near the living root bridges',
        type: 'budget',
        lat: 25.2492,
        lng: 91.6738
      }
    ],
    restaurants: [
      {
        id: 'meghalaya-rest-1',
        name: 'City Hut Family Dhaba',
        location: 'Police Bazaar, Shillong',
        cuisine: 'North-Eastern, Indian',
        specialties: ['Jadoh Rice', 'Dohneiiong Pork', 'Momos'],
        averageCostInr: 450,
        description: 'Popular family restaurant with Khasi and North Indian dishes',
        lat: 25.5788,
        lng: 91.8933
      },
      {
        id: 'meghalaya-rest-2',
        name: 'Trattoria',
        location: 'Laitumkhrah, Shillong',
        cuisine: 'Multi-cuisine, Khasi',
        specialties: ['Jadoh Rice', 'Tungrymbai', 'Pork with Bamboo Shoots'],
        averageCostInr: 650,
        description: 'Cozy restaurant serving authentic Khasi tribal cuisine',
        lat: 25.5760,
        lng: 91.8910
      },
      {
        id: 'meghalaya-rest-3',
        name: 'ML 05 Café',
        location: 'Laitumkhrah, Shillong',
        cuisine: 'Café, North-Eastern',
        specialties: ['Pork Momos', 'Khasi Pork Curry', 'Filter Coffee'],
        averageCostInr: 400,
        description: 'Trendy café with local flavors and live music',
        lat: 25.5770,
        lng: 91.8920
      },
      {
        id: 'meghalaya-rest-4',
        name: 'Orange Roots',
        location: 'Cherrapunji',
        cuisine: 'North-Eastern, Continental',
        specialties: ['Dohneiiong Pork', 'Jadoh Rice', 'Smoked Pork'],
        averageCostInr: 550,
        description: 'Restaurant with valley views and traditional Khasi preparations',
        lat: 25.2764,
        lng: 91.6845
      },
      {
        id: 'meghalaya-rest-5',
        name: 'Café Shillong',
        location: 'Police Bazaar, Shillong',
        cuisine: 'Café, Snacks',
        specialties: ['Local Snacks', 'Momos', 'Thukpa'],
        averageCostInr: 300,
        description: 'Popular hangout spot with comfort food and student crowd',
        lat: 25.5780,
        lng: 91.8925
      }
    ],
    famousDishes: [
      {
        name: 'Jadoh',
        description: 'Meghalaya\'s beloved Khasi rice dish cooked with pork or chicken, turmeric, and bay leaves in a savory broth. This one-pot meal of reddish rice is fragrant, deeply satisfying, and central to Khasi celebrations.',
        whereToTry: 'City Hut Family Dhaba, Trattoria, Orange Roots',
        estimatedPrice: 220,
        category: 'Main Course',
        spiceLevel: 'Mild',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Dohkhlieh',
        description: 'A refreshing Khasi salad of boiled pork or fish mixed with onions, chili, ginger, and a squeeze of lime. Light, punchy, and herbaceous, it is often served as a starter or side dish at Khasi gatherings.',
        whereToTry: 'City Hut Family Dhaba, Trattoria',
        estimatedPrice: 180,
        category: 'Snack',
        spiceLevel: 'Medium',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Tungrymbai',
        description: 'A strongly flavored dish made from fermented soya beans, slow-cooked with pork fat, dried fish, and spices. The pungent umami depth of this Khasi staple is unlike anything else in Indian cuisine.',
        whereToTry: 'Trattoria, City Hut Family Dhaba',
        estimatedPrice: 200,
        category: 'Main Course',
        spiceLevel: 'Medium',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Nakham Bitchi',
        description: 'A pungent traditional Khasi soup made from dried fish, often used as a base for other dishes or eaten with rice. Its intense savory-smoky flavor reflects the Khasi tradition of preserving food for the long monsoon season.',
        whereToTry: 'City Hut Family Dhaba, Local Khasi eateries',
        estimatedPrice: 150,
        category: 'Main Course',
        spiceLevel: 'Mild',
        vegetarian: false,
        mustTry: false
      },
      {
        name: 'Pukhlein',
        description: 'Sweet fried rice cakes made from rice flour and jaggery — Meghalaya\'s most beloved dessert snack. Crispy on the outside and chewy within, these golden rounds are sold at every market in Shillong.',
        whereToTry: 'Local markets, Café Shillong, Street vendors',
        estimatedPrice: 40,
        category: 'Dessert',
        vegetarian: true,
        mustTry: false
      },
      {
        name: 'Bamboo Shoot Pork Curry',
        description: 'Tender pork slow-cooked with young bamboo shoots and aromatic spices in a tangy, earthy broth. The bamboo shoots add a distinctive crunch and slight tartness that perfectly balances the rich pork.',
        whereToTry: 'ML 05 Café, Orange Roots',
        estimatedPrice: 280,
        category: 'Main Course',
        spiceLevel: 'Medium',
        vegetarian: false,
        mustTry: false
      }
    ],
    attractions: [
      {
        id: 'meghalaya-1',
        name: 'Nohkalikai Falls & Gorge Viewpoint',
        category: 'Photography',
        durationHours: 2.5,
        estimatedCostInr: 300,
        timeOfDay: 'morning',
        lat: 25.2764,
        lng: 91.6845,
        description: 'India’s tallest plunge waterfall cascading 340 meters into a mystical neon-turquoise pool.',
        highlight: 'Vast cloud inversions and emerald abyss views',
        bestFor: ['Photography', 'Nature', 'Solo', 'Friends']
      },
      {
        id: 'meghalaya-2',
        name: 'Nongriat Double Decker Living Root Bridge Trek',
        category: 'Adventure',
        durationHours: 6,
        estimatedCostInr: 800,
        timeOfDay: 'morning',
        lat: 25.2492,
        lng: 91.6738,
        description: 'Descend 3,500 stone stairs into deep jungle to see centuries-old Ficus elastica roots woven into aerial bridges.',
        highlight: 'Marvel of indigenous Khasi bio-engineering and crystal pools',
        bestFor: ['Adventure', 'Active', 'Friends']
      },
      {
        id: 'meghalaya-3',
        name: 'Dawki Umngot River Boat Drift',
        category: 'Nature',
        durationHours: 3,
        estimatedCostInr: 700,
        timeOfDay: 'afternoon',
        lat: 25.1874,
        lng: 92.0232,
        description: 'Boating on water so crystalline that wooden boats appear to float in mid-air over pebble riverbeds.',
        highlight: 'Glass-clear emerald river and gorge walls',
        bestFor: ['Nature', 'Romantic', 'Couple', 'Photography']
      },
      {
        id: 'meghalaya-4',
        name: 'Mawphlang Sacred Forest & Monolith Walk',
        category: 'Culture',
        durationHours: 2.5,
        estimatedCostInr: 400,
        timeOfDay: 'morning',
        lat: 25.4527,
        lng: 91.7582,
        description: 'Ancient primeval forest protected by tribal taboos, featuring mossy trees, medicinal orchids, and megalithic stone altars.',
        highlight: 'Unbroken ecological time capsule guided by tribal elders',
        bestFor: ['Culture', 'Peaceful', 'Family']
      },
      {
        id: 'meghalaya-5',
        name: 'Wei Sawdong Three-Tiered Falls',
        category: 'Adventure',
        durationHours: 3,
        estimatedCostInr: 350,
        timeOfDay: 'afternoon',
        lat: 25.2951,
        lng: 91.6912,
        description: 'Stunning tiered natural amphitheater waterfall tucked in a dense forest accessed by a bamboo ladder path.',
        highlight: 'Aquamarine terraced pools cascading down mossy limestone',
        bestFor: ['Adventure', 'Photography', 'Friends']
      }
    ]
  },
  {
    id: 'ladakh',
    name: 'Ladakh',
    state: 'Ladakh',
    tagline: 'High-altitude desert wonderland, monasteries, and cobalt alpine lakes.',
    description: 'The Land of High Passes situated in the rain shadow of the Himalayas, where jagged snow peaks meet Tibetan monastic sanctuaries and crystalline glacial lakes.',
    editorialQuote: 'A cosmic expanse stripped of illusion, where cobalt skies touch stark stone and prayer flags whisper with the mountain wind.',
    image: '/src/assets/images/dest_ladakh_1792602057846.jpg',
    lat: 34.1526,
    lng: 77.5771,
    defaultDays: 5,
    suggestedBudgetInr: 42000,
    costTier: 'hill',
    costMultiplier: 1.4,
    categories: ['Adventure', 'Photography', 'Culture', 'Nature'],
    bestMonths: 'May – September',
    temperature: '8°C – 22°C',
    highlights: ['Pangong Tso Alpine Lake', 'Nubra Valley Hunder Sand Dunes', 'Thiksey Gompa Morning Prayers', 'Khardung La World High Pass'],
    localFood: ['Thukpa Noodle Soup', 'Momos with Chili Dip', 'Butter Tea (Gur Gur)', 'Skyu Pasta Stew'],
    hotels: [
      {
        id: 'ladakh-hotel-1',
        name: 'Zostel Leh',
        location: 'Old Leh Road, Leh',
        pricePerNightInr: 2500,
        rating: 4.2,
        description: 'Backpacker hostel with mountain views and shared spaces',
        type: 'budget',
        lat: 34.1526,
        lng: 77.5771
      },
      {
        id: 'ladakh-hotel-2',
        name: 'The Grand Dragon',
        location: 'Old Road, Leh',
        pricePerNightInr: 7500,
        rating: 4.6,
        description: 'Premium hotel with oxygen-enriched rooms and valley views',
        type: 'comfortable',
        lat: 34.1620,
        lng: 77.5850
      },
      {
        id: 'ladakh-hotel-3',
        name: 'Nubra Ethnic Camp',
        location: 'Hunder, Nubra Valley',
        pricePerNightInr: 4500,
        rating: 4.4,
        description: 'Luxury tented camp with Bactrian camel rides and sand dune views',
        type: 'balanced',
        lat: 34.5778,
        lng: 77.4697
      },
      {
        id: 'ladakh-hotel-4',
        name: 'Hotel Stok Palace Heritage',
        location: 'Stok Village, Leh',
        pricePerNightInr: 5200,
        rating: 4.5,
        description: 'Heritage hotel near Stok Palace with traditional Ladakhi hospitality',
        type: 'balanced',
        lat: 34.0500,
        lng: 77.5700
      }
    ],
    restaurants: [
      {
        id: 'ladakh-rest-1',
        name: 'Gesmo Restaurant',
        location: 'Main Bazaar, Leh',
        cuisine: 'Tibetan, Continental',
        specialties: ['Thukpa', 'Momos', 'Butter Tea', 'Tingmo'],
        averageCostInr: 500,
        description: 'Popular café-bakery serving authentic Tibetan food since 1986',
        lat: 34.1641,
        lng: 77.5840
      },
      {
        id: 'ladakh-rest-2',
        name: 'Tibetan Kitchen',
        location: 'Fort Road, Leh',
        cuisine: 'Tibetan, Ladakhi',
        specialties: ['Skyu', 'Thukpa', 'Momos with Chili Dip', 'Tsampa'],
        averageCostInr: 550,
        description: 'Cozy restaurant with traditional Ladakhi recipes and warm ambiance',
        lat: 34.1650,
        lng: 77.5860
      },
      {
        id: 'ladakh-rest-3',
        name: 'Bon Appetit',
        location: 'Changspa Lane, Leh',
        cuisine: 'Multi-cuisine, Bakery',
        specialties: ['Momos', 'Thukpa', 'Wood-fired Pizza'],
        averageCostInr: 600,
        description: 'German bakery with garden seating and Himalayan views',
        lat: 34.1722,
        lng: 77.5758
      },
      {
        id: 'ladakh-rest-4',
        name: 'Chopsticks Noodle Bar',
        location: 'Fort Road, Leh',
        cuisine: 'Tibetan, Asian',
        specialties: ['Thukpa', 'Gyathuk', 'Momos', 'Fried Rice'],
        averageCostInr: 450,
        description: 'Budget-friendly noodle bar with generous portions',
        lat: 34.1655,
        lng: 77.5855
      },
      {
        id: 'ladakh-rest-5',
        name: 'Summer Harvest',
        location: 'Stok Village, Leh',
        cuisine: 'Ladakhi, Organic',
        specialties: ['Skyu', 'Butter Tea', 'Paba', 'Khambir Bread'],
        averageCostInr: 700,
        description: 'Farm-to-table restaurant with organic Ladakhi cuisine',
        lat: 34.0500,
        lng: 77.5700
      }
    ],
    famousDishes: [
      {
        name: 'Thukpa',
        description: 'A hearty Tibetan noodle soup slow-cooked with vegetables or meat in a rich broth spiced with ginger and black pepper. The ultimate comfort food at high altitude, warming both body and soul after a day of mountain exploration.',
        whereToTry: 'Gesmo Restaurant, Tibetan Kitchen, Chopsticks Noodle Bar',
        estimatedPrice: 180,
        category: 'Main Course',
        spiceLevel: 'Mild',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Momos with Chili Dip',
        description: 'Steamed or fried dumplings stuffed with minced meat or vegetables, served with a fiery tomato-chili dipping sauce. Ladakh\'s most popular street food, these delicate pockets of filling are endlessly snackable.',
        whereToTry: 'Gesmo Restaurant, Bon Appetit, Chopsticks Noodle Bar',
        estimatedPrice: 120,
        category: 'Street Food',
        spiceLevel: 'Medium',
        vegetarian: false,
        mustTry: true
      },
      {
        name: 'Butter Tea (Gur Gur Chai)',
        description: 'A unique salty, buttery tea made by churning strong black tea with yak butter and salt. An acquired taste that is deeply energizing at high altitude and central to Ladakhi culture and hospitality.',
        whereToTry: 'Summer Harvest, Tibetan Kitchen, Local homestays',
        estimatedPrice: 60,
        category: 'Beverage',
        vegetarian: true,
        mustTry: true
      },
      {
        name: 'Skyu',
        description: 'A traditional Ladakhi stew with thick hand-shaped pasta pieces cooked with root vegetables, lamb, and aromatic herbs. This rustic, slow-cooked dish has sustained Ladakhi families through harsh winters for centuries.',
        whereToTry: 'Tibetan Kitchen, Summer Harvest',
        estimatedPrice: 220,
        category: 'Main Course',
        spiceLevel: 'Mild',
        vegetarian: false,
        mustTry: false
      },
      {
        name: 'Tingmo',
        description: 'Soft, flower-shaped steamed bread with a fluffy spiral interior, served alongside spicy curries or stews. A Tibetan bread staple in Ladakh that is light, pillowy, and perfect for mopping up rich gravies.',
        whereToTry: 'Gesmo Restaurant, Tibetan Kitchen',
        estimatedPrice: 80,
        category: 'Snack',
        vegetarian: true,
        mustTry: false
      },
      {
        name: 'Khambir',
        description: 'Traditional Ladakhi sourdough bread made from whole wheat flour with a dense, chewy texture. Best eaten warm with butter and apricot jam — apricots being among Ladakh\'s most prized agricultural produce.',
        whereToTry: 'Summer Harvest, Local bakeries in Leh',
        estimatedPrice: 50,
        category: 'Snack',
        vegetarian: true,
        mustTry: false
      }
    ],
    attractions: [
      {
        id: 'ladakh-1',
        name: 'Pangong Tso Cobalt Lake Expedition',
        category: 'Photography',
        durationHours: 5,
        estimatedCostInr: 1500,
        timeOfDay: 'morning',
        lat: 33.7595,
        lng: 78.6674,
        description: 'Endorheic salt lake at 4,350m spanning India and Tibet, famous for its color transitions from turquoise to deep indigo.',
        highlight: 'Changing spectrum of blue waters reflecting Himalayan glaciers',
        bestFor: ['Photography', 'Adventure', 'Solo', 'Friends']
      },
      {
        id: 'ladakh-2',
        name: 'Thiksey Monastery Dawn Chanting',
        category: 'Culture',
        durationHours: 3,
        estimatedCostInr: 300,
        timeOfDay: 'morning',
        lat: 34.0583,
        lng: 77.6667,
        description: 'Twelve-story whitewashed complex resembling the Potala Palace, housing a 15-meter statue of Maitreya Buddha.',
        highlight: 'Monks chanting with Tibetan horns at first light',
        bestFor: ['Culture', 'Peaceful', 'Couple', 'Family']
      },
      {
        id: 'ladakh-3',
        name: 'Nubra Valley & Hunder Double-Humped Camel Dunes',
        category: 'Adventure',
        durationHours: 4,
        estimatedCostInr: 800,
        timeOfDay: 'sunset',
        lat: 34.5778,
        lng: 77.4697,
        description: 'White sand dunes at 10,000 feet surrounded by dramatic mountain walls, home to native Bactrian camels.',
        highlight: 'Riding through high desert dunes framed by snow peaks',
        bestFor: ['Adventure', 'Photography', 'Friends']
      },
      {
        id: 'ladakh-4',
        name: 'Khardung La High Mountain Pass',
        category: 'Adventure',
        durationHours: 2,
        estimatedCostInr: 400,
        timeOfDay: 'morning',
        lat: 34.2789,
        lng: 77.6047,
        description: 'Legendary mountain pass at 5,359 meters connecting Leh to the Nubra and Shyok valleys.',
        highlight: 'Standing on the roof of the world amid swirling prayer flags',
        bestFor: ['Adventure', 'Active', 'Friends']
      },
      {
        id: 'ladakh-5',
        name: 'Shanti Stupa Twilight Meditation',
        category: 'Relaxation',
        durationHours: 2,
        estimatedCostInr: 200,
        timeOfDay: 'sunset',
        lat: 34.1722,
        lng: 77.5758,
        description: 'White-domed Buddhist stupa atop a hill in Chanspa with panoramic views of Leh town and the Stok Kangri peak.',
        highlight: 'Golden hour twilight over the Indus Valley',
        bestFor: ['Peaceful', 'Romantic', 'Solo']
      }
    ]
  }
];

export const STARTING_CITIES = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Chennai',
  'Kolkata',
  'Hyderabad',
  'Pune',
  'Ahmedabad'
];
