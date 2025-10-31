from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timezone
import math

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class Station(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str
    name: str
    line: str  # "red", "blue", "green"
    order: int
    lat: float
    lng: float
    is_interchange: bool = False
    interchange_lines: List[str] = []

class RouteSegment(BaseModel):
    from_station: str
    to_station: str
    line: str
    stations: List[str]
    duration_minutes: int

class OptimalRoute(BaseModel):
    source: str
    destination: str
    segments: List[RouteSegment]
    total_duration_minutes: int
    total_stations: int
    transfers: int

class FavoriteRoute(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"  # Can be extended for multi-user
    source: str
    destination: str
    route: Dict
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class JourneyHistory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    source: str
    destination: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    duration_minutes: Optional[int] = None

class ActiveJourney(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "default_user"
    route: Dict
    current_station_index: int = 0
    started_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    status: str = "active"  # active, completed, cancelled


# Station data for Hyderabad Metro
STATIONS_DATA = [
    # Red Line (Miyapur to LB Nagar)
    {"id": "miyapur", "name": "Miyapur", "line": "red", "order": 1, "lat": 17.4949, "lng": 78.3623, "is_interchange": False},
    {"id": "jntu", "name": "JNTU College", "line": "red", "order": 2, "lat": 17.4906, "lng": 78.3897, "is_interchange": False},
    {"id": "kphb", "name": "KPHB Colony", "line": "red", "order": 3, "lat": 17.4854, "lng": 78.3989, "is_interchange": False},
    {"id": "kukatpally", "name": "Kukatpally", "line": "red", "order": 4, "lat": 17.4849, "lng": 78.4136, "is_interchange": False},
    {"id": "balanagar", "name": "Balanagar", "line": "red", "order": 5, "lat": 17.4789, "lng": 78.4284, "is_interchange": False},
    {"id": "moosapet", "name": "Moosapet", "line": "red", "order": 6, "lat": 17.4744, "lng": 78.4425, "is_interchange": False},
    {"id": "bharatnagar", "name": "Bharat Nagar", "line": "red", "order": 7, "lat": 17.4659, "lng": 78.4498, "is_interchange": False},
    {"id": "erragadda", "name": "Erragadda", "line": "red", "order": 8, "lat": 17.4579, "lng": 78.4482, "is_interchange": False},
    {"id": "esi", "name": "ESI Hospital", "line": "red", "order": 9, "lat": 17.4506, "lng": 78.4524, "is_interchange": False},
    {"id": "srnagar", "name": "S.R. Nagar", "line": "red", "order": 10, "lat": 17.4432, "lng": 78.4541, "is_interchange": False},
    {"id": "ameerpet", "name": "Ameerpet", "line": "red", "order": 11, "lat": 17.4359, "lng": 78.4482, "is_interchange": True, "interchange_lines": ["blue"]},
    {"id": "punjagutta", "name": "Punjagutta", "line": "red", "order": 12, "lat": 17.4282, "lng": 78.4514, "is_interchange": False},
    {"id": "irrummanzil", "name": "Irrum Manzil", "line": "red", "order": 13, "lat": 17.4224, "lng": 78.4560, "is_interchange": False},
    {"id": "khairtabad", "name": "Khairtabad", "line": "red", "order": 14, "lat": 17.4163, "lng": 78.4631, "is_interchange": False},
    {"id": "lakdikapul", "name": "Lakdi-ka-Pul", "line": "red", "order": 15, "lat": 17.4070, "lng": 78.4658, "is_interchange": False},
    {"id": "assembly", "name": "Assembly", "line": "red", "order": 16, "lat": 17.4004, "lng": 78.4707, "is_interchange": False},
    {"id": "nampally", "name": "Nampally", "line": "red", "order": 17, "lat": 17.3951, "lng": 78.4758, "is_interchange": False},
    {"id": "gandhibhavan", "name": "Gandhi Bhavan", "line": "red", "order": 18, "lat": 17.3891, "lng": 78.4811, "is_interchange": False},
    {"id": "osmaniamc", "name": "Osmania Medical College", "line": "red", "order": 19, "lat": 17.3829, "lng": 78.4866, "is_interchange": False},
    {"id": "mgbs", "name": "M.G. Bus Station", "line": "red", "order": 20, "lat": 17.3763, "lng": 78.4878, "is_interchange": True, "interchange_lines": ["green"]},
    {"id": "malakpet", "name": "Malakpet", "line": "red", "order": 21, "lat": 17.3695, "lng": 78.4951, "is_interchange": False},
    {"id": "newmarket", "name": "New Market", "line": "red", "order": 22, "lat": 17.3619, "lng": 78.5056, "is_interchange": False},
    {"id": "musarambagh", "name": "Musarambagh", "line": "red", "order": 23, "lat": 17.3541, "lng": 78.5184, "is_interchange": False},
    {"id": "dilsukhnagar", "name": "Dilsukhnagar", "line": "red", "order": 24, "lat": 17.3466, "lng": 78.5248, "is_interchange": False},
    {"id": "chaitanyapuri", "name": "Chaitanya Puri", "line": "red", "order": 25, "lat": 17.3386, "lng": 78.5312, "is_interchange": False},
    {"id": "victoriamemorial", "name": "Victoria Memorial", "line": "red", "order": 26, "lat": 17.3317, "lng": 78.5387, "is_interchange": False},
    {"id": "lbnagar", "name": "LB Nagar", "line": "red", "order": 27, "lat": 17.3246, "lng": 78.5520, "is_interchange": False},
    
    # Blue Line (Nagole to Raidurg)
    {"id": "nagole", "name": "Nagole", "line": "blue", "order": 1, "lat": 17.3627, "lng": 78.5620, "is_interchange": False},
    {"id": "uppal", "name": "Uppal", "line": "blue", "order": 2, "lat": 17.3988, "lng": 78.5585, "is_interchange": False},
    {"id": "stadium", "name": "Stadium", "line": "blue", "order": 3, "lat": 17.4087, "lng": 78.5535, "is_interchange": False},
    {"id": "ngri", "name": "NGRI", "line": "blue", "order": 4, "lat": 17.4198, "lng": 78.5483, "is_interchange": False},
    {"id": "habsiguda", "name": "Habsiguda", "line": "blue", "order": 5, "lat": 17.4289, "lng": 78.5420, "is_interchange": False},
    {"id": "tarnaka", "name": "Tarnaka", "line": "blue", "order": 6, "lat": 17.4374, "lng": 78.5347, "is_interchange": False},
    {"id": "mettuguda", "name": "Mettuguda", "line": "blue", "order": 7, "lat": 17.4452, "lng": 78.5270, "is_interchange": False},
    {"id": "secunderabadeast", "name": "Secunderabad East", "line": "blue", "order": 8, "lat": 17.4547, "lng": 78.5139, "is_interchange": False},
    {"id": "paradeground", "name": "Parade Ground", "line": "blue", "order": 9, "lat": 17.4628, "lng": 78.5006, "is_interchange": True, "interchange_lines": ["green"]},
    {"id": "paradise", "name": "Paradise", "line": "blue", "order": 10, "lat": 17.4617, "lng": 78.4887, "is_interchange": False},
    {"id": "rasoolpura", "name": "Rasoolpura", "line": "blue", "order": 11, "lat": 17.4574, "lng": 78.4778, "is_interchange": False},
    {"id": "prakashnagar", "name": "Prakash Nagar", "line": "blue", "order": 12, "lat": 17.4530, "lng": 78.4662, "is_interchange": False},
    {"id": "begumpet", "name": "Begumpet", "line": "blue", "order": 13, "lat": 17.4475, "lng": 78.4571, "is_interchange": False},
    {"id": "ameerpet_blue", "name": "Ameerpet", "line": "blue", "order": 14, "lat": 17.4359, "lng": 78.4482, "is_interchange": True, "interchange_lines": ["red"]},
    {"id": "madhuranagar", "name": "Madhura Nagar", "line": "blue", "order": 15, "lat": 17.4279, "lng": 78.4397, "is_interchange": False},
    {"id": "yousufguda", "name": "Yousufguda", "line": "blue", "order": 16, "lat": 17.4210, "lng": 78.4315, "is_interchange": False},
    {"id": "jubileehillsrd5", "name": "Jubilee Hills Road No. 5", "line": "blue", "order": 17, "lat": 17.4129, "lng": 78.4229, "is_interchange": False},
    {"id": "jubileehillscp", "name": "Jubilee Hills Check Post", "line": "blue", "order": 18, "lat": 17.4058, "lng": 78.4148, "is_interchange": False},
    {"id": "peddammatemple", "name": "Peddamma Temple", "line": "blue", "order": 19, "lat": 17.4379, "lng": 78.3980, "is_interchange": False},
    {"id": "madhapur", "name": "Madhapur", "line": "blue", "order": 20, "lat": 17.4469, "lng": 78.3908, "is_interchange": False},
    {"id": "durgamcheruvu", "name": "Durgam Cheruvu", "line": "blue", "order": 21, "lat": 17.4510, "lng": 78.3824, "is_interchange": False},
    {"id": "hiteccity", "name": "HITEC City", "line": "blue", "order": 22, "lat": 17.4551, "lng": 78.3734, "is_interchange": False},
    {"id": "raidurg", "name": "Raidurg", "line": "blue", "order": 23, "lat": 17.4623, "lng": 78.3615, "is_interchange": False},
    
    # Green Line (Parade Ground to MGBS)
    {"id": "paradeground_green", "name": "Parade Ground", "line": "green", "order": 1, "lat": 17.4628, "lng": 78.5006, "is_interchange": True, "interchange_lines": ["blue"]},
    {"id": "secunderabadwest", "name": "Secunderabad West", "line": "green", "order": 2, "lat": 17.4582, "lng": 78.4963, "is_interchange": False},
    {"id": "gandihospital", "name": "Gandhi Hospital", "line": "green", "order": 3, "lat": 17.4497, "lng": 78.4921, "is_interchange": False},
    {"id": "musheerabad", "name": "Musheerabad", "line": "green", "order": 4, "lat": 17.4372, "lng": 78.4894, "is_interchange": False},
    {"id": "rtccrossroads", "name": "RTC Cross Roads", "line": "green", "order": 5, "lat": 17.4253, "lng": 78.4863, "is_interchange": False},
    {"id": "chikkadpally", "name": "Chikkadpally", "line": "green", "order": 6, "lat": 17.4129, "lng": 78.4839, "is_interchange": False},
    {"id": "narayanguda", "name": "Narayanguda", "line": "green", "order": 7, "lat": 17.3994, "lng": 78.4819, "is_interchange": False},
    {"id": "sultanbazar", "name": "Sultan Bazaar", "line": "green", "order": 8, "lat": 17.3856, "lng": 78.4843, "is_interchange": False},
    {"id": "mgbs_green", "name": "M.G. Bus Station", "line": "green", "order": 9, "lat": 17.3763, "lng": 78.4878, "is_interchange": True, "interchange_lines": ["red"]},
]


def calculate_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calculate distance between two points using Haversine formula (in km)"""
    R = 6371  # Earth radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    
    a = math.sin(dlat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def find_optimal_route(source_id: str, dest_id: str) -> OptimalRoute:
    """Find optimal route between two stations"""
    stations_dict = {s["id"]: s for s in STATIONS_DATA}
    
    if source_id not in stations_dict or dest_id not in stations_dict:
        raise ValueError("Invalid station ID")
    
    source = stations_dict[source_id]
    dest = stations_dict[dest_id]
    
    # If same line, direct route
    if source["line"] == dest["line"]:
        line_stations = [s for s in STATIONS_DATA if s["line"] == source["line"]]
        line_stations.sort(key=lambda x: x["order"])
        
        source_order = source["order"]
        dest_order = dest["order"]
        
        if source_order < dest_order:
            route_stations = [s for s in line_stations if source_order <= s["order"] <= dest_order]
        else:
            route_stations = [s for s in line_stations if dest_order <= s["order"] <= source_order]
            route_stations.reverse()
        
        num_stations = len(route_stations)
        duration = num_stations * 2  # 2 minutes per station
        
        segment = RouteSegment(
            from_station=source["name"],
            to_station=dest["name"],
            line=source["line"],
            stations=[s["name"] for s in route_stations],
            duration_minutes=duration
        )
        
        return OptimalRoute(
            source=source["name"],
            destination=dest["name"],
            segments=[segment],
            total_duration_minutes=duration,
            total_stations=num_stations,
            transfers=0
        )
    
    # Different lines - need interchange
    # Find interchange station
    interchange_station = None
    
    # Check if source or dest is interchange
    if source.get("is_interchange") and dest["line"] in source.get("interchange_lines", []):
        interchange_station = source
    elif dest.get("is_interchange") and source["line"] in dest.get("interchange_lines", []):
        interchange_station = dest
    else:
        # Find common interchange
        for station in STATIONS_DATA:
            if station.get("is_interchange"):
                if source["line"] in [station["line"]] + station.get("interchange_lines", []) and \
                   dest["line"] in [station["line"]] + station.get("interchange_lines", []):
                    interchange_station = station
                    break
    
    if not interchange_station:
        # Complex route - use Ameerpet as default interchange
        interchange_station = stations_dict.get("ameerpet") or stations_dict.get("ameerpet_blue")
    
    segments = []
    total_duration = 0
    all_stations = []
    
    # Segment 1: Source to Interchange
    if source["id"] != interchange_station["id"]:
        segment1_stations = get_stations_between(source, interchange_station, source["line"])
        duration1 = len(segment1_stations) * 2
        segments.append(RouteSegment(
            from_station=source["name"],
            to_station=interchange_station["name"],
            line=source["line"],
            stations=[s["name"] for s in segment1_stations],
            duration_minutes=duration1
        ))
        total_duration += duration1
        all_stations.extend(segment1_stations)
    
    # Add transfer time
    if len(segments) > 0:
        total_duration += 3  # 3 minutes transfer time
    
    # Segment 2: Interchange to Destination
    if interchange_station["id"] != dest["id"]:
        segment2_stations = get_stations_between(interchange_station, dest, dest["line"])
        duration2 = len(segment2_stations) * 2
        segments.append(RouteSegment(
            from_station=interchange_station["name"],
            to_station=dest["name"],
            line=dest["line"],
            stations=[s["name"] for s in segment2_stations],
            duration_minutes=duration2
        ))
        total_duration += duration2
        all_stations.extend(segment2_stations[1:])  # Skip interchange duplicate
    
    return OptimalRoute(
        source=source["name"],
        destination=dest["name"],
        segments=segments,
        total_duration_minutes=total_duration,
        total_stations=len(all_stations),
        transfers=len(segments) - 1
    )


def get_stations_between(start_station: dict, end_station: dict, line: str) -> List[dict]:
    """Get all stations between start and end on a specific line"""
    line_stations = [s for s in STATIONS_DATA if s["line"] == line]
    line_stations.sort(key=lambda x: x["order"])
    
    # Handle interchange stations that might have different IDs
    start_order = start_station["order"] if start_station["line"] == line else \
                  next((s["order"] for s in line_stations if s["name"] == start_station["name"]), start_station["order"])
    end_order = end_station["order"] if end_station["line"] == line else \
                next((s["order"] for s in line_stations if s["name"] == end_station["name"]), end_station["order"])
    
    if start_order < end_order:
        return [s for s in line_stations if start_order <= s["order"] <= end_order]
    else:
        result = [s for s in line_stations if end_order <= s["order"] <= start_order]
        result.reverse()
        return result


# API Routes
@api_router.get("/")
async def root():
    return {"message": "Hyderabad Metro Tracker API"}


@api_router.get("/stations", response_model=List[Station])
async def get_stations():
    """Get all metro stations"""
    return [Station(**station) for station in STATIONS_DATA]


@api_router.get("/route/{source_id}/{dest_id}", response_model=OptimalRoute)
async def get_route(source_id: str, dest_id: str):
    """Get optimal route between two stations"""
    try:
        route = find_optimal_route(source_id, dest_id)
        return route
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@api_router.post("/favorites")
async def add_favorite(source: str, destination: str):
    """Add a route to favorites"""
    try:
        # Find station IDs
        source_station = next((s for s in STATIONS_DATA if s["name"].lower() == source.lower()), None)
        dest_station = next((s for s in STATIONS_DATA if s["name"].lower() == destination.lower()), None)
        
        if not source_station or not dest_station:
            raise HTTPException(status_code=400, detail="Invalid station names")
        
        route = find_optimal_route(source_station["id"], dest_station["id"])
        
        favorite = FavoriteRoute(
            source=source,
            destination=destination,
            route=route.model_dump()
        )
        
        doc = favorite.model_dump()
        doc['created_at'] = doc['created_at'].isoformat()
        
        await db.favorite_routes.insert_one(doc)
        return {"success": True, "message": "Route added to favorites", "id": favorite.id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/favorites")
async def get_favorites():
    """Get all favorite routes"""
    favorites = await db.favorite_routes.find({"user_id": "default_user"}, {"_id": 0}).to_list(100)
    return favorites


@api_router.delete("/favorites/{favorite_id}")
async def delete_favorite(favorite_id: str):
    """Delete a favorite route"""
    result = await db.favorite_routes.delete_one({"id": favorite_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favorite not found")
    return {"success": True, "message": "Favorite deleted"}


@api_router.post("/journey/start")
async def start_journey(source: str, destination: str):
    """Start a new journey"""
    try:
        # Check if there's already an active journey
        existing = await db.active_journeys.find_one({"user_id": "default_user", "status": "active"})
        if existing:
            raise HTTPException(status_code=400, detail="Active journey already exists")
        
        source_station = next((s for s in STATIONS_DATA if s["name"].lower() == source.lower()), None)
        dest_station = next((s for s in STATIONS_DATA if s["name"].lower() == destination.lower()), None)
        
        if not source_station or not dest_station:
            raise HTTPException(status_code=400, detail="Invalid station names")
        
        route = find_optimal_route(source_station["id"], dest_station["id"])
        
        journey = ActiveJourney(
            route=route.model_dump(),
            current_station_index=0
        )
        
        doc = journey.model_dump()
        doc['started_at'] = doc['started_at'].isoformat()
        
        await db.active_journeys.insert_one(doc)
        
        # Add to history
        history = JourneyHistory(
            source=source,
            destination=destination,
            started_at=datetime.now(timezone.utc)
        )
        history_doc = history.model_dump()
        history_doc['started_at'] = history_doc['started_at'].isoformat()
        await db.journey_history.insert_one(history_doc)
        
        return {"success": True, "journey_id": journey.id, "route": route}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/journey/active")
async def get_active_journey():
    """Get current active journey"""
    journey = await db.active_journeys.find_one({"user_id": "default_user", "status": "active"}, {"_id": 0})
    if not journey:
        return {"active": False}
    return {"active": True, "journey": journey}


@api_router.put("/journey/update/{journey_id}")
async def update_journey(journey_id: str, current_station_index: int):
    """Update journey progress"""
    result = await db.active_journeys.update_one(
        {"id": journey_id},
        {"$set": {"current_station_index": current_station_index}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Journey not found")
    return {"success": True}


@api_router.post("/journey/complete/{journey_id}")
async def complete_journey(journey_id: str):
    """Mark journey as completed"""
    journey = await db.active_journeys.find_one({"id": journey_id})
    if not journey:
        raise HTTPException(status_code=404, detail="Journey not found")
    
    # Mark journey as completed in active journeys
    await db.active_journeys.update_one(
        {"id": journey_id},
        {"$set": {"status": "completed"}}
    )
    
    # Handle potential missing or invalid started_at
    try:
        if isinstance(journey.get('started_at'), str):
            started_at = datetime.fromisoformat(journey['started_at'])
        else:
            started_at = journey.get('started_at')
    except Exception:
        started_at = None

    completed_at = datetime.now(timezone.utc)

    # Calculate duration if possible
    duration = None
    if started_at:
        try:
            duration = int((completed_at - started_at).total_seconds() / 60)
        except Exception:
            duration = None

    # Update or insert journey history
    update_result = await db.journey_history.update_one(
        {
            "source": journey['route']['source'],
            "destination": journey['route']['destination'],
            "completed_at": None
        },
        {
            "$set": {
                "completed_at": completed_at.isoformat(),
                "duration_minutes": duration
            }
        }
    )

    # If no history record was found, insert one
    if update_result.matched_count == 0:
        await db.journey_history.insert_one({
            "user_id": journey.get("user_id", "default_user"),
            "route": journey.get("route"),
            "source": journey['route']['source'],
            "destination": journey['route']['destination'],
            "started_at": started_at.isoformat() if started_at else None,
            "completed_at": completed_at.isoformat(),
            "duration_minutes": duration,
            "status": "completed"
        })

    return {
        "success": True,
        "message": "Journey completed",
        "duration_minutes": duration if duration is not None else "N/A"
    }


@api_router.get("/history")
async def get_history():
    """Get journey history"""
    history = (
        await db.journey_history.find(
            {"user_id": "default_user"},
            {"_id": 0}
        )
        .sort("started_at", -1)
        .to_list(50)
    )
    return history


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
