package com.itstudy.common;

/** 契约中约定的错误码常量。 */
public final class ErrorCodes {

    public static final String UNAUTHORIZED = "UNAUTHORIZED";
    public static final String FORBIDDEN = "FORBIDDEN";
    public static final String NOT_FOUND = "NOT_FOUND";
    public static final String VALIDATION_ERROR = "VALIDATION_ERROR";
    public static final String DUPLICATE_ANSWER = "DUPLICATE_ANSWER";
    public static final String DUPLICATE_FAVORITE = "DUPLICATE_FAVORITE";
    public static final String POINTS_NOT_ENOUGH = "POINTS_NOT_ENOUGH";
    public static final String ALREADY_EXCHANGED = "ALREADY_EXCHANGED";
    public static final String NOT_EXCHANGED = "NOT_EXCHANGED";
    public static final String ALREADY_ACCEPTED = "ALREADY_ACCEPTED";
    public static final String DUPLICATE_USERNAME = "DUPLICATE_USERNAME";
    public static final String CANNOT_ANSWER_OWN_QUESTION = "CANNOT_ANSWER_OWN_QUESTION";
    public static final String INTERNAL_ERROR = "INTERNAL_ERROR";

    private ErrorCodes() {
    }
}
