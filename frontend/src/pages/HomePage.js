import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MapPin, Clock, ArrowRight, Star, TrendingUp } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HomePage = () => {
  const [stations, setStations] = useState([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await axios.get(`${API}/stations`);
      // Remove duplicates (interchange stations)
      const uniqueStations = [];
      const seenNames = new Set();
      response.data.forEach(station => {
        if (!seenNames.has(station.name)) {
          uniqueStations.push(station);
          seenNames.add(station.name);
        }
      });
      setStations(uniqueStations);
    } catch (error) {
      console.error("Error fetching stations:", error);
      toast.error("Failed to load stations");
    }
  };

  const findRoute = async () => {
    if (!source || !destination) {
      toast.error("Please select both source and destination");
      return;
    }

    if (source === destination) {
      toast.error("Source and destination cannot be the same");
      return;
    }

    setLoading(true);
    try {
      const sourceStation = stations.find(s => s.name === source);
      const destStation = stations.find(s => s.name === destination);
      
      const response = await axios.get(`${API}/route/${sourceStation.id}/${destStation.id}`);
      setRoute(response.data);
    } catch (error) {
      console.error("Error finding route:", error);
      toast.error("Failed to find route");
    } finally {
      setLoading(false);
    }
  };

  const startJourney = async () => {
    try {
      const response = await axios.post(`${API}/journey/start`, null, {
        params: { source, destination }
      });
      
      if (response.data.success) {
        toast.success("Journey started! Tracking your trip...");
        navigate("/journey");
      }
    } catch (error) {
      console.error("Error starting journey:", error);
      if (error.response?.status === 400 && error.response?.data?.detail?.includes("Active journey")) {
        toast.error("You already have an active journey");
        navigate("/journey");
      } else {
        toast.error("Failed to start journey");
      }
    }
  };

  const addToFavorites = async () => {
    try {
      await axios.post(`${API}/favorites`, null, {
        params: { source, destination }
      });
      toast.success("Route added to favorites!");
    } catch (error) {
      console.error("Error adding to favorites:", error);
      toast.error("Failed to add to favorites");
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

  return (
    <div className="min-h-screen pb-20 pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Hyderabad Metro Tracker
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
            Find the optimal route, track your journey in real-time, and never miss your destination
          </p>
        </div>

        {/* Route Finder Card */}
        <Card className="glass mb-8" data-testid="route-finder-card">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <MapPin className="w-6 h-6 text-blue-600" />
              Plan Your Journey
            </CardTitle>
            <CardDescription>Select your source and destination to find the best route</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Source Station</label>
                <Select value={source} onValueChange={setSource}>
                  <SelectTrigger data-testid="source-station-select">
                    <SelectValue placeholder="Select source station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getLineColor(station.line) }}
                          />
                          {station.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Destination Station</label>
                <Select value={destination} onValueChange={setDestination}>
                  <SelectTrigger data-testid="destination-station-select">
                    <SelectValue placeholder="Select destination station" />
                  </SelectTrigger>
                  <SelectContent>
                    {stations.map((station) => (
                      <SelectItem key={station.id} value={station.name}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: getLineColor(station.line) }}
                          />
                          {station.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={findRoute}
              disabled={loading || !source || !destination}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              data-testid="find-route-button"
            >
              {loading ? "Finding Route..." : "Find Optimal Route"}
            </Button>
          </CardContent>
        </Card>

        {/* Route Display */}
        {route && (
          <Card className="glass mb-8" data-testid="route-result-card">
            <CardHeader>
              <CardTitle className="text-xl">Your Optimal Route</CardTitle>
              <CardDescription>
                From <span className="font-semibold text-gray-900">{route.source}</span> to{" "}
                <span className="font-semibold text-gray-900">{route.destination}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Route Summary */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="text-center">
                  <Clock className="w-5 h-5 mx-auto mb-1 text-blue-600" />
                  <p className="text-sm text-gray-600">Duration</p>
                  <p className="text-lg font-bold" data-testid="route-duration">{route.total_duration_minutes} min</p>
                </div>
                <div className="text-center">
                  <TrendingUp className="w-5 h-5 mx-auto mb-1 text-purple-600" />
                  <p className="text-sm text-gray-600">Stations</p>
                  <p className="text-lg font-bold" data-testid="route-stations">{route.total_stations}</p>
                </div>
                <div className="text-center">
                  <ArrowRight className="w-5 h-5 mx-auto mb-1 text-pink-600" />
                  <p className="text-sm text-gray-600">Transfers</p>
                  <p className="text-lg font-bold" data-testid="route-transfers">{route.transfers}</p>
                </div>
              </div>

              {/* Route Segments */}
              <div className="space-y-4">
                {route.segments.map((segment, index) => (
                  <div key={index} className="border-l-4 pl-4 py-2" style={{ borderColor: getLineColor(segment.line) }}>
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: getLineColor(segment.line) }}
                      />
                      <span className="font-semibold capitalize">{segment.line} Line</span>
                      <span className="text-sm text-gray-600">({segment.duration_minutes} min)</span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <span className="font-medium">From:</span> {segment.from_station}
                      </p>
                      <p>
                        <span className="font-medium">To:</span> {segment.to_station}
                      </p>
                      <p>
                        <span className="font-medium">Stations:</span> {segment.stations.length}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="grid md:grid-cols-2 gap-4">
                <Button
                  onClick={startJourney}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="start-journey-button"
                >
                  <MapPin className="w-4 h-4 mr-2" />
                  Start Journey
                </Button>
                <Button
                  onClick={addToFavorites}
                  variant="outline"
                  data-testid="add-to-favorites-button"
                >
                  <Star className="w-4 h-4 mr-2" />
                  Add to Favorites
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features Section */}
        <div className="grid md:grid-cols-3 gap-6 mt-12">
          <Card className="glass hover:shadow-lg transition-all">
            <CardHeader>
              <MapPin className="w-10 h-10 mb-2 text-blue-600" />
              <CardTitle className="text-lg">Live Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Real-time journey tracking with animated train movement and next station alerts
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover:shadow-lg transition-all">
            <CardHeader>
              <Star className="w-10 h-10 mb-2 text-purple-600" />
              <CardTitle className="text-lg">Save Favorites</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Save your frequently traveled routes for quick access and faster planning
              </p>
            </CardContent>
          </Card>

          <Card className="glass hover:shadow-lg transition-all">
            <CardHeader>
              <Clock className="w-10 h-10 mb-2 text-pink-600" />
              <CardTitle className="text-lg">Smart Alerts</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Get notified 1 minute before reaching your destination, never miss your stop
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
