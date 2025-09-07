import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    console.log('🔍 Testing Supabase connection...')
    
    // Test environment variables
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    console.log('Environment check:')
    console.log('- URL exists:', !!url)
    console.log('- Anon key exists:', !!anonKey)
    console.log('- Service key exists:', !!serviceKey)
    console.log('- URL value:', url?.substring(0, 30) + '...')
    
    if (!url || !anonKey) {
      throw new Error('Missing Supabase environment variables')
    }

    // Test basic connection with anon key
    console.log('Testing anon key connection...')
    const supabaseAnon = createClient(url, anonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      },
      realtime: {
        params: {
          eventsPerSecond: 2
        }
      }
    })

    // Simple query test
    console.log('Testing simple query...')
    const { data: healthCheck, error: healthError } = await supabaseAnon
      .from('organizations')
      .select('id')
      .limit(1)

    let anonResult = 'SUCCESS'
    if (healthError) {
      console.log('Anon query error:', healthError.message)
      anonResult = healthError.message
    } else {
      console.log('Anon query success:', healthCheck?.length || 0, 'records')
    }

    // Test service role connection if available
    let serviceResult = 'Not tested'
    if (serviceKey) {
      try {
        console.log('Testing service key connection...')
        const supabaseService = createClient(url, serviceKey, {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        })

        const { data: serviceHealthCheck, error: serviceHealthError } = await supabaseService
          .from('organizations')
          .select('id, name')
          .limit(1)

        if (serviceHealthError) {
          console.log('Service query error:', serviceHealthError.message)
          serviceResult = serviceHealthError.message
        } else {
          console.log('Service query success:', serviceHealthCheck?.length || 0, 'records')
          serviceResult = `SUCCESS - Found ${serviceHealthCheck?.length || 0} orgs`
        }
      } catch (serviceError: any) {
        console.log('Service connection error:', serviceError.message)
        serviceResult = serviceError.message
      }
    }

    // Test authentication endpoint
    console.log('Testing auth endpoint...')
    let authTest = 'Not tested'
    try {
      const authResponse = await fetch(`${url}/auth/v1/health`, {
        headers: {
          'apikey': anonKey,
          'Content-Type': 'application/json'
        }
      })
      
      if (authResponse.ok) {
        authTest = 'SUCCESS - Auth endpoint reachable'
      } else {
        authTest = `Failed - Status: ${authResponse.status}`
      }
    } catch (authError: any) {
      authTest = authError.message
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasUrl: !!url,
        hasAnonKey: !!anonKey,
        hasServiceKey: !!serviceKey,
        url: url?.substring(0, 50) + '...'
      },
      connectionTests: {
        anonConnection: anonResult,
        serviceConnection: serviceResult,
        authEndpoint: authTest
      },
      nextSteps: anonResult === 'SUCCESS' ? 
        'Connection working! Try logging in again.' : 
        'Connection issues detected. Check network/firewall settings.'
    })

  } catch (error: any) {
    console.error('Debug connection failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}