"""Jal-Bharav Watch training (PRD 11.2). MobileNetV3-Small transfer learning, 224 px.

Usage: python ml/sky_snap/train.py --data DATA --out OUT
DATA has train/ and val/ (and ideally test/) folders with one sub-folder per
class: flooded_street, wet_not_flooded, not_relevant. Add 300 to 500 Indian street photos (wet and dry) to reduce the domain gap.
Check the flood dataset licences before training or redistributing.
"""
import argparse
import json
import os

import tensorflow as tf

IMG = 224


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--epochs", type=int, default=15)
    ap.add_argument("--finetune-epochs", type=int, default=10)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)

    load = lambda split, shuffle: tf.keras.utils.image_dataset_from_directory(
        os.path.join(a.data, split), image_size=(IMG, IMG), batch_size=32, label_mode="categorical", shuffle=shuffle
    )
    train_ds, val_ds = load("train", True), load("val", False)
    labels = train_ds.class_names

    aug = tf.keras.Sequential([
        tf.keras.layers.RandomFlip("horizontal"),
        tf.keras.layers.RandomRotation(0.05),
        tf.keras.layers.RandomZoom(0.1),
        tf.keras.layers.RandomContrast(0.2),
    ])
    base = tf.keras.applications.MobileNetV3Small(input_shape=(IMG, IMG, 3), include_top=False, weights="imagenet", include_preprocessing=True)
    base.trainable = False
    x_in = tf.keras.Input((IMG, IMG, 3))
    x = base(aug(x_in), training=False)
    x = tf.keras.layers.GlobalAveragePooling2D()(x)
    x = tf.keras.layers.Dropout(0.3)(x)
    out = tf.keras.layers.Dense(len(labels), activation="softmax")(x)
    model = tf.keras.Model(x_in, out)

    model.compile(optimizer=tf.keras.optimizers.Adam(1e-3), loss="categorical_crossentropy", metrics=["accuracy"])
    model.fit(train_ds, validation_data=val_ds, epochs=a.epochs)
    base.trainable = True
    for layer in base.layers[:-30]:
        layer.trainable = False
    model.compile(optimizer=tf.keras.optimizers.Adam(1e-5), loss="categorical_crossentropy", metrics=["accuracy"])
    model.fit(train_ds, validation_data=val_ds, epochs=a.finetune_epochs)

    model.save(os.path.join(a.out, "jal_bharav.keras"))
    json.dump(labels, open(os.path.join(a.out, "labels.json"), "w"))
    json.dump({"inputSize": IMG, "range": "0-255", "version": "jalbharav-mnv3s-1.0"}, open(os.path.join(a.out, "config.json"), "w"))

    test_dir = os.path.join(a.data, "test")
    if os.path.isdir(test_dir):
        test_ds = tf.keras.utils.image_dataset_from_directory(test_dir, image_size=(IMG, IMG), batch_size=32, label_mode="categorical", shuffle=False)
        loss, acc = model.evaluate(test_ds)
        json.dump({"test_accuracy": acc, "test_images": int(sum(1 for _ in test_ds.unbatch()))}, open(os.path.join(a.out, "metrics.json"), "w"))
        print("Measured test accuracy:", acc)


if __name__ == "__main__":
    main()
