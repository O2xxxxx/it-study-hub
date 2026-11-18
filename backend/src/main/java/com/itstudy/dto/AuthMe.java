package com.itstudy.dto;

import lombok.Data;

@Data
public class AuthMe {

    private Boolean authenticated;
    private UserView user;

    public static AuthMe anonymous() {
        AuthMe me = new AuthMe();
        me.setAuthenticated(Boolean.FALSE);
        return me;
    }

    public static AuthMe of(UserView user) {
        AuthMe me = new AuthMe();
        me.setAuthenticated(Boolean.TRUE);
        me.setUser(user);
        return me;
    }
}
