export interface ProcessingStep {
  id: string
  name: string
  status: 'pending' | 'processing' | 'completed' | 'error'
  message?: string
  progress?: number
}

export interface DocumentProcessing {
  id: string
  fileName: string
  fileSize: number
  uploadedAt: Date
  status: 'uploading' | 'processing' | 'completed' | 'error'
  steps: ProcessingStep[]
  extractedText?: string
  summary?: string
  errorMessage?: string
}

export interface BondIndentureSummary {
  id: string
  documentId: string
  seniority: {
    bondRanking: string
    securityDetails: string
    capTablePosition: string
    subordinationDetails: string
    guaranteeStructure: string
  }
  issuer: string
  bondType: string
  principalAmount: string
  interestRate: string
  maturityDate: string
  keyTerms: string[]
  covenants: string[]
  defaultProvisions: string[]
  executiveSummary: string
  createdAt: Date
}