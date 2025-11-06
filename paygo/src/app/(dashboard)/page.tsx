"use client"

import { useState, useCallback } from "react"
import {
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  FileText,
  RefreshCw,
  Settings,
  Download,
  Clock,
  Flag,
  CalendarDays,
  DollarSign,
} from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts"
import toast from "react-hot-toast"

const processingData = [
  { date: "Mon", processed: 120, flagged: 8 },
  { date: "Tue", processed: 145, flagged: 12 },
  { date: "Wed", processed: 138, flagged: 6 },
  { date: "Thu", processed: 165, flagged: 14 },
  { date: "Fri", processed: 182, flagged: 11 },
  { date: "Sat", processed: 95, flagged: 5 },
]

// TypeScript interfaces for invoice extraction
interface ExtractedField {
  name: string
  value: string
  confidence: number
}

interface Invoice {
  id: string
  vendorName: string
  invoiceNumber: string
  amount: number
  date: string
  dueDate: string
  status: "completed" | "flagged" | "processing"
  confidenceScore: number
  extractedFields: ExtractedField[]
  currency: string
}

interface ProcessingMetric {
  label: string
  value: number
  unit: string
  change: number
  trend: "up" | "down"
}

interface UpcomingPayment {
  id: string
  vendorName: string
  amount: number
  dueDate: string
  daysUntilDue: number
  invoiceNumber: string
  currency: string
  status: "on-time" | "upcoming" | "overdue"
}

export default function InvoiceDashboard() {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [activeTab, setActiveTab] = useState<"all" | "flagged">("all")
  const [isLoading, setIsLoading] = useState(false)

  const [totalProcessed, setTotalProcessed] = useState(1245)
  const [totalFlagged, setTotalFlagged] = useState(87)
  const [avgConfidence, setAvgConfidence] = useState(94.2)
  const [processingTime, setProcessingTime] = useState(2.3)

  const [processedInvoices, setProcessedInvoices] = useState<Invoice[]>([
    {
      id: "INV-001",
      vendorName: "Acme Corp",
      invoiceNumber: "2024-001",
      amount: 5230.5,
      date: "2024-01-15",
      dueDate: "2024-02-15",
      status: "completed",
      confidenceScore: 98,
      currency: "USD",
      extractedFields: [
        { name: "Invoice ID", value: "2024-001", confidence: 99 },
        { name: "Vendor", value: "Acme Corp", confidence: 98 },
        { name: "Amount", value: "$5230.50", confidence: 97 },
        { name: "Date", value: "2024-01-15", confidence: 99 },
      ],
    },
    {
      id: "INV-002",
      vendorName: "Global Supply Inc",
      invoiceNumber: "GS-2024-1045",
      amount: 12450.0,
      date: "2024-01-14",
      dueDate: "2024-02-14",
      status: "flagged",
      confidenceScore: 76,
      currency: "USD",
      extractedFields: [
        { name: "Invoice ID", value: "GS-2024-1045", confidence: 82 },
        { name: "Vendor", value: "Global Supply Inc", confidence: 78 },
        { name: "Amount", value: "$12450.00", confidence: 71 },
        { name: "Date", value: "2024-01-14", confidence: 85 },
      ],
    },
    {
      id: "INV-003",
      vendorName: "Tech Solutions Ltd",
      invoiceNumber: "TS-INV-5432",
      amount: 8750.25,
      date: "2024-01-13",
      dueDate: "2024-02-13",
      status: "completed",
      confidenceScore: 96,
      currency: "USD",
      extractedFields: [
        { name: "Invoice ID", value: "TS-INV-5432", confidence: 98 },
        { name: "Vendor", value: "Tech Solutions Ltd", confidence: 96 },
        { name: "Amount", value: "$8750.25", confidence: 95 },
        { name: "Date", value: "2024-01-13", confidence: 97 },
      ],
    },
    {
      id: "INV-004",
      vendorName: "Office Supplies Co",
      invoiceNumber: "OS-024567",
      amount: 1245.0,
      date: "2024-01-12",
      dueDate: "2024-02-12",
      status: "flagged",
      confidenceScore: 68,
      currency: "USD",
      extractedFields: [
        { name: "Invoice ID", value: "OS-024567", confidence: 72 },
        { name: "Vendor", value: "Office Supplies Co", confidence: 65 },
        { name: "Amount", value: "$1245.00", confidence: 64 },
        { name: "Date", value: "2024-01-12", confidence: 75 },
      ],
    },
    {
      id: "INV-005",
      vendorName: "Cloud Services Ltd",
      invoiceNumber: "CS-2024-8901",
      amount: 18950.0,
      date: "2024-01-11",
      dueDate: "2024-02-11",
      status: "completed",
      confidenceScore: 99,
      currency: "USD",
      extractedFields: [
        { name: "Invoice ID", value: "CS-2024-8901", confidence: 99 },
        { name: "Vendor", value: "Cloud Services Ltd", confidence: 99 },
        { name: "Amount", value: "$18950.00", confidence: 98 },
        { name: "Date", value: "2024-01-11", confidence: 99 },
      ],
    },
  ])

  const [upcomingPayments, setUpcomingPayments] = useState<UpcomingPayment[]>([
    {
      id: "PAY-001",
      vendorName: "Acme Corp",
      amount: 5230.5,
      dueDate: "2024-02-15",
      daysUntilDue: 11,
      invoiceNumber: "2024-001",
      currency: "USD",
      status: "upcoming",
    },
    {
      id: "PAY-002",
      vendorName: "Global Supply Inc",
      amount: 12450.0,
      dueDate: "2024-02-14",
      daysUntilDue: 10,
      invoiceNumber: "GS-2024-1045",
      currency: "USD",
      status: "upcoming",
    },
    {
      id: "PAY-003",
      vendorName: "Tech Solutions Ltd",
      amount: 8750.25,
      dueDate: "2024-02-13",
      daysUntilDue: 9,
      invoiceNumber: "TS-INV-5432",
      currency: "USD",
      status: "upcoming",
    },
    {
      id: "PAY-004",
      vendorName: "Cloud Services Ltd",
      amount: 18950.0,
      dueDate: "2024-02-11",
      daysUntilDue: 7,
      invoiceNumber: "CS-2024-8901",
      currency: "USD",
      status: "upcoming",
    },
    {
      id: "PAY-005",
      vendorName: "Office Supplies Co",
      amount: 1245.0,
      dueDate: "2024-02-12",
      daysUntilDue: 8,
      invoiceNumber: "OS-024567",
      currency: "USD",
      status: "upcoming",
    },
  ])

  const filteredInvoices =
    activeTab === "flagged" ? processedInvoices.filter((inv) => inv.status === "flagged") : processedInvoices

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))
      toast.success("Invoice data refreshed successfully")
    } catch (error) {
      toast.error("Failed to refresh invoice data")
    } finally {
      setIsLoading(false)
    }
  }, [])

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "text-green-600"
    if (confidence >= 75) return "text-yellow-600"
    return "text-red-600"
  }

  const getConfidenceBgColor = (confidence: number) => {
    if (confidence >= 90) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    if (confidence >= 75) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
  }

  const getStatusColor = (status: string) => {
    if (status === "overdue") return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
    if (status === "on-time") return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
    return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
  }

  const getStatusIcon = (status: string) => {
    if (status === "overdue") return <AlertCircle className="h-3 w-3" />
    if (status === "on-time") return <CheckCircle className="h-3 w-3" />
    return <CalendarDays className="h-3 w-3" />
  }

  const totalUpcomingAmount = upcomingPayments.reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Invoice Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">AI-powered invoice data extraction and processing</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 px-3 text-gray-900 dark:text-white"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 px-3 text-gray-900 dark:text-white"
            disabled={isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 px-3 text-gray-900 dark:text-white"
            disabled={isLoading}
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {/* Total Processed */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Total Processed</h3>
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalProcessed.toLocaleString()}</div>
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +12.5% this week
            </div>
          </div>
        </div>

        {/* Flagged for Review */}
        <div className="rounded-lg border border-yellow-200 dark:border-yellow-800 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Flagged Items</h3>
            <Flag className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{totalFlagged}</div>
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-2">
              <AlertCircle className="h-3 w-3 mr-1 text-yellow-600" />
              Need human review
            </div>
          </div>
        </div>

        {/* Avg Confidence Score */}
        <div className="rounded-lg border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Avg Confidence</h3>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{avgConfidence.toFixed(1)}%</div>
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-2">
              <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
              +2.3% vs last week
            </div>
          </div>
        </div>

        {/* Avg Processing Time */}
        <div className="rounded-lg border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Avg Processing</h3>
            <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">{processingTime}s</div>
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-2">
              <TrendingDown className="h-3 w-3 mr-1 text-green-500" />
              -0.4s improvement
            </div>
          </div>
        </div>

        {/* Upcoming Payments */}
        <div className="rounded-lg border border-indigo-200 dark:border-indigo-800 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
            <h3 className="tracking-tight text-sm font-medium text-gray-900 dark:text-white">Upcoming Payments</h3>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
              <CalendarDays className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            </div>
          </div>
          <div className="p-6 pt-0">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              ${totalUpcomingAmount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center text-xs text-gray-600 dark:text-gray-400 mt-2">
              <Clock className="h-3 w-3 mr-1" />
              {upcomingPayments.length} payments due in next 30 days
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Processing Trend Chart */}
        <div className="lg:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              Weekly Processing Trend
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Processed invoices and flagged items</p>
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="h-[300px] flex items-center justify-center">
                <div className="text-gray-600 dark:text-gray-400 animate-pulse">Loading chart...</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processingData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-300 dark:stroke-gray-600" />
                  <XAxis dataKey="date" className="text-gray-600 dark:text-gray-400" />
                  <YAxis className="text-gray-600 dark:text-gray-400" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#374151" }}
                  />
                  <Bar dataKey="processed" stackId="a" fill="#3b82f6" name="Processed" />
                  <Bar dataKey="flagged" stackId="a" fill="#f59e0b" name="Flagged" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              Processing Status
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Today's summary</p>
          </div>
          <div className="px-6 pb-6 space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Success Rate</span>
                <span className="text-sm font-bold text-green-600">95%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: "95%" }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Average Confidence</span>
                <span className="text-sm font-bold text-blue-600">{avgConfidence}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${avgConfidence}%` }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-900 dark:text-white">Review Needed</span>
                <span className="text-sm font-bold text-yellow-600">7%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-600 h-2 rounded-full" style={{ width: "7%" }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Processed Invoices */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
                  Processed Invoices
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Extracted data and confidence scores</p>
              </div>
              <div className="inline-flex h-10 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 p-1 text-gray-500 dark:text-gray-400">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                    activeTab === "all"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  All ({processedInvoices.length})
                </button>
                <button
                  onClick={() => setActiveTab("flagged")}
                  className={`inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 ${
                    activeTab === "flagged"
                      ? "bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm"
                      : "text-gray-600 dark:text-gray-400"
                  }`}
                >
                  Flagged ({processedInvoices.filter((i) => i.status === "flagged").length})
                </button>
              </div>
            </div>
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-blue-100 dark:bg-blue-900">
                          <span className="flex h-full w-full items-center justify-center text-blue-600 dark:text-blue-300 font-medium text-sm">
                            {invoice.vendorName.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-white">{invoice.vendorName}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">{invoice.invoiceNumber}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                        <span>{invoice.date}</span>
                        <span>•</span>
                        <span>Due: {invoice.dueDate}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {invoice.currency} {invoice.amount.toLocaleString()}
                        </div>
                        <div className="flex items-center justify-end gap-2 mt-2">
                          <span
                            className={`text-xs font-medium px-2 py-1 rounded ${getConfidenceBgColor(
                              invoice.confidenceScore,
                            )}`}
                          >
                            {invoice.confidenceScore}% confidence
                          </span>
                          {invoice.status === "flagged" && (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                              <Flag className="h-3 w-3 mr-1" />
                              Review
                            </span>
                          )}
                          {invoice.status === "completed" && (
                            <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Done
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Upcoming Payments Section */}
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              Payment Schedule
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Upcoming vendor payments organized by due date</p>
          </div>
          <div className="px-6 pb-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, index) => (
                  <div key={index} className="h-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingPayments
                  .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                  .map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-indigo-100 dark:bg-indigo-900">
                            <span className="flex h-full w-full items-center justify-center text-indigo-600 dark:text-indigo-300 font-medium text-sm">
                              {payment.vendorName.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 dark:text-white">{payment.vendorName}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400">{payment.invoiceNumber}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                          <CalendarDays className="h-3 w-3" />
                          <span>Due: {new Date(payment.dueDate).toLocaleDateString()}</span>
                          <span>•</span>
                          <span className="font-medium">{payment.daysUntilDue} days</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {payment.currency}{" "}
                            {payment.amount.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium mt-2 ${getStatusColor(payment.status)}`}
                          >
                            {getStatusIcon(payment.status)}
                            <span className="ml-1 capitalize">{payment.status.replace("-", " ")}</span>
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {activeTab === "flagged" && filteredInvoices.length > 0 && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-card-foreground shadow-sm">
          <div className="flex flex-col space-y-1.5 p-6 pb-4">
            <h3 className="text-2xl font-semibold leading-none tracking-tight text-gray-900 dark:text-white">
              Flagged Item Details
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Extracted fields with low confidence scores</p>
          </div>
          <div className="px-6 pb-6">
            <div className="space-y-4">
              {filteredInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="border-t border-gray-200 dark:border-gray-600 pt-4 first:border-0 first:pt-0"
                >
                  <div className="font-semibold text-gray-900 dark:text-white mb-3">
                    {invoice.vendorName} - {invoice.invoiceNumber}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {invoice.extractedFields.map((field) => (
                      <div
                        key={field.name}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                      >
                        <span className="text-sm text-gray-600 dark:text-gray-300">{field.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">{field.value}</span>
                          <span className={`text-xs font-semibold ${getConfidenceColor(field.confidence)}`}>
                            {field.confidence}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
