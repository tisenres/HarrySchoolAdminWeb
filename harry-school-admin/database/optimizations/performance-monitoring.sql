-- Database Performance Monitoring Queries
-- Use these to monitor and analyze query performance

-- 1. ANALYZE TABLE STATISTICS - Run after index changes
ANALYZE teachers;
ANALYZE students; 
ANALYZE groups;
ANALYZE group_teachers;
ANALYZE group_students;
ANALYZE rankings;
ANALYZE profiles;

-- 2. CHECK INDEX USAGE STATISTICS
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as times_used,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;

-- 3. IDENTIFY UNUSED INDEXES (candidates for removal)
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    pg_size_pretty(pg_relation_size(indexrelid)) as size
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;

-- 4. QUERY PERFORMANCE ANALYSIS
-- Enable query statistics (run once as superuser)
-- SELECT pg_stat_statements_reset(); -- Reset statistics

-- Most time-consuming queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    rows,
    100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read, 0) AS hit_percent
FROM pg_stat_statements 
WHERE query LIKE '%teachers%' OR query LIKE '%students%' OR query LIKE '%groups%'
ORDER BY total_time DESC
LIMIT 10;

-- 5. TABLE SIZES AND BLOAT ANALYSIS
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(tablename::regclass)) as total_size,
    pg_size_pretty(pg_relation_size(tablename::regclass)) as table_size,
    pg_size_pretty(pg_total_relation_size(tablename::regclass) - pg_relation_size(tablename::regclass)) as index_size
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('teachers', 'students', 'groups', 'profiles', 'rankings')
ORDER BY pg_total_relation_size(tablename::regclass) DESC;

-- 6. ACTIVE CONNECTIONS AND LOCKS
SELECT 
    pid,
    usename,
    application_name,
    state,
    query_start,
    LEFT(query, 100) as query_preview
FROM pg_stat_activity 
WHERE state = 'active'
  AND query NOT LIKE '%pg_stat_activity%';

-- 7. SLOW QUERY DETECTION
-- Queries running longer than 5 seconds
SELECT 
    pid,
    now() - query_start as duration,
    query,
    state
FROM pg_stat_activity
WHERE (now() - query_start) > interval '5 seconds'
  AND query NOT LIKE '%pg_stat_activity%'
ORDER BY duration DESC;

-- 8. RLS POLICY PERFORMANCE TEST
-- Test the performance impact of RLS policies
EXPLAIN (ANALYZE, BUFFERS) 
SELECT COUNT(*) 
FROM teachers 
WHERE organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  AND deleted_at IS NULL;

-- Compare with optimized version
EXPLAIN (ANALYZE, BUFFERS)
SELECT COUNT(*)
FROM teachers 
WHERE organization_id = auth.get_organization_id()
  AND deleted_at IS NULL;

-- 9. INDEX EFFECTIVENESS CHECK
-- Check if indexes are being used for common queries
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM students 
WHERE organization_id = '00000000-0000-0000-0000-000000000000'
  AND enrollment_status = 'active' 
  AND payment_status = 'current'
  AND deleted_at IS NULL
LIMIT 20;

-- 10. CACHE HIT RATIO MONITORING
-- Should be > 95% for good performance
SELECT 
    'index hit rate' as name,
    (sum(idx_blks_hit)) / nullif(sum(idx_blks_hit + idx_blks_read),0) as ratio
FROM pg_stat_user_indexes
UNION ALL
SELECT 
    'table hit rate' as name,
    sum(heap_blks_hit) / nullif(sum(heap_blks_hit) + sum(heap_blks_read),0) as ratio
FROM pg_stat_user_tables;

-- 11. VACUUM AND ANALYZE STATUS
SELECT 
    schemaname,
    tablename,
    last_vacuum,
    last_autovacuum,
    last_analyze,
    last_autoanalyze,
    n_tup_ins + n_tup_upd + n_tup_del as total_changes
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY total_changes DESC;

-- 12. CONNECTION POOL MONITORING
SELECT 
    count(*) as total_connections,
    count(*) FILTER (WHERE state = 'active') as active,
    count(*) FILTER (WHERE state = 'idle') as idle,
    count(*) FILTER (WHERE state = 'idle in transaction') as idle_in_transaction
FROM pg_stat_activity;

-- Usage Instructions:
-- 1. Run ANALYZE after creating new indexes
-- 2. Monitor index usage weekly to identify unused indexes
-- 3. Check query performance monthly or after major changes  
-- 4. Ensure cache hit ratio stays above 95%
-- 5. Identify and optimize queries with mean_time > 100ms