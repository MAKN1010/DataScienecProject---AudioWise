import os
import uuid
import joblib
import librosa

from fastapi import FastAPI
from fastapi import UploadFile
from fastapi import File
from fastapi import Request

from fastapi.responses import HTMLResponse

from fastapi.templating import Jinja2Templates

from fastapi.staticfiles import StaticFiles

from feature_extractor import extract_feature_vector
from visualizer import create_visualizations
from explain import generate_explanation


app = FastAPI(
    title="AudioWise Deepfake Detector"
)

app.mount(
    "/static",
    StaticFiles(directory="static"),
    name="static"
)

templates = Jinja2Templates(
    directory="templates"
)

os.makedirs(
    "uploads",
    exist_ok=True
)

model = joblib.load(
    "models/SVM.pkl"
)

scaler = joblib.load(
    "models/standard_scaler.joblib"
)


@app.get(
    "/",
    response_class=HTMLResponse
)
async def home(
    request: Request
):

    return templates.TemplateResponse(
        request=request,
        name="index.html"
    )


@app.get("/health")
def health():

    return {
        "status": "healthy",
        "model": "SVM"
    }


@app.post("/predict")
async def predict(
    file: UploadFile = File(...)
):

    extension = file.filename.split(".")[-1]

    temp_file = (
        f"uploads/{uuid.uuid4()}.{extension}"
    )

    try:

        # Save uploaded file
        with open(temp_file, "wb") as buffer:
            buffer.write(
                await file.read()
            )

        # Audio statistics
        audio, sr = librosa.load(
            temp_file,
            sr=None
        )

        duration = librosa.get_duration(
            y=audio,
            sr=sr
        )

        # Feature extraction
        X = extract_feature_vector(
            temp_file
        )

        X = scaler.transform(X)

        # Prediction
        probability = (
            model.predict_proba(X)[0][1]
        )

        prediction = int(
            probability >= 0.5
        )

        label = (
            "generated"
            if prediction == 1
            else "real"
        )

        confidence = round(
            probability * 100,
            2
        )

        # Explanation
        explanation = generate_explanation(
            probability
        )

        # Default visualization paths
        waveform = ""
        spectrogram = ""
        mel_spectrogram = ""

        # Visualization block
        try:

            print(
                "Generating visualizations..."
            )

            plots = create_visualizations(
                temp_file
            )

            waveform = (
                "/" +
                plots["waveform"]
            )

            spectrogram = (
                "/" +
                plots["spectrogram"]
            )

            mel_spectrogram = (
                "/" +
                plots["mel_spectrogram"]
            )

            print(
                "Visualizations generated."
            )

        except Exception as viz_error:

            print(
                f"Visualization Error: {viz_error}"
            )

        return {
            "success": True,
            "prediction": prediction,
            "label": label,
            "confidence": confidence,
            "model": "SVM",
            "duration": round(duration, 2),
            "sample_rate": sr,
            "explanation": explanation,
            "waveform": waveform,
            "spectrogram": spectrogram,
            "mel_spectrogram": mel_spectrogram
        }

    except Exception as e:

        print(
            f"Prediction Error: {e}"
        )

        return {
            "success": False,
            "error": str(e)
        }

    finally:

        if os.path.exists(
            temp_file
        ):
            os.remove(
                temp_file
            )
