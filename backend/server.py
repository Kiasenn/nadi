from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv
load_dotenv()
import logging
import uuid
import jwt
import bcrypt
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
from collections import defaultdict

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = os.environ['JWT_ALGORITHM']
JWT_EXPIRE_HOURS = int(os.environ['JWT_EXPIRE_HOURS'])
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

app = FastAPI(title="NADI - Navigasi Data Bisnis")
api_router = APIRouter(prefix="/api")


# ============ Models ============
class RegisterInput(BaseModel):
    email: EmailStr
    password: str
    owner_name: str
    business_name: str
    business_category: str
    phone: Optional[str] = None


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ProductInput(BaseModel):
    name: str
    category: str
    price: float
    hpp: float
    stock: int
    unit: str = "pcs"
    image: Optional[str] = None
    min_stock: int = 10


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    hpp: Optional[float] = None
    stock: Optional[int] = None
    unit: Optional[str] = None
    image: Optional[str] = None
    min_stock: Optional[int] = None


class CartItem(BaseModel):
    product_id: str
    quantity: int


class TransactionInput(BaseModel):
    items: List[CartItem]
    payment_method: str = "Tunai"
    discount: float = 0
    note: Optional[str] = None


class ProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    owner_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    operating_hours: Optional[str] = None


# ============ Auth Helpers ============
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def create_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Tidak terautentikasi")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token tidak valid")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan")
    return user


# ============ Auth Routes ============
@api_router.post("/auth/register")
async def register(inp: RegisterInput):
    existing = await db.users.find_one({"email": inp.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email sudah terdaftar")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": inp.email,
        "password": hash_password(inp.password),
        "owner_name": inp.owner_name,
        "business_name": inp.business_name,
        "business_category": inp.business_category,
        "phone": inp.phone or "",
        "address": "",
        "operating_hours": "08:00 - 22:00",
        "subscription_plan": "Starter",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user_doc)
    token = create_token(user_id)
    user_doc.pop("password")
    user_doc.pop("_id", None)
    return {"token": token, "user": user_doc}


@api_router.post("/auth/login")
async def login(inp: LoginInput):
    user = await db.users.find_one({"email": inp.email})
    if not user or not verify_password(inp.password, user["password"]):
        raise HTTPException(status_code=401, detail="Email atau kata sandi salah")
    token = create_token(user["id"])
    user.pop("password", None)
    user.pop("_id", None)
    return {"token": token, "user": user}


@api_router.get("/auth/me")
async def me(current=Depends(get_current_user)):
    return current


@api_router.put("/auth/profile")
async def update_profile(inp: ProfileUpdate, current=Depends(get_current_user)):
    updates = {k: v for k, v in inp.dict().items() if v is not None}
    if updates:
        await db.users.update_one({"id": current["id"]}, {"$set": updates})
    updated = await db.users.find_one({"id": current["id"]}, {"_id": 0, "password": 0})
    return updated


# ============ Products ============
@api_router.get("/products")
async def list_products(current=Depends(get_current_user)):
    docs = await db.products.find({"owner_id": current["id"]}, {"_id": 0}).to_list(1000)
    return docs


@api_router.post("/products")
async def create_product(inp: ProductInput, current=Depends(get_current_user)):
    doc = inp.dict()
    doc["id"] = str(uuid.uuid4())
    doc["owner_id"] = current["id"]
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.products.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.put("/products/{product_id}")
async def update_product(product_id: str, inp: ProductUpdate, current=Depends(get_current_user)):
    updates = {k: v for k, v in inp.dict().items() if v is not None}
    result = await db.products.update_one(
        {"id": product_id, "owner_id": current["id"]}, {"$set": updates}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produk tidak ditemukan")
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated


@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current=Depends(get_current_user)):
    await db.products.delete_one({"id": product_id, "owner_id": current["id"]})
    return {"ok": True}


# ============ Transactions ============
@api_router.get("/transactions")
async def list_transactions(current=Depends(get_current_user), limit: int = 200):
    docs = await db.transactions.find({"owner_id": current["id"]}, {"_id": 0}).sort("created_at", -1).to_list(limit)
    return docs


@api_router.post("/transactions")
async def create_transaction(inp: TransactionInput, current=Depends(get_current_user)):
    if not inp.items:
        raise HTTPException(status_code=400, detail="Keranjang kosong")

    products = await db.products.find({"owner_id": current["id"]}, {"_id": 0}).to_list(1000)
    prod_map = {p["id"]: p for p in products}

    items_detail = []
    subtotal = 0
    hpp_total = 0
    for it in inp.items:
        p = prod_map.get(it.product_id)
        if not p:
            raise HTTPException(status_code=400, detail=f"Produk {it.product_id} tidak ditemukan")
        line_total = p["price"] * it.quantity
        line_hpp = p["hpp"] * it.quantity
        items_detail.append({
            "product_id": p["id"],
            "name": p["name"],
            "category": p["category"],
            "price": p["price"],
            "hpp": p["hpp"],
            "quantity": it.quantity,
            "total": line_total,
        })
        subtotal += line_total
        hpp_total += line_hpp

    total = subtotal - inp.discount
    profit = total - hpp_total

    trx_doc = {
        "id": str(uuid.uuid4()),
        "owner_id": current["id"],
        "items": items_detail,
        "subtotal": subtotal,
        "discount": inp.discount,
        "total": total,
        "hpp_total": hpp_total,
        "profit": profit,
        "payment_method": inp.payment_method,
        "note": inp.note or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.transactions.insert_one(trx_doc)

    for it in inp.items:
        await db.products.update_one(
            {"id": it.product_id, "owner_id": current["id"]},
            {"$inc": {"stock": -it.quantity}}
        )

    trx_doc.pop("_id", None)
    return trx_doc


# ============ Analytics helpers ============
async def _get_transactions(owner_id: str, days: int = 30) -> List[Dict]:
    since = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
    return await db.transactions.find(
        {"owner_id": owner_id, "created_at": {"$gte": since}}, {"_id": 0}
    ).sort("created_at", 1).to_list(10000)


def _day_key(iso: str) -> str:
    return iso[:10]


@api_router.get("/dashboard/summary")
async def dashboard_summary(current=Depends(get_current_user)):
    today = datetime.now(timezone.utc).date().isoformat()
    trxs = await _get_transactions(current["id"], days=7)
    products = await db.products.find({"owner_id": current["id"]}, {"_id": 0}).to_list(1000)

    today_trxs = [t for t in trxs if _day_key(t["created_at"]) == today]
    today_revenue = sum(t["total"] for t in today_trxs)
    today_profit = sum(t["profit"] for t in today_trxs)
    today_count = len(today_trxs)

    # 7-day chart
    chart_map = defaultdict(lambda: {"revenue": 0, "profit": 0, "count": 0})
    for i in range(7):
        d = (datetime.now(timezone.utc).date() - timedelta(days=6 - i)).isoformat()
        chart_map[d]  # ensure key
    for t in trxs:
        d = _day_key(t["created_at"])
        if d in chart_map:
            chart_map[d]["revenue"] += t["total"]
            chart_map[d]["profit"] += t["profit"]
            chart_map[d]["count"] += 1
    chart = [{"date": d, **v} for d, v in sorted(chart_map.items())]

    # Best selling (7 days)
    product_qty = defaultdict(int)
    product_name = {}
    for t in trxs:
        for it in t["items"]:
            product_qty[it["product_id"]] += it["quantity"]
            product_name[it["product_id"]] = it["name"]
    best = sorted(product_qty.items(), key=lambda x: x[1], reverse=True)
    best_product = {"name": product_name[best[0][0]], "quantity": best[0][1]} if best else None

    low_stock = [p for p in products if p["stock"] <= p.get("min_stock", 10)]

    return {
        "today_revenue": today_revenue,
        "today_profit": today_profit,
        "today_count": today_count,
        "best_product": best_product,
        "chart_7d": chart,
        "low_stock": low_stock,
        "recent_transactions": trxs[-5:][::-1],
    }


@api_router.get("/analytics/overview")
async def analytics_overview(current=Depends(get_current_user), days: int = 30):
    trxs = await _get_transactions(current["id"], days=days)

    # Daily revenue/profit trend
    daily = defaultdict(lambda: {"revenue": 0, "profit": 0, "count": 0})
    for i in range(days):
        d = (datetime.now(timezone.utc).date() - timedelta(days=days - 1 - i)).isoformat()
        daily[d]
    for t in trxs:
        d = _day_key(t["created_at"])
        if d in daily:
            daily[d]["revenue"] += t["total"]
            daily[d]["profit"] += t["profit"]
            daily[d]["count"] += 1
    trend = [{"date": d, **v} for d, v in sorted(daily.items())]

    # Sales by hour
    by_hour = defaultdict(int)
    for h in range(24):
        by_hour[h] = 0
    for t in trxs:
        try:
            hour = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00")).hour
            by_hour[hour] += t["total"]
        except Exception:
            continue
    hours = [{"hour": f"{h:02d}", "revenue": by_hour[h]} for h in range(24)]

    # Sales by day of week (0=Mon)
    dow_names = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"]
    by_dow = defaultdict(int)
    for t in trxs:
        try:
            dow = datetime.fromisoformat(t["created_at"].replace("Z", "+00:00")).weekday()
            by_dow[dow] += t["total"]
        except Exception:
            continue
    days_chart = [{"day": dow_names[i], "revenue": by_dow[i]} for i in range(7)]

    # Category share
    cat_rev = defaultdict(float)
    for t in trxs:
        for it in t["items"]:
            cat_rev[it["category"]] += it["total"]
    categories = [{"category": k, "revenue": v} for k, v in cat_rev.items()]

    # Top products
    prod_stats = defaultdict(lambda: {"quantity": 0, "revenue": 0, "profit": 0})
    prod_names = {}
    for t in trxs:
        for it in t["items"]:
            s = prod_stats[it["product_id"]]
            s["quantity"] += it["quantity"]
            s["revenue"] += it["total"]
            s["profit"] += (it["price"] - it["hpp"]) * it["quantity"]
            prod_names[it["product_id"]] = it["name"]
    top = sorted(
        [{"id": pid, "name": prod_names[pid], **v} for pid, v in prod_stats.items()],
        key=lambda x: x["revenue"], reverse=True
    )[:10]

    total_revenue = sum(t["total"] for t in trxs)
    total_profit = sum(t["profit"] for t in trxs)
    total_trx = len(trxs)
    avg_ticket = total_revenue / total_trx if total_trx else 0

    return {
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "total_trx": total_trx,
        "avg_ticket": avg_ticket,
        "trend": trend,
        "hours": hours,
        "days": days_chart,
        "categories": categories,
        "top_products": top,
    }


# ============ Reports ============
@api_router.get("/reports")
async def reports(period: str = "daily", current=Depends(get_current_user)):
    days_map = {"daily": 1, "weekly": 7, "monthly": 30}
    d = days_map.get(period, 7)
    trxs = await _get_transactions(current["id"], days=d)

    revenue = sum(t["total"] for t in trxs)
    profit = sum(t["profit"] for t in trxs)
    hpp = sum(t["hpp_total"] for t in trxs)

    product_stats = defaultdict(lambda: {"quantity": 0, "revenue": 0, "name": ""})
    for t in trxs:
        for it in t["items"]:
            s = product_stats[it["product_id"]]
            s["quantity"] += it["quantity"]
            s["revenue"] += it["total"]
            s["name"] = it["name"]
    products = sorted(product_stats.values(), key=lambda x: x["revenue"], reverse=True)

    return {
        "period": period,
        "days": d,
        "total_revenue": revenue,
        "total_hpp": hpp,
        "total_profit": profit,
        "total_trx": len(trxs),
        "products": products,
        "transactions": trxs,
    }


# ============ NADI Insight (AI) ============
def _rule_based_insights(analytics: Dict, products: List[Dict]) -> List[Dict]:
    insights = []
    # Best selling
    if analytics["top_products"]:
        top = analytics["top_products"][0]
        insights.append({
            "type": "top_product",
            "icon": "TrendingUp",
            "title": "Produk Paling Laris Minggu Ini",
            "message": f"{top['name']} adalah produk paling laris dengan {int(top['quantity'])} unit terjual dan pendapatan Rp{int(top['revenue']):,}.".replace(",", "."),
            "action": "Pertimbangkan menambah stok atau buat paket bundling."
        })
    # Peak hour
    if analytics["hours"]:
        peak = max(analytics["hours"], key=lambda x: x["revenue"])
        if peak["revenue"] > 0:
            insights.append({
                "type": "peak_hour",
                "icon": "Clock",
                "title": "Jam Penjualan Tertinggi",
                "message": f"Penjualan paling ramai di jam {peak['hour']}.00. Siapkan stok & staf tambahan pada jam tersebut.",
                "action": "Terapkan promo happy hour untuk mengisi jam sepi."
            })
    # Low stock
    low = [p for p in products if p["stock"] <= p.get("min_stock", 10)]
    for p in low[:3]:
        est_days = max(1, p["stock"] // 2) if p["stock"] > 0 else 0
        insights.append({
            "type": "low_stock",
            "icon": "AlertTriangle",
            "title": f"Stok {p['name']} Menipis",
            "message": f"Stok tersisa {p['stock']} {p['unit']}. Diperkirakan habis dalam ~{est_days} hari.",
            "action": "Segera lakukan pemesanan ulang."
        })
    # Peak day
    if analytics["days"]:
        best_day = max(analytics["days"], key=lambda x: x["revenue"])
        if best_day["revenue"] > 0:
            insights.append({
                "type": "peak_day",
                "icon": "Calendar",
                "title": "Hari Ter-ramai",
                "message": f"Hari {best_day['day']} adalah hari dengan omzet tertinggi.",
                "action": "Manfaatkan hari ini dengan promo terbatas."
            })
    # Category
    if analytics["categories"]:
        top_cat = max(analytics["categories"], key=lambda x: x["revenue"])
        insights.append({
            "type": "category",
            "icon": "PieChart",
            "title": "Kategori Andalan",
            "message": f"Kategori {top_cat['category']} menyumbang pendapatan terbesar Rp{int(top_cat['revenue']):,}.".replace(",", "."),
            "action": "Perluas variasi produk kategori ini."
        })
    return insights


@api_router.get("/insights")
async def get_insights(current=Depends(get_current_user)):
    analytics = await analytics_overview(current, days=14)
    products = await db.products.find({"owner_id": current["id"]}, {"_id": 0}).to_list(1000)
    insights = _rule_based_insights(analytics, products)

    ai_summary = None
    if EMERGENT_LLM_KEY:
        try:
            from emergentintegrations.llm.chat import LlmChat, UserMessage
            summary_data = {
                "omzet_14_hari": int(analytics["total_revenue"]),
                "keuntungan_14_hari": int(analytics["total_profit"]),
                "jumlah_transaksi": analytics["total_trx"],
                "produk_terlaris": [p["name"] for p in analytics["top_products"][:3]],
                "stok_menipis": [f"{p['name']} ({p['stock']} {p['unit']})" for p in products if p["stock"] <= p.get("min_stock", 10)][:5],
            }
            chat = LlmChat(
                api_key=EMERGENT_LLM_KEY,
                session_id=f"nadi-{current['id']}",
                system_message="Kamu adalah NADI, asisten bisnis cerdas untuk berbagai jenis usaha. Berikan rekomendasi bisnis dalam Bahasa Indonesia yang santai, singkat (maksimal 4 poin bullet), praktis, dan mudah dipahami pemilik warung. Gunakan tone hangat dan positif."
            ).with_model("anthropic", "claude-sonnet-5")
            msg = UserMessage(text=f"Berdasarkan data kedai '{current.get('business_name', 'usaha')}' 14 hari terakhir: {summary_data}. Berikan 3-4 rekomendasi strategis yang bisa langsung diterapkan.")
            ai_summary = await chat.send_message(msg)
        except Exception as e:
            logging.warning(f"AI insight fallback: {e}")
            ai_summary = None

    return {"insights": insights, "ai_summary": ai_summary}


# ============ Seed / Demo ============
@api_router.post("/seed/demo")
async def seed_demo(current=Depends(get_current_user)):
    """Seed sample products and 30-day transaction data for the current user."""
    await db.products.delete_many({"owner_id": current["id"]})
    await db.transactions.delete_many({"owner_id": current["id"]})

    sample_products = [
        {"name": "Es Kopi Susu", "category": "Minuman", "price": 18000, "hpp": 7500, "stock": 42, "unit": "cup", "min_stock": 15,
         "image": None},
        {"name": "Americano", "category": "Minuman", "price": 15000, "hpp": 7000, "stock": 8, "unit": "cup", "min_stock": 15,
         "image": None},
        {"name": "Cappuccino Latte Art", "category": "Minuman", "price": 20000, "hpp": 9000, "stock": 30, "unit": "cup", "min_stock": 10,
         "image": None},
        {"name": "Es Teh Manis Jumbo", "category": "Minuman", "price": 5000, "hpp": 2000, "stock": 60, "unit": "cup", "min_stock": 20,
         "image": None},
        {"name": "Roti Bakar Cokelat Keju", "category": "Snack", "price": 13000, "hpp": 6500, "stock": 15, "unit": "porsi", "min_stock": 8,
         "image": None},
        {"name": "Pisang Cokelat", "category": "Snack", "price": 13000, "hpp": 5000, "stock": 5, "unit": "porsi", "min_stock": 10,
         "image": None},
        {"name": "Nasi Goreng Telur", "category": "Makanan", "price": 20000, "hpp": 9500, "stock": 25, "unit": "porsi", "min_stock": 10,
         "image": None},
        {"name": "Ricebowl Ayam", "category": "Makanan", "price": 20000, "hpp": 11000, "stock": 20, "unit": "porsi", "min_stock": 10,
         "image": None},
        {"name": "Biji Kopi Arabika 250g", "category": "Retail", "price": 85000, "hpp": 45000, "stock": 12, "unit": "pack", "min_stock": 5,
         "image": None},
        {"name": "Gula Aren", "category": "Bahan Baku", "price": 25000, "hpp": 15000, "stock": 3, "unit": "botol", "min_stock": 5,
         "image": None},
    ]

    products = []
    for sp in sample_products:
        doc = {
            "id": str(uuid.uuid4()),
            "owner_id": current["id"],
            "created_at": datetime.now(timezone.utc).isoformat(),
            **sp
        }
        products.append(doc)
    await db.products.insert_many(products)

    # Generate transactions for 30 days
    import random
    random.seed(42)
    now = datetime.now(timezone.utc)
    trx_list = []
    for day_offset in range(30):
        day = now - timedelta(days=day_offset)
        # more transactions on weekends
        num_trx = random.randint(8, 25)
        if day.weekday() >= 5:
            num_trx += random.randint(5, 10)
        for _ in range(num_trx):
            # peak hours 8-11 and 16-19
            hour_pool = [8, 9, 10, 11, 12, 13, 14, 15, 16, 16, 17, 17, 18, 18, 19, 19, 20]
            hour = random.choice(hour_pool)
            minute = random.randint(0, 59)
            trx_time = day.replace(hour=hour, minute=minute, second=0, microsecond=0)

            num_items = random.randint(1, 4)
            chosen = random.sample(products, min(num_items, len(products)))
            items = []
            subtotal = 0
            hpp_total = 0
            for p in chosen:
                qty = random.randint(1, 3)
                items.append({
                    "product_id": p["id"],
                    "name": p["name"],
                    "category": p["category"],
                    "price": p["price"],
                    "hpp": p["hpp"],
                    "quantity": qty,
                    "total": p["price"] * qty,
                })
                subtotal += p["price"] * qty
                hpp_total += p["hpp"] * qty
            discount = 0 if random.random() > 0.15 else 5000
            total = subtotal - discount
            trx_list.append({
                "id": str(uuid.uuid4()),
                "owner_id": current["id"],
                "items": items,
                "subtotal": subtotal,
                "discount": discount,
                "total": total,
                "hpp_total": hpp_total,
                "profit": total - hpp_total,
                "payment_method": random.choice(["Tunai", "QRIS", "Transfer", "Tunai", "QRIS"]),
                "note": "",
                "created_at": trx_time.isoformat(),
            })

    if trx_list:
        await db.transactions.insert_many(trx_list)

    return {"products": len(products), "transactions": len(trx_list)}


@api_router.get("/")
async def root():
    return {"app": "NADI", "tagline": "Catat transaksi. Pahami data. Ambil keputusan lebih cerdas."}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
