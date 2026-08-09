from fastapi import FastAPI
from routers import profile, cleaning, eda, statistics, training, forecasting, insights, chat

app = FastAPI(
    title="Python Data Science API Service",
    description="Automated profiling, cleaning, EDA, and machine learning models pipeline",
    version="1.0.0"
)

# Include routers
app.include_router(profile.router)
app.include_router(cleaning.router)
app.include_router(eda.router)
app.include_router(statistics.router)
app.include_router(training.router)
app.include_router(forecasting.router)
app.include_router(insights.router)
app.include_router(chat.router)

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "service": "python-data-science",
        "version": "1.0.0"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
