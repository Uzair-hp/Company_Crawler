import { ResearchData } from "./openrouter";

interface DiscordConfig {
  webhookUrl?: string;
  botToken?: string;
  channelId?: string;
}

interface ApplicantDetails {
  name?: string;
  email?: string;
}

/**
 * Sends a message and a PDF file attachment to a Discord channel
 */
export async function sendToDiscord(
  pdfBuffer: Buffer,
  researchData: ResearchData,
  config: DiscordConfig,
  applicant?: ApplicantDetails
): Promise<boolean> {
  const { webhookUrl, botToken, channelId } = config;

  if (!webhookUrl && (!botToken || !channelId)) {
    throw new Error("Discord configuration is incomplete. Provide either a Webhook URL OR a Bot Token and Channel ID.");
  }

  // Construct a professional message summary
  let descriptionText = `**Tagline:** ${researchData.tagline || "N/A"}\n`;
  descriptionText += `**Industry:** ${researchData.industry}\n`;
  descriptionText += `**Website:** ${researchData.website}\n\n`;
  descriptionText += `**Executive Summary:**\n${researchData.executiveSummary.substring(0, 1000)}`;
  if (researchData.executiveSummary.length > 1000) {
    descriptionText += "...";
  }

  const embed: any = {
    title: `AI Company Research Dossier: ${researchData.companyName}`,
    color: 0x0284c7, // Light blue color code (Hex 0284c7 to Dec 165575)
    description: descriptionText,
    fields: [
      {
        name: "Top Competitors",
        value: researchData.competitors.length > 0
          ? researchData.competitors.map(c => `• ${c.name}`).join("\n")
          : "None detected",
        inline: true
      },
      {
        name: "Contact Info",
        value: `📧 ${researchData.contactInfo.email || "N/A"}\n📞 ${researchData.contactInfo.phone || "N/A"}`,
        inline: true
      }
    ],
    timestamp: new Date().toISOString(),
    footer: {
      text: "AI Research Assistant Report"
    }
  };

  // Add applicant info if provided
  let contentMessage = "📄 **New Company Research Report Generated!**";
  if (applicant && (applicant.name || applicant.email)) {
    contentMessage = `📄 **Company Research Report for Applicant:** **${applicant.name || "Unknown Name"}** (${applicant.email || "No Email"})`;
  }

  // Prepare standard Discord payload_json
  const payloadJson = {
    content: contentMessage,
    embeds: [embed]
  };

  // Construct Form Data
  const formData = new FormData();
  formData.append("payload_json", JSON.stringify(payloadJson));
  
  // Convert PDF buffer to a Blob and append as a file
  const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
  formData.append("file", pdfBlob, `${researchData.companyName.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_report.pdf`);

  let targetUrl = "";
  const headers: Record<string, string> = {};

  if (webhookUrl) {
    targetUrl = webhookUrl;
  } else if (botToken && channelId) {
    targetUrl = `https://discord.com/api/v10/channels/${channelId}/messages`;
    headers["Authorization"] = `Bot ${botToken}`;
  }

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Discord API returned status ${response.status}: ${errText}`);
    }

    return true;
  } catch (error: any) {
    console.error("Error sending to Discord:", error);
    throw error;
  }
}
