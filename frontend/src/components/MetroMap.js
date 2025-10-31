import { useEffect, useState } from "react";

const MetroMap = ({ route, currentStationIndex, allStations }) => {
  const [trainPosition, setTrainPosition] = useState({ x: 0, y: 0 });

  const getLineColor = (line) => {
    const colors = {
      red: "#E63946",
      blue: "#457B9D",
      green: "#2A9D8F"
    };
    return colors[line] || "#6c757d";
  };

  // Simplified metro map visualization
  const renderRoute = () => {
    if (!allStations || allStations.length === 0) return null;

    const stationWidth = 800 / allStations.length;
    
    return (
      <div className="relative w-full h-64 bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg p-8 overflow-x-auto">
        <svg width="100%" height="100%" viewBox="0 0 800 200" className="min-w-full">
          {/* Draw route line */}
          {allStations.map((station, index) => {
            if (index === allStations.length - 1) return null;
            const x1 = index * stationWidth + 50;
            const x2 = (index + 1) * stationWidth + 50;
            const nextStation = allStations[index + 1];
            
            // Check if there's a line change
            const isLineChange = station.line !== nextStation.line;
            
            return (
              <g key={`line-${index}`}>
                <line
                  x1={x1}
                  y1={100}
                  x2={x2}
                  y2={100}
                  stroke={getLineColor(station.line)}
                  strokeWidth="6"
                  opacity={index <= currentStationIndex ? 1 : 0.3}
                />
                {isLineChange && (
                  <circle
                    cx={x2}
                    cy={100}
                    r="12"
                    fill="white"
                    stroke={getLineColor(nextStation.line)}
                    strokeWidth="4"
                  />
                )}
              </g>
            );
          })}

          {/* Draw stations */}
          {allStations.map((station, index) => {
            const x = index * stationWidth + 50;
            const isCurrent = index === currentStationIndex;
            const isPast = index < currentStationIndex;
            
            return (
              <g key={`station-${index}`}>
                {/* Station circle */}
                <circle
                  cx={x}
                  cy={100}
                  r={isCurrent ? "12" : "8"}
                  fill={isPast || isCurrent ? getLineColor(station.line) : "white"}
                  stroke={getLineColor(station.line)}
                  strokeWidth="3"
                  className={isCurrent ? "station-pulse" : ""}
                />
                
                {/* Station name */}
                <text
                  x={x}
                  y={index % 2 === 0 ? 140 : 70}
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight={isCurrent ? "bold" : "normal"}
                  fill={isCurrent ? getLineColor(station.line) : "#4b5563"}
                >
                  {station.name.length > 15 ? station.name.substring(0, 12) + "..." : station.name}
                </text>
              </g>
            );
          })}

          {/* Train icon */}
          {currentStationIndex < allStations.length && (
            <g transform={`translate(${currentStationIndex * stationWidth + 50}, 100)`}>
              <rect
                x="-15"
                y="-10"
                width="30"
                height="20"
                rx="4"
                fill="#1e40af"
                stroke="white"
                strokeWidth="2"
              />
              <circle cx="-8" cy="12" r="3" fill="#374151" />
              <circle cx="8" cy="12" r="3" fill="#374151" />
              <rect x="-12" y="-6" width="8" height="6" fill="#60a5fa" rx="1" />
              <rect x="4" y="-6" width="8" height="6" fill="#60a5fa" rx="1" />
            </g>
          )}
        </svg>

        {/* Legend */}
        <div className="flex gap-4 mt-4 justify-center flex-wrap">
          {[...new Set(allStations.map(s => s.line))].map(line => (
            <div key={line} className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: getLineColor(line) }}
              />
              <span className="text-sm capitalize font-medium">{line} Line</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return renderRoute();
};

export default MetroMap;
