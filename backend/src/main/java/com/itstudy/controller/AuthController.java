package com.itstudy.controller;

import com.itstudy.common.CurrentUser;
import com.itstudy.dto.AuthMe;
import com.itstudy.dto.LoginForm;
import com.itstudy.dto.RegisterForm;
import com.itstudy.dto.UserView;
import com.itstudy.service.AuthService;
import com.itstudy.util.SessionUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterForm form,
                                                        HttpServletRequest request) {
        UserView user = authService.register(form);
        attachSession(request, user.getId());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user", user);
        return ResponseEntity.status(HttpStatus.CREATED).body(body);
    }

    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody LoginForm form, HttpServletRequest request) {
        UserView user = authService.login(form);
        attachSession(request, user.getId());
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("user", user);
        return body;
    }

    @PostMapping("/logout")
    public Map<String, Object> logout(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if (session != null) {
            session.invalidate();
        }
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("authenticated", Boolean.FALSE);
        return body;
    }

    @GetMapping("/me")
    public AuthMe me(@CurrentUser Long userId) {
        return authService.me(userId);
    }

    private void attachSession(HttpServletRequest request, Long userId) {
        HttpSession session = request.getSession(true);
        // 登录/注册成功后更换会话 id，防止会话固定攻击。
        request.changeSessionId();
        session.setAttribute(SessionUser.SESSION_KEY, userId);
    }
}
