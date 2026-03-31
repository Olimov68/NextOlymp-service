"""
Face Embedding Service - NextOlymp
Yuzlarni aniqlash va embedding generatsiya qilish uchun microservice.
OpenCV DNN + ONNX model (yuzsiz ishlaydi ham, OpenCV face detector).
"""

import os
import json
import numpy as np
import cv2
from flask import Flask, request, jsonify
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# OpenCV yuz detektori (DNN based - aniq va tez)
PROTO_PATH = os.path.join(os.path.dirname(__file__), "models", "deploy.prototxt")
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "res10_300x300_ssd_iter_140000.caffemodel")
EMBEDDER_PATH = os.path.join(os.path.dirname(__file__), "models", "openface_nn4.small2.v1.t7")

face_net = None
embedder_net = None

SIMILARITY_THRESHOLD = 0.75  # 75% o'xshashlik — dublikat deb hisoblanadi


def load_models():
    global face_net, embedder_net
    if face_net is None:
        if os.path.exists(PROTO_PATH) and os.path.exists(MODEL_PATH):
            face_net = cv2.dnn.readNetFromCaffe(PROTO_PATH, MODEL_PATH)
            print("[OK] Face detector model loaded")
        else:
            print("[WARN] Face detector model not found, using Haar cascade")

    if embedder_net is None:
        if os.path.exists(EMBEDDER_PATH):
            embedder_net = cv2.dnn.readNetFromTorch(EMBEDDER_PATH)
            print("[OK] Face embedder model loaded")
        else:
            print("[WARN] Face embedder model not found")


def detect_face(image):
    """Rasmdan yuzni aniqlash va kesib olish"""
    (h, w) = image.shape[:2]

    if face_net is not None:
        # DNN face detector
        blob = cv2.dnn.blobFromImage(cv2.resize(image, (300, 300)), 1.0,
                                      (300, 300), (104.0, 177.0, 123.0))
        face_net.setInput(blob)
        detections = face_net.forward()

        best_confidence = 0
        best_box = None

        for i in range(detections.shape[2]):
            confidence = detections[0, 0, i, 2]
            if confidence > 0.5 and confidence > best_confidence:
                best_confidence = confidence
                box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
                best_box = box.astype("int")

        if best_box is not None:
            (x1, y1, x2, y2) = best_box
            # Biroz kattaroq kesish
            pad = 20
            x1 = max(0, x1 - pad)
            y1 = max(0, y1 - pad)
            x2 = min(w, x2 + pad)
            y2 = min(h, y2 + pad)
            return image[y1:y2, x1:x2], float(best_confidence)
    else:
        # Fallback: Haar cascade
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        cascade = cv2.CascadeClassifier(cv2.data.haarcascades + "haarcascade_frontalface_default.xml")
        faces = cascade.detectMultiScale(gray, 1.1, 5, minSize=(80, 80))
        if len(faces) > 0:
            (x, y, fw, fh) = max(faces, key=lambda f: f[2] * f[3])
            return image[y:y+fh, x:x+fw], 0.9

    return None, 0.0


def get_face_embedding(face_image):
    """Yuz rasmidan 128-o'lchovli embedding vektor olish"""
    if embedder_net is not None:
        face_blob = cv2.dnn.blobFromImage(face_image, 1.0 / 255,
                                           (96, 96), (0, 0, 0), swapRB=True, crop=False)
        embedder_net.setInput(face_blob)
        vec = embedder_net.forward()
        return vec.flatten().tolist()
    else:
        # Fallback: pixel-based histogram embedding (oddiy, lekin ishlaydi)
        face_resized = cv2.resize(face_image, (64, 64))
        hsv = cv2.cvtColor(face_resized, cv2.COLOR_BGR2HSV)

        # Histogram features
        hist_h = cv2.calcHist([hsv], [0], None, [32], [0, 180]).flatten()
        hist_s = cv2.calcHist([hsv], [1], None, [32], [0, 256]).flatten()
        hist_v = cv2.calcHist([hsv], [2], None, [32], [0, 256]).flatten()

        # LBP-like texture features
        gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
        gray = gray.astype(np.float32) / 255.0
        texture = gray.flatten()[:32]

        embedding = np.concatenate([hist_h, hist_s, hist_v, texture])
        # Normalize
        norm = np.linalg.norm(embedding)
        if norm > 0:
            embedding = embedding / norm
        return embedding.tolist()


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "face_detector": face_net is not None,
                    "embedder": embedder_net is not None})


@app.route("/embed", methods=["POST"])
def embed():
    """Rasm faylidan yuz embeddingni olish"""
    if "photo" not in request.files:
        return jsonify({"error": "photo fayli kerak"}), 400

    file = request.files["photo"]
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return jsonify({"error": "Rasmni o'qib bo'lmadi"}), 400

    face, confidence = detect_face(image)
    if face is None:
        return jsonify({"error": "Rasmda yuz topilmadi", "face_found": False}), 400

    embedding = get_face_embedding(face)
    return jsonify({
        "embedding": embedding,
        "confidence": confidence,
        "face_found": True,
        "dimensions": len(embedding),
    })


@app.route("/compare", methods=["POST"])
def compare():
    """Ikki embeddingni solishtirish"""
    data = request.get_json()
    if not data or "embedding1" not in data or "embedding2" not in data:
        return jsonify({"error": "embedding1 va embedding2 kerak"}), 400

    e1 = np.array(data["embedding1"]).reshape(1, -1)
    e2 = np.array(data["embedding2"]).reshape(1, -1)

    similarity = cosine_similarity(e1, e2)[0][0]
    return jsonify({
        "similarity": float(similarity),
        "is_match": float(similarity) >= SIMILARITY_THRESHOLD,
        "threshold": SIMILARITY_THRESHOLD,
    })


@app.route("/proctor-check", methods=["POST"])
def proctor_check():
    """
    Proctoring tekshiruvi:
    1. Yuz soni (0, 1, yoki ko'p)
    2. Yuz joylashuvi (markazda yoki chetda)
    3. Bosh burchagi (to'g'ri qarayaptimi)
    4. Yuz embedding (ro'yhatdagi yuz bilan taqqoslash uchun)
    """
    if "photo" not in request.files:
        return jsonify({"error": "photo fayli kerak"}), 400

    file = request.files["photo"]
    img_bytes = file.read()
    nparr = np.frombuffer(img_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    if image is None:
        return jsonify({"error": "Rasmni o'qib bo'lmadi"}), 400

    (h, w) = image.shape[:2]
    result = {
        "face_count": 0,
        "face_found": False,
        "face_centered": False,
        "head_pose": "unknown",
        "embedding": None,
        "confidence": 0.0,
        "violations": [],
    }

    if face_net is None:
        return jsonify({"error": "Face detector not loaded"}), 500

    # Barcha yuzlarni aniqlash
    blob = cv2.dnn.blobFromImage(cv2.resize(image, (300, 300)), 1.0,
                                  (300, 300), (104.0, 177.0, 123.0))
    face_net.setInput(blob)
    detections = face_net.forward()

    faces = []
    for i in range(detections.shape[2]):
        confidence = detections[0, 0, i, 2]
        if confidence > 0.5:
            box = detections[0, 0, i, 3:7] * np.array([w, h, w, h])
            (x1, y1, x2, y2) = box.astype("int")
            faces.append({
                "x1": int(max(0, x1)),
                "y1": int(max(0, y1)),
                "x2": int(min(w, x2)),
                "y2": int(min(h, y2)),
                "confidence": float(confidence),
            })

    result["face_count"] = len(faces)

    if len(faces) == 0:
        result["violations"].append({
            "type": "no_face",
            "message": "Yuz topilmadi — kamera oldida odam yo'q",
        })
        return jsonify(result)

    if len(faces) > 1:
        result["violations"].append({
            "type": "multiple_faces",
            "message": f"{len(faces)} ta yuz aniqlandi — yordamchi shaxs",
        })

    # Asosiy yuz — eng katta va markazga yaqin
    best_face = max(faces, key=lambda f: (f["x2"] - f["x1"]) * (f["y2"] - f["y1"]))
    result["face_found"] = True
    result["confidence"] = best_face["confidence"]

    fx1, fy1, fx2, fy2 = best_face["x1"], best_face["y1"], best_face["x2"], best_face["y2"]
    face_w = fx2 - fx1
    face_h = fy2 - fy1
    face_cx = (fx1 + fx2) / 2
    face_cy = (fy1 + fy2) / 2

    # === Yuz markazda ekanligini tekshirish ===
    center_x_ratio = face_cx / w
    center_y_ratio = face_cy / h
    # Yuz rasmning markaziy 60% qismida bo'lishi kerak
    if 0.2 <= center_x_ratio <= 0.8 and 0.15 <= center_y_ratio <= 0.85:
        result["face_centered"] = True
    else:
        result["violations"].append({
            "type": "face_not_centered",
            "message": "Yuz markazda emas — iltimos kameraga to'g'ri qarang",
        })

    # === Bosh burchagi (Head Pose Estimation) ===
    # Yuz nisbatlaridan bosh yo'nalishini taxmin qilish
    face_aspect = face_w / max(face_h, 1)
    x_offset = (face_cx - w / 2) / (w / 2)  # -1 dan 1 gacha
    y_offset = (face_cy - h / 2) / (h / 2)

    if abs(x_offset) > 0.4:
        # Yuz chapga yoki o'ngga burilgan
        direction = "chapga" if x_offset < 0 else "o'ngga"
        result["head_pose"] = f"turned_{direction}"
        result["violations"].append({
            "type": "head_turned",
            "message": f"Bosh {direction} burilgan — to'g'ri qarang",
            "offset": round(float(x_offset), 2),
        })
    elif abs(y_offset) > 0.4:
        direction = "pastga" if y_offset > 0 else "tepaga"
        result["head_pose"] = f"turned_{direction}"
        result["violations"].append({
            "type": "head_turned",
            "message": f"Bosh {direction} burilgan — to'g'ri qarang",
            "offset": round(float(y_offset), 2),
        })
    elif face_aspect < 0.55:
        # Yuz juda tor — yon tomondan qarayapti
        result["head_pose"] = "turned_side"
        result["violations"].append({
            "type": "head_turned",
            "message": "Yuz yon tomondan ko'rinayapti — to'g'ri qarang",
        })
    else:
        result["head_pose"] = "forward"

    # === Yuz hajmi tekshirish ===
    face_area_ratio = (face_w * face_h) / (w * h)
    if face_area_ratio < 0.02:
        result["violations"].append({
            "type": "face_too_far",
            "message": "Yuz juda uzoqda — kameraga yaqinroq keling",
        })
    elif face_area_ratio > 0.6:
        result["violations"].append({
            "type": "face_too_close",
            "message": "Yuz juda yaqin — kameradan biroz uzoqlashing",
        })

    # === Embedding olish (taqqoslash uchun) ===
    pad = 20
    crop_x1 = max(0, fx1 - pad)
    crop_y1 = max(0, fy1 - pad)
    crop_x2 = min(w, fx2 + pad)
    crop_y2 = min(h, fy2 + pad)
    face_crop = image[crop_y1:crop_y2, crop_x1:crop_x2]

    if face_crop.size > 0:
        embedding = get_face_embedding(face_crop)
        result["embedding"] = embedding

    # Optional: stored embedding bilan taqqoslash
    stored_embedding_json = request.form.get("stored_embedding")
    if stored_embedding_json and result["embedding"]:
        try:
            stored_emb = json.loads(stored_embedding_json)
            e1 = np.array(result["embedding"]).reshape(1, -1)
            e2 = np.array(stored_emb).reshape(1, -1)
            if e1.shape[1] == e2.shape[1]:
                similarity = cosine_similarity(e1, e2)[0][0]
                result["face_match"] = {
                    "similarity": float(similarity),
                    "is_match": float(similarity) >= 0.60,  # Proctoring uchun 60% yetarli
                    "threshold": 0.60,
                }
                if float(similarity) < 0.60:
                    result["violations"].append({
                        "type": "face_mismatch",
                        "message": f"Yuz ro'yhatdagi shaxsga mos kelmaydi (o'xshashlik: {similarity:.0%})",
                        "similarity": float(similarity),
                    })
        except (json.JSONDecodeError, ValueError):
            pass

    return jsonify(result)


@app.route("/check-duplicate", methods=["POST"])
def check_duplicate():
    """Yangi yuzni mavjud embeddinglar bilan solishtirish"""
    data = request.get_json()
    if not data or "new_embedding" not in data or "existing_embeddings" not in data:
        return jsonify({"error": "new_embedding va existing_embeddings kerak"}), 400

    new_emb = np.array(data["new_embedding"]).reshape(1, -1)
    existing = data["existing_embeddings"]  # [{user_id, embedding}, ...]

    matches = []
    for item in existing:
        if not item.get("embedding"):
            continue
        old_emb = np.array(item["embedding"]).reshape(1, -1)

        # Dimension mismatch bo'lsa, skip
        if new_emb.shape[1] != old_emb.shape[1]:
            continue

        similarity = cosine_similarity(new_emb, old_emb)[0][0]
        if similarity >= SIMILARITY_THRESHOLD:
            matches.append({
                "user_id": item.get("user_id"),
                "username": item.get("username", ""),
                "similarity": float(similarity),
            })

    matches.sort(key=lambda x: x["similarity"], reverse=True)
    return jsonify({
        "is_duplicate": len(matches) > 0,
        "matches": matches[:5],  # Top 5 match
        "threshold": SIMILARITY_THRESHOLD,
    })


if __name__ == "__main__":
    load_models()
    print(f"\n[Face Service] Starting on port 9000...")
    print(f"[Face Service] Threshold: {SIMILARITY_THRESHOLD}")
    app.run(host="0.0.0.0", port=9000, debug=False)
