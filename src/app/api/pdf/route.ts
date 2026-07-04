import { NextRequest } from "next/server";
import { generateCompanyPDF } from "src/lib/pdf-generator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { researchData } = body;

    if (!researchData || !researchData.companyName) {
      return Response.json(
        { error: "Invalid research data provided for PDF generation." },
        { status: 400 }
      );
    }

    console.log(`Generating PDF for company: ${researchData.companyName}`);
    const pdfBuffer = await generateCompanyPDF(researchData);

    const safeFilename = researchData.companyName
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFilename}_report.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("API Error in /api/pdf:", error);
    return Response.json(
      { error: error.message || "Failed to generate company PDF report." },
      { status: 500 }
    );
  }
}
