"""Deterministic mock adapters for SAP PM and SCADA demonstrations."""

from datetime import datetime, timezone
from uuid import uuid4


def create_work_order(equipment_id: str, fault_description: str, priority_level: str, sop_reference: str) -> dict:
    """Create an in-memory SAP PM compatible work order payload."""
    return {
        "work_order_id": f"PM-{uuid4().hex[:8].upper()}",
        "equipment_id": equipment_id,
        "short_text": fault_description,
        "priority": priority_level.upper(),
        "sop_reference": sop_reference,
        "status": "CREATED",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }


def fetch_scada_telemetry(sensor_tag: str) -> dict:
    """Return stable simulated readings so demos and tests are repeatable."""
    seed = sum(ord(char) for char in sensor_tag.upper())
    return {
        "sensor_tag": sensor_tag,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "metrics": {
            "temperature_c": round(72 + (seed % 180) / 10, 1),
            "pressure_bar": round(4 + (seed % 70) / 10, 1),
            "rpm": 1450 + (seed % 100),
        },
        "source": "mock-scada",
    }
