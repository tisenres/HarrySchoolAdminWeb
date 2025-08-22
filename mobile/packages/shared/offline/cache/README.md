# Offline Cache Directory

This directory contains cached content for the Harry School mobile applications with Islamic cultural awareness and educational context.

## Structure

- `educational/` - Cached educational content (lessons, assessments, progress data)
- `cultural/` - Cached cultural content (Islamic calendar, prayer times, respectful content)
- `user/` - Cached user-specific data (profiles, preferences, settings)
- `media/` - Cached multimedia content (images, audio, video)
- `temp/` - Temporary cache files (automatically cleaned)

## Features

- **Cultural Awareness**: Respects Islamic values and prayer times
- **Educational Priority**: Prioritizes academic content during school hours
- **MMKV Storage**: High-performance local storage (30x faster than AsyncStorage)
- **Encryption**: AES encryption for sensitive educational data
- **Compression**: LZ4 compression for optimal storage efficiency
- **Integrity**: SHA-256 checksums for data verification

## Cache Management

The cache is automatically managed by the CacheManager service with:
- Intelligent cleanup during prayer times
- Educational content prioritization during school hours
- Cultural sensitivity in content validation
- Teacher authority-based access control
- Student progress tracking preservation

## Cultural Considerations

- Cache cleanup scheduled outside prayer times
- Ramadan-sensitive content handling
- Respectful content validation
- Arabic text and Islamic content prioritization
- Hijri calendar integration

## Educational Context

- Teacher authority-based conflict resolution
- Student progress data protection
- Assessment data integrity
- Academic year cycle awareness
- Age-appropriate content filtering