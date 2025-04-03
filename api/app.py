from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse, JSONResponse
from pipeline import load_model, generate_response
import asyncio
import json
import logging
from typing import AsyncGenerator
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
tokenizer = None
model_loading = False
model_error = None

async def init_model():
    global model, tokenizer, model_loading, model_error
    if not model_loading:
        model_loading = True
        try:
            model, tokenizer = load_model()
            model_error = None
        except Exception as e:
            model_error = str(e)
            logger.error(f"Failed to load model: {model_error}")
        finally:
            model_loading = False

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(init_model())

async def stream_response(query: str) -> AsyncGenerator[str, None]:
    global model, tokenizer, model_loading, model_error
    
    if model_loading:
        yield f"data: {json.dumps({'error': 'Model is still loading. Please try again in a moment.'})}\n\n"
        yield "data: [DONE]\n\n"
        return
        
    if model is None:
        if model_error:
            yield f"data: {json.dumps({'error': f'Model failed to load: {model_error}'})}\n\n"
        else:
            yield f"data: {json.dumps({'error': 'Model is not loaded. Please try again later.'})}\n\n"
        yield "data: [DONE]\n\n"
        return
    
    try:
        response = generate_response(
            model=model,
            tokenizer=tokenizer,
            query=query,
            stream=True
        )
        
        if response.get("error"):
            yield f"data: {json.dumps({'error': response['error']})}\n\n"
            yield "data: [DONE]\n\n"
            return
            
        for chunk in response["response"].split():
            yield f"data: {json.dumps({'chunk': chunk + ' '})}\n\n"
            await asyncio.sleep(0.05)
        
        yield "data: [DONE]\n\n"
        
    except Exception as e:
        logger.error(f"Error generating response: {str(e)}")
        yield f"data: {json.dumps({'error': str(e)})}\n\n"
        yield "data: [DONE]\n\n"

@app.post("/api/chat")
async def chat(request: Request):
    try:
        data = await request.json()
        return StreamingResponse(
            stream_response(data["message"]),
            media_type="text/event-stream"
        )
    except Exception as e:
        logger.error(f"Error in chat endpoint: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"error": str(e)}
        )

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "model_loaded": model is not None,
        "model_loading": model_loading,
        "model_error": model_error
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=int(os.getenv("PORT", "8000"))) 