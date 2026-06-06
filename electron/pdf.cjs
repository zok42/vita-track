const PDFDocument = require('pdfkit');
const fs = require('fs');

const MEAL_NAMES   = { breakfast: 'Frühstück', lunch: 'Mittagessen', dinner: 'Abendessen', snack: 'Zwischenmahlzeit' };
const TYPE_LABELS  = { walking: 'Spazieren', cycling: 'Radfahren', swimming: 'Schwimmen', workout: 'Workout', 'tai chi': 'Tai Chi', paddling: 'Paddeln', other: 'Andere' };
const INTENS_LABELS = { light: 'Locker', medium: 'Mittel', high: 'Hoch' };

const COL_PRIMARY  = '#1a1a2e';
const COL_ACCENT   = '#e94560';
const COL_LIGHT    = '#f0f2f5';
const COL_GREY     = '#666666';

const TYPE_KEYS   = ['walking', 'cycling', 'swimming', 'workout', 'tai chi', 'paddling', 'other'];
const INTENS_KEYS = ['light', 'medium', 'high'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

function formatDateShort(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function getISOWeekNumber(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
}

function getWeekMonday(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return d.toISOString().slice(0, 10);
}

function generatePDF(outputPath, days, startDate, endDate) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    let pageNumber = 1;

    function writeFooter() {
      const footerY = doc.page.height - doc.page.margins.bottom - 12;
      doc.fillColor(COL_GREY).fontSize(8).font('Helvetica')
         .text(
           `Seite ${pageNumber}   |   Erstellt am ${new Date().toLocaleDateString('de-DE')}   |   VitaTrack`,
           50, footerY,
           { width: doc.page.width - 100, align: 'center' }
         );
    }

    function addPageWithFooter() {
      writeFooter();
      doc.addPage();
      pageNumber++;
    }

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

     // ── Wochen-Zusammenfassung ──────────────────────────────────────────────
     const allWorkouts = days.flatMap(d => d.workouts.map(w => ({ ...w, date: d.date })));
     if (allWorkouts.length > 0) {
       const weekMap = {};
       for (const w of allWorkouts) {
         const monday = getWeekMonday(w.date);
         if (!weekMap[monday]) weekMap[monday] = [];
         weekMap[monday].push(w);
       }

       doc.fillColor('#2196f3').fontSize(12).font('Helvetica-Bold')
          .text('Wochen-Zusammenfassung Training', 50, doc.y + 4);
       doc.y += 10;

       const sortedWeeks = Object.keys(weekMap).sort();
       const pw = doc.page.width - 100;

       for (const monday of sortedWeeks) {
         const weekWorkouts = weekMap[monday];
         const sunday = new Date(monday + 'T12:00:00');
         sunday.setDate(sunday.getDate() + 6);
         const sundayStr = sunday.toISOString().slice(0, 10);
         const weekLabel = `KW ${getISOWeekNumber(monday)} (${formatDateShort(monday)} – ${formatDateShort(sundayStr)})`;

        if (doc.y > doc.page.height - 220) addPageWithFooter();

         doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica-Bold')
            .text(weekLabel, 50, doc.y + 4);
         doc.y += 8;

         // Matrix: type × intensity → { count, duration }
         const matrix = {};
         for (const type of TYPE_KEYS) {
           matrix[type] = {};
           for (const intens of INTENS_KEYS) {
             matrix[type][intens] = { count: 0, duration: 0 };
           }
         }
         for (const w of weekWorkouts) {
           if (matrix[w.type]?.[w.intensity]) {
             matrix[w.type][w.intensity].count++;
             matrix[w.type][w.intensity].duration += w.duration;
           }
         }

         // Tabellenkopf
         const col = { type: 50, light: 170, medium: 270, high: 370, total: 455 };
         const thY = doc.y;
         doc.rect(50, thY, pw, 16).fill(COL_LIGHT);
         doc.fillColor(COL_GREY).fontSize(8).font('Helvetica-Bold')
            .text('Art',         col.type   + 4, thY + 4, { width: 115 })
            .text('locker',      col.light,      thY + 4, { width: 95, align: 'center' })
            .text('mittel',      col.medium,     thY + 4, { width: 95, align: 'center' })
            .text('hoch',        col.high,       thY + 4, { width: 80, align: 'center' })
            .text('Gesamt',      col.total,      thY + 4, { width: 90, align: 'right' });
         doc.y = thY + 18;

          // Tabellenzeilen (nur Typen mit Einträgen)
          let weekTotalCount = 0, weekTotalDur = 0;
          for (const type of TYPE_KEYS) {
            let totalCount = 0, totalDur = 0;
            for (const intens of INTENS_KEYS) {
              totalCount += matrix[type][intens].count;
              totalDur   += matrix[type][intens].duration;
            }
            if (totalCount === 0) continue;

            const rY = doc.y;
            weekTotalCount += totalCount;
            weekTotalDur   += totalDur;
            doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica')
               .text(TYPE_LABELS[type], col.type + 4, rY, { width: 115 });

            for (const intens of INTENS_KEYS) {
              const cell = matrix[type][intens];
              const cellCol = intens === 'light' ? col.light : intens === 'medium' ? col.medium : col.high;
              const cellW   = intens === 'high' ? 80 : 95;
              const align   = intens === 'high' ? 'right' : 'center';
              const text    = cell.count > 0 ? `${cell.count}x ${cell.duration}min` : '-';
              doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica')
                 .text(text, cellCol, rY, { width: cellW, align });
            }

            doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica-Bold')
               .text(`${totalCount}x ${totalDur}min`, col.total, rY, { width: 90, align: 'right' });

            doc.y = rY + 13;
            doc.moveTo(50, doc.y).lineTo(50 + pw, doc.y)
               .strokeColor('#e0e0e0').lineWidth(0.5).stroke();
            doc.y += 3;
          }

         // Wochen-Summenzeile
         const wtY = doc.y;
         doc.rect(50, wtY, pw, 16).fill('#e8e8e8');
         doc.fillColor(COL_PRIMARY).fontSize(8).font('Helvetica-Bold')
            .text('Gesamt', col.type + 4, wtY + 4, { width: 115 })
            .text(`${weekTotalCount}x ${weekTotalDur}min`, col.total, wtY + 4, { width: 90, align: 'right' });
         doc.y = wtY + 22;
      }
    }

      // ── Charts ───────────────────────────────────────────────────────
     if (days.length > 0) {
        if (doc.y > doc.page.height - 200) addPageWithFooter();

       doc.fillColor('#2196f3').fontSize(12).font('Helvetica-Bold')
          .text('Charts', 50, doc.y + 4);
       doc.y += 10;

       // Prepare data for macros chart (average per day)
       const macroSums = { carbs: 0, protein: 0, fruit_veggies: 0, calories: 0 };
       let daysWithMeals = 0;
       for (const day of days) {
         if (day.meals.length > 0) {
           daysWithMeals++;
           for (const meal of day.meals) {
             macroSums.carbs   += meal.carbs;
             macroSums.protein += meal.protein;
             macroSums.fruit_veggies += meal.fruit_veggies;
             macroSums.calories  += meal.calories || 0;
           }
         }
       }
       const macroAvg = daysWithMeals > 0 ? {
         carbs:   macroSums.carbs   / daysWithMeals,
         protein: macroSums.protein / daysWithMeals,
         fruit_veggies: macroSums.fruit_veggies / daysWithMeals,
         calories: macroSums.calories / daysWithMeals
       } : { carbs: 0, protein: 0, fruit_veggies: 0, calories: 0 };

       // Prepare data for workout duration per type
        const workoutTotals = { walking: 0, cycling: 0, swimming: 0, workout: 0, 'tai chi': 0, paddling: 0, other: 0 };
        for (const day of days) {
          for (const w of day.workouts) {
            if (workoutTotals[w.type] !== undefined) {
              workoutTotals[w.type] += w.duration;
            }
          }
        }

        // Draw two bar charts side by side
        const chartWidth = (doc.page.width - 100) / 2 - 20; // each chart width with gap
        const chartHeight = 200;
       const leftX = 50;
       const rightX = 50 + chartWidth + 20;
       const chartY = doc.y;

       // --- Macros Chart ---
       doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica-Bold')
          .text('Durchschnittliche Makronährstoffe pro Tag', leftX, chartY);
       doc.y += 20;

       const macroData = [
         { label: 'KH', value: Math.round(macroAvg.carbs),   color: '#4caf50' },
         { label: 'Prot', value: Math.round(macroAvg.protein), color: '#2196f3' },
         { label: 'Obst/Gem', value: Math.round(macroAvg.fruit_veggies), color: '#ff9800' },
         { label: 'kcal', value: Math.round(macroAvg.calories), color: '#9c27b0' }
       ];
       const macroMax = Math.max(...macroData.map(d => d.value)) || 1;
       macroData.forEach((item, index) => {
         const barY = chartY + 20 + index * 25;
         const barWidth = (item.value / macroMax) * (chartWidth - 100);
         doc.fillColor(item.color)
            .rect(leftX + 80, barY, barWidth, 15)
            .fill();
         doc.fillColor(COL_GREY).fontSize(8)
            .text(`${item.label}: ${item.value}g`, leftX, barY + 2, { width: 70, align: 'right' });
       });

       // --- Workout Chart ---
       doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica-Bold')
          .text('Trainingsdauer nach Art', rightX, chartY);
       doc.y += 20;

        const workoutData = [
          { label: 'Spazieren', value: workoutTotals.walking,   color: '#8bc34a' },
          { label: 'Radfahren', value: workoutTotals.cycling,   color: '#03a9f4' },
          { label: 'Schwimmen', value: workoutTotals.swimming,  color: '#9c27b0' },
          { label: 'Workout',   value: workoutTotals.workout,   color: '#ff5722' },
          { label: 'Tai Chi',   value: workoutTotals['tai chi'],color: '#00bcd4' },
          { label: 'Paddeln',   value: workoutTotals.paddling,  color: '#ff9800' },
          { label: 'Andere',    value: workoutTotals.other,     color: '#607d8b' }
        ].filter(d => d.value > 0);
        const workoutMax = Math.max(...workoutData.map(d => d.value)) || 1;
       workoutData.forEach((item, index) => {
         const barY = chartY + 20 + index * 25;
         const barWidth = (item.value / workoutMax) * (chartWidth - 100);
         doc.fillColor(item.color)
            .rect(rightX + 80, barY, barWidth, 15)
            .fill();
         doc.fillColor(COL_GREY).fontSize(8)
            .text(`${item.label}: ${item.value} min`, rightX, barY + 2, { width: 70, align: 'right' });
       });

       doc.y = chartY + chartHeight + 20; // move y below charts
     }

      // ── Tageseinträge ───────────────────────────────────────────────────────
     for (const day of days) {
       const pageWidth = doc.page.width - 100;

       // Seitenumbruch wenn zu wenig Platz (ca. 300pt für kompletten Tag)
       if (doc.y > doc.page.height - 330) addPageWithFooter();

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
        const col = { name: 50, time: 165, kh: 235, p: 305, og: 375, cal: 440 };
        const rowY = doc.y;
        doc.rect(50, rowY, pageWidth, 16).fill(COL_LIGHT);
        doc.fillColor(COL_GREY).fontSize(8).font('Helvetica-Bold');
        doc.text('Mahlzeit / Gericht',    col.name + 4, rowY + 4, { width: 110 });
        doc.text('Uhrzeit', col.time,      rowY + 4, { width: 55, align: 'center' });
        doc.text('KH (g)',  col.kh,       rowY + 4, { width: 60, align: 'right' });
        doc.text('Prot (g)', col.p,       rowY + 4, { width: 60, align: 'right' });
        doc.text('Obst/Gem (g)', col.og,  rowY + 4, { width: 55, align: 'right' });
        doc.text('kcal',   col.cal,       rowY + 4, { width: 55, align: 'right' });
        doc.y = rowY + 18;

        let totalCarbs = 0, totalProtein = 0, totalFv = 0, totalCal = 0;

        for (const meal of day.meals) {
          totalCarbs   += meal.carbs;
          totalProtein += meal.protein;
          totalFv      += meal.fruit_veggies;
          totalCal     += meal.calories || 0;

          const mY = doc.y;
          doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica-Bold')
             .text(MEAL_NAMES[meal.meal_type] || '', col.name + 4, mY, { width: 110 });
          doc.fillColor(COL_PRIMARY).fontSize(9).font('Helvetica')
             .text(meal.time || '', col.time,   mY, { width: 55, align: 'center' })
             .text(String(meal.carbs),         col.kh,  mY, { width: 60, align: 'right' })
             .text(String(meal.protein),       col.p,   mY, { width: 60, align: 'right' })
             .text(String(meal.fruit_veggies), col.og,  mY, { width: 55, align: 'right' })
             .text(String(meal.calories || 0), col.cal, mY, { width: 55, align: 'right' });
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
           .text('Gesamt', col.name + 4, sumY + 4, { width: 180 })
           .text(totalCarbs.toFixed(0),   col.kh, sumY + 4, { width: 85,  align: 'right' })
           .text(totalProtein.toFixed(0), col.p,  sumY + 4, { width: 75,  align: 'right' })
           .text(totalFv.toFixed(0),      col.og, sumY + 4, { width: 65, align: 'right' })
           .text(totalCal.toFixed(0),     col.cal, sumY + 4, { width: 70, align: 'right' });
        doc.y = sumY + 22;
      }

      // ── Trainings ───────────────────────────────────────────────────────
      if (day.workouts.length > 0) {
        if (doc.y > doc.page.height - 140) addPageWithFooter();

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

    // ── Fusszeile auf letzter Seite ──────────────────────────────────────
    writeFooter();

    doc.end();
    stream.on('finish', () => resolve(outputPath));
    stream.on('error', reject);
  });
}

module.exports = { generatePDF };
