import PDFDocument from "pdfkit";
import { ResearchData } from "./openrouter";

/**
 * Generates a styled, professional PDF document from research data.
 * Returns a Buffer containing the PDF binary.
 */
export function generateCompanyPDF(data: ResearchData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const buffers: Buffer[] = [];

      doc.on("data", (chunk) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err) => reject(err));

      // =========================================================================
      // COVER PAGE
      // =========================================================================
      
      // Top header band (Dark Navy background)
      doc.rect(0, 0, 595.28, 250).fill("#0f172a");

      // Cover Page Title & Subtitle
      doc.fillColor("#38bdf8").fontSize(14).font("Helvetica-Bold").text("AI-POWERED COMPANY INTELLIGENCE DOSSIER", 50, 75);
      
      doc.fillColor("#ffffff").fontSize(26).font("Helvetica-Bold").text(data.companyName.toUpperCase(), 50, 105, {
        width: 495.28,
        ellipsis: true
      });
      
      if (data.tagline) {
        doc.fillColor("#94a3b8").fontSize(11).font("Helvetica-Oblique").text(data.tagline, 50, 175, {
          width: 495.28,
          lineGap: 3
        });
      }

      // Metadata section on Cover
      doc.fillColor("#0f172a").fontSize(12).font("Helvetica-Bold").text("REPORT METADATA", 50, 310);
      doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, 325).lineTo(545.28, 325).stroke();

      let metaY = 340;
      doc.fillColor("#334155").fontSize(10).font("Helvetica-Bold").text("Primary Industry: ", 50, metaY);
      doc.font("Helvetica").text(data.industry, 160, metaY);
      metaY += 20;

      doc.font("Helvetica-Bold").text("Official Website: ", 50, metaY);
      doc.font("Helvetica").fillColor("#0284c7").text(data.website, 160, metaY);
      doc.fillColor("#334155"); // reset color
      metaY += 20;

      doc.font("Helvetica-Bold").text("Generation Date: ", 50, metaY);
      doc.font("Helvetica").text(new Date().toLocaleDateString("en-US", {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }), 160, metaY);
      metaY += 20;

      // Report guidelines on cover
      doc.font("Helvetica-Bold").text("Classification: ", 50, metaY);
      doc.font("Helvetica").fillColor("#b91c1c").text("Confidential / Internal Use Only", 160, metaY);
      doc.fillColor("#334155");

      // Footer badge on cover page
      doc.rect(50, 720, 495.28, 45).fill("#f8fafc");
      doc.strokeColor("#e2e8f0").rect(50, 720, 495.28, 45).stroke();
      doc.fillColor("#475569").fontSize(8.5).font("Helvetica-Bold").text(
        "NOTICE: This document is synthesized by an AI Research Assistant using real-time website crawling and search data. Verify critical details manually.",
        65,
        730,
        { width: 465.28, align: "center", lineGap: 2 }
      );

      // =========================================================================
      // MAIN CONTENT PAGES
      // =========================================================================
      doc.addPage();

      let currentY = 50;

      // Helper: Draw Section Header
      const drawSectionHeader = (title: string, y: number) => {
        // Prevent layout overflow to page footer by checking height
        if (y > 720) {
          doc.addPage();
          y = 50;
        }
        doc.fillColor("#0f172a").fontSize(14).font("Helvetica-Bold").text(title, 50, y);
        doc.strokeColor("#cbd5e1").lineWidth(1).moveTo(50, y + 16).lineTo(545.28, y + 16).stroke();
        return y + 28;
      };

      // Header/Footer helper for content pages
      const addPageDecorations = () => {
        const pages = doc.bufferedPageRange();
        for (let i = 1; i < pages.count; i++) {
          doc.switchToPage(i);
          
          // Page Header
          doc.fillColor("#94a3b8").fontSize(7.5).font("Helvetica-Bold").text("COMPANY RESEARCH DOSSIER", 50, 30);
          doc.text(`TARGET: ${data.companyName.toUpperCase()}`, 50, 40);
          doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(50, 45).lineTo(545.28, 45).stroke();

          // Page Footer
          doc.strokeColor("#e2e8f0").lineWidth(0.5).moveTo(50, 770).lineTo(545.28, 770).stroke();
          doc.fillColor("#94a3b8").fontSize(7.5).font("Helvetica").text("Confidential Report", 50, 778);
          doc.text(`Page ${i + 1} of ${pages.count}`, 500, 778, { align: "right" });
        }
      };

      // 1. Executive Summary
      currentY = drawSectionHeader("1. Executive Summary", currentY);
      doc.fillColor("#334155").fontSize(10).font("Helvetica").text(data.executiveSummary, 50, currentY, {
        width: 495.28,
        lineGap: 4.5,
        align: "justify"
      });
      currentY += doc.heightOfString(data.executiveSummary, { width: 495.28, lineGap: 4.5 }) + 30;

      // 2. Offerings & Services
      currentY = drawSectionHeader("2. Core Products & Offerings", currentY);
      
      if (data.offerings.length === 0) {
        doc.fillColor("#64748b").fontSize(10).font("Helvetica-Oblique").text("No specific products or services detected.", 50, currentY);
        currentY += 20;
      } else {
        data.offerings.forEach((offering, idx) => {
          // Check if space remains, otherwise break page
          if (currentY > 700) {
            doc.addPage();
            currentY = 60;
          }

          doc.fillColor("#0284c7").fontSize(10.5).font("Helvetica-Bold").text(`${idx + 1}. ${offering.name}`, 50, currentY);
          currentY += 15;

          doc.fillColor("#334155").fontSize(9.5).font("Helvetica").text(offering.description, 60, currentY, {
            width: 485.28,
            lineGap: 3
          });
          currentY += doc.heightOfString(offering.description, { width: 485.28, lineGap: 3 }) + 15;
        });
      }
      currentY += 15;

      // 3. Customer Pain Points
      currentY = drawSectionHeader("3. Value Proposition & Pain Points Solved", currentY);
      if (data.painPoints.length === 0) {
        doc.fillColor("#64748b").fontSize(10).font("Helvetica-Oblique").text("No pain points/solutions data generated.", 50, currentY);
        currentY += 20;
      } else {
        data.painPoints.forEach((pt, idx) => {
          if (currentY > 700) {
            doc.addPage();
            currentY = 60;
          }

          doc.fillColor("#b91c1c").fontSize(10.5).font("Helvetica-Bold").text(`Challenge: ${pt.issue}`, 50, currentY);
          currentY += 15;

          doc.fillColor("#334155").fontSize(9.5).font("Helvetica").text(`How they solve it: ${pt.impact}`, 60, currentY, {
            width: 485.28,
            lineGap: 3
          });
          currentY += doc.heightOfString(pt.impact, { width: 485.28, lineGap: 3 }) + 15;
        });
      }
      currentY += 15;

      // SWOT Page Break
      doc.addPage();
      currentY = 50;

      // 4. SWOT Analysis Matrix
      currentY = drawSectionHeader("4. Strategic SWOT Analysis", currentY);

      // Draw 2x2 grid backgrounds
      doc.save();
      
      // Top-Left (Strengths) - Light Green
      doc.rect(50, currentY, 247.64, 180).fill("#f0fdf4");
      // Top-Right (Weaknesses) - Light Rose
      doc.rect(297.64, currentY, 247.64, 180).fill("#fff1f2");
      // Bottom-Left (Opportunities) - Light Sky Blue
      doc.rect(50, currentY + 180, 247.64, 180).fill("#f0f9ff");
      // Bottom-Right (Threats) - Light Purple
      doc.rect(297.64, currentY + 180, 247.64, 180).fill("#faf5ff");

      // Draw grid outlines
      doc.strokeColor("#cbd5e1").lineWidth(1.5)
         .rect(50, currentY, 495.28, 360).stroke() // Outer border
         .moveTo(297.64, currentY).lineTo(297.64, currentY + 360).stroke() // Vertical line
         .moveTo(50, currentY + 180).lineTo(545.28, currentY + 180).stroke(); // Horizontal line
      
      doc.restore();

      // Draw SWOT titles & lists
      const swot = data.swot || { strengths: [], weaknesses: [], opportunities: [], threats: [] };

      // 1. Strengths text
      doc.fillColor("#15803d").fontSize(11).font("Helvetica-Bold").text("STRENGTHS (S)", 62, currentY + 10);
      let strY = currentY + 28;
      (swot.strengths || []).slice(0, 5).forEach((s) => {
        doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(`• ${s}`, 62, strY, { width: 223, lineGap: 1.5 });
        strY += doc.heightOfString(`• ${s}`, { width: 223, lineGap: 1.5 }) + 6;
      });

      // 2. Weaknesses text
      doc.fillColor("#be123c").fontSize(11).font("Helvetica-Bold").text("WEAKNESSES (W)", 309.64, currentY + 10);
      let weakY = currentY + 28;
      (swot.weaknesses || []).slice(0, 5).forEach((w) => {
        doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(`• ${w}`, 309.64, weakY, { width: 223, lineGap: 1.5 });
        weakY += doc.heightOfString(`• ${w}`, { width: 223, lineGap: 1.5 }) + 6;
      });

      // 3. Opportunities text
      doc.fillColor("#0369a1").fontSize(11).font("Helvetica-Bold").text("OPPORTUNITIES (O)", 62, currentY + 190);
      let oppY = currentY + 208;
      (swot.opportunities || []).slice(0, 5).forEach((o) => {
        doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(`• ${o}`, 62, oppY, { width: 223, lineGap: 1.5 });
        oppY += doc.heightOfString(`• ${o}`, { width: 223, lineGap: 1.5 }) + 6;
      });

      // 4. Threats text
      doc.fillColor("#6b21a8").fontSize(11).font("Helvetica-Bold").text("THREATS (T)", 309.64, currentY + 190);
      let thrY = currentY + 208;
      (swot.threats || []).slice(0, 5).forEach((t) => {
        doc.fillColor("#334155").fontSize(8.5).font("Helvetica").text(`• ${t}`, 309.64, thrY, { width: 223, lineGap: 1.5 });
        thrY += doc.heightOfString(`• ${t}`, { width: 223, lineGap: 1.5 }) + 6;
      });

      currentY += 385;

      // 5. Custom Focus Summary (if generated)
      if (data.customFocusSummary) {
        if (currentY > 680) {
          doc.addPage();
          currentY = 60;
        }
        currentY = drawSectionHeader("5. Targeted Focus Analysis Summary", currentY);
        doc.fillColor("#334155").fontSize(9.5).font("Helvetica").text(data.customFocusSummary, 50, currentY, {
          width: 495.28,
          lineGap: 4.5,
          align: "justify"
        });
        currentY += doc.heightOfString(data.customFocusSummary, { width: 495.28, lineGap: 4.5 }) + 25;
      }

      // 6. Competitor Landscape
      currentY = drawSectionHeader(data.customFocusSummary ? "6. Key Competitors & Industry Space" : "5. Key Competitors & Industry Space", currentY);
      if (data.competitors.length === 0) {
        doc.fillColor("#64748b").fontSize(10).font("Helvetica-Oblique").text("No competitor data resolved.", 50, currentY);
        currentY += 20;
      } else {
        data.competitors.forEach((comp) => {
          if (currentY > 730) {
            doc.addPage();
            currentY = 60;
          }

          doc.fillColor("#334155").fontSize(9.5).font("Helvetica-Bold").text(`• ${comp.name}`, 60, currentY);
          
          if (comp.url && comp.url !== "N/A") {
            const compLabel = `• ${comp.name}`;
            const labelWidth = doc.widthOfString(compLabel) + 5;
            doc.fillColor("#0284c7").fontSize(9.5).font("Helvetica-Oblique").text(`(${comp.url})`, 60 + labelWidth, currentY);
          }
          currentY += 16;
        });
      }
      currentY += 25;

      // 7. Contact Details
      currentY = drawSectionHeader(data.customFocusSummary ? "7. Corporate Contacts & Location" : "6. Corporate Contacts & Location", currentY);
      
      const contacts = [
        { label: "Address:", val: data.contactInfo.address },
        { label: "Phone:", val: data.contactInfo.phone },
        { label: "Email:", val: data.contactInfo.email },
      ];

      contacts.forEach((contact) => {
        if (currentY > 740) {
          doc.addPage();
          currentY = 60;
        }
        doc.fillColor("#475569").fontSize(9.5).font("Helvetica-Bold").text(contact.label, 50, currentY);
        doc.fillColor("#334155").font("Helvetica").text(contact.val || "N/A", 120, currentY);
        currentY += 16;
      });

      // Apply headers and footers to all pages after they have been added (buffered)
      addPageDecorations();

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}
