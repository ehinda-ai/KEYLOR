import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import { join } from "path";

export async function generateQuotationPdf(
  clientName: string,
  services: Array<{ name: string; type: "percentage" | "fixed"; value: number }>,
  rentalAmount: number = 1000
): Promise<Buffer> {
  const doc = new jsPDF();
  let yPos = 15;

  // Add logo
  try {
    const logoPath = join(process.cwd(), "client/src/assets/keylor-logo.png");
    const imageData = readFileSync(logoPath);
    const logoBase64 = imageData.toString("base64");
    doc.addImage(`data:image/png;base64,${logoBase64}`, "PNG", 15, yPos, 35, 35);
  } catch (e) {
    // Logo not found - continue without it
  }

  // Header
  doc.setFontSize(24);
  doc.setFont(undefined, "bold");
  doc.text("KEYLOR", 55, yPos + 10);
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Gestion immobilière sur mesure", 55, yPos + 20);
  doc.text("Drôme • Ardèche • France", 55, yPos + 27);

  yPos += 55;

  // Title
  doc.setFontSize(16);
  doc.setFont(undefined, "bold");
  doc.text("DEVIS", 15, yPos);

  yPos += 10;

  // Client info
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text(`Client: ${clientName}`, 15, yPos);
  doc.text(`Date: ${new Date().toLocaleDateString("fr-FR")}`, 15, yPos + 7);

  yPos += 22;

  // Services list (manual table)
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.text("Service", 15, yPos);
  doc.text("Tarif", 100, yPos);
  doc.text("Montant", 150, yPos);

  // Line
  yPos += 2;
  doc.line(15, yPos, 190, yPos);
  yPos += 5;

  // Services
  doc.setFont(undefined, "normal");
  let totalFixed = 0;
  let totalPercentage = 0;

  services.forEach((service) => {
    let amount = 0;
    if (service.type === "percentage") {
      totalPercentage += service.value;
      amount = (rentalAmount * service.value) / 100;
      doc.text(service.name, 15, yPos);
      doc.text(`${service.value}%`, 100, yPos);
      doc.text(`${amount.toFixed(2)}€`, 150, yPos);
    } else {
      totalFixed += service.value;
      doc.text(service.name, 15, yPos);
      doc.text(`${service.value}€`, 100, yPos);
      doc.text(`${service.value.toFixed(2)}€`, 150, yPos);
    }
    yPos += 6;
  });

  // Total line
  yPos += 2;
  doc.line(15, yPos, 190, yPos);
  yPos += 6;

  // Total
  const totalEstimate = totalFixed + (rentalAmount * totalPercentage) / 100;
  doc.setFont(undefined, "bold");
  doc.text("TOTAL ESTIMÉ", 15, yPos);
  doc.text(`${totalEstimate.toFixed(2)}€`, 150, yPos);

  yPos += 20;

  // Conditions
  doc.setFontSize(10);
  doc.setFont(undefined, "bold");
  doc.text("Conditions:", 15, yPos);

  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  const conditions = [
    "• Devis valable 30 jours",
    "• Pas d'engagement de durée",
    "• Tarifs TTC",
    "• Frais supplémentaires possibles",
  ];

  yPos += 6;
  conditions.forEach((cond) => {
    doc.text(cond, 15, yPos);
    yPos += 4;
  });

  // Footer
  doc.setFontSize(7);
  doc.text(
    "KEYLOR - contact@keylor.fr | www.keylor.fr",
    15,
    doc.internal.pageSize.getHeight() - 8
  );

  return Buffer.from(doc.output("arraybuffer"));
}
