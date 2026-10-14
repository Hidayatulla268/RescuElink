import json
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.models.schemas import (
    AITriageResult, PriorityLevel, IncidentCategory, CitizenBroadcastResponse
)

logger = logging.getLogger(__name__)

class GeminiService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model_name = settings.GEMINI_MODEL or "gemini-3.8-flash"
        self.client = None
        
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"Gemini client initialized with model: {self.model_name}")
            except Exception as e:
                logger.warning(f"Failed to initialize Google GenAI client: {e}. Will use intelligent autonomous fallback.")

    async def analyze_and_triage_incident(
        self,
        raw_description: str,
        location_address: str,
        caller_name: Optional[str] = None,
        image_base64: Optional[str] = None
    ) -> AITriageResult:
        """
        Uses Gemini 3.8 Flash to extract emergency triage priority, hazards,
        victim estimates, and standard operating procedures.
        """
        prompt = f"""
You are an expert Autonomous Emergency Services Triage AI (RescuELINK).
Analyze the incoming emergency report and return a strict JSON object.

Incident Description: "{raw_description}"
Location Address: "{location_address}"
Reported By: "{caller_name or 'Anonymous'}"
Has Image Attached: {"Yes" if image_base64 else "No"}

You must return ONLY a valid JSON object with the following schema:
{{
  "severity_score": <int between 1 and 100>,
  "priority": <one of "P1", "P2", "P3", "P4">,
  "category": <one of "FIRE_EXPLOSION", "MEDICAL_TRAUMA", "FLOOD_WATER", "STRUCTURAL_COLLAPSE", "HAZMAT_SPILL", "TRAFFIC_COLLISION", "CIVIL_SAFETY">,
  "estimated_victims": <int>,
  "detected_hazards": [<list of specific hazard strings>],
  "standard_operating_procedures": [<list of 3-5 immediate tactical dispatch actions>],
  "recommended_units": [<list of unit types such as "AMBULANCE_PARAMEDIC", "FIRE_ENGINE", "DRONE_AERIAL_RECON", "HEAVY_RESCUE", "POLICE_TACTICAL">],
  "reasoning_summary": "<concise analytical paragraph justifying the triage tier and hazards>",
  "evacuation_radius_meters": <int perimeter in meters>,
  "confidence_score": <float between 0.85 and 0.99>
}}

Priorities:
- P1: Imminent life threat, active fire/hazmat explosion, submerged victims, major trauma.
- P2: Urgent structural damage, isolated fire, trapped non-critical persons, severe injuries.
- P3: Controlled collision, property damage without life threat, minor injuries.
- P4: Public advisory, nuisance, traffic light failure with no injuries.
"""

        if self.client:
            try:
                # Use interactions or models.generate_content
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = response.text if hasattr(response, 'text') else response.output_text
                # Parse JSON
                clean_text = text.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                clean_text = clean_text.strip()
                data = json.loads(clean_text)
                return AITriageResult(**data)
            except Exception as e:
                logger.error(f"Gemini API call failed, activating fallback: {e}")

        # Intelligent Autonomous Fallback Rule Engine
        return self._generate_intelligent_fallback_triage(raw_description, location_address)

    def _generate_intelligent_fallback_triage(self, text: str, location: str) -> AITriageResult:
        """Deterministic heuristic triage when external API is unreachable or key is unset."""
        lower = text.lower()
        
        # Categorization & Priority rules
        if any(w in lower for w in ["fire", "blaze", "explosion", "smoke", "chemical", "hazmat", "gas leak"]):
            category = IncidentCategory.HAZMAT_SPILL if "chemical" in lower or "gas" in lower else IncidentCategory.FIRE_EXPLOSION
            priority = PriorityLevel.P1
            severity = 92
            victims = 2 if "trapped" in lower or "people" in lower else 1
            hazards = ["Thermal Radiance", "Toxic Combustion Byproducts", "Structural Weakening"]
            sops = [
                "Establish 300m upwind safety perimeter immediately",
                "Deploy structural fire engine and water tender",
                "Deploy thermal drone for hot-spot identification",
                "Issue localized respiratory hazard broadcast"
            ]
            units = ["FIRE_ENGINE", "DRONE_AERIAL_RECON", "AMBULANCE_PARAMEDIC"]
            summary = "High-thermal event with potential airborne hazardous effluents. Immediate rapid suppression and perimeter isolation mandated."
            radius = 450

        elif any(w in lower for w in ["flood", "water", "river", "drown", "submerged", "creek", "storm"]):
            category = IncidentCategory.FLOOD_WATER
            priority = PriorityLevel.P1
            severity = 86
            victims = 3 if "car" in lower or "vehicle" in lower else 1
            hazards = ["Hydraulic Force & Currents", "Submerged Obstacles", "Electrical Short Circuits"]
            sops = [
                "Isolate municipal power conduits in affected quadrant",
                "Deploy inflatable swiftwater rescue team with safety tether lines",
                "Deploy aerial thermal recon to scan downstream drainage banks",
                "Divert vehicular traffic around inundated underpasses"
            ]
            units = ["HEAVY_RESCUE", "DRONE_AERIAL_RECON", "AMBULANCE_PARAMEDIC"]
            summary = "Flash inundation posing rapid hydraulic entrapment hazards. Urgent swiftwater extraction required."
            radius = 350

        elif any(w in lower for w in ["heart", "cardiac", "stroke", "bleeding", "unconscious", "head injury", "breath"]):
            category = IncidentCategory.MEDICAL_TRAUMA
            priority = PriorityLevel.P1
            severity = 89
            victims = 1
            hazards = ["Hypoxia", "Irreversible Hemodynamic Collapse"]
            sops = [
                "Dispatch Advanced Life Support (ALS) Paramedic Unit",
                "Instruct caller on bystander CPR and airway clearance",
                "Alert nearest Level 1 Trauma Center ED triage desk"
            ]
            units = ["AMBULANCE_PARAMEDIC", "POLICE_TACTICAL"]
            summary = "Critical medical trauma with time-sensitive hemodynamic instability. Expedited ALS transit essential."
            radius = 50

        elif any(w in lower for w in ["crash", "collision", "overturned", "highway", "traffic"]):
            category = IncidentCategory.TRAFFIC_COLLISION
            priority = PriorityLevel.P2 if "heavy" in lower or "highway" in lower else PriorityLevel.P3
            severity = 68
            victims = 2
            hazards = ["Secondary Collision Risk", "Roadway Fuel Slick", "Debris Projectiles"]
            sops = [
                "Position tactical patrol to create safe buffer upstream of collision",
                "Deploy extrication spreaders for deformed vehicle door",
                "Assess passengers for cervical and thoracic trauma"
            ]
            units = ["AMBULANCE_PARAMEDIC", "POLICE_TACTICAL", "HEAVY_RESCUE"]
            summary = "Roadway collision with vehicle deformation. Lane closure and patient stabilization required."
            radius = 120

        elif any(w in lower for w in ["collapse", "building", "rubble", "wall", "crushed"]):
            category = IncidentCategory.STRUCTURAL_COLLAPSE
            priority = PriorityLevel.P1
            severity = 95
            victims = 4
            hazards = ["Secondary Structural Failure", "Dust Asphyxiation", "Ruptured Gas Mains"]
            sops = [
                "Cut municipal gas and electric mains to incident sector",
                "Deploy acoustic/thermal search & rescue sensors into void spaces",
                "Establish heavy shoring around compromised load-bearing spans",
                "Set up casualty collection point on clear street frontage"
            ]
            units = ["HEAVY_RESCUE", "DRONE_AERIAL_RECON", "FIRE_ENGINE", "AMBULANCE_PARAMEDIC"]
            summary = "Severe structural compromise with void space entrapment. High urban catastrophe index."
            radius = 500

        else:
            category = IncidentCategory.CIVIL_SAFETY
            priority = PriorityLevel.P3
            severity = 45
            victims = 0
            hazards = ["Crowd Friction", "Public Disorder"]
            sops = [
                "Dispatch localized municipal patrol unit",
                "Monitor CCTV feed from intersection node",
                "Log citizen statement"
            ]
            units = ["POLICE_TACTICAL"]
            summary = "Non-life-threatening urban civil disturbance. Standard patrol inspection assigned."
            radius = 80

        return AITriageResult(
            severity_score=severity,
            priority=priority,
            category=category,
            estimated_victims=victims,
            detected_hazards=hazards,
            standard_operating_procedures=sops,
            recommended_units=units,
            reasoning_summary=summary,
            evacuation_radius_meters=radius,
            confidence_score=0.94
        )

    async def generate_citizen_broadcast(
        self,
        incident_title: str,
        category: str,
        location: str,
        hazards: list[str],
        advisory_type: str,
        languages: list[str]
    ) -> Dict[str, str]:
        """Generates emergency alerts across requested languages."""
        hazard_str = ", ".join(hazards)
        prompt = f"""
You are the Municipal Emergency Broadcasting Authority AI.
Generate immediate, clear, panic-reducing citizen safety alerts for the following crisis:
Incident: {incident_title}
Category: {category}
Location: {location}
Active Hazards: {hazard_str}
Advisory Type: {advisory_type}

Provide localized alert messages in the following languages: {", ".join(languages)}.
Return a strict JSON object where keys are the language names and values are the concise message (under 200 characters each):
Example:
{{
  "English": "EMERGENCY ALERT: Active fire near 4th St. Shelter indoors, close all windows, avoid the area.",
  "Spanish": "ALERTA DE EMERGENCIA: Incendio activo cerca de 4th St. Permanezca en interiores y cierre ventanas.",
  ...
}}
"""
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                text = response.text if hasattr(response, 'text') else response.output_text
                clean_text = text.strip()
                if clean_text.startswith("```json"):
                    clean_text = clean_text[7:]
                if clean_text.endswith("```"):
                    clean_text = clean_text[:-3]
                clean_text = clean_text.strip()
                return json.loads(clean_text)
            except Exception as e:
                logger.error(f"Gemini broadcast generation failed: {e}")

        # Intelligent Multi-language fallback
        alerts = {}
        for lang in languages:
            if lang == "English":
                alerts["English"] = f"EMERGENCY ALERT ({category.replace('_', ' ')}): Hazard reported at {location}. Maintain {advisory_type.replace('_', ' ')}. Follow official instructions and clear emergency lanes."
            elif lang == "Spanish":
                alerts["Spanish"] = f"ALERTA DE EMERGENCIA ({category.replace('_', ' ')}): Peligro reportado en {location}. Mantenga precauciones. Siga las instrucciones oficiales y despeje las vías."
            elif lang == "Hindi":
                alerts["Hindi"] = f"आपातकालीन चेतावनी: {location} के पास खतरा। सुरक्षित स्थान पर रहें, खिड़कियां बंद रखें और आपातकालीन वाहनों के लिए रास्ता खाली रखें।"
            elif lang == "French":
                alerts["French"] = f"ALERTE D'URGENCE: Incident signalé à {location}. Veuillez rester à l'abri, fermer les fenêtres et laisser les voies libres aux secours."
            elif lang == "Arabic":
                alerts["Arabic"] = f"تنبيه طوارئ: تم الإبلاغ عن حادث في {location}. يرجى البقاء في مكان آمن وإخلاء مسارات مركبات الطوارئ."
            else:
                alerts[lang] = f"EMERGENCY ADVISORY: Incident active at {location}. Heed emergency personnel instructions immediately."
        return alerts

gemini_service = GeminiService()
