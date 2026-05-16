"""
GreenCare Plant Identification API
Run: uvicorn server:app --host 0.0.0.0 --port 8000
"""

import os
import json
import numpy as np
from io import BytesIO
from PIL import Image
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware

os.environ['TF_DIRECTML_KERNEL_FALLBACK'] = '1'
import tensorflow as tf
tf.config.set_visible_devices([], 'GPU')
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input

# =============================================================================
# Config — update these paths to match your machine
# =============================================================================
MODEL_PATH = "best_model.keras"
LABELS_PATH = "class_labels.json"
CARE_PATH = "plant_care.json"

# =============================================================================
# Load model, labels, and care data once at startup
# =============================================================================
print("Loading model...")
model = load_model(MODEL_PATH)
print("Model loaded!")

with open(LABELS_PATH, "r") as f:
    class_labels = json.load(f)

with open(CARE_PATH, "r") as f:
    plant_care = json.load(f)

# =============================================================================
# FastAPI app
# =============================================================================
app = FastAPI(title="GreenCare Plant API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict")
async def predict(file: UploadFile = File(...)):
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    # Read and preprocess image — same as predict.py
    contents = await file.read()
    img = Image.open(BytesIO(contents)).convert("RGB")
    img = img.resize((224, 224))
    img_array = np.array(img, dtype=np.float32)
    img_array = np.expand_dims(img_array, axis=0)
    img_array = preprocess_input(img_array)

    # Predict
    result = model.predict(img_array)
    predicted_index = int(np.argmax(result[0]))
    predicted_plant = class_labels[str(predicted_index)]
    confidence = float(result[0][predicted_index])

    # Return top 3 predictions
    top_3_indices = np.argsort(result[0])[-3:][::-1]
    top_3 = [
        {
            "name": class_labels[str(int(i))],
            "confidence": float(result[0][i]),
        }
        for i in top_3_indices
    ]

    # Look up care info
    care = plant_care.get(predicted_plant, {
        "water": "No data available",
        "sunlight": "No data available",
        "soil": "No data available",
    })

    return {
        "prediction": predicted_plant,
        "confidence": confidence,
        "top_3": top_3,
        "care": care,
    }
