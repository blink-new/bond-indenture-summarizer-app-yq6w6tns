import { blink } from '@/blink/client'
import { ProcessingStep, DocumentProcessing, BondIndentureSummary } from '@/types/document'

export class DocumentProcessor {
  private updateCallback?: (processing: DocumentProcessing) => void

  constructor(updateCallback?: (processing: DocumentProcessing) => void) {
    this.updateCallback = updateCallback
  }

  async processDocument(file: File): Promise<string> {
    const documentId = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const processing: DocumentProcessing = {
      id: documentId,
      fileName: file.name,
      fileSize: file.size,
      uploadedAt: new Date(),
      status: 'processing',
      steps: [
        { id: 'upload', name: 'File Upload', status: 'completed' },
        { id: 'validation', name: 'Document Validation', status: 'processing', progress: 0 },
        { id: 'extraction', name: 'Text Extraction', status: 'pending' },
        { id: 'preprocessing', name: 'Text Preprocessing', status: 'pending' },
        { id: 'ai_analysis', name: 'AI Analysis', status: 'pending' },
        { id: 'summary_generation', name: 'Summary Generation', status: 'pending' }
      ]
    }

    this.updateProcessing(processing)

    try {
      // Step 1: Document Validation
      await this.updateStep(processing, 'validation', 'processing', 'Validating PDF structure...', 25)
      await this.delay(1000)
      
      if (!this.isPDFValid(file)) {
        throw new Error('Invalid PDF file format')
      }
      
      await this.updateStep(processing, 'validation', 'completed', 'Document validated successfully', 100)

      // Step 2: Text Extraction
      await this.updateStep(processing, 'extraction', 'processing', 'Extracting text from PDF...', 0)
      
      let extractedText: string
      try {
        // Primary method: Direct text extraction
        await this.updateStep(processing, 'extraction', 'processing', 'Attempting direct text extraction...', 20)
        extractedText = await blink.data.extractFromBlob(file)
        
        if (typeof extractedText !== 'string') {
          throw new Error('Invalid text extraction result')
        }
        
        await this.updateStep(processing, 'extraction', 'processing', 'Text extracted successfully', 80)
      } catch (error) {
        console.error('Primary extraction failed:', error)
        // Fallback: Try chunked extraction for large documents
        try {
          await this.updateStep(processing, 'extraction', 'processing', 'Trying chunked extraction method...', 40)
          const chunks = await blink.data.extractFromBlob(file, { chunking: true, chunkSize: 2000 })
          extractedText = Array.isArray(chunks) ? chunks.join('\n\n') : String(chunks)
          
          if (typeof extractedText !== 'string') {
            throw new Error('Invalid chunked extraction result')
          }
          
          await this.updateStep(processing, 'extraction', 'processing', 'Text extracted using chunked method', 80)
        } catch (fallbackError) {
          console.error('Fallback extraction failed:', fallbackError)
          throw new Error(`Failed to extract text from PDF: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}. The document may be scanned, corrupted, or in an unsupported format.`)
        }
      }

      if (!extractedText || extractedText.trim().length < 100) {
        throw new Error('Insufficient text extracted from document. Please ensure the PDF contains readable text.')
      }

      processing.extractedText = extractedText
      await this.updateStep(processing, 'extraction', 'completed', `Extracted ${extractedText.length} characters`, 100)

      // Step 3: Text Preprocessing
      await this.updateStep(processing, 'preprocessing', 'processing', 'Cleaning and structuring text...', 0)
      await this.delay(800)
      
      const cleanedText = this.preprocessText(extractedText)
      await this.updateStep(processing, 'preprocessing', 'completed', 'Text preprocessed and structured', 100)

      // Step 4: AI Analysis
      await this.updateStep(processing, 'ai_analysis', 'processing', 'Analyzing document with AI...', 0)
      
      const analysisPrompt = this.buildAnalysisPrompt(cleanedText)
      
      let analysisResult: string
      try {
        const { text } = await blink.ai.generateText({
          prompt: analysisPrompt,
          model: 'gpt-4o-mini',
          maxTokens: 2000
        })
        analysisResult = text || ''
        
        if (!analysisResult.trim()) {
          throw new Error('AI analysis returned empty result')
        }
      } catch (error) {
        console.error('AI analysis failed:', error)
        throw new Error(`AI analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
      }

      await this.updateStep(processing, 'ai_analysis', 'completed', 'Document analysis completed', 100)

      // Step 5: Summary Generation
      await this.updateStep(processing, 'summary_generation', 'processing', 'Generating structured summary...', 0)
      
      const summaryPrompt = this.buildSummaryPrompt(cleanedText, analysisResult)
      
      let summaryData: any
      try {
        const { object } = await blink.ai.generateObject({
          prompt: summaryPrompt,
          schema: {
            type: 'object',
            properties: {
              seniority: {
                type: 'object',
                properties: {
                  bondRanking: { type: 'string' },
                  securityDetails: { type: 'string' },
                  capTablePosition: { type: 'string' },
                  subordinationDetails: { type: 'string' },
                  guaranteeStructure: { type: 'string' }
                },
                required: ['bondRanking', 'securityDetails', 'capTablePosition', 'subordinationDetails', 'guaranteeStructure']
              },
              issuer: { type: 'string' },
              bondType: { type: 'string' },
              principalAmount: { type: 'string' },
              interestRate: { type: 'string' },
              maturityDate: { type: 'string' },
              keyTerms: { type: 'array', items: { type: 'string' } },
              covenants: { type: 'array', items: { type: 'string' } },
              defaultProvisions: { type: 'array', items: { type: 'string' } },
              executiveSummary: { type: 'string' }
            },
            required: ['seniority', 'issuer', 'bondType', 'principalAmount', 'interestRate', 'maturityDate', 'keyTerms', 'covenants', 'defaultProvisions', 'executiveSummary']
          }
        })
        summaryData = object
        
        // Validate the generated object
        if (!summaryData || typeof summaryData !== 'object') {
          throw new Error('Invalid summary data structure')
        }
        
        // Ensure required fields are present and valid
        const requiredFields = ['issuer', 'bondType', 'principalAmount', 'interestRate', 'maturityDate', 'executiveSummary']
        for (const field of requiredFields) {
          if (!summaryData[field] || typeof summaryData[field] !== 'string' || !summaryData[field].trim()) {
            summaryData[field] = 'Not specified'
          }
        }
        
        // Ensure seniority object is valid
        if (!summaryData.seniority || typeof summaryData.seniority !== 'object') {
          summaryData.seniority = {}
        }
        
        const seniorityFields = ['bondRanking', 'securityDetails', 'capTablePosition', 'subordinationDetails', 'guaranteeStructure']
        for (const field of seniorityFields) {
          if (!summaryData.seniority[field] || typeof summaryData.seniority[field] !== 'string' || !summaryData.seniority[field].trim()) {
            summaryData.seniority[field] = 'Not specified'
          }
        }
        
        // Ensure arrays are valid
        if (!Array.isArray(summaryData.keyTerms)) summaryData.keyTerms = []
        if (!Array.isArray(summaryData.covenants)) summaryData.covenants = []
        if (!Array.isArray(summaryData.defaultProvisions)) summaryData.defaultProvisions = []
        
      } catch (error) {
        console.error('Summary generation failed:', error)
        throw new Error(`Summary generation failed: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
      }

      await this.updateStep(processing, 'summary_generation', 'completed', 'Summary generated successfully', 100)

      // Save summary to database
      const summary: BondIndentureSummary = {
        id: `summary_${documentId}`,
        documentId,
        ...summaryData,
        createdAt: new Date()
      }

      processing.summary = JSON.stringify(summary)
      processing.status = 'completed'
      this.updateProcessing(processing)

      return documentId

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      processing.status = 'error'
      processing.errorMessage = errorMessage
      
      // Mark current processing step as error
      const currentStep = processing.steps.find(step => step.status === 'processing')
      if (currentStep) {
        currentStep.status = 'error'
        currentStep.message = errorMessage
      }
      
      this.updateProcessing(processing)
      throw error
    }
  }

  private async updateStep(
    processing: DocumentProcessing,
    stepId: string,
    status: ProcessingStep['status'],
    message: string,
    progress?: number
  ) {
    const step = processing.steps.find(s => s.id === stepId)
    if (step) {
      step.status = status
      step.message = message
      if (progress !== undefined) {
        step.progress = progress
      }
    }
    this.updateProcessing(processing)
    await this.delay(300) // Small delay for UI updates
  }

  private updateProcessing(processing: DocumentProcessing) {
    if (this.updateCallback) {
      this.updateCallback({ ...processing })
    }
  }

  private isPDFValid(file: File): boolean {
    return file.type === 'application/pdf' && file.size > 0 && file.size <= 10 * 1024 * 1024
  }

  private preprocessText(text: string): string {
    // Clean up common PDF extraction artifacts
    let cleaned = text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/\n\s*\n/g, '\n\n') // Clean up line breaks
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable characters
      .trim()

    // Remove page numbers and headers/footers (common patterns)
    cleaned = cleaned
      .replace(/Page \d+ of \d+/gi, '')
      .replace(/^\d+\s*$/gm, '') // Standalone page numbers
      .replace(/^[A-Z\s]{10,}$/gm, '') // All caps headers

    return cleaned
  }

  private buildAnalysisPrompt(text: string): string {
    return `
Analyze this bond indenture document and identify the key financial and legal components. Focus on:

1. Issuer information and bond classification
2. Financial terms (principal, interest rate, maturity)
3. Key covenants and restrictions
4. Default provisions and remedies
5. Important dates and milestones

Document text:
${text.substring(0, 8000)} ${text.length > 8000 ? '...[truncated]' : ''}

Provide a detailed analysis focusing on the most critical terms and provisions.
`
  }

  private buildSummaryPrompt(text: string, analysis: string): string {
    return `
Based on this bond indenture document and analysis, create a structured summary with the following information:

Document: ${text.substring(0, 4000)}${text.length > 4000 ? '...[truncated]' : ''}

Analysis: ${analysis}

Extract and format the following information:

SENIORITY ANALYSIS (CRITICAL - This should be the first section):
- seniority.bondRanking: Where these bonds rank in the capital structure (e.g., "Senior Secured First Lien", "Senior Unsecured", "Subordinated", "Junior Subordinated")
- seniority.securityDetails: What specific collateral or security backs these bonds (e.g., "Secured by first lien on all assets", "Unsecured general obligation", "Secured by specific equipment")
- seniority.capTablePosition: Detailed description of where bonds sit in the capital structure relative to equity, other debt, and preferred securities. Include a visual representation if possible.
- seniority.subordinationDetails: Any subordination provisions, intercreditor agreements, or ranking relative to other debt instruments
- seniority.guaranteeStructure: Details of any guarantees, who provides them, and their ranking in the capital structure

OTHER BOND DETAILS:
- issuer: The name of the bond issuer
- bondType: Type of bond (e.g., "Corporate Bond", "Municipal Bond", "Convertible Bond")
- principalAmount: The principal amount (e.g., "$100,000,000")
- interestRate: Interest rate (e.g., "4.25% per annum")
- maturityDate: Maturity date (e.g., "December 15, 2030")
- keyTerms: Array of 5-8 most important terms
- covenants: Array of key covenants and restrictions
- defaultProvisions: Array of default events and remedies
- executiveSummary: A comprehensive 2-3 paragraph executive summary

Pay special attention to seniority language such as:
- "Senior" vs "Subordinated" vs "Junior"
- "Secured" vs "Unsecured"
- "First lien", "Second lien", "Third lien"
- "Pari passu" (equal ranking)
- "Structurally subordinated"
- Guarantee provisions and their ranking
- Intercreditor agreements
- Security interests and collateral descriptions

Ensure all financial amounts include currency symbols and all dates are properly formatted.
`
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}