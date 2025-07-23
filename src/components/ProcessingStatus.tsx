import React from 'react'
import { CheckCircle, Clock, AlertCircle, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ProcessingStep } from '@/types/document'

interface ProcessingStatusProps {
  fileName: string
  steps: ProcessingStep[]
  overallProgress: number
}

export function ProcessingStatus({ fileName, steps, overallProgress }: ProcessingStatusProps) {
  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'processing':
        return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-500" />
      default:
        return <Clock className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>
      case 'processing':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>
      case 'error':
        return <Badge variant="destructive">Error</Badge>
      default:
        return <Badge variant="secondary">Pending</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Processing: {fileName}</span>
          <Badge variant="outline">{Math.round(overallProgress)}% Complete</Badge>
        </CardTitle>
        <Progress value={overallProgress} className="w-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
              {getStepIcon(step.status)}
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">{step.name}</h4>
                  {getStatusBadge(step.status)}
                </div>
                {step.message && (
                  <p className="text-sm text-gray-600 mt-1">{step.message}</p>
                )}
                {step.progress !== undefined && step.status === 'processing' && (
                  <Progress value={step.progress} className="w-full mt-2 h-2" />
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}