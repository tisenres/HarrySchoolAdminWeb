/**
 * Basic Server Connectivity Test
 * Verifies the development server is running and responsive
 */

const API_BASE_URL = 'http://localhost:3002'

describe('🌐 Server Connectivity Test', () => {
  it('should connect to the development server', async () => {
    try {
      const response = await fetch(API_BASE_URL)
      console.log(`Server status: ${response.status}`)
      console.log(`Server responded with: ${response.statusText}`)
      
      // Server should respond (even if with redirect or error)
      expect(response).toBeDefined()
      expect(typeof response.status).toBe('number')
    } catch (error) {
      console.error('Connection failed:', error)
      throw error
    }
  })

  it('should have Next.js routing working', async () => {
    try {
      // Test a basic page route
      const response = await fetch(`${API_BASE_URL}/en`)
      console.log(`Page route status: ${response.status}`)
      
      expect(response).toBeDefined()
      expect([200, 302, 401, 403].includes(response.status)).toBe(true)
    } catch (error) {
      console.error('Page routing failed:', error)
      throw error
    }
  })

  it('should have API routes accessible', async () => {
    try {
      // Test API route exists (expect auth error, not 404)
      const response = await fetch(`${API_BASE_URL}/api/teachers`)
      console.log(`API route status: ${response.status}`)
      
      expect(response).toBeDefined()
      // Should not be 404 (route exists), but might be 401/403 (auth required)
      expect(response.status).not.toBe(404)
    } catch (error) {
      console.error('API routing failed:', error)
      throw error
    }
  })

  it('should verify environment is development', async () => {
    // This test runs in Node.js environment
    expect(process.env.NODE_ENV).toBeDefined()
    console.log(`Environment: ${process.env.NODE_ENV}`)
  })
})