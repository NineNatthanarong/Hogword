from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, words, validation, analytics, logs

app = FastAPI(title="Hogword API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://hogword.site",
        "http://hogword.site",
        "https://www.hogword.site",
        "http://www.hogword.site",
        "http://localhost:3000",
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.include_router(auth.router)
app.include_router(words.router)
app.include_router(validation.router)
app.include_router(analytics.router)
app.include_router(logs.router)


@app.get("/")
async def root():
    return {"message": "Welcome to Hogword API this Project is created for AIE312 Final Project"}
