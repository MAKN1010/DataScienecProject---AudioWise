import os
import numpy as np
import librosa
import librosa.display
import matplotlib.pyplot as plt


def create_visualizations(audio_file):

    os.makedirs(
        "static/plots",
        exist_ok=True
    )

    y, sr = librosa.load(
        audio_file,
        sr=None
    )

    # Waveform
    plt.figure(figsize=(10, 4))

    librosa.display.waveshow(
        y,
        sr=sr
    )

    plt.title("Waveform")

    waveform_path = (
        "static/plots/waveform.png"
    )

    plt.savefig(
        waveform_path,
        bbox_inches="tight"
    )

    plt.close()

    # Spectrogram

    stft = np.abs(
        librosa.stft(y)
    )

    D = librosa.amplitude_to_db(
        stft,
        ref=np.max
    )

    plt.figure(figsize=(10, 4))

    librosa.display.specshow(
        D,
        sr=sr,
        x_axis="time",
        y_axis="log"
    )

    plt.colorbar()

    plt.title("Spectrogram")

    spectrogram_path = (
        "static/plots/spectrogram.png"
    )

    plt.savefig(
        spectrogram_path,
        bbox_inches="tight"
    )

    plt.close()

    # Mel Spectrogram

    mel_spec = librosa.feature.melspectrogram(
        y=y,
        sr=sr,
        n_mels=128
    )

    mel_spec_db = librosa.power_to_db(
        mel_spec,
        ref=np.max
    )

    plt.figure(figsize=(10, 4))

    librosa.display.specshow(
        mel_spec_db,
        sr=sr,
        x_axis="time",
        y_axis="mel",
        cmap="magma"
    )

    plt.colorbar()

    plt.title(
        "Mel Spectrogram Heatmap"
    )

    mel_path = (
        "static/plots/mel_spectrogram.png"
    )

    plt.savefig(
        mel_path,
        bbox_inches="tight"
    )

    plt.close()

    return {
        "waveform": waveform_path,
        "spectrogram": spectrogram_path,
        "mel_spectrogram": mel_path
    }