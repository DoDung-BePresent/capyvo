# Requirements Document

## Introduction

This document specifies requirements for redesigning the question and practice system to support independent questions, flexible categorization by topics, and multiple question types. The current system requires questions to belong to exam sets to be visible in practice mode, which prevents publishing individual FORECAST or PRACTICE questions that don't form complete exam sets. This redesign enables questions to exist independently while maintaining backward compatibility with the existing exam set system.

## Glossary

- **Question**: A single TOEIC Speaking test item for Parts 1-5
- **Question_Type**: Classification of questions as PRACTICE, FORECAST, or CUSTOM
- **Question_Status**: Publication state of a question (DRAFT, PUBLISHED, ARCHIVED)
- **Topic**: A category or tag for grouping related questions (e.g., "Grammar", "Forecast May 2026")
- **Exam_Set**: A collection of exactly 11 questions forming a complete practice test
- **Practice_Page**: User interface where learners access questions for practice
- **Admin_UI**: Administrative interface for managing questions, topics, and exam sets
- **Question_Assignment**: The relationship linking a question to an exam set
- **Topic_Assignment**: The relationship linking a question to a topic

## Requirements

### Requirement 1: Independent Question Management

**User Story:** As an admin, I want to create and publish individual questions without requiring them to be part of an exam set, so that I can make FORECAST and PRACTICE questions available immediately.

#### Acceptance Criteria

1. THE Question_Management_System SHALL allow creating questions without assigning them to an Exam_Set
2. WHEN a question is created, THE Question_Management_System SHALL set its status to DRAFT by default
3. THE Question_Management_System SHALL support three question types: PRACTICE, FORECAST, and CUSTOM
4. WHEN a question type is set, THE Question_Management_System SHALL store the type value in the database
5. THE Question_Management_System SHALL allow changing question status between DRAFT, PUBLISHED, and ARCHIVED
6. WHEN a question status is changed to PUBLISHED, THE Question_Management_System SHALL make the question visible in the Practice_Page within 1 second

### Requirement 2: Topic-Based Question Organization

**User Story:** As an admin, I want to organize questions by topics, so that users can filter and practice questions by specific categories.

#### Acceptance Criteria

1. THE Topic_Management_System SHALL allow creating topics with a name and optional description
2. THE Topic_Management_System SHALL allow assigning multiple topics to a single question
3. THE Topic_Management_System SHALL allow assigning a single topic to multiple questions
4. WHEN a topic is deleted, THE Topic_Management_System SHALL remove all topic assignments without deleting the questions
5. THE Topic_Management_System SHALL prevent creating duplicate topic names
6. THE Topic_Management_System SHALL support bulk assignment of topics to multiple questions

### Requirement 3: Flexible Practice Page Filtering

**User Story:** As a user, I want to practice questions filtered by part, topic, or exam set, so that I can focus on specific areas I need to improve.

#### Acceptance Criteria

1. WHEN a user selects a part number, THE Practice_Page SHALL display all PUBLISHED questions for that part
2. WHEN a user selects a topic filter, THE Practice_Page SHALL display only PUBLISHED questions assigned to that topic
3. WHEN a user selects an exam set filter, THE Practice_Page SHALL display only PUBLISHED questions assigned to that exam set
4. THE Practice_Page SHALL display the count of available questions for each filter option
5. THE Practice_Page SHALL allow combining part and topic filters
6. WHEN no questions match the selected filters, THE Practice_Page SHALL display an empty state message
7. THE Practice_Page SHALL display questions within 500ms of filter selection

### Requirement 4: Exam Set Completeness Validation

**User Story:** As an admin, I want exam sets to require exactly 11 questions before publication, so that users only see complete practice tests in the full exam sets section.

#### Acceptance Criteria

1. WHEN an exam set has fewer than 11 questions, THE Exam_Set_Validator SHALL set the isComplete flag to false
2. WHEN an exam set has exactly 11 questions, THE Exam_Set_Validator SHALL set the isComplete flag to true
3. IF an admin attempts to publish an exam set with isComplete equal to false, THEN THE Exam_Set_Validator SHALL prevent publication and return an error message
4. WHEN a question is added to an exam set, THE Exam_Set_Validator SHALL recalculate the isComplete flag within 100ms
5. WHEN a question is removed from an exam set, THE Exam_Set_Validator SHALL recalculate the isComplete flag within 100ms
6. THE Full_Exam_Sets_Page SHALL display only exam sets where isComplete equals true and isPublished equals true

### Requirement 5: Question Status Management

**User Story:** As an admin, I want to control question visibility through status management, so that I can prepare questions in draft mode before making them public.

#### Acceptance Criteria

1. THE Admin_UI SHALL display the current status for each question
2. THE Admin_UI SHALL allow changing question status through a dropdown or button interface
3. WHEN a question status is DRAFT, THE Practice_Page SHALL exclude the question from all user-facing views
4. WHEN a question status is PUBLISHED, THE Practice_Page SHALL include the question in filtered results
5. WHEN a question status is ARCHIVED, THE Practice_Page SHALL exclude the question from all user-facing views
6. THE Admin_UI SHALL support bulk status changes for multiple selected questions
7. WHEN bulk status change is applied, THE Question_Management_System SHALL update all selected questions within 2 seconds

### Requirement 6: Database Schema Migration

**User Story:** As a developer, I want the database schema to support independent questions and topic assignments, so that the system can store and query the new data structures.

#### Acceptance Criteria

1. THE Database_Schema SHALL include a type field in the Question table with values PRACTICE, FORECAST, or CUSTOM
2. THE Database_Schema SHALL include a status field in the Question table with values DRAFT, PUBLISHED, or ARCHIVED
3. THE Database_Schema SHALL include a tags array field in the Question table for storing topic identifiers
4. THE Database_Schema SHALL include a Topic table with id, name, description, and timestamp fields
5. THE Database_Schema SHALL include a QuestionTopicAssignment table linking Question and Topic with a many-to-many relationship
6. THE Database_Schema SHALL maintain the existing ExamSet and QuestionAssignment tables without modification
7. WHEN the schema migration is applied, THE Database_Migration_System SHALL complete within 10 seconds for databases with up to 10000 questions

### Requirement 7: Admin Question List Interface

**User Story:** As an admin, I want to view and filter all questions with their type, status, and topic assignments, so that I can efficiently manage the question database.

#### Acceptance Criteria

1. THE Admin_Question_List SHALL display question ID, part number, type, status, and assigned topics for each question
2. THE Admin_Question_List SHALL support filtering by part number, type, status, and topic
3. THE Admin_Question_List SHALL support sorting by creation date, part number, and status
4. THE Admin_Question_List SHALL display the count of questions matching current filters
5. THE Admin_Question_List SHALL support selecting multiple questions for bulk operations
6. THE Admin_Question_List SHALL load and display up to 100 questions within 1 second
7. WHEN a filter is applied, THE Admin_Question_List SHALL update the displayed questions within 500ms

### Requirement 8: Topic CRUD Operations

**User Story:** As an admin, I want to create, read, update, and delete topics, so that I can maintain an organized categorization system.

#### Acceptance Criteria

1. THE Topic_Management_UI SHALL allow creating a new topic with a name and optional description
2. THE Topic_Management_UI SHALL display all existing topics in a list or table view
3. THE Topic_Management_UI SHALL allow editing topic name and description
4. THE Topic_Management_UI SHALL allow deleting topics
5. WHEN a topic is deleted, THE Topic_Management_System SHALL display a confirmation dialog showing the count of affected questions
6. THE Topic_Management_UI SHALL prevent creating topics with empty names
7. THE Topic_Management_UI SHALL display the count of questions assigned to each topic

### Requirement 9: Backward Compatibility with Exam Sets

**User Story:** As a developer, I want the new system to maintain full compatibility with existing exam set functionality, so that current features continue working without disruption.

#### Acceptance Criteria

1. THE Question_Management_System SHALL continue supporting the QuestionAssignment relationship between questions and exam sets
2. THE Practice_Page SHALL continue displaying exam set filters alongside new topic filters
3. THE Full_Exam_Sets_Page SHALL continue displaying only complete exam sets with 11 questions
4. WHEN a question is assigned to an exam set, THE Question_Management_System SHALL maintain the existing assignment logic
5. THE Exam_Set_Management_UI SHALL continue functioning with existing create, read, update, and delete operations
6. THE Question_Management_System SHALL allow a single question to be assigned to multiple exam sets and multiple topics simultaneously

### Requirement 10: Question Type Filtering

**User Story:** As an admin, I want to filter questions by type (PRACTICE, FORECAST, CUSTOM), so that I can manage different question categories separately.

#### Acceptance Criteria

1. THE Admin_Question_List SHALL display a type filter with options for PRACTICE, FORECAST, and CUSTOM
2. WHEN a type filter is selected, THE Admin_Question_List SHALL display only questions matching that type
3. THE Admin_Question_List SHALL display the count of questions for each type
4. THE Admin_Question_List SHALL allow selecting multiple types simultaneously
5. THE Question_Creation_Form SHALL require selecting a question type before submission

### Requirement 11: Practice Page Topic Sidebar

**User Story:** As a user, I want to see available topics in a sidebar on the practice page, so that I can easily browse and select topics to practice.

#### Acceptance Criteria

1. THE Practice_Page SHALL display a topic filter sidebar showing all topics with PUBLISHED questions for the selected part
2. WHEN a topic is selected, THE Practice_Page SHALL highlight the selected topic in the sidebar
3. THE Practice_Page SHALL display the count of PUBLISHED questions for each topic in the sidebar
4. WHEN a topic has zero PUBLISHED questions for the selected part, THE Practice_Page SHALL exclude that topic from the sidebar
5. THE Practice_Page SHALL sort topics alphabetically by name in the sidebar
6. THE Practice_Page SHALL allow deselecting a topic to return to viewing all questions for the part

### Requirement 12: Bulk Question Publishing

**User Story:** As an admin, I want to publish multiple questions at once, so that I can efficiently release batches of reviewed questions.

#### Acceptance Criteria

1. THE Admin_Question_List SHALL provide a checkbox for selecting multiple questions
2. THE Admin_Question_List SHALL display a bulk actions toolbar when one or more questions are selected
3. THE Bulk_Actions_Toolbar SHALL include a "Publish" button
4. WHEN the Publish button is clicked, THE Question_Management_System SHALL change the status of all selected questions to PUBLISHED
5. THE Bulk_Actions_Toolbar SHALL include an "Unpublish" button that changes status to DRAFT
6. THE Bulk_Actions_Toolbar SHALL include an "Archive" button that changes status to ARCHIVED
7. WHEN bulk status change completes, THE Admin_Question_List SHALL display a success message with the count of updated questions

### Requirement 13: Question Search Functionality

**User Story:** As an admin, I want to search questions by text content, so that I can quickly find specific questions.

#### Acceptance Criteria

1. THE Admin_Question_List SHALL provide a search input field
2. WHEN text is entered in the search field, THE Admin_Question_List SHALL filter questions where contentText, questionText, or contextText contains the search term
3. THE Admin_Question_List SHALL perform case-insensitive search matching
4. THE Admin_Question_List SHALL update search results within 500ms of the last keystroke
5. THE Admin_Question_List SHALL display the count of questions matching the search term
6. WHEN the search field is cleared, THE Admin_Question_List SHALL display all questions matching other active filters

### Requirement 14: Question Preview in Practice Mode

**User Story:** As a user, I want to see a preview of each question before starting practice, so that I can choose which questions to attempt.

#### Acceptance Criteria

1. THE Practice_Page SHALL display a preview card for each PUBLISHED question in the filtered list
2. THE Question_Preview_Card SHALL display the question number, part number, and preparation time
3. THE Question_Preview_Card SHALL display the first 100 characters of the question text or content
4. WHEN a question has images, THE Question_Preview_Card SHALL display an indicator showing image count
5. THE Question_Preview_Card SHALL include a "Practice" button to start the question
6. WHEN the Practice button is clicked, THE Practice_Page SHALL navigate to the question practice interface

### Requirement 15: Topic Assignment Interface

**User Story:** As an admin, I want to assign topics to questions through an intuitive interface, so that I can efficiently categorize questions.

#### Acceptance Criteria

1. THE Question_Edit_Form SHALL display a topic selection field showing all available topics
2. THE Topic_Selection_Field SHALL support multi-select functionality
3. THE Topic_Selection_Field SHALL display currently assigned topics as removable tags
4. WHEN a topic is added, THE Question_Management_System SHALL create a QuestionTopicAssignment record within 100ms
5. WHEN a topic is removed, THE Question_Management_System SHALL delete the corresponding QuestionTopicAssignment record within 100ms
6. THE Topic_Selection_Field SHALL support creating new topics inline without leaving the question edit form
7. THE Question_Edit_Form SHALL display the count of topics assigned to the question
