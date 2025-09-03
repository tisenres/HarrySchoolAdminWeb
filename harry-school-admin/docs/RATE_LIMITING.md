# Rate Limiting Documentation

## Overview

The Harry School CRM implements comprehensive rate limiting to protect against abuse, ensure fair resource usage, and maintain system performance. Rate limiting is applied at multiple levels across the application.

## Rate Limiting Implementation

### 1. Middleware-Level Rate Limiting

Located in `src/lib/middleware/rate-limit.ts`, our rate limiting system provides different limits for different route types:

#### API Route Limits
- **General API Routes**: 100 requests per minute per IP
- **Authentication Routes**: 10 requests per minute per IP (login, signup, password reset)
- **Dashboard Routes**: 300 requests per minute per IP
- **File Upload Routes**: 20 requests per minute per IP

#### Implementation Details
```typescript
// Example from middleware.ts
const rateLimitResult = await applyRateLimit(request, 'api')
if (rateLimitResult && rateLimitResult.status === 429) {
  return rateLimitResult
}
```

### 2. Route-Specific Configuration

#### Teachers API Routes
| Endpoint | Method | Rate Limit | Cache TTL |
|----------|--------|------------|-----------|
| `/api/teachers` | GET | 100/min | 60 seconds |
| `/api/teachers` | POST | 30/min | - |
| `/api/teachers/[id]` | GET | 200/min | 30 seconds |
| `/api/teachers/[id]` | PUT/PATCH | 20/min | - |
| `/api/teachers/[id]` | DELETE | 10/min | - |
| `/api/teachers/stats` | GET | 50/min | 300 seconds |

#### Students API Routes  
| Endpoint | Method | Rate Limit | Cache TTL |
|----------|--------|------------|-----------|
| `/api/students` | GET | 100/min | 60 seconds |
| `/api/students` | POST | 30/min | - |
| `/api/students/[id]` | GET | 200/min | 30 seconds |

#### Groups API Routes
| Endpoint | Method | Rate Limit | Cache TTL |
|----------|--------|------------|-----------|
| `/api/groups` | GET | 100/min | 60 seconds |
| `/api/groups` | POST | 20/min | - |

### 3. Authentication Rate Limiting

Special protection for authentication endpoints:

```typescript
// Stricter limits for auth routes
const isAuthRoute = pathname.includes('/login') || 
                   pathname.includes('/sign-in') ||
                   pathname.includes('/forgot-password')

if (isAuthRoute) {
  const rateLimitResult = await applyRateLimit(request, 'auth')
  // 10 requests per minute limit
}
```

## Caching Strategy

### Response Caching
- **Static Data**: 300 seconds (5 minutes) for statistics
- **Dynamic Data**: 60 seconds for lists, 30 seconds for individual records
- **User-Specific Data**: No caching for personalized content

### Cache Headers
```typescript
// Example cache configuration
export const revalidate = 60 // Cache for 60 seconds
response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
```

### Performance Monitoring

Rate limiting includes performance monitoring:

```typescript
// Wrapped with performance monitoring
export const GET = withMiddleware(
  withCaching,
  withErrorBoundary,
  withPerformanceMonitoring
)(withAuth(async (request: NextRequest) => {
  // Route handler
}, 'admin'))
```

## Error Responses

### Rate Limit Exceeded (429)
```json
{
  "error": "Too Many Requests",
  "message": "Rate limit exceeded. Try again in 60 seconds.",
  "retryAfter": 60,
  "limit": 100,
  "remaining": 0,
  "resetTime": "2025-01-01T12:00:00Z"
}
```

### Headers Included
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Requests remaining in current window
- `X-RateLimit-Reset`: Time when the limit resets
- `Retry-After`: Seconds to wait before retry

## Client-Side Handling

### Automatic Retry with Backoff
Frontend components should implement exponential backoff:

```typescript
// Example retry logic
const fetchWithRetry = async (url: string, options: RequestInit, retries = 3) => {
  try {
    const response = await fetch(url, options)
    if (response.status === 429 && retries > 0) {
      const retryAfter = response.headers.get('Retry-After')
      const delay = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * (4 - retries)
      await new Promise(resolve => setTimeout(resolve, delay))
      return fetchWithRetry(url, options, retries - 1)
    }
    return response
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000))
      return fetchWithRetry(url, options, retries - 1)
    }
    throw error
  }
}
```

### User Experience
- **Progress Indicators**: Show loading states during rate-limited requests
- **Error Messages**: User-friendly messages explaining temporary limits
- **Graceful Degradation**: Disable features temporarily when limits are hit

## Security Considerations

### IP-Based Limiting
- Rate limits are applied per IP address
- Consider proxy and CDN configurations
- Whitelist internal service IPs

### User-Based Limiting
- Additional per-user limits for authenticated requests
- Different limits for different user roles
- Session-based tracking

### Bot Protection
- Challenge suspected automated traffic
- CAPTCHA for repeated limit violations
- Progressive restrictions for abuse patterns

## Monitoring and Alerting

### Metrics to Track
- Rate limit hit rates by endpoint
- Most frequently limited IPs
- Performance impact of rate limiting
- Cache hit/miss rates

### Alerts
- High rate limit violation rates
- Performance degradation
- Cache efficiency drops
- Unusual traffic patterns

## Configuration

### Environment Variables
```env
# Rate limiting configuration
RATE_LIMIT_WINDOW_MS=60000        # 1 minute window
RATE_LIMIT_MAX_REQUESTS=100       # Max requests per window
RATE_LIMIT_SKIP_SUCCESSFUL_REQUESTS=false
RATE_LIMIT_STORE_TYPE=memory      # memory | redis

# Cache configuration
CACHE_TTL_DEFAULT=60              # Default TTL in seconds
CACHE_TTL_STATS=300              # Statistics cache TTL
CACHE_TTL_USER_DATA=30           # User-specific data TTL
```

### Production Recommendations

1. **Use Redis**: For distributed rate limiting across multiple servers
2. **Configure CDN**: Set up CloudFlare or similar for additional protection  
3. **Monitor Metrics**: Track rate limit effectiveness and user impact
4. **Adjust Limits**: Fine-tune based on actual usage patterns
5. **Geographic Rules**: Consider different limits for different regions

## Testing Rate Limits

### Development Testing
```bash
# Test rate limiting with curl
for i in {1..15}; do 
  curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/teachers
  sleep 1
done
```

### Load Testing
- Use tools like Artillery or k6
- Test different endpoint combinations
- Verify cache effectiveness under load
- Monitor performance degradation

## Troubleshooting

### Common Issues
1. **Legitimate users hitting limits**: Increase limits or implement user-based tracking
2. **Cache not working**: Check TTL settings and cache headers
3. **Performance impact**: Monitor middleware overhead
4. **False positives**: Review IP detection logic

### Debug Headers
Enable debug headers in development:
```typescript
response.headers.set('X-RateLimit-Debug', 'true')
response.headers.set('X-Cache-Status', cacheHit ? 'HIT' : 'MISS')
```

## Changelog

### v2.0.0 (Current)
- Implemented multi-tier rate limiting
- Added caching middleware
- Performance monitoring integration
- Comprehensive error handling

### v1.0.0
- Basic IP-based rate limiting
- Simple memory store
- Manual cache implementation

---

**Note**: This documentation should be updated whenever rate limiting configurations are changed. All changes should be reviewed for security and performance implications.