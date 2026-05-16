import os
os.environ['TF_DIRECTML_KERNEL_FALLBACK'] = '1'
import numpy as np
import tensorflow as tf
tf.config.set_visible_devices([], 'GPU')
from tensorflow.keras.models import load_model
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.preprocessing import image
import matplotlib.pyplot as plt

# Load saved model and class labels
model = load_model('best_model.keras')

import json
with open('class_labels.json', 'r') as f:
    class_labels = json.load(f)

# ⚠️ Change this to any plant image on your machine
img_path = 'C:\\Users\\frede\\Documents\\vscodeSchoo\\snake.jpg'

# Preprocess — same as training
img = image.load_img(img_path, target_size=(224, 224), color_mode='rgb')
img_array = image.img_to_array(img)
img_array = np.expand_dims(img_array, axis=0)

# Predict
result = model.predict(preprocess_input(img_array))
predicted_index = np.argmax(result[0])
predicted_plant = class_labels[str(predicted_index)]
confidence = result[0][predicted_index] * 100

print(f'Predicted plant: {predicted_plant}')
print(f'Confidence:      {confidence:.2f}%')

plt.imshow(image.load_img(img_path, target_size=(224, 224)))
plt.title(f'{predicted_plant} ({confidence:.1f}%)')
plt.axis('off')
plt.show()