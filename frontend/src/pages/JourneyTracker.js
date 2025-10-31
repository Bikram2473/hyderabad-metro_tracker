import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { MapPin, Navigation, AlertCircle, CheckCircle } from "lucide-react";
import MetroMap from "../components/MetroMap";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const JourneyTracker = () => {
  const [journey, setJourney] = useState(null);
  const [currentStationIndex, setCurrentStationIndex] = useState(0);
  const [allStations, setAllStations] = useState([]);
  const [progress, setProgress] = useState(0);
  const [hasShownDestinationAlert, setHasShownDestinationAlert] = useState(false);
  const navigate = useNavigate();
  const notificationShownRef = useRef(false);

  useEffect(() => {
    checkActiveJourney();
    requestNotificationPermission();
  }, []);

  useEffect(() => {
    if (journey && allStations.length > 0) {
      simulateJourney();
    }
  }, [journey, allStations]);

  const requestNotificationPermission = () => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const showNotification = (title, body) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, {
        body,
        icon: "/metro-icon.png",
        badge: "/metro-icon.png"
      });
    }
    toast.info(title, { description: body });
  };

  const checkActiveJourney = async () => {
    try {
      const response = await axios.get(`${API}/journey/active`);
      if (response.data.active) {
        setJourney(response.data.journey);
        const stations = extractAllStations(response.data.journey.route);
        setAllStations(stations);
        setCurrentStationIndex(response.data.journey.current_station_index || 0);
      } else {
        toast.error("No active journey found");
        navigate("/");
      }
    } catch (error) {
      console.error("Error checking active journey:", error);
      toast.error("Failed to load journey");
      navigate("/");
    }
  };

  const extractAllStations = (route) => {
    const stations = [];
    route.segments.forEach((segment, segmentIndex) => {
      segment.stations.forEach((stationName, idx) => {
        // Skip first station of subsequent segments (it's the interchange, already added)
        if (segmentIndex > 0 && idx === 0) return;
        stations.push({
          name: stationName,
          line: segment.line,
          segmentIndex
        });
      });
    });
    return stations;
  };

  const simulateJourney = () => {
    const interval = setInterval(() => {
      setCurrentStationIndex((prevIndex) => {
        const newIndex = prevIndex + 1;
        
        if (newIndex >= allStations.length) {
          clearInterval(interval);
          completeJourney();
          return prevIndex;
        }

        // Update progress
        const progressPercent = (newIndex / (allStations.length - 1)) * 100;
        setProgress(progressPercent);

        // Show next station notification
        if (newIndex < allStations.length) {
          const nextStation = allStations[newIndex];
          showNotification(
            "Next Station",
            `Approaching ${nextStation.name}`
          );
        }

        // Show destination alert 1 minute (1 station) before
        if (newIndex === allStations.length - 2 && !hasShownDestinationAlert) {
          setHasShownDestinationAlert(true);
          const destination = allStations[allStations.length - 1];
          showNotification(
            "Destination Approaching",
            `Reaching ${destination.name} in approximately 1 minute!`
          );
        }

        // Update journey in backend
        if (journey) {
          axios.put(`${API}/journey/update/${journey.id}`, null, {
            params: { current_station_index: newIndex }
          }).catch(err => console.error("Error updating journey:", err));
        }

        return newIndex;
      });
    }, 3000); // 3 seconds per station (simulated)

    return () => clearInterval(interval);
  };

  const completeJourney = async () => {
    if (!journey) return;
    
    try {
      await axios.post(`${API}/journey/complete/${journey.id}`);
      showNotification(
        "Journey Complete!",
        `You have reached ${journey.route.destination}`
      );
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      console.error("Error completing journey:", error);
    }
  };

  const cancelJourney = async () => {
    if (!journey) return;
    
    try {
      await axios.post(`${API}/journey/complete/${journey.id}`);
      toast.success("Journey cancelled");
      navigate("/");
    } catch (error) {
      console.error("Error cancelling journey:", error);
      toast.error("Failed to cancel journey");
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

  if (!journey) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading journey...</p>
      </div>
    );
  }

  const currentStation = allStations[currentStationIndex];
  const nextStation = currentStationIndex < allStations.length - 1 ? allStations[currentStationIndex + 1] : null;
  const isLastStation = currentStationIndex === allStations.length - 1;

  return (
    <div className="min-h-screen pb-20 pt-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2" data-testid="journey-title">
            Journey in Progress
          </h1>
          <p className="text-gray-600">
            {journey.route.source} → {journey.route.destination}
          </p>
        </div>

        {/* Metro Map */}
        <Card className="glass mb-8">
          <CardContent className="p-6">
            <MetroMap
              route={journey.route}
              currentStationIndex={currentStationIndex}
              allStations={allStations}
            />
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card className="glass mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="w-6 h-6 text-blue-600" />
              Current Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Journey Progress</span>
                <span className="text-sm text-gray-600" data-testid="journey-progress">
                  {currentStationIndex + 1} / {allStations.length} stations
                </span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Current Station */}
            <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center station-pulse"
                  style={{ backgroundColor: getLineColor(currentStation?.line) }}
                >
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Current Station</p>
                  <p className="text-2xl font-bold" data-testid="current-station">{currentStation?.name}</p>
                  <p className="text-sm capitalize" style={{ color: getLineColor(currentStation?.line) }}>
                    {currentStation?.line} Line
                  </p>
                </div>
              </div>

              {nextStation && !isLastStation && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-300">
                  <AlertCircle className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-sm text-gray-600">Next Station</p>
                    <p className="text-xl font-semibold" data-testid="next-station">{nextStation.name}</p>
                    <p className="text-sm text-gray-600">Arriving in ~2 minutes</p>
                  </div>
                </div>
              )}

              {isLastStation && (
                <div className="flex items-center gap-3 pt-4 border-t border-gray-300">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-xl font-semibold text-green-600">Destination Reached!</p>
                    <p className="text-sm text-gray-600">Thank you for using Hyderabad Metro</p>
                  </div>
                </div>
              )}
            </div>

            {/* Station List */}
            <div className="max-h-64 overflow-y-auto">
              <p className="text-sm font-medium mb-3">All Stations on Route</p>
              <div className="space-y-2">
                {allStations.map((station, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-all ${
                      index === currentStationIndex
                        ? "bg-blue-100 border-2 border-blue-500"
                        : index < currentStationIndex
                        ? "bg-gray-100 opacity-60"
                        : "bg-white"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full ${
                        index === currentStationIndex ? "station-pulse" : ""
                      }`}
                      style={{ backgroundColor: getLineColor(station.line) }}
                    />
                    <span className={index <= currentStationIndex ? "font-medium" : "text-gray-600"}>
                      {station.name}
                    </span>
                    {index === currentStationIndex && (
                      <span className="ml-auto text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                        Current
                      </span>
                    )}
                    {index < currentStationIndex && (
                      <CheckCircle className="ml-auto w-4 h-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Cancel Button */}
            {!isLastStation && (
              <Button
                onClick={cancelJourney}
                variant="destructive"
                className="w-full"
                data-testid="cancel-journey-button"
              >
                Cancel Journey
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default JourneyTracker;
