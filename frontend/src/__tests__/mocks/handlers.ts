import { http, HttpResponse } from 'msw';

export const handlers = [
  // Products endpoints
  http.get('/api/inventory/products/', () => {  
    return HttpResponse.json({
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
    });
  }),

  http.get('/api/inventory/product-types/', () => {
    return HttpResponse.json({
        results: [
          { id: 1, name_ar: 'كرسي' },
          { id: 2, name_ar: 'طاولة' }
        ]
    });
  }),

  http.get('/api/inventory/brands/', () => {
    return HttpResponse.json({
        results: [
          { id: 1, name_ar: 'ايكيا' },
          { id: 2, name_ar: 'هوم سنتر' }
        ]
    });
  }),

  http.get('/api/inventory/materials/', () => {
    return HttpResponse.json({
        results: [
          { id: 1, name_ar: 'خشب' },
          { id: 2, name_ar: 'معدن' }
        ]
    });
  }),

  // DELETE handler - returns empty response with 204 status
  http.delete('/api/inventory/products/:id/', ({ params }) => {
  return new HttpResponse(null, { status: 204 });
  }),
  
  // Error handler - returns 500 with JSON error
  http.get('/api/inventory/products/error', () => {
  return HttpResponse.json(
      { error: 'Server error' }, 
      { status: 500 }
  );
  }),
];