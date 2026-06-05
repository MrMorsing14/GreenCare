# GreenCare Plant Identification API
FROM python:3.11-slim

# libgomp1 is required by the TensorFlow CPU wheel at runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install dependencies first so they cache across code changes
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy only the runtime files (model, labels, care data, app)
COPY server.py class_labels.json plant_care.json plant_model.tflite ./

# Run as an unprivileged user
RUN useradd --create-home --uid 10001 appuser
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD python -c "import urllib.request,sys; sys.exit(0) if urllib.request.urlopen('http://localhost:8000/health').status==200 else sys.exit(1)"

CMD ["uvicorn", "server:app", "--host", "0.0.0.0", "--port", "8000"]
