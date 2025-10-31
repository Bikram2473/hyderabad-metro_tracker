import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Star, Trash2, MapPin, Clock, TrendingUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const response = await axios.get(`${API}/favorites`);
      setFavorites(response.data);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Failed to load favorites");
    } finally {
      setLoading(false);
    }
  };

  const deleteFavorite = async (id) => {
    try {
      await axios.delete(`${API}/favorites/${id}`);
      setFavorites(favorites.filter(fav => fav.id !== id));
      toast.success("Favorite removed");
    } catch (error) {
      console.error("Error deleting favorite:", error);
      toast.error("Failed to remove favorite");
    }
  };

  const startJourney = async (source, destination) => {
    try {
      const response = await axios.post(`${API}/journey/start`, null, {
        params: { source, destination }
      });
      
      if (response.data.success) {
        toast.success("Journey started!");
        navigate("/journey");
      }
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("Active journey")) {
        toast.error("You already have an active journey");
        navigate("/journey");
      } else {
        toast.error("Failed to start journey");
      }
    }
  };

  const getLineColor = (line) => {
    const colors = {
      red: "#E63946",
      blue: "#457B9D",
      green: "#2A9D8F"
    };
    return colors[line] || "#6c757d";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-lg text-gray-600">Loading favorites...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Star className="w-10 h-10 text-yellow-500 fill-yellow-500" />
            <h1 className="text-3xl sm:text-4xl font-bold">Favorite Routes</h1>
          </div>
          <p className="text-gray-600">Quick access to your frequently traveled routes</p>
        </div>

        {favorites.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <Star className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-600 mb-4">No favorite routes yet</p>
              <p className="text-sm text-gray-500 mb-6">
                Start by finding a route and adding it to your favorites
              </p>
              <Button onClick={() => navigate("/")} data-testid="go-home-button">
                Find a Route
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {favorites.map((favorite) => (
              <Card key={favorite.id} className="glass hover:shadow-lg transition-all" data-testid="favorite-route-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <span>{favorite.source} → {favorite.destination}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteFavorite(favorite.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      data-testid="delete-favorite-button"
                    >
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Route Summary */}
                  <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                    <div className="text-center">
                      <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                      <p className="text-sm text-gray-600">Duration</p>
                      <p className="text-lg font-bold">{favorite.route.total_duration_minutes} min</p>
                    </div>
                    <div className="text-center">
                      <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                      <p className="text-sm text-gray-600">Stations</p>
                      <p className="text-lg font-bold">{favorite.route.total_stations}</p>
                    </div>
                    <div className="text-center">
                      <MapPin className="w-5 h-5 mx-auto mb-1 text-pink-600" />
                      <p className="text-sm text-gray-600">Transfers</p>
                      <p className="text-lg font-bold">{favorite.route.transfers}</p>
                    </div>
                  </div>

                  {/* Route Segments */}
                  <div className="space-y-3">
                    {favorite.route.segments.map((segment, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 p-3 rounded-lg border-l-4"
                        style={{ borderColor: getLineColor(segment.line), backgroundColor: `${getLineColor(segment.line)}10` }}
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getLineColor(segment.line) }}
                        />
                        <div className="flex-1">
                          <p className="font-semibold capitalize text-sm">
                            {segment.line} Line
                          </p>
                          <p className="text-xs text-gray-600">
                            {segment.from_station} → {segment.to_station}
                          </p>
                        </div>
                        <span className="text-sm text-gray-600">{segment.duration_minutes} min</span>
                      </div>
                    ))}
                  </div>

                  {/* Start Journey Button */}
                  <Button
                    onClick={() => startJourney(favorite.source, favorite.destination)}
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700"
                    data-testid="start-journey-from-favorite-button"
                  >
                    <MapPin className="w-4 h-4 mr-2" />
                    Start This Journey
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoritesPage;
