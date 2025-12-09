import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from './errorHandler';

/**
 * Middleware xác thực yêu cầu
 */
export const validate = (schema: {
  body?: Joi.ObjectSchema;
  query?: Joi.ObjectSchema;
  params?: Joi.ObjectSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const errors: any = {};

    // Xác thực thân yêu cầu
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        errors.body = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      } else {
        req.body = value;
      }
    }

    // Xác thực tham số truy vấn
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        errors.query = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      } else {
        req.query = value;
      }
    }

    // Xác thực tham số đường dẫn
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, {
        abortEarly: false,
        allowUnknown: false,
        stripUnknown: true
      });

      if (error) {
        errors.params = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          value: detail.context?.value
        }));
      } else {
        req.params = value;
      }
    }

    // Nếu có lỗi xác thực, ném ngoại lệ
    if (Object.keys(errors).length > 0) {
      throw new ValidationError('Xác thực dữ liệu yêu cầu thất bại', errors);
    }

    next();
  };
};

// Các quy tắc xác thực thường dùng
export const commonValidations = {
  // Xác thực ID
  id: Joi.number().integer().positive().required().messages({
    'number.base': 'ID phải là số',
    'number.integer': 'ID phải là số nguyên',
    'number.positive': 'ID phải là số dương',
    'any.required': 'ID là bắt buộc'
  }),

  // Xác thực ID tùy chọn
  optionalId: Joi.number().integer().positive().optional().messages({
    'number.base': 'ID phải là số',
    'number.integer': 'ID phải là số nguyên',
    'number.positive': 'ID phải là số dương'
  }),

  // Xác thực phân trang
  pagination: {
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Số trang phải là số',
      'number.integer': 'Số trang phải là số nguyên',
      'number.min': 'Số trang phải lớn hơn 0'
    }),
    limit: Joi.number().integer().min(1).max(100).default(20).messages({
      'number.base': 'Số lượng mỗi trang phải là số',
      'number.integer': 'Số lượng mỗi trang phải là số nguyên',
      'number.min': 'Số lượng mỗi trang phải lớn hơn 0',
      'number.max': 'Số lượng mỗi trang không được vượt quá 100'
    })
  },

  // Xác thực tên người dùng
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.base': 'Tên người dùng phải là chuỗi',
    'string.alphanum': 'Tên người dùng chỉ được chứa chữ cái và số',
    'string.min': 'Tên người dùng tối thiểu 3 ký tự',
    'string.max': 'Tên người dùng tối đa 30 ký tự',
    'any.required': 'Tên người dùng là bắt buộc'
  }),

  // Xác thực mật khẩu
  password: Joi.string().min(6).max(128).required().messages({
    'string.base': 'Mật khẩu phải là chuỗi',
    'string.min': 'Mật khẩu tối thiểu 6 ký tự',
    'string.max': 'Mật khẩu tối đa 128 ký tự',
    'any.required': 'Mật khẩu là bắt buộc'
  }),

  // Xác thực email
  email: Joi.string().email().max(100).required().messages({
    'string.base': 'Email phải là chuỗi',
    'string.email': 'Định dạng email không đúng',
    'string.max': 'Email tối đa 100 ký tự',
    'any.required': 'Email là bắt buộc'
  }),

  // Xác thực email tùy chọn
  optionalEmail: Joi.string().email().max(100).optional().allow('').messages({
    'string.base': 'Email phải là chuỗi',
    'string.email': 'Định dạng email không đúng',
    'string.max': 'Email tối đa 100 ký tự'
  }),

  // Xác thực số điện thoại
  phone: Joi.string().pattern(/^1[3-9]\d{9}$/).messages({
    'string.base': 'Số điện thoại phải là chuỗi',
    'string.pattern.base': 'Định dạng số điện thoại không đúng'
  }),

  // Xác thực trạng thái
  status: (values: string[]) => Joi.string().valid(...values).messages({
    'any.only': `Trạng thái phải là một trong các giá trị sau: ${values.join(', ')}`
  }),

  // Xác thực ngày tháng
  date: Joi.date().iso().messages({
    'date.base': 'Định dạng ngày tháng không đúng',
    'date.format': 'Ngày tháng phải ở định dạng ISO'
  }),

  // Xác thực ngày tháng tùy chọn
  optionalDate: Joi.date().iso().optional().allow(null).messages({
    'date.base': 'Định dạng ngày tháng không đúng',
    'date.format': 'Ngày tháng phải ở định dạng ISO'
  }),

  // Xác thực số tiền
  amount: Joi.number().precision(2).min(0).messages({
    'number.base': 'Số tiền phải là số',
    'number.precision': 'Số tiền tối đa 2 chữ số thập phân',
    'number.min': 'Số tiền không được âm'
  }),

  // Xác thực số lượng
  quantity: Joi.number().integer().min(1).messages({
    'number.base': 'Số lượng phải là số',
    'number.integer': 'Số lượng phải là số nguyên',
    'number.min': 'Số lượng phải lớn hơn 0'
  })
};
