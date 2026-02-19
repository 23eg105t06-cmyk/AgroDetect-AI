from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
import tensorflow as tf
import numpy as np
from PIL import Image
import io
import cv2
import base64
import json

# =============================
# FASTAPI SETUP
# =============================

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# =============================
# LOAD MODEL
# =============================

model = tf.keras.models.load_model("agrodetect_model.h5")

with open("class_names.json") as f:
    class_names = json.load(f)

# =============================
# FIND LAST CONV LAYER (SAFE)
# =============================

from tensorflow.keras.layers import Conv2D, DepthwiseConv2D, SeparableConv2D

def get_last_conv_layer(model):

    for layer in reversed(model.layers):

        if isinstance(layer, (Conv2D, DepthwiseConv2D, SeparableConv2D)):
            return layer.name

    raise ValueError("No convolution layer found")

last_conv_layer_name = get_last_conv_layer(model)

# =============================
# PREPROCESS
# =============================

def preprocess(image):

    image = image.resize((224,224))
    arr = np.array(image, dtype=np.float32)
    arr = tf.keras.applications.mobilenet_v2.preprocess_input(arr)

    return np.expand_dims(arr,0)

# =============================
# GRADCAM HEATMAP
# =============================

def make_gradcam(img_array):

    last_conv_layer = model.get_layer(last_conv_layer_name)

    grad_model = tf.keras.models.Model(
        [model.inputs],
        [last_conv_layer.output, model.output]
    )

    with tf.GradientTape() as tape:

        conv_outputs, predictions = grad_model(img_array)

        class_idx = tf.argmax(predictions[0])
        loss = predictions[:, class_idx]

    grads = tape.gradient(loss, conv_outputs)

    pooled_grads = tf.reduce_mean(grads, axis=(0,1,2))
    conv_outputs = conv_outputs[0]

    heatmap = conv_outputs @ pooled_grads[..., tf.newaxis]
    heatmap = tf.squeeze(heatmap)

    heatmap = np.maximum(heatmap,0)

    if np.max(heatmap) != 0:
        heatmap /= np.max(heatmap)

    heatmap = heatmap.numpy() if hasattr(heatmap, "numpy") else heatmap

    heatmap = cv2.resize(heatmap,(224,224))

    return heatmap

# =============================
# LOCAL AI EXPLANATION
# =============================

def generate_ai_text(disease, severity):

    disease_name = disease.replace("_"," ")

    if severity < 20:
        level="low severity"
        advice="Monitor plant health and maintain proper watering and sunlight."
    elif severity <=50:
        level="moderate severity"
        advice="Remove affected leaves and improve airflow to prevent spread."
    else:
        level="high severity"
        advice="Immediate treatment required. Consider fungicide or professional inspection."

    return f"""
AI detected {disease_name}.

Visual patterns indicate possible disease symptoms localized on leaf surface.

Severity level appears {level}. {advice}
"""

# =============================
# ROUTES
# =============================

@app.get("/")
def home():
    return {"message":"AgroDetect AI Backend Running"}

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    contents = await file.read()

    try:
        image = Image.open(io.BytesIO(contents)).convert("RGB")
    except:
        return {"error":"Invalid image"}

    processed = preprocess(image)

    preds = model.predict(processed)[0]

    idx = int(np.argmax(preds))

    disease = class_names[idx]
    confidence = float(np.max(preds))

    severity = round(confidence*100)

    # HEATMAP
    heatmap = make_gradcam(processed)

    original = cv2.resize(np.array(image),(224,224))

    heatmap = np.uint8(255*heatmap)
    heatmap = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)

    overlay = cv2.addWeighted(original,0.6,heatmap,0.4,0)

    _,buffer = cv2.imencode('.jpg',overlay)

    heatmap_base64 = base64.b64encode(buffer).decode()

    ai_text = generate_ai_text(disease,severity)

    return {
        "disease": disease,
        "confidence": confidence,
        "heatmap": heatmap_base64,
        "ai_text": ai_text
    }