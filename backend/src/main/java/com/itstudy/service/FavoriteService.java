package com.itstudy.service;

import com.itstudy.dto.FavoriteGroups;
import com.itstudy.dto.FavoriteToggleForm;
import com.itstudy.dto.FavoriteToggleResult;

public interface FavoriteService {

    FavoriteGroups groups(Long userId, String type);

    FavoriteToggleResult toggle(Long userId, FavoriteToggleForm form);
}
