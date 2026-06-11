import os
os.environ['TF_DIRECTML_KERNEL_FALLBACK'] = '1'
import json
import numpy as np
import pandas as pd
import tensorflow as tf
tf.config.set_visible_devices([], 'GPU')
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
from tensorflow.keras.layers import Input, Dense, Dropout, GlobalAveragePooling2D
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import ModelCheckpoint, EarlyStopping, ReduceLROnPlateau
from sklearn.model_selection import StratifiedKFold
from sklearn.utils.class_weight import compute_class_weight
from matplotlib import pyplot as plt

print("TensorFlow version:", tf.__version__)

# ---------------- Configuration ----------------
SOURCE_DATASET = 'C:\\Users\\frede\\Documents\\vscodeSchoo\\house_plant_species'
SAVE_DIR       = 'C:\\Users\\frede\\Documents\\vscodeSchoo\\plant_app\\plant_app_model'  

TARGET_SIZE   = 224
BATCH_SIZE    = 32
N_FOLDS       = 5      
EPOCHS_FROZEN = 10    
EPOCHS_FINE   = 30     
LR_FROZEN     = 1e-3
LR_FINE       = 1e-4   
UNFREEZE_FROM = 100    

RUN_KFOLD       = True   
TRAIN_FINAL     = True   

os.makedirs(SAVE_DIR, exist_ok=True)

# ---------------- Build dataframe of all images ----------------
filepaths, labels = [], []
for plant_class in sorted(os.listdir(SOURCE_DATASET)):
    class_path = os.path.join(SOURCE_DATASET, plant_class)
    if not os.path.isdir(class_path):
        continue
    for img in os.listdir(class_path):
        filepaths.append(os.path.join(class_path, img))
        labels.append(plant_class)

df = pd.DataFrame({'filepath': filepaths, 'label': labels})
class_names = sorted(df['label'].unique())
num_classes = len(class_names)
print(f'{len(df)} images, {num_classes} classes')
print(df['label'].value_counts().sort_values())

# ---------------- Generators ----------------
train_datagen = ImageDataGenerator(
    preprocessing_function=preprocess_input,
    rotation_range=25,
    width_shift_range=0.15,
    height_shift_range=0.15,
    shear_range=0.15,
    zoom_range=0.25,
    horizontal_flip=True,
    brightness_range=(0.7, 1.3),   
    channel_shift_range=20.0,      
    fill_mode='nearest'
)
val_datagen = ImageDataGenerator(preprocessing_function=preprocess_input)

def make_gen(datagen, frame, shuffle):
    return datagen.flow_from_dataframe(
        frame, x_col='filepath', y_col='label',
        target_size=(TARGET_SIZE, TARGET_SIZE),
        batch_size=BATCH_SIZE, class_mode='categorical',
        classes=class_names,          
        shuffle=shuffle
    )

# ---------------- Model ----------------
def build_model():
    base = MobileNetV2(input_shape=(TARGET_SIZE, TARGET_SIZE, 3),
                       include_top=False, weights='imagenet')
    base.trainable = False

    inputs = Input(shape=(TARGET_SIZE, TARGET_SIZE, 3))

    x = base(inputs, training=False)
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation='relu')(x)
    x = Dropout(0.3)(x)
    outputs = Dense(num_classes, activation='softmax')(x)
    return Model(inputs, outputs), base

def get_class_weights(frame):
    y = frame['label'].map({c: i for i, c in enumerate(class_names)}).values
    w = compute_class_weight('balanced', classes=np.arange(num_classes), y=y)
    return dict(enumerate(w))

def train_two_phase(model, base, train_gen, val_gen, class_weights, ckpt_path):
    callbacks = [
        ModelCheckpoint(ckpt_path, monitor='val_accuracy',
                        save_best_only=True, verbose=1),
        EarlyStopping(monitor='val_accuracy', patience=5,
                      restore_best_weights=True, verbose=1),
        ReduceLROnPlateau(monitor='val_loss', factor=0.5,
                          patience=2, min_lr=1e-6, verbose=1),
    ]

    # Phase 1 — frozen base, train the head
    model.compile(optimizer=Adam(LR_FROZEN),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    h1 = model.fit(train_gen, validation_data=val_gen,
                   epochs=EPOCHS_FROZEN, class_weight=class_weights,
                   callbacks=callbacks)

    # Phase 2 — unfreeze top of the base, low LR
    base.trainable = True
    for layer in base.layers[:UNFREEZE_FROM]:
        layer.trainable = False
    model.compile(optimizer=Adam(LR_FINE),
                  loss='categorical_crossentropy', metrics=['accuracy'])
    h2 = model.fit(train_gen, validation_data=val_gen,
                   epochs=EPOCHS_FINE, class_weight=class_weights,
                   callbacks=callbacks)

    history = {k: h1.history[k] + h2.history[k] for k in h1.history}
    return history


fold_accuracies = []
if RUN_KFOLD:
    skf = StratifiedKFold(n_splits=N_FOLDS, shuffle=True, random_state=42)
    for fold, (train_idx, val_idx) in enumerate(skf.split(df['filepath'], df['label']), 1):
        print(f'\n========== Fold {fold}/{N_FOLDS} ==========')
        train_df, val_df = df.iloc[train_idx], df.iloc[val_idx]

        train_gen = make_gen(train_datagen, train_df, shuffle=True)
        val_gen   = make_gen(val_datagen,   val_df,   shuffle=False)

        model, base = build_model()
        ckpt = os.path.join(SAVE_DIR, f'fold_{fold}.keras')
        train_two_phase(model, base, train_gen, val_gen,
                        get_class_weights(train_df), ckpt)

        loss, acc = model.evaluate(val_gen)
        fold_accuracies.append(acc)
        print(f'Fold {fold} val accuracy: {acc*100:.2f}%')

    accs = np.array(fold_accuracies)
    print(f'\nK-Fold result: {accs.mean()*100:.2f}% ± {accs.std()*100:.2f}%')
    print('Per fold:', [f'{a*100:.1f}%' for a in accs])


if TRAIN_FINAL:
    print('\n========== Final model (90/10) ==========')
    from sklearn.model_selection import train_test_split
    train_df, val_df = train_test_split(df, test_size=0.1, stratify=df['label'],
                                        random_state=42)
    train_gen = make_gen(train_datagen, train_df, shuffle=True)
    val_gen   = make_gen(val_datagen,   val_df,   shuffle=False)

    model, base = build_model()
    final_path = os.path.join(SAVE_DIR, 'best_model.keras')
    history = train_two_phase(model, base, train_gen, val_gen,
                              get_class_weights(train_df), final_path)

    loss, acc = model.evaluate(val_gen)
    print(f'Final model val accuracy: {acc*100:.2f}%')

    # Training history plot
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))
    ax1.plot(history['accuracy'], label='Train')
    ax1.plot(history['val_accuracy'], label='Val')
    ax1.axvline(EPOCHS_FROZEN - 0.5, color='gray', ls='--', label='Fine-tune start')
    ax1.set_title('Accuracy'); ax1.legend(); ax1.grid(True)
    ax2.plot(history['loss'], label='Train')
    ax2.plot(history['val_loss'], label='Val')
    ax2.axvline(EPOCHS_FROZEN - 0.5, color='gray', ls='--')
    ax2.set_title('Loss'); ax2.legend(); ax2.grid(True)
    plt.tight_layout()
    plt.savefig(os.path.join(SAVE_DIR, 'training_history.png'))
    plt.show()

    # Save class labels for the Expo app (fixed order = class_names)
    class_labels = {i: c for i, c in enumerate(class_names)}
    with open(os.path.join(SAVE_DIR, 'class_labels.json'), 'w') as f:
        json.dump(class_labels, f)

    # Export to TFLite
    converter = tf.lite.TFLiteConverter.from_keras_model(model)
    tflite_model = converter.convert()
    with open(os.path.join(SAVE_DIR, 'plant_model.tflite'), 'wb') as f:
        f.write(tflite_model)
    print('TFLite exported.')