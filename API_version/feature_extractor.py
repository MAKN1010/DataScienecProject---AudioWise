import numpy as np
import librosa
import soundfile as sf

TARGET_SR = 16000
N_MFCC = 13


def aggregate(feat):

    return np.concatenate([
        np.mean(feat, axis=1),
        np.std(feat, axis=1),
        np.min(feat, axis=1),
        np.max(feat, axis=1),
        np.median(feat, axis=1),
        np.percentile(feat, 25, axis=1),
        np.percentile(feat, 75, axis=1),
    ])


def extract_feature_vector(audio_path):

    audio, sr = sf.read(audio_path)

    if len(audio.shape) > 1:
        audio = np.mean(audio, axis=1)

    if sr != TARGET_SR:
        audio = librosa.resample(
            audio,
            orig_sr=sr,
            target_sr=TARGET_SR
        )

    mfcc = librosa.feature.mfcc(
        y=audio,
        sr=TARGET_SR,
        n_mfcc=N_MFCC
    )

    delta = librosa.feature.delta(mfcc)

    delta2 = librosa.feature.delta(
        mfcc,
        order=2
    )

    features = np.vstack([
        mfcc,
        delta,
        delta2
    ])

    feature_vector = aggregate(features)

    return feature_vector.reshape(1, -1)