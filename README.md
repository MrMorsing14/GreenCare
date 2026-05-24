# Plant Classifier

A mobile app that uses a CNN (MobileNetV2) to classify your plant and provide a short care description for it.

## Running evaluate.py

**1. Create and activate a virtual environment**

```bash
python -m venv venv
venv\Scripts\activate
```

**2. Install dependencies**

```bash
pip install -r requirements.txt
```

**3. Run the evaluation script**

```bash
py evaluate.py
```

This will run inference on the validation set using the TFLite model and output a classification report and confusion matrix.