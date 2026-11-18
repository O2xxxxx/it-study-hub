package com.itstudy.common;

import org.springframework.http.HttpStatus;

import java.util.Map;

/**
 * 业务异常：携带契约中的 code / HTTP status / message / details。
 */
public class BizException extends RuntimeException {

    private final String code;
    private final HttpStatus status;
    private final Map<String, Object> details;

    public BizException(String code, HttpStatus status, String message) {
        this(code, status, message, null);
    }

    public BizException(String code, HttpStatus status, String message, Map<String, Object> details) {
        super(message);
        this.code = code;
        this.status = status;
        this.details = details;
    }

    public String getCode() {
        return code;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public Map<String, Object> getDetails() {
        return details;
    }

    public static BizException unauthorized() {
        return new BizException(ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, "请先登录");
    }

    public static BizException unauthorized(String message) {
        return new BizException(ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED, message);
    }

    public static BizException forbidden(String message) {
        return new BizException(ErrorCodes.FORBIDDEN, HttpStatus.FORBIDDEN, message);
    }

    public static BizException notFound(String message) {
        return new BizException(ErrorCodes.NOT_FOUND, HttpStatus.NOT_FOUND, message);
    }

    public static BizException validation(String message) {
        return new BizException(ErrorCodes.VALIDATION_ERROR, HttpStatus.BAD_REQUEST, message);
    }

    public static BizException conflict(String code, String message) {
        return new BizException(code, HttpStatus.CONFLICT, message);
    }
}
