from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import pandas as pd
from pydantic import BaseModel
from typing import List
from fastapi.middleware.cors import CORSMiddleware
from typing import Optional
from model import Model
from config import Config

# Загрузка данных из CSV
data = pd.read_csv('turism.csv')

app = FastAPI()

# Настройка CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Разрешенные источники
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Настройка статических файлов и шаблонов
app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index3.html", {"request": request})

# Инициализация конфигурации и модели
config = Config(stream_or_path=None)
model = Model()

class Preferences(BaseModel):
    approximate_cost: Optional[str] = None
    season: Optional[str] = None
    activity_type: Optional[List[str]] = []
    population_density: Optional[str] = None
    terrain_type: Optional[List[str]] = []
    camping_available: Optional[bool] = None
    network_availability: Optional[str] = None

# Определение модели для запроса чата
class Question(BaseModel):
    question: str

@app.post("/recommendations")
async def get_recommendations(preferences: Preferences):
    user_preferences = preferences.model_dump()  # Use model_dump instead of dict
    filtered_data = data.copy()

    # Print columns for debugging
    print("Available columns in DataFrame:", filtered_data.columns)

    # Filtering based on user preferences
    if user_preferences.get("terrain_type"):
        filtered_data = filtered_data[
            filtered_data["terrain_type"].str.lower().apply(
                lambda x: any(t.lower() in x.split(", ") for t in user_preferences["terrain_type"])
            )
        ]
    if user_preferences.get("activity_type"):
        filtered_data = filtered_data[
            filtered_data["activity_type"].str.lower().apply(
                lambda x: any(a.lower() in x.split(", ") for a in user_preferences["activity_type"])
            )
        ]
    if user_preferences.get("season"):
        filtered_data = filtered_data[
            filtered_data["season"].str.lower() == user_preferences["season"].lower()
        ]
    if user_preferences.get("approximate_cost"):
        cost_category = user_preferences["approximate_cost"].lower()
        if cost_category == "дешево":
            min_cost, max_cost = 10000, 40000
        elif cost_category == "умеренно":
            min_cost, max_cost = 40001, 90000
        elif cost_category == "дорого":
            min_cost, max_cost = 90001, 200000
        filtered_data = filtered_data[
            (filtered_data["approximate_cost"] >= min_cost) & (filtered_data["approximate_cost"] <= max_cost)
        ]
    # Фильтрация по доступности кемпинга
    if user_preferences.get("camping_available") is not None:
        filtered_data = filtered_data[
            filtered_data["camping_available"] == user_preferences["camping_available"]
        ]

    # Проверка на наличие данных после фильтрации
    if filtered_data.empty:
        raise HTTPException(status_code=404, detail="Нет данных для указанных предпочтений.")

    # Prepare recommendations
    recommendations = filtered_data.to_dict(orient="records")
    recommendations = [{
        "name": rec["name"],
        "description": rec["description"],
        "cost": rec["approximate_cost"],
        "season": rec["season"],
        "activity_type": rec["activity_type"].split(", ") if isinstance(rec["activity_type"], str) else rec["activity_type"],
        "terrain_type": rec["terrain_type"].split(", ") if isinstance(rec["terrain_type"], str) else rec["terrain_type"],
        "camping_available": rec["camping_available"]
    } for rec in recommendations]

    return JSONResponse(content=recommendations)

@app.post("/ask")
async def ask_question(question: Question):
    print(f"Received question: {question.question}")  # Логирование полученного вопроса
    try:
        answer = model.ask_question(question.question)
        print(f"Answer: {answer}")  # Логирование ответа
        if answer is None:
            raise HTTPException(status_code=500, detail="Ошибка при получении ответа от модели.")
        return {"answer": answer}
    except Exception as e:
        print(f"Error: {str(e)}")  # Логирование ошибки
        raise HTTPException(status_code=500, detail=f"Ошибка: {str(e)}")

@app.get("/")
async def read_root():
    return HTMLResponse(open("templates/index3.html").read())  # Замените на ваш HTML файл

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
