'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye, 
  Star, 
  StarOff,
  Copy,
  Search
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { rewardsService, RewardWithStats } from '@/lib/services/rewards-service'
import RewardForm from './reward-form'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { SkeletonTable } from '@/components/ui/skeleton-table'

interface RewardsCatalogTableProps {
  onEditReward?: (reward: RewardWithStats) => void
}

export default function RewardsCatalogTable({ onEditReward }: RewardsCatalogTableProps) {
  const t = useTranslations('rewards')
  const { toast } = useToast()
  
  const [rewards, setRewards] = useState<RewardWithStats[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  
  // Modal states
  const [editingReward, setEditingReward] = useState<RewardWithStats | null>(null)
  const [deletingReward, setDeletingReward] = useState<RewardWithStats | null>(null)

  const rewardTypes = [
    { value: 'privilege', label: t('types.privilege') },
    { value: 'certificate', label: t('types.certificate') },
    { value: 'recognition', label: t('types.recognition') },
    { value: 'physical', label: t('types.physical') },
    { value: 'special', label: t('types.special') },
  ]

  const rewardCategories = [
    { value: 'general', label: t('categories.general') },
    { value: 'academic', label: t('categories.academic') },
    { value: 'behavioral', label: t('categories.behavioral') },
    { value: 'attendance', label: t('categories.attendance') },
    { value: 'special', label: t('categories.special') },
  ]

  // Fetch rewards
  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const { rewards: data, pagination } = await rewardsService.getRewards({
          page: currentPage,
          limit: 20,
          search: searchTerm || undefined,
          reward_type: typeFilter !== 'all' ? typeFilter : undefined,
          reward_category: categoryFilter !== 'all' ? categoryFilter : undefined,
          is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
          sort_by: 'display_order',
          sort_order: 'asc'
        })
        
        setRewards(data)
        setTotalPages(pagination?.totalPages || 0)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
        setRewards([])
        setTotalPages(0)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRewards()
  }, [currentPage, searchTerm, typeFilter, categoryFilter, statusFilter])

  const handleDeleteReward = async (reward: RewardWithStats) => {
    try {
      await rewardsService.deleteReward(reward.id)
      toast({
        title: t('messages.rewardDeleted'),
        description: `${reward.name} has been deleted successfully.`,
      })
      setDeletingReward(null)
      // Refetch data
      const { rewards: data, pagination } = await rewardsService.getRewards({
        page: currentPage,
        limit: 20,
        search: searchTerm || undefined,
        reward_type: typeFilter !== 'all' ? typeFilter : undefined,
        reward_category: categoryFilter !== 'all' ? categoryFilter : undefined,
        is_active: statusFilter !== 'all' ? statusFilter === 'active' : undefined,
        sort_by: 'display_order',
        sort_order: 'asc'
      })
      setRewards(data)
      setTotalPages(pagination?.totalPages || 0)
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('errors.deletingReward'),
        description: error.message || 'An error occurred',
      })
    }
  }

  const handleToggleFeatured = async (reward: RewardWithStats) => {
    try {
      await rewardsService.updateReward(reward.id, { is_featured: !reward.is_featured })
      toast({
        title: t('messages.rewardUpdated'),
        description: `${reward.name} has been ${!reward.is_featured ? 'featured' : 'unfeatured'}.`,
      })
      // Update local state
      setRewards(rewards.map(r => 
        r.id === reward.id ? { ...r, is_featured: !r.is_featured } : r
      ))
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('errors.updatingReward'),
        description: error.message || 'An error occurred',
      })
    }
  }

  const handleToggleActive = async (reward: RewardWithStats) => {
    try {
      await rewardsService.updateReward(reward.id, { is_active: !reward.is_active })
      toast({
        title: t('messages.rewardUpdated'),
        description: `${reward.name} has been ${!reward.is_active ? 'activated' : 'deactivated'}.`,
      })
      // Update local state
      setRewards(rewards.map(r => 
        r.id === reward.id ? { ...r, is_active: !r.is_active } : r
      ))
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: t('errors.updatingReward'),
        description: error.message || 'An error occurred',
      })
    }
  }

  const getStatusBadge = (reward: RewardWithStats) => {
    if (!reward.is_active) {
      return <Badge variant="secondary">{t('status.inactive')}</Badge>
    }
    return <Badge variant="default">{t('status.active')}</Badge>
  }

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      privilege: 'bg-blue-100 text-blue-800',
      certificate: 'bg-green-100 text-green-800',
      recognition: 'bg-purple-100 text-purple-800',
      physical: 'bg-orange-100 text-orange-800',
      special: 'bg-pink-100 text-pink-800',
    }
    
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {t(`types.${type}`)}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="h-10 bg-muted rounded animate-pulse flex-1"></div>
          <div className="h-10 bg-muted rounded animate-pulse w-full md:w-[180px]"></div>
          <div className="h-10 bg-muted rounded animate-pulse w-full md:w-[180px]"></div>
          <div className="h-10 bg-muted rounded animate-pulse w-full md:w-[180px]"></div>
        </div>
        <SkeletonTable rows={5} columns={7} />
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">{error}</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t('filters.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('filters.type')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            {rewardTypes.map((type) => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('filters.category')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            {rewardCategories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full md:w-[180px]">
            <SelectValue placeholder={t('filters.status')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('filters.all')}</SelectItem>
            <SelectItem value="active">{t('status.active')}</SelectItem>
            <SelectItem value="inactive">{t('status.inactive')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('name')}</TableHead>
              <TableHead>{t('rewardType')}</TableHead>
              <TableHead>{t('rewardCategory')}</TableHead>
              <TableHead className="text-right">{t('coinCost')}</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Stats</TableHead>
              <TableHead className="w-[70px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rewards.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t('empty.noRewards')}
                </TableCell>
              </TableRow>
            ) : (
              rewards.map((reward) => (
                <TableRow key={reward.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {reward.is_featured && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                      <div>
                        <div className="font-medium">{reward.name}</div>
                        {reward.description && (
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {reward.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(reward.reward_type)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {t(`categories.${reward.reward_category || 'general'}`)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {reward.coin_cost}
                  </TableCell>
                  <TableCell>{getStatusBadge(reward)}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>
                        Redemptions: {reward.stats?.total_redemptions || 0}
                      </div>
                      {(reward.stats?.pending_redemptions || 0) > 0 && (
                        <div className="text-orange-600">
                          Pending: {reward.stats.pending_redemptions}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => setEditingReward(reward)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          {t('edit')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleFeatured(reward)}
                        >
                          {reward.is_featured ? (
                            <StarOff className="mr-2 h-4 w-4" />
                          ) : (
                            <Star className="mr-2 h-4 w-4" />
                          )}
                          {reward.is_featured ? 'Unfeature' : 'Feature'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(reward)}
                        >
                          {reward.is_active ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setDeletingReward(reward)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          {t('delete')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingReward && (
        <RewardForm
          isOpen={!!editingReward}
          reward={editingReward}
          onClose={() => setEditingReward(null)}
          onSave={async () => {
            setEditingReward(null)
            // Refetch data
            try {
              const { rewards: data, pagination } = await rewardsService.getRewards({
                page: currentPage,
                limit: 20,
                search: searchTerm || undefined,
                reward_type: typeFilter || undefined,
                reward_category: categoryFilter || undefined,
                is_active: statusFilter ? statusFilter === 'active' : undefined,
                sort_by: 'display_order',
                sort_order: 'asc'
              })
              setRewards(data)
              setTotalPages(pagination?.totalPages || 0)
            } catch (err) {
              console.error('Failed to refetch rewards:', err)
            }
          }}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingReward} onOpenChange={() => setDeletingReward(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('messages.confirmDelete')}</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the reward
              &quot;{deletingReward?.name}&quot; from the catalog.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={() => deletingReward && handleDeleteReward(deletingReward)}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}