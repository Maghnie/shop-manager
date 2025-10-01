# Testing Documentation

This document describes the test coverage and best practices for the Shop Manager application.

## Test Overview

### Backend Tests (Django/Python)
Location: `backend/sales/tests.py`

**Test Framework:** Django TestCase with Django REST Framework's APIClient

**Running Tests:**
```bash
cd backend
python manage.py test sales
```

### Frontend Tests (React/TypeScript)
Location: `frontend/src/apps/sales/`

**Test Framework:** Vitest + React Testing Library

**Running Tests:**
```bash
cd frontend
npm test                    # Watch mode
npm run test:run            # Single run
npm run test:coverage       # With coverage report
npm run test:ui             # UI mode
```

## Test Coverage

### Backend Tests

Location: `backend/sales/tests.py`

All test cases include detailed docstrings in Given/When/Then format. See the test file for complete documentation.

**Test Classes:**
- `SaleModelTestCase` - Tests Sale model @property calculations (4 tests)
- `SaleAPITestCase` - Tests API endpoints and workflows (6 tests)
- `SaleItemTestCase` - Tests SaleItem model calculations (2 tests)

**Total: 12 test cases**

**Key Tests:**
- Sales validation (empty items)
- Sale creation with inventory updates
- Calculation accuracy (discount, tax, profit)
- Invoice auto-generation
- Sale cancellation with inventory restoration

**Calculation Formula:**
```python
subtotal = Σ(item.quantity × item.unit_price)
discounted_amount = subtotal - discount
tax_amount = discounted_amount × (tax_percentage / 100)
final_total = discounted_amount + tax_amount
total_cost = Σ(item.quantity × product.cost_price)
net_profit = final_total - total_cost
profit_percentage = (net_profit / total_cost) × 100
```

### Frontend Tests

Location: `frontend/src/apps/sales/tests/`

All test cases include detailed docstrings in Given/When/Then format. See test files for complete documentation.

**Test Files:**
- `useSalesCalculations.test.ts` - Calculation hook tests (8 tests)
- `SaleForm.test.tsx` - Component and validation tests (7 tests)

**Total: 15 test cases**

**Key Tests:**
- Calculation accuracy matching backend logic
- Form validation and user feedback
- Empty state handling
- Stock limit validation
- React hook reactivity

## Test Best Practices

### Backend Testing

1. **Use setUp() for Common Data**
   - Create users, products, and inventory in setUp()
   - Reduces code duplication
   - Ensures consistent test data

2. **Test Edge Cases**
   - Zero quantities, negative numbers
   - Missing/invalid product IDs
   - Exceeding stock limits
   - Empty arrays

3. **Verify Side Effects**
   - Check inventory updates
   - Confirm status changes
   - Validate invoice creation

4. **Use Descriptive Test Names**
   - Format: `test_<action>_<condition>_<expected_result>`
   - Example: `test_create_sale_without_items_fails`

5. **Assertions**
   - Use `assertEqual` for exact values
   - Use `assertIn` for substring matching
   - Use `assertIsNotNone` for existence checks

### Frontend Testing

1. **Mock External Dependencies**
   - Mock API hooks (useSales, useAvailableProducts)
   - Mock navigation (useNavigate)
   - Mock toast notifications

2. **Test User Interactions**
   - Click events (fireEvent.click)
   - Form submissions
   - Input changes

3. **Async Testing**
   - Use `waitFor` for asynchronous updates
   - Use `await` for promises
   - Handle loading states

4. **Component Isolation**
   - Test components in isolation
   - Mock child components if necessary
   - Focus on component behavior, not implementation

5. **Accessibility**
   - Use `getByRole` for semantic queries
   - Test keyboard navigation where applicable
   - Verify ARIA labels

## Coverage Goals

### Current Coverage
- Backend: **9 test cases** covering sales, calculations, and inventory
- Frontend: **8 test cases** covering hooks and components

### Target Coverage
- Line Coverage: 80%
- Branch Coverage: 80%
- Function Coverage: 80%

### Uncovered Areas (To Do)
1. ⏳ Discard confirmation dialog (frontend)
2. ⏳ Product quantity adjustment with stock limits (frontend)
3. ⏳ Clear all items functionality (frontend)
4. ⏳ Sales statistics endpoint (backend)
5. ⏳ Invoice print data endpoint (backend)

## Running Tests in CI/CD

### Backend CI Command
```bash
python manage.py test --parallel --keepdb
```

### Frontend CI Command
```bash
npm run test:ci  # Runs both unit and e2e tests with coverage
```

## Test Data

### Sample Products
```python
Product(
    type=ProductType(...),
    brand=ProductBrand(...),
    cost_price=Decimal('10.00'),
    selling_price=Decimal('15.00'),
    size='M'
)
```

### Sample Sale
```python
Sale(
    customer_name='Test Customer',
    payment_method='cash',
    discount_amount=Decimal('5.00'),
    tax_percentage=Decimal('10.00'),
    items=[SaleItem(...)]
)
```

## Debugging Tests

### Backend
```bash
# Run specific test
python manage.py test sales.tests.SaleModelTestCase.test_sale_calculations_no_discount_no_tax

# Verbose output
python manage.py test --verbosity=2

# Keep database for inspection
python manage.py test --keepdb
```

### Frontend
```bash
# Run specific test file
npm test SaleForm.test.tsx

# Debug in UI mode
npm run test:ui

# Watch mode for development
npm run test:watch
```

## Additional Resources

- [Django Testing Documentation](https://docs.djangoproject.com/en/stable/topics/testing/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest Documentation](https://vitest.dev/)

---

**Last Updated:** 2025-01-10
**Maintained By:** Development Team
