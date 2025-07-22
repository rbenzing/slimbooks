// PDF Generation Service using Puppeteer
// Captures public invoice URLs and generates PDFs

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs/promises';

class PDFGeneratorService {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the PDF service with a browser instance
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      this.browser = await puppeteer.launch({
        headless: 'new', // Use new headless mode
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      this.isInitialized = true;
      console.log('PDF Generator Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize PDF Generator Service:', error);
      throw error;
    }
  }

  /**
   * Generate PDF from invoice URL with settings-aware styling
   */
  async generateInvoicePDF(invoiceId, token, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const page = await this.browser.newPage();

    try {
      // Set viewport for consistent rendering
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      });

      // Construct the public invoice URL
      const baseUrl = process.env.CLIENT_URL || 'http://localhost:8080';
      const invoiceUrl = `${baseUrl}/invoice/${invoiceId}?token=${token}`;

      console.log(`Generating PDF for invoice URL: ${invoiceUrl}`);

      // Navigate to the invoice page
      console.log(`🌐 Navigating to: ${invoiceUrl}`);
      const response = await page.goto(invoiceUrl, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      console.log(`📄 Page response status: ${response.status()}`);
      console.log(`📄 Page response headers:`, response.headers());

      // Check if page loaded successfully
      if (!response.ok()) {
        const pageContent = await page.content();
        console.log(`❌ Page failed to load. Content preview:`, pageContent.substring(0, 500));
        throw new Error(`Failed to load invoice page: HTTP ${response.status()}`);
      }

      // Wait for the invoice content to load
      console.log(`⏳ Waiting for invoice content to load...`);
      try {
        await page.waitForSelector('.bg-card', { timeout: 15000 });
        console.log(`✅ Invoice content loaded successfully`);
      } catch (selectorError) {
        const pageContent = await page.content();
        console.log(`❌ Invoice content failed to load. Page content:`, pageContent.substring(0, 1000));
        throw new Error(`Invoice content not found on page: ${selectorError.message}`);
      }

      // Apply PDF-specific styling that respects user settings
      await page.addStyleTag({
        content: `
          /* Hide download button header for PDF */
          .bg-card.border-b { display: none !important; }

          /* PDF-optimized layout */
          body {
            margin: 0;
            padding: 20px;
            background: white !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }

          /* Ensure full width for PDF */
          .max-w-4xl {
            max-width: none !important;
            margin: 0 !important;
            width: 100% !important;
          }

          /* Ensure proper background colors for PDF */
          .bg-card, .bg-background {
            background: white !important;
          }

          /* Ensure text is visible in PDF */
          .text-foreground, .text-card-foreground {
            color: #000 !important;
          }

          .text-muted-foreground {
            color: #666 !important;
          }

          /* Ensure borders are visible */
          .border, .border-border {
            border-color: #e5e7eb !important;
          }

          /* Ensure table styling is preserved */
          table {
            border-collapse: collapse !important;
          }

          /* Print-friendly colors for different themes */
          .bg-muted {
            background-color: #f9fafb !important;
          }

          /* Ensure company logo is properly sized */
          img {
            max-height: 80px !important;
            width: auto !important;
          }
        `
      });

      // Get PDF format from options or default to A4
      const format = options.format || 'A4';

      // Generate PDF with enhanced options
      const pdfOptions = {
        format: format,
        printBackground: true,
        preferCSSPageSize: false,
        margin: {
          top: '0.5in',
          right: '0.5in',
          bottom: '0.5in',
          left: '0.5in'
        },
        ...options
      };

      console.log(`📄 Generating PDF with options:`, pdfOptions);
      const pdfBuffer = await page.pdf(pdfOptions);

      // Validate PDF buffer
      if (!pdfBuffer || pdfBuffer.length === 0) {
        throw new Error('Generated PDF buffer is empty');
      }

      // Check if buffer starts with PDF signature
      const bufferStart = pdfBuffer.slice(0, 20);
      const pdfSignature = bufferStart.slice(0, 4).toString();
      console.log(`🔍 Buffer signature check:`, {
        length: pdfBuffer.length,
        signature: pdfSignature,
        bufferStart: bufferStart.toString('hex').substring(0, 40)
      });

      if (pdfSignature !== '%PDF') {
        // Log what we actually got instead of PDF
        console.log(`❌ Invalid PDF signature. Expected '%PDF', got '${pdfSignature}'`);
        console.log(`❌ Buffer start (as string):`, bufferStart.toString());
        console.log(`❌ Buffer start (as hex):`, bufferStart.toString('hex'));
        throw new Error(`Generated buffer is not a valid PDF file. Got signature: '${pdfSignature}'`);
      }

      console.log(`✅ PDF generated successfully for invoice ${invoiceId} with format ${format}, size: ${pdfBuffer.length} bytes`);
      return pdfBuffer;

    } catch (error) {
      console.error(`Error generating PDF for invoice ${invoiceId}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Generate PDF for reports or other pages
   */
  async generatePagePDF(url, options = {}) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const page = await this.browser.newPage();
    
    try {
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 2
      });

      await page.goto(url, {
        waitUntil: 'networkidle0',
        timeout: 30000
      });

      const pdfOptions = {
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20px',
          right: '20px',
          bottom: '20px',
          left: '20px'
        },
        ...options
      };

      const pdfBuffer = await page.pdf(pdfOptions);
      return pdfBuffer;

    } catch (error) {
      console.error(`Error generating PDF for URL ${url}:`, error);
      throw error;
    } finally {
      await page.close();
    }
  }

  /**
   * Close the browser instance
   */
  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.isInitialized = false;
      console.log('PDF Generator Service closed');
    }
  }

  /**
   * Get browser status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      browserConnected: this.browser && this.browser.isConnected()
    };
  }
}

// Create singleton instance
const pdfGeneratorService = new PDFGeneratorService();

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down PDF Generator Service...');
  await pdfGeneratorService.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down PDF Generator Service...');
  await pdfGeneratorService.close();
  process.exit(0);
});

export default pdfGeneratorService;
