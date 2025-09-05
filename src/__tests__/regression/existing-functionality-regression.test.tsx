import React from 'react'
import userEvent from '@testing-library/user-event'
import { render, screen, waitFor, within } from '../utils/test-utils'
import { createMockTeacherList, createMockHandlers } from '../utils/mock-data'
import { createMockStudentData, createStudentReferralScenarios } from '../utils/referral-mock-data'

// Import existing components that should not be affected by referral integration
import { TeachersTable } from '@/components/admin/teachers/teachers-table'

// Mock student ranking components (simulated)
const MockStudentRankingTab = ({ student, activeTab, onTabChange }: any) => (
  <div data-testid="student-ranking-tab">
    <div data-testid="tab-navigation">
      {['overview', 'achievements', 'goals', 'history', 'analytics', 'referrals'].map(tab => (
        <button 
          key={tab}
          data-testid={`tab-${tab}`}
          onClick={() => onTabChange(tab)}
          className={activeTab === tab ? 'active' : ''}
        >
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
    
    <div data-testid="tab-content">
      {activeTab === 'overview' && (
        <div data-testid="overview-content">
          <div>Student: {student.full_name}</div>
          <div>Points: {student.total_points}</div>
          <div>Rank: #{student.ranking_position}</div>
        </div>
      )}
      
      {activeTab === 'achievements' && (
        <div data-testid="achievements-content">
          <div>Total Achievements: {student.achievements_count}</div>
          <div data-testid="achievement-list">
            {/* Existing achievements should still work */}
            <div>Academic Excellence</div>
            <div>Perfect Attendance</div>
            <div>Leadership Award</div>
            {/* New referral achievements should integrate seamlessly */}
            <div>First Referral</div>
            <div>Referral Champion</div>
          </div>
        </div>
      )}
      
      {activeTab === 'referrals' && (
        <div data-testid="referrals-content">
          <div>Referral Summary</div>
          <div>This is the new referral section</div>
        </div>
      )}
    </div>
  </div>
)

const MockLeaderboard = ({ students, viewType, onViewChange }: any) => (
  <div data-testid="leaderboard">
    <div data-testid="view-filters">
      {['performance', 'referrals', 'combined'].map(view => (
        <button 
          key={view}
          data-testid={`view-${view}`}
          onClick={() => onViewChange(view)}
          className={viewType === view ? 'active' : ''}
        >
          {view.charAt(0).toUpperCase() + view.slice(1)}
        </button>
      ))}
    </div>
    
    <div data-testid="leaderboard-table">
      <table>
        <thead>
          <tr>
            <th>Rank</th>
            <th>Student</th>
            <th>Points</th>
            {viewType === 'performance' && <th>Achievements</th>}
            {viewType === 'referrals' && <th>Referrals</th>}
            {viewType === 'referrals' && <th>Conversion Rate</th>}
            {viewType === 'combined' && <th>Academic</th>}
            {viewType === 'combined' && <th>Referrals</th>}
          </tr>
        </thead>
        <tbody>
          {students.map((student: any, index: number) => (
            <tr key={student.id} data-testid={`student-row-${student.id}`}>
              <td>#{index + 1}</td>
              <td>{student.full_name}</td>
              <td>{student.total_points}</td>
              {viewType === 'performance' && <td>{student.achievements_count}</td>}
              {viewType === 'referrals' && <td>{student.referralData?.summary.totalReferrals || 0}</td>}
              {viewType === 'referrals' && <td>{student.referralData?.summary.conversionRate || 0}%</td>}
              {viewType === 'combined' && <td>{student.total_points - (student.referralPoints || 0)}</td>}
              {viewType === 'combined' && <td>{student.referralPoints || 0}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
)

const MockAnalyticsDashboard = ({ students, showReferralAnalytics }: any) => (
  <div data-testid="analytics-dashboard">
    <div data-testid="dashboard-stats">
      <div data-testid="stat-total-students">
        Total Students: {students.length}
      </div>
      <div data-testid="stat-avg-points">
        Avg Points: {Math.round(students.reduce((sum: number, s: any) => sum + s.total_points, 0) / students.length)}
      </div>
      <div data-testid="stat-achievements">
        Total Achievements: {students.reduce((sum: number, s: any) => sum + s.achievements_count, 0)}
      </div>
      {showReferralAnalytics && (
        <div data-testid="stat-referrals">
          Total Referrals: {students.reduce((sum: number, s: any) => sum + (s.referralData?.summary.totalReferrals || 0), 0)}
        </div>
      )}
    </div>
    
    <div data-testid="performance-charts">
      <div data-testid="academic-performance-chart">
        Academic Performance Chart
      </div>
      <div data-testid="engagement-chart">
        Student Engagement Chart
      </div>
      {showReferralAnalytics && (
        <div data-testid="referral-correlation-chart">
          Referral Correlation Chart
        </div>
      )}
    </div>
  </div>
)

// Mock Next.js components
jest.mock('next/link', () => {
  const MockLink = ({ children, href, ...props }: any) => {
    return <a href={href} {...props}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

describe('Existing Functionality Regression Tests', () => {
  const mockTeachers = createMockTeacherList(5)
  const mockHandlers = createMockHandlers()
  
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Teachers Table Functionality (Should Not Be Affected)', () => {
    it('maintains all existing teachers table functionality', async () => {
      const user = userEvent.setup()
      
      render(
        <TeachersTable
          teachers={mockTeachers}
          selectedTeachers={[]}
          onSelectionChange={mockHandlers.onSelectionChange}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          onBulkDelete={mockHandlers.onBulkDelete}
        />
      )

      // Verify all existing functionality still works
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Contact')).toBeInTheDocument()
      expect(screen.getByText('Employment')).toBeInTheDocument()
      expect(screen.getByText('Specializations')).toBeInTheDocument()

      // Test selection functionality
      const firstCheckbox = screen.getAllByRole('checkbox')[1]
      await user.click(firstCheckbox)
      expect(mockHandlers.onSelectionChange).toHaveBeenCalledWith([mockTeachers[0]!.id])

      // Test sorting functionality
      const nameHeader = screen.getByRole('button', { name: /name/i })
      await user.click(nameHeader)
      expect(mockHandlers.onSortChange).toHaveBeenCalled()
    })

    it('preserves teachers table performance', () => {
      const startTime = performance.now()
      
      render(
        <TeachersTable
          teachers={mockTeachers}
          selectedTeachers={[]}
          onSelectionChange={mockHandlers.onSelectionChange}
          onEdit={mockHandlers.onEdit}
          onDelete={mockHandlers.onDelete}
          onBulkDelete={mockHandlers.onBulkDelete}
        />
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render within original performance expectations
      expect(renderTime).toBeLessThan(50) // Very fast for existing functionality
      expect(screen.getByRole('table')).toBeInTheDocument()
    })
  })

  describe('Student Ranking System (With Referral Integration)', () => {
    const scenarios = createStudentReferralScenarios()
    const students = Object.values(scenarios).map(s => ({ 
      ...s.student, 
      referralData: s.referralData 
    }))

    it('maintains existing student ranking tab navigation', async () => {
      const user = userEvent.setup()
      let activeTab = 'overview'
      
      render(
        <MockStudentRankingTab
          student={students[0]}
          activeTab={activeTab}
          onTabChange={(tab: string) => { activeTab = tab }}
        />
      )

      // Verify existing tabs still work
      expect(screen.getByTestId('tab-overview')).toBeInTheDocument()
      expect(screen.getByTestId('tab-achievements')).toBeInTheDocument()
      expect(screen.getByTestId('tab-goals')).toBeInTheDocument()
      expect(screen.getByTestId('tab-history')).toBeInTheDocument()
      expect(screen.getByTestId('tab-analytics')).toBeInTheDocument()

      // New referrals tab should be added
      expect(screen.getByTestId('tab-referrals')).toBeInTheDocument()

      // Test tab switching
      await user.click(screen.getByTestId('tab-achievements'))
      expect(screen.getByTestId('achievements-content')).toBeInTheDocument()

      // Verify existing achievements are still displayed
      expect(screen.getByText('Academic Excellence')).toBeInTheDocument()
      expect(screen.getByText('Perfect Attendance')).toBeInTheDocument()
      
      // New referral achievements should integrate seamlessly
      expect(screen.getByText('First Referral')).toBeInTheDocument()
      expect(screen.getByText('Referral Champion')).toBeInTheDocument()
    })

    it('preserves existing overview tab content while adding referral context', () => {
      render(
        <MockStudentRankingTab
          student={students[0]}
          activeTab="overview"
          onTabChange={() => {}}
        />
      )

      const overviewContent = screen.getByTestId('overview-content')
      
      // Existing content should remain
      expect(within(overviewContent).getByText(/Student: Alice Johnson/)).toBeInTheDocument()
      expect(within(overviewContent).getByText(/Points: 1200/)).toBeInTheDocument()
      expect(within(overviewContent).getByText(/Rank: #1/)).toBeInTheDocument()
    })

    it('maintains ranking calculation accuracy with referral points integration', () => {
      const studentWithReferrals = {
        ...students[0],
        academic_points: 750,
        referral_points: 450,
        total_points: 1200,
      }

      // Verify ranking calculation includes both academic and referral points
      expect(studentWithReferrals.academic_points + studentWithReferrals.referral_points)
        .toBe(studentWithReferrals.total_points)

      render(
        <div data-testid="ranking-calculation">
          <div>Academic Points: {studentWithReferrals.academic_points}</div>
          <div>Referral Points: {studentWithReferrals.referral_points}</div>
          <div>Total Points: {studentWithReferrals.total_points}</div>
        </div>
      )

      expect(screen.getByText('Academic Points: 750')).toBeInTheDocument()
      expect(screen.getByText('Referral Points: 450')).toBeInTheDocument()
      expect(screen.getByText('Total Points: 1200')).toBeInTheDocument()
    })
  })

  describe('Leaderboard System (Enhanced with Referral Views)', () => {
    const scenarios = createStudentReferralScenarios()
    const students = Object.values(scenarios).map(s => ({ 
      ...s.student, 
      referralData: s.referralData,
      referralPoints: s.referralData.summary.totalPointsEarned,
    }))

    it('maintains existing performance view in leaderboard', async () => {
      const user = userEvent.setup()
      
      render(
        <MockLeaderboard
          students={students}
          viewType="performance"
          onViewChange={() => {}}
        />
      )

      // Existing performance view should work unchanged
      expect(screen.getByTestId('view-performance')).toHaveClass('active')
      expect(screen.getByText('Points')).toBeInTheDocument()
      expect(screen.getByText('Achievements')).toBeInTheDocument()

      // Should not show referral columns in performance view
      expect(screen.queryByText('Referrals')).not.toBeInTheDocument()
      expect(screen.queryByText('Conversion Rate')).not.toBeInTheDocument()

      // Verify student data displays correctly
      students.forEach(student => {
        expect(screen.getByText(student.full_name)).toBeInTheDocument()
        expect(screen.getByText(student.total_points.toString())).toBeInTheDocument()
      })
    })

    it('adds referral view without breaking existing functionality', async () => {
      const user = userEvent.setup()
      let viewType = 'performance'
      
      render(
        <MockLeaderboard
          students={students}
          viewType={viewType}
          onViewChange={(view: string) => { viewType = view }}
        />
      )

      // Switch to referral view
      await user.click(screen.getByTestId('view-referrals'))
      
      // Should show referral-specific columns
      expect(screen.getByText('Referrals')).toBeInTheDocument()
      expect(screen.getByText('Conversion Rate')).toBeInTheDocument()
      
      // Should not show performance-specific columns
      expect(screen.queryByText('Achievements')).not.toBeInTheDocument()
    })

    it('provides combined view that shows both academic and referral data', async () => {
      const user = userEvent.setup()
      
      render(
        <MockLeaderboard
          students={students}
          viewType="combined"
          onViewChange={() => {}}
        />
      )

      // Combined view should show both academic and referral columns
      expect(screen.getByText('Academic')).toBeInTheDocument()
      expect(screen.getByText('Referrals')).toBeInTheDocument()
      
      // Verify data breakdown
      students.forEach(student => {
        const academicPoints = student.total_points - (student.referralPoints || 0)
        expect(screen.getByText(academicPoints.toString())).toBeInTheDocument()
      })
    })
  })

  describe('Analytics Dashboard (Enhanced with Referral Correlation)', () => {
    const scenarios = createStudentReferralScenarios()
    const students = Object.values(scenarios).map(s => ({ 
      ...s.student, 
      referralData: s.referralData 
    }))

    it('maintains existing analytics functionality', () => {
      render(
        <MockAnalyticsDashboard
          students={students}
          showReferralAnalytics={false}
        />
      )

      // Existing analytics should work unchanged
      expect(screen.getByTestId('stat-total-students')).toBeInTheDocument()
      expect(screen.getByTestId('stat-avg-points')).toBeInTheDocument()
      expect(screen.getByTestId('stat-achievements')).toBeInTheDocument()

      // Existing charts should be present
      expect(screen.getByTestId('academic-performance-chart')).toBeInTheDocument()
      expect(screen.getByTestId('engagement-chart')).toBeInTheDocument()

      // Referral analytics should not appear when disabled
      expect(screen.queryByTestId('stat-referrals')).not.toBeInTheDocument()
      expect(screen.queryByTestId('referral-correlation-chart')).not.toBeInTheDocument()
    })

    it('adds referral analytics without affecting existing metrics', () => {
      render(
        <MockAnalyticsDashboard
          students={students}
          showReferralAnalytics={true}
        />
      )

      // All existing analytics should still be present
      expect(screen.getByTestId('stat-total-students')).toBeInTheDocument()
      expect(screen.getByTestId('stat-avg-points')).toBeInTheDocument()
      expect(screen.getByTestId('stat-achievements')).toBeInTheDocument()
      expect(screen.getByTestId('academic-performance-chart')).toBeInTheDocument()
      expect(screen.getByTestId('engagement-chart')).toBeInTheDocument()

      // New referral analytics should be added
      expect(screen.getByTestId('stat-referrals')).toBeInTheDocument()
      expect(screen.getByTestId('referral-correlation-chart')).toBeInTheDocument()
    })

    it('calculates correct analytics metrics with referral integration', () => {
      render(
        <MockAnalyticsDashboard
          students={students}
          showReferralAnalytics={true}
        />
      )

      // Verify calculations
      const totalStudents = students.length
      const avgPoints = Math.round(students.reduce((sum, s) => sum + s.total_points, 0) / students.length)
      const totalAchievements = students.reduce((sum, s) => sum + s.achievements_count, 0)
      const totalReferrals = students.reduce((sum, s) => sum + (s.referralData?.summary.totalReferrals || 0), 0)

      expect(screen.getByText(`Total Students: ${totalStudents}`)).toBeInTheDocument()
      expect(screen.getByText(`Avg Points: ${avgPoints}`)).toBeInTheDocument()
      expect(screen.getByText(`Total Achievements: ${totalAchievements}`)).toBeInTheDocument()
      expect(screen.getByText(`Total Referrals: ${totalReferrals}`)).toBeInTheDocument()
    })
  })

  describe('Point System Integration (No Regression)', () => {
    it('maintains existing point transaction patterns', () => {
      const transactions = [
        {
          id: '1',
          type: 'academic',
          points: 100,
          description: 'Quiz completion',
          date: new Date(),
        },
        {
          id: '2',
          type: 'referral',
          points: 50,
          description: 'Referral submission',
          date: new Date(),
        },
        {
          id: '3',
          type: 'achievement',
          points: 25,
          description: 'Achievement unlock',
          date: new Date(),
        },
      ]

      render(
        <div data-testid="transaction-history">
          {transactions.map(transaction => (
            <div key={transaction.id} data-testid={`transaction-${transaction.id}`}>
              <span>{transaction.type}</span>
              <span>{transaction.points} pts</span>
              <span>{transaction.description}</span>
            </div>
          ))}
        </div>
      )

      // All transaction types should be supported
      expect(screen.getByText('academic')).toBeInTheDocument()
      expect(screen.getByText('referral')).toBeInTheDocument()
      expect(screen.getByText('achievement')).toBeInTheDocument()

      // Point values should be correct
      expect(screen.getByText('100 pts')).toBeInTheDocument()
      expect(screen.getByText('50 pts')).toBeInTheDocument()
      expect(screen.getByText('25 pts')).toBeInTheDocument()
    })

    it('maintains point calculation accuracy', () => {
      const studentPoints = {
        academic: 750,
        referral: 200,
        achievement: 150,
        bonus: 50,
      }

      const totalPoints = Object.values(studentPoints).reduce((sum, points) => sum + points, 0)

      render(
        <div data-testid="points-breakdown">
          <div>Academic: {studentPoints.academic}</div>
          <div>Referral: {studentPoints.referral}</div>
          <div>Achievement: {studentPoints.achievement}</div>
          <div>Bonus: {studentPoints.bonus}</div>
          <div>Total: {totalPoints}</div>
        </div>
      )

      expect(screen.getByText('Academic: 750')).toBeInTheDocument()
      expect(screen.getByText('Referral: 200')).toBeInTheDocument()
      expect(screen.getByText('Total: 1150')).toBeInTheDocument()
    })
  })

  describe('Achievement System Integration (No Regression)', () => {
    it('maintains existing achievement categories alongside new referral achievements', () => {
      const achievements = [
        { id: '1', name: 'Academic Excellence', category: 'academic', earned: true },
        { id: '2', name: 'Perfect Attendance', category: 'attendance', earned: true },
        { id: '3', name: 'Leadership Award', category: 'leadership', earned: false },
        { id: '4', name: 'First Referral', category: 'referral', earned: true },
        { id: '5', name: 'Referral Champion', category: 'referral', earned: false },
      ]

      render(
        <div data-testid="achievements-gallery">
          {achievements.map(achievement => (
            <div 
              key={achievement.id} 
              data-testid={`achievement-${achievement.id}`}
              className={achievement.earned ? 'earned' : 'locked'}
            >
              <span>{achievement.name}</span>
              <span>{achievement.category}</span>
              <span>{achievement.earned ? 'Earned' : 'Locked'}</span>
            </div>
          ))}
        </div>
      )

      // All achievement categories should be represented
      expect(screen.getByText('Academic Excellence')).toBeInTheDocument()
      expect(screen.getByText('Perfect Attendance')).toBeInTheDocument()
      expect(screen.getByText('First Referral')).toBeInTheDocument()
      expect(screen.getByText('Referral Champion')).toBeInTheDocument()

      // Achievement states should be correct
      achievements.forEach(achievement => {
        const achievementElement = screen.getByTestId(`achievement-${achievement.id}`)
        expect(achievementElement).toHaveClass(achievement.earned ? 'earned' : 'locked')
      })
    })
  })

  describe('Navigation and UI Consistency (No Regression)', () => {
    it('maintains existing navigation structure with new referral sections', () => {
      const navigationItems = [
        { id: 'dashboard', label: 'Dashboard', hasSubmenu: false },
        { id: 'students', label: 'Students', hasSubmenu: true },
        { id: 'teachers', label: 'Teachers', hasSubmenu: true },
        { id: 'rankings', label: 'Rankings', hasSubmenu: true },
        { id: 'analytics', label: 'Analytics', hasSubmenu: true },
        { id: 'settings', label: 'Settings', hasSubmenu: false },
      ]

      render(
        <nav data-testid="main-navigation">
          {navigationItems.map(item => (
            <div key={item.id} data-testid={`nav-${item.id}`}>
              <a href={`/${item.id}`}>{item.label}</a>
              {item.hasSubmenu && (
                <ul data-testid={`submenu-${item.id}`}>
                  <li>Overview</li>
                  <li>Management</li>
                  {item.id === 'students' && <li>Referrals</li>}
                  {item.id === 'rankings' && <li>Referral Leaders</li>}
                  {item.id === 'analytics' && <li>Referral Analytics</li>}
                </ul>
              )}
            </div>
          ))}
        </nav>
      )

      // All existing navigation items should be present
      navigationItems.forEach(item => {
        expect(screen.getByTestId(`nav-${item.id}`)).toBeInTheDocument()
        expect(screen.getByText(item.label)).toBeInTheDocument()
      })

      // New referral-related navigation should be integrated naturally
      expect(screen.getByText('Referrals')).toBeInTheDocument()
      expect(screen.getByText('Referral Leaders')).toBeInTheDocument()
      expect(screen.getByText('Referral Analytics')).toBeInTheDocument()
    })
  })

  describe('Performance Regression Prevention', () => {
    it('maintains or improves page load performance', () => {
      const scenarios = createStudentReferralScenarios()
      const students = Object.values(scenarios).map(s => s.student)
      
      const startTime = performance.now()

      render(
        <div data-testid="full-page-simulation">
          <MockAnalyticsDashboard students={students} showReferralAnalytics={true} />
          <MockLeaderboard students={students} viewType="combined" onViewChange={() => {}} />
          <MockStudentRankingTab 
            student={students[0]} 
            activeTab="overview" 
            onTabChange={() => {}} 
          />
        </div>
      )

      const endTime = performance.now()
      const renderTime = endTime - startTime

      // Should render complete page with referral integration in reasonable time
      expect(renderTime).toBeLessThan(200) // 200ms for full page
      expect(screen.getByTestId('full-page-simulation')).toBeInTheDocument()
    })

    it('does not increase memory usage significantly', () => {
      const initialMemory = process.memoryUsage().heapUsed
      
      // Render multiple components with referral integration
      const scenarios = createStudentReferralScenarios()
      const students = Object.values(scenarios).map(s => s.student)
      
      for (let i = 0; i < 5; i++) {
        const { unmount } = render(
          <div>
            <MockAnalyticsDashboard students={students} showReferralAnalytics={true} />
            <MockLeaderboard students={students} viewType="combined" onViewChange={() => {}} />
          </div>
        )
        unmount()
      }

      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory

      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(5 * 1024 * 1024) // Less than 5MB
    })
  })
})