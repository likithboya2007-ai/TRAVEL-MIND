import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { getRecommendations, type Recommendation } from '../utils/recommendationEngine';
import { useAuth } from '../contexts/AuthContext';

export function RecommendedDestinations() {
  const { user } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setLoading(true);
      getRecommendations(user.id)
        .then(setRecommendations)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (!user || recommendations.length === 0) return null;

  return (
    <section className="py-12 px-6 bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="text-purple-600" size={32} />
          <h2 className="text-3xl font-bold">Recommended for You</h2>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {recommendations.map((rec) => (
              <div key={rec.destination.id} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition">
                <div className="h-40 bg-gradient-to-br from-blue-400 to-purple-400"></div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{rec.destination.name}</h3>
                  <p className="text-xs text-blue-600 mb-3">{rec.reason}</p>
                  <button className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition">
                    Plan Trip
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
