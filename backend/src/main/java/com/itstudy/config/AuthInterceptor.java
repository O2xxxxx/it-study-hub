package com.itstudy.config;

import com.itstudy.common.BizException;
import com.itstudy.common.RequireLogin;
import com.itstudy.util.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * 登录态拦截器：把 SESSION.userId 解析到 request attribute，并拦截 @RequireLogin 接口。
 */
@Component
public class AuthInterceptor implements HandlerInterceptor {

    public static final String CURRENT_USER_ID = "currentUserId";

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        Long userId = SessionUser.currentId(request.getSession(false));
        if (userId != null) {
            request.setAttribute(CURRENT_USER_ID, userId);
        }
        if (handler instanceof HandlerMethod handlerMethod) {
            RequireLogin requireLogin = handlerMethod.getMethodAnnotation(RequireLogin.class);
            if (requireLogin == null) {
                requireLogin = handlerMethod.getBeanType().getAnnotation(RequireLogin.class);
            }
            if (requireLogin != null && userId == null) {
                throw BizException.unauthorized();
            }
        }
        return true;
    }
}
