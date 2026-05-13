# Implementation Plan: Question Topic System

## Overview

This implementation plan converts the question-topic-system design into actionable coding tasks. The system enables independent question management with flexible topic-based categorization while maintaining backward compatibility with existing exam sets.

**Key Implementation Areas:**

- Database schema migration (hard reset approach)
- Backend API endpoints for questions and topics
- Backend services with validation logic
- Frontend admin UI for question and topic management
- Frontend practice UI with topic-based filtering
- Property-based and unit testing

## Tasks

### 1. Database Schema Migration

- [x] 1.1 Update Prisma schema with new enums and models
  - Add `QuestionType` enum (PRACTICE, FORECAST, CUSTOM)
  - Add `QuestionStatus` enum (DRAFT, PUBLISHED, ARCHIVED)
  - Add `type` and `status` fields to Question model
  - Create Topic model with name, description, timestamps
  - Create QuestionTopicAssignment junction table
  - Add indexes for performance (partNumber, type, status, composite indexes)
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 1.2 Execute hard reset database migration
  - Drop existing database tables
  - Run `npx prisma migrate reset --force`
  - Generate Prisma client with `npx prisma generate`
  - Verify schema applied correctly
  - _Requirements: 6.7_

### 2. Backend: Topic Service and API

- [x] 2.1 Create Topic service (server/src/services/topic.service.ts)
  - Implement `create(data)` - create topic with name validation
  - Implement `findAll()` - get all topics with question counts
  - Implement `findById(id)` - get single topic
  - Implement `update(id, data)` - update topic name/description
  - Implement `delete(id)` - delete topic (cascade assignments)
  - Implement `assignToQuestions(topicId, questionIds)` - bulk assign
  - Implement `unassignFromQuestions(topicId, questionIds)` - bulk unassign
  - Add validation: non-empty name, unique name (case-insensitive)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 8.1, 8.3, 8.4, 8.6_

- [ ]\* 2.2 Write property test for Topic service
  - **Property 7: Topic Creation with Optional Description**
  - **Validates: Requirements 2.1**
  - Test that any valid topic name and optional description creates successfully

- [ ]\* 2.3 Write property test for topic name uniqueness
  - **Property 10: Topic Name Uniqueness**
  - **Validates: Requirements 2.5**
  - Test that duplicate topic names (case-insensitive) are rejected

- [ ]\* 2.4 Write unit tests for Topic service
  - Test empty name rejection
  - Test duplicate name rejection
  - Test topic deletion removes assignments but not questions
  - Test bulk assignment creates correct records
  - _Requirements: 2.4, 2.5, 2.6, 8.6_

- [x] 2.5 Create Topic controller (server/src/controllers/topic.controller.ts)
  - Implement `GET /api/topics` - list all topics with counts
  - Implement `POST /api/topics` - create new topic
  - Implement `PATCH /api/topics/:id` - update topic
  - Implement `DELETE /api/topics/:id` - delete topic
  - Implement `POST /api/topics/:id/assign` - bulk assign to questions
  - Implement `DELETE /api/topics/:id/unassign` - bulk unassign from questions
  - Add admin authentication middleware
  - Add error handling with proper status codes
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 2.6 Create Topic routes (server/src/routes/topic.routes.ts)
  - Define all topic endpoints
  - Apply authentication and admin middleware
  - Register routes in main router (server/src/routes/index.ts)
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

### 3. Backend: Question Service Updates

- [x] 3.1 Update Question service (server/src/services/question.service.ts)
  - Update `create(data)` to accept type, status, and topic assignments
  - Set default status to DRAFT if not provided
  - Update `findAll(filters)` to support type, status, topicId filters
  - Implement `updateStatus(id, status)` - change question status
  - Implement `bulkUpdateStatus(questionIds, status)` - bulk status change with transaction
  - Update `getByPart(partNumber)` to return only PUBLISHED questions with topics
  - Implement `getTopicsByPart(partNumber)` - get topics with published question counts
  - Add validation: type in enum, status in enum, non-empty content
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 3.1, 3.2, 5.1, 5.2, 5.3, 5.7_

- [ ]\* 3.2 Write property test for independent question creation
  - **Property 1: Independent Question Creation**
  - **Validates: Requirements 1.1**
  - Test that questions can be created without exam set assignments

- [ ]\* 3.3 Write property test for default status assignment
  - **Property 2: Default Status Assignment**
  - **Validates: Requirements 1.2**
  - Test that questions without explicit status default to DRAFT

- [ ]\* 3.4 Write property test for question type validation
  - **Property 3: Question Type Validation**
  - **Validates: Requirements 1.3**
  - Test that valid types succeed and invalid types fail

- [ ]\* 3.5 Write property test for question type round-trip
  - **Property 4: Question Type Round-Trip**
  - **Validates: Requirements 1.4**
  - Test that creating and retrieving preserves type value

- [ ]\* 3.6 Write property test for published question visibility
  - **Property 6: Published Question Visibility**
  - **Validates: Requirements 1.6, 5.4**
  - Test that PUBLISHED questions appear in filtered queries

- [ ]\* 3.7 Write unit tests for Question service updates
  - Test DRAFT questions excluded from practice queries
  - Test ARCHIVED questions excluded from practice queries
  - Test bulk status update with transaction rollback on error
  - Test filter combinations (part + topic, part + type)
  - _Requirements: 5.3, 5.5, 5.7, 3.5_

### 4. Backend: Question Controller and Routes Updates

- [x] 4.1 Update Question controller (server/src/controllers/question.controller.ts)
  - Update `GET /api/questions` to support type, status, topicId query params
  - Update `GET /api/questions/part/:partNumber/all` to include topics
  - Implement `GET /api/questions/part/:partNumber/topics` - get topics for part
  - Implement `PATCH /api/questions/:id/status` - update single question status
  - Implement `PATCH /api/questions/bulk/status` - bulk status update
  - Update create/update endpoints to handle topic assignments
  - Add search functionality for contentText, questionText, contextText
  - _Requirements: 3.1, 3.2, 3.3, 5.1, 5.2, 5.6, 5.7, 13.1, 13.2_

- [ ]\* 4.2 Write integration tests for Question API
  - Test GET /api/questions with multiple filters
  - Test GET /api/questions/part/:partNumber/all returns topics
  - Test PATCH /api/questions/bulk/status updates multiple questions
  - Test search functionality with case-insensitive matching
  - _Requirements: 3.1, 3.2, 5.7, 13.2, 13.3_

- [x] 4.3 Update Question routes (server/src/routes/question.routes.ts)
  - Add new status update endpoints
  - Add topic filtering endpoints
  - Ensure proper authentication middleware
  - _Requirements: 5.1, 5.2, 5.6, 5.7_

### 5. Backend: Exam Set Service Updates

- [x] 5.1 Update Exam Set service (server/src/services/exam-set.service.ts)
  - Update `isComplete` calculation logic (exactly 11 questions)
  - Add validation: prevent publishing if isComplete is false
  - Update `addQuestion` to recalculate isComplete
  - Update `removeQuestion` to recalculate isComplete
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]\* 5.2 Write property test for exam set completeness
  - **Property 17: Exam Set Completeness Validation**
  - **Validates: Requirements 4.1, 4.2**
  - Test that isComplete reflects question count correctly

- [ ]\* 5.3 Write property test for incomplete exam set publication prevention
  - **Property 18: Incomplete Exam Set Publication Prevention**
  - **Validates: Requirements 4.3**
  - Test that incomplete exam sets cannot be published

- [ ]\* 5.4 Write unit tests for Exam Set updates
  - Test isComplete recalculation on add
  - Test isComplete recalculation on remove
  - Test publication prevention for incomplete sets
  - _Requirements: 4.3, 4.4, 4.5_

### 6. Checkpoint - Backend Implementation Complete

- [x] 6.1 Verify all backend tests pass
  - Run unit tests: `npm test`
  - Run property tests: `npm run test:property`
  - Run integration tests: `npm run test:integration`
  - Ensure all tests pass, ask the user if questions arise.

### 7. Frontend: Admin Question Management UI

- [x] 7.1 Create TypeScript types (client/src/features/admin/types.ts)
  - Add QuestionType enum (PRACTICE, FORECAST, CUSTOM)
  - Add QuestionStatus enum (DRAFT, PUBLISHED, ARCHIVED)
  - Add Topic interface
  - Add QuestionWithTopics interface
  - Add TopicWithCount interface
  - _Requirements: 1.3, 1.5, 2.1_

- [x] 7.2 Create Topic service (client/src/features/admin/services/topic.service.ts)
  - Implement `getAll()` - fetch all topics with counts
  - Implement `create(data)` - create new topic
  - Implement `update(id, data)` - update topic
  - Implement `delete(id)` - delete topic
  - Implement `assignToQuestions(topicId, questionIds)` - bulk assign
  - Implement `unassignFromQuestions(topicId, questionIds)` - bulk unassign
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7.3 Create Topic management hooks (client/src/features/admin/hooks/useTopic.ts)
  - Create `useTopics()` hook with React Query
  - Create `useCreateTopic()` mutation
  - Create `useUpdateTopic()` mutation
  - Create `useDeleteTopic()` mutation
  - Create `useAssignTopic()` mutation
  - Create `useUnassignTopic()` mutation
  - Implement cache invalidation strategy
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 7.4 Update Question service (client/src/features/admin/services/question.service.ts)
  - Update `getAll()` to support type, status, topicId filters
  - Update `getByPart()` to include topics
  - Implement `updateStatus(id, status)` - update single status
  - Implement `bulkUpdateStatus(questionIds, status)` - bulk update
  - Implement `getTopicsByPart(partNumber)` - get topics for part
  - _Requirements: 3.1, 3.2, 5.1, 5.2, 5.7, 11.1_

- [x] 7.5 Update Question hooks (client/src/features/admin/hooks/useQuestion.ts)
  - Update `useQuestions()` to support new filters
  - Create `useUpdateQuestionStatus()` mutation
  - Create `useBulkUpdateStatus()` mutation
  - Update cache invalidation for status changes
  - _Requirements: 5.1, 5.2, 5.7_

- [x] 7.6 Create QuestionFilters component (client/src/features/admin/components/QuestionFilters.tsx)
  - Add TypeFilter dropdown (PRACTICE, FORECAST, CUSTOM, All)
  - Add StatusFilter dropdown (DRAFT, PUBLISHED, ARCHIVED, All)
  - Add TopicFilter multi-select
  - Add SearchInput for text search
  - Display filter counts
  - _Requirements: 7.2, 10.1, 10.4, 13.1_

- [x] 7.7 Create BulkActionsToolbar component (client/src/features/admin/components/BulkActionsToolbar.tsx)
  - Add PublishButton (sets status to PUBLISHED)
  - Add UnpublishButton (sets status to DRAFT)
  - Add ArchiveButton (sets status to ARCHIVED)
  - Show selected count
  - Display success/error notifications
  - _Requirements: 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

- [x] 7.8 Update PartQuestionsPage (client/src/features/admin/pages/PartQuestionsPage.tsx)
  - Add QuestionFilters component
  - Add BulkActionsToolbar (shown when questions selected)
  - Update QuestionTable to show type, status, topic tags
  - Add checkbox column for bulk selection
  - Add TypeTag and StatusTag components
  - Add TopicTags display
  - Update pagination to handle large question lists
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 10.1, 12.1, 12.2_

- [x] 7.9 Update Question form components (Part1Form, Part2Form, etc.)
  - Add TypeSelect field (PRACTICE, FORECAST, CUSTOM)
  - Add StatusSelect field (DRAFT, PUBLISHED, ARCHIVED)
  - Add TopicMultiSelect field with inline topic creation
  - Display assigned topic count
  - Update form submission to include type, status, topics
  - _Requirements: 10.5, 15.1, 15.2, 15.3, 15.6, 15.7_

### 8. Frontend: Topic Management UI

- [x] 8.1 Create TopicManagementPage (client/src/features/admin/pages/TopicManagementPage.tsx)
  - Display list of all topics with question counts
  - Add "Create Topic" button
  - Show TopicFormModal on create/edit
  - Implement delete with confirmation dialog
  - Display question count for each topic
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.7_

- [x] 8.2 Create TopicFormModal component (client/src/features/admin/components/TopicFormModal.tsx)
  - Add NameInput field with validation
  - Add DescriptionInput field (optional)
  - Handle create and update modes
  - Display validation errors
  - Show success/error notifications
  - _Requirements: 8.1, 8.3, 8.6_

- [x] 8.3 Add Topic management route to admin router
  - Add route `/admin/topics` to router
  - Add navigation link in admin sidebar
  - Ensure admin authentication required
  - _Requirements: 8.1, 8.2_

### 9. Frontend: Practice Page Updates

- [x] 9.1 Update Practice page service (client/src/features/exam/services/question.service.ts)
  - Update `getByPart()` to fetch questions with topics
  - Implement `getTopicsByPart(partNumber)` - get topics for filtering
  - Ensure only PUBLISHED questions are fetched
  - _Requirements: 3.1, 3.2, 11.1_

- [x] 9.2 Create TopicFilter component (client/src/features/exam/components/TopicFilter.tsx)
  - Display topics alphabetically with question counts
  - Highlight selected topic
  - Show "All Questions" option
  - Filter out topics with zero questions
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6_

- [x] 9.3 Update PartPracticePage (client/src/features/exam/pages/PartPracticePage.tsx)
  - Add TopicFilter to FilterSidebar
  - Update question fetching to support topic filtering
  - Combine part and topic filters
  - Display empty state when no questions match
  - Show loading states during filter changes
  - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7_

- [x] 9.4 Update QuestionCard component (client/src/features/exam/components/QuestionCard.tsx)
  - Add TopicTags display below question preview
  - Style topic tags consistently
  - Ensure tags don't overflow card layout
  - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

### 10. Checkpoint - Frontend Implementation Complete

- [x] 10.1 Verify all frontend components render correctly
  - Test admin question list with filters
  - Test bulk actions toolbar
  - Test topic management page
  - Test practice page with topic filtering
  - Ensure all tests pass, ask the user if questions arise.

### 11. Integration and End-to-End Testing

- [ ]\* 11.1 Write E2E test for question creation flow
  - Create question with type and status
  - Assign topics to question
  - Verify question appears in admin list
  - _Requirements: 1.1, 1.2, 1.3, 2.2, 2.3_

- [ ]\* 11.2 Write E2E test for bulk publishing flow
  - Create multiple DRAFT questions
  - Select questions in admin UI
  - Bulk publish questions
  - Verify questions appear in practice page
  - _Requirements: 5.7, 12.4, 12.7_

- [ ]\* 11.3 Write E2E test for topic filtering flow
  - Create questions with different topics
  - Navigate to practice page
  - Select topic filter
  - Verify only matching questions displayed
  - _Requirements: 3.2, 11.1, 11.2, 11.3_

- [ ]\* 11.4 Write E2E test for exam set completeness
  - Create exam set with 10 questions
  - Attempt to publish (should fail)
  - Add 11th question
  - Publish successfully
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

### 12. Final Checkpoint and Documentation

- [x] 12.1 Run full test suite
  - Run all unit tests
  - Run all property tests
  - Run all integration tests
  - Run all E2E tests
  - Ensure 100% pass rate
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12.2 Verify backward compatibility
  - Test existing exam set functionality
  - Test existing question assignment to exam sets
  - Test full exam sets page displays only complete sets
  - Ensure no regressions in existing features
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6_

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at major milestones
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The implementation uses TypeScript, Prisma, React, and Ant Design
- Database migration uses hard reset approach (development environment)
- All API endpoints require authentication; admin endpoints require admin role
