cmake_minimum_required(VERSION 3.16)
project(DronePilotHPC CXX)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -Wall -Wextra")

# 1. Native C++ Static Library & Executable
add_library(drone_physics_core STATIC
    drone_physics.cpp
)

target_include_directories(drone_physics_core PUBLIC ${CMAKE_CURRENT_SOURCE_DIR})

# 2. Emscripten WebAssembly (WASM) Target for WebGL Browser Integration
if(EMSCRIPTEN)
    message(STATUS "Configuring Emscripten WebAssembly (WASM) build target...")
    add_executable(drone_physics_wasm
        drone_physics.cpp
    )
    set_target_properties(drone_physics_wasm PROPERTIES
        OUTPUT_NAME "drone_physics"
        SUFFIX ".js"
        LINK_FLAGS "-O3 --bind -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s MODULARIZE=1 -s 'EXPORT_NAME=\"createDronePhysicsModule\"'"
    )
endif()
