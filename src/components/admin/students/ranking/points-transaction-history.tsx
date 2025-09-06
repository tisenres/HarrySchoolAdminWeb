'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  History,
  Search,
  Filter,
  Calendar,
  User,
  Plus,
  Minus,
  Zap,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import type { PointsTransaction } from '@/types/ranking'
import { fadeVariants, staggerContainer, staggerItem, tableRowVariants } from '@/lib/animations'

interface PointsTransactionHistoryProps {
  transactions: PointsTransaction[]
  loading?: boolean
  onLoadMore?: () => void
  hasMore?: boolean
}

const ITEMS_PER_PAGE = 10

export function PointsTransactionHistory({
  transactions,
  loading = false,
  onLoadMore,
  hasMore = false
}: PointsTransactionHistoryProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  // Filter transactions based on search and filters
  const filteredTransactions = useMemo(() => {
    return transactions.filter(transaction => {
      const matchesSearch = searchTerm === '' || 
        transaction.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.awarded_by_profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      
      const matchesCategory = categoryFilter === 'all' || transaction.category === categoryFilter
      const matchesType = typeFilter === 'all' || transaction.transaction_type === typeFilter

      return matchesSearch && matchesCategory && matchesType
    })
  }, [transactions, searchTerm, categoryFilter, typeFilter])

  // Pagination
  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedTransactions = filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Get unique categories and types for filters
  const categories = useMemo(() => {
    const cats = [...new Set(transactions.map(t => t.category))]
    return cats.filter(Boolean)
  }, [transactions])

  const getTransactionIcon = (type: string, amount: number) => {
    if (type === 'bonus') return <Zap className="h-4 w-4 text-purple-500" />
    if (amount > 0) return <Plus className="h-4 w-4 text-green-500" />
    return <Minus className="h-4 w-4 text-red-500" />
  }

  const getTransactionColor = (type: string, amount: number) => {
    if (type === 'bonus') return 'bg-purple-100 text-purple-800 border-purple-200'
    if (amount > 0) return 'bg-green-100 text-green-800 border-green-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading && transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-4 w-4" />
            <span>Points History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-muted rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      variants={fadeVariants}
      initial="hidden"
      animate="visible"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>Points History</span>
            </div>
            <Badge variant="secondary">
              {filteredTransactions.length} transactions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filters */}
          <motion.div 
            variants={staggerItem}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="earned">Earned</SelectItem>
                <SelectItem value="deducted">Deducted</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Transactions Table */}
          {filteredTransactions.length > 0 ? (
            <motion.div variants={staggerContainer}>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Awarded By</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTransactions.map((transaction, index) => (
                      <motion.tr
                        key={transaction.id}
                        variants={tableRowVariants}
                        custom={index}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getTransactionIcon(transaction.transaction_type, transaction.points_amount)}
                            <Badge className={`${getTransactionColor(transaction.transaction_type, transaction.points_amount)} text-xs`}>
                              {transaction.transaction_type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={`font-mono font-medium ${
                            transaction.points_amount > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {transaction.points_amount > 0 ? '+' : ''}{transaction.points_amount}
                          </div>
                          {transaction.coins_earned > 0 && (
                            <div className="text-xs text-green-600">
                              +{transaction.coins_earned} coins
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <p className="text-sm font-medium truncate">
                              {transaction.reason}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {transaction.category}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <User className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {transaction.awarded_by_profile?.full_name || 'System'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(transaction.created_at)}</span>
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredTransactions.length)} of {filteredTransactions.length} transactions
                  </p>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Load More for infinite scroll */}
              {hasMore && onLoadMore && (
                <div className="flex justify-center mt-6">
                  <Button
                    variant="outline"
                    onClick={onLoadMore}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load More'}
                  </Button>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              variants={staggerItem}
              className="text-center py-12"
            >
              <History className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No transactions found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || categoryFilter !== 'all' || typeFilter !== 'all'
                  ? 'Try adjusting your filters to see more results.'
                  : 'This student hasn\'t earned or spent any points yet.'}
              </p>
              {(searchTerm || categoryFilter !== 'all' || typeFilter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('')
                    setCategoryFilter('all')
                    setTypeFilter('all')
                    setCurrentPage(1)
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </motion.div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}