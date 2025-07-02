cmake_minimum_required(VERSION 3.4.1)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# 添加预处理器定义
add_definitions(-DANDROID)

# 创建原生库
add_library(whisper_android SHARED
    whisper_android.cpp
    )

# 查找预构建的库
find_library(log-lib log)
find_library(android-lib android)

# 链接库
target_link_libraries(whisper_android
    ${log-lib}
    ${android-lib}
    )

# 设置编译选项
target_compile_options(whisper_android PRIVATE
    -Wall
    -Wextra
    -O3
    -ffast-math
    )

# 设置包含目录
target_include_directories(whisper_android PRIVATE
    ${CMAKE_CURRENT_SOURCE_DIR}
    ) 