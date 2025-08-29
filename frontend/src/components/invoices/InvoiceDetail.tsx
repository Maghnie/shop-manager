import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Printer, Download, CheckSquare, ArrowLeft, Eye } from 'lucide-react';
import { InvoiceService } from '@/services/saleService';
import { useInvoice } from '@/hooks/useInvoices';

const InvoiceDetail: React.FC = () => {
  const { id, saleId } = useParams<{ id?: string; saleId?: string }>();
  const invoiceId = id ? parseInt(id) : undefined;
  const saleIdNum = saleId ? parseInt(saleId) : undefined;
  
  const { invoice, loading, refetch, fetchBySale } = useInvoice(invoiceId);
  const [printing, setPrinting] = useState(false);

  // Load invoice by sale ID if provided
  React.useEffect(() => {
    // Only fetch if we have a saleId, no invoiceId, and no invoice data yet
    if (saleIdNum && !invoiceId && !invoice && !loading) {
      fetchBySale(saleIdNum);
    }
  }, [saleIdNum, invoiceId, fetchBySale, invoice, loading]);

  const handlePrint = async () => {
    if (!invoice) return;

    setPrinting(true);
    try {
      const printData = await InvoiceService.getInvoicePrintData(invoice.id!);
      
      // Create print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(generatePrintHTML(printData.invoice));
        printWindow.document.close();
        printWindow.print();
        
        // Mark as printed
        await InvoiceService.markInvoicePrinted(invoice.id!);
        refetch();
      }
    } catch (error) {
      alert('حدث خطأ أثناء الطباعة');
      console.error(error);
    } finally {
      setPrinting(false);
    }
  };

  const generatePrintHTML = (invoiceData: any) => {
    const sale = invoiceData.sale_details;
    
    return `
    <!DOCTYPE html>
    <html dir="rtl">
    <head>
      <meta charset="utf-8">
      <title>فاتورة ${invoiceData.invoice_number}</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 20px; 
          direction: rtl;
          color: #333;
        }
        .header { 
          text-align: center; 
          border-bottom: 2px solid #333; 
          padding-bottom: 20px; 
          margin-bottom: 30px; 
        }
        .company-name { 
          font-size: 24px; 
          font-weight: bold; 
          margin-bottom: 10px; 
        }
        .invoice-info { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 30px; 
        }
        .customer-info, .invoice-details { 
          flex: 1; 
        }
        .customer-info { 
          margin-left: 20px; 
        }
        .invoice-details { 
          text-align: left; 
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin-bottom: 20px; 
        }
        th, td { 
          border: 1px solid #ddd; 
          padding: 12px; 
          text-align: center; 
        }
        th { 
          background-color: #f5f5f5; 
          font-weight: bold; 
        }
        .totals { 
          text-align: left; 
          margin-top: 20px; 
        }
        .totals div { 
          margin-bottom: 8px; 
        }
        .final-total { 
          font-size: 18px; 
          font-weight: bold; 
          border-top: 2px solid #333; 
          padding-top: 10px; 
        }
        .footer { 
          text-align: center; 
          margin-top: 40px; 
          font-size: 12px; 
          color: #666; 
        }
        @media print {
          body { margin: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="company-name">${invoiceData.company_name}</div>
        <div>${invoiceData.company_address}</div>
        <div>هاتف: ${invoiceData.company_phone}</div>
        ${invoiceData.company_email ? `<div>البريد الإلكتروني: ${invoiceData.company_email}</div>` : ''}
      </div>

      <div class="invoice-info">
        <div class="customer-info">
          <h3>معلومات العميل</h3>
          <div><strong>الاسم:</strong> ${sale.customer_name || 'عميل مباشر'}</div>
          ${sale.customer_phone ? `<div><strong>الهاتف:</strong> ${sale.customer_phone}</div>` : ''}
          ${sale.customer_address ? `<div><strong>العنوان:</strong> ${sale.customer_address}</div>` : ''}
        </div>
        
        <div class="invoice-details">
          <h3>تفاصيل الفاتورة</h3>
          <div><strong>رقم الفاتورة:</strong> ${invoiceData.invoice_number}</div>
          <div><strong>رقم البيعة:</strong> ${sale.sale_number}</div>
          <div><strong>التاريخ:</strong> ${new Date(invoiceData.invoice_date).toLocaleDateString('ar-SA')}</div>
          <div><strong>طريقة الدفع:</strong> ${getPaymentMethodText(sale.payment_method)}</div>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>المنتج</th>
            <th>الكمية</th>
            <th>سعر الوحدة</th>
            <th>الإجمالي</th>
          </tr>
        </thead>
        <tbody>
          ${sale.items.map((item: any) => `
            <tr>
              <td style="text-align: right;">
                ${item.product_name_ar}
                ${item.product_brand_ar ? `<br><small>${item.product_brand_ar}</small>` : ''}
              </td>
              <td>${item.quantity}</td>
              <td>$${item.unit_price.toFixed(2)}</td>
              <td>$${item.total_price.toFixed(2)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals">
        <div>المجموع الفرعي: $${sale.subtotal.toFixed(2)}</div>
        ${sale.discount_amount > 0 ? `<div>الخصم: -$${sale.discount_amount.toFixed(2)}</div>` : ''}
        ${sale.tax_amount > 0 ? `<div>الضريبة: +$${sale.tax_amount.toFixed(2)}</div>` : ''}
        <div class="final-total">الإجمالي النهائي: $${sale.final_total.toFixed(2)}</div>
      </div>

      ${sale.notes ? `<div style="margin-top: 20px;"><strong>ملاحظات:</strong> ${sale.notes}</div>` : ''}

      <div class="footer">
        <p>شكراً لتعاملكم معنا</p>
        <p>تاريخ الطباعة: ${new Date().toLocaleDateString('ar-SA')} ${new Date().toLocaleTimeString('ar-SA')}</p>
      </div>
    </body>
    </html>
    `;
  };

  const getPaymentMethodText = (method: string) => {
    const methods = {
      cash: 'نقدي',
      card: 'بطاقة',
      bank_transfer: 'تحويل بنكي',
      credit: 'آجل'
    };
    return methods[method as keyof typeof methods] || method;
  };

  const formatCurrency = (amount: unknown) => {
    const num = Number(amount);
    return isNaN(num) ? '—' : `$${num.toFixed(2)}`;
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">جاري تحميل الفاتورة...</div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-gray-600 mb-4">الفاتورة غير موجودة</div>
          <Link to="/sales" className="text-blue-600 hover:underline">
            العودة إلى قائمة المبيعات
          </Link>
        </div>
      </div>
    );
  }

  const sale = invoice.sale_details!;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            فاتورة #{invoice.invoice_number}
          </h1>
          <p className="text-gray-600">
            تاريخ الإصدار: {formatDate(invoice.invoice_date!)}
          </p>
        </div>

        <div className="flex space-x-2 space-x-reverse">
          <Link
            to="/sales"
            className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>العودة</span>
          </Link>

          <Link
            to={`/sales/${sale.id}`}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition duration-200 flex items-center space-x-2 space-x-reverse"
          >
            <Eye className="w-4 h-4" />
            <span>عرض البيعة</span>
          </Link>

          <button
            onClick={handlePrint}
            disabled={printing}
            className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition duration-200 flex items-center space-x-2 space-x-reverse disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            <span>{printing ? 'جاري الطباعة...' : 'طباعة'}</span>
          </button>
        </div>
      </div>

      {/* Invoice Preview */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-8 shadow-lg">
        {/* Company Header */}
        <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
          <h2 className="text-2xl font-bold mb-2">{invoice.company_name}</h2>
          <p className="text-gray-600">{invoice.company_address}</p>
          <p className="text-gray-600">هاتف: {invoice.company_phone}</p>
          {invoice.company_email && (
            <p className="text-gray-600">البريد الإلكتروني: {invoice.company_email}</p>
          )}
        </div>

        {/* Invoice & Customer Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">تفاصيل الفاتورة</h3>
            <div className="space-y-2">
              <div><span className="font-medium">رقم الفاتورة:</span> {invoice.invoice_number}</div>
              <div><span className="font-medium">رقم البيعة:</span> {sale.sale_number}</div>
              <div><span className="font-medium">التاريخ:</span> {formatDate(invoice.invoice_date!)}</div>
              <div><span className="font-medium">طريقة الدفع:</span> {getPaymentMethodText(sale.payment_method)}</div>
              {invoice.is_printed && (
                <div className="flex items-center space-x-2 space-x-reverse text-green-600">
                  <CheckSquare className="w-4 h-4" />
                  <span>تم طباعتها في {formatDate(invoice.printed_at!)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-300 p-3 text-right">المنتج</th>
                <th className="border border-gray-300 p-3 text-center">الكمية</th>
                <th className="border border-gray-300 p-3 text-center">سعر الوحدة</th>
                <th className="border border-gray-300 p-3 text-center">الإجمالي</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 p-3">
                    <div>
                      <div className="font-medium">{item.product_name_ar}</div>
                      {item.product_brand_ar && (
                        <div className="text-sm text-gray-500">{item.product_brand_ar}</div>
                      )}
                    </div>
                  </td>
                  <td className="border border-gray-300 p-3 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 p-3 text-center">{formatCurrency(item.unit_price)}</td>
                  <td className="border border-gray-300 p-3 text-center font-semibold">{formatCurrency(item.total_price!)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-80">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>المجموع الفرعي:</span>
                <span>{formatCurrency(sale.subtotal!)}</span>
              </div>
              {(sale.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>الخصم:</span>
                  <span>-{formatCurrency(sale.discount_amount!)}</span>
                </div>
              )}
              {(sale.tax_amount || 0) > 0 && (
                <div className="flex justify-between">
                  <span>الضريبة ({sale.tax_percentage}%):</span>
                  <span>+{formatCurrency(sale.tax_amount!)}</span>
                </div>
              )}
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-800 pt-2">
                <span>الإجمالي النهائي:</span>
                <span>{formatCurrency(sale.final_total!)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="mb-8">
            <h4 className="font-semibold mb-2">ملاحظات:</h4>
            <p className="text-gray-700">{sale.notes}</p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm border-t pt-6">
          <p>شكراً لتعاملكم معنا</p>
        </div>
      </div>

      {/* Print Status */}
      {invoice.is_printed && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 space-x-reverse text-green-800">
            <CheckSquare className="w-5 h-5" />
            <span className="font-medium">تم طباعة هذه الفاتورة في {formatDate(invoice.printed_at!)}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceDetail;
