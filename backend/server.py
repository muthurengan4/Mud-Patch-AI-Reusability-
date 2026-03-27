from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File, Form
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ.get('MONGO_URL')
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'mudpatch_db')]

# Emergent LLM Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

# Create the main app
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============== MODELS ==============

class GarmentAnalysisRequest(BaseModel):
    image_base64: str
    retail_price: float = 0.0
    brand_name: Optional[str] = None
    category: Optional[str] = None
    age_months: Optional[int] = 0

class AIAnalysisResult(BaseModel):
    fabric_type: str = "Unknown"
    fabric_quality_score: int = 50
    damage_detected: List[str] = []
    damage_score: int = 100
    stain_detected: bool = False
    stain_area_percentage: float = 0.0
    cleanliness_score: int = 100
    brand_detected: Optional[str] = None
    brand_category: str = "mass_produced"
    overall_condition: str = "Good"
    confidence: float = 0.0

class RVSResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    fabric_quality_score: int = 0  # Q
    wear_tear_score: int = 0  # W
    cleanliness_score: int = 0  # C
    age_score: int = 0  # A
    brand_value_score: int = 0  # B
    market_demand_score: int = 0  # M
    rvs_total: float = 0.0
    return_credit: float = 0.0
    suggested_action: str = ""
    action_color: str = ""
    ai_analysis: Dict[str, Any] = {}
    retail_price: float = 0.0
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class AdminSettings(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = "admin_settings"
    formula_weights: Dict[str, float] = {
        "Q": 0.30,
        "W": 0.25,
        "C": 0.15,
        "A": 0.15,
        "B": 0.10,
        "M": 0.05
    }
    action_thresholds: Dict[str, Dict[str, int]] = {
        "full_resale": {"min": 80, "max": 100},
        "refurbish_resale": {"min": 60, "max": 79},
        "recycle_fabric": {"min": 40, "max": 59},
        "downcycle": {"min": 20, "max": 39},
        "waste": {"min": 0, "max": 19}
    }

class BrandCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    category: str  # eco_friendly, medium_quality, mass_produced
    score: int
    keywords: List[str] = []

class ProductCategory(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    market_demand_score: int = 50

# ============== HELPER FUNCTIONS ==============

async def get_admin_settings() -> AdminSettings:
    settings = await db.admin_settings.find_one({"id": "admin_settings"}, {"_id": 0})
    if settings:
        return AdminSettings(**settings)
    default_settings = AdminSettings()
    await db.admin_settings.insert_one(default_settings.model_dump())
    return default_settings

async def get_brand_score(brand_name: str) -> tuple:
    if not brand_name:
        return 30, "mass_produced"
    
    brand = await db.brands.find_one(
        {"$or": [
            {"name": {"$regex": brand_name, "$options": "i"}},
            {"keywords": {"$elemMatch": {"$regex": brand_name, "$options": "i"}}}
        ]},
        {"_id": 0}
    )
    
    if brand:
        return brand.get("score", 30), brand.get("category", "mass_produced")
    
    # Default scoring based on common categories
    brand_lower = brand_name.lower()
    eco_keywords = ["organic", "sustainable", "eco", "patagonia", "eileen fisher", "mud patch"]
    premium_keywords = ["zara", "h&m", "gap", "uniqlo", "mango"]
    
    for kw in eco_keywords:
        if kw in brand_lower:
            return 90, "eco_friendly"
    for kw in premium_keywords:
        if kw in brand_lower:
            return 60, "medium_quality"
    
    return 30, "mass_produced"

async def get_market_demand_score(category: str) -> int:
    if not category:
        return 50
    
    cat = await db.categories.find_one(
        {"name": {"$regex": category, "$options": "i"}},
        {"_id": 0}
    )
    
    if cat:
        return cat.get("market_demand_score", 50)
    
    # Default market demand scores
    default_scores = {
        "dresses": 85, "t-shirts": 75, "shirts": 70, "blouses": 70,
        "jumpers": 65, "sweatshirts": 65, "trousers": 60, "shorts": 55,
        "skirts": 60, "bodysuits": 50, "rompers": 45, "dungarees": 40,
        "pjs": 35, "baby essentials": 30
    }
    
    for key, score in default_scores.items():
        if key in category.lower():
            return score
    
    return 50

def calculate_age_score(age_months: int) -> int:
    if age_months < 4:  # < 120 days
        return 100
    elif age_months < 12:  # 120-360 days
        return 70
    else:  # > 1 year
        return 40

def get_suggested_action(rvs: float) -> tuple:
    if rvs >= 80:
        return "Full Resale", "#10b981"
    elif rvs >= 60:
        return "Refurbish & Resale", "#f59e0b"
    elif rvs >= 40:
        return "Recycle Fabric", "#14b8a6"
    elif rvs >= 20:
        return "Downcycle", "#d97757"
    else:
        return "Waste", "#ef4444"

async def analyze_garment_with_ai(image_base64: str) -> AIAnalysisResult:
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"garment-analysis-{uuid.uuid4()}",
            system_message="""You are an expert garment condition analyzer for the Mud Patch circular fashion platform. 
Analyze the garment image and provide detailed assessment in JSON format only.

Respond ONLY with a valid JSON object (no markdown, no explanation) with these exact fields:
{
    "fabric_type": "string - e.g., Cotton, Polyester, Wool, Silk, Linen, Blend, Unknown",
    "fabric_quality_score": "integer 0-100 based on fabric type and visual quality",
    "damage_detected": ["array of specific damages found: holes, tears, fading, loose threads, discoloration, pilling, etc."],
    "damage_score": "integer 0-100 (100 = no damage, subtract 15 per hole, 10 per tear, 5 per minor issue)",
    "stain_detected": "boolean",
    "stain_area_percentage": "float 0-100 estimated percentage of garment with stains",
    "cleanliness_score": "integer 0-100 (100 - stain_area_percentage * 2)",
    "brand_detected": "string or null - any visible brand/logo",
    "overall_condition": "string - Excellent/Good/Fair/Poor/Very Poor",
    "confidence": "float 0-1 confidence in analysis"
}"""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")

        image_content = ImageContent(image_base64=image_base64)
        
        user_message = UserMessage(
            text="Analyze this garment image for reusability assessment. Identify fabric type, any damage (holes, tears, fading, loose threads), stains, brand/logo if visible, and overall condition. Respond with JSON only.",
            file_contents=[image_content]
        )
        
        response = await chat.send_message(user_message)
        logger.info(f"AI Response: {response}")
        
        # Parse JSON response
        import json
        try:
            # Clean the response - remove markdown code blocks if present
            clean_response = response.strip()
            if clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1]
                if clean_response.startswith("json"):
                    clean_response = clean_response[4:]
                clean_response = clean_response.strip()
            
            data = json.loads(clean_response)
            
            return AIAnalysisResult(
                fabric_type=data.get("fabric_type", "Unknown"),
                fabric_quality_score=int(data.get("fabric_quality_score", 50)),
                damage_detected=data.get("damage_detected", []),
                damage_score=int(data.get("damage_score", 100)),
                stain_detected=data.get("stain_detected", False),
                stain_area_percentage=float(data.get("stain_area_percentage", 0)),
                cleanliness_score=int(data.get("cleanliness_score", 100)),
                brand_detected=data.get("brand_detected"),
                overall_condition=data.get("overall_condition", "Good"),
                confidence=float(data.get("confidence", 0.8))
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return AIAnalysisResult()
            
    except Exception as e:
        logger.error(f"AI Analysis error: {e}")
        return AIAnalysisResult()

# ============== API ROUTES ==============

@api_router.get("/")
async def root():
    return {"message": "Mud Patch Garment Reusability AI Engine API"}

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now(timezone.utc).isoformat()}

# Garment Analysis
@api_router.post("/analyze", response_model=RVSResult)
async def analyze_garment(request: GarmentAnalysisRequest):
    try:
        # Get AI analysis
        ai_result = await analyze_garment_with_ai(request.image_base64)
        
        # Get settings
        settings = await get_admin_settings()
        weights = settings.formula_weights
        
        # Calculate component scores
        Q = ai_result.fabric_quality_score  # Fabric Quality
        W = ai_result.damage_score  # Wear & Tear (damage)
        C = ai_result.cleanliness_score  # Cleanliness (stains)
        A = calculate_age_score(request.age_months or 0)  # Age
        
        # Brand score
        brand_name = request.brand_name or ai_result.brand_detected
        B, brand_category = await get_brand_score(brand_name)
        
        # Market demand score
        M = await get_market_demand_score(request.category)
        
        # Calculate RVS using formula
        rvs = (
            Q * weights.get("Q", 0.30) +
            W * weights.get("W", 0.25) +
            C * weights.get("C", 0.15) +
            A * weights.get("A", 0.15) +
            B * weights.get("B", 0.10) +
            M * weights.get("M", 0.05)
        )
        
        # Calculate return credit
        return_credit = request.retail_price * (rvs / 100) if request.retail_price > 0 else 0
        
        # Get suggested action
        action, action_color = get_suggested_action(rvs)
        
        result = RVSResult(
            fabric_quality_score=Q,
            wear_tear_score=W,
            cleanliness_score=C,
            age_score=A,
            brand_value_score=B,
            market_demand_score=M,
            rvs_total=round(rvs, 1),
            return_credit=round(return_credit, 2),
            suggested_action=action,
            action_color=action_color,
            ai_analysis={
                "fabric_type": ai_result.fabric_type,
                "damage_detected": ai_result.damage_detected,
                "stain_detected": ai_result.stain_detected,
                "stain_area_percentage": ai_result.stain_area_percentage,
                "brand_detected": ai_result.brand_detected,
                "overall_condition": ai_result.overall_condition,
                "confidence": ai_result.confidence
            },
            retail_price=request.retail_price
        )
        
        # Save to history
        doc = result.model_dump()
        await db.analysis_history.insert_one(doc)
        
        return result
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/history", response_model=List[RVSResult])
async def get_analysis_history(limit: int = 50):
    history = await db.analysis_history.find({}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return history

@api_router.delete("/history/{analysis_id}")
async def delete_analysis(analysis_id: str):
    result = await db.analysis_history.delete_one({"id": analysis_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Analysis not found")
    return {"message": "Analysis deleted successfully"}

# Admin Settings
@api_router.get("/admin/settings", response_model=AdminSettings)
async def get_settings():
    return await get_admin_settings()

@api_router.put("/admin/settings")
async def update_settings(settings: AdminSettings):
    await db.admin_settings.update_one(
        {"id": "admin_settings"},
        {"$set": settings.model_dump()},
        upsert=True
    )
    return {"message": "Settings updated successfully"}

# Brand Management
@api_router.get("/admin/brands", response_model=List[BrandCategory])
async def get_brands():
    brands = await db.brands.find({}, {"_id": 0}).to_list(1000)
    return brands

@api_router.post("/admin/brands", response_model=BrandCategory)
async def create_brand(brand: BrandCategory):
    doc = brand.model_dump()
    await db.brands.insert_one(doc)
    return brand

@api_router.put("/admin/brands/{brand_id}")
async def update_brand(brand_id: str, brand: BrandCategory):
    await db.brands.update_one(
        {"id": brand_id},
        {"$set": brand.model_dump()}
    )
    return {"message": "Brand updated successfully"}

@api_router.delete("/admin/brands/{brand_id}")
async def delete_brand(brand_id: str):
    result = await db.brands.delete_one({"id": brand_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Brand not found")
    return {"message": "Brand deleted successfully"}

# Category Management
@api_router.get("/admin/categories", response_model=List[ProductCategory])
async def get_categories():
    categories = await db.categories.find({}, {"_id": 0}).to_list(1000)
    return categories

@api_router.post("/admin/categories", response_model=ProductCategory)
async def create_category(category: ProductCategory):
    doc = category.model_dump()
    await db.categories.insert_one(doc)
    return category

@api_router.put("/admin/categories/{category_id}")
async def update_category(category_id: str, category: ProductCategory):
    await db.categories.update_one(
        {"id": category_id},
        {"$set": category.model_dump()}
    )
    return {"message": "Category updated successfully"}

@api_router.delete("/admin/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# Seed default data
@api_router.post("/admin/seed")
async def seed_default_data():
    # Seed default brands
    default_brands = [
        BrandCategory(name="Mud Patch", category="eco_friendly", score=95, keywords=["mud patch", "mudpatch"]),
        BrandCategory(name="Patagonia", category="eco_friendly", score=90, keywords=["patagonia"]),
        BrandCategory(name="Eileen Fisher", category="eco_friendly", score=88, keywords=["eileen fisher"]),
        BrandCategory(name="Organic Basics", category="eco_friendly", score=85, keywords=["organic basics"]),
        BrandCategory(name="Zara", category="medium_quality", score=60, keywords=["zara"]),
        BrandCategory(name="H&M", category="medium_quality", score=55, keywords=["h&m", "hm"]),
        BrandCategory(name="Uniqlo", category="medium_quality", score=65, keywords=["uniqlo"]),
        BrandCategory(name="Gap", category="medium_quality", score=58, keywords=["gap"]),
        BrandCategory(name="Primark", category="mass_produced", score=30, keywords=["primark"]),
        BrandCategory(name="Shein", category="mass_produced", score=20, keywords=["shein"]),
    ]
    
    for brand in default_brands:
        existing = await db.brands.find_one({"name": brand.name})
        if not existing:
            await db.brands.insert_one(brand.model_dump())
    
    # Seed default categories
    default_categories = [
        ProductCategory(name="Dresses", market_demand_score=85),
        ProductCategory(name="T-shirts", market_demand_score=75),
        ProductCategory(name="Shirts", market_demand_score=70),
        ProductCategory(name="Blouses", market_demand_score=70),
        ProductCategory(name="Jumpers", market_demand_score=65),
        ProductCategory(name="Sweatshirts", market_demand_score=65),
        ProductCategory(name="Trousers", market_demand_score=60),
        ProductCategory(name="Shorts", market_demand_score=55),
        ProductCategory(name="Skirts", market_demand_score=60),
        ProductCategory(name="Bodysuits", market_demand_score=50),
        ProductCategory(name="Rompers", market_demand_score=45),
        ProductCategory(name="Dungarees", market_demand_score=40),
        ProductCategory(name="PJs", market_demand_score=35),
        ProductCategory(name="Baby Essentials", market_demand_score=30),
    ]
    
    for cat in default_categories:
        existing = await db.categories.find_one({"name": cat.name})
        if not existing:
            await db.categories.insert_one(cat.model_dump())
    
    return {"message": "Default data seeded successfully"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
