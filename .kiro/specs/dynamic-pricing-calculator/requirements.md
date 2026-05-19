# Requirements Document

## Introduction

The Dynamic Pricing Calculator is an admin-only tool that enables administrators to calculate optimal subscription pricing by configuring cost providers, usage patterns, and business parameters. The tool performs ephemeral calculations (results are not persisted) to support "what-if" scenario analysis when costs change or new providers are added.

## Glossary

- **Admin**: A user with ADMIN role who has access to administrative features
- **Cost_Provider**: A third-party service that incurs costs (e.g., OpenAI, Supabase, AWS)
- **Usage_Pattern**: A user type definition with associated usage levels (Power, Regular, or Casual)
- **Calculator**: The Dynamic Pricing Calculator system
- **Pricing_Configuration**: The complete set of inputs including cost providers, usage patterns, and business parameters
- **Calculation_Result**: The output containing cost breakdown, suggested pricing, and profit projections
- **Unit_Type**: The measurement unit for a cost provider (e.g., per minute, per token, per GB)
- **Cost_Formula**: A mathematical expression that calculates cost based on usage and unit price
- **Weighted_Average**: The average cost per user calculated using usage pattern distribution percentages
- **Break_Even_Point**: The minimum number of users needed to cover total costs
- **Transaction_Fee**: A fixed cost per transaction (e.g., payment processing fees)
- **Fixed_Cost**: Recurring costs independent of user count (e.g., infrastructure, domain)
- **Profit_Margin**: The desired percentage of profit above total costs
- **Target_Users**: The expected number of paying subscribers
- **Currency_Rate**: The conversion rate between USD and VND

## Requirements

### Requirement 1: Admin Access Control

**User Story:** As a system administrator, I want the pricing calculator to be accessible only to admin users, so that sensitive pricing information remains confidential.

#### Acceptance Criteria

1. WHEN a user without ADMIN role attempts to access the pricing calculator page, THE Calculator SHALL redirect the user to an unauthorized page
2. WHEN a user with ADMIN role accesses the pricing calculator page, THE Calculator SHALL display the calculator interface
3. THE Calculator SHALL verify the user's role on page load

### Requirement 2: Cost Provider Management

**User Story:** As an admin, I want to add and configure multiple cost providers with their pricing models, so that I can calculate total service costs accurately.

#### Acceptance Criteria

1. THE Calculator SHALL allow the Admin to add cost providers dynamically
2. THE Calculator SHALL allow the Admin to remove cost providers dynamically
3. WHEN adding a cost provider, THE Calculator SHALL require a provider name
4. WHEN adding a cost provider, THE Calculator SHALL require a unit price as a positive number
5. WHEN adding a cost provider, THE Calculator SHALL require a unit type description
6. WHEN adding a cost provider, THE Calculator SHALL require a cost formula
7. THE Calculator SHALL support cost formulas containing mathematical operations (multiplication, addition, subtraction, division)
8. THE Calculator SHALL display all configured cost providers in the input section
9. FOR ALL cost providers, THE Calculator SHALL validate that unit price is greater than zero
10. FOR ALL cost providers, THE Calculator SHALL validate that the cost formula is a valid mathematical expression

### Requirement 3: Usage Pattern Configuration

**User Story:** As an admin, I want to define three user types with their usage levels and distribution percentages, so that I can model realistic user behavior.

#### Acceptance Criteria

1. THE Calculator SHALL provide three predefined usage pattern types: Power User, Regular User, and Casual User
2. WHEN configuring a usage pattern, THE Calculator SHALL require a usage level as a positive integer
3. WHEN configuring a usage pattern, THE Calculator SHALL require a distribution percentage
4. THE Calculator SHALL validate that the sum of all distribution percentages equals 100%
5. THE Calculator SHALL display all three usage patterns in the input section
6. FOR ALL usage patterns, THE Calculator SHALL validate that usage level is greater than zero
7. FOR ALL usage patterns, THE Calculator SHALL validate that distribution percentage is between 0 and 100

### Requirement 4: Business Parameters Configuration

**User Story:** As an admin, I want to configure business parameters including target users, profit margin, fixed costs, and transaction fees, so that I can model complete business scenarios.

#### Acceptance Criteria

1. WHEN configuring business parameters, THE Calculator SHALL require target number of users as a positive integer
2. WHEN configuring business parameters, THE Calculator SHALL require desired profit margin percentage
3. WHEN configuring business parameters, THE Calculator SHALL require fixed costs as a non-negative number
4. WHEN configuring business parameters, THE Calculator SHALL require transaction fee per transaction as a non-negative number
5. THE Calculator SHALL validate that target users is greater than zero
6. THE Calculator SHALL validate that profit margin is greater than or equal to zero
7. THE Calculator SHALL validate that fixed costs is greater than or equal to zero
8. THE Calculator SHALL validate that transaction fee is greater than or equal to zero

### Requirement 5: Currency Conversion Configuration

**User Story:** As an admin, I want to configure the USD to VND conversion rate, so that I can see pricing in Vietnamese Dong.

#### Acceptance Criteria

1. WHEN configuring currency conversion, THE Calculator SHALL require a USD to VND exchange rate as a positive number
2. THE Calculator SHALL validate that the exchange rate is greater than zero
3. THE Calculator SHALL use the configured exchange rate for all currency conversions in results

### Requirement 6: Cost Calculation

**User Story:** As an admin, I want to calculate total costs based on my configuration, so that I can understand the cost structure.

#### Acceptance Criteria

1. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute the cost for each usage pattern using the cost formula for each provider
2. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute the weighted average cost per user using distribution percentages
3. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute total variable costs by multiplying weighted average cost by target users
4. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute total transaction fees by multiplying transaction fee by target users
5. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute total costs as the sum of total variable costs, fixed costs, and total transaction fees
6. THE Calculator SHALL use the formula: `Weighted_Average = (Power_Percentage × Power_Cost + Regular_Percentage × Regular_Cost + Casual_Percentage × Casual_Cost) / 100`
7. THE Calculator SHALL use the formula: `Total_Cost = Total_Variable_Costs + Fixed_Costs + Total_Transaction_Fees`

### Requirement 7: Pricing Recommendation Calculation

**User Story:** As an admin, I want the calculator to suggest subscription pricing based on costs and profit margin, so that I can set competitive prices.

#### Acceptance Criteria

1. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute target revenue using the formula: `Target_Revenue = Total_Cost × (1 + Profit_Margin / 100)`
2. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute suggested price per user using the formula: `Suggested_Price = Target_Revenue / Target_Users`
3. THE Calculator SHALL display the suggested price in both USD and VND
4. THE Calculator SHALL round the suggested price to two decimal places for USD
5. THE Calculator SHALL round the suggested price to the nearest integer for VND

### Requirement 8: Break-Even Analysis

**User Story:** As an admin, I want to see the break-even point, so that I can understand the minimum users needed to cover costs.

#### Acceptance Criteria

1. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute the break-even point using the formula: `Break_Even_Users = Total_Cost / Weighted_Average_Cost_Per_User`
2. THE Calculator SHALL display the break-even point rounded up to the nearest integer
3. THE Calculator SHALL display the break-even point in the results section

### Requirement 9: Profit Projection

**User Story:** As an admin, I want to see projected profit at the target user count, so that I can evaluate business viability.

#### Acceptance Criteria

1. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute projected revenue using the formula: `Projected_Revenue = Suggested_Price × Target_Users`
2. WHEN the Admin clicks the Calculate button, THE Calculator SHALL compute projected profit using the formula: `Projected_Profit = Projected_Revenue - Total_Cost`
3. THE Calculator SHALL display projected profit in both USD and VND
4. THE Calculator SHALL display a visual indicator when projected profit is positive
5. THE Calculator SHALL display a visual indicator when projected profit is negative or zero

### Requirement 10: Cost Breakdown Display

**User Story:** As an admin, I want to see a detailed cost breakdown by provider, so that I can identify the largest cost drivers.

#### Acceptance Criteria

1. WHEN the Admin clicks the Calculate button, THE Calculator SHALL display the cost for each cost provider
2. WHEN the Admin clicks the Calculate button, THE Calculator SHALL display the cost for each usage pattern
3. WHEN the Admin clicks the Calculate button, THE Calculator SHALL display the weighted average cost per user
4. WHEN the Admin clicks the Calculate button, THE Calculator SHALL display total variable costs
5. WHEN the Admin clicks the Calculate button, THE Calculator SHALL display fixed costs
6. WHEN the Admin clicks the Calculate button, THE Calculator SHALL display total transaction fees
7. WHEN the Admin clicks the Calculate button, THE Calculator SHALL display total costs
8. THE Calculator SHALL display all cost values in both USD and VND

### Requirement 11: User Interface Layout

**User Story:** As an admin, I want a clear two-column layout with inputs on the left and results on the right, so that I can easily configure and view calculations.

#### Acceptance Criteria

1. THE Calculator SHALL display the input section on the left side of the page
2. THE Calculator SHALL display the results section on the right side of the page
3. THE Calculator SHALL display a Calculate button in the input section
4. WHEN the page loads, THE Calculator SHALL display empty or default values in the input section
5. WHEN the page loads, THE Calculator SHALL display no results until the Calculate button is clicked

### Requirement 12: Calculation Trigger

**User Story:** As an admin, I want to manually trigger calculations by clicking a button, so that I can review my inputs before calculating.

#### Acceptance Criteria

1. THE Calculator SHALL provide a Calculate button in the input section
2. WHEN the Admin clicks the Calculate button, THE Calculator SHALL validate all inputs
3. WHEN the Admin clicks the Calculate button with valid inputs, THE Calculator SHALL perform all calculations and display results
4. WHEN the Admin clicks the Calculate button with invalid inputs, THE Calculator SHALL display validation error messages
5. THE Calculator SHALL perform calculations only when the Calculate button is clicked

### Requirement 13: Input Validation and Error Handling

**User Story:** As an admin, I want clear validation messages when I enter invalid data, so that I can correct my inputs.

#### Acceptance Criteria

1. WHEN the Admin enters invalid data in any input field, THE Calculator SHALL display a validation error message near the field
2. WHEN the Admin clicks Calculate with invalid inputs, THE Calculator SHALL prevent calculation execution
3. WHEN the Admin clicks Calculate with invalid inputs, THE Calculator SHALL highlight all fields with validation errors
4. THE Calculator SHALL display specific error messages for each validation rule violation
5. WHEN the Admin corrects invalid inputs, THE Calculator SHALL remove the validation error messages

### Requirement 14: Ephemeral Calculations

**User Story:** As an admin, I want calculations to be temporary and not saved to the database, so that I can experiment freely without affecting production data.

#### Acceptance Criteria

1. THE Calculator SHALL perform all calculations in memory without database persistence
2. WHEN the Admin navigates away from the calculator page, THE Calculator SHALL discard all input data and results
3. WHEN the Admin refreshes the page, THE Calculator SHALL reset to default or empty state
4. THE Calculator SHALL display no save or export functionality

### Requirement 15: Responsive Calculation Performance

**User Story:** As an admin, I want calculations to complete quickly, so that I can iterate through scenarios efficiently.

#### Acceptance Criteria

1. WHEN the Admin clicks the Calculate button, THE Calculator SHALL complete all calculations within 500 milliseconds
2. WHEN the Admin clicks the Calculate button, THE Calculator SHALL display a loading indicator during calculation
3. WHEN calculations complete, THE Calculator SHALL display all results simultaneously

### Requirement 16: Cost Formula Evaluation

**User Story:** As an admin, I want the system to evaluate custom cost formulas correctly, so that I can model complex pricing structures.

#### Acceptance Criteria

1. THE Calculator SHALL support cost formulas containing the variable representing usage level
2. THE Calculator SHALL support cost formulas containing numeric constants
3. THE Calculator SHALL support cost formulas containing multiplication operations
4. THE Calculator SHALL support cost formulas containing addition operations
5. THE Calculator SHALL support cost formulas containing subtraction operations
6. THE Calculator SHALL support cost formulas containing division operations
7. THE Calculator SHALL support cost formulas containing parentheses for operation precedence
8. WHEN evaluating a cost formula, THE Calculator SHALL substitute the usage level for the usage variable
9. WHEN evaluating a cost formula, THE Calculator SHALL compute the result following standard mathematical operation precedence
10. IF a cost formula contains a division by zero, THEN THE Calculator SHALL display an error message

### Requirement 17: Page Header and Navigation

**User Story:** As an admin, I want a clear page header with breadcrumbs, so that I can understand my location in the admin interface.

#### Acceptance Criteria

1. THE Calculator SHALL display a page header with the title "Dynamic Pricing Calculator"
2. THE Calculator SHALL display a description explaining the purpose of the tool
3. THE Calculator SHALL display breadcrumbs showing the navigation path
4. THE Calculator SHALL follow the standard admin page layout pattern

### Requirement 18: Input Field Defaults

**User Story:** As an admin, I want reasonable default values in input fields, so that I can quickly test the calculator with example data.

#### Acceptance Criteria

1. WHEN the page loads, THE Calculator SHALL populate cost provider fields with example data
2. WHEN the page loads, THE Calculator SHALL populate usage pattern fields with example distribution percentages totaling 100%
3. WHEN the page loads, THE Calculator SHALL populate business parameter fields with example values
4. WHEN the page loads, THE Calculator SHALL populate the currency rate field with a current approximate USD to VND rate
5. THE Calculator SHALL allow the Admin to modify all default values

### Requirement 19: Visual Result Indicators

**User Story:** As an admin, I want visual indicators for profit/loss status, so that I can quickly assess scenario viability.

#### Acceptance Criteria

1. WHEN projected profit is positive, THE Calculator SHALL display a success indicator (green color or checkmark icon)
2. WHEN projected profit is zero or negative, THE Calculator SHALL display a warning indicator (red color or warning icon)
3. WHEN profit margin is zero, THE Calculator SHALL display an informational indicator
4. THE Calculator SHALL use color coding consistently throughout the results section

### Requirement 20: Number Formatting

**User Story:** As an admin, I want numbers formatted with appropriate separators and precision, so that results are easy to read.

#### Acceptance Criteria

1. THE Calculator SHALL format all currency values with thousand separators
2. THE Calculator SHALL format USD values with two decimal places
3. THE Calculator SHALL format VND values as integers with no decimal places
4. THE Calculator SHALL format percentage values with one decimal place
5. THE Calculator SHALL format user count values as integers with no decimal places
