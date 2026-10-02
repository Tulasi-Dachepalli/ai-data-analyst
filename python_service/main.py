from fastapi import FastAPI
from routers import profile, cleaning, eda, statistics, training, forecasting, insights, chat, concurrency, streaming, integrity, observability
from fastapi import Request
import time

app = FastAPI(
    title="Python Data Science API Service",
    description="Automated profiling, cleaning, EDA, and machine learning models pipeline",
    version="1.0.0"
)

# APM Request Latency Middleware
@app.middleware("http")
async def apm_latency_middleware(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    duration_ms = (time.time() - start) * 1000.0
    observability.record_request_metric(request.url.path, duration_ms, response.status_code)
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"
    return response

# Include routers
app.include_router(profile.router)
app.include_router(cleaning.router)
app.include_router(eda.router)
app.include_router(statistics.router)
app.include_router(training.router)
app.include_router(forecasting.router)
app.include_router(insights.router)
app.include_router(chat.router)
app.include_router(concurrency.router)
app.include_router(streaming.router)
app.include_router(integrity.router)
app.include_router(observability.router)

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
