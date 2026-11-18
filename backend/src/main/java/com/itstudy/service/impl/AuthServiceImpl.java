package com.itstudy.service.impl;

import com.itstudy.common.BizException;
import com.itstudy.common.ErrorCodes;
import com.itstudy.dto.AuthMe;
import com.itstudy.dto.LoginForm;
import com.itstudy.dto.RegisterForm;
import com.itstudy.dto.UserView;
import com.itstudy.entity.AppUser;
import com.itstudy.mapper.AppUserMapper;
import com.itstudy.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Service
public class AuthServiceImpl implements AuthService {

    private final AppUserMapper appUserMapper;
    private final PasswordEncoder passwordEncoder;

    public AuthServiceImpl(AppUserMapper appUserMapper, PasswordEncoder passwordEncoder) {
        this.appUserMapper = appUserMapper;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public UserView register(RegisterForm form) {
        String username = form.getUsername() == null ? "" : form.getUsername().trim();
        if (appUserMapper.selectByUsername(username) != null) {
            throw new BizException(ErrorCodes.DUPLICATE_USERNAME, HttpStatus.CONFLICT, "用户名已被占用");
        }
        AppUser user = new AppUser();
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(form.getPassword()));
        user.setNickname(form.getNickname().trim());
        user.setAvatarHue(Math.floorMod(username.hashCode(), 360));
        user.setPoints(0);
        LocalDateTime now = LocalDateTime.now();
        user.setCreatedAt(now);
        user.setUpdatedAt(now);
        appUserMapper.insert(user);
        return toView(user);
    }

    @Override
    public UserView login(LoginForm form) {
        AppUser user = appUserMapper.selectByUsername(form.getUsername() == null ? "" : form.getUsername().trim());
        if (user == null || !passwordEncoder.matches(form.getPassword(), user.getPasswordHash())) {
            throw BizException.unauthorized("用户名或密码错误");
        }
        return toView(user);
    }

    @Override
    public AuthMe me(Long userId) {
        if (userId == null) {
            return AuthMe.anonymous();
        }
        AppUser user = appUserMapper.selectById(userId);
        if (user == null) {
            return AuthMe.anonymous();
        }
        return AuthMe.of(toView(user));
    }

    @Override
    public UserView requireUser(Long userId) {
        if (userId == null) {
            throw BizException.unauthorized();
        }
        AppUser user = appUserMapper.selectById(userId);
        if (user == null) {
            throw BizException.unauthorized();
        }
        return toView(user);
    }

    private UserView toView(AppUser user) {
        UserView view = new UserView();
        view.setId(user.getId());
        view.setUsername(user.getUsername());
        view.setNickname(user.getNickname());
        view.setAvatarHue(user.getAvatarHue());
        view.setPoints(user.getPoints());
        view.setCreatedAt(user.getCreatedAt());
        return view;
    }
}
