import unittest

from app.integrations.plant import create_work_order, fetch_scada_telemetry


class TestPlantIntegrations(unittest.TestCase):
    def test_work_order_has_sap_pm_fields(self):
        work_order = create_work_order("P-101", "Seal failure", "CRITICAL", "SOP-PM-12")
        self.assertTrue(work_order["work_order_id"].startswith("PM-"))
        self.assertEqual(work_order["status"], "CREATED")
        self.assertEqual(work_order["equipment_id"], "P-101")

    def test_scada_readings_are_complete_and_deterministic(self):
        reading = fetch_scada_telemetry("P-101-RPM")
        self.assertEqual(reading["metrics"], fetch_scada_telemetry("P-101-RPM")["metrics"])
        self.assertEqual(set(reading["metrics"]), {"temperature_c", "pressure_bar", "rpm"})
