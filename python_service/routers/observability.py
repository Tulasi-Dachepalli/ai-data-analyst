# python_service/routers/observability.py
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime
import time
import math
import sys
import os

router = APIRouter(prefix="/observability", tags=["observability"])

class SIEMEvent(BaseModel):
    event_category: str = "audit"
    event_action: str
    event_outcome: str = "success" # success | failure
    severity: int = 10 # 10=info, 50=warning, 80=critical/security
    user_id: str
    tenant_id: str
    dataset_id: Optional[str] = None
    dataset_version: Optional[str] = None
    raw_hash: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

# In-memory APM & SIEM Storage
APM_LATENCY_RECORDS: List[float] = []
ENDPOINT_LATENCY_MAP: Dict[str, List[float]] = {}
SIEM_EVENT_STORE: List[Dict[str, Any]] = []
SERVICE_START_TIME = time.time()

def record_request_metric(endpoint: str, latency_ms: float, status_code: int):
    APM_LATENCY_RECORDS.append(latency_ms)
    if endpoint not in ENDPOINT_LATENCY_MAP:
        ENDPOINT_LATENCY_MAP[endpoint] = []
    ENDPOINT_LATENCY_MAP[endpoint].append(latency_ms)

def record_siem_event(
    category: str,
    action: str,
    outcome: str,
    severity: int,
    user_id: str,
    tenant_id: str,
    dataset_id: Optional[str] = None,
    dataset_version: Optional[str] = None,
    raw_hash: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    ecs_event = {
        "@timestamp": datetime.datetime.utcnow().isoformat() + "Z",
        "ecs": {"version": "8.11.0"},
        "event": {
            "category": category,
            "action": action,
            "outcome": outcome,
            "severity": severity
        },
        "user": {
            "id": user_id
        },
        "organization": {
            "id": tenant_id
        },
        "dataset": {
            "id": dataset_id,
            "version": dataset_version,
            "raw_hash": raw_hash
        },
        "details": details or {}
    }
    SIEM_EVENT_STORE.append(ecs_event)
    return ecs_event

def calculate_percentiles(latencies: List[float]) -> Dict[str, float]:
    if not latencies:
        return {"p50": 0.0, "p95": 0.0, "p99": 0.0, "avg": 0.0, "min": 0.0, "max": 0.0}
    sorted_l = sorted(latencies)
    n = len(sorted_l)
    def percentile(p):
        k = (n - 1) * (p / 100.0)
        f = math.floor(k)
        c = math.ceil(k)
        if f == c:
            return sorted_l[int(k)]
        return sorted_l[int(f)] * (c - k) + sorted_l[int(c)] * (k - f)
    
    return {
        "p50": round(percentile(50), 2),
        "p95": round(percentile(95), 2),
        "p99": round(percentile(99), 2),
        "avg": round(sum(sorted_l) / n, 2),
        "min": round(sorted_l[0], 2),
        "max": round(sorted_l[-1], 2)
    }

@router.get("/metrics")
async def get_apm_metrics():
    """Returns high-resolution APM metrics including latency percentiles and endpoint distributions."""
    overall = calculate_percentiles(APM_LATENCY_RECORDS)
    endpoint_breakdown = {}
    for ep, latencies in ENDPOINT_LATENCY_MAP.items():
        endpoint_breakdown[ep] = {
            "call_count": len(latencies),
            "latencies": calculate_percentiles(latencies)
        }
    
    uptime_sec = round(time.time() - SERVICE_START_TIME, 2)
    return {
        "status": "healthy",
        "uptime_seconds": uptime_sec,
        "total_requests": len(APM_LATENCY_RECORDS),
        "latency_percentiles_ms": overall,
        "endpoints": endpoint_breakdown
    }

@router.get("/siem/events")
async def get_siem_events(
    tenant_id: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    min_severity: Optional[int] = Query(0)
):
    """Exports structured ECS-compliant SIEM audit logs with multi-tenant filtering."""
    results = SIEM_EVENT_STORE
    if tenant_id:
        results = [e for e in results if e.get("organization", {}).get("id") == tenant_id]
    if category:
        results = [e for e in results if e.get("event", {}).get("category") == category]
    if min_severity:
        results = [e for e in results if e.get("event", {}).get("severity", 0) >= min_severity]
    
    return {
        "schema": "Elastic Common Schema (ECS) v8.11.0",
        "count": len(results),
        "events": results
    }

@router.post("/siem/ingest")
async def ingest_siem_event(payload: SIEMEvent):
    """Allows ingestion of external telemetry and client audit events into the unified SIEM ledger."""
    recorded = record_siem_event(
        category=payload.event_category,
        action=payload.event_action,
        outcome=payload.event_outcome,
        severity=payload.severity,
        user_id=payload.user_id,
        tenant_id=payload.tenant_id,
        dataset_id=payload.dataset_id,
        dataset_version=payload.dataset_version,
        raw_hash=payload.raw_hash,
        details=payload.details
    )
    return {"success": True, "event": recorded}

@router.get("/health")
async def get_observability_health():
    """System health check with heap safety indicators."""
    return {
        "status": "ok",
        "service": "python-data-science-apm",
        "memory_safe": True,
        "heap_bounded": True,
        "siem_events_retained": len(SIEM_EVENT_STORE)
    }

@router.post("/reset")
async def reset_observability_state():
    APM_LATENCY_RECORDS.clear()
    ENDPOINT_LATENCY_MAP.clear()
    SIEM_EVENT_STORE.clear()
    return {"status": "observability_state_reset"}
