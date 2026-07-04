import { NextRequest } from "next/server";
import { generateCompanyPDF } from "src/lib/pdf-generator";
import { sendToDiscord } from "src/lib/discord";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { researchData, discordConfig, applicantDetails } = body;

    if (!researchData || !researchData.companyName) {
      return Response.json(
        { error: "Invalid research data provided." },
        { status: 400 }
      );
    }

    if (!discordConfig || (!discordConfig.webhookUrl && (!discordConfig.botToken || !discordConfig.channelId))) {
      return Response.json(
        { error: "Discord configuration is missing or incomplete." },
        { status: 400 }
      );
    }

    console.log(`Generating PDF for Discord dispatch: ${researchData.companyName}`);
    const pdfBuffer = await generateCompanyPDF(researchData);

    console.log("Sending dossier to Discord...");
    await sendToDiscord(pdfBuffer, researchData, discordConfig, applicantDetails);

    return Response.json({
      success: true,
      message: "Dossier successfully sent to Discord!",
    });
  } catch (error: any) {
    console.error("API Error in /api/discord:", error);
    return Response.json(
      { error: error.message || "Failed to dispatch dossier to Discord." },
      { status: 500 }
    );
  }
}
