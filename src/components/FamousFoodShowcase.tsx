import React from 'react';
import { ChefHat, Star, MapPin, ExternalLink } from 'lucide-react';

interface FamousDish {
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

interface FamousFoodShowcaseProps {
  destinationName: string;
  dishes: FamousDish[];
}

export const FamousFoodShowcase: React.FC<FamousFoodShowcaseProps> = ({
  destinationName,
  dishes,
}) => {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Main Course': 'bg-red-100 text-red-700 border-red-200',
      'Dessert': 'bg-pink-100 text-pink-700 border-pink-200',
      'Snack': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Beverage': 'bg-blue-100 text-blue-700 border-blue-200',
      'Street Food': 'bg-orange-100 text-orange-700 border-orange-200',
    };
    return colors[category] || 'bg-gray-100 text-gray-700 border-gray-200';
  };

  const getSpiceLevelEmoji = (level?: string) => {
    const emojis: Record<string, string> = {
      'Mild': '🟢',
      'Medium': '🟡',
      'Spicy': '🟠',
      'Very Spicy': '🔴',
    };
    return level ? emojis[level] : '';
  };

  const handleSearchFood = (dishName: string) => {
    const query = encodeURIComponent(`${dishName} ${destinationName}`);
    const url = `https://www.google.com/search?q=${query}+recipe`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCardClick = (dish: FamousDish) => {
    // Search for the dish with recipe and restaurant
    const query = encodeURIComponent(`${dish.name} ${destinationName} recipe where to eat`);
    const url = `https://www.google.com/search?q=${query}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (!dishes || dishes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-red-50 border-2 border-orange-200 rounded-2xl p-6 sm:p-8 shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-md">
            <ChefHat className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              Famous Food of {destinationName}
            </h3>
            <p className="text-sm text-gray-600">Must-try local delicacies and signature dishes</p>
          </div>
        </div>
      </div>

      {/* Food Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {dishes.map((dish, idx) => (
          <div
            key={idx}
            onClick={() => handleCardClick(dish)}
            className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:border-orange-300 hover:shadow-xl transition-all duration-300 group cursor-pointer"
          >
            {/* Image Placeholder */}
            <div className="relative h-48 bg-gradient-to-br from-orange-100 via-yellow-50 to-red-100 flex items-center justify-center overflow-hidden">
              {dish.image ? (
                <img
                  src={dish.image}
                  alt={dish.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-2">
                    {dish.category === 'Dessert' ? '🍰' :
                     dish.category === 'Beverage' ? '🍹' :
                     dish.category === 'Street Food' ? '🥘' :
                     dish.category === 'Snack' ? '🍢' : '🍛'}
                  </div>
                  <p className="text-xs text-gray-500 font-medium">{dish.name}</p>
                </div>
              )}
              
              {/* Must Try Badge */}
              {dish.mustTry && (
                <div className="absolute top-3 right-3 bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                  <Star className="w-3 h-3 fill-yellow-900" />
                  <span>Must Try!</span>
                </div>
              )}

              {/* Vegetarian Badge */}
              {dish.vegetarian && (
                <div className="absolute top-3 left-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                  🌱 VEG
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5">
              {/* Dish Name */}
              <h4 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-600 transition-colors">
                {dish.name}
              </h4>

              {/* Category and Spice Level */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <span className={`text-xs px-3 py-1 rounded-full font-semibold border ${getCategoryColor(dish.category)}`}>
                  {dish.category}
                </span>
                {dish.spiceLevel && (
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-gray-100 text-gray-700 border border-gray-300 flex items-center gap-1">
                    {getSpiceLevelEmoji(dish.spiceLevel)}
                    <span>{dish.spiceLevel}</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                {dish.description}
              </p>

              {/* Where to Try */}
              <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-orange-900 mb-1">Where to Try:</p>
                    <p className="text-xs text-orange-800">{dish.whereToTry}</p>
                  </div>
                </div>
              </div>

              {/* Price and Action */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                <div>
                  <span className="text-sm font-bold text-gray-900">
                    ₹{dish.estimatedPrice}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">approx</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSearchFood(dish.name);
                    }}
                    className="text-xs font-semibold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-orange-200"
                  >
                    <span>Recipe</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const query = encodeURIComponent(`${dish.name} ${destinationName} zomato`);
                      window.open(`https://www.zomato.com/search?q=${query}`, '_blank', 'noopener,noreferrer');
                    }}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 border border-red-200"
                  >
                    <span>Order</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Tip */}
      <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-xl">
        <p className="text-sm text-orange-900 flex items-start gap-2">
          <span className="text-xl shrink-0">👨‍🍳</span>
          <span>
            <strong>Pro Tip:</strong> Don't miss trying these authentic local dishes! 
            Ask locals for their favorite restaurants and visit during meal times for the freshest experience.
          </span>
        </p>
      </div>
    </div>
  );
};
