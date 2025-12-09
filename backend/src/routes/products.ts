import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { ProductController } from '../controllers/ProductController';

const router = Router();

/**
 * Route quản lý sản phẩm
 */

// Tất cả các route sản phẩm đều cần xác thực
router.use(authenticateToken);

// ==================== Route liên quan đến sản phẩm ====================

/**
 * @route GET /api/v1/products
 * @desc Lấy danh sách sản phẩm
 * @access Private
 */
router.get('/', ProductController.getProducts);

/**
 * @route POST /api/v1/products
 * @desc Tạo sản phẩm
 * @access Private
 */
router.post('/', ProductController.createProduct);

/**
 * @route PUT /api/v1/products/:id
 * @desc Cập nhật sản phẩm
 * @access Private
 */
router.put('/:id', ProductController.updateProduct);

/**
 * @route DELETE /api/v1/products/:id
 * @desc Xóa sản phẩm
 * @access Private
 */
router.delete('/:id', ProductController.deleteProduct);

/**
 * @route GET /api/v1/products/:id
 * @desc Lấy chi tiết sản phẩm
 * @access Private
 */
router.get('/:id', ProductController.getProductDetail);

/**
 * @route GET /api/v1/products/:id/stats
 * @desc Lấy thống kê liên quan đến sản phẩm (lọc theo quyền vai trò người dùng)
 * @access Private
 */
router.get('/:id/stats', ProductController.getProductStats);

/**
 * @route POST /api/v1/products/batch-import
 * @desc Nhập khẩu hàng loạt sản phẩm
 * @access Private
 */
router.post('/batch-import', ProductController.batchImportProducts);

/**
 * @route GET /api/v1/products/export
 * @desc Xuất dữ liệu sản phẩm
 * @access Private
 */
router.get('/export', ProductController.exportProducts);

// ==================== Route liên quan đến quản lý tồn kho ====================

/**
 * @route GET /api/v1/products/stock/statistics
 * @desc Lấy thông tin thống kê tồn kho
 * @access Private
 */
router.get('/stock/statistics', ProductController.getStockStatistics);

/**
 * @route POST /api/v1/products/stock/adjust
 * @desc Điều chỉnh tồn kho
 * @access Private
 */
router.post('/stock/adjust', ProductController.adjustStock);

/**
 * @route GET /api/v1/products/stock/adjustments
 * @desc Lấy bản ghi điều chỉnh tồn kho
 * @access Private
 */
router.get('/stock/adjustments', ProductController.getStockAdjustments);

// ==================== Route liên quan đến phân loại sản phẩm ====================

/**
 * @route GET /api/v1/products/categories
 * @desc Lấy danh sách phân loại sản phẩm (cấu trúc phẳng)
 * @access Private
 */
router.get('/categories', ProductController.getCategories);

/**
 * @route GET /api/v1/products/categories/tree
 * @desc Lấy cấu trúc cây phân loại sản phẩm
 * @access Private
 */
router.get('/categories/tree', ProductController.getCategoryTree);

/**
 * @route GET /api/v1/products/categories/:id
 * @desc Lấy chi tiết phân loại sản phẩm
 * @access Private
 */
router.get('/categories/:id', ProductController.getCategoryDetail);

/**
 * @route POST /api/v1/products/categories
 * @desc Tạo phân loại sản phẩm
 * @access Private
 */
router.post('/categories', ProductController.createCategory);

/**
 * @route PUT /api/v1/products/categories/:id
 * @desc Cập nhật phân loại sản phẩm
 * @access Private
 */
router.put('/categories/:id', ProductController.updateCategory);

/**
 * @route DELETE /api/v1/products/categories/:id
 * @desc Xóa phân loại sản phẩm
 * @access Private
 */
router.delete('/categories/:id', ProductController.deleteCategory);

// ==================== Route liên quan đến thống kê bán hàng ====================

/**
 * @route GET /api/v1/products/sales/statistics
 * @desc Lấy dữ liệu thống kê bán hàng
 * @access Private
 */
router.get('/sales/statistics', async (req, res) => {
  try {
    const { startDate, endDate, productId, categoryId } = req.query;

    // Trả về dữ liệu mô phỏng, thực tế nên truy vấn từ cơ sở dữ liệu
    res.json({
      success: true,
      data: {
        totalSales: 125000,
        totalOrders: 450,
        totalQuantity: 1200,
        averageOrderValue: 277.78,
        growthRate: 15.5
      }
    });
  } catch (error) {
    console.error('Lấy thống kê bán hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy thống kê bán hàng thất bại'
    });
  }
});

/**
 * @route GET /api/v1/products/sales/trend
 * @desc Lấy dữ liệu xu hướng bán hàng
 * @access Private
 */
router.get('/sales/trend', async (req, res) => {
  try {
    const { startDate, endDate, productId, groupBy = 'day' } = req.query;

    // Tạo dữ liệu xu hướng mô phỏng
    const trendData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return {
        date: date.toISOString().split('T')[0],
        sales: Math.floor(Math.random() * 10000) + 5000,
        orders: Math.floor(Math.random() * 50) + 20,
        quantity: Math.floor(Math.random() * 100) + 50
      };
    });

    res.json({
      success: true,
      data: trendData
    });
  } catch (error) {
    console.error('Lấy xu hướng bán hàng thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy xu hướng bán hàng thất bại'
    });
  }
});

/**
 * @route GET /api/v1/products/sales/category
 * @desc Lấy dữ liệu bán hàng theo phân loại
 * @access Private
 */
router.get('/sales/category', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    res.json({
      success: true,
      data: [
        { categoryId: '1', categoryName: 'Điện tử', sales: 50000, percentage: 40 },
        { categoryId: '2', categoryName: 'Quần áo', sales: 30000, percentage: 24 },
        { categoryId: '3', categoryName: 'Thực phẩm', sales: 25000, percentage: 20 },
        { categoryId: '4', categoryName: 'Khác', sales: 20000, percentage: 16 }
      ]
    });
  } catch (error) {
    console.error('Lấy dữ liệu bán hàng theo phân loại thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy dữ liệu bán hàng theo phân loại thất bại'
    });
  }
});

/**
 * @route GET /api/v1/products/sales/top
 * @desc Lấy bảng xếp hạng sản phẩm bán chạy
 * @access Private
 */
router.get('/sales/top', async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    res.json({
      success: true,
      data: Array.from({ length: Number(limit) }, (_, i) => ({
        productId: `${i + 1}`,
        productName: `Sản phẩm bán chạy ${i + 1}`,
        sales: Math.floor(Math.random() * 10000) + 5000,
        quantity: Math.floor(Math.random() * 100) + 50,
        rank: i + 1
      }))
    });
  } catch (error) {
    console.error('Lấy bảng xếp hạng sản phẩm bán chạy thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy bảng xếp hạng sản phẩm bán chạy thất bại'
    });
  }
});

/**
 * @route GET /api/v1/products/inventory/warning
 * @desc Lấy dữ liệu cảnh báo tồn kho
 * @access Private
 */
router.get('/inventory/warning', async (req, res) => {
  try {
    const { threshold = 10 } = req.query;

    res.json({
      success: true,
      data: {
        warningCount: 5,
        products: [
          { productId: '1', productName: 'Sản phẩm A', currentStock: 5, minStock: 10 },
          { productId: '2', productName: 'Sản phẩm B', currentStock: 3, minStock: 10 },
          { productId: '3', productName: 'Sản phẩm C', currentStock: 8, minStock: 15 }
        ]
      }
    });
  } catch (error) {
    console.error('Lấy dữ liệu cảnh báo tồn kho thất bại:', error);
    res.status(500).json({
      success: false,
      message: 'Lấy dữ liệu cảnh báo tồn kho thất bại'
    });
  }
});

export default router;
