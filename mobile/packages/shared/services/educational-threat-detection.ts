/**
 * Educational Threat Detection and Incident Response System
 * Harry School Mobile Apps
 * 
 * Specialized threat detection for educational environments
 * Focuses on student safety, data protection, and institutional security
 */

import * as Device from 'expo-device';
import * as Network from 'expo-network';
import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { EducationalComplianceMonitor } from './educational-compliance-monitor';

export type ThreatType = 
  | 'UNAUTHORIZED_ACCESS' | 'DATA_BREACH' | 'MALICIOUS_APP' | 'NETWORK_INTRUSION'
  | 'IDENTITY_THEFT' | 'SOCIAL_ENGINEERING' | 'CYBERBULLYING' | 'INAPPROPRIATE_CONTENT'
  | 'DEVICE_COMPROMISE' | 'CREDENTIAL_STUFFING' | 'SESSION_HIJACKING' | 'PHISHING'
  | 'MALWARE' | 'RANSOMWARE' | 'DDoS' | 'MAN_IN_THE_MIDDLE'
  | 'PRIVACY_VIOLATION' | 'AGE_INAPPROPRIATE_ACCESS' | 'PARENTAL_CONTROL_BYPASS';

export type ThreatSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'EMERGENCY';
export type ThreatStatus = 'DETECTED' | 'INVESTIGATING' | 'CONFIRMED' | 'MITIGATED' | 'RESOLVED' | 'FALSE_POSITIVE';
export type ResponseAction = 'ALERT' | 'BLOCK' | 'QUARANTINE' | 'ESCALATE' | 'NOTIFY_PARENTS' | 'NOTIFY_AUTHORITIES';

export interface ThreatIndicator {
  id: string;
  name: string;
  description: string;
  threatTypes: ThreatType[];
  
  // Detection criteria
  conditions: Array<{
    parameter: string;
    operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'matches_pattern';
    value: any;
    weight: number; // Confidence weight (0-1)
  }>;
  
  // Scoring
  baseScore: number; // 0-100
  confidenceThreshold: number; // Minimum confidence to trigger
  
  // Response configuration
  severity: ThreatSeverity;
  autoResponse: ResponseAction[];
  manualReviewRequired: boolean;
  
  // Educational context
  affectsMinors: boolean;
  requiresParentalNotification: boolean;
  reportToSchoolAdmin: boolean;
  
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ThreatDetection {
  id: string;
  detectedAt: string;
  threatType: ThreatType;
  severity: ThreatSeverity;
  status: ThreatStatus;
  
  // Context information
  userId?: string;
  userAge?: number;
  deviceId: string;
  sessionId?: string;
  ipAddress: string;
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  
  // Threat details
  description: string;
  indicators: Array<{
    indicatorId: string;
    confidence: number;
    evidence: Record<string, any>;
  }>;
  
  // Risk assessment
  riskScore: number; // 0-100
  potentialImpact: string[];
  affectedAssets: string[];
  
  // Educational considerations
  involvesMinorData: boolean;
  schoolNetworkInvolved: boolean;
  parentalNotificationSent: boolean;
  adminNotificationSent: boolean;
  
  // Response tracking
  responseActions: Array<{
    action: ResponseAction;
    executedAt: string;
    executedBy: 'system' | 'admin' | 'teacher';
    success: boolean;
    details?: string;
  }>;
  
  // Investigation
  investigationNotes: string[];
  evidence: Array<{
    type: string;
    description: string;
    data: Record<string, any>;
    collectedAt: string;
  }>;
  
  // Resolution
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  preventionRecommendations?: string[];
}

export interface IncidentResponse {
  id: string;
  threatDetectionId: string;
  createdAt: string;
  
  // Incident classification
  incidentType: 'SECURITY' | 'PRIVACY' | 'SAFETY' | 'COMPLIANCE' | 'OPERATIONAL';
  severity: ThreatSeverity;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  
  // Response team
  assignedTo?: string;
  responseTeam: string[];
  externalSupport?: string[];
  
  // Timeline
  detectionTime: string;
  responseTime?: string;
  containmentTime?: string;
  resolutionTime?: string;
  
  // Actions taken
  containmentActions: string[];
  investigationActions: string[];
  recoveryActions: string[];
  preventionActions: string[];
  
  // Communication
  stakeholdersNotified: Array<{
    stakeholder: 'PARENTS' | 'ADMIN' | 'TEACHERS' | 'STUDENTS' | 'AUTHORITIES' | 'BOARD';
    notifiedAt: string;
    method: 'EMAIL' | 'SMS' | 'PUSH' | 'CALL' | 'IN_PERSON';
    message: string;
  }>;
  
  // Documentation
  reportGenerated: boolean;
  reportPath?: string;
  lessonsLearned: string[];
  
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  resolvedAt?: string;
}

export interface ThreatIntelligence {
  // Global threat patterns
  knownThreats: Array<{
    signature: string;
    description: string;
    mitigation: string;
  }>;
  
  // Educational sector threats
  educationalThreats: Array<{
    type: ThreatType;
    targetAge: string;
    commonVectors: string[];
    prevention: string[];
  }>;
  
  // IoCs (Indicators of Compromise)
  ipBlacklist: string[];
  domainBlacklist: string[];
  maliciousApps: string[];
  suspiciousPatterns: string[];
  
  lastUpdated: string;
}

/**
 * Educational Threat Detection System
 * Monitors for security threats in educational mobile apps
 */
export class EducationalThreatDetector {
  private static readonly STORAGE_KEYS = {
    THREAT_INDICATORS: 'threat_indicators',
    DETECTIONS: 'threat_detections',
    INCIDENTS: 'incident_responses',
    INTELLIGENCE: 'threat_intelligence',
    SETTINGS: 'threat_detection_settings',
  };

  private threatIndicators: ThreatIndicator[] = [];
  private threatIntelligence: ThreatIntelligence | null = null;
  private isMonitoring = false;
  private complianceMonitor: EducationalComplianceMonitor;

  constructor(
    private organizationId: string,
    complianceMonitor: EducationalComplianceMonitor
  ) {
    this.complianceMonitor = complianceMonitor;
    this.initializeThreatDetection();
  }

  /**
   * Initialize threat detection system
   */
  private async initializeThreatDetection(): Promise<void> {
    try {
      // Load threat indicators
      await this.loadThreatIndicators();
      
      // Load threat intelligence
      await this.loadThreatIntelligence();
      
      // Set up default indicators if none exist
      if (this.threatIndicators.length === 0) {
        await this.setupDefaultThreatIndicators();
      }
      
      // Start monitoring
      this.startThreatMonitoring();

    } catch (error) {
      console.error('Threat detection initialization failed:', error);
      throw error;
    }
  }

  /**
   * Analyze event for potential threats
   */
  async analyzeForThreats(
    eventData: Record<string, any>,
    userId?: string,
    sessionId?: string
  ): Promise<ThreatDetection[]> {
    const detections: ThreatDetection[] = [];

    try {
      // Get context information
      const context = await this.gatherThreatContext(userId, sessionId);
      
      // Check each threat indicator
      for (const indicator of this.threatIndicators) {
        if (!indicator.active) continue;

        const detection = await this.evaluateThreatIndicator(
          indicator,
          eventData,
          context
        );

        if (detection) {
          detections.push(detection);
          
          // Log detection
          await this.complianceMonitor.logAuditEvent(
            'SECURITY_VIOLATION',
            'threat_detected',
            {
              threatType: detection.threatType,
              severity: detection.severity,
              riskScore: detection.riskScore,
            },
            userId,
            undefined,
            sessionId
          );

          // Execute automated response
          await this.executeAutomatedResponse(detection);
        }
      }

      // Store detections
      for (const detection of detections) {
        await this.storeThreatDetection(detection);
      }

      return detections;

    } catch (error) {
      console.error('Threat analysis failed:', error);
      return [];
    }
  }

  /**
   * Evaluate specific threat indicator
   */
  private async evaluateThreatIndicator(
    indicator: ThreatIndicator,
    eventData: Record<string, any>,
    context: Record<string, any>
  ): Promise<ThreatDetection | null> {
    let totalConfidence = 0;
    let maxConfidence = 0;
    const matchedConditions: Array<{ indicatorId: string; confidence: number; evidence: Record<string, any> }> = [];

    // Evaluate each condition
    for (const condition of indicator.conditions) {
      const confidence = await this.evaluateCondition(condition, eventData, context);
      if (confidence > 0) {
        totalConfidence += confidence * condition.weight;
        matchedConditions.push({
          indicatorId: indicator.id,
          confidence,
          evidence: {
            parameter: condition.parameter,
            value: eventData[condition.parameter] || context[condition.parameter],
            expectedValue: condition.value,
            operator: condition.operator,
          },
        });
      }
      maxConfidence += condition.weight;
    }

    // Calculate final confidence
    const finalConfidence = maxConfidence > 0 ? (totalConfidence / maxConfidence) * 100 : 0;

    // Check if confidence meets threshold
    if (finalConfidence >= indicator.confidenceThreshold) {
      // Calculate risk score
      const riskScore = this.calculateRiskScore(indicator, finalConfidence, context);

      // Create threat detection
      const detection: ThreatDetection = {
        id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        detectedAt: new Date().toISOString(),
        threatType: indicator.threatTypes[0], // Use primary threat type
        severity: indicator.severity,
        status: 'DETECTED',
        
        userId: context.userId,
        userAge: context.userAge,
        deviceId: context.deviceId || 'unknown',
        sessionId: context.sessionId,
        ipAddress: context.ipAddress || '0.0.0.0',
        location: context.location,
        
        description: `${indicator.name}: ${indicator.description}`,
        indicators: matchedConditions,
        
        riskScore,
        potentialImpact: this.assessPotentialImpact(indicator, context),
        affectedAssets: this.identifyAffectedAssets(indicator, context),
        
        involvesMinorData: context.userAge ? context.userAge < 18 : false,
        schoolNetworkInvolved: context.schoolNetwork || false,
        parentalNotificationSent: false,
        adminNotificationSent: false,
        
        responseActions: [],
        investigationNotes: [],
        evidence: [{
          type: 'detection_context',
          description: 'Context data at time of detection',
          data: { eventData, context },
          collectedAt: new Date().toISOString(),
        }],
      };

      return detection;
    }

    return null;
  }

  /**
   * Execute automated response actions
   */
  private async executeAutomatedResponse(detection: ThreatDetection): Promise<void> {
    const indicator = this.threatIndicators.find(i => 
      i.id === detection.indicators[0]?.indicatorId
    );
    
    if (!indicator) return;

    for (const action of indicator.autoResponse) {
      try {
        const success = await this.executeResponseAction(action, detection);
        
        detection.responseActions.push({
          action,
          executedAt: new Date().toISOString(),
          executedBy: 'system',
          success,
          details: success ? 'Automated response executed successfully' : 'Automated response failed',
        });

      } catch (error) {
        console.error(`Failed to execute response action ${action}:`, error);
        
        detection.responseActions.push({
          action,
          executedAt: new Date().toISOString(),
          executedBy: 'system',
          success: false,
          details: `Error: ${error.message}`,
        });
      }
    }
  }

  /**
   * Execute specific response action
   */
  private async executeResponseAction(
    action: ResponseAction,
    detection: ThreatDetection
  ): Promise<boolean> {
    switch (action) {
      case 'ALERT':
        return await this.sendSecurityAlert(detection);
        
      case 'BLOCK':
        return await this.blockThreatSource(detection);
        
      case 'QUARANTINE':
        return await this.quarantineSession(detection);
        
      case 'ESCALATE':
        return await this.escalateToAdmin(detection);
        
      case 'NOTIFY_PARENTS':
        return await this.notifyParents(detection);
        
      case 'NOTIFY_AUTHORITIES':
        return await this.notifyAuthorities(detection);
        
      default:
        console.warn(`Unknown response action: ${action}`);
        return false;
    }
  }

  /**
   * Create incident response for critical threats
   */
  async createIncidentResponse(detection: ThreatDetection): Promise<IncidentResponse> {
    const incident: IncidentResponse = {
      id: `incident_${Date.now()}`,
      threatDetectionId: detection.id,
      createdAt: new Date().toISOString(),
      
      incidentType: this.classifyIncident(detection),
      severity: detection.severity,
      priority: this.determinePriority(detection),
      
      responseTeam: await this.assembleResponseTeam(detection),
      
      detectionTime: detection.detectedAt,
      
      containmentActions: [],
      investigationActions: [],
      recoveryActions: [],
      preventionActions: [],
      
      stakeholdersNotified: [],
      
      reportGenerated: false,
      lessonsLearned: [],
      
      status: 'OPEN',
    };

    // Execute immediate containment
    await this.executeContainmentActions(incident, detection);
    
    // Notify stakeholders
    await this.notifyStakeholders(incident, detection);
    
    // Store incident
    await this.storeIncidentResponse(incident);
    
    return incident;
  }

  /**
   * Setup default threat indicators for educational environment
   */
  private async setupDefaultThreatIndicators(): Promise<void> {
    const defaultIndicators: ThreatIndicator[] = [
      {
        id: 'multiple_failed_auth',
        name: 'Multiple Failed Authentication Attempts',
        description: 'Detects potential credential stuffing or brute force attacks',
        threatTypes: ['CREDENTIAL_STUFFING', 'UNAUTHORIZED_ACCESS'],
        conditions: [
          {
            parameter: 'failed_auth_count',
            operator: 'greater_than',
            value: 5,
            weight: 0.8,
          },
          {
            parameter: 'time_window',
            operator: 'less_than',
            value: 300, // 5 minutes
            weight: 0.6,
          },
        ],
        baseScore: 75,
        confidenceThreshold: 70,
        severity: 'HIGH',
        autoResponse: ['ALERT', 'BLOCK'],
        manualReviewRequired: false,
        affectsMinors: true,
        requiresParentalNotification: false,
        reportToSchoolAdmin: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'unusual_location_access',
        name: 'Unusual Location Access',
        description: 'Detects access from unusual geographical locations',
        threatTypes: ['UNAUTHORIZED_ACCESS', 'ACCOUNT_TAKEOVER'],
        conditions: [
          {
            parameter: 'location_distance_km',
            operator: 'greater_than',
            value: 100, // 100km from usual locations
            weight: 0.7,
          },
          {
            parameter: 'location_change_time_hours',
            operator: 'less_than',
            value: 2, // Less than 2 hours since last location
            weight: 0.6,
          },
        ],
        baseScore: 60,
        confidenceThreshold: 65,
        severity: 'MEDIUM',
        autoResponse: ['ALERT'],
        manualReviewRequired: true,
        affectsMinors: true,
        requiresParentalNotification: true,
        reportToSchoolAdmin: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'age_inappropriate_access',
        name: 'Age-Inappropriate Content Access',
        description: 'Detects attempts to access age-inappropriate content',
        threatTypes: ['AGE_INAPPROPRIATE_ACCESS', 'PARENTAL_CONTROL_BYPASS'],
        conditions: [
          {
            parameter: 'content_age_rating',
            operator: 'greater_than',
            value: 'user_age',
            weight: 1.0,
          },
        ],
        baseScore: 90,
        confidenceThreshold: 90,
        severity: 'CRITICAL',
        autoResponse: ['BLOCK', 'NOTIFY_PARENTS', 'ESCALATE'],
        manualReviewRequired: false,
        affectsMinors: true,
        requiresParentalNotification: true,
        reportToSchoolAdmin: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'malicious_network_activity',
        name: 'Malicious Network Activity',
        description: 'Detects connections to known malicious servers',
        threatTypes: ['MALWARE', 'DATA_BREACH', 'NETWORK_INTRUSION'],
        conditions: [
          {
            parameter: 'destination_ip',
            operator: 'matches_pattern',
            value: 'blacklisted_ips',
            weight: 0.9,
          },
        ],
        baseScore: 95,
        confidenceThreshold: 85,
        severity: 'CRITICAL',
        autoResponse: ['BLOCK', 'QUARANTINE', 'ALERT', 'ESCALATE'],
        manualReviewRequired: false,
        affectsMinors: true,
        requiresParentalNotification: true,
        reportToSchoolAdmin: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'excessive_data_access',
        name: 'Excessive Student Data Access',
        description: 'Detects unusual patterns of student data access',
        threatTypes: ['DATA_BREACH', 'PRIVACY_VIOLATION', 'UNAUTHORIZED_ACCESS'],
        conditions: [
          {
            parameter: 'student_records_accessed',
            operator: 'greater_than',
            value: 50,
            weight: 0.7,
          },
          {
            parameter: 'access_time_window_minutes',
            operator: 'less_than',
            value: 30,
            weight: 0.6,
          },
        ],
        baseScore: 80,
        confidenceThreshold: 75,
        severity: 'HIGH',
        autoResponse: ['ALERT', 'ESCALATE'],
        manualReviewRequired: true,
        affectsMinors: true,
        requiresParentalNotification: false,
        reportToSchoolAdmin: true,
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    // Store indicators
    for (const indicator of defaultIndicators) {
      await this.storeThreatIndicator(indicator);
    }

    this.threatIndicators = defaultIndicators;
  }

  /**
   * Generate threat detection report
   */
  async generateThreatReport(
    startDate: string,
    endDate: string
  ): Promise<{
    summary: {
      totalDetections: number;
      detectionsBySeverity: Record<ThreatSeverity, number>;
      detectionsByType: Record<ThreatType, number>;
      averageResponseTime: number;
      resolvedDetections: number;
    };
    detections: ThreatDetection[];
    incidents: IncidentResponse[];
    recommendations: string[];
  }> {
    try {
      // Load detections and incidents for period
      const detections = await this.getDetectionsInPeriod(startDate, endDate);
      const incidents = await this.getIncidentsInPeriod(startDate, endDate);

      // Calculate summary statistics
      const summary = {
        totalDetections: detections.length,
        detectionsBySeverity: this.groupDetectionsBySeverity(detections),
        detectionsByType: this.groupDetectionsByType(detections),
        averageResponseTime: this.calculateAverageResponseTime(detections),
        resolvedDetections: detections.filter(d => d.status === 'RESOLVED').length,
      };

      // Generate recommendations
      const recommendations = await this.generateSecurityRecommendations(detections, incidents);

      return {
        summary,
        detections,
        incidents,
        recommendations,
      };

    } catch (error) {
      console.error('Threat report generation failed:', error);
      throw error;
    }
  }

  // Helper methods (simplified implementations)
  private async gatherThreatContext(userId?: string, sessionId?: string): Promise<Record<string, any>> {
    return {
      userId,
      sessionId,
      deviceId: 'device_123',
      ipAddress: '0.0.0.0',
      timestamp: Date.now(),
    };
  }

  private async evaluateCondition(
    condition: any,
    eventData: Record<string, any>,
    context: Record<string, any>
  ): Promise<number> {
    // Would implement condition evaluation logic
    return 0.5; // Placeholder confidence
  }

  private calculateRiskScore(
    indicator: ThreatIndicator,
    confidence: number,
    context: Record<string, any>
  ): number {
    let score = indicator.baseScore * (confidence / 100);
    
    // Increase score for minors
    if (context.userAge && context.userAge < 18) {
      score *= 1.2;
    }
    
    // Increase score for school network
    if (context.schoolNetwork) {
      score *= 1.1;
    }
    
    return Math.min(100, Math.round(score));
  }

  private assessPotentialImpact(indicator: ThreatIndicator, context: Record<string, any>): string[] {
    const impacts: string[] = [];
    
    if (indicator.affectsMinors) {
      impacts.push('Student data privacy');
      impacts.push('COPPA compliance violation');
    }
    
    if (context.schoolNetwork) {
      impacts.push('School network security');
      impacts.push('Multiple user accounts');
    }
    
    return impacts;
  }

  private identifyAffectedAssets(indicator: ThreatIndicator, context: Record<string, any>): string[] {
    return ['student_data', 'authentication_system', 'mobile_app'];
  }

  // Response action implementations (simplified)
  private async sendSecurityAlert(detection: ThreatDetection): Promise<boolean> {
    console.log(`🚨 Security Alert: ${detection.description}`);
    return true;
  }

  private async blockThreatSource(detection: ThreatDetection): Promise<boolean> {
    console.log(`🚫 Blocking threat source for detection: ${detection.id}`);
    return true;
  }

  private async quarantineSession(detection: ThreatDetection): Promise<boolean> {
    console.log(`🔒 Quarantining session: ${detection.sessionId}`);
    return true;
  }

  private async escalateToAdmin(detection: ThreatDetection): Promise<boolean> {
    console.log(`📢 Escalating to admin: ${detection.id}`);
    return true;
  }

  private async notifyParents(detection: ThreatDetection): Promise<boolean> {
    console.log(`👨‍👩‍👧‍👦 Notifying parents for user: ${detection.userId}`);
    return true;
  }

  private async notifyAuthorities(detection: ThreatDetection): Promise<boolean> {
    console.log(`🏛️ Notifying authorities: ${detection.id}`);
    return true;
  }

  // Additional helper methods would be implemented here...
  private async loadThreatIndicators(): Promise<void> {
    // Would load from storage
  }

  private async loadThreatIntelligence(): Promise<void> {
    // Would load threat intelligence
  }

  private startThreatMonitoring(): void {
    this.isMonitoring = true;
    console.log('🔍 Threat monitoring started');
  }

  private async storeThreatDetection(detection: ThreatDetection): Promise<void> {
    console.log(`💾 Storing threat detection: ${detection.id}`);
  }

  private async storeThreatIndicator(indicator: ThreatIndicator): Promise<void> {
    console.log(`💾 Storing threat indicator: ${indicator.id}`);
  }

  private classifyIncident(detection: ThreatDetection): IncidentResponse['incidentType'] {
    if (detection.involvesMinorData) return 'PRIVACY';
    if (detection.severity === 'CRITICAL') return 'SECURITY';
    return 'OPERATIONAL';
  }

  private determinePriority(detection: ThreatDetection): IncidentResponse['priority'] {
    if (detection.severity === 'CRITICAL') return 'URGENT';
    if (detection.severity === 'HIGH') return 'HIGH';
    return 'MEDIUM';
  }

  private async assembleResponseTeam(detection: ThreatDetection): Promise<string[]> {
    return ['security_admin', 'school_admin'];
  }

  private async executeContainmentActions(incident: IncidentResponse, detection: ThreatDetection): Promise<void> {
    console.log(`🛡️ Executing containment for incident: ${incident.id}`);
  }

  private async notifyStakeholders(incident: IncidentResponse, detection: ThreatDetection): Promise<void> {
    console.log(`📣 Notifying stakeholders for incident: ${incident.id}`);
  }

  private async storeIncidentResponse(incident: IncidentResponse): Promise<void> {
    console.log(`💾 Storing incident response: ${incident.id}`);
  }

  private async getDetectionsInPeriod(startDate: string, endDate: string): Promise<ThreatDetection[]> {
    return []; // Would query stored detections
  }

  private async getIncidentsInPeriod(startDate: string, endDate: string): Promise<IncidentResponse[]> {
    return []; // Would query stored incidents
  }

  private groupDetectionsBySeverity(detections: ThreatDetection[]): Record<ThreatSeverity, number> {
    const grouped: Record<string, number> = {};
    detections.forEach(d => {
      grouped[d.severity] = (grouped[d.severity] || 0) + 1;
    });
    return grouped as Record<ThreatSeverity, number>;
  }

  private groupDetectionsByType(detections: ThreatDetection[]): Record<ThreatType, number> {
    const grouped: Record<string, number> = {};
    detections.forEach(d => {
      grouped[d.threatType] = (grouped[d.threatType] || 0) + 1;
    });
    return grouped as Record<ThreatType, number>;
  }

  private calculateAverageResponseTime(detections: ThreatDetection[]): number {
    if (detections.length === 0) return 0;
    
    const totalResponseTime = detections.reduce((sum, d) => {
      if (d.responseActions.length > 0) {
        const firstResponse = d.responseActions[0];
        const responseTime = new Date(firstResponse.executedAt).getTime() - new Date(d.detectedAt).getTime();
        return sum + responseTime;
      }
      return sum;
    }, 0);
    
    return Math.round(totalResponseTime / detections.length / 1000 / 60); // Average in minutes
  }

  private async generateSecurityRecommendations(
    detections: ThreatDetection[],
    incidents: IncidentResponse[]
  ): Promise<string[]> {
    const recommendations: string[] = [];
    
    if (detections.some(d => d.threatType === 'CREDENTIAL_STUFFING')) {
      recommendations.push('Implement stronger password policies and multi-factor authentication');
    }
    
    if (detections.some(d => d.involvesMinorData)) {
      recommendations.push('Review and strengthen minor data protection controls');
    }
    
    return recommendations;
  }
}

export default EducationalThreatDetector;