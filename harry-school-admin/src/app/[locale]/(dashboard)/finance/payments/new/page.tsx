import { getTranslations } from 'next-intl/server'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, DollarSign, CreditCard, Receipt, Calculator } from 'lucide-react'
import Link from 'next/link'

export default async function NewPaymentPage() {
  const t = await getTranslations('finance')
  const tCommon = await getTranslations('common')

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/finance">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Finance
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Record Payment</h1>
          <p className="text-muted-foreground">
            Record a new payment from a student or parent
          </p>
        </div>
      </div>

      <div className="grid gap-6 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payment Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="student">Student *</Label>
                <Select name="student" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student1">John Doe - ID: STD001</SelectItem>
                    <SelectItem value="student2">Jane Smith - ID: STD002</SelectItem>
                    <SelectItem value="student3">Mike Johnson - ID: STD003</SelectItem>
                    <SelectItem value="student4">Sarah Williams - ID: STD004</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentDate">Payment Date *</Label>
                <Input
                  id="paymentDate"
                  name="paymentDate"
                  type="date"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (UZS) *</Label>
                <Input
                  id="amount"
                  name="amount"
                  type="number"
                  placeholder="500000"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Payment Method *</Label>
                <Select name="paymentMethod" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="debit_card">Debit Card</SelectItem>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="paymentType">Payment Type *</Label>
                <Select name="paymentType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tuition">Tuition Fee</SelectItem>
                    <SelectItem value="registration">Registration Fee</SelectItem>
                    <SelectItem value="materials">Study Materials</SelectItem>
                    <SelectItem value="exam">Exam Fee</SelectItem>
                    <SelectItem value="activity">Activity Fee</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="period">Payment Period</Label>
                <Select name="period">
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="january">January 2025</SelectItem>
                    <SelectItem value="february">February 2025</SelectItem>
                    <SelectItem value="march">March 2025</SelectItem>
                    <SelectItem value="april">April 2025</SelectItem>
                    <SelectItem value="may">May 2025</SelectItem>
                    <SelectItem value="june">June 2025</SelectItem>
                    <SelectItem value="july">July 2025</SelectItem>
                    <SelectItem value="august">August 2025</SelectItem>
                    <SelectItem value="september">September 2025</SelectItem>
                    <SelectItem value="october">October 2025</SelectItem>
                    <SelectItem value="november">November 2025</SelectItem>
                    <SelectItem value="december">December 2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Transaction Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="receiptNumber">Receipt Number</Label>
                <Input
                  id="receiptNumber"
                  name="receiptNumber"
                  placeholder="Auto-generated"
                  disabled
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referenceNumber">Reference Number</Label>
                <Input
                  id="referenceNumber"
                  name="referenceNumber"
                  placeholder="Transaction reference"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payer">Payer Name</Label>
              <Input
                id="payer"
                name="payer"
                placeholder="Name of person making payment"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Payment Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional notes about this payment..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Balance Summary
            </CardTitle>
            <CardDescription>
              Current balance information for the selected student
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Previous Balance</p>
                <p className="text-2xl font-semibold">1,500,000 UZS</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">This Payment</p>
                <p className="text-2xl font-semibold text-green-600">0 UZS</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Remaining Balance</p>
                <p className="text-2xl font-semibold">1,500,000 UZS</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="sendReceipt"
                name="sendReceipt"
                className="h-4 w-4"
              />
              <Label htmlFor="sendReceipt" className="font-normal cursor-pointer">
                Send receipt to student/parent email
              </Label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="printReceipt"
                name="printReceipt"
                className="h-4 w-4"
              />
              <Label htmlFor="printReceipt" className="font-normal cursor-pointer">
                Print receipt after saving
              </Label>
            </div>
            <div className="flex items-center gap-4">
              <input
                type="checkbox"
                id="updateBalance"
                name="updateBalance"
                className="h-4 w-4"
                defaultChecked
              />
              <Label htmlFor="updateBalance" className="font-normal cursor-pointer">
                Automatically update student balance
              </Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-4">
          <Button type="submit" className="flex-1">
            <Save className="h-4 w-4 mr-2" />
            Record Payment
          </Button>
          <Button variant="outline" asChild>
            <Link href="/finance">
              Cancel
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}