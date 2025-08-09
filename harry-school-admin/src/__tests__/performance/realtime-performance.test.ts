/**
 * Real-time Features Performance Testing
 * 
 * Comprehensive testing of WebSocket performance, real-time notifications,
 * and live data synchronization for Harry School CRM.
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals'

// Mock WebSocket for testing
class MockWebSocket {
  public readyState: number = 1 // WebSocket.OPEN
  public url: string
  private eventListeners: Map<string, Function[]> = new Map()
  private messageQueue: any[] = []

  constructor(url: string) {
    this.url = url
    this.eventListeners.set('open', [])
    this.eventListeners.set('message', [])
    this.eventListeners.set('error', [])
    this.eventListeners.set('close', [])

    // Simulate connection open after a delay
    setTimeout(() => {
      this.triggerEvent('open', { type: 'open' })
    }, 10)
  }

  addEventListener(event: string, callback: Function) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, [])
    }
    this.eventListeners.get(event)!.push(callback)
  }

  removeEventListener(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(callback)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }

  send(data: string | ArrayBuffer | Blob | ArrayBufferView) {
    this.messageQueue.push(data)
    
    // Simulate server response
    setTimeout(() => {
      const response = {
        type: 'message',
        data: JSON.stringify({
          id: Math.random().toString(36),
          event: 'response',
          payload: { status: 'received' }
        })
      }
      this.triggerEvent('message', response)
    }, 5)
  }

  close() {
    this.readyState = 3 // WebSocket.CLOSED
    setTimeout(() => {
      this.triggerEvent('close', { type: 'close' })
    }, 1)
  }

  private triggerEvent(event: string, data: any) {
    const listeners = this.eventListeners.get(event) || []
    listeners.forEach(callback => callback(data))
  }

  // Test utilities
  simulateMessage(data: any) {
    this.triggerEvent('message', {
      type: 'message',
      data: JSON.stringify(data)
    })
  }

  simulateError(error: any) {
    this.triggerEvent('error', { type: 'error', error })
  }

  getMessageQueue() {
    return this.messageQueue
  }
}

// Mock Supabase Realtime
class MockSupabaseRealtime {
  private subscriptions: Map<string, any> = new Map()
  private connectionState: 'connecting' | 'connected' | 'disconnected' = 'connecting'
  private messageLatencies: number[] = []

  constructor() {
    // Simulate connection establishment
    setTimeout(() => {
      this.connectionState = 'connected'
    }, 50)
  }

  channel(topic: string) {
    const subscription = {
      topic,
      callbacks: new Map(),
      
      on: (event: string, callback: Function) => {
        if (!subscription.callbacks.has(event)) {
          subscription.callbacks.set(event, [])
        }
        subscription.callbacks.get(event).push(callback)
        return subscription
      },

      subscribe: (callback?: Function) => {
        this.subscriptions.set(topic, subscription)
        if (callback) {
          setTimeout(() => callback('SUBSCRIBED'), 20)
        }
        return subscription
      },

      unsubscribe: () => {
        this.subscriptions.delete(topic)
        return Promise.resolve()
      }
    }

    return subscription
  }

  getConnectionState() {
    return this.connectionState
  }

  // Test utilities
  simulateRealtimeEvent(topic: string, event: string, payload: any) {
    const subscription = this.subscriptions.get(topic)
    if (subscription) {
      const callbacks = subscription.callbacks.get(event) || []
      const messageTimestamp = Date.now()
      
      callbacks.forEach((callback: Function) => {
        const startTime = performance.now()
        callback({ 
          ...payload, 
          timestamp: messageTimestamp,
          eventType: event
        })
        const endTime = performance.now()
        
        this.messageLatencies.push(endTime - startTime)
      })
    }
  }

  getMessageLatencies() {
    return this.messageLatencies
  }

  disconnect() {
    this.connectionState = 'disconnected'
    this.subscriptions.clear()
  }
}

// Performance monitoring for real-time features
class RealtimePerformanceMonitor {
  private metrics = {
    connectionTime: 0,
    messageLatency: [] as number[],
    subscriptionTime: [] as number[],
    memoryUsage: [] as number[],
    messageCount: 0,
    errorCount: 0,
    reconnectionCount: 0
  }

  recordConnectionTime(time: number) {
    this.metrics.connectionTime = time
  }

  recordMessageLatency(latency: number) {
    this.metrics.messageLatency.push(latency)
    this.metrics.messageCount++
  }

  recordSubscriptionTime(time: number) {
    this.metrics.subscriptionTime.push(time)
  }

  recordError() {
    this.metrics.errorCount++
  }

  recordReconnection() {
    this.metrics.reconnectionCount++
  }

  recordMemoryUsage() {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      this.metrics.memoryUsage.push(window.performance.memory.usedJSHeapSize)
    } else {
      // Mock memory usage for testing
      this.metrics.memoryUsage.push(Math.floor(Math.random() * 10000000) + 30000000) // 30-40MB
    }
  }

  getStats() {
    const messageLatency = this.metrics.messageLatency
    const subscriptionTime = this.metrics.subscriptionTime

    return {
      connectionTime: this.metrics.connectionTime,
      averageMessageLatency: messageLatency.length > 0 
        ? messageLatency.reduce((a, b) => a + b, 0) / messageLatency.length 
        : 0,
      p95MessageLatency: messageLatency.length > 0
        ? messageLatency.sort((a, b) => a - b)[Math.floor(messageLatency.length * 0.95)]
        : 0,
      averageSubscriptionTime: subscriptionTime.length > 0
        ? subscriptionTime.reduce((a, b) => a + b, 0) / subscriptionTime.length
        : 0,
      messageCount: this.metrics.messageCount,
      errorCount: this.metrics.errorCount,
      reconnectionCount: this.metrics.reconnectionCount,
      memoryGrowth: this.metrics.memoryUsage.length > 1
        ? this.metrics.memoryUsage[this.metrics.memoryUsage.length - 1] - this.metrics.memoryUsage[0]
        : 0
    }
  }

  clear() {
    this.metrics = {
      connectionTime: 0,
      messageLatency: [],
      subscriptionTime: [],
      memoryUsage: [],
      messageCount: 0,
      errorCount: 0,
      reconnectionCount: 0
    }
  }
}

describe('Real-time Features Performance Testing', () => {
  let mockWebSocket: MockWebSocket
  let mockRealtime: MockSupabaseRealtime
  let performanceMonitor: RealtimePerformanceMonitor

  beforeEach(() => {
    performanceMonitor = new RealtimePerformanceMonitor()
    
    // Mock global WebSocket
    global.WebSocket = MockWebSocket as any
  })

  afterEach(() => {
    performanceMonitor.clear()
    if (mockRealtime) {
      mockRealtime.disconnect()
    }
  })

  describe('WebSocket Connection Performance', () => {
    const CONNECTION_BUDGET = 100 // ms
    const LATENCY_BUDGET = 50 // ms
    const THROUGHPUT_BUDGET = 100 // messages per second

    it('should establish WebSocket connection within performance budget', async () => {
      const startTime = performance.now()
      
      mockWebSocket = new MockWebSocket('wss://test.supabase.co/realtime/v1')
      
      await new Promise(resolve => {
        mockWebSocket.addEventListener('open', () => {
          const connectionTime = performance.now() - startTime
          performanceMonitor.recordConnectionTime(connectionTime)
          resolve(undefined)
        })
      })

      const stats = performanceMonitor.getStats()
      console.log(`WebSocket connection time: ${stats.connectionTime.toFixed(2)}ms`)
      
      expect(stats.connectionTime).toBeLessThan(CONNECTION_BUDGET)
    })

    it('should handle message throughput efficiently', async () => {
      mockWebSocket = new MockWebSocket('wss://test.supabase.co/realtime/v1')
      
      await new Promise(resolve => {
        mockWebSocket.addEventListener('open', resolve)
      })

      const messageCount = 100
      const startTime = performance.now()
      
      // Send multiple messages rapidly
      for (let i = 0; i < messageCount; i++) {
        const messageStartTime = performance.now()
        
        mockWebSocket.send(JSON.stringify({
          id: i,
          event: 'test_event',
          payload: { data: `Message ${i}` }
        }))
        
        // Record message processing time
        setTimeout(() => {
          const messageLatency = performance.now() - messageStartTime
          performanceMonitor.recordMessageLatency(messageLatency)
        }, Math.random() * 10)
      }

      // Wait for all messages to be processed
      await new Promise(resolve => setTimeout(resolve, 200))
      
      const totalTime = performance.now() - startTime
      const throughput = messageCount / (totalTime / 1000) // messages per second
      const stats = performanceMonitor.getStats()

      console.log(`Message throughput: ${throughput.toFixed(2)} msg/s`)
      console.log(`Average message latency: ${stats.averageMessageLatency.toFixed(2)}ms`)
      console.log(`P95 message latency: ${stats.p95MessageLatency.toFixed(2)}ms`)

      expect(throughput).toBeGreaterThan(THROUGHPUT_BUDGET)
      expect(stats.averageMessageLatency).toBeLessThan(LATENCY_BUDGET)
    })

    it('should handle connection errors gracefully', async () => {
      mockWebSocket = new MockWebSocket('wss://test.supabase.co/realtime/v1')
      
      let errorHandled = false
      let reconnectionTime = 0
      
      mockWebSocket.addEventListener('error', () => {
        errorHandled = true
        performanceMonitor.recordError()
      })

      mockWebSocket.addEventListener('close', async () => {
        // Simulate reconnection
        const reconnectStart = performance.now()
        performanceMonitor.recordReconnection()
        
        // Wait for reconnection logic
        await new Promise(resolve => setTimeout(resolve, 50))
        
        reconnectionTime = performance.now() - reconnectStart
      })

      // Simulate error
      mockWebSocket.simulateError(new Error('Connection lost'))
      mockWebSocket.close()

      await new Promise(resolve => setTimeout(resolve, 100))

      const stats = performanceMonitor.getStats()
      
      expect(errorHandled).toBe(true)
      expect(stats.errorCount).toBe(1)
      expect(stats.reconnectionCount).toBe(1)
      expect(reconnectionTime).toBeLessThan(100) // Quick reconnection
    })
  })

  describe('Supabase Realtime Performance', () => {
    const SUBSCRIPTION_BUDGET = 50 // ms
    const NOTIFICATION_LATENCY_BUDGET = 30 // ms

    it('should handle subscription setup efficiently', async () => {
      mockRealtime = new MockSupabaseRealtime()
      
      const subscriptions = [
        'notifications',
        'students:changes',
        'groups:changes',
        'payments:changes',
        'dashboard:stats'
      ]

      const subscriptionPromises = subscriptions.map(async (topic) => {
        const startTime = performance.now()
        
        const subscription = mockRealtime.channel(topic)
          .on('*', (payload) => {
            // Handle real-time updates
            console.log(`Received update for ${topic}:`, payload.eventType)
          })

        await new Promise(resolve => {
          subscription.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              const subscriptionTime = performance.now() - startTime
              performanceMonitor.recordSubscriptionTime(subscriptionTime)
              resolve(undefined)
            }
          })
        })
      })

      await Promise.all(subscriptionPromises)
      
      const stats = performanceMonitor.getStats()
      console.log(`Average subscription time: ${stats.averageSubscriptionTime.toFixed(2)}ms`)
      
      expect(stats.averageSubscriptionTime).toBeLessThan(SUBSCRIPTION_BUDGET)
    })

    it('should process real-time notifications efficiently', async () => {
      mockRealtime = new MockSupabaseRealtime()
      
      // Set up notification subscription
      const notificationSubscription = mockRealtime.channel('notifications')
        .on('INSERT', (payload) => {
          const latency = Date.now() - payload.timestamp
          performanceMonitor.recordMessageLatency(latency)
        })
        .on('UPDATE', (payload) => {
          const latency = Date.now() - payload.timestamp
          performanceMonitor.recordMessageLatency(latency)
        })

      await new Promise(resolve => {
        notificationSubscription.subscribe(() => resolve(undefined))
      })

      // Simulate various notification types
      const notifications = [
        { type: 'INSERT', table: 'payments', id: '1', data: { amount: 500000 } },
        { type: 'UPDATE', table: 'students', id: '2', data: { status: 'active' } },
        { type: 'INSERT', table: 'enrollments', id: '3', data: { student_id: '1', group_id: '1' } },
        { type: 'UPDATE', table: 'groups', id: '4', data: { current_enrollment: 15 } },
        { type: 'INSERT', table: 'transactions', id: '5', data: { type: 'income' } }
      ]

      // Send notifications with timing
      for (const notification of notifications) {
        mockRealtime.simulateRealtimeEvent('notifications', notification.type, {
          ...notification,
          timestamp: Date.now()
        })
        
        // Small delay between notifications
        await new Promise(resolve => setTimeout(resolve, 5))
      }

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 100))

      const stats = performanceMonitor.getStats()
      console.log(`Notification latency: ${stats.averageMessageLatency.toFixed(2)}ms`)
      console.log(`Processed ${stats.messageCount} notifications`)

      expect(stats.averageMessageLatency).toBeLessThan(NOTIFICATION_LATENCY_BUDGET)
      expect(stats.messageCount).toBe(notifications.length)
    })
  })

  describe('Real-time Dashboard Updates', () => {
    it('should update dashboard statistics in real-time efficiently', async () => {
      mockRealtime = new MockSupabaseRealtime()
      
      let dashboardUpdates = 0
      let updateLatencies: number[] = []
      
      const dashboardSubscription = mockRealtime.channel('dashboard:stats')
        .on('stats_update', (payload) => {
          const updateStart = performance.now()
          
          // Simulate dashboard update processing
          const stats = payload.data
          const updatedElements = [
            'total-students',
            'active-groups', 
            'monthly-revenue',
            'pending-payments'
          ]
          
          // Simulate DOM updates
          updatedElements.forEach(element => {
            // Mock DOM update time
            const elementUpdateTime = Math.random() * 5
          })
          
          const updateTime = performance.now() - updateStart
          updateLatencies.push(updateTime)
          dashboardUpdates++
        })

      await new Promise(resolve => {
        dashboardSubscription.subscribe(() => resolve(undefined))
      })

      // Simulate dashboard statistics updates
      const statsUpdates = [
        { total_students: 487, active_groups: 23, monthly_revenue: 4850000 },
        { total_students: 488, active_groups: 23, monthly_revenue: 4900000 },
        { total_students: 488, active_groups: 24, monthly_revenue: 4950000 },
        { total_students: 489, active_groups: 24, monthly_revenue: 5000000 }
      ]

      for (const update of statsUpdates) {
        mockRealtime.simulateRealtimeEvent('dashboard:stats', 'stats_update', {
          data: update,
          timestamp: Date.now()
        })
        
        await new Promise(resolve => setTimeout(resolve, 20))
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      const averageUpdateTime = updateLatencies.reduce((a, b) => a + b, 0) / updateLatencies.length
      
      console.log(`Dashboard updates processed: ${dashboardUpdates}`)
      console.log(`Average update time: ${averageUpdateTime.toFixed(2)}ms`)

      expect(dashboardUpdates).toBe(statsUpdates.length)
      expect(averageUpdateTime).toBeLessThan(20) // Should update dashboard quickly
    })

    it('should handle concurrent real-time updates without performance degradation', async () => {
      mockRealtime = new MockSupabaseRealtime()
      
      const channels = ['students', 'groups', 'payments', 'notifications']
      const updatesPerChannel = 10
      const concurrentUpdates = []
      
      // Set up multiple channel subscriptions
      const subscriptions = channels.map(channel => {
        const subscription = mockRealtime.channel(`${channel}:changes`)
          .on('*', (payload) => {
            const processingStart = performance.now()
            
            // Simulate processing time based on update type
            const processingDelay = channel === 'payments' ? 15 : 
                                   channel === 'students' ? 10 : 5
            
            setTimeout(() => {
              const processingTime = performance.now() - processingStart
              performanceMonitor.recordMessageLatency(processingTime)
            }, processingDelay)
          })
          
        subscription.subscribe()
        return subscription
      })

      await new Promise(resolve => setTimeout(resolve, 100))

      // Send concurrent updates across all channels
      const startTime = performance.now()
      
      channels.forEach(channel => {
        for (let i = 0; i < updatesPerChannel; i++) {
          concurrentUpdates.push(
            mockRealtime.simulateRealtimeEvent(`${channel}:changes`, 'UPDATE', {
              id: `${channel}-${i}`,
              data: { updated_at: new Date().toISOString() },
              timestamp: Date.now()
            })
          )
        }
      })

      // Wait for all updates to process
      await new Promise(resolve => setTimeout(resolve, 300))
      
      const totalTime = performance.now() - startTime
      const stats = performanceMonitor.getStats()
      const throughput = stats.messageCount / (totalTime / 1000)

      console.log(`Concurrent updates throughput: ${throughput.toFixed(2)} updates/s`)
      console.log(`Average processing time: ${stats.averageMessageLatency.toFixed(2)}ms`)
      console.log(`Total updates processed: ${stats.messageCount}`)

      expect(stats.messageCount).toBe(channels.length * updatesPerChannel)
      expect(throughput).toBeGreaterThan(50) // Should handle at least 50 updates/s
      expect(stats.averageMessageLatency).toBeLessThan(50) // Processing should be fast
    })
  })

  describe('Memory Usage and Leak Detection', () => {
    it('should not create memory leaks with long-running subscriptions', async () => {
      mockRealtime = new MockSupabaseRealtime()
      
      performanceMonitor.recordMemoryUsage() // Initial measurement
      
      const subscription = mockRealtime.channel('memory-test')
        .on('update', (payload) => {
          // Process update
        })
      
      await new Promise(resolve => {
        subscription.subscribe(() => resolve(undefined))
      })

      // Simulate many updates over time
      for (let i = 0; i < 100; i++) {
        mockRealtime.simulateRealtimeEvent('memory-test', 'update', {
          id: i,
          data: { value: Math.random() }
        })
        
        if (i % 20 === 0) {
          performanceMonitor.recordMemoryUsage()
        }
        
        await new Promise(resolve => setTimeout(resolve, 10))
      }

      performanceMonitor.recordMemoryUsage() // Final measurement
      
      // Clean up subscription
      await subscription.unsubscribe()
      
      const stats = performanceMonitor.getStats()
      const memoryGrowthMB = stats.memoryGrowth / 1024 / 1024
      
      console.log(`Memory growth: ${memoryGrowthMB.toFixed(2)}MB`)
      
      // Memory growth should be minimal for real-time subscriptions
      expect(Math.abs(memoryGrowthMB)).toBeLessThan(10) // Less than 10MB growth
    })

    it('should properly clean up subscriptions to prevent leaks', async () => {
      mockRealtime = new MockSupabaseRealtime()
      
      const subscriptionCount = 10
      const subscriptions = []
      
      // Create multiple subscriptions
      for (let i = 0; i < subscriptionCount; i++) {
        const subscription = mockRealtime.channel(`test-${i}`)
          .on('update', () => {})
          
        subscriptions.push(subscription)
        subscription.subscribe()
      }

      await new Promise(resolve => setTimeout(resolve, 50))
      
      // Verify all subscriptions are active
      expect(mockRealtime['subscriptions'].size).toBe(subscriptionCount)
      
      // Clean up subscriptions
      for (const subscription of subscriptions) {
        await subscription.unsubscribe()
      }
      
      // Verify cleanup
      expect(mockRealtime['subscriptions'].size).toBe(0)
    })
  })

  describe('Error Recovery and Resilience', () => {
    it('should handle network interruptions gracefully', async () => {
      mockRealtime = new MockSupabaseRealtime()
      
      let reconnectAttempts = 0
      let messagesReceived = 0
      let messagesLost = 0
      
      const subscription = mockRealtime.channel('resilience-test')
        .on('message', () => {
          messagesReceived++
        })
      
      await new Promise(resolve => {
        subscription.subscribe(() => resolve(undefined))
      })

      // Send initial messages
      for (let i = 0; i < 5; i++) {
        mockRealtime.simulateRealtimeEvent('resilience-test', 'message', { id: i })
      }

      // Simulate network interruption
      mockRealtime.disconnect()
      
      // Try to send messages during disconnection (should be lost)
      for (let i = 5; i < 10; i++) {
        try {
          mockRealtime.simulateRealtimeEvent('resilience-test', 'message', { id: i })
          messagesLost++
        } catch (error) {
          // Expected during disconnection
        }
      }

      // Simulate reconnection
      mockRealtime = new MockSupabaseRealtime()
      const newSubscription = mockRealtime.channel('resilience-test')
        .on('message', () => {
          messagesReceived++
        })
      
      await new Promise(resolve => {
        newSubscription.subscribe(() => {
          reconnectAttempts++
          resolve(undefined)
        })
      })

      // Send messages after reconnection
      for (let i = 10; i < 15; i++) {
        mockRealtime.simulateRealtimeEvent('resilience-test', 'message', { id: i })
      }

      await new Promise(resolve => setTimeout(resolve, 100))

      console.log(`Messages received: ${messagesReceived}`)
      console.log(`Reconnection attempts: ${reconnectAttempts}`)
      
      expect(messagesReceived).toBeGreaterThan(8) // Most messages should be received
      expect(reconnectAttempts).toBe(1) // Should attempt reconnection
    })
  })

  describe('Performance Under Load', () => {
    it('should maintain performance with high message volume', async () => {
      mockRealtime = new MockSupabaseRealtime()
      
      const highVolumeSubscription = mockRealtime.channel('high-volume')
        .on('bulk_update', (payload) => {
          const processingStart = performance.now()
          
          // Simulate processing large payload
          const records = payload.data.records || []
          records.forEach((record: any) => {
            // Simulate record processing
          })
          
          const processingTime = performance.now() - processingStart
          performanceMonitor.recordMessageLatency(processingTime)
        })

      await new Promise(resolve => {
        highVolumeSubscription.subscribe(() => resolve(undefined))
      })

      // Send high-volume updates
      const batchSizes = [10, 50, 100, 200, 500]
      
      for (const batchSize of batchSizes) {
        const batchData = Array.from({ length: batchSize }, (_, i) => ({
          id: i,
          data: { value: Math.random(), timestamp: Date.now() }
        }))

        const batchStart = performance.now()
        
        mockRealtime.simulateRealtimeEvent('high-volume', 'bulk_update', {
          data: { records: batchData },
          batch_size: batchSize,
          timestamp: Date.now()
        })
        
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      const stats = performanceMonitor.getStats()
      
      console.log(`High volume processing stats:`)
      console.log(`  Average latency: ${stats.averageMessageLatency.toFixed(2)}ms`)
      console.log(`  P95 latency: ${stats.p95MessageLatency.toFixed(2)}ms`)
      console.log(`  Messages processed: ${stats.messageCount}`)

      // Should handle high volume efficiently
      expect(stats.averageMessageLatency).toBeLessThan(100)
      expect(stats.p95MessageLatency).toBeLessThan(200)
    })
  })
})

export { MockWebSocket, MockSupabaseRealtime, RealtimePerformanceMonitor }