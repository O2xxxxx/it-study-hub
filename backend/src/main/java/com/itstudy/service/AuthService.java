package com.itstudy.service;

import com.itstudy.dto.AuthMe;
import com.itstudy.dto.LoginForm;
import com.itstudy.dto.RegisterForm;
import com.itstudy.dto.UserView;

public interface AuthService {

    UserView register(RegisterForm form);

    UserView login(LoginForm form);

    AuthMe me(Long userId);

    UserView requireUser(Long userId);
}
