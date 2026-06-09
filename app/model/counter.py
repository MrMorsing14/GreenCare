import os
from pathlib import Path

dataset_path = Path("train")  # adjust this

counts = {}
for class_dir in sorted(dataset_path.iterdir()):
    if class_dir.is_dir():
        n = len([f for f in class_dir.iterdir() if f.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'}])
        counts[class_dir.name] = n

for name, n in sorted(counts.items(), key=lambda x: x[1]):
    print(f"{n:>5}  {name}")

print(f"\n{'Total':>5}  {sum(counts.values())} images across {len(counts)} classes")