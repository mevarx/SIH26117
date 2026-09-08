"""Mock plant-system endpoints using SAP PM shaped request data."""

from typing import Literal
from pydantic import BaseModel, Field
from fastapi import APIRouter

from app.integrations.plant import create_work_order, fetch_scada_telemetry

router = APIRouter()


class SAPPMWorkOrderRequest(BaseModel):
    equipment_id: str = Field(min_length=1)
    fault_description: str = Field(min_length=1)
    priority_level: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"]
    sop_reference: str = Field(min_length=1)


@router.post("/sap/pm/workorder")
async def create_sap_pm_work_order(request: SAPPMWorkOrderRequest) -> dict:
    return create_work_order(**request.model_dump())


@router.get("/scada/telemetry")
async def get_scada_telemetry(sensor_tag: str) -> dict:
    return fetch_scada_telemetry(sensor_tag)
