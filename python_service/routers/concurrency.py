# python_service/routers/concurrency.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import datetime

router = APIRouter(prefix="/datasets", tags=["concurrency"])

class MutationRequest(BaseModel):
    dataset_id: str
    expected_dataset_version: str
    operation: str
    lineage_id: Optional[str] = None
    raw_hash: str
    user_id: str
    role: Optional[str] = "data_analyst"
    company_id: Optional[str] = "company_1"
    target_tenant_id: Optional[str] = "company_1"
    restore_target_version: Optional[str] = None

# Thread-safe in-memory store for dataset version tracking in Python service
DATASET_REGISTRY: Dict[str, Dict[str, Any]] = {}
AUDIT_LOG: List[Dict[str, Any]] = []

def get_or_create_dataset_state(dataset_id: str, raw_hash: str):
    if dataset_id not in DATASET_REGISTRY:
        v1 = {
            "version": "v1",
            "version_number": 1,
            "raw_hash": raw_hash,
            "immutable": True,
            "created_at": datetime.datetime.utcnow().isoformat()
        }
        DATASET_REGISTRY[dataset_id] = {
            "current_version": "v1",
            "version_number": 1,
            "raw_hash": raw_hash,
            "company_id": "company_1",
            "history": [v1]
        }
    return DATASET_REGISTRY[dataset_id]

@router.post("/mutate")
async def mutate_dataset_with_concurrency(payload: MutationRequest):
    # 1. Cross-tenant isolation check
    if payload.company_id and payload.target_tenant_id and payload.company_id != payload.target_tenant_id:
        AUDIT_LOG.append({
            "action": "MUTATION_BLOCKED_TENANT_ISOLATION",
            "dataset_id": payload.dataset_id,
            "user_id": payload.user_id,
            "status": "REJECTED_403",
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cross-tenant mutation rejected. Target dataset belongs to another tenant organization."
        )

    # 2. RBAC check (recruiter / guest cannot mutate datasets)
    allowed_roles = {"ceo", "data_analyst", "admin", "lead_analyst"}
    if payload.role and payload.role.lower() not in allowed_roles:
        AUDIT_LOG.append({
            "action": "MUTATION_BLOCKED_RBAC",
            "dataset_id": payload.dataset_id,
            "user_id": payload.user_id,
            "role": payload.role,
            "status": "REJECTED_403",
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Unauthorized: Role '{payload.role}' lacks mutation permission on dataset."
        )

    # 3. Retrieve or initialize dataset version state
    state = get_or_create_dataset_state(payload.dataset_id, payload.raw_hash)
    current_ver = state["current_version"]

    # 4. Atomic Optimistic Locking Check: expected vs current
    if payload.expected_dataset_version != current_ver:
        # Conflict detected! Log attempted operation in audit
        AUDIT_LOG.append({
            "action": "MUTATION_CONFLICT",
            "dataset_id": payload.dataset_id,
            "user_id": payload.user_id,
            "operation": payload.operation,
            "expected_version": payload.expected_dataset_version,
            "current_version": current_ver,
            "status": "CONFLICT_409",
            "timestamp": datetime.datetime.utcnow().isoformat()
        })
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "error": "Version conflict detected. Dataset was modified by another user.",
                "current_version": current_ver,
                "expected_version": payload.expected_dataset_version,
                "raw_hash": state["raw_hash"]
            }
        )

    # 5. Handle Non-Destructive Restore vs New Version Mutation
    next_ver_num = state["version_number"] + 1
    next_ver_tag = f"v{next_ver_num}"

    if payload.operation == "restore":
        target = payload.restore_target_version or "v1"
        new_version_record = {
            "version": next_ver_tag,
            "version_number": next_ver_num,
            "label": f"Restored from {target}",
            "raw_hash": state["raw_hash"],
            "immutable": True,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "created_by": payload.user_id
        }
    else:
        new_version_record = {
            "version": next_ver_tag,
            "version_number": next_ver_num,
            "label": f"{payload.operation.capitalize()} {next_ver_tag}",
            "raw_hash": state["raw_hash"], # Invariant: rawHash is preserved
            "immutable": True,
            "created_at": datetime.datetime.utcnow().isoformat(),
            "created_by": payload.user_id
        }

    # Atomically apply new version to state
    state["history"].append(new_version_record)
    state["current_version"] = next_ver_tag
    state["version_number"] = next_ver_num

    # Append successful mutation audit event
    audit_entry = {
        "action": "MUTATION_APPLIED",
        "dataset_id": payload.dataset_id,
        "user_id": payload.user_id,
        "operation": payload.operation,
        "previous_version": payload.expected_dataset_version,
        "new_version": next_ver_tag,
        "raw_hash": state["raw_hash"],
        "status": "SUCCESS_200",
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    AUDIT_LOG.append(audit_entry)

    return {
        "success": True,
        "dataset_id": payload.dataset_id,
        "previous_version": payload.expected_dataset_version,
        "new_version": next_ver_tag,
        "raw_hash": state["raw_hash"],
        "history_count": len(state["history"]),
        "audit_event": audit_entry
    }

@router.get("/audit-events")
async def get_concurrency_audit_events():
    return {"audit_events": AUDIT_LOG}

@router.post("/reset-state")
async def reset_concurrency_state():
    DATASET_REGISTRY.clear()
    AUDIT_LOG.clear()
    return {"status": "reset"}
