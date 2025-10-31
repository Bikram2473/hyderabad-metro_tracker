import { useState, useEffect } from "react";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { History, MapPin, Clock, Calendar } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/history`);
      setHistory(response.data);
    } catch (error) {
      console.error("Error fetching history:", error);
      toast.error("Failed to load history");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-20">
        <p className="text-lg text-gray-600">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 pt-24 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <History className="w-10 h-10 text-blue-600" />
            <h1 className="text-3xl sm:text-4xl font-bold">Journey History</h1>
          </div>
          <p className="text-gray-600">Track all your previous metro journeys</p>
        </div>

        {history.length === 0 ? (
          <Card className="glass">
            <CardContent className="p-12 text-center">
              <History className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-lg text-gray-600 mb-2">No journey history yet</p>
              <p className="text-sm text-gray-500">
                Your completed journeys will appear here
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {history.map((journey, index) => (
              <Card key={journey.id || index} className="glass hover:shadow-lg transition-all" data-testid="history-item">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <MapPin className="w-5 h-5 text-blue-600" />
                    {journey.source} → {journey.destination}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Started</p>
                        <p className="text-sm font-medium" data-testid="journey-start-time">{formatDate(journey.started_at)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Completed</p>
                        <p className="text-sm font-medium" data-testid="journey-end-time">
                          {journey.completed_at ? formatDate(journey.completed_at) : "In Progress"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="text-xs text-gray-500">Duration</p>
                        <p className="text-sm font-medium" data-testid="journey-duration">
                          {journey.duration_minutes ? `${journey.duration_minutes} min` : "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {journey.completed_at ? (
                    <div className="mt-4 inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Completed
                    </div>
                  ) : (
                    <div className="mt-4 inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                      In Progress
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
