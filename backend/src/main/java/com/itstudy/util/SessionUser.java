package com.itstudy.util;

import com.itstudy.common.BizException;
import jakarta.servlet.http.HttpSession;

/** Session 中的登录会员读取工具。 */
public final class SessionUser {

    public static final String SESSION_KEY = "userId";

    private SessionUser() {
    }

    public static Long currentId(HttpSession session) {
        if (session == null) {
            return null;
        }
        Object value = session.getAttribute(SESSION_KEY);
        if (value instanceof Long id) {
            return id;
        }
        if (value instanceof Number number) {
            return number.longValue();
        }
        return null;
    }

    public static Long requireId(HttpSession session) {
        Long id = currentId(session);
        if (id == null) {
            throw BizException.unauthorized();
        }
        return id;
    }
}
