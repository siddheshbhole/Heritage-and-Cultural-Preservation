from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import State, City, HeritageSite, Museum
from ..serializers import state_row, city_row, heritage_row, museum_row

router = APIRouter(prefix="/api", tags=["geo"])


@router.get("/states")
def list_states(db: Session = Depends(get_db)):
    states = db.query(State).order_by(State.name).all()
    rows = []
    for s in states:
        r = state_row(s)
        r["heritage_count"] = db.query(HeritageSite).filter(HeritageSite.state_id == s.id).count()
        rows.append(r)
    return rows


@router.get("/states/{state_id}")
def get_state(state_id: int, db: Session = Depends(get_db)):
    s = db.get(State, state_id)
    if not s:
        raise HTTPException(status_code=404, detail="State not found")
    data = state_row(s)
    cities = []
    for c in s.cities:
        cr = city_row(c)
        cr["heritage"] = [heritage_row(h) for h in c.heritage_sites]
        cr["museums"] = [museum_row(m) for m in db.query(Museum).filter(Museum.city_id == c.id).all()]
        cities.append(cr)
    data["cities"] = cities
    data["heritage_count"] = sum(len(c["heritage"]) for c in cities)
    data["festivals"] = (s.festivals or "").split("|") if s.festivals else []
    return data


@router.get("/states/{state_id}/cities")
def list_cities(state_id: int, db: Session = Depends(get_db)):
    cities = db.query(City).filter(City.state_id == state_id).order_by(City.name).all()
    return [city_row(c) for c in cities]


@router.get("/cities")
def list_all_cities(db: Session = Depends(get_db)):
    cities = db.query(City).order_by(City.name).all()
    return [city_row(c) for c in cities]


@router.get("/cities/{city_id}/heritage")
def city_heritage(city_id: int, db: Session = Depends(get_db)):
    sites = db.query(HeritageSite).filter(HeritageSite.city_id == city_id).all()
    return [heritage_row(h) for h in sites]


@router.get("/cities/{city_id}")
def get_city(city_id: int, db: Session = Depends(get_db)):
    c = db.get(City, city_id)
    if not c:
        raise HTTPException(status_code=404, detail="City not found")
    data = city_row(c)
    data["state_name"] = c.state.name if c.state else None
    data["heritage"] = [heritage_row(h) for h in c.heritage_sites]
    data["museums"] = [museum_row(m) for m in db.query(Museum).filter(Museum.city_id == city_id).all()]
    data["state_festivals"] = (c.state.festivals or "").split("|") if c.state and c.state.festivals else []
    return data