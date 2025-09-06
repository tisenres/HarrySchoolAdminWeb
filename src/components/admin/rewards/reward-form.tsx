'use client'

import React, { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/components/ui/use-toast'
import { rewardsService, RewardWithStats } from '@/lib/services/rewards-service'
import { CalendarIcon, ImageIcon } from 'lucide-react'

interface RewardFormProps {
  isOpen: boolean
  reward?: RewardWithStats | null
  onClose: () => void
  onSave: () => void
}

interface FormData {
  name: string
  description: string
  coin_cost: number
  reward_type: string
  reward_category: string
  inventory_quantity: number | null
  max_redemptions_per_student: number | null
  requires_approval: boolean
  is_active: boolean
  is_featured: boolean
  display_order: number
  image_url: string
  terms_conditions: string
  valid_from: string
  valid_until: string
}

export default function RewardForm({ isOpen, reward, onClose, onSave }: RewardFormProps) {
  const t = useTranslations('rewards')
  const { toast } = useToast()
  const isEditing = !!reward

  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    coin_cost: 10,
    reward_type: 'privilege',
    reward_category: 'general',
    inventory_quantity: null,
    max_redemptions_per_student: null,
    requires_approval: true,
    is_active: true,
    is_featured: false,
    display_order: 0,
    image_url: '',
    terms_conditions: '',
    valid_from: new Date().toISOString().split('T')[0],
    valid_until: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (reward) {
      setFormData({
        name: reward.name,
        description: reward.description || '',
        coin_cost: reward.coin_cost,
        reward_type: reward.reward_type,
        reward_category: reward.reward_category || 'general',
        inventory_quantity: reward.inventory_quantity,
        max_redemptions_per_student: reward.max_redemptions_per_student,
        requires_approval: reward.requires_approval ?? true,
        is_active: reward.is_active ?? true,
        is_featured: reward.is_featured ?? false,
        display_order: reward.display_order ?? 0,
        image_url: reward.image_url || '',
        terms_conditions: reward.terms_conditions || '',
        valid_from: reward.valid_from ? new Date(reward.valid_from).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        valid_until: reward.valid_until ? new Date(reward.valid_until).toISOString().split('T')[0] : '',
      })
    } else {
      // Reset form for new reward
      setFormData({
        name: '',
        description: '',
        coin_cost: 10,
        reward_type: 'privilege',
        reward_category: 'general',
        inventory_quantity: null,
        max_redemptions_per_student: null,
        requires_approval: true,
        is_active: true,
        is_featured: false,
        display_order: 0,
        image_url: '',
        terms_conditions: '',
        valid_from: new Date().toISOString().split('T')[0],
        valid_until: '',
      })
    }
    setErrors({})
  }, [reward, isOpen])

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }

    if (formData.coin_cost < 1) {
      newErrors.coin_cost = 'Coin cost must be at least 1'
    }

    if (formData.coin_cost > 10000) {
      newErrors.coin_cost = 'Coin cost cannot exceed 10,000'
    }

    if (formData.inventory_quantity !== null && formData.inventory_quantity < 1) {
      newErrors.inventory_quantity = 'Inventory quantity must be at least 1'
    }

    if (formData.max_redemptions_per_student !== null && formData.max_redemptions_per_student < 1) {
      newErrors.max_redemptions_per_student = 'Max redemptions must be at least 1'
    }

    if (formData.valid_until && formData.valid_from >= formData.valid_until) {
      newErrors.valid_until = 'Valid until date must be after valid from date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const submitData = {
        ...formData,
        valid_from: formData.valid_from || undefined,
        valid_until: formData.valid_until || undefined,
        image_url: formData.image_url || undefined,
        terms_conditions: formData.terms_conditions || undefined,
        description: formData.description || undefined,
      }

      if (isEditing) {
        await rewardsService.updateReward(reward.id, submitData)
        toast({
          title: t('messages.rewardUpdated'),
          description: `${formData.name} has been updated successfully.`,
        })
      } else {
        await rewardsService.createReward(submitData)
        toast({
          title: t('messages.rewardCreated'),
          description: `${formData.name} has been created successfully.`,
        })
      }

      onSave()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred'
      toast({
        variant: 'destructive',
        title: isEditing ? t('errors.updatingReward') : t('errors.creatingReward'),
        description: errorMessage,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? t('editReward') : t('createReward')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t('name')} *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter reward name"
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe the reward..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="reward_type">{t('rewardType')} *</Label>
                  <Select
                    value={formData.reward_type}
                    onValueChange={(value) => handleInputChange('reward_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reward_category">{t('rewardCategory')}</Label>
                  <Select
                    value={formData.reward_category}
                    onValueChange={(value) => handleInputChange('reward_category', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {rewardCategories.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="coin_cost">{t('coinCost')} *</Label>
                <Input
                  id="coin_cost"
                  type="number"
                  min="1"
                  max="10000"
                  value={formData.coin_cost}
                  onChange={(e) => handleInputChange('coin_cost', parseInt(e.target.value) || 0)}
                  className={errors.coin_cost ? 'border-red-500' : ''}
                />
                {errors.coin_cost && (
                  <p className="text-sm text-red-600">{errors.coin_cost}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="inventory_quantity">{t('inventory')}</Label>
                  <Input
                    id="inventory_quantity"
                    type="number"
                    min="1"
                    value={formData.inventory_quantity || ''}
                    onChange={(e) => handleInputChange('inventory_quantity', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Unlimited"
                    className={errors.inventory_quantity ? 'border-red-500' : ''}
                  />
                  {errors.inventory_quantity && (
                    <p className="text-sm text-red-600">{errors.inventory_quantity}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Leave empty for unlimited quantity
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max_redemptions">{t('maxRedemptions')}</Label>
                  <Input
                    id="max_redemptions"
                    type="number"
                    min="1"
                    value={formData.max_redemptions_per_student || ''}
                    onChange={(e) => handleInputChange('max_redemptions_per_student', e.target.value ? parseInt(e.target.value) : null)}
                    placeholder="Unlimited"
                    className={errors.max_redemptions_per_student ? 'border-red-500' : ''}
                  />
                  {errors.max_redemptions_per_student && (
                    <p className="text-sm text-red-600">{errors.max_redemptions_per_student}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Maximum redemptions per student
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">{t('displayOrder')}</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  value={formData.display_order}
                  onChange={(e) => handleInputChange('display_order', parseInt(e.target.value) || 0)}
                />
                <p className="text-sm text-muted-foreground">
                  Lower numbers appear first
                </p>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="requires_approval">{t('requiresApproval')}</Label>
                    <p className="text-sm text-muted-foreground">
                      Redemptions require admin approval
                    </p>
                  </div>
                  <Switch
                    id="requires_approval"
                    checked={formData.requires_approval}
                    onCheckedChange={(checked) => handleInputChange('requires_approval', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active">{t('isActive')}</Label>
                    <p className="text-sm text-muted-foreground">
                      Available for redemption
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_featured">{t('isFeatured')}</Label>
                    <p className="text-sm text-muted-foreground">
                      Highlight this reward
                    </p>
                  </div>
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => handleInputChange('is_featured', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="image_url">{t('imageUrl')}</Label>
                <Input
                  id="image_url"
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => handleInputChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="terms_conditions">{t('termsConditions')}</Label>
                <Textarea
                  id="terms_conditions"
                  value={formData.terms_conditions}
                  onChange={(e) => handleInputChange('terms_conditions', e.target.value)}
                  placeholder="Terms and conditions for this reward..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid_from">{t('validFrom')}</Label>
                  <Input
                    id="valid_from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => handleInputChange('valid_from', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="valid_until">{t('validUntil')}</Label>
                  <Input
                    id="valid_until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => handleInputChange('valid_until', e.target.value)}
                    className={errors.valid_until ? 'border-red-500' : ''}
                  />
                  {errors.valid_until && (
                    <p className="text-sm text-red-600">{errors.valid_until}</p>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Leave empty for no expiration
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form Actions */}
          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : (isEditing ? 'Update Reward' : 'Create Reward')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}