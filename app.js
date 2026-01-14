// app.js

const CONFIG = {
    // We strictly use the HTML snapshot now, checking fonts only for preview loading
    fonts: {
        'Delmon': 'assets/Delmon Delicate.ttf',
        'Noto': 'assets/Noto Sans Font Family/NotoSans-Regular.ttf',
        'NotoBold': 'assets/Noto Sans Font Family/NotoSans-Bold.ttf'
    },
    templateUrl: 'assets/SON.pdf',

    // Standard Card Size (8.5cm x 5.5cm)
    cardWidthStats: {
        width: 85 * 2.83465,  // ~241 pts
        height: 55 * 2.83465, // ~156 pts
        ratio: 85 / 55
    }
};

// Inputs
const inputs = {
    name: document.getElementById('inputName'),
    title: document.getElementById('inputTitle'),
    phone: document.getElementById('inputPhone'),
    email: document.getElementById('inputEmail'),
    website: document.getElementById('inputWebsite'),
    address: document.getElementById('inputAddress')
};

const fontSelector = document.getElementById('fontSelector');

const previews = {
    name: document.getElementById('previewName'),
    title: document.getElementById('previewTitle'),
    phone: document.getElementById('previewPhone'),
    email: document.getElementById('previewEmail'),
    website: document.getElementById('previewWebsite'),
    address: document.getElementById('previewAddress')
};

function init() {
    bindInputs();
    document.getElementById('downloadBtn').addEventListener('click', generatePDFFromSnapshot);

    // Determine font on init
    updateFontPreview();
}

function updateFontPreview() {
    const selectedFont = fontSelector.value;
    if (selectedFont === 'Delmon') {
        previews.name.style.fontFamily = 'Delmon';
    } else {
        previews.name.style.fontFamily = 'Noto';
    }
}

function bindInputs() {
    Object.keys(inputs).forEach(key => {
        inputs[key].addEventListener('input', (e) => {
            const val = e.target.value;
            previews[key].innerText = val;
        });
    });

    fontSelector.addEventListener('change', updateFontPreview);
}

function getSmartScale(pageWidth, pageHeight) {
    const pRatio = pageWidth / pageHeight;
    const cardRatio = CONFIG.cardWidthStats.ratio;

    const isCardShape = Math.abs(pRatio - cardRatio) < 0.2;

    if (isCardShape && pageWidth > 400) {
        // High DPI Card detected
        return pageWidth / CONFIG.cardWidthStats.width;
    }
    return 1.0;
}

async function generatePDFFromSnapshot() {
    const btn = document.getElementById('downloadBtn');
    const originalText = btn.innerHTML;
    btn.textContent = 'Rendering High-Res...';
    btn.disabled = true;

    try {
        // 1. Capture HTML as High-Res Image
        // scale: 4 means 300-400 DPI quality, essential for print
        const canvas = await html2canvas(document.getElementById('cardPreview'), {
            scale: 4,
            useCORS: true, // helpful if images are external, though ours are local
            backgroundColor: '#ffffff' // Ensure white background is captured
        });

        const imgData = canvas.toDataURL('image/png');

        btn.textContent = 'Generating PDF...';

        // 2. Load SON.pdf
        const existingPdfBytes = await fetch(CONFIG.templateUrl).then(res => res.arrayBuffer());
        const pdfDoc = await PDFLib.PDFDocument.load(existingPdfBytes);

        // 3. Embed the Captured Image
        const image = await pdfDoc.embedPng(imgData);

        // 4. Get Page & Calculate Geometry
        const page = pdfDoc.getPages()[0];
        const { width: PAGE_W, height: PAGE_H } = page.getSize();

        // Use Smart Scale for the target dimensions on the PDF page
        const scaleFactor = getSmartScale(PAGE_W, PAGE_H);

        const effCardW = CONFIG.cardWidthStats.width * scaleFactor;
        const effCardH = CONFIG.cardWidthStats.height * scaleFactor;

        // Center Position
        const offsetX = (PAGE_W - effCardW) / 2;
        const offsetY = (PAGE_H - effCardH) / 2;

        // 5. Draw the Image (covering the area exactly)
        page.drawImage(image, {
            x: offsetX,
            y: offsetY,
            width: effCardW,
            height: effCardH
        });

        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'SON_Edited_Card.pdf';
        link.click();

    } catch (err) {
        console.error(err);
        alert('Error: ' + err.message);
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
}

init();
