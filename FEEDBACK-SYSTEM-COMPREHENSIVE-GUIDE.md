# Comprehensive Feedback System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Psychoemotional State Calculation](#psychoemotional-state-calculation)
4. [Teacher KPI Integration](#teacher-kpi-integration)
5. [Mandatory Feedback System](#mandatory-feedback-system)
6. [Analytics & Reporting](#analytics--reporting)
7. [Module Integrations](#module-integrations)
8. [API Reference](#api-reference)
9. [LLM Development Guide](#llm-development-guide)

## System Overview

The feedback system is a comprehensive solution for collecting, analyzing, and acting upon student and teacher feedback. It serves multiple critical functions:

- **Student Emotional Monitoring**: Tracks and analyzes student psychoemotional states
- **Teacher Performance Evaluation**: Feeds into KPI calculations for teacher assessment
- **Educational Quality Assurance**: Ensures consistent feedback collection across all users
- **Data-Driven Decision Making**: Provides actionable insights for academic improvements

## Architecture

### Core Models

#### FeedbackTemplate
Defines the structure and content of feedback forms.

```typescript
interface FeedbackTemplate {
  id: number;
  name: string;           // Unique identifier: "student_satisfaction", "teacher_workload"
  role: UserRole;         // Target user role: STUDENT, TEACHER, HR, etc.
  title: string;          // Display title: "Student Satisfaction Survey"
  description?: string;   // Form description
  questions: Question[];  // Array of questions with types and validation
  isActive: boolean;      // Whether template is currently active
  frequency: FeedbackFrequency; // WEEKLY, MONTHLY, QUARTERLY, etc.
  priority: number;       // 0=optional, >0=mandatory (higher = more important)
  hasKpiQuestions: boolean; // Contains questions affecting KPI
  kpiMetrics: string[];   // Array of KPI metric types
}
```

#### Question Types & Validation

```typescript
enum QuestionType {
  RATING_1_5 = "RATING_1_5",           // 1-5 star rating
  RATING_1_10 = "RATING_1_10",         // 1-10 numeric rating
  EMOTIONAL_SCALE = "EMOTIONAL_SCALE", // 0-100 emotional scale
  TEXT = "TEXT",                       // Free text (max 5000 chars)
  YES_NO = "YES_NO",                   // Boolean response
  TEACHER_RATING = "TEACHER_RATING",   // Object with teacher IDs and ratings
  MULTIPLE_CHOICE = "MULTIPLE_CHOICE", // Array of options
  SINGLE_CHOICE = "SINGLE_CHOICE"      // Single option selection
}
```

#### FeedbackResponse
Stores user responses to feedback templates.

```typescript
interface FeedbackResponse {
  id: number;
  userId: number;
  templateId: number;
  answers: Record<string, any>; // JSON object with question responses
  isCompleted: boolean;
  submittedAt?: Date;
  period?: string;              // "2025-01", "2025-Q1" for tracking
  aboutTeacherId?: number;      // For teacher-specific feedback
}
```

#### UserFeedbackStatus
Tracks mandatory feedback completion status.

```typescript
interface UserFeedbackStatus {
  userId: number;
  hasCompletedMandatory: boolean;
  lastCompletedAt?: Date;
  currentPeriod?: string;
  nextDueDate?: Date;
}
```

## Psychoemotional State Calculation

### Core Emotional Metrics

The system tracks four primary emotional dimensions:

#### 1. Mood (Настроение)
- **Scale**: 0-100
- **Sources**: `mood_today`, `overall_satisfaction`, `настроение` questions
- **Description Mapping**:
  - 80-100: "Отличное настроение"
  - 60-79: "Хорошее настроение"
  - 40-59: "Нейтральное настроение"
  - 20-39: "Плохое настроение"
  - 0-19: "Очень плохое настроение"

#### 2. Concentration (Концентрация)
- **Scale**: 0-100
- **Sources**: `concentration_level`, `концентрация` questions
- **Description Mapping**:
  - 80-100: "Высокая концентрация"
  - 60-79: "Хорошая концентрация"
  - 40-59: "Средняя концентрация"
  - 20-39: "Низкая концентрация"
  - 0-19: "Очень низкая концентрация"

#### 3. Socialization (Социализация)
- **Scale**: 0-100
- **Sources**: `social`, `общение`, `socialization_level` questions
- **Description Mapping**:
  - 80-100: "Высокая социализация"
  - 60-79: "Хорошая социализация"
  - 40-59: "Средняя социализация"
  - 20-39: "Низкая социализация"
  - 0-19: "Очень низкая социализация"

#### 4. Motivation (Мотивация)
- **Scale**: 0-100
- **Sources**: `motivation`, `мотивация`, `motivation_level` questions
- **Description Mapping**:
  - 80-100: "Высокая мотивация"
  - 60-79: "Хорошая мотивация"
  - 40-59: "Средняя мотивация"
  - 20-39: "Низкая мотивация"
  - 0-19: "Очень низкая мотивация"

### Data Normalization

The system automatically normalizes responses to a 0-100 scale:

```typescript
function normalizeToScale(value: any, targetScale: number): number {
  if (typeof value === 'number') {
    if (value <= 5) {
      // Scale 1-5 to 0-100
      return Math.round(((value - 1) / 4) * targetScale);
    } else if (value <= 10) {
      // Scale 1-10 to 0-100
      return Math.round(((value - 1) / 9) * targetScale);
    } else {
      // Already on 0-100 scale
      return Math.min(Math.max(value, 0), targetScale);
    }
  }
  if (typeof value === 'boolean') {
    return value ? targetScale : 0;
  }
  return 50; // Neutral default
}
```

### Trend Calculation

Trends are calculated by comparing recent vs. historical data:

```typescript
function calculateTrend(previousValue: number, currentValue: number): 'up' | 'down' | 'neutral' {
  const diff = currentValue - previousValue;
  if (diff > 5) return 'up';
  if (diff < -5) return 'down';
  return 'neutral';
}
```

### EmotionalState Model Integration

When feedback is submitted, the system automatically updates the student's emotional state:

```typescript
interface EmotionalState {
  studentId: number;
  mood: number;                    // 0-100
  moodDesc: string;               // Text description
  moodTrend: 'up' | 'down' | 'neutral';
  concentration: number;           // 0-100
  concentrationDesc: string;
  concentrationTrend: 'up' | 'down' | 'neutral';
  socialization: number;           // 0-100
  socializationDesc: string;
  socializationTrend: 'up' | 'down' | 'neutral';
  motivation: number;              // 0-100
  motivationDesc: string;
  motivationTrend: 'up' | 'down' | 'neutral';
  updatedAt: Date;
}
```

### Automated Recommendations

The system generates recommendations based on emotional metrics:

```typescript
interface EmotionalRecommendation {
  type: 'mood' | 'concentration' | 'motivation' | 'socialization';
  priority: 'high' | 'medium' | 'low';
  message: string;
}

// Example recommendations:
// Mood < 40: "Низкое настроение требует внимания. Рекомендуется консультация с психологом."
// Concentration < 30: "Проблемы с концентрацией. Рассмотрите возможность изменения учебной нагрузки."
// Motivation < 40: "Снижение мотивации. Рекомендуется беседа с куратором."
// Socialization < 30: "Проблемы с социализацией. Рекомендуется участие в групповых активностях."
```

## Teacher KPI Integration

### Teacher Rating Questions

The system supports special `TEACHER_RATING` question types that directly impact teacher KPIs:

```typescript
// Example teacher rating question
{
  id: "teacher_effectiveness",
  question: "Оцените эффективность преподавания по каждому предмету",
  type: "TEACHER_RATING",
  category: "teaching_quality"
}

// Student response format
{
  "teacher_effectiveness": {
    "123": 4,  // Teacher ID 123 gets rating 4/5
    "456": 5,  // Teacher ID 456 gets rating 5/5
    "789": 3   // Teacher ID 789 gets rating 3/5
  }
}
```

### KPI Metrics Influenced by Feedback

#### 1. Student Satisfaction (25% of total KPI)
- **Source**: Direct student ratings of teachers
- **Calculation**: Average of all student ratings for the teacher
- **Target**: ≥4.0/5.0
- **Weight**: High impact on overall KPI

#### 2. Teaching Quality Assessment
- **Source**: Student feedback on lesson effectiveness, material clarity
- **Metrics**: Understanding, engagement, pace, difficulty level
- **Integration**: Feeds into KPI calculation algorithms

#### 3. Student Retention Indicator
- **Source**: Student satisfaction and motivation levels
- **Correlation**: High satisfaction → lower dropout risk
- **KPI Impact**: Teachers with higher student satisfaction get bonus points

#### 4. Emotional Climate Management
- **Source**: Student emotional state trends in teacher's classes
- **Measurement**: Improvement in mood, motivation, concentration
- **KPI Bonus**: Teachers who improve student emotional states get additional points

### Loyalty System Integration

Teacher ratings automatically create entries in the loyalty system:

```typescript
// When student submits teacher rating
if (answers.teacher_rating) {
  await createLoyaltyReview(userId, {
    teacherId: answers.teacher_id,
    rating: answers.teacher_rating,
    comment: answers.teacher_comment || 'Отзыв из обязательной формы',
    isModerated: true,
    isPublished: true
  });
}
```

## Mandatory Feedback System

### Priority-Based System

Templates with `priority > 0` are considered mandatory:
- **Priority 1-3**: Low priority mandatory
- **Priority 4-6**: Medium priority mandatory  
- **Priority 7-10**: High priority mandatory

### Completion Tracking

The system tracks completion through `UserFeedbackStatus`:

```typescript
async function checkMandatoryFeedback(userId: number) {
  // Get mandatory templates for user's role
  const mandatoryTemplates = await getMandatoryTemplatesForRole(user.role);
  
  // Check completed responses for current period
  const completedResponses = await getCompletedResponses(userId, currentPeriod);
  
  // Calculate pending templates
  const pendingTemplates = mandatoryTemplates.filter(
    template => !completedResponses.some(response => 
      response.templateId === template.id
    )
  );
  
  return {
    hasCompletedMandatory: pendingTemplates.length === 0,
    pendingTemplates,
    currentPeriod
  };
}
```

### Frequency Management

Different roles have different mandatory frequencies:

- **STUDENT**: Monthly feedback on courses and teachers
- **TEACHER**: Quarterly self-assessment and workload reporting
- **PARENT**: Semester satisfaction surveys
- **ADMIN/HR**: Yearly system evaluation

### Automatic Reminders

The system calculates `nextDueDate` based on role and frequency:

```typescript
function getNextDueDate(role: string): Date {
  const now = new Date();
  switch (role) {
    case 'STUDENT':
      return new Date(now.getFullYear(), now.getMonth() + 1, 1); // Monthly
    case 'TEACHER':
      return new Date(now.getFullYear(), now.getMonth() + 3, 1); // Quarterly
    default:
      return new Date(now.getFullYear(), now.getMonth() + 6, 1); // Semi-annually
  }
}
```

## Analytics & Reporting

### Completion Rate Calculation

```typescript
async function calculateCompletionRate(period?: string): Promise<number> {
  // Get all mandatory templates
  const mandatoryTemplates = await getMandatoryTemplates();
  
  // Get users who should complete forms
  const eligibleUsers = await getUsersWithMandatoryForms();
  
  // Get users who completed forms
  const completedUsers = await getUsersWhoCompleted(period);
  
  return (completedUsers.length / eligibleUsers.length) * 100;
}
```

### Anonymized Data Export

For privacy-compliant analytics:

```typescript
interface AnonymizedResponse {
  anonymousId: string;        // "Респондент 1", "Респондент 2"
  role: UserRole;
  template: string;
  answers: Record<string, any>;
  period: string;
  submittedAt: Date;
}

// Stable anonymization using user ID mapping
const userIdToAnonymousId = new Map<number, number>();
allUserIds.forEach((userId, index) => {
  userIdToAnonymousId.set(userId, index + 1);
});
```

### Trend Analysis

The system provides temporal analysis of emotional states:

```typescript
interface EmotionalTrend {
  date: Date;
  mood: number;
  concentration: number;
  socialization: number;
  motivation: number;
}

// Calculate trends over time
function calculateEmotionalTrends(responses: FeedbackResponse[]): EmotionalTrend[] {
  return responses.map(response => ({
    date: response.submittedAt,
    mood: extractMoodFromAnswers(response.answers),
    concentration: extractConcentrationFromAnswers(response.answers),
    socialization: extractSocializationFromAnswers(response.answers),
    motivation: extractMotivationFromAnswers(response.answers)
  }));
}
```

## Module Integrations

### 1. Loyalty System Integration

```typescript
// Automatic review creation from teacher ratings
async function createLoyaltyReview(userId: number, answers: any) {
  const student = await getStudent(userId);
  
  if (student && answers.teacher_id && answers.teacher_rating) {
    await createStudentReview({
      studentId: student.id,
      teacherId: answers.teacher_id,
      groupId: student.groupId,
      rating: answers.teacher_rating,
      comment: answers.teacher_comment || 'Отзыв из обязательной формы',
      isModerated: true,
      isPublished: true
    });
  }
}
```

### 2. KPI System Integration

```typescript
// Update teacher KPI metrics based on feedback
async function updateKPIMetrics(response: FeedbackResponse) {
  if (response.template.hasKpiQuestions) {
    const kpiUpdates = extractKPIMetrics(response.answers);
    
    // Update teacher satisfaction metrics
    if (kpiUpdates.teacherSatisfaction) {
      await updateTeacherSatisfactionKPI(
        response.aboutTeacherId,
        kpiUpdates.teacherSatisfaction
      );
    }
    
    // Update teaching quality metrics
    if (kpiUpdates.teachingQuality) {
      await updateTeachingQualityKPI(
        response.aboutTeacherId,
        kpiUpdates.teachingQuality
      );
    }
  }
}
```

### 3. Notification System Integration

```typescript
// Send reminders for mandatory feedback
async function sendMandatoryFeedbackReminders() {
  const usersWithPendingFeedback = await getUsersWithPendingMandatoryFeedback();
  
  for (const user of usersWithPendingFeedback) {
    await createNotification({
      userId: user.id,
      type: 'MANDATORY_FEEDBACK_REMINDER',
      message: `У вас есть незаполненные обязательные формы обратной связи`,
      url: '/feedback/mandatory'
    });
  }
}
```

### 4. Dashboard Widgets

```typescript
// Emotional state widget for student dashboard
interface EmotionalStateWidget {
  type: 'emotional_state';
  data: {
    mood: { value: number; trend: string; description: string };
    concentration: { value: number; trend: string; description: string };
    socialization: { value: number; trend: string; description: string };
    motivation: { value: number; trend: string; description: string };
    lastUpdated: Date;
    recommendations: EmotionalRecommendation[];
  };
}

// Teacher feedback summary widget
interface TeacherFeedbackWidget {
  type: 'teacher_feedback';
  data: {
    averageRating: number;
    totalResponses: number;
    recentTrend: 'improving' | 'declining' | 'stable';
    topStrengths: string[];
    areasForImprovement: string[];
  };
}
```

## API Reference

### Templates Management

```typescript
// Create feedback template
POST /feedback/templates
Body: CreateFeedbackTemplateDto
Roles: ADMIN, HR

// Get templates for current user
GET /feedback/templates/my
Response: FeedbackTemplate[]

// Get all active templates
GET /feedback/templates
Roles: ADMIN, HR
Response: FeedbackTemplate[]

// Update template
PUT /feedback/templates/:id
Body: UpdateFeedbackTemplateDto
Roles: ADMIN, HR

// Delete template
DELETE /feedback/templates/:id
Roles: ADMIN, HR

// Toggle template active status
PUT /feedback/templates/:id/toggle-active
Roles: ADMIN, HR
```

### Response Management

```typescript
// Submit feedback response
POST /feedback/responses
Body: CreateFeedbackResponseDto
Response: FeedbackResponse

// Check mandatory feedback status
GET /feedback/mandatory-check
Response: {
  hasCompletedMandatory: boolean;
  pendingTemplates: FeedbackTemplate[];
  currentPeriod: string;
}

// Get anonymized responses
GET /feedback/responses?templateId&period&page&limit
Roles: ADMIN, HR
Response: {
  data: AnonymizedResponse[];
  pagination: PaginationInfo;
}
```

### Analytics Endpoints

```typescript
// Get feedback statistics
GET /feedback/statistics?period
Roles: ADMIN, HR
Response: {
  totalResponses: number;
  responsesByRole: Record<string, number>;
  completionRate: number;
  period: string;
}

// Get detailed analytics
GET /feedback/analytics?templateId&period
Roles: ADMIN, HR
Response: {
  totalResponses: number;
  completionRate: number;
  byRole: Record<string, number>;
  averageRatings: Record<string, number>;
  trends: TrendData[];
}
```

### Student Emotional State

```typescript
// Get student emotional state from feedbacks
GET /feedback/students/:studentId/emotional-state
Roles: ADMIN, HR, TEACHER
Response: {
  studentId: number;
  currentState: EmotionalMetrics;
  trends: EmotionalTrend[];
  recommendations: EmotionalRecommendation[];
  teacherRatings: TeacherRating[];
}

// Get emotional history
GET /feedback/students/:studentId/emotional-history?period
Roles: ADMIN, HR, TEACHER
Response: {
  studentId: number;
  history: EmotionalHistoryEntry[];
  period?: string;
}
```

## LLM Development Guide

### For Creating New Modules

When developing modules that interact with the feedback system:

#### 1. Check Emotional State

```typescript
// Before making academic decisions, check student emotional state
const emotionalState = await feedbackService.getStudentEmotionalStateFromFeedbacks(studentId);

if (emotionalState.currentState?.mood.value < 40) {
  // Student has low mood - consider lighter workload
  console.warn(`Student ${studentId} has low mood: ${emotionalState.currentState.mood.description}`);
}

if (emotionalState.currentState?.concentration.value < 30) {
  // Student has concentration issues - avoid complex tasks
  console.warn(`Student ${studentId} has concentration issues`);
}
```

#### 2. Integrate with KPI System

```typescript
// When creating teacher assessment modules
async function calculateTeacherPerformance(teacherId: number) {
  // Get teacher feedback ratings
  const feedbackData = await feedbackService.getTeacherFeedbackSummary(teacherId);
  
  // Factor into KPI calculations
  const satisfactionScore = feedbackData.averageRating / 5 * 100; // Convert to 0-100
  
  // Use in KPI calculations
  return {
    teachingQuality: satisfactionScore,
    studentSatisfaction: feedbackData.satisfactionMetrics,
    emotionalImpact: feedbackData.emotionalImpactOnStudents
  };
}
```

#### 3. Create Custom Templates

```typescript
// Example: Creating a course evaluation template
const courseEvaluationTemplate = {
  name: "course_evaluation",
  role: "STUDENT",
  title: "Оценка курса",
  questions: [
    {
      id: "course_difficulty",
      question: "Насколько сложным был курс?",
      type: "RATING_1_5",
      category: "difficulty",
      required: true
    },
    {
      id: "instructor_effectiveness",
      question: "Оцените эффективность преподавателя",
      type: "RATING_1_5", 
      category: "teaching_quality",
      required: true
    },
    {
      id: "emotional_impact",
      question: "Как курс повлиял на ваше настроение?",
      type: "EMOTIONAL_SCALE",
      category: "emotional",
      required: false
    }
  ],
  frequency: "SEMESTER",
  priority: 3, // Mandatory
  hasKpiQuestions: true,
  kpiMetrics: ["TEACHING_QUALITY", "STUDENT_SATISFACTION"]
};
```

#### 4. Process Feedback Data

```typescript
// Example: Processing feedback for custom analytics
async function analyzeCourseFeedback(courseId: number) {
  const responses = await feedbackService.getTemplateResponses(courseTemplateId);
  
  const analytics = {
    averageDifficulty: 0,
    teacherEffectiveness: 0,
    emotionalImpact: 0,
    studentCount: responses.length
  };
  
  for (const response of responses) {
    analytics.averageDifficulty += response.answers.course_difficulty || 0;
    analytics.teacherEffectiveness += response.answers.instructor_effectiveness || 0;
    analytics.emotionalImpact += response.answers.emotional_impact || 50;
  }
  
  // Calculate averages
  analytics.averageDifficulty /= responses.length;
  analytics.teacherEffectiveness /= responses.length;
  analytics.emotionalImpact /= responses.length;
  
  return analytics;
}
```

#### 5. Monitor Emotional Trends

```typescript
// Example: Early warning system for student emotional health
async function monitorStudentWellbeing() {
  const studentsAtRisk = await db.emotionalState.findMany({
    where: {
      OR: [
        { mood: { lt: 30 } },
        { concentration: { lt: 25 } },
        { motivation: { lt: 25 } }
      ]
    },
    include: { student: { include: { user: true } } }
  });
  
  for (const state of studentsAtRisk) {
    // Create alert for counselors
    await createNotification({
      type: 'STUDENT_WELLBEING_ALERT',
      message: `Student ${state.student.user.name} shows concerning emotional indicators`,
      targetRole: 'COUNSELOR'
    });
  }
}
```

### Best Practices for LLM Integration

1. **Always normalize emotional data** to 0-100 scale for consistency
2. **Check for null/undefined values** in emotional states before using
3. **Respect privacy** - use anonymized data for analytics
4. **Consider temporal context** - emotional states change over time
5. **Integrate with existing KPI metrics** rather than creating separate systems
6. **Use trend analysis** for better insights than point-in-time data
7. **Generate actionable recommendations** based on emotional data
8. **Validate feedback responses** before processing to ensure data quality

### Common Use Cases

1. **Academic Intervention**: Use emotional data to identify students needing support
2. **Teacher Development**: Use feedback to improve teaching methods
3. **Curriculum Optimization**: Adjust course difficulty based on student feedback
4. **Wellness Programs**: Target interventions based on emotional trends
5. **Quality Assurance**: Monitor satisfaction trends across different teachers/courses
6. **Predictive Analytics**: Use emotional patterns to predict academic outcomes

This comprehensive system enables data-driven educational improvements while maintaining student privacy and providing actionable insights for all stakeholders.
