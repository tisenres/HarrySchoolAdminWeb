import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { X, Search, Clock, BookOpen, User, FileText, Mic } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { FontSizes, FontWeights } from '@/constants/fonts';

interface SearchResult {
  id: string;
  title: string;
  subtitle: string;
  type: 'lesson' | 'assignment' | 'vocabulary' | 'teacher' | 'ai_task';
  category: string;
  timestamp?: Date;
}

interface SearchPanelProps {
  visible: boolean;
  onClose: () => void;
}

const mockSearchResults: SearchResult[] = [
  {
    id: '1',
    title: 'Past Simple Tense',
    subtitle: 'Grammar lesson covering regular and irregular verbs',
    type: 'lesson',
    category: 'English Grammar',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '2',
    title: 'Essay: My Summer Vacation',
    subtitle: 'Writing assignment due tomorrow',
    type: 'assignment',
    category: 'English Writing',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '3',
    title: 'Advanced Vocabulary Set 5',
    subtitle: '50 words related to business and economics',
    type: 'vocabulary',
    category: 'Vocabulary',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    title: 'Ms. Johnson',
    subtitle: 'English teacher - Room 201',
    type: 'teacher',
    category: 'Teachers',
  },
  {
    id: '5',
    title: 'AI Grammar Practice',
    subtitle: 'Generated tasks for conditional sentences',
    type: 'ai_task',
    category: 'AI Assistant',
    timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
  },
];

const recentSearches = [
  'past simple',
  'conditional sentences',
  'vocabulary practice',
  'Ms. Johnson',
  'essay writing',
];

export default function SearchPanel({ visible, onClose }: SearchPanelProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      // Simulate search delay
      const timer = setTimeout(() => {
        const filtered = mockSearchResults.filter(
          result =>
            result.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
            result.category.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setSearchResults(filtered);
        setIsSearching(false);
      }, 300);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchQuery]);

  const getResultIcon = (type: string) => {
    switch (type) {
      case 'lesson':
        return <BookOpen size={20} color={Colors.primary} />;
      case 'assignment':
        return <FileText size={20} color={Colors.error} />;
      case 'vocabulary':
        return <BookOpen size={20} color={Colors.secondary} />;
      case 'teacher':
        return <User size={20} color={Colors.success} />;
      case 'ai_task':
        return <Mic size={20} color={Colors.primary} />;
      default:
        return <Search size={20} color={Colors.textSecondary} />;
    }
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (hours < 24) {
      return `${hours}h ago`;
    } else {
      return `${days}d ago`;
    }
  };

  const handleRecentSearch = (query: string) => {
    setSearchQuery(query);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search lessons, assignments, vocabulary..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
                <X size={16} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {searchQuery.trim().length === 0 ? (
            <View style={styles.emptySearchState}>
              <View style={styles.recentSearches}>
                <Text style={styles.sectionTitle}>Recent Searches</Text>
                <View style={styles.recentSearchesList}>
                  {recentSearches.map((query, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.recentSearchItem}
                      onPress={() => handleRecentSearch(query)}
                    >
                      <Clock size={16} color={Colors.textSecondary} />
                      <Text style={styles.recentSearchText}>{query}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.quickActions}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.quickActionsList}>
                  <TouchableOpacity style={styles.quickActionItem}>
                    <BookOpen size={24} color={Colors.primary} />
                    <Text style={styles.quickActionText}>Browse Lessons</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionItem}>
                    <FileText size={24} color={Colors.error} />
                    <Text style={styles.quickActionText}>My Assignments</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionItem}>
                    <BookOpen size={24} color={Colors.secondary} />
                    <Text style={styles.quickActionText}>Vocabulary</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.quickActionItem}>
                    <Mic size={24} color={Colors.primary} />
                    <Text style={styles.quickActionText}>AI Assistant</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.searchResults}>
              {isSearching ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>Searching...</Text>
                </View>
              ) : searchResults.length === 0 ? (
                <View style={styles.noResultsState}>
                  <Search size={48} color={Colors.textSecondary} />
                  <Text style={styles.noResultsTitle}>No results found</Text>
                  <Text style={styles.noResultsMessage}>
                    Try searching for lessons, assignments, or vocabulary
                  </Text>
                </View>
              ) : (
                <View style={styles.resultsList}>
                  <Text style={styles.resultsCount}>
                    {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} found
                  </Text>
                  {searchResults.map((result) => (
                    <TouchableOpacity key={result.id} style={styles.resultItem}>
                      <View style={styles.resultIcon}>
                        {getResultIcon(result.type)}
                      </View>
                      
                      <View style={styles.resultContent}>
                        <View style={styles.resultHeader}>
                          <Text style={styles.resultTitle}>{result.title}</Text>
                          <Text style={styles.resultCategory}>{result.category}</Text>
                        </View>
                        <Text style={styles.resultSubtitle}>{result.subtitle}</Text>
                        {result.timestamp && (
                          <Text style={styles.resultTimestamp}>
                            {getTimeAgo(result.timestamp)}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.text,
    paddingVertical: 4,
  },
  clearButton: {
    padding: 4,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border + '44',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  emptySearchState: {
    padding: 20,
    gap: 32,
  },
  recentSearches: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.text,
  },
  recentSearchesList: {
    gap: 8,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    gap: 12,
  },
  recentSearchText: {
    fontSize: FontSizes.base,
    color: Colors.text,
  },
  quickActions: {
    gap: 16,
  },
  quickActionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionItem: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    minWidth: '45%',
    gap: 8,
  },
  quickActionText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.text,
    textAlign: 'center',
  },
  searchResults: {
    flex: 1,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  noResultsState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 16,
  },
  noResultsTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
  },
  noResultsMessage: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  resultsList: {
    padding: 20,
    gap: 16,
  },
  resultsCount: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  resultItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  resultIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultContent: {
    flex: 1,
    gap: 4,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  resultTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  resultCategory: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    backgroundColor: Colors.primary + '22',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  resultSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  resultTimestamp: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});