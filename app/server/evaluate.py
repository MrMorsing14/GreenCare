import os
os.environ['CUDA_VISIBLE_DEVICES'] = '-1'
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from sklearn.metrics import classification_report, confusion_matrix
import matplotlib.pyplot as plt
import seaborn as sns

# Load TFLite model
model_path = os.path.join(os.path.dirname(__file__), 'plant_model.tflite')
interpreter = tf.lite.Interpreter(model_path=model_path)
interpreter.allocate_tensors()

input_details = interpreter.get_input_details()
output_details = interpreter.get_output_details()

# Load validation set
test_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)
test_set = test_datagen.flow_from_directory(
    'C:\\Users\\frede\\Documents\\vscodeSchoo\\house_plant_species_split\\val',
    target_size=(224, 224),
    batch_size=1,
    class_mode='categorical',
    color_mode='rgb',
    shuffle=False
)

# Run inference on each image
predicted_classes = []
for i in range(len(test_set)):
    img, _ = test_set[i]
    interpreter.set_tensor(input_details[0]['index'], img.astype(np.float32))
    interpreter.invoke()
    output = interpreter.get_tensor(output_details[0]['index'])
    predicted_classes.append(np.argmax(output))

predicted_classes = np.array(predicted_classes)
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
plt.title('Confusion Matrix — MobileNetV2 TFLite')
plt.xticks(rotation=90)
plt.tight_layout()
plt.savefig('confusion_matrix.png', dpi=150)
plt.show()
