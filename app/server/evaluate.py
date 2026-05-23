import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
import numpy as np
import tensorflow as tf
from tensorflow.keras.models import load_model
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# Load your saved model
model = load_model('best_model.keras')

# Load validation set — same settings as training
test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
test_set = test_datagen.flow_from_directory(
    'C:\\Users\\frede\\Documents\\vscodeSchoo\\house_plant_species_split\\val',
    target_size=(224, 224),
    batch_size=32,
    class_mode='categorical',
    color_mode='rgb',
    shuffle=False  # important! keeps predictions aligned with true labels
)

# Predict entire validation set
predictions = model.predict(test_set)
predicted_classes = np.argmax(predictions, axis=1)
true_classes = test_set.classes
class_names = list(test_set.class_indices.keys())

# Print per-class report
print(classification_report(true_classes, predicted_classes, target_names=class_names))

# Plot confusion matrix
cm = confusion_matrix(true_classes, predicted_classes)
plt.figure(figsize=(20, 16))
sns.heatmap(cm, annot=True, fmt='d', cmap='Greens',
            xticklabels=class_names, yticklabels=class_names)
plt.xlabel('Predicted')
plt.ylabel('Actual')
plt.title('Confusion Matrix — MobileNetV2 Transfer Learning')
plt.xticks(rotation=90)
plt.tight_layout()
plt.savefig('confusion_matrix.png', dpi=150)
plt.show()