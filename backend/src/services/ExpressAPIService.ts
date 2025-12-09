import axios, { AxiosResponse } from 'axios';
import crypto from 'crypto';
import { logger } from '../config/logger';

export interface ExpressTraceItem {
  time: string;
  location?: string;
  description: string;
  status?: string;
  operator?: string;
  phone?: string;
}

export interface ExpressQueryResult {
  success: boolean;
  trackingNo: string;
  companyCode: string;
  companyName: string;
  status: string;
  statusDescription: string;
  currentLocation?: string;
  traces: ExpressTraceItem[];
  rawData?: any;
  error?: string;
}

export interface ExpressCompany {
  code: string;
  name: string;
  phone?: string;
  website?: string;
}

export class ExpressAPIService {
  private static instance: ExpressAPIService;
  private readonly timeout: number;
  private readonly kuaidi100Config: {
    customer: string;
    key: string;
    url: string;
  };
  private readonly kdniaoConfig: {
    customerId: string;
    apiKey: string;
    url: string;
  };

  // Danh sách công ty vận chuyển được hỗ trợ
  private readonly supportedCompanies: ExpressCompany[] = [
    { code: 'shentong', name: 'Shentong Express', phone: '95543' },
    { code: 'ems', name: 'EMS', phone: '11183' },
    { code: 'shunfeng', name: 'SF Express', phone: '95338' },
    { code: 'yuantong', name: 'YTO Express', phone: '95554' },
    { code: 'yunda', name: 'Yunda Express', phone: '95546' },
    { code: 'zhongtong', name: 'ZTO Express', phone: '95311' },
    { code: 'huitongkuaidi', name: 'Best Express', phone: '95320' },
    { code: 'tiantian', name: 'TTK Express', phone: '400-188-8888' },
    { code: 'jingdong', name: 'JD Express', phone: '950616' },
    { code: 'youzhengguonei', name: 'China Post', phone: '11183' },
    { code: 'debangwuliu', name: 'Deppon Express', phone: '95353' },
    { code: 'zhaijisong', name: 'ZJS Express', phone: '400-6789-000' },
    { code: 'kuaijiesudi', name: 'Fast Express', phone: '400-833-3666' }
  ];

  private constructor() {
    this.timeout = parseInt(process.env.EXPRESS_API_TIMEOUT || '10000');

    this.kuaidi100Config = {
      customer: process.env.EXPRESS_API_CUSTOMER || '',
      key: process.env.EXPRESS_API_KEY || '',
      url: process.env.EXPRESS_API_URL || 'https://poll.kuaidi100.com/poll/query.do'
    };

    this.kdniaoConfig = {
      customerId: process.env.KDNIAO_CUSTOMER_ID || '',
      apiKey: process.env.KDNIAO_API_KEY || '',
      url: process.env.KDNIAO_API_URL || 'https://api.kdniao.com/Ebusiness/EbusinessOrderHandle.aspx'
    };
  }

  public static getInstance(): ExpressAPIService {
    if (!ExpressAPIService.instance) {
      ExpressAPIService.instance = new ExpressAPIService();
    }
    return ExpressAPIService.instance;
  }

  /**
   * Truy vấn thông tin logistics
   */
  async queryExpress(trackingNo: string, companyCode: string): Promise<ExpressQueryResult> {
    try {
      // Ưu tiên sử dụng API Kuaidi100
      if (this.kuaidi100Config.customer && this.kuaidi100Config.key) {
        const result = await this.queryByKuaidi100(trackingNo, companyCode);
        if (result.success) {
          return result;
        }
        logger.warn(`Truy vấn Kuaidi100 thất bại, thử API KDNiao: ${result.error}`);
      }

      // API dự phòng KDNiao
      if (this.kdniaoConfig.customerId && this.kdniaoConfig.apiKey) {
        const result = await this.queryByKdniao(trackingNo, companyCode);
        if (result.success) {
          return result;
        }
        logger.warn(`Truy vấn KDNiao thất bại: ${result.error}`);
      }

      // Nếu đều thất bại, trả về dữ liệu mô phỏng
      logger.info(`Truy vấn API thất bại, trả về dữ liệu mô phỏng: ${trackingNo}`);
      return this.generateMockData(trackingNo, companyCode);
    } catch (error) {
      logger.error('Truy vấn thông tin logistics thất bại:', error);
      return this.generateMockData(trackingNo, companyCode, error instanceof Error ? error.message : String(error));
    }
  }

  /**
   * Sử dụng API Kuaidi100 để truy vấn
   */
  private async queryByKuaidi100(trackingNo: string, companyCode: string): Promise<ExpressQueryResult> {
    try {
      const param = {
        com: companyCode,
        num: trackingNo,
        phone: '',
        from: '',
        to: '',
        resultv2: '1'
      };

      const paramStr = JSON.stringify(param);
      const sign = crypto.createHash('md5')
        .update(paramStr + this.kuaidi100Config.key + this.kuaidi100Config.customer)
        .digest('hex')
        .toUpperCase();

      const response: AxiosResponse = await axios.post(
        this.kuaidi100Config.url,
        new URLSearchParams({
          customer: this.kuaidi100Config.customer,
          sign: sign,
          param: paramStr
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'CRM-System/1.0'
          },
          timeout: this.timeout
        }
      );

      if (response.data.returnCode === '200') {
        const data = response.data.data;
        return {
          success: true,
          trackingNo,
          companyCode,
          companyName: this.getCompanyName(companyCode),
          status: this.mapKuaidi100Status(data.state),
          statusDescription: this.getStatusDescription(data.state),
          currentLocation: data.data?.[0]?.context || '',
          traces: data.data?.map((item: any) => ({
            time: item.time,
            location: item.context,
            description: item.context,
            status: data.state,
            operator: '',
            phone: ''
          })) || [],
          rawData: response.data
        };
      } else {
        return {
          success: false,
          trackingNo,
          companyCode,
          companyName: this.getCompanyName(companyCode),
          status: 'unknown',
          statusDescription: 'Truy vấn thất bại',
          traces: [],
          error: response.data.message || 'Gọi API Kuaidi100 thất bại'
        };
      }
    } catch (error) {
      logger.error('Gọi API Kuaidi100 thất bại:', error);
      return {
        success: false,
        trackingNo,
        companyCode,
        companyName: this.getCompanyName(companyCode),
        status: 'unknown',
        statusDescription: 'Truy vấn thất bại',
        traces: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Sử dụng API KDNiao để truy vấn
   */
  private async queryByKdniao(trackingNo: string, companyCode: string): Promise<ExpressQueryResult> {
    try {
      const requestData = JSON.stringify({
        OrderCode: '',
        ShipperCode: companyCode.toUpperCase(),
        LogisticCode: trackingNo
      });

      const dataSign = crypto.createHash('md5')
        .update(requestData + this.kdniaoConfig.apiKey)
        .digest('hex')
        .toUpperCase();

      const response: AxiosResponse = await axios.post(
        this.kdniaoConfig.url,
        new URLSearchParams({
          RequestData: requestData,
          EBusinessID: this.kdniaoConfig.customerId,
          RequestType: '1002',
          DataSign: dataSign,
          DataType: '2'
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'User-Agent': 'CRM-System/1.0'
          },
          timeout: this.timeout
        }
      );

      if (response.data.Success) {
        const data = response.data;
        return {
          success: true,
          trackingNo,
          companyCode,
          companyName: this.getCompanyName(companyCode),
          status: this.mapKdniaoStatus(data.State),
          statusDescription: this.getKdniaoStatusDescription(data.State),
          currentLocation: data.Traces?.[0]?.AcceptStation || '',
          traces: data.Traces?.map((item: any) => ({
            time: item.AcceptTime,
            location: item.AcceptStation,
            description: item.AcceptStation,
            status: data.State,
            operator: '',
            phone: ''
          })) || [],
          rawData: response.data
        };
      } else {
        return {
          success: false,
          trackingNo,
          companyCode,
          companyName: this.getCompanyName(companyCode),
          status: 'unknown',
          statusDescription: 'Truy vấn thất bại',
          traces: [],
          error: response.data.Reason || 'Gọi API KDNiao thất bại'
        };
      }
    } catch (error) {
      logger.error('Gọi API KDNiao thất bại:', error);
      return {
        success: false,
        trackingNo,
        companyCode,
        companyName: this.getCompanyName(companyCode),
        status: 'unknown',
        statusDescription: 'Truy vấn thất bại',
        traces: [],
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Tạo dữ liệu mô phỏng
   */
  private generateMockData(trackingNo: string, companyCode: string, error?: string): ExpressQueryResult {
    const now = new Date();
    const traces: ExpressTraceItem[] = [
      {
        time: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        location: 'Thành phố Thâm Quyến',
        description: 'Bưu kiện đã hoàn thành phân loại tại trung tâm phân loại Thâm Quyến, chuẩn bị gửi đến trạm tiếp theo',
        status: 'in_transit',
        operator: 'Nguyễn Văn A',
        phone: '13800138000'
      },
      {
        time: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        location: 'Thành phố Quảng Châu',
        description: 'Bưu kiện đã đến trung tâm vận chuyển Quảng Châu',
        status: 'in_transit',
        operator: 'Trần Văn B',
        phone: '13800138001'
      },
      {
        time: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19),
        location: 'Thành phố Bắc Kinh',
        description: 'Bưu kiện đã đến trung tâm phân loại Bắc Kinh, đang giao hàng',
        status: 'out_for_delivery',
        operator: 'Lê Văn C',
        phone: '13800138002'
      }
    ];

    return {
      success: true,
      trackingNo,
      companyCode,
      companyName: this.getCompanyName(companyCode),
      status: 'out_for_delivery',
      statusDescription: 'Đang giao hàng (dữ liệu mô phỏng)',
      currentLocation: 'Thành phố Bắc Kinh',
      traces,
      error: error ? `Gọi API thất bại, sử dụng dữ liệu mô phỏng: ${error}` : 'Sử dụng dữ liệu mô phỏng'
    };
  }

  /**
   * Ánh xạ trạng thái Kuaidi100
   */
  private mapKuaidi100Status(state: string): string {
    const statusMap: Record<string, string> = {
      '0': 'in_transit',      // Đang vận chuyển
      '1': 'picked_up',       // Đã nhận hàng
      '2': 'exception',       // Vấn đề
      '3': 'delivered',       // Đã ký nhận
      '4': 'returned',        // Từ chối nhận
      '5': 'out_for_delivery', // Đang giao hàng
      '6': 'returned'         // Đã trả lại
    };
    return statusMap[state] || 'pending';
  }

  /**
   * Ánh xạ trạng thái KDNiao
   */
  private mapKdniaoStatus(state: string): string {
    const statusMap: Record<string, string> = {
      '2': 'in_transit',      // Đang vận chuyển
      '3': 'delivered',       // Đã ký nhận
      '4': 'exception'        // Vấn đề
    };
    return statusMap[state] || 'pending';
  }

  /**
   * Lấy mô tả trạng thái
   */
  private getStatusDescription(state: string): string {
    const descriptions: Record<string, string> = {
      '0': 'Đang vận chuyển',
      '1': 'Đã nhận hàng',
      '2': 'Bưu kiện bất thường',
      '3': 'Đã ký nhận',
      '4': 'Từ chối nhận',
      '5': 'Đang giao hàng',
      '6': 'Đã trả lại'
    };
    return descriptions[state] || 'Chờ phát hàng';
  }

  /**
   * Lấy mô tả trạng thái KDNiao
   */
  private getKdniaoStatusDescription(state: string): string {
    const descriptions: Record<string, string> = {
      '2': 'Đang vận chuyển',
      '3': 'Đã ký nhận',
      '4': 'Vấn đề'
    };
    return descriptions[state] || 'Chờ phát hàng';
  }

  /**
   * Lấy tên công ty vận chuyển
   */
  public getCompanyName(companyCode: string): string {
    const company = this.supportedCompanies.find(c => c.code === companyCode);
    return company?.name || companyCode;
  }

  /**
   * Lấy danh sách công ty vận chuyển được hỗ trợ
   */
  public getSupportedCompanies(): ExpressCompany[] {
    return this.supportedCompanies;
  }

  /**
   * Kiểm tra xem cấu hình API có hiệu lực không
   */
  public isConfigured(): boolean {
    return !!(
      (this.kuaidi100Config.customer && this.kuaidi100Config.key) ||
      (this.kdniaoConfig.customerId && this.kdniaoConfig.apiKey)
    );
  }

  /**
   * Lấy trạng thái cấu hình
   */
  public getConfigStatus(): {
    kuaidi100: boolean;
    kdniao: boolean;
    configured: boolean;
  } {
    return {
      kuaidi100: !!(this.kuaidi100Config.customer && this.kuaidi100Config.key),
      kdniao: !!(this.kdniaoConfig.customerId && this.kdniaoConfig.apiKey),
      configured: this.isConfigured()
    };
  }
}
