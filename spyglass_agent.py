"""
ResumeGod V4.0 — Agent 2: The Spyglass
Role: Tracks resume views via transparent tracking pixel.
Logs IP, geolocation, user-agent, company hints for the dashboard.
"""
import os
import httpx
import asyncio
from datetime import datetime
from typing import Optional
from sqlalchemy.orm import Session
from models import TrackingLog, Resume


# 1x1 transparent GIF — the classic tracking pixel
TRACKING_PIXEL_GIF = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff"
    b"\x00\x00\x00\x21\xf9\x04\x00\x00\x00\x00\x00\x2c\x00\x00\x00\x00"
    b"\x01\x00\x01\x00\x00\x02\x02\x44\x01\x00\x3b"
)

IPINFO_TOKEN = os.getenv("IPINFO_TOKEN", "")  # optional for higher rate limits


async def geolocate_ip(ip: str) -> dict:
    """
    Geolocate an IP address using ipinfo.io.
    Returns country, city, region, lat/lon, and org (company hint).
    """
    if ip in ("127.0.0.1", "::1", "localhost"):
        return {
            "country": "Local",
            "city": "Localhost",
            "region": "Dev",
            "latitude": None,
            "longitude": None,
            "company_hint": "Local Development"
        }

    try:
        url = f"https://ipinfo.io/{ip}/json"
        params = {"token": IPINFO_TOKEN} if IPINFO_TOKEN else {}

        async with httpx.AsyncClient(timeout=5.0) as http_client:
            resp = await http_client.get(url, params=params)
            data = resp.json()

        # Parse "loc" field: "37.7749,-122.4194"
        lat, lon = None, None
        if "loc" in data:
            parts = data["loc"].split(",")
            if len(parts) == 2:
                lat = float(parts[0])
                lon = float(parts[1])

        # org field looks like "AS15169 Google LLC" — extract company name
        org = data.get("org", "")
        company_hint = org.split(" ", 1)[1] if " " in org else org

        return {
            "country": data.get("country", "Unknown"),
            "city": data.get("city", "Unknown"),
            "region": data.get("region", "Unknown"),
            "latitude": lat,
            "longitude": lon,
            "company_hint": company_hint
        }
    except Exception as e:
        print(f"[Spyglass] Geolocation failed for {ip}: {e}")
        return {
            "country": "Unknown",
            "city": "Unknown",
            "region": "Unknown",
            "latitude": None,
            "longitude": None,
            "company_hint": "Unknown"
        }


async def log_tracking_event(
    db: Session,
    resume_id: str,
    ip_address: str,
    user_agent: str,
    referer: Optional[str] = None,
    event_type: str = "view"
) -> TrackingLog:
    """
    Core tracking function. Geolocates IP and persists to DB.
    """
    geo = await geolocate_ip(ip_address)

    log = TrackingLog(
        resume_id=resume_id,
        event_type=event_type,
        ip_address=ip_address,
        user_agent=user_agent,
        country=geo["country"],
        city=geo["city"],
        region=geo["region"],
        latitude=geo["latitude"],
        longitude=geo["longitude"],
        company_hint=geo["company_hint"],
        referer=referer,
        viewed_at=datetime.utcnow()
    )

    db.add(log)
    db.commit()
    db.refresh(log)
    print(f"[Spyglass] Logged view: {ip_address} ({geo['city']}, {geo['country']}) → Resume {resume_id[:8]}")
    return log


def get_tracking_stats(db: Session, resume_id: str) -> dict:
    """
    Aggregate tracking stats for a resume.
    Returns total views, unique IPs, timeline, and geographic breakdown.
    """
    logs = db.query(TrackingLog).filter(TrackingLog.resume_id == resume_id).all()

    if not logs:
        return {
            "total_views": 0,
            "unique_viewers": 0,
            "events": [],
            "geo_breakdown": {},
            "company_hints": [],
            "timeline": []
        }

    unique_ips = set(log.ip_address for log in logs)
    geo_breakdown = {}
    company_hints = []

    for log in logs:
        country = log.country or "Unknown"
        geo_breakdown[country] = geo_breakdown.get(country, 0) + 1
        if log.company_hint and log.company_hint not in ("Unknown", "Local Development"):
            company_hints.append(log.company_hint)

    events = [
        {
            "id": log.id,
            "event_type": log.event_type,
            "ip_address": log.ip_address,
            "country": log.country,
            "city": log.city,
            "company_hint": log.company_hint,
            "user_agent": log.user_agent,
            "latitude": log.latitude,
            "longitude": log.longitude,
            "viewed_at": log.viewed_at.isoformat() if log.viewed_at else None
        }
        for log in sorted(logs, key=lambda x: x.viewed_at, reverse=True)
    ]

    # Daily timeline
    from collections import defaultdict
    timeline_dict = defaultdict(int)
    for log in logs:
        day = log.viewed_at.strftime("%Y-%m-%d") if log.viewed_at else "Unknown"
        timeline_dict[day] += 1

    timeline = [
        {"date": day, "views": count}
        for day, count in sorted(timeline_dict.items())
    ]

    return {
        "total_views": len(logs),
        "unique_viewers": len(unique_ips),
        "events": events,
        "geo_breakdown": geo_breakdown,
        "company_hints": list(set(company_hints)),
        "timeline": timeline,
        "map_points": [
            {
                "lat": log.latitude,
                "lng": log.longitude,
                "city": log.city,
                "company": log.company_hint,
                "time": log.viewed_at.isoformat() if log.viewed_at else None
            }
            for log in logs
            if log.latitude and log.longitude
        ]
    }


def build_tracking_url(base_url: str, tracking_token: str) -> str:
    """Generate the tracking pixel URL to embed in the resume."""
    return f"{base_url}/api/track/{tracking_token}/pixel.gif"


def get_tracking_pixel_bytes() -> bytes:
    """Return the 1x1 transparent GIF bytes."""
    return TRACKING_PIXEL_GIF
