from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract, or_
from app.services.database import get_db
from app.models.voting_session import VotingSession
from app.models.user import User
from app.models.whitelist import Whitelist
from app.schemas.voting_session import VotingSessionResponse
from app.schemas.session_search import VotingSessionSearchParams, WhitelistSearchParams
from typing import List

router = APIRouter()

# Search for user's own polls
@router.get("/search/my-polls", response_model=List[VotingSessionResponse])
def search_my_polls(
    user_id: int,
    params: VotingSessionSearchParams = Depends(),
    db: Session = Depends(get_db)
):
    query = db.query(VotingSession).filter(VotingSession.creator_id == user_id)

    #Apply specified query paremeters
    if params.day:
        query = query.filter(extract("day", VotingSession.time_created) == params.day)
    if params.year:
        query = query.filter(extract("year", VotingSession.time_created) == params.year)
    if params.month:
        query = query.filter(extract("month", VotingSession.time_created) == params.month)
    if params.start_date:
        query = query.filter(VotingSession.time_created >= params.start_date)
    if params.end_date:
        query = query.filter(VotingSession.time_created <= params.end_date)
    if params.exact_date:
        query = query.filter(VotingSession.time_created == params.exact_date)
    if params.title:
        query = query.filter(VotingSession.title.ilike(f"%{params.title}%"))
    if params.is_published is not None:
        query = query.filter(VotingSession.is_published == params.is_published)
    if params.description:
        query = query.filter(VotingSession.description.ilike(f"%{params.description}%"))

    #Order by specified column
    if params.order_by:
        order_column = getattr(VotingSession, params.order_by, None)
        if order_column:
            query = query.order_by(order_column.desc() if params.order_direction == "desc" else order_column.asc())

    return query.all()


#Search for polls user is whitelisted in (or polls without a whitelist)
@router.get("/search/whitelisted", response_model=List[VotingSessionResponse])
def search_whitelisted_polls(
    user_id: int,
    params: WhitelistSearchParams = Depends(),
    db: Session = Depends(get_db)
):

    #Get IDs of sessions where the user is whitelisted
    whitelisted_session_ids = db.query(Whitelist.session_id).filter(Whitelist.user_id == user_id).subquery()

    #Query sessions that are either whitelisted for the user or don't require a whitelist
    query = db.query(VotingSession).filter(
        or_(
            VotingSession.id.in_(whitelisted_session_ids),
            VotingSession.whitelist == False
        )
    )

    #Apply specified query paremeters
    if params.creator_name:
        query = query.join(User, VotingSession.creator_id == User.id).filter(User.name.ilike(f"%{params.creator_name}%"))
    if params.day:
        query = query.filter(extract("day", VotingSession.time_created) == params.day)
    if params.year:
        query = query.filter(extract("year", VotingSession.time_created) == params.year)
    if params.month:
        query = query.filter(extract("month", VotingSession.time_created) == params.month)
    if params.start_date:
        query = query.filter(VotingSession.time_created >= params.start_date)
    if params.end_date:
        query = query.filter(VotingSession.time_created <= params.end_date)
    if params.exact_date:
        query = query.filter(VotingSession.time_created == params.exact_date)
    if params.title:
        query = query.filter(VotingSession.title.ilike(f"%{params.title}%"))
    if params.description:
        query = query.filter(VotingSession.description.ilike(f"%{params.description}%"))

    #Order by specified column
    if params.order_by:
        order_column = getattr(VotingSession, params.order_by, None)
        if order_column:
            query = query.order_by(order_column.desc() if params.order_direction == "desc" else order_column.asc())

    return query.all()

