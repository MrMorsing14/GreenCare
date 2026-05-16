
#Plant Classifier — CNN with MobileNetV2 Transfer Learning


import os
os.environ['TF_DIRECTML_KERNEL_FALLBACK'] = '1'
import json
import random
import shutil
import numpy as np
import tensorflow as tf
tf.config.set_visible_devices([], 'GPU')
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping
from tensorflow.keras.models import load_model
from keras.preprocessing import image
from matplotlib import pyplot as plt
  # Enable DirectML fallback for AMD GPUs (optional, but can help with compatibility)
# =============================================================================
# STEP 1 — Verify GPU
# =============================================================================
print("TensorFlow version:", tf.__version__)
print("GPU available:", tf.config.list_physical_devices('GPU'))
# Should print: [PhysicalDevice(name='/physical_device:GPU:0', device_type='GPU')]
# If it prints [] then TensorFlow can't see your GPU — check CUDA installation

# =============================================================================
# STEP 2 — Configuration
# ⚠️ UPDATE THESE PATHS to where your dataset is on your machine
# =============================================================================
SOURCE_DATASET = 'C:\\Users\\frede\\Documents\\vscodeSchoo\\house_plant_species'
SPLIT_DATASET  = 'C:\\Users\\frede\\Documents\\vscodeSchoo\\house_plant_species_split'
SAVE_PATH      = 'C:\\Users\\frede\\Documents\\vscodeSchoo\\plant_app\\best_model.keras'

# Image settings
targetSize  = 224        # 224x224 pixels — standard for MobileNetV2
color       = 'rgb'      # color images
classMode   = 'categorical'  # multi-class (47 plants)
batch_size  = 32

# Training settings
epochs        = 30
learning_rate = 0.001

# =============================================================================
# STEP 3 — Split dataset into train/val (80/20)
# Only run this ONCE — it copies images into a new folder structure
# Comment out this block after first run
# =============================================================================
def split_dataset(source, dest, split=0.8):
    if os.path.exists(dest):
        print(f'Split folder already exists at {dest} — skipping split.')
        return

    print('Splitting dataset 80/20...')
    for plant_class in os.listdir(source):
        class_path = os.path.join(source, plant_class)
        if not os.path.isdir(class_path):
            continue

        images = os.listdir(class_path)
        random.shuffle(images)
        cut = int(len(images) * split)
        train_imgs = images[:cut]
        val_imgs   = images[cut:]

        for split_name, split_imgs in [('train', train_imgs), ('val', val_imgs)]:
            out_dir = os.path.join(dest, split_name, plant_class)
            os.makedirs(out_dir, exist_ok=True)
            for img in split_imgs:
                shutil.copy(os.path.join(class_path, img), os.path.join(out_dir, img))

    print('Split done!')

split_dataset(SOURCE_DATASET, SPLIT_DATASET)

trainingFiles   = os.path.join(SPLIT_DATASET, 'train')
validationFiles = os.path.join(SPLIT_DATASET, 'val')

# =============================================================================
# STEP 4 — ImageDataGenerator (Data Augmentation)
# Same concept as professor's example — distort/zoom/rotate to reduce overfitting
# preprocess_input replaces rescale=1./255 — MobileNetV2 expects pixels in range -1 to 1
# =============================================================================
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,  # MobileNetV2 specific — replaces rescale=1./255
    shear_range=0.2,        # distort the image sideways
    zoom_range=0.2,         # zoom in a little
    rotation_range=20,      # rotate up to 20 degrees
    width_shift_range=0.2,  # shift image left/right
    height_shift_range=0.2, # shift image up/down
    horizontal_flip=True    # mirror image — valid for plants
)

test_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input  # no augmentation on validation, just preprocess
)

training_set = train_datagen.flow_from_directory(
    trainingFiles,
    target_size=(targetSize, targetSize),
    batch_size=batch_size,
    class_mode=classMode,
    color_mode=color
)

test_set = test_datagen.flow_from_directory(
    validationFiles,
    target_size=(targetSize, targetSize),
    batch_size=batch_size,
    class_mode=classMode,
    color_mode=color
)

num_classes = len(training_set.class_indices)
print('Classes found:', training_set.class_indices)
print('Number of classes:', num_classes)

# =============================================================================
# STEP 5 — Build the Model (MobileNetV2 Transfer Learning)
# MobileNetV2 is pretrained on ImageNet — it already knows edges, shapes, textures
# We freeze it and add our own classifier on top (same style as professor's Dense layers)
#
# Structure:
#   MobileNetV2 (frozen)         ← already knows how to see
#       ↓
#   GlobalAveragePooling2D       ← our layer
#       ↓
#   Dense(128, relu)             ← our layer
#       ↓
#   Dropout(0.3)                 ← our layer
#       ↓
#   Dense(47, softmax)           ← our output layer — one per plant
# =============================================================================
with tf.device('/CPU:0'):
    base_model = MobileNetV2(input_shape=(224, 224, 3), include_top=False, weights='imagenet')
    base_model.trainable = False

    model = Sequential([
        base_model,
        GlobalAveragePooling2D(),
        Dense(128, activation='relu'),
        Dropout(0.3),
        Dense(num_classes, activation='softmax')
    ])

adam = Adam(learning_rate=learning_rate)
model.compile(
    optimizer=adam,
    loss='categorical_crossentropy',
    metrics=['accuracy']
)
model.summary()

# =============================================================================
# STEP 6 — Train the Model
# Same as professor's model.fit() — added checkpoint and early stopping
# =============================================================================
os.makedirs(os.path.dirname(SAVE_PATH), exist_ok=True)

checkpoint = ModelCheckpoint(
    SAVE_PATH,
    monitor='val_accuracy',
    save_best_only=True,
    verbose=1
)

early_stop = EarlyStopping(
    monitor='val_accuracy',
    patience=5,
    restore_best_weights=True,
    verbose=1
)

history = model.fit(
    x=training_set,
    epochs=epochs,
    validation_data=test_set,
    callbacks=[checkpoint, early_stop]
)

# =============================================================================
# STEP 7 — Evaluate the Model
# Same as professor's model.evaluate(test_set)
# =============================================================================
loss, accuracy = model.evaluate(test_set)
print(f'\nValidation Loss:     {loss:.4f}')
print(f'Validation Accuracy: {accuracy*100:.2f}%')

# =============================================================================
# STEP 8 — Plot Training History
# =============================================================================
fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

ax1.plot(history.history['accuracy'], label='Training Accuracy')
ax1.plot(history.history['val_accuracy'], label='Validation Accuracy')
ax1.set_title('Model Accuracy')
ax1.set_xlabel('Epoch')
ax1.set_ylabel('Accuracy')
ax1.legend()
ax1.grid(True)

ax2.plot(history.history['loss'], label='Training Loss')
ax2.plot(history.history['val_loss'], label='Validation Loss')
ax2.set_title('Model Loss')
ax2.set_xlabel('Epoch')
ax2.set_ylabel('Loss')
ax2.legend()
ax2.grid(True)

plt.tight_layout()
plt.show()

# =============================================================================
# STEP 9 — Single Image Prediction
# Same approach as professor's example — load, preprocess, predict
# ⚠️ UPDATE singlePred to a plant image on your machine
# =============================================================================
class_labels = {v: k for k, v in training_set.class_indices.items()}
print('Class label map:', class_labels)

# Save class labels for Expo app
labels_path = os.path.join(os.path.dirname(SAVE_PATH), 'class_labels.json')
with open(labels_path, 'w') as f:
    json.dump(class_labels, f)
print('Class labels saved to:', labels_path)

singlePred = 'C:\\Users\\frede\\Documents\\vscodeSchoo\\monst.jpg' 

test_image = image.load_img(singlePred, target_size=[targetSize, targetSize], color_mode=color)
test_image = image.img_to_array(test_image)        # convert to array — same as professor
test_image = np.expand_dims(test_image, axis=0)    # add batch dimension — same as professor

result = model.predict(preprocess_input(test_image))  # preprocess_input instead of /255.0

predicted_index = np.argmax(result[0])
predicted_plant = class_labels[predicted_index]
confidence      = result[0][predicted_index] * 100

print(f'Predicted plant: {predicted_plant}')
print(f'Confidence:      {confidence:.2f}%')

plt.imshow(image.load_img(singlePred, target_size=[targetSize, targetSize]))
plt.title(f'Prediction: {predicted_plant} ({confidence:.1f}%)')
plt.axis('off')
plt.show()

# =============================================================================
# STEP 10 — Export to TFLite for Expo App
# =============================================================================
converter   = tf.lite.TFLiteConverter.from_keras_model(model)
tflite_model = converter.convert()

tflite_path = os.path.join(os.path.dirname(SAVE_PATH), 'plant_model.tflite')
with open(tflite_path, 'wb') as f:
    f.write(tflite_model)

print('TFLite model saved to:', tflite_path)
print('Class labels saved to:', labels_path)
print('\nBoth files are ready for your Expo app!')