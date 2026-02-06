# SRMAP Hybrid Captcha Solver

This project focuses on building a **hybrid deep learning model** to solve captchas used in the **SRMAP Student Portal and Parent Portal**.

The core of this repository is a **CRNN-based captcha recognition model (CNN + LSTM + CTC)** trained to work reliably across **both portals using a single model**. Alongside the model, a **production-ready FastAPI service** is provided to deploy the solver in real-world systems.

This solution is **actively used in production** by the **srmapi.in** website.

---

## Project Overview

- Primary focus: **Captcha recognition model**
- Secondary component: **Production-ready inference API**
- One hybrid model supports **student + parent portals**
- Designed for stability, scalability, and real usage

---

## Model Highlights

- CRNN architecture (CNN + BiLSTM + CTC)
- Handles variable-length captcha text
- Robust to noise and distortion
- Single model for multiple captcha formats

---

## Production API

A FastAPI-based inference service is included to deploy the model safely.

Key characteristics:
- Queue-based inference
- Single-worker execution (GPU/CPU safe)
- Plain-text responses
- Used in live production traffic

---

## API Usage

### Endpoint

POST `/captcha`

---

### Request Payload

- **Content-Type:** `multipart/form-data`
- **Field name:** `file`
- **Type:** Captcha image (PNG / JPG / JPEG)

#### Example

```bash
curl -X POST http://localhost:6000/captcha \
  -F "file=@captcha.png"
```

---

### Response

- **Content-Type:** `text/plain`
- **Body:** Decoded captcha text

#### Example

```
A7F9Q
```

---

## Credits

Built by:  
**Azam**  
**Brahmendra**

---

## Disclaimer

This project is intended for educational and research purposes related to SRMAP systems.  
Use responsibly and in accordance with applicable rules and policies.