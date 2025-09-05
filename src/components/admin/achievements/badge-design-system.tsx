'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { 
  Palette,
  Download,
  Copy,
  Sparkles,
  Layers,
  RotateCcw,
  Save,
  Eye,
  Zap,
  Star,
  Trophy,
  Award,
  Camera,
  Printer,
  Share2,
  Settings,
  RefreshCw,
  Maximize,
  Grid,
  Hexagon,
  Circle,
  Square
} from 'lucide-react'
import type { Achievement } from '@/types/ranking'
import { achievementService } from '@/lib/services/achievement-service'
import { fadeVariants, staggerContainer, staggerItem, scaleVariants } from '@/lib/animations'

interface BadgeStyle {
  shape: 'circle' | 'hexagon' | 'square' | 'shield'
  size: 'small' | 'medium' | 'large' | 'xl'
  border: {
    enabled: boolean
    width: number
    color: string
    style: 'solid' | 'dashed' | 'dotted'
  }
  shadow: {
    enabled: boolean
    intensity: number
    color: string
  }
  gradient: {
    enabled: boolean
    type: 'linear' | 'radial'
    direction: number
    colors: string[]
  }
  animation: {
    enabled: boolean
    type: 'pulse' | 'glow' | 'bounce' | 'rotate' | 'float'
    speed: number
  }
  overlay: {
    enabled: boolean
    pattern: 'dots' | 'lines' | 'waves' | 'sparkles'
    opacity: number
  }
}

interface BadgePreviewProps {
  achievement: Partial<Achievement>
  style: BadgeStyle
  className?: string
  size?: number
  showRarity?: boolean
  interactive?: boolean
}

const defaultBadgeStyle: BadgeStyle = {
  shape: 'circle',
  size: 'medium',
  border: {
    enabled: true,
    width: 3,
    color: '#ffffff',
    style: 'solid'
  },
  shadow: {
    enabled: true,
    intensity: 20,
    color: '#000000'
  },
  gradient: {
    enabled: false,
    type: 'linear',
    direction: 45,
    colors: ['#4F7942', '#87A96B']
  },
  animation: {
    enabled: false,
    type: 'pulse',
    speed: 2
  },
  overlay: {
    enabled: false,
    pattern: 'sparkles',
    opacity: 30
  }
}

const sampleAchievements: Partial<Achievement>[] = [
  {
    name: 'Perfect Attendance',
    icon_name: '📅',
    badge_color: '#4F7942',
    achievement_type: 'attendance',
    points_reward: 100,
    coins_reward: 50
  },
  {
    name: 'Homework Champion',
    icon_name: '📚',
    badge_color: '#8B5CF6',
    achievement_type: 'homework',
    points_reward: 75,
    coins_reward: 25
  },
  {
    name: 'Class Helper',
    icon_name: '🤝',
    badge_color: '#F59E0B',
    achievement_type: 'behavior',
    points_reward: 60,
    coins_reward: 30
  },
  {
    name: 'Study Streak',
    icon_name: '⚡',
    badge_color: '#EF4444',
    achievement_type: 'streak',
    points_reward: 120,
    coins_reward: 60
  },
  {
    name: 'Level Master',
    icon_name: '🎯',
    badge_color: '#06B6D4',
    achievement_type: 'milestone',
    points_reward: 200,
    coins_reward: 100
  },
  {
    name: 'Student of Month',
    icon_name: '👑',
    badge_color: '#8B5CF6',
    achievement_type: 'special',
    points_reward: 300,
    coins_reward: 150
  }
]

function BadgePreview({ achievement, style, className = "", size = 80, showRarity = true, interactive = true }: BadgePreviewProps) {
  const badgeRef = useRef<HTMLDivElement>(null)
  
  const getSizeClasses = () => {
    switch (style.size) {
      case 'small': return { width: size * 0.7, height: size * 0.7, fontSize: size * 0.25 }
      case 'medium': return { width: size, height: size, fontSize: size * 0.35 }
      case 'large': return { width: size * 1.3, height: size * 1.3, fontSize: size * 0.45 }
      case 'xl': return { width: size * 1.6, height: size * 1.6, fontSize: size * 0.55 }
      default: return { width: size, height: size, fontSize: size * 0.35 }
    }
  }

  const getShapeClasses = () => {
    switch (style.shape) {
      case 'circle': return 'rounded-full'
      case 'hexagon': return 'rounded-xl' // Approximated with rounded corners
      case 'square': return 'rounded-lg'
      case 'shield': return 'rounded-t-full rounded-b-lg'
      default: return 'rounded-full'
    }
  }

  const getAnimationClasses = () => {
    if (!style.animation.enabled) return ''
    
    const duration = `${3 / style.animation.speed}s`
    
    switch (style.animation.type) {
      case 'pulse': return `animate-pulse`
      case 'bounce': return `animate-bounce`
      case 'glow': return 'animate-pulse'
      case 'rotate': return 'animate-spin'
      case 'float': return 'animate-bounce'
      default: return ''
    }
  }

  const getBorderStyle = () => {
    if (!style.border.enabled) return {}
    return {
      borderWidth: `${style.border.width}px`,
      borderColor: style.border.color,
      borderStyle: style.border.style
    }
  }

  const getShadowStyle = () => {
    if (!style.shadow.enabled) return {}
    const shadowOpacity = style.shadow.intensity / 100
    return {
      boxShadow: `0 ${style.border.width * 2}px ${style.shadow.intensity}px rgba(0,0,0,${shadowOpacity})`
    }
  }

  const getBackgroundStyle = () => {
    if (style.gradient.enabled) {
      const direction = style.gradient.type === 'linear' 
        ? `${style.gradient.direction}deg` 
        : 'circle'
      const colors = style.gradient.colors.join(', ')
      return {
        background: style.gradient.type === 'linear'
          ? `linear-gradient(${direction}, ${colors})`
          : `radial-gradient(${direction}, ${colors})`
      }
    }
    return {
      backgroundColor: achievement.badge_color || '#4F7942'
    }
  }

  const getOverlayPattern = () => {
    if (!style.overlay.enabled) return null
    
    const opacity = style.overlay.opacity / 100
    const patternSize = getSizeClasses().width / 8
    
    switch (style.overlay.pattern) {
      case 'dots':
        return (
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              opacity,
              backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.5) 1px, transparent 1px)`,
              backgroundSize: `${patternSize}px ${patternSize}px`
            }}
          />
        )
      case 'lines':
        return (
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              opacity,
              backgroundImage: `linear-gradient(45deg, rgba(255,255,255,0.3) 1px, transparent 1px)`,
              backgroundSize: `${patternSize}px ${patternSize}px`
            }}
          />
        )
      case 'waves':
        return (
          <div 
            className="absolute inset-0 rounded-full overflow-hidden"
            style={{ opacity }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 animate-pulse" />
          </div>
        )
      case 'sparkles':
        return (
          <div 
            className="absolute inset-0 rounded-full"
            style={{ opacity }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
                style={{
                  top: `${Math.random() * 80 + 10}%`,
                  left: `${Math.random() * 80 + 10}%`,
                  animationDelay: `${i * 0.2}s`
                }}
              />
            ))}
          </div>
        )
      default:
        return null
    }
  }

  const sizeStyle = getSizeClasses()
  const rarity = achievement.achievement_type ? achievementService.getAchievementRarity(achievement.achievement_type) : null

  return (
    <motion.div
      ref={badgeRef}
      className={`relative flex flex-col items-center space-y-2 ${className}`}
      whileHover={interactive ? { scale: 1.05 } : {}}
      transition={{ duration: 0.2 }}
    >
      {/* Badge */}
      <div
        className={`
          relative flex items-center justify-center text-white font-bold
          ${getShapeClasses()}
          ${getAnimationClasses()}
          transition-all duration-300
          ${interactive ? 'cursor-pointer hover:scale-105' : ''}
        `}
        style={{
          ...sizeStyle,
          ...getBorderStyle(),
          ...getShadowStyle(),
          ...getBackgroundStyle()
        }}
      >
        {/* Overlay Pattern */}
        {getOverlayPattern()}
        
        {/* Icon */}
        <span style={{ fontSize: sizeStyle.fontSize }}>
          {achievement.icon_name || '🏆'}
        </span>
        
        {/* Glow Effect for Special Animations */}
        {style.animation.enabled && style.animation.type === 'glow' && (
          <div
            className="absolute inset-0 rounded-full animate-ping"
            style={{
              backgroundColor: achievement.badge_color || '#4F7942',
              opacity: 0.3
            }}
          />
        )}
      </div>

      {/* Achievement Info */}
      {showRarity && (
        <div className="text-center space-y-1">
          <h4 className="font-medium text-sm">{achievement.name}</h4>
          {rarity && (
            <Badge className={`${rarity.color} text-xs`}>
              {rarity.label}
            </Badge>
          )}
          {(achievement.points_reward || achievement.coins_reward) && (
            <div className="flex items-center justify-center space-x-2 text-xs">
              {achievement.points_reward && (
                <div className="flex items-center space-x-1 text-yellow-600">
                  <Star className="h-3 w-3" />
                  <span>+{achievement.points_reward}</span>
                </div>
              )}
              {achievement.coins_reward && (
                <div className="flex items-center space-x-1 text-green-600">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>+{achievement.coins_reward}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  )
}

export function BadgeDesignSystem() {
  const [currentStyle, setCurrentStyle] = useState<BadgeStyle>(defaultBadgeStyle)
  const [selectedAchievement, setSelectedAchievement] = useState(sampleAchievements[0])
  const [previewMode, setPreviewMode] = useState<'single' | 'grid' | 'showcase'>('single')
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [savedStyles, setSavedStyles] = useState<BadgeStyle[]>([])

  const updateStyle = (path: string, value: any) => {
    setCurrentStyle(prev => {
      const newStyle = { ...prev }
      const keys = path.split('.')
      let current: any = newStyle
      
      for (let i = 0; i < keys.length - 1; i++) {
        current = current[keys[i]]
      }
      current[keys[keys.length - 1]] = value
      
      return newStyle
    })
  }

  const resetStyle = () => {
    setCurrentStyle(defaultBadgeStyle)
  }

  const saveCurrentStyle = () => {
    const styleName = `Style ${savedStyles.length + 1}`
    setSavedStyles(prev => [...prev, { ...currentStyle }])
  }

  const exportBadgeAsImage = async () => {
    // This would typically use html2canvas or similar
    console.log('Export badge as image')
  }

  const copyStyleToClipboard = () => {
    navigator.clipboard.writeText(JSON.stringify(currentStyle, null, 2))
  }

  const applyPresetStyle = (preset: 'modern' | 'classic' | 'gaming' | 'minimalist') => {
    const presets = {
      modern: {
        ...defaultBadgeStyle,
        gradient: { enabled: true, type: 'linear' as const, direction: 135, colors: ['#667eea', '#764ba2'] },
        shadow: { enabled: true, intensity: 25, color: '#000000' },
        border: { enabled: true, width: 2, color: '#ffffff', style: 'solid' as const }
      },
      classic: {
        ...defaultBadgeStyle,
        shape: 'shield' as const,
        border: { enabled: true, width: 4, color: '#ffd700', style: 'solid' as const },
        shadow: { enabled: true, intensity: 30, color: '#000000' }
      },
      gaming: {
        ...defaultBadgeStyle,
        shape: 'hexagon' as const,
        gradient: { enabled: true, type: 'radial' as const, direction: 0, colors: ['#ff6b6b', '#ee5a24'] },
        animation: { enabled: true, type: 'glow' as const, speed: 1.5 },
        overlay: { enabled: true, pattern: 'sparkles' as const, opacity: 40 }
      },
      minimalist: {
        ...defaultBadgeStyle,
        border: { enabled: false, width: 0, color: '#ffffff', style: 'solid' as const },
        shadow: { enabled: false, intensity: 0, color: '#000000' },
        gradient: { enabled: false, type: 'linear' as const, direction: 0, colors: [] }
      }
    }
    setCurrentStyle(presets[preset])
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="h-4 w-4" />
                <span>Badge Design System</span>
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Design and customize achievement badges with advanced styling options
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={resetStyle}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Reset
              </Button>
              <Button variant="outline" size="sm" onClick={saveCurrentStyle}>
                <Save className="h-4 w-4 mr-2" />
                Save Style
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowExportDialog(true)}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Preview Panel */}
            <div className="lg:col-span-1 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Preview</h3>
                <div className="flex items-center space-x-2">
                  <Button
                    variant={previewMode === 'single' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('single')}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('grid')}
                  >
                    <Grid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={previewMode === 'showcase' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPreviewMode('showcase')}
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Card className="p-6">
                <AnimatePresence mode="wait">
                  {previewMode === 'single' && (
                    <motion.div
                      key="single"
                      variants={fadeVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="flex justify-center"
                    >
                      <BadgePreview
                        achievement={selectedAchievement}
                        style={currentStyle}
                        size={120}
                      />
                    </motion.div>
                  )}
                  
                  {previewMode === 'grid' && (
                    <motion.div
                      key="grid"
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="grid grid-cols-2 gap-4"
                    >
                      {sampleAchievements.slice(0, 4).map((achievement, index) => (
                        <motion.div key={index} variants={staggerItem}>
                          <BadgePreview
                            achievement={achievement}
                            style={currentStyle}
                            size={80}
                            showRarity={false}
                          />
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                  
                  {previewMode === 'showcase' && (
                    <motion.div
                      key="showcase"
                      variants={fadeVariants}
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      className="space-y-4"
                    >
                      <div className="flex justify-center">
                        <BadgePreview
                          achievement={selectedAchievement}
                          style={currentStyle}
                          size={160}
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {['small', 'medium', 'large'].map((size) => (
                          <div key={size} className="text-center">
                            <BadgePreview
                              achievement={selectedAchievement}
                              style={{ ...currentStyle, size: size as any }}
                              size={60}
                              showRarity={false}
                            />
                            <p className="text-xs mt-1 capitalize">{size}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Achievement Selector */}
              <div>
                <label className="text-sm font-medium mb-2 block">Sample Achievement</label>
                <Select 
                  value={sampleAchievements.findIndex(a => a === selectedAchievement).toString()}
                  onValueChange={(value) => setSelectedAchievement(sampleAchievements[parseInt(value)])}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sampleAchievements.map((achievement, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        <div className="flex items-center space-x-2">
                          <span>{achievement.icon_name}</span>
                          <span>{achievement.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Style Controls */}
            <div className="lg:col-span-2">
              <Tabs defaultValue="basic" className="space-y-4">
                <TabsList className="grid w-full grid-cols-5">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="border">Border</TabsTrigger>
                  <TabsTrigger value="effects">Effects</TabsTrigger>
                  <TabsTrigger value="animation">Animation</TabsTrigger>
                  <TabsTrigger value="presets">Presets</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Shape</label>
                      <Select 
                        value={currentStyle.shape} 
                        onValueChange={(value) => updateStyle('shape', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="circle">
                            <div className="flex items-center space-x-2">
                              <Circle className="h-4 w-4" />
                              <span>Circle</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="hexagon">
                            <div className="flex items-center space-x-2">
                              <Hexagon className="h-4 w-4" />
                              <span>Hexagon</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="square">
                            <div className="flex items-center space-x-2">
                              <Square className="h-4 w-4" />
                              <span>Square</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="shield">Shield</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Size</label>
                      <Select 
                        value={currentStyle.size} 
                        onValueChange={(value) => updateStyle('size', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Small</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="large">Large</SelectItem>
                          <SelectItem value="xl">Extra Large</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Gradient Background</label>
                      <Switch 
                        checked={currentStyle.gradient.enabled}
                        onCheckedChange={(checked) => updateStyle('gradient.enabled', checked)}
                      />
                    </div>
                    
                    {currentStyle.gradient.enabled && (
                      <div className="space-y-3 ml-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Type</label>
                            <Select 
                              value={currentStyle.gradient.type} 
                              onValueChange={(value) => updateStyle('gradient.type', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="linear">Linear</SelectItem>
                                <SelectItem value="radial">Radial</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          {currentStyle.gradient.type === 'linear' && (
                            <div>
                              <label className="text-sm font-medium mb-1 block">Direction ({currentStyle.gradient.direction}°)</label>
                              <Slider
                                value={[currentStyle.gradient.direction]}
                                onValueChange={([value]) => updateStyle('gradient.direction', value)}
                                max={360}
                                step={15}
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium mb-1 block">Start Color</label>
                            <Input
                              type="color"
                              value={currentStyle.gradient.colors[0] || '#4F7942'}
                              onChange={(e) => {
                                const colors = [...currentStyle.gradient.colors]
                                colors[0] = e.target.value
                                updateStyle('gradient.colors', colors)
                              }}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium mb-1 block">End Color</label>
                            <Input
                              type="color"
                              value={currentStyle.gradient.colors[1] || '#87A96B'}
                              onChange={(e) => {
                                const colors = [...currentStyle.gradient.colors]
                                colors[1] = e.target.value
                                updateStyle('gradient.colors', colors)
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="border" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Enable Border</label>
                    <Switch 
                      checked={currentStyle.border.enabled}
                      onCheckedChange={(checked) => updateStyle('border.enabled', checked)}
                    />
                  </div>

                  {currentStyle.border.enabled && (
                    <div className="space-y-4 ml-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Width ({currentStyle.border.width}px)</label>
                        <Slider
                          value={[currentStyle.border.width]}
                          onValueChange={([value]) => updateStyle('border.width', value)}
                          max={10}
                          step={1}
                          className="w-full"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Color</label>
                          <Input
                            type="color"
                            value={currentStyle.border.color}
                            onChange={(e) => updateStyle('border.color', e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1 block">Style</label>
                          <Select 
                            value={currentStyle.border.style} 
                            onValueChange={(value) => updateStyle('border.style', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="solid">Solid</SelectItem>
                              <SelectItem value="dashed">Dashed</SelectItem>
                              <SelectItem value="dotted">Dotted</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Enable Shadow</label>
                    <Switch 
                      checked={currentStyle.shadow.enabled}
                      onCheckedChange={(checked) => updateStyle('shadow.enabled', checked)}
                    />
                  </div>

                  {currentStyle.shadow.enabled && (
                    <div className="space-y-4 ml-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Intensity ({currentStyle.shadow.intensity}%)</label>
                        <Slider
                          value={[currentStyle.shadow.intensity]}
                          onValueChange={([value]) => updateStyle('shadow.intensity', value)}
                          max={50}
                          step={5}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="effects" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Enable Overlay Pattern</label>
                    <Switch 
                      checked={currentStyle.overlay.enabled}
                      onCheckedChange={(checked) => updateStyle('overlay.enabled', checked)}
                    />
                  </div>

                  {currentStyle.overlay.enabled && (
                    <div className="space-y-4 ml-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Pattern</label>
                          <Select 
                            value={currentStyle.overlay.pattern} 
                            onValueChange={(value) => updateStyle('overlay.pattern', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="dots">Dots</SelectItem>
                              <SelectItem value="lines">Lines</SelectItem>
                              <SelectItem value="waves">Waves</SelectItem>
                              <SelectItem value="sparkles">Sparkles</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Opacity ({currentStyle.overlay.opacity}%)</label>
                          <Slider
                            value={[currentStyle.overlay.opacity]}
                            onValueChange={([value]) => updateStyle('overlay.opacity', value)}
                            max={100}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="animation" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Enable Animation</label>
                    <Switch 
                      checked={currentStyle.animation.enabled}
                      onCheckedChange={(checked) => updateStyle('animation.enabled', checked)}
                    />
                  </div>

                  {currentStyle.animation.enabled && (
                    <div className="space-y-4 ml-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1 block">Animation Type</label>
                          <Select 
                            value={currentStyle.animation.type} 
                            onValueChange={(value) => updateStyle('animation.type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pulse">Pulse</SelectItem>
                              <SelectItem value="glow">Glow</SelectItem>
                              <SelectItem value="bounce">Bounce</SelectItem>
                              <SelectItem value="rotate">Rotate</SelectItem>
                              <SelectItem value="float">Float</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-2 block">Speed ({currentStyle.animation.speed}x)</label>
                          <Slider
                            value={[currentStyle.animation.speed]}
                            onValueChange={([value]) => updateStyle('animation.speed', value)}
                            min={0.5}
                            max={3}
                            step={0.5}
                            className="w-full"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="presets" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow p-4"
                      onClick={() => applyPresetStyle('modern')}
                    >
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl">
                          ✨
                        </div>
                        <h4 className="font-medium">Modern</h4>
                        <p className="text-xs text-muted-foreground">Gradient with subtle shadow</p>
                      </div>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow p-4"
                      onClick={() => applyPresetStyle('classic')}
                    >
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-yellow-600 flex items-center justify-center text-white text-xl border-4 border-yellow-400 rounded-lg">
                          🏆
                        </div>
                        <h4 className="font-medium">Classic</h4>
                        <p className="text-xs text-muted-foreground">Traditional shield with gold border</p>
                      </div>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow p-4"
                      onClick={() => applyPresetStyle('gaming')}
                    >
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-gradient-to-r from-red-500 to-orange-500 flex items-center justify-center text-white text-xl transform rotate-45 rounded-lg animate-pulse">
                          ⚡
                        </div>
                        <h4 className="font-medium">Gaming</h4>
                        <p className="text-xs text-muted-foreground">Animated with sparkle effects</p>
                      </div>
                    </Card>

                    <Card 
                      className="cursor-pointer hover:shadow-lg transition-shadow p-4"
                      onClick={() => applyPresetStyle('minimalist')}
                    >
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 mx-auto bg-gray-600 flex items-center justify-center text-white text-xl rounded-full">
                          ●
                        </div>
                        <h4 className="font-medium">Minimalist</h4>
                        <p className="text-xs text-muted-foreground">Clean and simple design</p>
                      </div>
                    </Card>
                  </div>

                  {savedStyles.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium">Saved Styles</h4>
                      <div className="grid grid-cols-4 gap-2">
                        {savedStyles.map((style, index) => (
                          <Card 
                            key={index}
                            className="cursor-pointer hover:shadow-lg transition-shadow p-2"
                            onClick={() => setCurrentStyle(style)}
                          >
                            <div className="text-center">
                              <div className="w-12 h-12 mx-auto mb-1">
                                <BadgePreview
                                  achievement={selectedAchievement}
                                  style={style}
                                  size={48}
                                  showRarity={false}
                                  interactive={false}
                                />
                              </div>
                              <p className="text-xs">Style {index + 1}</p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Badge Design</DialogTitle>
            <DialogDescription>
              Export your badge design as an image or copy the style configuration
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-center">
              <BadgePreview
                achievement={selectedAchievement}
                style={currentStyle}
                size={120}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={exportBadgeAsImage}>
                <Camera className="h-4 w-4 mr-2" />
                Export as Image
              </Button>
              <Button onClick={copyStyleToClipboard}>
                <Copy className="h-4 w-4 mr-2" />
                Copy Style JSON
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Style Configuration:</label>
              <textarea
                readOnly
                value={JSON.stringify(currentStyle, null, 2)}
                className="w-full h-32 p-2 border rounded text-xs font-mono"
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}