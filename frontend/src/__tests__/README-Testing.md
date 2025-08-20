# Product Management Testing Guide

## Overview
This test suite provides comprehensive testing for the product management system, focusing on functionality rather than implementation details. The tests are designed to be resilient to code refactoring as long as the core functionality remains intact.

## Test Categories

### 1. Unit Tests
- **ProductFilters**: Tests filter components and interactions
- **ProductTable**: Tests table rendering and data display
- **ProductRow**: Tests individual product row functionality
- **ProductTags**: Tests tag display and overflow handling
- **useProducts Hook**: Tests data fetching and filtering logic
- **productService**: Tests API service functions

### 2. Integration Tests
- **ProductManagement.integration**: Tests complete workflows
- **Error handling**: Tests graceful degradation
- **State persistence**: Tests filter state across UI changes

### 3. Accessibility Tests
- **WCAG compliance**: Tests for accessibility violations
- **Semantic structure**: Tests proper heading hierarchy and form labels
- **Keyboard navigation**: Ensures keyboard accessibility

### 4. Performance Tests
- **Large datasets**: Tests rendering performance with 1000+ items
- **Filter performance**: Tests search/filter response times

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui

# Run only unit tests
npm test -- --run src/**/*.test.tsx

# Run only integration tests
npm test -- --run src/**/*.integration.test.tsx
```

## Test Structure

### Functional Testing Approach
The tests focus on:
- **User interactions**: What users can do with the interface
- **Data flow**: How data moves through the system
- **API contracts**: Expected API calls and responses
- **Business logic**: Filtering, searching, CRUD operations

### Resilient Test Design
Tests are designed to remain stable through:
- **Component refactoring**: Tests use semantic selectors (roles, labels, text)
- **Structure changes**: Tests focus on behavior, not implementation
- **Styling updates**: Tests don't depend on CSS classes or specific DOM structure

## Coverage Requirements

The test suite maintains:
- **80% code coverage** across all metrics
- **100% critical path coverage** for core features
- **Error scenario coverage** for all user-facing functions

## CI/CD Integration

Tests run automatically on:
- **Pull requests**: Full test suite with coverage reporting
- **Main branch pushes**: Full test suite with deployment gates
- **Nightly builds**: Extended test suite including performance tests

## Mocking Strategy

- **API calls**: Mocked with realistic data structures
- **External dependencies**: Mocked at module level
- **Browser APIs**: Mocked with stable implementations
- **Random/time-based functions**: Mocked for deterministic tests

## Best Practices

1. **Test user workflows**, not implementation details
2. **Use semantic queries** (getByRole, getByLabelText, getByText)
3. **Test error states** and edge cases
4. **Keep tests focused** and independent
5. **Use descriptive test names** that explain the expected behavior

## Troubleshooting

### Common Issues
- **Async operations**: Use waitFor() for asynchronous updates
- **Component state**: Allow time for state updates to propagate
- **API mocking**: Ensure mock responses match expected data structure
- **Router dependencies**: Wrap components in BrowserRouter for navigation tests

### Debug Tools
- **test:ui**: Visual test runner for debugging
- **screen.debug()**: Print current DOM state
- **--reporter=verbose**: Detailed test output
- **Coverage reports**: Identify untested code paths