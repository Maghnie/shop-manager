import { rest } from 'msw';

export const handlers = [
  // Products endpoints
  rest.get('/api/inventory/products/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        results: [
          {
            id: 1,
            type_name_ar: 'كرسي',
            type_name_en: 'Chair',
            brand_name_ar: 'ايكيا',
            brand_name_en: 'IKEA',
            size: 'متوسط',
            cost_price: 50,
            selling_price: 100,
            profit: 50,
            profit_percentage: 100,
            tags_list: ['مريح', 'خشبي'],
            type: 1,
            brand: 1,
            material: 1
          }
        ]
      })
    );
  }),

  rest.get('/api/inventory/product-types/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        results: [
          { id: 1, name_ar: 'كرسي' },
          { id: 2, name_ar: 'طاولة' }
        ]
      })
    );
  }),

  rest.get('/api/inventory/brands/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        results: [
          { id: 1, name_ar: 'ايكيا' },
          { id: 2, name_ar: 'هوم سنتر' }
        ]
      })
    );
  }),

  rest.get('/api/inventory/materials/', (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({
        results: [
          { id: 1, name_ar: 'خشب' },
          { id: 2, name_ar: 'معدن' }
        ]
      })
    );
  }),

  rest.delete('/api/inventory/products/:id/', (req, res, ctx) => {
    return res(ctx.status(204));
  }),

  // Error handlers for testing error scenarios
  rest.get('/api/inventory/products/error', (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Server error' }));
  }),
];