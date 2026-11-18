const fileInput = document.getElementById('audioFile');
const dropZone = document.getElementById('dropZone');
const selectedFile = document.getElementById('selectedFile');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const audioPreview = document.getElementById('audioPreview');
const player = document.getElementById('player');
const removeFileButton = document.getElementById('removeFile');
const analyzeButton = document.getElementById('analyzeButton');
const resultPanel = document.getElementById('resultPanel');
const resultSubtitle = document.getElementById('result-subtitle');
const emptyState = document.getElementById('emptyState');
const loadingState = document.getElementById('loadingState');
const errorState = document.getElementById('errorState');
const errorMessage = document.getElementById('errorMessage');
const resultContent = document.getElementById('resultContent');
const imageLightbox = document.getElementById('imageLightbox');
const lightboxTitle = document.getElementById('lightboxTitle');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.getElementById('lightboxClose');

let currentFile = null;
let previewUrl = null;
let gaugeChart = null;
let isAnalyzing = false;

const acceptedExtensions = new Set(['wav', 'mp3', 'flac', 'ogg']);

function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function setResultState(state) {
    emptyState.hidden = state !== 'empty';
    loadingState.hidden = state !== 'loading';
    errorState.hidden = state !== 'error';
    resultContent.hidden = state !== 'success';
    resultPanel.setAttribute('aria-busy', String(state === 'loading'));

    if (state === 'empty') resultSubtitle.textContent = 'Your results will appear here.';
    if (state === 'loading') resultSubtitle.textContent = 'Processing your audio signal.';
    if (state === 'error') resultSubtitle.textContent = 'Please review the message below.';
    if (state === 'success') resultSubtitle.textContent = 'Analysis complete.';
}

function setFile(file) {
    if (!file || isAnalyzing) return;

    const extension = file.name.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (!acceptedExtensions.has(extension)) {
        fileInput.value = '';
        showError('Choose a WAV, MP3, FLAC, or OGG audio file.');
        return;
    }

    currentFile = file;
    fileName.textContent = file.name;
    fileSize.textContent = formatFileSize(file.size);
    selectedFile.hidden = false;
    dropZone.hidden = true;
    audioPreview.hidden = false;
    analyzeButton.disabled = false;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    player.src = previewUrl;
    player.load();

    setResultState('empty');
}

function clearFile() {
    if (isAnalyzing) return;

    currentFile = null;
    fileInput.value = '';
    player.pause();
    player.removeAttribute('src');
    player.load();
    audioPreview.hidden = true;
    selectedFile.hidden = true;
    dropZone.hidden = false;
    analyzeButton.disabled = true;

    if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        previewUrl = null;
    }

    if (gaugeChart) {
        gaugeChart.destroy();
        gaugeChart = null;
    }
    resultContent.replaceChildren();
    setResultState('empty');
}

function showError(message) {
    errorMessage.textContent = message;
    setResultState('error');
}

function escapeHtml(value) {
    return String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#039;');
}

function makeStat(label, value, unit) {
    if (value === undefined || value === null) return '';
    return `<div class="stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}${unit}</strong></div>`;
}

function makeVisualization(title, source, alt) {
    if (!source) return '';
    const safeSource = escapeHtml(source);
    const safeTitle = escapeHtml(title);
    return `<article class="visualization-card"><h5>${safeTitle}</h5><button class="visualization-open" type="button" data-title="${safeTitle}" aria-label="Enlarge ${safeTitle.toLowerCase()} visualization" aria-haspopup="dialog"><img src="${safeSource}?t=${Date.now()}" alt="${escapeHtml(alt)}" loading="lazy"><span class="zoom-hint" aria-hidden="true">↗</span></button></article>`;
}

function renderResult(data) {
    const isGenerated = Number(data.prediction) === 1;
    const label = isGenerated ? 'FAKE (AI-GENERATED)' : 'REAL';
    const confidence = data.confidence;
    const explanation = Array.isArray(data.explanation) ? data.explanation : [];
    const model = data.model ? `<span class="meta-chip">Model · ${escapeHtml(data.model)}</span>` : '';
    const stats = [
        makeStat('Duration', data.duration, ' sec'),
        makeStat('Sample rate', data.sample_rate, ' Hz')
    ].filter(Boolean).join('');
    const explanationItems = explanation.length
        ? explanation.map(item => `<li>${escapeHtml(item)}</li>`).join('')
        : '<li>No explanation was included in the response.</li>';
    const visualizationCards = [
        makeVisualization('Waveform', data.waveform, 'Audio waveform'),
        makeVisualization('Spectrogram', data.spectrogram, 'Audio spectrogram'),
        makeVisualization('Mel spectrogram', data.mel_spectrogram, 'Mel spectrogram heatmap')
    ].filter(Boolean).join('');
    const hasVisualizations = Boolean(visualizationCards);

    resultContent.innerHTML = `
        <div class="prediction-banner ${isGenerated ? 'is-fake' : ''}">
            <div class="prediction-state">
                <span class="prediction-icon" aria-hidden="true">${isGenerated ? '✦' : '✓'}</span>
                <div><span class="prediction-kicker">Classification</span><div class="prediction-label">${label}</div></div>
            </div>
            ${confidence !== undefined && confidence !== null ? `<div class="confidence-value">${escapeHtml(confidence)}<span>%<br>confidence</span></div>` : ''}
        </div>
        ${model ? `<div class="result-meta">${model}</div>` : ''}
        <div class="result-detail-grid">
            <section class="result-card"><h4 class="result-card-title">Confidence overview</h4><div class="gauge-wrap"><canvas id="gaugeChart" role="img" aria-label="Confidence gauge"></canvas></div></section>
            <section class="result-card"><h4 class="result-card-title">Decision factors</h4><ul class="explanation-list">${explanationItems}</ul></section>
        </div>
        ${stats ? `<section class="stats-grid" aria-label="Audio statistics">${stats}</section>` : ''}
        ${hasVisualizations ? `<section class="visualizations"><div class="visualizations-heading"><h4>Signal visualizations</h4><span>Tap or click a plot to enlarge</span></div><div class="visualization-grid">${visualizationCards}</div></section>` : ''}
    `;

    resultContent.querySelectorAll('.visualization-card img').forEach(image => {
        image.addEventListener('error', () => {
            image.classList.add('image-error');
            image.alt = `${image.alt} could not be loaded`;
        }, { once: true });
    });

    if (gaugeChart) gaugeChart.destroy();
    const canvas = document.getElementById('gaugeChart');
    const numericConfidence = Number(confidence);
    if (canvas && window.Chart && Number.isFinite(numericConfidence)) {
        const gaugeValue = Math.min(100, Math.max(0, numericConfidence));
        gaugeChart = new Chart(canvas, {
            type: 'doughnut',
            data: {
                datasets: [{
                    data: [gaugeValue, 100 - gaugeValue],
                    backgroundColor: [isGenerated ? '#ff7586' : '#5de0b1', 'rgba(121, 137, 169, .15)'],
                    borderWidth: 0,
                    hoverOffset: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                circumference: 180,
                rotation: 270,
                cutout: '77%',
                plugins: { legend: { display: false }, tooltip: { enabled: false } }
            }
        });
    } else if (canvas) {
        canvas.hidden = true;
    }
}

resultContent.addEventListener('click', event => {
    const opener = event.target.closest('.visualization-open');
    if (!opener) return;

    const thumbnail = opener.querySelector('img');
    lightboxTitle.textContent = opener.dataset.title || 'Audio visualization';
    lightboxImage.src = thumbnail.currentSrc || thumbnail.src;
    lightboxImage.alt = thumbnail.alt;
    imageLightbox.showModal();
    lightboxClose.focus();
});

lightboxClose.addEventListener('click', () => imageLightbox.close());
imageLightbox.addEventListener('click', event => {
    if (event.target === imageLightbox) imageLightbox.close();
});
imageLightbox.addEventListener('close', () => {
    lightboxImage.removeAttribute('src');
});

async function predict() {
    if (!currentFile || isAnalyzing) {
        if (!currentFile) showError('Choose an audio file before starting the analysis.');
        return;
    }

    isAnalyzing = true;
    analyzeButton.disabled = true;
    removeFileButton.disabled = true;
    analyzeButton.classList.add('is-loading');
    analyzeButton.querySelector('.button-label').textContent = 'Analyzing audio';
    setResultState('loading');

    const formData = new FormData();
    formData.append('file', currentFile);

    try {
        const response = await fetch('/predict', { method: 'POST', body: formData });
        let data;
        try {
            data = await response.json();
        } catch {
            throw new Error('The server returned an unreadable response. Please try again.');
        }

        if (!response.ok) {
            throw new Error(data?.error || `The server returned error ${response.status}.`);
        }
        if (!data?.success) {
            throw new Error(data?.error || 'The server response did not include a successful analysis.');
        }

        setResultState('success');
        renderResult(data);
    } catch (error) {
        showError(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
        isAnalyzing = false;
        removeFileButton.disabled = false;
        analyzeButton.disabled = !currentFile;
        analyzeButton.classList.remove('is-loading');
        analyzeButton.querySelector('.button-label').textContent = 'Analyze audio';
    }
}

fileInput.addEventListener('change', event => {
    const [file] = event.target.files;
    if (file) setFile(file);
});

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        fileInput.click();
    }
});
dropZone.addEventListener('dragover', event => {
    event.preventDefault();
    dropZone.classList.add('is-dragover');
});
dropZone.addEventListener('dragleave', event => {
    if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('is-dragover');
});
dropZone.addEventListener('drop', event => {
    event.preventDefault();
    dropZone.classList.remove('is-dragover');
    const [file] = event.dataTransfer.files;
    if (file) setFile(file);
});
removeFileButton.addEventListener('click', clearFile);
analyzeButton.addEventListener('click', predict);
