import { pdf } from "pdf-to-img";
import fs from "fs-extra";
import path from "path";

export async function pdfToImages(pdfPath, outDir) {
  await fs.ensureDir(outDir);

  try {
    // Read the PDF file as buffer
    const pdfBuffer = await fs.readFile(pdfPath);
    
    // Use lower scale to reduce memory usage (1.0 instead of 1.5)
    const document = await pdf(pdfBuffer, { scale: 1.0 });
    
    const imagePaths = [];
    let pageNum = 1;
    
    // Process pages sequentially to reduce memory pressure
    for await (const image of document) {
      const outputPath = path.join(outDir, `page_${pageNum}.png`);
      await fs.writeFile(outputPath, image);
      imagePaths.push(outputPath);
      pageNum++;
      
      // Free memory explicitly after each page
      if (global.gc) {
        global.gc();
      }
    }
    
    if (imagePaths.length === 0) {
      throw new Error("No images generated from PDF");
    }
    
    return imagePaths;
  } catch (error) {
    throw new Error(`Failed to convert PDF: ${error.message}`);
  }
}