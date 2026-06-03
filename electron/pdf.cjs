const PDFDocument = require('pdfkit');
const fs = require('fs');

const MEAL_NAMES   = { 1: 'Frühstück', 2: 'Mittagessen', 3: 'Abendessen' };
const TYPE_LABELS  = { walking: 'Spazieren', cycling: 'Radfahren', swimming: 'Schwimmen' };
const INTENS_LABELS = { light: 'locker', medium: 'mittel', high: 'hoch' };

const COL_PRIMARY  = '#1a1a2e';
const COL_ACCENT   = '#e94560';
const COL_LIGHT    = '#f0f2f5';
const COL_GREY     = '#666666';

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function generatePDF(outputPath, days, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    // ── Deckblatt-Header ────────────────────────────────────────────────────
    doc.rect(0, 0, doc.page.width, 110).fill(COL_PRIMARY);
    doc.fillColor('#ffffff')
       .fontSize(28).font('Helvetica-Bold')
       .text('VitaTrack', 50, 30);
    doc.fontSize(12).font('Helvetica')
       .text('Ernährungs- und Trainingsprotokoll', 50, 65);
    doc.fontSize(10)
       .text(`Zeitraum: ${formatDate(startDate)} – ${formatDate(endDate)}`, 50, 85);

    doc.moveDown(3);

    if (days.length === 0) {
      doc.fillColor(COL_GREY).fontSize(12).font('Helvetica')
         .text('Keine Einträge für diesen Zeitraum gefunden.', { align: 'center' });
    }

    // ── Tageseinträge ───────────────────────────────────────────────────────
    for (const day of days) {
      const pageWidth = doc.page.width - 100;

      // Seitenumbruch wenn zu wenig Platz
      if (doc.y > doc.page.height - 180) doc.addPage();

      // Datumsbalken
      const headerY = doc.y;
      doc.rect(50, headerY, pageWidth, 24).fill(COL_PRIMARY);
      doc.fillColor('#ffffff').fontSize(11).font('Helvetica-Bold')
         .text(formatDate(day.date), 58, headerY + 6, { width: pageWidth - 16 });
      doc.y = headerY + 30;

      // ── Mahlzeiten ──────────────────────────────────────────────────────
      if (day.meals.length > 0) {
        doc.fillColor(COL_ACCENT).fontSize(10).font('Helvetica-Bold')
           .text('Mahlzeiten', 50, doc.y + 4);
        doc.y += 6;

        // Tabellenkopf
        const col = { name: 50, kh: 240, p: 340, og: 430 };
        const rowY = doc.y;
        doc.rect(50, rowY, pageWidth, 16).fill(COL_LIGHT);
        doc.fillColor(COL_GREY).fontSize(8).font('Helvetica-Bold');
        doc.text('Mahlzeit / Gericht',    col.name + 4, rowY + 4, { width: 185 });
        doc.text('Kohlenhydrate (g)', col.kh,  rowY + 4, { width: 95, align: 'right' });
        doc.text('Protein (g)',        col.p,   rowY + 4, { width: 85, align: 'right' });
        doc.text('Gemüse/Obst (g)',   col.og,  rowY + 4, { width: 115, align: 'right' });
        doc.y = rowY + 18;

        let totalCarbs = 0, totalProtein = 0, totalFv = 0;

        for (const meal of day.meals) {
          totalCarbs   += meal.carbs;
          totalProtein += meal.protein;
          totalFv      += meal.fruit_veggies;

          const mY = doc.y;
          doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica-Bold')
             .text(MEAL_NAMES[meal.meal_number] || '', col.name + 4, mY, { width: 220 });
          doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica')
             .text(String(meal.carbs),         col.kh, mY, { width: 95,  align: 'right' })
             .text(String(meal.protein),        col.p,  mY, { width: 85,  align: 'right' })
             .text(String(meal.fruit_veggies),  col.og, mY, { width: 115, align: 'right' });
          doc.y = mY + 13;

          if (meal.name && meal.name.trim()) {
            doc.fillColor(COL_GREY).fontSize(8).font('Helvetica-Oblique')
               .text(meal.name.trim(), col.name + 4, doc.y, { width: 470 });
            doc.y += 11;
          }

          // Trennlinie
          doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y)
             .strokeColor('#e0e0e0').lineWidth(0.5).stroke();
          doc.y += 3;
        }

        // Summenzeile
        const sumY = doc.y;
        doc.rect(50, sumY, pageWidth, 16).fill('#e8e8e8');
        doc.fillColor(COL_PRIMARY).fontSize(8).font('Helvetica-Bold')
           .text('Gesamt', col.name + 4, sumY + 4, { width: 220 })
           .text(totalCarbs.toFixed(0),   col.kh, sumY + 4, { width: 95,  align: 'right' })
           .text(totalProtein.toFixed(0), col.p,  sumY + 4, { width: 85,  align: 'right' })
           .text(totalFv.toFixed(0),      col.og, sumY + 4, { width: 115, align: 'right' });
        doc.y = sumY + 22;
      }

      // ── Trainings ───────────────────────────────────────────────────────
      if (day.workouts.length > 0) {
        if (doc.y > doc.page.height - 100) doc.addPage();

        doc.fillColor('#2196f3').fontSize(10).font('Helvetica-Bold')
           .text('Training', 50, doc.y + 4);
        doc.y += 6;

        const colW = { type: 50, dur: 280, intens: 380 };
        const thY = doc.y;
        doc.rect(50, thY, pageWidth, 16).fill(COL_LIGHT);
        doc.fillColor(COL_GREY).fontSize(8).font('Helvetica-Bold')
           .text('Art',        colW.type + 4, thY + 4, { width: 220 })
           .text('Dauer (min)', colW.dur,     thY + 4, { width: 90, align: 'right' })
           .text('Intensität', colW.intens,   thY + 4, { width: 130 });
        doc.y = thY + 18;

        let totalDuration = 0;
        for (const w of day.workouts) {
          totalDuration += w.duration;
          const wY = doc.y;
          doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica')
             .text(TYPE_LABELS[w.type] || w.type, colW.type + 4, wY, { width: 220 })
             .text(String(w.duration), colW.dur,    wY, { width: 90,  align: 'right' })
             .text(INTENS_LABELS[w.intensity] || w.intensity, colW.intens, wY, { width: 130 });
          doc.y = wY + 13;
          doc.moveTo(50, doc.y).lineTo(50 + pageWidth, doc.y)
             .strokeColor('#e0e0e0').lineWidth(0.5).stroke();
          doc.y += 3;
        }

        // Summenzeile Training
        const twY = doc.y;
        doc.rect(50, twY, pageWidth, 16).fill('#e8e8e8');
        doc.fillColor(COL_PRIMARY).fontSize(8).font('Helvetica-Bold')
           .text('Gesamt', colW.type + 4, twY + 4, { width: 220 })
           .text(String(totalDuration), colW.dur, twY + 4, { width: 90, align: 'right' });
        doc.y = twY + 22;
      }

      doc.y += 10;
    }

    // ── Fusszeile ─────────────────────────────────────────────────────────
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      doc.fillColor(COL_GREY).fontSize(8).font('Helvetica')
         .text(
           `Seite ${i + 1} von ${range.count}   |   Erstellt am ${new Date().toLocaleDateString('de-DE')}   |   VitaTrack`,
           50, doc.page.height - 30,
           { width: doc.page.width - 100, align: 'center' }
         );
    }

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

module.exports = { generatePDF };
