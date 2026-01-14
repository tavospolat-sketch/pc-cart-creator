const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function run() {
    const buffer = fs.readFileSync('assets/SON.pdf');
    const pdf = await PDFDocument.load(buffer);
    const page = pdf.getPages()[0];
    const { x, y, width, height } = page.getSize();
    console.log(`Page Size: ${width} x ${height}`);
    console.log(`MediaBox:`, page.getMediaBox());
}

run();
