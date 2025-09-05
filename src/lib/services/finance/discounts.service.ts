import { supabase } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

type Discount = Database['public']['Tables']['discounts']['Row']
type DiscountInsert = Database['public']['Tables']['discounts']['Insert']
type DiscountUpdate = Database['public']['Tables']['discounts']['Update']

export class DiscountService {
  static async create(discount: DiscountInsert) {
    const { data, error } = await supabase
      .from('discounts')
      .insert({
        ...discount,
        is_active: discount.is_active ?? true,
        usage_count: 0,
        applies_to: discount.applies_to || 'all',
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getById(id: string) {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async list(filters?: {
    isActive?: boolean
    appliesTo?: string
    organizationId?: string
  }) {
    let query = supabase
      .from('discounts')
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive)
    }
    if (filters?.appliesTo) {
      query = query.eq('applies_to', filters.appliesTo)
    }
    if (filters?.organizationId) {
      query = query.eq('organization_id', filters.organizationId)
    }

    const { data, error } = await query

    if (error) throw error
    return data || []
  }

  static async update(id: string, discount: DiscountUpdate) {
    const { data, error } = await supabase
      .from('discounts')
      .update(discount)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async applyDiscount(discountId: string, amount: number) {
    const discount = await this.getById(discountId)
    if (!discount) throw new Error('Discount not found')
    if (!discount.is_active) throw new Error('Discount is not active')

    const now = new Date()
    if (discount.valid_from && new Date(discount.valid_from) > now) {
      throw new Error('Discount is not yet valid')
    }
    if (discount.valid_until && new Date(discount.valid_until) < now) {
      throw new Error('Discount has expired')
    }
    if (discount.usage_limit && discount.usage_count && discount.usage_count >= discount.usage_limit) {
      throw new Error('Discount usage limit reached')
    }

    let discountAmount = 0
    if (discount.discount_type === 'percentage' && discount.percentage) {
      discountAmount = (amount * discount.percentage) / 100
    } else if (discount.discount_type === 'fixed_amount' && discount.amount) {
      discountAmount = Math.min(discount.amount, amount)
    }

    await this.update(discountId, {
      usage_count: (discount.usage_count || 0) + 1,
    })

    return discountAmount
  }

  static async getApplicableDiscounts(params: {
    studentId?: string
    groupIds?: string[]
    amount: number
    organizationId: string
  }) {
    const now = new Date().toISOString()

    let query = supabase
      .from('discounts')
      .select('*')
      .eq('organization_id', params.organizationId)
      .eq('is_active', true)
      .is('deleted_at', null)
      .or(`valid_from.is.null,valid_from.lte.${now}`)
      .or(`valid_until.is.null,valid_until.gte.${now}`)

    const { data, error } = await query

    if (error) throw error

    const applicableDiscounts = (data || []).filter(discount => {
      if (discount.usage_limit && discount.usage_count && discount.usage_count >= discount.usage_limit) {
        return false
      }

      if (discount.applies_to === 'all') {
        return true
      }

      if (discount.applies_to === 'groups' && params.groupIds && discount.applicable_groups) {
        return discount.applicable_groups.some(groupId => params.groupIds?.includes(groupId))
      }

      if (discount.min_enrollment_count && params.groupIds) {
        return params.groupIds.length >= discount.min_enrollment_count
      }

      return false
    })

    return applicableDiscounts
  }

  static async calculateBestDiscount(discounts: Discount[], amount: number) {
    let bestDiscount: Discount | null = null
    let bestAmount = 0

    for (const discount of discounts) {
      let discountAmount = 0
      
      if (discount.discount_type === 'percentage' && discount.percentage) {
        discountAmount = (amount * discount.percentage) / 100
      } else if (discount.discount_type === 'fixed_amount' && discount.amount) {
        discountAmount = Math.min(discount.amount, amount)
      }

      if (discountAmount > bestAmount) {
        bestAmount = discountAmount
        bestDiscount = discount
      }
    }

    return { discount: bestDiscount, amount: bestAmount }
  }

  static async softDelete(id: string, deletedBy: string) {
    const { data, error } = await supabase
      .from('discounts')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: deletedBy,
        is_active: false,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }
}