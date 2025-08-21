import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';

interface GroupData {
  id: string;
  name: string;
  student_count: number;
  present_today: number;
  absent_today: number;
  subject: string;
  level: string;
  next_class: string | null;
  has_alerts: boolean;
}

interface GroupsOverviewProps {
  groups: GroupData[];
  isLoading: boolean;
}

function GroupCard({ group }: { group: GroupData }) {
  const attendanceRate = group.student_count > 0 
    ? (group.present_today / group.student_count) * 100 
    : 0;

  return (
    <Pressable style={styles.groupCard}>
      <View style={styles.groupHeader}>
        <View style={styles.groupTitleRow}>
          <Text style={styles.groupName}>{group.name}</Text>
          {group.has_alerts && (
            <View style={styles.alertBadge}>
              <Circle cx={4} cy={4} r={4} fill="#dc2626" />
            </View>
          )}
        </View>
        <Text style={styles.groupSubject}>{group.subject} • {group.level}</Text>
      </View>

      <View style={styles.attendanceSection}>
        <View style={styles.attendanceStats}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{group.present_today}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: '#dc2626' }]}>
              {group.absent_today}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          
          <View style={styles.statDivider} />
          
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{group.student_count}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        <View style={styles.attendanceBar}>
          <View 
            style={[
              styles.attendanceProgress, 
              { width: `${attendanceRate}%` }
            ]} 
          />
        </View>
        
        <Text style={styles.attendanceRate}>
          {attendanceRate.toFixed(0)}% attendance today
        </Text>
      </View>

      {group.next_class && (
        <View style={styles.nextClassSection}>
          <View style={styles.nextClassRow}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
              <Path
                d="M12 8V12L16 16M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z"
                stroke="#64748b"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
            <Text style={styles.nextClassText}>
              Next class: {group.next_class}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
}

export function GroupsOverview({ groups, isLoading }: GroupsOverviewProps) {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>My Groups</Text>
        <View style={styles.loadingCard} />
        <View style={styles.loadingCard} />
      </View>
    );
  }

  const totalStudents = groups.reduce((sum, group) => sum + group.student_count, 0);
  const totalPresent = groups.reduce((sum, group) => sum + group.present_today, 0);
  const alertGroups = groups.filter(group => group.has_alerts).length;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>My Groups</Text>
        <View style={styles.summaryStats}>
          <Text style={styles.summaryText}>
            {totalPresent}/{totalStudents} students present
          </Text>
          {alertGroups > 0 && (
            <View style={styles.alertSummary}>
              <Circle cx={4} cy={4} r={4} fill="#dc2626" />
              <Text style={styles.alertText}>{alertGroups} alerts</Text>
            </View>
          )}
        </View>
      </View>

      {groups.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No groups assigned</Text>
        </View>
      ) : (
        <View style={styles.groupsList}>
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  summaryStats: {
    alignItems: 'flex-end',
  },
  summaryText: {
    fontSize: 12,
    color: '#64748b',
    marginBottom: 4,
  },
  alertSummary: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    fontSize: 12,
    color: '#dc2626',
    marginLeft: 6,
    fontWeight: '500',
  },
  groupsList: {
    gap: 12,
  },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  groupHeader: {
    marginBottom: 16,
  },
  groupTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  alertBadge: {
    width: 8,
    height: 8,
  },
  groupSubject: {
    fontSize: 14,
    color: '#64748b',
  },
  attendanceSection: {
    marginBottom: 12,
  },
  attendanceStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1d7452',
  },
  statLabel: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 8,
  },
  attendanceBar: {
    height: 4,
    backgroundColor: '#e2e8f0',
    borderRadius: 2,
    marginBottom: 8,
  },
  attendanceProgress: {
    height: 4,
    backgroundColor: '#1d7452',
    borderRadius: 2,
  },
  attendanceRate: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  nextClassSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  nextClassRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextClassText: {
    fontSize: 12,
    color: '#64748b',
    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
  },
  loadingCard: {
    height: 140,
    backgroundColor: '#e2e8f0',
    borderRadius: 16,
    marginBottom: 12,
  },
});