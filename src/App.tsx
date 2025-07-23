import React, { useState, useEffect, useCallback } from 'react'
import { FileText, History, Upload as UploadIcon } from 'lucide-react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { DocumentUpload } from '@/components/DocumentUpload'
import { ProcessingStatus } from '@/components/ProcessingStatus'
import { SummaryDisplay } from '@/components/SummaryDisplay'
import { DocumentHistory } from '@/components/DocumentHistory'
import { DocumentProcessor } from '@/services/documentProcessor'
import { DocumentProcessing, BondIndentureSummary } from '@/types/document'
import { blink } from '@/blink/client'
import './App.css'

function App() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [currentProcessing, setCurrentProcessing] = useState<DocumentProcessing | null>(null)
  const [currentSummary, setSummary] = useState<BondIndentureSummary | null>(null)
  const [documentHistory, setDocumentHistory] = useState<DocumentProcessing[]>([])
  const [activeTab, setActiveTab] = useState('upload')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setUser(state.user)
      setLoading(state.isLoading)
    })
    return unsubscribe
  }, [])

  const loadDocumentHistory = useCallback(async () => {
    if (!user?.id) return
    
    try {
      const documents = await blink.db.documents.list({
        where: { user_id: user.id },
        orderBy: { created_at: 'desc' },
        limit: 20
      })

      const processedDocs: DocumentProcessing[] = documents.map(doc => ({
        id: doc.id,
        fileName: doc.file_name,
        fileSize: doc.file_size,
        uploadedAt: doc.uploaded_at ? new Date(doc.uploaded_at) : new Date(),
        status: doc.status as DocumentProcessing['status'],
        steps: [], // We'll populate this if needed
        extractedText: doc.extracted_text,
        errorMessage: doc.error_message
      }))

      setDocumentHistory(processedDocs)
    } catch (error) {
      console.error('Failed to load document history:', error)
    }
  }, [user?.id])

  useEffect(() => {
    if (user) {
      loadDocumentHistory()
    }
  }, [user, loadDocumentHistory])

  const handleFileUpload = async (file: File) => {
    setError(null)
    setCurrentProcessing(null)
    setSummary(null)
    setActiveTab('processing')

    const processor = new DocumentProcessor((processing) => {
      setCurrentProcessing(processing)
    })

    try {
      const documentId = await processor.processDocument(file)
      
      // Save document to database
      await blink.db.documents.create({
        id: documentId,
        user_id: user.id,
        file_name: file.name,
        file_size: file.size,
        status: 'completed',
        extracted_text: currentProcessing?.extractedText || ''
      })

      // Parse and save summary
      if (currentProcessing?.summary) {
        const summaryData = JSON.parse(currentProcessing.summary)
        
        await blink.db.summaries.create({
          id: summaryData.id,
          document_id: documentId,
          user_id: user.id,
          issuer: summaryData.issuer,
          bond_type: summaryData.bondType,
          principal_amount: summaryData.principalAmount,
          interest_rate: summaryData.interestRate,
          maturity_date: summaryData.maturityDate,
          key_terms: JSON.stringify(summaryData.keyTerms),
          covenants: JSON.stringify(summaryData.covenants),
          default_provisions: JSON.stringify(summaryData.defaultProvisions),
          executive_summary: summaryData.executiveSummary
        })

        setSummary(summaryData)
        setActiveTab('summary')
      }

      await loadDocumentHistory()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed'
      setError(errorMessage)
      
      // Save failed document to database
      if (currentProcessing) {
        await blink.db.documents.create({
          id: currentProcessing.id,
          user_id: user.id,
          file_name: file.name,
          file_size: file.size,
          status: 'error',
          error_message: errorMessage
        })
        await loadDocumentHistory()
      }
    }
  }

  const handleViewSummary = async (documentId: string) => {
    try {
      const summaries = await blink.db.summaries.list({
        where: { document_id: documentId, user_id: user.id },
        limit: 1
      })

      if (summaries.length > 0) {
        const summary = summaries[0]
        const summaryData: BondIndentureSummary = {
          id: summary.id,
          documentId: summary.document_id,
          issuer: summary.issuer,
          bondType: summary.bond_type,
          principalAmount: summary.principal_amount,
          interestRate: summary.interest_rate,
          maturityDate: summary.maturity_date,
          keyTerms: JSON.parse(summary.key_terms),
          covenants: JSON.parse(summary.covenants),
          defaultProvisions: JSON.parse(summary.default_provisions),
          executiveSummary: summary.executive_summary,
          createdAt: summary.created_at ? new Date(summary.created_at) : new Date()
        }
        
        setSummary(summaryData)
        setActiveTab('summary')
      }
    } catch (error) {
      console.error('Failed to load summary:', error)
      setError('Failed to load document summary')
    }
  }

  const handleExport = async (format: 'pdf' | 'word' | 'text') => {
    if (!currentSummary) return
    
    // For now, we'll create a simple text export
    // In a real implementation, you'd generate proper PDF/Word documents
    const content = `
BOND INDENTURE SUMMARY

Issuer: ${currentSummary.issuer}
Bond Type: ${currentSummary.bondType}
Principal Amount: ${currentSummary.principalAmount}
Interest Rate: ${currentSummary.interestRate}
Maturity Date: ${currentSummary.maturityDate}

EXECUTIVE SUMMARY
${currentSummary.executiveSummary}

KEY TERMS
${currentSummary.keyTerms.map(term => `• ${term}`).join('\n')}

COVENANTS
${currentSummary.covenants.map(covenant => `• ${covenant}`).join('\n')}

DEFAULT PROVISIONS
${currentSummary.defaultProvisions.map(provision => `• ${provision}`).join('\n')}

Generated on: ${new Date().toLocaleDateString()}
`

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bond-summary-${currentSummary.issuer.replace(/\s+/g, '-').toLowerCase()}.${format === 'text' ? 'txt' : format}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const calculateOverallProgress = (processing: DocumentProcessing | null): number => {
    if (!processing) return 0
    const completedSteps = processing.steps.filter(step => step.status === 'completed').length
    const totalSteps = processing.steps.length
    return (completedSteps / totalSteps) * 100
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center space-x-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span>Bond Indenture Summarizer</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-gray-600 mb-6">
              Please sign in to upload and analyze bond indenture documents
            </p>
            <Button onClick={() => blink.auth.login()} className="w-full">
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-semibold text-gray-900">
                Bond Indenture Summarizer
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">Welcome, {user.email}</span>
              <Button variant="outline" onClick={() => blink.auth.logout()}>
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload" className="flex items-center space-x-2">
              <UploadIcon className="h-4 w-4" />
              <span>Upload</span>
            </TabsTrigger>
            <TabsTrigger value="processing" disabled={!currentProcessing}>
              Processing
            </TabsTrigger>
            <TabsTrigger value="summary" disabled={!currentSummary}>
              Summary
            </TabsTrigger>
          </TabsList>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <TabsContent value="upload" className="mt-0">
                <DocumentUpload
                  onFileUpload={handleFileUpload}
                  isProcessing={!!currentProcessing && currentProcessing.status === 'processing'}
                />
              </TabsContent>

              <TabsContent value="processing" className="mt-0">
                {currentProcessing && (
                  <ProcessingStatus
                    fileName={currentProcessing.fileName}
                    steps={currentProcessing.steps}
                    overallProgress={calculateOverallProgress(currentProcessing)}
                  />
                )}
              </TabsContent>

              <TabsContent value="summary" className="mt-0">
                {currentSummary && (
                  <SummaryDisplay
                    summary={currentSummary}
                    onExport={handleExport}
                  />
                )}
              </TabsContent>
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <DocumentHistory
                documents={documentHistory}
                onViewSummary={handleViewSummary}
              />
            </div>
          </div>
        </Tabs>
      </main>
    </div>
  )
}

export default App