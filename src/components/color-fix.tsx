'use client'

import { useEffect } from 'react'

export function ColorFix() {
  useEffect(() => {
    // Force Harry School green color #1d7452 to override cached CSS
    const style = document.createElement('style')
    style.id = 'harry-school-color-fix'
    style.textContent = `
      button[type="submit"] { 
        background-color: #1d7452 !important; 
      }
      a[href="/forgot-password"] { 
        color: #1d7452 !important; 
      }
      .text-primary, [class*="text-primary"] { 
        color: #1d7452 !important; 
      }
      .bg-primary, [class*="bg-primary"] { 
        background-color: #1d7452 !important; 
      }
      :root { 
        --primary: 145 58% 29% !important; 
      }
    `
    
    // Remove existing fix if present
    const existing = document.getElementById('harry-school-color-fix')
    if (existing) {
      existing.remove()
    }
    
    document.head.appendChild(style)
  }, [])

  return null
}