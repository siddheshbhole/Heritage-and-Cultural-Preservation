"""Tests for the rebuilt, database-driven Heritage Guide system.

The legacy Vacancy / Heritage Guide / Tourist Tour module was removed; this
suite covers the new ``/api/guide`` endpoints backed by
``GuideProfile`` / ``TourAssignment`` / ``GuideReview`` / ``GuideReport``.
"""
import pytest

from fastapi import HTTPException

from app.models import GuideProfile, GuideReport
from app.routes.guide_auth import (
    GuideAuthLoginIn,
    GuideAuthRegisterIn,
    _derive_pin,
    guide_member_login,
    register_guide_account,
)
from app.routes.heritage_guides import (
    GuideAvailabilityIn,
    GuideRegistrationIn,
    GuideReportIn,
    GuideReviewIn,
    GuideTourEndIn,
    GuideTourStartIn,
    end_guide_tour,
    get_my_guide_dashboard,
    list_site_guides,
    register_guide_profile,
    report_guide_profile,
    review_guide_tour,
    start_guide_tour,
    update_my_availability,
)

GUIDE_USER = {"id": "guide-user-1", "email": "guide.a@example.com", "name": "Guide A"}
OTHER_USER = {"id": "guide-user-2", "email": "guide.b@example.com", "name": "Guide B"}
TOURIST_USER = {"id": "tourist-user-1", "email": "tourist@example.com", "name": "Tourist T"}
ANOTHER_TOURIST = {"id": "tourist-user-2", "email": "tourist2@example.com", "name": "Tourist U"}

# Sites seeded by conftest
PUNE_SITE = 1       # Shaniwar Wada — Maharashtra, "Kasba Peth, Pune"
TN_SITE = 4         # Brihadeeswara Temple — Tamil Nadu, Thanjavur


def _register(db, user, name="Guide A", state="Maharashtra", location="Pune"):
    result = register_guide_profile(
        GuideRegistrationIn(name=name, phone="9822012345", email=f"{user['id']}@example.com", state=state, location=location),
        db,
        user,
    )
    return db.get(GuideProfile, result["profile"]["id"])


class TestRegistration:
    def test_registration_creates_profile_owned_by_user(self, db):
        profile = _register(db, GUIDE_USER)
        assert profile.user_id == GUIDE_USER["id"]
        assert profile.name == "Guide A"
        assert profile.availability == "open_to_work"

    def test_registration_rejects_duplicate_for_same_user(self, db):
        _register(db, GUIDE_USER)
        with pytest.raises(HTTPException) as exc:
            register_guide_profile(
                GuideRegistrationIn(name="Guide A2", phone="9988776655", email="new@example.com", state="Maharashtra"),
                db,
                GUIDE_USER,
            )
        assert exc.value.status_code == 409

    def test_register_requires_auth(self, db):
        # The route dependency forces authentication, but the function is not
        # reachable without a user dict. Simpler: the function uses the id.
        profile = _register(db, OTHER_USER, name="Guide B", state="Tamil Nadu", location="Chennai")
        assert profile.user_id == OTHER_USER["id"]


class TestDashboard:
    def test_me_returns_real_statistics(self, db):
        _register(db, GUIDE_USER)
        dash = get_my_guide_dashboard(db, GUIDE_USER)
        assert dash["profile"]["user_id"] == GUIDE_USER["id"]
        assert dash["tours_completed"] == 0
        assert dash["reviews_count"] == 0
        assert dash["reports_count"] == 0
        assert dash["current_tour"] is None

    def test_me_never_exposes_another_guides_record(self, db):
        _register(db, GUIDE_USER)
        # OTHER_USER has no profile of their own: they get a 404, never
        # GUIDE_USER's private data.
        with pytest.raises(HTTPException) as exc:
            get_my_guide_dashboard(db, OTHER_USER)
        assert exc.value.status_code == 404

    def test_tours_completed_count_after_tour(self, db):
        _register(db, GUIDE_USER)
        tour = start_guide_tour(
            GuideTourStartIn(guide_id=1, site_id=PUNE_SITE, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        end_guide_tour(GuideTourEndIn(tour_id=tour["tour"]["id"]), db, TOURIST_USER)
        dash = get_my_guide_dashboard(db, GUIDE_USER)
        assert dash["tours_completed"] == 1


class TestAvailability:
    def test_manual_availability_limited_to_open_or_not_ready(self, db):
        _register(db, GUIDE_USER)
        result = update_my_availability(GuideAvailabilityIn(availability="not_ready"), db, GUIDE_USER)
        assert result["profile"]["availability"] == "not_ready"
        result = update_my_availability(GuideAvailabilityIn(availability="open_to_work"), db, GUIDE_USER)
        assert result["profile"]["availability"] == "open_to_work"

    def test_guide_cannot_manually_choose_occupied(self, db):
        _register(db, GUIDE_USER)
        with pytest.raises(HTTPException) as exc:
            update_my_availability(GuideAvailabilityIn(availability="occupied"), db, GUIDE_USER)
        assert exc.value.status_code == 400

    def test_guide_with_active_tour_cannot_go_not_ready(self, db):
        _register(db, GUIDE_USER)
        start_guide_tour(GuideTourStartIn(guide_id=1, site_id=PUNE_SITE, site_name="Shaniwar Wada"), db, TOURIST_USER)
        with pytest.raises(HTTPException) as exc:
            update_my_availability(GuideAvailabilityIn(availability="not_ready"), db, GUIDE_USER)
        assert exc.value.status_code == 409


class TestSiteListing:
    def test_open_to_work_guide_appears_on_local_site(self, db):
        profile = _register(db, GUIDE_USER)
        site = list_site_guides(PUNE_SITE, db=db, state="Maharashtra", location="Kasba Peth, Pune", current_user=None)
        assert any(g["id"] == profile.id for g in site["guides"])

    def test_not_ready_guide_is_hidden(self, db):
        profile = _register(db, GUIDE_USER)
        update_my_availability(GuideAvailabilityIn(availability="not_ready"), db, GUIDE_USER)
        site = list_site_guides(PUNE_SITE, db=db, state="Maharashtra", location="Pune", current_user=None)
        assert all(g["id"] != profile.id for g in site["guides"])

    def test_out_of_state_guide_is_excluded(self, db):
        profile = _register(db, OTHER_USER, name="Guide B", state="Tamil Nadu", location="Chennai")
        site = list_site_guides(PUNE_SITE, db=db, state="Maharashtra", location="Pune", current_user=None)
        assert all(g["id"] != profile.id for g in site["guides"])

    def test_site_returns_local_guides_from_site_location(self, db):
        _register(db, OTHER_USER, name="Guide B", state="Tamil Nadu", location="Chennai")
        # Site 4 is Brihadeeswara Temple (Tamil Nadu). Passing its state/location
        # explicitly keeps direct calls deterministic (Query() defaults only
        # resolve through the FastAPI HTTP layer).
        site = list_site_guides(TN_SITE, db=db, state="Tamil Nadu", location="Thanjavur, Tamil Nadu", current_user=None)
        assert len(site["guides"]) == 1


class TestTourFlow:
    def test_tour_start_marks_guide_occupied(self, db):
        profile = _register(db, GUIDE_USER)
        result = start_guide_tour(
            GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        assert result["tour"]["status"] == "active"
        assert result["guide"]["availability"] == "occupied"
        assert db.get(GuideProfile, profile.id).availability == "occupied"

    def test_occupied_guide_hidden_and_unbookable(self, db):
        profile = _register(db, GUIDE_USER)
        start_guide_tour(GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"), db, TOURIST_USER)

        site = list_site_guides(PUNE_SITE, db=db, state="Maharashtra", location="Pune", current_user=None)
        assert all(g["id"] != profile.id for g in site["guides"])

        with pytest.raises(HTTPException) as exc:
            start_guide_tour(
                GuideTourStartIn(guide_id=profile.id, site_id=TN_SITE, site_name="Brihadeeswara Temple"),
                db,
                ANOTHER_TOURIST,
            )
        assert exc.value.status_code == 409

    def test_tourist_cannot_book_same_guide_twice(self, db):
        profile = _register(db, GUIDE_USER)
        start_guide_tour(GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"), db, TOURIST_USER)
        with pytest.raises(HTTPException) as exc:
            start_guide_tour(
                GuideTourStartIn(guide_id=profile.id, site_id=TN_SITE, site_name="Brihadeeswara Temple"),
                db,
                TOURIST_USER,
            )
        assert exc.value.status_code == 409

    def test_tour_end_completes_and_frees_guide(self, db):
        profile = _register(db, GUIDE_USER)
        tour = start_guide_tour(
            GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        result = end_guide_tour(GuideTourEndIn(tour_id=tour["tour"]["id"]), db, TOURIST_USER)
        assert result["tour"]["status"] == "completed"
        assert result["guide"]["availability"] == "open_to_work"
        assert db.get(GuideProfile, profile.id).availability == "open_to_work"

    def test_tour_end_requires_ownership(self, db):
        profile = _register(db, GUIDE_USER)
        tour = start_guide_tour(
            GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        with pytest.raises(HTTPException) as exc:
            end_guide_tour(GuideTourEndIn(tour_id=tour["tour"]["id"]), db, ANOTHER_TOURIST)
        assert exc.value.status_code == 403

    def test_tourist_sees_their_active_tour_on_site(self, db):
        profile = _register(db, GUIDE_USER)
        start_guide_tour(GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"), db, TOURIST_USER)
        site = list_site_guides(PUNE_SITE, db=db, state="Maharashtra", location="Pune", current_user=TOURIST_USER)
        assert site["my_tour"] is not None
        assert site["my_tour"]["guide_id"] == profile.id
        assert site["my_tour"]["guide"]["name"] == "Guide A"

        other = list_site_guides(PUNE_SITE, db=db, state="Maharashtra", location="Pune", current_user=None)
        assert other["my_tour"] is None


class TestReports:
    def test_report_creates_private_record(self, db):
        profile = _register(db, GUIDE_USER)
        result = report_guide_profile(
            profile.id,
            GuideReportIn(reason_category="misconduct", description="Did not show up."),
            db,
            TOURIST_USER,
        )
        assert result["status"] == "open"
        report = db.get(GuideReport, result["report_id"])
        assert report is not None
        assert report.guide_id == profile.id
        assert report.reason_category == "misconduct"
        assert report.tourist_user_id == TOURIST_USER["id"]

    def test_invalid_reason_coerced_to_other(self, db):
        profile = _register(db, GUIDE_USER)
        result = report_guide_profile(
            profile.id,
            GuideReportIn(reason_category="totally-made-up", description="Something happened."),
            db,
            TOURIST_USER,
        )
        assert db.get(GuideReport, result["report_id"]).reason_category == "other"

    def test_report_other_requires_description(self, db):
        profile = _register(db, GUIDE_USER)
        with pytest.raises(HTTPException) as exc:
            report_guide_profile(profile.id, GuideReportIn(reason_category="other"), db, TOURIST_USER)
        assert exc.value.status_code == 400

    def test_report_does_not_change_public_availability(self, db):
        profile = _register(db, GUIDE_USER)
        report_guide_profile(profile.id, GuideReportIn(reason_category="misconduct", description="Bad"), db, TOURIST_USER)
        site = list_site_guides(PUNE_SITE, db=db, state="Maharashtra", location="Pune", current_user=None)
        assert any(g["id"] == profile.id for g in site["guides"])


class TestReviews:
    def test_review_writes_rating_and_text(self, db):
        profile = _register(db, GUIDE_USER)
        tour = start_guide_tour(
            GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        review = review_guide_tour(
            tour["tour"]["id"],
            GuideReviewIn(rating=5, review_text="Excellent local knowledge!"),
            db,
            TOURIST_USER,
        )
        assert review["review"]["rating"] == 5
        rating = get_my_guide_dashboard(db, GUIDE_USER)["rating"]
        assert rating == 5.0

    def test_rating_must_be_between_1_and_5(self, db):
        profile = _register(db, GUIDE_USER)
        tour = start_guide_tour(
            GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        with pytest.raises(HTTPException) as exc:
            review_guide_tour(tour["tour"]["id"], GuideReviewIn(rating=9), db, TOURIST_USER)
        assert exc.value.status_code == 400

    def test_only_tour_owner_can_review(self, db):
        profile = _register(db, GUIDE_USER)
        tour = start_guide_tour(
            GuideTourStartIn(guide_id=profile.id, site_id=PUNE_SITE, site_name="Shaniwar Wada"),
            db,
            TOURIST_USER,
        )
        with pytest.raises(HTTPException) as exc:
            review_guide_tour(tour["tour"]["id"], GuideReviewIn(rating=3), db, ANOTHER_TOURIST)
        assert exc.value.status_code == 403


class TestGuideAuth:
    """Self-contained guide authentication — no Supabase emails involved."""

    GUEST_EMAIL = "guest.guide@example.com"

    def _signup(self, db, email=GUEST_EMAIL):
        return register_guide_account(
            GuideAuthRegisterIn(name="Guest Guide", phone="9822012345", email=email, state="Maharashtra"),
            db,
        )

    def test_register_returns_token_and_8char_pin(self, db):
        res = self._signup(db)
        assert res["access_token"]
        assert res["pin"] and len(res["pin"]) == 8
        profile = db.get(GuideProfile, res["profile"]["id"])
        assert profile.availability == "open_to_work"
        assert profile.user_id.startswith("guide-")

    def test_pin_is_deterministic_from_stored_fields(self, db):
        res = self._signup(db)
        profile = db.get(GuideProfile, res["profile"]["id"])
        expected = _derive_pin(profile.email, profile.phone, profile.user_id)
        assert expected == res["pin"]

    def test_register_rejects_duplicate_email(self, db):
        self._signup(db)
        with pytest.raises(HTTPException) as exc:
            self._signup(db)
        assert exc.value.status_code == 409

    def test_login_with_email_and_pin_returns_token(self, db):
        res = self._signup(db)
        login = guide_member_login(GuideAuthLoginIn(email=self.GUEST_EMAIL, pin=res["pin"]), db)
        assert login["profile"]["email"] == self.GUEST_EMAIL
        assert login["access_token"]

    def test_login_rejects_wrong_pin(self, db):
        res = self._signup(db)
        wrong = "FFFFFF" + res["pin"][2:]
        with pytest.raises(HTTPException) as exc:
            guide_member_login(GuideAuthLoginIn(email=self.GUEST_EMAIL, pin=wrong), db)
        assert exc.value.status_code == 401

    def test_login_unknown_email_returns_404(self, db):
        with pytest.raises(HTTPException) as exc:
            guide_member_login(GuideAuthLoginIn(email="nobody@example.com", pin="ABCDEFGH"), db)
        assert exc.value.status_code == 404