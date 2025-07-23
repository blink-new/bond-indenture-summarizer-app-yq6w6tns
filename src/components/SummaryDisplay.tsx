import React from 'react'
import { Download, FileText, Calendar, DollarSign, Shield, AlertTriangle, TrendingUp, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { BondIndentureSummary } from '@/types/document'

interface SummaryDisplayProps {
  summary: BondIndentureSummary
  onExport: (format: 'pdf' | 'word' | 'text') => void
}

export function SummaryDisplay({ summary, onExport }: SummaryDisplayProps) {
  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Bond Indenture Summary</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" onClick={() => onExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('word')}>
                <Download className="h-4 w-4 mr-2" />
                Word
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('text')}>
                <Download className="h-4 w-4 mr-2" />
                Text
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Seniority Analysis - Most Important Section */}
      <Card className="border-2 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl text-blue-800">
            <TrendingUp className="h-6 w-6" />
            <span>Seniority Analysis</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-blue-700">Bond Ranking</label>
              <p className="text-lg font-semibold text-gray-800 mt-1">
                {summary.seniority?.bondRanking || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-700">Security Details</label>
              <p className="text-gray-700 mt-1">
                {summary.seniority?.securityDetails || 'Not specified'}
              </p>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <label className="text-sm font-medium text-blue-700 flex items-center space-x-1">
              <Lock className="h-4 w-4" />
              <span>Capital Table Position</span>
            </label>
            <div className="mt-2 p-4 bg-white rounded-lg border">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {summary.seniority?.capTablePosition || 'Not specified'}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-blue-700">Subordination Details</label>
              <p className="text-gray-700 mt-1">
                {summary.seniority?.subordinationDetails || 'Not specified'}
              </p>
            </div>
            <div>
              <label className="text-sm font-medium text-blue-700">Guarantee Structure</label>
              <p className="text-gray-700 mt-1">
                {summary.seniority?.guaranteeStructure || 'Not specified'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <DollarSign className="h-5 w-5" />
              <span>Bond Details</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Issuer</label>
              <p className="text-lg font-semibold">{summary.issuer}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Bond Type</label>
              <Badge variant="secondary" className="ml-2">{summary.bondType}</Badge>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Principal Amount</label>
              <p className="text-lg font-semibold text-green-600">{summary.principalAmount}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Interest Rate</label>
              <p className="text-lg font-semibold">{summary.interestRate}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-lg">
              <Calendar className="h-5 w-5" />
              <span>Timeline</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-600">Maturity Date</label>
              <p className="text-lg font-semibold">{summary.maturityDate}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-600">Summary Generated</label>
              <p className="text-sm text-gray-500">
                {new Date(summary.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Executive Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
              {summary.executiveSummary}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Key Terms */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>Key Terms</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {summary.keyTerms.map((term, index) => (
              <Badge key={index} variant="outline" className="justify-start p-2">
                {term}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Covenants */}
      <Card>
        <CardHeader>
          <CardTitle>Covenants</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.covenants.map((covenant, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700">{covenant}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Default Provisions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <span>Default Provisions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {summary.defaultProvisions.map((provision, index) => (
              <li key={index} className="flex items-start space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0" />
                <span className="text-gray-700">{provision}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}