"""Tests for the Heritage Guide ↔ tour assignment workflow.

Calls the route handlers directly with the shared in-memory ``db`` fixture
from ``conftest.py`` (no HTTP client, no live database needed).
"""
import pytest
from fastapi import HTTPException

from app.models import GuideTour, HeritageGuide
from app.routes.guides import (
    GuideRegistrationIn,
    GuideStatusIn,
    GuideTourCreateIn,
    GuideTourManageIn,
    GuideUpdateMeIn,
    cancel_guide_tour,
    complete_guide_tour,
    create_guide_tour,
    get_active_tour,
    get_my_guide_dashboard,
    list_available_guides,
    register_guide,
    update_guide_status,
    update_my_guide,
)

GUIDE_USER = {"id": "guide-user-1", "email": "guide.a@example.com", "name": "Guide A"}
OTHER_USER = {"id": "guide-user-2", "email": "guide.b@example.com", "name": "Guide B"}
TOURIST_USER = {"id": "tourist-1", "email": "tourist@example.com", "name": "Tourist"}
ADMIN_USER = {"id": "admin-1", "email": "admin@example.com", "name": "Admin"}


def _register(db, user=GUIDE_USER, phone="9876500001", email=None, state="Maharashtra", location="Pune"):
    return register_guide(
        GuideRegistrationIn(
            full_name="Rahul Patil",
            phone=phone,
            email=email or user["email"],
            state=state,
            location=location,
        ),
        db,
        user,
    )


def _approve(db, guide_id, admin=ADMIN_USER):
    return update_guide_status(guide_id, GuideStatusIn(status="approved"), db, admin)


class TestRegistrationAndApproval:
    def test_new_registration_is_pending_and_hidden(self, db):
        row = _register(db)
        guide = db.get(HeritageGuide, row["id"])
        assert guide.status == "pending"
        assert guide.user_id == GUIDE_USER["id"]
        public = list_available_guides(state="Maharashtra", db=db)
        assert row["id"] not in {g["id"] for g in public}, "pending guides must never appear publicly"

    def test_approved_guide_appears_publicly(self, db):
        row = _register(db)
        _approve(db, row["id"])
        public = list_available_guides(state="Maharashtra", db=db)
        ids = [g["id"] for g in public]
        assert row["id"] in ids
        entry = next(g for g in public if g["id"] == row["id"])
        assert entry["availability"] == "free"
        assert "phone" not in entry and "email" not in entry, "public rows must not leak contact details"

    def test_guide_location_matching(self, db):
        mh = _register(db, phone="9876500111", state="Maharashtra", location="Pune, Maharashtra")
        _approve(db, mh["id"])
        tn = _register(db, user=OTHER_USER, phone="9876500222", state="Tamil Nadu", location="Chennai")
        _approve(db, tn["id"])
        maharashtra = list_available_guides(state="Maharashtra", location="Pune", db=db)
        tamil = list_available_guides(state="Tamil Nadu", db=db)
        mh_ids = {g["id"] for g in maharashtra}
        tn_ids = {g["id"] for g in tamil}
        assert mh["id"] in mh_ids and tn["id"] not in mh_ids
        assert tn["id"] in tn_ids and mh["id"] not in tn_ids


class TestTourAssignmentFlow:
    def _approved_guide(self, db):
        row = _register(db)
        _approve(db, row["id"])
        return row["id"]

    def test_tourist_selects_guide_tour_created_and_guide_occupied(self, db):
        guide_id = self._approved_guide(db)
        result = create_guide_tour(
            GuideTourCreateIn(guide_id=guide_id, heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        tour = result["tour"]
        assert tour["status"] == "active"
        assert tour["guide_id"] == guide_id
        assert tour["tourist_user_id"] == TOURIST_USER["id"]
        assert tour["heritage_site_id"] == 1
        assert result["guide"]["availability"] == "occupied"

    def test_occupied_guide_cannot_be_selected_again(self, db):
        guide_id = self._approved_guide(db)
        create_guide_tour(
            GuideTourCreateIn(guide_id=guide_id, heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        with pytest.raises(HTTPException) as exc:
            create_guide_tour(
                GuideTourCreateIn(guide_id=guide_id, heritage_site_id=2, site_name="Ajanta Caves"),
                db,
                OTHER_USER,
            )
        assert exc.value.status_code == 409

    def test_unapproved_guide_cannot_be_selected(self, db):
        row = _register(db)
        with pytest.raises(HTTPException) as exc:
            create_guide_tour(
                GuideTourCreateIn(guide_id=row["id"], heritage_site_id=1, site_name="Shaniwar Wada"),
                db,
                TOURIST_USER,
            )
        assert exc.value.status_code == 409

    def test_tourist_can_remove_guide_and_guide_becomes_free(self, db):
        guide_id = self._approved_guide(db)
        result = create_guide_tour(
            GuideTourCreateIn(guide_id=guide_id, heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        tour_id = result["tour"]["id"]
        token = result["tour"]["tour_token"]
        cancelled = cancel_guide_tour(tour_id, GuideTourManageIn(tour_token=token), db, TOURIST_USER)
        assert cancelled["tour"]["status"] == "cancelled"
        assert cancelled["guide"]["availability"] == "free"
        stored = db.get(GuideTour, tour_id)
        assert stored.status == "cancelled"

    def test_guide_can_be_selected_again_after_removal(self, db):
        guide_id = self._approved_guide(db)
        created = create_guide_tour(
            GuideTourCreateIn(guide_id=guide_id, heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        cancel_guide_tour(created["tour"]["id"], GuideTourManageIn(tour_token=created["tour"]["tour_token"]), db, TOURIST_USER)
        again = create_guide_tour(
            GuideTourCreateIn(guide_id=guide_id, heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        assert again["tour"]["status"] == "active"

    def test_other_user_cannot_manage_my_tour(self, db):
        guide_id = self._approved_guide(db)
        created = create_guide_tour(
            GuideTourCreateIn(guide_id=guide_id, heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        with pytest.raises(HTTPException) as exc:
            cancel_guide_tour(created["tour"]["id"], GuideTourManageIn(tour_token=None), db, OTHER_USER)
        assert exc.value.status_code == 403

    def test_active_tour_lookup_for_site(self, db):
        guide_id = self._approved_guide(db)
        created = create_guide_tour(
            GuideTourCreateIn(guide_id=guide_id, heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        found = get_active_tour(heritage_site_id=1, tour_token=created["tour"]["tour_token"], db=db, current_user=TOURIST_USER)
        assert found["tour"]["id"] == created["tour"]["id"]


class TestGuideDashboard:
    def _approved_guide(self, db):
        row = _register(db)
        _approve(db, row["id"])
        return row

    def test_dashboard_shows_real_tour_stats(self, db):
        row = self._approved_guide(db)
        first = create_guide_tour(
            GuideTourCreateIn(guide_id=row["id"], heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        complete_guide_tour(
            first["tour"]["id"], GuideTourManageIn(tour_token=first["tour"]["tour_token"]), db,
            TOURIST_USER,
        )
        second = create_guide_tour(
            GuideTourCreateIn(guide_id=row["id"], heritage_site_id=2, site_name="Ajanta Caves"),
            db,
            {"id": "tourist-2", "email": "t2@example.com", "name": "Tourist 2"},
        )
        dash = get_my_guide_dashboard(db, GUIDE_USER)
        assert dash["tours_completed"] == 1
        assert dash["tours_total"] == 2
        assert dash["active_tours_count"] == 1
        assert dash["current_tour"]["site_name"] == "Ajanta Caves"
        assert dash["guide"]["id"] == row["id"]

    def test_dashboard_blocks_other_guide_account(self, db):
        _register(db, user=GUIDE_USER, phone="9876531111")
        _register(db, user=OTHER_USER, phone="9876532222")
        dash = get_my_guide_dashboard(db, OTHER_USER)
        assert dash["guide"]["user_id"] == OTHER_USER["id"]
        # Guide A cannot see Guide B's tours (tours are scoped by guide_id only).
        assert all(t["guide_id"] == dash["guide"]["id"] for t in dash["upcoming_tours"])

    def test_no_fake_statistics(self, db):
        row = _register(db)
        dash = get_my_guide_dashboard(db, GUIDE_USER)
        assert dash["tours_completed"] == 0
        assert dash["tours_total"] == 0
        assert dash["current_tour"] is None
        assert dash["upcoming_tours"] == []


class TestAvailabilityOwnership:
    def _approved_guide(self, db):
        row = _register(db)
        _approve(db, row["id"])
        return row["id"]

    def test_cannot_free_guide_with_active_tour(self, db):
        guide_id = self._approved_guide(db)
        create_guide_tour(
            GuideTourCreateIn(guide_id=guide_id, heritage_site_id=1, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        with pytest.raises(HTTPException) as exc:
            update_my_guide(GuideUpdateMeIn(availability="free"), db, GUIDE_USER)
        assert exc.value.status_code == 409

    def test_guide_cannot_update_another_guides_availability(self, db):
        self._approved_guide(db)  # Guide A approved
        with pytest.raises(HTTPException) as exc:
            update_my_guide(GuideUpdateMeIn(availability="occupied"), db, OTHER_USER)
        assert exc.value.status_code == 404  # Guide B owns no registration yet-ish; other guide's is unowned
        # Give Guide B their own registration and assert they can never touch A's record.
        row_b = register_guide(
            GuideRegistrationIn(full_name="Guide B", phone="9876599001", email="guide.b@example.com",
                                state="Tamil Nadu", location="Chennai"),
            db,
            OTHER_USER,
        )
        update_my_guide(GuideUpdateMeIn(availability="occupied"), db, OTHER_USER)
        assert db.get(HeritageGuide, row_b["id"]).availability == "occupied"
        guide_a = (
            db.query(HeritageGuide)
            .filter(HeritageGuide.user_id == GUIDE_USER["id"])
            .first()
        )
        assert guide_a.availability == "free", "Guide A's availability must never be changed by Guide B"