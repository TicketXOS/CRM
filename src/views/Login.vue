<template>
  <div class="login-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card">
      <!-- 顶部Logo区域 -->
      <div class="logo-section">
        <div class="logo-icon">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
            <rect width="48" height="48" rx="10" fill="url(#logo-gradient)" />
            <path d="M14 24L20 30L34 16" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            <defs>
              <linearGradient id="logo-gradient" x1="0" y1="0" x2="48" y2="48">
                <stop offset="0%" stop-color="#4F46E5" />
                <stop offset="100%" stop-color="#7C3AED" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <h1 class="system-title">Hệ thống quản lý bán hàng thông minh</h1>
        <p class="system-subtitle">CRM Customer Relationship Management</p>
      </div>

      <!-- 登录表单 -->
      <el-form :model="loginForm" :rules="rules" ref="loginFormRef" class="login-form">
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="Tên đăng nhập"
            size="large"
            prefix-icon="User"
            clearable
          />
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="Mật khẩu"
            size="large"
            prefix-icon="Lock"
            show-password
            clearable
          />
        </el-form-item>

        <!-- 协议勾选 -->
        <el-form-item class="agreement-item">
          <el-checkbox v-model="agreeToTerms">
            <span class="agreement-text">
              Tôi đã đọc và đồng ý
              <a href="javascript:void(0)" @click="showAgreementDialog('user')">《Thỏa thuận người dùng》</a>
              và
              <a href="javascript:void(0)" @click="showAgreementDialog('privacy')">《Chính sách bảo mật》</a>
            </span>
          </el-checkbox>
        </el-form-item>

        <el-form-item>
          <el-button
            type="primary"
            size="large"
            class="login-button"
            :loading="loading"
            :disabled="!agreeToTerms"
            @click="handleLogin"
          >
            {{ loading ? 'Đang đăng nhập...' : 'Đăng nhập' }}
          </el-button>
        </el-form-item>
      </el-form>

      <!-- 底部信息 -->
      <div class="card-footer">
        <p>© 2025 Hệ thống quản lý bán hàng thông minh</p>
      </div>
    </div>

    <!-- 协议弹窗 -->
    <el-dialog
      v-model="agreementDialogVisible"
      :title="agreementDialogTitle"
      width="800px"
      :close-on-click-modal="false"
      class="agreement-dialog"
    >
      <div class="agreement-content" v-html="agreementDialogContent"></div>
      <template #footer>
        <el-button @click="agreementDialogVisible = false">Đóng</el-button>
        <el-button type="primary" @click="agreeAndClose">
          Tôi đã đọc và đồng ý
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { createSafeNavigator } from '@/utils/navigation'
import { useUserStore } from '@/stores/user'
import { useConfigStore } from '@/stores/config'
import { ElMessage } from 'element-plus'
import type { FormInstance } from 'element-plus'
import { preloadAppData } from '@/services/appInitService'

const router = useRouter()
const safeNavigator = createSafeNavigator(router)
const userStore = useUserStore()
const configStore = useConfigStore()

const loading = ref(false)
const loginFormRef = ref<FormInstance>()

const loginForm = reactive({
  username: '',
  password: ''
})

// 🔥 批次275新增：用户协议相关
const agreeToTerms = ref(false)
const agreementDialogVisible = ref(false)
const agreementDialogTitle = ref('')
const agreementDialogContent = ref('')
const currentAgreementType = ref<'user' | 'privacy'>('user')

const rules = {
  username: [
    { required: true, message: 'Vui lòng nhập tên đăng nhập', trigger: 'blur' }
  ],
  password: [
    { required: true, message: 'Vui lòng nhập mật khẩu', trigger: 'blur' },
    { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự', trigger: 'blur' }
  ]
}

// 🔥 批次275新增：获取默认协议内容
const getDefaultUserAgreement = () => {
  return `<div style="line-height: 2.2; padding: 30px; font-size: 15px;">
<h2 style="color: #303133; border-bottom: 3px solid #409eff; padding-bottom: 15px; margin-bottom: 30px; text-align: center; font-size: 26px; font-weight: 700;">Thỏa thuận sử dụng người dùng</h2>

<p style="color: #606266; margin: 25px 0; font-size: 16px; line-height: 2.5; background: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #409eff;">
  <strong>Chào mừng bạn sử dụng Hệ thống quản lý khách hàng CRM</strong> (sau đây gọi là "Hệ thống"). Trước khi sử dụng Hệ thống, <strong style="color: #409eff;">vui lòng đọc kỹ và hiểu rõ toàn bộ nội dung của thỏa thuận này</strong>.
</p>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">I. Chấp nhận thỏa thuận</h3>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>1.1</strong> Thỏa thuận này là thỏa thuận giữa bạn và bên vận hành Hệ thống về việc sử dụng dịch vụ của Hệ thống.
</p>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>1.2</strong> Bạn nhấp vào nút <strong style="color: #409eff;">"Đồng ý"</strong> có nghĩa là bạn hoàn toàn chấp nhận tất cả các điều khoản của thỏa thuận này.
</p>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">II. Nội dung dịch vụ</h3>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>2.1</strong> Hệ thống cung cấp dịch vụ quản lý quan hệ khách hàng cho doanh nghiệp, bao gồm nhưng không giới hạn:
</p>

<ul style="color: #606266; padding-left: 50px; margin: 20px 0; line-height: 2.5;">
  <li style="margin: 12px 0;">✓ Quản lý thông tin khách hàng</li>
  <li style="margin: 12px 0;">✓ Quản lý đơn hàng</li>
  <li style="margin: 12px 0;">✓ Thống kê thành tích</li>
  <li style="margin: 12px 0;">✓ Phân tích dữ liệu</li>
  <li style="margin: 12px 0;">✓ Hợp tác nhóm</li>
</ul>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>2.2</strong> Hệ thống bảo lưu quyền sửa đổi hoặc ngừng dịch vụ bất cứ lúc nào mà không cần thông báo cho người dùng.
</p>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">III. Quyền và nghĩa vụ của người dùng</h3>

<p style="color: #606266; margin: 25px 0; padding-left: 15px;">
  <strong style="font-size: 17px; color: #333;">3.1 Quyền của người dùng:</strong>
</p>

<ul style="color: #606266; padding-left: 50px; margin: 20px 0; line-height: 2.5;">
  <li style="margin: 12px 0;">✓ Sử dụng các chức năng do Hệ thống cung cấp</li>
  <li style="margin: 12px 0;">✓ Quản lý dữ liệu khách hàng của mình</li>
  <li style="margin: 12px 0;">✓ Xem báo cáo thống kê thành tích</li>
  <li style="margin: 12px 0;">✓ Nhận dịch vụ hỗ trợ kỹ thuật</li>
</ul>

<p style="color: #606266; margin: 25px 0; padding-left: 15px;">
  <strong style="font-size: 17px; color: #333;">3.2 Nghĩa vụ của người dùng:</strong>
</p>

<ul style="color: #606266; padding-left: 50px; margin: 20px 0; line-height: 2.5;">
  <li style="margin: 15px 0; padding: 15px; background: #fff3f3; border-left: 4px solid #f56c6c; border-radius: 4px;">
    <strong style="color: #f56c6c; font-size: 16px;">⚠️ Nghiêm cấm sử dụng Hệ thống cho bất kỳ hoạt động phạm pháp nào, bao gồm nhưng không giới hạn: lừa đảo, rửa tiền, đa cấp, v.v.</strong>
  </li>
  <li style="margin: 12px 0;">• Tuân thủ pháp luật quốc gia và đạo đức xã hội</li>
  <li style="margin: 12px 0;">• Không được sử dụng Hệ thống để xâm phạm quyền và lợi ích hợp pháp của người khác</li>
  <li style="margin: 12px 0;">• Bảo quản cẩn thận tên đăng nhập và mật khẩu, chịu trách nhiệm về mọi hành vi dưới tài khoản của mình</li>
  <li style="margin: 12px 0;">• Không được tấn công hoặc phá hoại Hệ thống</li>
  <li style="margin: 12px 0;">• Không được tiết lộ thông tin riêng tư của khách hàng</li>
  <li style="margin: 12px 0;">• Không được phát tán thông tin sai sự thật hoặc thực hiện hành vi lừa đảo</li>
</ul>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">IV. Tuyên bố miễn trừ trách nhiệm</h3>

<p style="color: #f56c6c; font-weight: bold; margin: 25px 0; padding: 20px; background: #fff3f3; border-left: 5px solid #f56c6c; border-radius: 8px; font-size: 16px;">
  <strong>⚠️ Lưu ý quan trọng:</strong> Hệ thống chỉ cung cấp dịch vụ như một công cụ, <strong>không chịu trách nhiệm về nội dung, hành vi và hậu quả do người dùng sử dụng Hệ thống tạo ra</strong>.
</p>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>4.2</strong> Hệ thống không chịu trách nhiệm về các tổn thất do các nguyên nhân sau:
</p>

<ul style="color: #606266; padding-left: 50px; margin: 20px 0; line-height: 2.5;">
  <li style="margin: 12px 0;">• Người dùng sử dụng Hệ thống vi phạm pháp luật</li>
  <li style="margin: 12px 0;">• Người dùng sử dụng Hệ thống để thực hiện các hoạt động phạm pháp như lừa đảo, gian lận</li>
  <li style="margin: 12px 0;">• Các yếu tố bất khả kháng (thiên tai, chiến tranh, hành vi của chính phủ, v.v.)</li>
  <li style="margin: 12px 0;">• Sự cố mạng, sự cố thiết bị</li>
  <li style="margin: 12px 0;">• Người dùng thao tác không đúng hoặc nhầm lẫn</li>
  <li style="margin: 12px 0;">• Hành vi xâm phạm của bên thứ ba</li>
  <li style="margin: 12px 0;">• Mất mát hoặc hư hỏng dữ liệu</li>
</ul>

<p style="color: #f56c6c; font-weight: bold; margin: 25px 0; padding: 20px; background: #fff3f3; border-left: 5px solid #f56c6c; border-radius: 8px; font-size: 16px;">
  <strong>4.3</strong> Người dùng phải <strong>chịu toàn bộ trách nhiệm pháp lý</strong> về hành vi sử dụng Hệ thống của mình. Nếu việc người dùng sử dụng Hệ thống vi phạm pháp luật dẫn đến bất kỳ tranh chấp pháp lý hoặc tổn thất nào, người dùng phải tự chịu toàn bộ trách nhiệm và bồi thường các tổn thất mà Hệ thống phải chịu do đó.
</p>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">V. An toàn dữ liệu</h3>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>5.1</strong> Hệ thống áp dụng <strong style="color: #409eff;">các biện pháp an toàn theo tiêu chuẩn ngành</strong> để bảo vệ dữ liệu người dùng.
</p>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>5.2</strong> Người dùng nên thường xuyên sao lưu dữ liệu quan trọng, Hệ thống không chịu trách nhiệm về việc mất dữ liệu.
</p>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>5.3</strong> Hành vi truy cập, sử dụng, sửa đổi hoặc phá hoại dữ liệu Hệ thống mà không được ủy quyền sẽ <strong style="color: #f56c6c;">phải chịu trách nhiệm pháp lý</strong>.
</p>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">VI. Sở hữu trí tuệ</h3>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>6.1</strong> Tất cả nội dung của Hệ thống, bao gồm nhưng không giới hạn: văn bản, hình ảnh, phần mềm, chương trình, v.v., đều được <strong style="color: #409eff;">bảo vệ bởi luật sở hữu trí tuệ</strong>.
</p>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>6.2</strong> Không được phép, người dùng không được sao chép, phát tán, sửa đổi bất kỳ nội dung nào của Hệ thống.
</p>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">VII. Xử lý vi phạm</h3>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>7.1</strong> Nếu phát hiện người dùng vi phạm thỏa thuận này hoặc thực hiện hoạt động phạm pháp, Hệ thống có quyền:
</p>

<ul style="color: #606266; padding-left: 50px; margin: 20px 0; line-height: 2.5;">
  <li style="margin: 12px 0;">• Chấm dứt dịch vụ ngay lập tức</li>
  <li style="margin: 12px 0;">• Xóa nội dung vi phạm</li>
  <li style="margin: 12px 0;">• Đóng băng hoặc hủy tài khoản</li>
  <li style="margin: 12px 0;">• Báo cáo với cơ quan có thẩm quyền</li>
  <li style="margin: 12px 0;">• Truy cứu trách nhiệm pháp lý</li>
</ul>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">VIII. Thay đổi thỏa thuận</h3>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>8.1</strong> Hệ thống có quyền sửa đổi các điều khoản của thỏa thuận này bất cứ lúc nào.
</p>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>8.2</strong> Sau khi thỏa thuận thay đổi, việc tiếp tục sử dụng Hệ thống được coi là chấp nhận thỏa thuận mới.
</p>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">IX. Giải quyết tranh chấp</h3>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>9.1</strong> Việc giải thích, hiệu lực và giải quyết tranh chấp của thỏa thuận này tuân theo <strong style="color: #409eff;">pháp luật Việt Nam</strong>.
</p>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>9.2</strong> Nếu phát sinh tranh chấp, các bên nên giải quyết thông qua thương lượng hữu nghị; nếu thương lượng không thành, có thể khởi kiện tại Tòa án nhân dân nơi Hệ thống đặt trụ sở.
</p>

<h3 style="color: #409eff; margin-top: 45px; margin-bottom: 20px; font-size: 20px; font-weight: 600; padding-left: 15px; border-left: 5px solid #409eff;">X. Các điều khoản khác</h3>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>10.1</strong> Thỏa thuận này có hiệu lực kể từ ngày người dùng nhấp đồng ý.
</p>

<p style="color: #606266; margin: 18px 0; padding-left: 15px;">
  <strong>10.2</strong> Nếu bất kỳ điều khoản nào trong thỏa thuận này vì bất kỳ lý do nào mà hoàn toàn hoặc một phần vô hiệu hoặc không có hiệu lực thi hành, các điều khoản còn lại của thỏa thuận vẫn có hiệu lực và ràng buộc.
</p>

<div style="margin-top: 50px; padding-top: 25px; border-top: 2px dashed #e0e0e0; text-align: center;">
  <p style="color: #909399; font-size: 13px; margin: 0;">Ngày cập nhật cuối: ${new Date().toLocaleDateString('vi-VN')}</p>
</div>
</div>`
}

const getDefaultPrivacyPolicy = () => {
  return `<div style="line-height: 2; padding: 20px;">
<h2 style="color: #303133; border-bottom: 2px solid #409eff; padding-bottom: 10px;">Chính sách bảo mật người dùng</h2>

<p style="color: #606266; margin: 20px 0;">Chính sách bảo mật này (sau đây gọi là "Chính sách") áp dụng cho Hệ thống quản lý khách hàng CRM (sau đây gọi là "Hệ thống"). Chúng tôi rất coi trọng việc bảo vệ quyền riêng tư của người dùng, do đó đã xây dựng Chính sách này.</p>

<h3 style="color: #409eff; margin-top: 30px;">I. Thu thập thông tin</h3>
<p style="color: #606266;"><strong>1.1 Các loại thông tin chúng tôi thu thập:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li><strong>Thông tin tài khoản:</strong> Tên đăng nhập, mật khẩu, email, số điện thoại</li>
  <li><strong>Thông tin cá nhân:</strong> Họ tên, phòng ban, chức vụ, ảnh đại diện</li>
  <li><strong>Thông tin nghiệp vụ:</strong> Dữ liệu khách hàng, thông tin đơn hàng, dữ liệu thành tích, bản ghi cuộc gọi</li>
  <li><strong>Thông tin sử dụng:</strong> Nhật ký đăng nhập, bản ghi thao tác, thời gian truy cập, địa chỉ IP</li>
  <li><strong>Thông tin thiết bị:</strong> Loại trình duyệt, hệ điều hành, model thiết bị</li>
</ul>

<p style="color: #606266;"><strong>1.2 Phương thức thu thập thông tin:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Người dùng chủ động cung cấp</li>
  <li>Hệ thống tự động thu thập</li>
  <li>Bên thứ ba cung cấp hợp pháp</li>
</ul>

<h3 style="color: #409eff; margin-top: 30px;">II. Sử dụng thông tin</h3>
<p style="color: #606266;"><strong>2.1 Chúng tôi sử dụng thông tin đã thu thập để:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Cung cấp dịch vụ và chức năng của hệ thống</li>
  <li>Cải thiện trải nghiệm người dùng</li>
  <li>Thống kê và phân tích dữ liệu</li>
  <li>Giám sát an toàn và phòng ngừa rủi ro</li>
  <li>Hỗ trợ kỹ thuật và dịch vụ khách hàng</li>
  <li>Gửi thông báo hệ thống và tin nhắn quan trọng</li>
</ul>

<p style="color: #606266;"><strong>2.2 Chúng tôi cam kết:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Không sử dụng thông tin người dùng cho các mục đích khác không được nêu trong Chính sách này</li>
  <li>Không bán, cho thuê hoặc chia sẻ thông tin người dùng với bên thứ ba</li>
  <li>Hạn chế nghiêm ngặt quyền truy cập thông tin, chỉ nhân viên được ủy quyền mới có thể truy cập</li>
</ul>

<h3 style="color: #409eff; margin-top: 30px;">III. Lưu trữ thông tin</h3>
<p style="color: #606266;"><strong>3.1 Vị trí lưu trữ:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Dữ liệu người dùng chủ yếu được lưu trữ trong trình duyệt cục bộ (localStorage)</li>
  <li>Một phần dữ liệu có thể được lưu trữ trên máy chủ</li>
  <li>Sử dụng công nghệ mã hóa để bảo vệ thông tin nhạy cảm</li>
</ul>

<p style="color: #606266;"><strong>3.2 Thời hạn lưu trữ:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Lưu trữ liên tục trong thời gian tài khoản tồn tại</li>
  <li>Sau khi hủy tài khoản, dữ liệu sẽ được xóa trong vòng 30 ngày</li>
  <li>Trừ trường hợp pháp luật yêu cầu lưu giữ</li>
</ul>

<h3 style="color: #409eff; margin-top: 30px;">IV. Bảo vệ thông tin</h3>
<p style="color: #606266;"><strong>4.1 Biện pháp an toàn:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Mã hóa truyền tải dữ liệu (HTTPS)</li>
  <li>Mã hóa lưu trữ mật khẩu (mã hóa không thể đảo ngược)</li>
  <li>Kiểm soát quyền truy cập (quản lý quyền vai trò)</li>
  <li>Kiểm toán an toàn định kỳ</li>
  <li>Giám sát và cảnh báo hành vi bất thường</li>
  <li>Cơ chế sao lưu và khôi phục dữ liệu</li>
</ul>

<p style="color: #606266;"><strong>4.2 Cam kết an toàn:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Áp dụng công nghệ và biện pháp quản lý an toàn theo tiêu chuẩn ngành</li>
  <li>Xây dựng hệ thống quản lý an toàn dữ liệu hoàn chỉnh</li>
  <li>Đào tạo an toàn cho nhân viên định kỳ</li>
  <li>Khắc phục kịp thời các lỗ hổng bảo mật được phát hiện</li>
</ul>

<h3 style="color: #409eff; margin-top: 30px;">V. Chia sẻ thông tin</h3>
<p style="color: #f56c6c; font-weight: bold;">5.1 Chúng tôi không chia sẻ thông tin người dùng với bên thứ ba, trừ khi:</p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Được người dùng đồng ý rõ ràng</li>
  <li>Pháp luật yêu cầu rõ ràng</li>
  <li>Cơ quan tư pháp hoặc hành chính yêu cầu theo pháp luật</li>
  <li>Cần thiết để bảo vệ an toàn hệ thống</li>
  <li>Cần thiết để bảo vệ quyền và lợi ích hợp pháp của người dùng</li>
</ul>

<p style="color: #606266;"><strong>5.2 Nguyên tắc chia sẻ:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Nguyên tắc tối thiểu cần thiết</li>
  <li>Nguyên tắc hợp pháp và chính đáng</li>
  <li>Nguyên tắc an toàn và kiểm soát được</li>
</ul>

<h3 style="color: #409eff; margin-top: 30px;">VI. Quyền của người dùng</h3>
<p style="color: #606266;"><strong>6.1 Bạn có các quyền sau:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Truy cập thông tin cá nhân của bạn</li>
  <li>Sửa đổi thông tin không chính xác</li>
  <li>Xóa thông tin cá nhân của bạn</li>
  <li>Rút lại ủy quyền sử dụng thông tin</li>
  <li>Hủy tài khoản của bạn</li>
  <li>Khiếu nại và tố cáo</li>
  <li>Nhận bản sao thông tin cá nhân</li>
</ul>

<p style="color: #606266;"><strong>6.2 Cách thức thực hiện quyền:</strong></p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Tự thao tác thông qua cài đặt hệ thống</li>
  <li>Liên hệ bộ phận hỗ trợ khách hàng để được hỗ trợ</li>
  <li>Gửi email yêu cầu</li>
</ul>

<h3 style="color: #409eff; margin-top: 30px;">VII. Cookie và công nghệ tương tự</h3>
<p style="color: #606266;">7.1 Hệ thống sử dụng công nghệ Cookie và localStorage:</p>
<ul style="color: #606266; padding-left: 30px;">
  <li>Ghi nhớ trạng thái đăng nhập</li>
  <li>Lưu cài đặt ưu tiên của người dùng</li>
  <li>Thống kê dữ liệu truy cập</li>
  <li>Cải thiện trải nghiệm người dùng</li>
</ul>
<p style="color: #606266;">7.2 Bạn có thể quản lý Cookie và localStorage thông qua cài đặt trình duyệt.</p>

<h3 style="color: #409eff; margin-top: 30px;">VIII. Bảo vệ trẻ vị thành niên</h3>
<p style="color: #606266;">8.1 Hệ thống không cung cấp dịch vụ cho trẻ em dưới 18 tuổi.</p>
<p style="color: #606266;">8.2 Nếu phát hiện trẻ vị thành niên sử dụng Hệ thống, chúng tôi sẽ ngừng dịch vụ ngay lập tức và xóa thông tin liên quan.</p>

<h3 style="color: #409eff; margin-top: 30px;">IX. Truyền tải dữ liệu xuyên biên giới</h3>
<p style="color: #606266;">9.1 Dữ liệu của bạn chủ yếu được lưu trữ trong lãnh thổ Việt Nam.</p>
<p style="color: #606266;">9.2 Nếu cần truyền tải xuyên biên giới, chúng tôi sẽ tuân thủ các luật và quy định liên quan, và áp dụng các biện pháp an toàn cần thiết.</p>

<h3 style="color: #409eff; margin-top: 30px;">X. Thay đổi chính sách bảo mật</h3>
<p style="color: #606266;">10.1 Chúng tôi có thể sửa đổi Chính sách này khi thích hợp.</p>
<p style="color: #606266;">10.2 Chính sách đã thay đổi sẽ được công bố trong hệ thống, việc tiếp tục sử dụng được coi là chấp nhận chính sách mới.</p>
<p style="color: #606266;">10.3 Các thay đổi quan trọng sẽ được thông báo cho người dùng thông qua thông báo hệ thống hoặc email.</p>

<h3 style="color: #409eff; margin-top: 30px;">XI. Liên hệ với chúng tôi</h3>
<p style="color: #606266;">Nếu bạn có bất kỳ câu hỏi, ý kiến hoặc đề xuất nào về Chính sách bảo mật này, vui lòng liên hệ với chúng tôi theo các cách sau:</p>
<ul style="color: #606266; padding-left: 30px;">
  <li><strong>Số điện thoại hỗ trợ:</strong>${configStore.systemConfig.contactPhone || '400-xxx-xxxx'}</li>
  <li><strong>Email hỗ trợ:</strong>${configStore.systemConfig.contactEmail || 'service@example.com'}</li>
  <li><strong>Địa chỉ công ty:</strong>${configStore.systemConfig.companyAddress || 'Vui lòng cấu hình trong cài đặt hệ thống'}</li>
</ul>
<p style="color: #606266;">Chúng tôi sẽ trả lời trong vòng 15 ngày làm việc sau khi nhận được phản hồi của bạn.</p>

<p style="color: #909399; margin-top: 30px; font-size: 12px;">Ngày cập nhật cuối: ${new Date().toLocaleDateString('vi-VN')}</p>
</div>`
}

// 显示协议弹窗
const showAgreementDialog = (type: 'user' | 'privacy') => {
  currentAgreementType.value = type

  // 🔥 批次289修复：从localStorage读取协议列表
  const agreementList = JSON.parse(localStorage.getItem('crm_agreement_list') || '[]')

  if (type === 'user') {
    agreementDialogTitle.value = 'Thỏa thuận sử dụng người dùng'
    // Tìm thỏa thuận người dùng
    const userAgreement = agreementList.find((item: unknown) => item.type === 'user')
    agreementDialogContent.value = userAgreement?.content || configStore.systemConfig.userAgreement || getDefaultUserAgreement()
  } else {
    agreementDialogTitle.value = 'Chính sách bảo mật người dùng'
    // Tìm chính sách bảo mật
    const privacyAgreement = agreementList.find((item: unknown) => item.type === 'privacy')
    agreementDialogContent.value = privacyAgreement?.content || configStore.systemConfig.privacyPolicy || getDefaultPrivacyPolicy()
  }

  agreementDialogVisible.value = true
}

// Đồng ý và đóng
const agreeAndClose = () => {
  agreeToTerms.value = true
  agreementDialogVisible.value = false
  ElMessage.success('Cảm ơn bạn đã đồng ý với thỏa thuận của chúng tôi')
}

// 🔥 批次275新增：Khởi tạo cấu hình và trạng thái thỏa thuận
configStore.initConfig()

// Kiểm tra xem đã đồng ý thỏa thuận trước đó chưa (ghi nhớ lựa chọn của người dùng)
const agreedBefore = localStorage.getItem('user_agreed_terms')
if (agreedBefore === 'true') {
  agreeToTerms.value = true
}

// Bộ đếm thời gian chống rung
let loginDebounceTimer: NodeJS.Timeout | null = null

const handleLogin = async () => {
  // 🔥 批次275新增：Xác minh đã chọn đồng ý thỏa thuận
  if (!agreeToTerms.value) {
    ElMessage.warning('Vui lòng đọc và đồng ý 《Thỏa thuận sử dụng người dùng》và 《Chính sách bảo mật người dùng》')
    return
  }

  if (!loginFormRef.value) return

  // Xử lý chống rung: Nếu người dùng nhấp nhanh, xóa bộ đếm thời gian trước đó
  if (loginDebounceTimer) {
    clearTimeout(loginDebounceTimer)
  }

  // Nếu đang đăng nhập, trả về ngay
  if (loading.value) {
    ElMessage.warning('Đang đăng nhập, vui lòng đợi...')
    return
  }

  await loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const result = await userStore.loginWithRetry(
          loginForm.username,
          loginForm.password,
          false, // rememberMe
          3 // Tối đa thử lại 3 lần
        )

        if (result) {
          // 🔥 批次275新增：Ghi nhớ người dùng đã đồng ý thỏa thuận
          localStorage.setItem('user_agreed_terms', 'true')

          ElMessage.success('Đăng nhập thành công')

          // Đợi đồng bộ trạng thái hoàn tất
          await nextTick()

          // 🔥 Sau khi đăng nhập thành công, bắt đầu tải trước dữ liệu ứng dụng ngay lập tức (không chặn chuyển hướng)
          preloadAppData().catch(err => console.warn('[Login] Tải trước dữ liệu thất bại:', err))

          // 【关键修复】Xác nhận token đã được thiết lập
          console.log('[Login] Đăng nhập thành công, kiểm tra trạng thái:')
          console.log('  - token:', userStore.token ? 'Đã thiết lập' : 'Chưa thiết lập')
          console.log('  - isLoggedIn:', userStore.isLoggedIn)
          console.log('  - currentUser:', userStore.currentUser?.name)

          // Kiểm tra xem có cần bắt buộc đổi mật khẩu không
          if (userStore.currentUser?.forcePasswordChange) {
            window.location.href = '/change-password'
          } else {
            // 🔥 Sau khi đăng nhập thành công, sử dụng location.href để chuyển hướng, thực hiện làm mới không dấu vết
            // Điều này đảm bảo tất cả dữ liệu được tải lại từ máy chủ
            window.location.href = '/'
          }
        } else {
          ElMessage.error('Đăng nhập thất bại')
        }
      } catch (error: unknown) {
        console.error('Lỗi đăng nhập:', error)
        // 【关键修复】Kiểm tra xem có thực sự đã đăng nhập thành công không (token đã được thiết lập)
        if (userStore.token && userStore.isLoggedIn) {
          console.log('[Login] Mặc dù có lỗi, nhưng trạng thái đăng nhập đã được thiết lập, thử chuyển hướng')
          ElMessage.success('Đăng nhập thành công')
          // Sử dụng location.href để chuyển hướng, thực hiện làm mới không dấu vết
          window.location.href = '/'
          return
        }
        const errorMessage = error instanceof Error ? error.message : 'Đăng nhập thất bại, vui lòng kiểm tra tên đăng nhập và mật khẩu'
        ElMessage.error(errorMessage)

        // Nếu là lỗi giới hạn tần suất, vô hiệu hóa nút đăng nhập
        if (error instanceof Error && (error.message.includes('频繁') || error.message.includes('429') || error.message === 'RATE_LIMITED')) {
          setTimeout(() => {
            loading.value = false
          }, 30000)
          ElMessage.warning('Thử đăng nhập quá thường xuyên, nút đã bị vô hiệu hóa trong 30 giây')
          return
        }
      } finally {
        // Trong trường hợp bình thường, khôi phục trạng thái nút sau 1 giây, ngăn chặn nhấp lặp lại nhanh
        loginDebounceTimer = setTimeout(() => {
          loading.value = false
        }, 1000)
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* 背景装饰 */
.bg-decoration {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  pointer-events: none;
}

.circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  animation: float 20s infinite ease-in-out;
}

.circle-1 {
  width: 300px;
  height: 300px;
  top: -100px;
  right: -100px;
  animation-delay: 0s;
}

.circle-2 {
  width: 200px;
  height: 200px;
  bottom: -50px;
  left: -50px;
  animation-delay: 5s;
}

.circle-3 {
  width: 150px;
  height: 150px;
  top: 50%;
  left: 10%;
  animation-delay: 10s;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -30px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

/* 登录卡片 */
.login-card {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
  background: white;
  border-radius: 16px;
  padding: 48px 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(10px);
}

/* Logo区域 */
.logo-section {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  display: inline-block;
  margin-bottom: 20px;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

.system-title {
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  letter-spacing: -0.5px;
}

.system-subtitle {
  font-size: 12px;
  color: #999;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 500;
}

/* 表单样式 */
.login-form {
  width: 100%;
}

.login-form :deep(.el-form-item) {
  margin-bottom: 20px;
}

.login-form :deep(.el-input__wrapper) {
  border-radius: 10px;
  padding: 12px 16px;
  box-shadow: 0 0 0 1px #e5e7eb;
  transition: all 0.3s;
  background: #f9fafb;
}

.login-form :deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #d1d5db;
  background: white;
}

.login-form :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #4F46E5;
  background: white;
}

.login-form :deep(.el-input__inner) {
  font-size: 14px;
}

.login-form :deep(.el-input__prefix) {
  color: #9ca3af;
}

/* 协议勾选 */
.agreement-item {
  margin-bottom: 24px !important;
}

.agreement-item :deep(.el-checkbox) {
  height: auto;
  line-height: 1.6;
}

.agreement-item :deep(.el-checkbox__label) {
  white-space: normal;
  line-height: 1.6;
}

.agreement-text {
  font-size: 12px;
  color: #6b7280;
}

.agreement-text a {
  color: #4F46E5;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.agreement-text a:hover {
  color: #7C3AED;
  text-decoration: underline;
}

/* 登录按钮 */
.login-button {
  width: 100%;
  height: 48px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  border: none;
  transition: all 0.3s;
  box-shadow: 0 4px 14px rgba(79, 70, 229, 0.4);
  letter-spacing: 0.5px;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
}

.login-button:active:not(:disabled) {
  transform: translateY(0);
}

.login-button:disabled {
  background: #e5e7eb;
  box-shadow: none;
  cursor: not-allowed;
  opacity: 0.6;
}

/* 底部信息 */
.card-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f3f4f6;
  text-align: center;
}

.card-footer p {
  font-size: 12px;
  color: #9ca3af;
  margin: 0;
}

/* 🔥 批次282优化：协议弹窗美化排版 */
.agreement-dialog :deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
}

.agreement-dialog :deep(.el-dialog__header) {
  padding: 24px 32px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-bottom: none;
}

.agreement-dialog :deep(.el-dialog__title) {
  font-size: 20px;
  font-weight: 600;
  color: #ffffff;
  letter-spacing: 0.5px;
}

.agreement-dialog :deep(.el-dialog__headerbtn .el-dialog__close) {
  color: #ffffff;
  font-size: 20px;
}

.agreement-dialog :deep(.el-dialog__headerbtn .el-dialog__close):hover {
  color: #f0f0f0;
}

.agreement-dialog :deep(.el-dialog__body) {
  padding: 32px;
  max-height: 65vh;
  overflow-y: auto;
  background: #fafbfc;
}

.agreement-dialog :deep(.el-dialog__footer) {
  padding: 20px 32px;
  border-top: 1px solid #e8eaed;
  background: #ffffff;
}

/* 协议内容样式 - 美化排版 */
.agreement-content {
  font-size: 14px;
  line-height: 2;
  color: #333;
  background: #ffffff;
  padding: 28px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

/* 一级标题 */
.agreement-content :deep(h2) {
  margin: 0 0 24px 0;
  padding-bottom: 16px;
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  border-bottom: 3px solid #667eea;
  letter-spacing: 1px;
  text-align: center;
}

/* 二级标题 */
.agreement-content :deep(h3) {
  margin: 32px 0 16px 0;
  padding-left: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #667eea;
  border-left: 4px solid #667eea;
  background: linear-gradient(90deg, rgba(102, 126, 234, 0.08) 0%, transparent 100%);
  padding: 10px 16px;
  border-radius: 4px;
}

/* 段落 */
.agreement-content :deep(p) {
  margin: 16px 0;
  padding: 0 8px;
  color: #4a5568;
  text-align: justify;
  text-indent: 2em;
}

/* 无缩进段落（用于小标题后的说明） */
.agreement-content :deep(p strong) {
  color: #2d3748;
  font-weight: 600;
}

/* 列表 */
.agreement-content :deep(ul) {
  margin: 16px 0;
  padding-left: 40px;
  list-style: none;
}

.agreement-content :deep(ul li) {
  margin: 12px 0;
  padding-left: 24px;
  color: #4a5568;
  position: relative;
  line-height: 1.8;
}

.agreement-content :deep(ul li)::before {
  content: "▸";
  position: absolute;
  left: 0;
  color: #667eea;
  font-weight: bold;
  font-size: 16px;
}

/* 嵌套列表 */
.agreement-content :deep(ul ul) {
  margin: 8px 0;
  padding-left: 24px;
}

.agreement-content :deep(ul ul li)::before {
  content: "◦";
  font-size: 14px;
}

/* 重要提示 - 红色加粗 */
.agreement-content :deep(p[style*="color: #f56c6c"]),
.agreement-content :deep(p[style*="color:#f56c6c"]) {
  background: linear-gradient(90deg, rgba(245, 108, 108, 0.1) 0%, transparent 100%);
  padding: 12px 16px;
  border-left: 4px solid #f56c6c;
  border-radius: 4px;
  margin: 20px 0;
  text-indent: 0;
}

/* 底部信息 */
.agreement-content :deep(p[style*="color: #909399"]),
.agreement-content :deep(p[style*="color:#909399"]) {
  text-align: center;
  font-size: 12px;
  color: #909399;
  margin-top: 32px;
  padding-top: 20px;
  border-top: 1px dashed #e0e0e0;
  text-indent: 0;
}

/* 滚动条美化 */
.agreement-dialog :deep(.el-dialog__body)::-webkit-scrollbar {
  width: 8px;
}

.agreement-dialog :deep(.el-dialog__body)::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.agreement-dialog :deep(.el-dialog__body)::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.agreement-dialog :deep(.el-dialog__body)::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-card {
    padding: 40px 32px;
    max-width: 100%;
  }

  .system-title {
    font-size: 22px;
  }
}

@media (max-width: 480px) {
  .login-container {
    padding: 16px;
  }

  .login-card {
    padding: 32px 24px;
    border-radius: 12px;
  }

  .system-title {
    font-size: 20px;
  }

  .system-subtitle {
    font-size: 11px;
  }

  .login-button {
    height: 44px;
    font-size: 14px;
  }
}
</style>
