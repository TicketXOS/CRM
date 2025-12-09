import jwt, { SignOptions } from 'jsonwebtoken';

export interface JwtPayload {
  userId: string;  // Sửa đổi thành string để khớp với kiểu User.id
  username: string;
  role: string;
  departmentId?: string | null;  // Sửa đổi thành string để khớp với kiểu Department.id
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class JwtConfig {
  private static readonly ACCESS_TOKEN_SECRET: string = process.env.JWT_SECRET || 'your-secret-key';
  private static readonly REFRESH_TOKEN_SECRET: string = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
  private static readonly ACCESS_TOKEN_EXPIRES_IN: string = process.env.JWT_EXPIRES_IN || '7d';
  private static readonly REFRESH_TOKEN_EXPIRES_IN: string = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

  /**
   * Tạo token truy cập
   */
  static generateAccessToken(payload: JwtPayload): string {
    // Sử dụng thời hạn token rất dài để tránh hết hạn thường xuyên
    // Môi trường phát triển: 365 ngày, môi trường sản xuất: sử dụng thời gian cấu hình (mặc định 7 ngày)
    const expiresIn: string = process.env.NODE_ENV === 'development' ? '365d' : this.ACCESS_TOKEN_EXPIRES_IN;

    console.log('[JWT] Tạo token truy cập, thời hạn:', expiresIn, 'Môi trường:', process.env.NODE_ENV);

    return jwt.sign(payload, this.ACCESS_TOKEN_SECRET, {
      expiresIn,
      issuer: 'crm-system',
      audience: 'crm-users'
    } as SignOptions);
  }

  /**
   * Tạo token làm mới
   */
  static generateRefreshToken(payload: JwtPayload): string {
    // Môi trường phát triển sử dụng thời hạn token làm mới dài hơn
    const expiresIn: string = process.env.NODE_ENV === 'development' ? '90d' : this.REFRESH_TOKEN_EXPIRES_IN;

    return jwt.sign(payload, this.REFRESH_TOKEN_SECRET, {
      expiresIn,
      issuer: 'crm-system',
      audience: 'crm-users'
    } as SignOptions);
  }

  /**
   * Tạo cặp token
   */
  static generateTokenPair(payload: JwtPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  /**
   * Xác minh token truy cập
   */
  static verifyAccessToken(token: string): JwtPayload {
    try {
      console.log('[JWT] Bắt đầu xác minh token truy cập');
      console.log('[JWT] 50 ký tự đầu của token:', token.substring(0, 50));
      console.log('[JWT] Khóa bí mật được sử dụng:', this.ACCESS_TOKEN_SECRET.substring(0, 20) + '...');

      const payload = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
        issuer: 'crm-system',
        audience: 'crm-users'
      }) as JwtPayload;

      console.log('[JWT] Xác minh token thành công, ID người dùng:', payload.userId);
      return payload;
    } catch (error) {
      console.error('[JWT] Xác minh token thất bại:', error);
      if (error instanceof Error) {
        console.error('[JWT] Chi tiết lỗi:', error.message);
      }
      throw new Error('Token truy cập không hợp lệ: ' + (error instanceof Error ? error.message : 'Lỗi không xác định'));
    }
  }

  /**
   * Xác minh token làm mới
   */
  static verifyRefreshToken(token: string): JwtPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
        issuer: 'crm-system',
        audience: 'crm-users'
      }) as JwtPayload;
    } catch (_error) {
      throw new Error('Token làm mới không hợp lệ');
    }
  }

  /**
   * Giải mã token (không xác minh)
   */
  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch (_error) {
      return null;
    }
  }

  /**
   * Kiểm tra token có sắp hết hạn không (trong vòng 30 phút)
   */
  static isTokenExpiringSoon(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;

      const expirationTime = decoded.exp * 1000; // Chuyển đổi sang mili giây
      const currentTime = Date.now();
      const thirtyMinutes = 30 * 60 * 1000; // 30 phút

      return (expirationTime - currentTime) < thirtyMinutes;
    } catch (_error) {
      return true;
    }
  }
}
